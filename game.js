/* Planet Patrol: a child picks up trash, Spark (the robot) checks it from a photo,
   and every finished mission opens a story about the machines we left on the Moon and Mars.
   Everything about the player lives on this phone (localStorage): nickname, avatar, log, missions.
   Photos are never saved: they are shrunk, sent once to the scanner, and forgotten. */
(function () {
  "use strict";
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  /* ---------- Saving on this phone (if the browser blocks it, the game still works without saving) ---------- */
  const PREFIX = "planetpatrol.";
  const load = (k, def) => { try { const v = localStorage.getItem(PREFIX + k); return v == null ? def : JSON.parse(v); } catch { return def; } };
  const save = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {} };

  const TRASH_POINTS = 10;
  const AVATARS = ["🧑‍🚀", "👽", "🤖", "🦊", "🐢", "🐙", "🦄", "🐝"];
  const TYPE = { plastic: "Plastic", can: "Can", paper_cardboard: "Paper or cardboard", glass: "Glass", organic: "Food scraps",
    batteries_electronics: "Batteries or electronics", chemicals: "Chemicals", sharp_object: "Something sharp", other: "Trash", none: "Not trash" };
  const BIN = { white: "White bin", green: "Green bin", black: "Black bin", special_dropoff: "Special drop-off", none: "None" };
  const SAYS = { idle: "Hi! I'm Spark. Find some trash and take a photo of it.", think: "Hmm… let me look…",
    yes: "Yes, that's trash! Well done.", no: "That's not trash.", unsure: "I'm not sure. Try another photo.", danger: "Careful! Don't touch it." };

  const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* ---------- State ---------- */
  let profile = load("profile", null);   // { nick, avatar }
  let log = load("log", []);              // [{ date, day, type, points, dangerous }]
  let done = load("done", {});            // { missionId: date }
  let missions = [], stories = [];
  const awardQueue = [];

  /* ---------- Demo mode (?demo in the address): no server, no AI. Spark pretends, and the page says so. ---------- */
  const DEMO = /[?&]demo\b/.test(location.search);
  const DEMO_RESULTS = [
    { photo_problem: "none", is_trash: "yes", type: "plastic", bin: "white", dangerous: false, message: "A plastic bottle! It goes in the white bin." },
    { photo_problem: "none", is_trash: "yes", type: "can", bin: "white", dangerous: false, message: "A can! Great catch, it goes in the white bin." },
    { photo_problem: "none", is_trash: "yes", type: "glass", bin: "special_dropoff", dangerous: true, message: "Don't touch it! That's broken glass. Call an adult." },
    { photo_problem: "none", is_trash: "no", type: "none", bin: "none", dangerous: false, message: "That's a leaf. Leaves aren't trash!" },
    { photo_problem: "none", is_trash: "yes", type: "paper_cardboard", bin: "white", dangerous: false, message: "A paper cup! Into the white bin it goes." },
    { photo_problem: "screen", is_trash: "no", type: "none", bin: "none", dangerous: false, message: "That looks like a screen. Take a photo of the real object, not a screen!" },
    { photo_problem: "none", is_trash: "unsure", type: "other", bin: "black", dangerous: false, message: "Hmm, I'm not sure. Can you take another photo?" }
  ];
  let demoN = 0, demoTotal = 0;
  async function demoScan() {
    await new Promise(r => setTimeout(r, 1300));
    const result = DEMO_RESULTS[demoN++ % DEMO_RESULTS.length];
    const retake = result.photo_problem !== "none", counts = !retake && result.is_trash === "yes";
    return { result, retake, counts, total: counts ? ++demoTotal : null };
  }

  /* ---------- Confetti when a mission is complete ---------- */
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = $("confetti"), colors = ["#FF7A1A", "#FFC93C", "#2FBF71", "#3D8BFF", "#FF7DB0", "#9B6BFF"];
    for (let i = 0; i < 60; i++) {
      const c = el("i");
      c.style.left = Math.random() * 100 + "%";
      c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s";
      c.style.animationDelay = Math.random() * .4 + "s";
      box.appendChild(c);
    }
    setTimeout(() => { box.textContent = ""; }, 3800);
  }

  /* ---------- Robot ---------- */
  function robot(state, text) {
    $("robot").className = "robot r-" + state;
    $("says").textContent = text || SAYS[state];
  }

  /* ---------- Profile: just a nickname and an avatar ---------- */
  function paintProfile() {
    $("pAvatar").textContent = profile ? profile.avatar : "🙂";
    $("pName").textContent = profile ? profile.nick : "Player";
  }
  function openProfile() {
    const box = $("avatars"); box.textContent = "";
    let picked = (profile && profile.avatar) || AVATARS[0];
    AVATARS.forEach(a => {
      const b = el("button", "", a); b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", "Avatar " + a);
      b.setAttribute("aria-checked", String(a === picked));
      b.onclick = () => { picked = a; box.querySelectorAll("button").forEach(x => x.setAttribute("aria-checked", String(x === b))); };
      box.appendChild(b);
    });
    $("nick").value = profile ? profile.nick : "";
    $("profileForm").onsubmit = e => {
      const nick = $("nick").value.replace(/\s+/g, " ").trim().slice(0, 16);
      if (!nick) { e.preventDefault(); $("nick").focus(); return; }
      profile = { nick, avatar: picked }; save("profile", profile); paintProfile();
    };
    $("profile").showModal();
  }
  $("profileBtn").onclick = openProfile;

  /* ---------- Menu ---------- */
  function show(view) {
    document.querySelectorAll(".view").forEach(s => { s.hidden = s.id !== "v-" + view; });
    document.querySelectorAll(".menu button").forEach(b => { b.classList.toggle("on", b.dataset.view === view); b.setAttribute("aria-current", b.dataset.view === view ? "page" : "false"); });
    if (view === "missions") paintMissions();
    if (view === "stories") paintStories();
    if (view === "log") paintLog();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".menu button").forEach(b => { b.onclick = () => show(b.dataset.view); });

  /* ---------- Photo: shrink it (≤ 1024 px, JPEG) on the phone ---------- */
  function shrink(file) {
    return new Promise((ok, fail) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        ok(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("photo")); };
      img.src = url;
    });
  }

  /* ---------- Scan ---------- */
  const snap = $("snap"), file = $("file");
  snap.onclick = () => { if (!profile) { openProfile(); return; } file.click(); };
  file.onchange = async () => {
    const f = file.files && file.files[0];
    file.value = "";
    if (!f) return;
    $("alert").hidden = true; $("result").hidden = true; $("rPoints").textContent = "";
    snap.disabled = true; snap.textContent = "Spark is looking…";
    robot("think");
    try {
      const image = await shrink(f);
      $("photoImg").src = image; $("photo").hidden = false;
      if (DEMO) { showResult(await demoScan()); return; }
      const r = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { robot("no", j.error || "Something went wrong. Try again."); return; }
      showResult(j);
    } catch (e) {
      robot("no", e.message === "photo" ? "I couldn't open that photo. Try another one." : "No connection. Try again.");
    } finally {
      // The photo is only on screen until the next one; it is never saved.
      snap.disabled = false; snap.textContent = "📷 Take another photo";
    }
  };

  function showResult(j) {
    const r = j.result || {};
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (typeof j.total === "number") $("global").textContent = j.total.toLocaleString("en");
    if (j.retake) { robot("unsure", r.message); return; }   // screen, people or blurry: doesn't count
    if (r.dangerous) {
      robot("danger", r.message || SAYS.danger);
      $("alert").hidden = false;
    } else if (r.is_trash === "yes") robot("yes", r.message);
    else if (r.is_trash === "unsure") robot("unsure", r.message);
    else robot("no", r.message);

    $("rType").textContent = TYPE[r.type] || "—";
    const b = $("rBin"); b.textContent = BIN[r.bin] || "—"; b.className = "bin " + (r.bin || "");
    $("result").hidden = false;

    // Points: trash = 10. Dangerous trash too (the child did the right thing by telling an adult).
    const points = j.counts ? TRASH_POINTS : 0;
    log.push({ date: new Date().toISOString(), day: localDay(), type: r.type || "other", points, dangerous: !!r.dangerous });
    if (log.length > 1000) log = log.slice(-1000);
    save("log", log);
    if (points) $("rPoints").textContent = `+${points} points`;
    paintPoints();
    checkMissions();
  }

  /* ---------- Points and missions ---------- */
  const pickedUp = () => log.filter(x => x.points > 0);
  const totalPoints = () => log.reduce((s, x) => s + (x.points || 0), 0);
  function paintPoints() { $("myPoints").textContent = totalPoints(); }

  function progress(m) {
    const goal = m.goal || {};
    const items = pickedUp().filter(x => !goal.type || x.type === goal.type);
    let n = items.length;
    if (goal.period === "day") {
      const perDay = {}; items.forEach(x => { perDay[x.day] = (perDay[x.day] || 0) + 1; });
      n = Math.max(0, ...Object.values(perDay));
    }
    return Math.min(n, goal.count || 1);
  }

  function checkMissions() {
    missions.forEach(m => {
      if (done[m.id]) return;
      if (progress(m) >= (m.goal.count || 1)) { done[m.id] = new Date().toISOString(); awardQueue.push(m); }
    });
    save("done", done);
    nextAward();
  }

  function nextAward() {
    const d = $("award");
    if (d.open || !awardQueue.length) return;
    const m = awardQueue.shift();
    $("awardBadge").textContent = m.badge;
    $("awardText").textContent = `You earned the “${m.title}” badge and opened a space story.`;
    d.onclose = () => { if (d.returnValue === "story") openStory(m.story); else nextAward(); };
    d.showModal();
    confetti();
  }

  function paintMissions() {
    const ul = $("missionList"); ul.textContent = "";
    missions.forEach(m => {
      const n = progress(m), goal = m.goal.count || 1, finished = !!done[m.id];
      const li = el("li"), box = el("div", "mission " + (finished ? "done" : "locked"));
      box.appendChild(el("span", "badgeDot", m.badge));
      const t = el("div", "txt");
      t.appendChild(el("b", "", m.title));
      t.appendChild(el("small", "", finished ? "Complete ✓" : `${m.text} · ${n}/${goal}`));
      const bar = el("div", "bar"), i = el("i"); i.style.width = (100 * n / goal) + "%"; bar.appendChild(i); t.appendChild(bar);
      bar.setAttribute("role", "progressbar"); bar.setAttribute("aria-valuemin", "0"); bar.setAttribute("aria-valuemax", goal); bar.setAttribute("aria-valuenow", n);
      box.appendChild(t); li.appendChild(box); ul.appendChild(li);
    });
  }

  /* ---------- Stories ---------- */
  const missionFor = storyId => missions.find(m => m.story === storyId);
  const isOpen = s => { const m = missionFor(s.id); return !!(m && done[m.id]); };

  function paintStories() {
    const ul = $("storyList"); ul.textContent = "";
    stories.forEach(s => {
      const li = el("li"), open = isOpen(s), m = missionFor(s.id);
      const b = el("button", "storyBtn" + (open ? "" : " closed")); b.type = "button";
      b.appendChild(el("span", "badgeDot " + (s.place === "Mars" ? "mars" : "moon"), open ? "" : "🔒"));
      const t = el("div", "txt");
      t.appendChild(el("b", "", open ? (s.title || "Story on its way") : "Locked story"));
      t.appendChild(el("small", "", open ? (s.place || "") : (m ? `Mission: ${m.text}` : "Soon")));
      b.appendChild(t);
      b.disabled = !open;
      b.onclick = () => openStory(s.id);
      li.appendChild(b); ul.appendChild(li);
    });
  }

  function openStory(id) {
    const s = stories.find(x => x.id === id);
    if (!s || !isOpen(s)) return;
    $("sPlace").textContent = s.place ? "ARCHIVE · " + s.place.toUpperCase() : "";
    $("sPlace").hidden = !s.place;
    $("sTitle").textContent = s.title || "Story on its way";
    $("sText").textContent = s.title ? s.text : "Soon you'll read here the story of a machine we left in space.";
    const img = $("sImg");
    if (s.title && s.image && /^(https:\/\/|img\/)/.test(s.image)) { img.src = s.image; img.alt = s.title; img.hidden = false; } else { img.hidden = true; img.removeAttribute("src"); }
    const src = $("sSource"); src.textContent = "";
    if (s.title && s.source) {
      src.appendChild(document.createTextNode("Source: "));
      if (/^https:\/\//.test(s.source)) { const a = el("a", "", s.source); a.href = s.source; a.target = "_blank"; a.rel = "noopener"; src.appendChild(a); }
      else src.appendChild(document.createTextNode(s.source));
    }
    const d = $("story");
    d.onclose = () => { paintStories(); nextAward(); };
    d.showModal();
  }

  /* ---------- Log ---------- */
  function paintLog() {
    $("logItems").textContent = pickedUp().length;
    $("logPoints").textContent = totalPoints();
    const earned = missions.filter(m => done[m.id]);
    $("logBadges").textContent = earned.length;
    const box = $("badges"); box.textContent = "";
    earned.forEach(m => box.appendChild(el("span", "badgeDot", m.badge)));
    const ul = $("logList"); ul.textContent = "";
    if (!log.length) { ul.appendChild(el("li", "empty", "Nothing yet. Take your first photo!")); return; }
    log.slice(-30).reverse().forEach(x => {
      const li = el("li");
      const d = new Date(x.date);
      li.appendChild(el("span", "", `${d.toLocaleDateString("en", { day: "numeric", month: "short" })} · ${TYPE[x.type] || x.type}${x.dangerous ? " ⚠️" : ""}`));
      li.appendChild(el("span", "pts", x.points ? `+${x.points}` : "0"));
      ul.appendChild(li);
    });
  }

  /* ---------- Start ---------- */
  async function getJSON(url) { const r = await fetch(url, { cache: "no-cache" }); if (!r.ok) throw new Error(url); return r.json(); }
  async function start() {
    paintProfile(); paintPoints(); robot("idle");
    $("demoBanner").hidden = !DEMO;
    try { missions = (await getJSON("missions.json")).missions || []; } catch { missions = []; }
    try { stories = (await getJSON("stories.json")).stories || []; } catch { stories = []; }
    checkMissions();
    if (!DEMO) fetch("/api/counter").then(r => r.ok ? r.json() : null).then(j => { if (j && typeof j.total === "number") $("global").textContent = j.total.toLocaleString("en"); }).catch(() => {});
    if (!profile) openProfile();
  }
  start();
})();
