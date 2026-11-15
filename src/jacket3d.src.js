/* The 3D explorer jacket. Source for jacket3d.js (built with esbuild, see README).
   The model is img/jacket.glb, exported from src/jacket.blend. Every patch the child has
   earned is stuck on it; a new one flies in and gets "stamped" on with a little burst.
   Chapters 1–6 go on the front, 7–8 on the sleeves, 9–13 on the back, so the jacket turns.
   It is only a picture: the patch cards under it stay the real, tappable list. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, Group, Color, HemisphereLight, DirectionalLight,
  Mesh, MeshStandardMaterial, MeshBasicMaterial, CylinderGeometry, CircleGeometry, RingGeometry, SphereGeometry,
  CanvasTexture, SRGBColorSpace, Vector3, MathUtils, DoubleSide
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/* Where each patch goes: x, y (up), side, size and a small tilt, in the jacket's own space.
   Front and sleeve spots are the designer's, from the Blender file. */
const FRONT_Z = 0.226, SLEEVE_Z = 0.202;
const SLOTS = [
  { x: -0.27, y: 1.06, side: "front", size: 0.236, roll: 0.10 },
  { x: 0.27, y: 1.06, side: "front", size: 0.236, roll: -0.09 },
  { x: -0.27, y: 0.74, side: "front", size: 0.236, roll: -0.07 },
  { x: 0.27, y: 0.74, side: "front", size: 0.236, roll: 0.09 },
  { x: -0.27, y: 0.50, side: "front", size: 0.236, roll: 0.05 },
  { x: 0.27, y: 0.50, side: "front", size: 0.236, roll: -0.10 },
  { x: -0.75, y: 0.846, side: "sleeve", size: 0.2, roll: -0.61 },
  { x: 0.75, y: 0.846, side: "sleeve", size: 0.2, roll: 0.61 },
  { x: -0.27, y: 1.06, side: "back", size: 0.236, roll: -0.08 },
  { x: 0.27, y: 1.06, side: "back", size: 0.236, roll: 0.07 },
  { x: 0, y: 0.78, side: "back", size: 0.27, roll: 0.04 },
  { x: -0.27, y: 0.50, side: "back", size: 0.236, roll: 0.09 },
  { x: 0.27, y: 0.50, side: "back", size: 0.236, roll: -0.06 }
];
const CREAM = 0xfff3e3, PEACH = 0xffc78a;
const easeOutBack = t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const easeInCubic = t => t * t * t;
const clamp01 = t => Math.min(1, Math.max(0, t));

let live = null;      // the mounted jacket, if any
let modelCache = null; // the loaded model, kept between visits

function loadModel() {
  if (!modelCache) modelCache = new Promise((ok, fail) => new GLTFLoader().load("img/jacket.glb", g => ok(g.scene), undefined, fail));
  return modelCache.then(scene => scene.clone(true));
}

/* A patch drawing (the app's own SVG) as a texture. */
function patchTexture(svg) {
  return new Promise(ok => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = c.height = 512;
      c.getContext("2d").drawImage(img, 0, 0, 512, 512);
      const t = new CanvasTexture(c); t.colorSpace = SRGBColorSpace; t.anisotropy = 4; ok(t);
    };
    img.onerror = () => ok(null);
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" '));
  });
}

function placeOnSlot(obj, slot, lift = 0) {
  const back = slot.side === "back", z = (slot.side === "sleeve" ? SLEEVE_Z : FRONT_Z) + lift;
  obj.position.set(slot.x, slot.y, back ? -z : z);
  obj.rotation.set(0, back ? Math.PI : 0, back ? -slot.roll : slot.roll);
}

function makePatch(slot, texture) {
  const r = slot.size / 2, g = new Group();
  const rim = new Mesh(new CylinderGeometry(r, r, 0.018, 48), new MeshStandardMaterial({ color: CREAM, roughness: 0.85 }));
  rim.rotation.x = Math.PI / 2;
  const face = new Mesh(new CircleGeometry(r, 48), new MeshStandardMaterial({ map: texture, color: texture ? 0xffffff : CREAM, roughness: 0.85 }));
  face.position.z = 0.0095;
  g.add(rim, face);
  const holder = new Group(); holder.add(g); holder.userData.inner = g;
  placeOnSlot(holder, slot);
  return holder;
}

function makeGhost(slot) {
  const r = slot.size / 2;
  const m = new Mesh(new RingGeometry(r * 0.86, r * 0.96, 40, 1), new MeshBasicMaterial({ color: CREAM, transparent: true, opacity: 0.28, side: DoubleSide }));
  placeOnSlot(m, slot, 0.002);
  return m;
}

/* mount(el, { earned, fresh, patchSvg, reduced, onStuck }):
   earned = patches the child has; fresh = numbers to stick on now with the animation. */
async function mount(el, opts) {
  unmount();
  const me = live = { el, dead: false, raf: 0 };
  let renderer;
  try { renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" }); }
  catch { el.hidden = true; return false; }
  me.renderer = renderer;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%;touch-action:pan-y;cursor:grab";
  el.textContent = ""; el.appendChild(canvas); el.hidden = false;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 30);
  scene.add(new HemisphereLight(0xffffff, 0x3a55d8, 1.25));
  const key = new DirectionalLight(0xffffff, 1.9); key.position.set(-2.2, 3.4, 3.2); scene.add(key);
  const fill = new DirectionalLight(0xbfd0ff, 0.7); fill.position.set(2.6, 1.6, 2.4); scene.add(fill);
  const rimLight = new DirectionalLight(0xffc78a, 0.6); rimLight.position.set(0, 2, -3); scene.add(rimLight);

  const spin = new Group(), jacket = new Group(); spin.add(jacket); scene.add(spin);
  // soft blob shadow under the floating jacket
  const shadow = new Mesh(new CircleGeometry(0.62, 40), new MeshBasicMaterial({ color: 0x0b1a5c, transparent: true, opacity: 0.32 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.12; shadow.scale.set(1, 0.42, 1); scene.add(shadow);
  // little peach planets floating around
  const sparkGeo = new SphereGeometry(1, 16, 12), sparkMat = new MeshStandardMaterial({ color: PEACH, roughness: 0.6 });
  const sparks = [[-1.25, 1.55, 0.2, 0.05], [1.3, 1.35, 0.1, 0.04], [-1.12, 0.3, 0.5, 0.03], [1.2, 0.42, 0.6, 0.035], [0.75, 1.72, 0.2, 0.025], [-0.7, 1.7, -0.3, 0.02]].map(([x, y, z, r], i) => {
    const m = new Mesh(sparkGeo, sparkMat); m.position.set(x, y, z); m.scale.setScalar(r); m.userData = { y, ph: i * 1.3 }; scene.add(m); return m;
  });

  function resize() {
    const w = el.clientWidth || 300, h = el.clientHeight || 300;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // far enough to fit the whole jacket (sleeves included) in a narrow or a wide box
    const halfW = 1.3, halfH = 0.86, tanV = Math.tan(MathUtils.degToRad(15));
    const d = Math.max(halfH / tanV, halfW / (tanV * camera.aspect));
    camera.position.set(0, 0.84, d + 0.3); camera.lookAt(0, 0.78, 0);
    camera.updateProjectionMatrix();
  }
  resize();
  const ro = "ResizeObserver" in window ? new ResizeObserver(resize) : null;
  if (ro) ro.observe(el);
  me.ro = ro;

  let model;
  try { model = await loadModel(); } catch { unmountIf(me); el.hidden = true; return false; }
  if (me.dead) return false;
  jacket.add(model);

  const earned = Math.max(0, Math.min(SLOTS.length, opts.earned | 0));
  const fresh = (opts.fresh || []).filter(n => n >= 1 && n <= earned);
  const textures = await Promise.all(SLOTS.map((_, i) => (i < earned ? patchTexture(opts.patchSvg(i + 1)) : null)));
  if (me.dead) return false;
  const patches = SLOTS.map((slot, i) => {
    if (i >= earned) { jacket.add(makeGhost(slot)); return null; }
    const p = makePatch(slot, textures[i]);
    if (fresh.includes(i + 1) && !opts.reduced) p.visible = false;
    jacket.add(p); return p;
  });
  if (opts.reduced) fresh.forEach(n => opts.onStuck && opts.onStuck(n));

  /* ---- turning: a gentle sway (or a slow full turn once there are patches on the back), and drag to spin ---- */
  const hasBack = earned > 8;
  let yaw = -0.24, vel = 0, dragging = false, lastX = 0, target = null, idleAt = 0;
  canvas.addEventListener("pointerdown", e => { dragging = true; lastX = e.clientX; vel = 0; target = null; canvas.style.cursor = "grabbing"; try { canvas.setPointerCapture(e.pointerId); } catch {} });
  canvas.addEventListener("pointermove", e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; yaw += dx * 0.012; vel = dx * 0.012 * 60; });
  const up = () => { dragging = false; canvas.style.cursor = "grab"; idleAt = performance.now() + 2500; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);

  /* ---- sticking new patches on, one after another ---- */
  const queue = opts.reduced ? [] : fresh.slice();
  let stick = null, bursts = [], squash = 0;
  const burstGeo = new SphereGeometry(1, 8, 6);
  function nextStick(now) {
    const n = queue.shift(); if (!n) { stick = null; return; }
    const slot = SLOTS[n - 1], p = patches[n - 1];
    stick = { n, slot, p, t0: now + 450, done: false };
    target = slot.side === "back" ? Math.PI : slot.side === "sleeve" ? (slot.x < 0 ? 0.35 : -0.35) : 0;
  }
  function burst(slot) {
    const origin = new Vector3(); patches[SLOTS.indexOf(slot)].getWorldPosition(origin);
    const colors = [0xffc78a, 0xfff3e3, 0xff7a1a, 0x7fb0ff];
    for (let i = 0; i < 14; i++) {
      const m = new Mesh(burstGeo, new MeshBasicMaterial({ color: colors[i % 4], transparent: true }));
      const a = (i / 14) * Math.PI * 2, s = 0.9 + Math.random() * 0.9;
      m.position.copy(origin); m.scale.setScalar(0.022 + Math.random() * 0.02);
      m.userData = { v: new Vector3(Math.cos(a) * s, Math.sin(a) * s + 0.4, 0.5 + Math.random()), life: 0 };
      scene.add(m); bursts.push(m);
    }
  }

  let last = performance.now(), started = last;
  if (queue.length) nextStick(last);
  function frame(now) {
    if (me.dead) return;
    me.raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const time = (now - started) / 1000;

    // turning
    if (!dragging) {
      if (target != null) {
        const near = target + Math.round((yaw - target) / (Math.PI * 2)) * Math.PI * 2;
        yaw += (near - yaw) * Math.min(1, dt * 5);
      } else if (Math.abs(vel) > 0.02) { yaw += vel * dt; vel *= Math.pow(0.05, dt); }
      else if (!opts.reduced && now > idleAt) {
        if (hasBack) yaw += dt * 0.55;
        else { const want = Math.sin(time * 0.7) * 0.5; yaw += (want - yaw) * Math.min(1, dt * 1.5); }
      }
    }
    spin.rotation.y = yaw;
    if (!opts.reduced) { spin.position.y = Math.sin(time * 1.4) * 0.03; spin.rotation.z = Math.sin(time * 0.9) * 0.03; spin.rotation.x = -0.07; }
    shadow.scale.x = 1 - Math.sin(time * 1.4) * 0.05;
    sparks.forEach(m => { m.position.y = m.userData.y + Math.sin(time * 1.1 + m.userData.ph) * 0.05; });

    // a new patch flies in, slams on, and pops
    if (stick && now >= stick.t0) {
      const s = stick, inner = s.p.userData.inner, t = (now - s.t0) / 1000;
      s.p.visible = true;
      const fly = clamp01(t / 0.55);
      if (fly < 1) {
        const k = 1 - easeInCubic(fly);
        inner.position.z = k * 1.5; inner.position.y = k * 0.35;
        inner.rotation.z = k * Math.PI * 3; inner.scale.setScalar(1 + k * 1.6);
      } else {
        if (!s.done) { s.done = true; squash = 1; burst(s.slot); opts.onStuck && opts.onStuck(s.n); }
        const pop = clamp01((t - 0.55) / 0.45);
        inner.position.set(0, 0, 0); inner.rotation.z = 0;
        inner.scale.setScalar(0.7 + 0.3 * easeOutBack(pop));
        if (pop >= 1) { inner.scale.setScalar(1); target = null; idleAt = now + 900; nextStick(now); }
      }
    }
    // the jacket squashes a little when a patch lands
    if (squash > 0) { squash = Math.max(0, squash - dt * 3.2); const q = Math.sin(squash * Math.PI) * 0.07; jacket.scale.set(1 + q, 1 - q, 1 + q); }
    for (let i = bursts.length - 1; i >= 0; i--) {
      const m = bursts[i], u = m.userData; u.life += dt;
      u.v.y -= dt * 2.2; m.position.addScaledVector(u.v, dt); m.material.opacity = 1 - u.life / 0.9;
      if (u.life >= 0.9) { scene.remove(m); m.material.dispose(); bursts.splice(i, 1); }
    }
    renderer.render(scene, camera);
  }
  me.raf = requestAnimationFrame(frame);
  me.onVis = () => { if (document.hidden) cancelAnimationFrame(me.raf); else if (!me.dead) { last = performance.now(); me.raf = requestAnimationFrame(frame); } };
  document.addEventListener("visibilitychange", me.onVis);
  me.state = () => ({ yaw, earned, visible: patches.filter(p => p && p.visible).length, sticking: !!stick, queue: queue.length });
  return true;
}

function unmountIf(me) { if (live === me) unmount(); }
function unmount() {
  const me = live; if (!me) return;
  live = null; me.dead = true;
  cancelAnimationFrame(me.raf);
  if (me.onVis) document.removeEventListener("visibilitychange", me.onVis);
  if (me.ro) me.ro.disconnect();
  if (me.renderer) { me.renderer.dispose(); try { me.renderer.forceContextLoss(); } catch {} const c = me.renderer.domElement; if (c && c.parentNode) c.parentNode.removeChild(c); }
}

window.JACKET3D = { mount, unmount, state: () => (live && live.state ? live.state() : null) };
