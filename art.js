/* debris: the drawings, as inline SVG strings.
   Eagle, the crew buddies, the bin and the camera scene come from the design canvas "Debris App Screens".
   The 13 chapter patches follow the canvas's patch style (cream edge, orange ring, stitched centre). */
(function () {
  "use strict";
  const CREAM = "#FFF4E8", ORANGE = "#FF7A1A", NAVY = "#0B1A5C", INK = "#1D1A3F";
  const aria = label => label ? `role="img" aria-label="${String(label).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]))}"` : `aria-hidden="true"`;

  /* ---------- Eagle the lander ---------- */
  function eagle({ label = "", tip = CREAM, look = "center", mood = "happy", cls = "" } = {}) {
    return `<svg class="${cls}" viewBox="0 0 200 220" ${aria(label)}>${eagleArt({ tip, look, mood })}</svg>`;
  }
  function eagleArt({ tip = CREAM, look = "center", mood = "happy" } = {}) {
    const dx = look === "right" ? 3 : 0, dy = look === "right" ? 1 : 0;
    return `<ellipse cx="100" cy="210" rx="82" ry="9" fill="${NAVY}" opacity=".35"/>
<path d="M54 148 L30 196 M146 148 L170 196 M100 160 L100 198" stroke="#D9560B" stroke-width="13" stroke-linecap="round" fill="none"/>
<ellipse cx="27" cy="201" rx="17" ry="8" fill="#B6450A"/><ellipse cx="173" cy="201" rx="17" ry="8" fill="#B6450A"/><ellipse cx="100" cy="203" rx="14" ry="7" fill="#B6450A"/>
<rect x="34" y="114" width="132" height="48" rx="18" fill="#D9560B"/>
<rect x="48" y="126" width="22" height="24" rx="6" fill="#FFC98F" opacity=".55"/><rect x="130" y="126" width="22" height="24" rx="6" fill="#FFC98F" opacity=".55"/>
<path d="M84 160 L116 160 L123 175 Q100 181 77 175 Z" fill="#B6450A"/>
${head({ tip, dx, dy, mood })}`;
  }
  /* The head on its own (Safety, Found, Danger), drawn in the same coordinates. */
  function head({ tip, dx = 0, dy = 0, mood = "happy" }) {
    const py = mood === "worried" ? 78 : 72 + dy, hy = py - 4;
    const mouth = mood === "worried" ? `<ellipse cx="100" cy="106" rx="5" ry="6" fill="${INK}"/>`
      : mood === "smile" ? `<path d="M91 103 Q100 111 109 103" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`
      : `<path d="M89 101 Q100 116 111 101 Z" fill="${INK}"/><ellipse cx="100" cy="108" rx="5.5" ry="3" fill="#FF7A9C"/>`;
    return `<path d="M66 50 L52 26 M134 50 L150 28" stroke="#D9560B" stroke-width="7" stroke-linecap="round" fill="none"/>
<circle cx="50" cy="22" r="11" fill="${tip}"/><path d="M142 22 Q152 38 166 18 Q153 28 142 22 Z" fill="${tip}"/>
<rect x="85" y="26" width="30" height="18" rx="7" fill="#D9560B"/>
<circle cx="38" cy="82" r="10" fill="#D9560B"/><circle cx="162" cy="82" r="10" fill="#D9560B"/>
<rect x="44" y="36" width="112" height="88" rx="38" fill="${ORANGE}"/>
<ellipse cx="100" cy="108" rx="38" ry="15" fill="#FFA45C"/>
<circle cx="77" cy="74" r="20" fill="#FFFFFF"/><circle cx="${77 + dx}" cy="${py}" r="11" fill="${INK}"/><circle cx="${73.5 + dx}" cy="${hy}" r="3.4" fill="#FFFFFF"/>
<circle cx="123" cy="74" r="20" fill="#FFFFFF"/><circle cx="${123 + dx}" cy="${py}" r="11" fill="${INK}"/><circle cx="${119.5 + dx}" cy="${hy}" r="3.4" fill="#FFFFFF"/>
${mouth}`;
  }
  function eagleHead({ label = "", mood = "smile", look = "center", cls = "" } = {}) {
    const dx = look === "right" ? 3 : 0;
    return `<svg class="${cls}" viewBox="30 8 140 122" ${aria(label)}>${head({ tip: "#FFC98F", dx, mood })}</svg>`;
  }

  /* ---------- Crew buddies (Profile) ---------- */
  const BUDDY_ART = {
    eagle: `<rect x="8" y="12" width="64" height="56" rx="24" fill="#FF7A1A"/><circle cx="29" cy="38" r="12" fill="#FFFFFF"/><circle cx="29" cy="38" r="6.6" fill="#1D1A3F"/><circle cx="51" cy="38" r="12" fill="#FFFFFF"/><circle cx="51" cy="38" r="6.6" fill="#1D1A3F"/><path d="M34 56 Q40 62 46 56" fill="none" stroke="#1D1A3F" stroke-width="3.4" stroke-linecap="round"/>`,
    hadley: `<rect x="8" y="20" width="64" height="48" rx="20" fill="#A9BEE6"/><path d="M4 24 Q40 -6 76 24 Z" fill="#FFC98F"/><circle cx="29" cy="42" r="12" fill="#FFFFFF"/><circle cx="30" cy="43" r="6.6" fill="#1D1A3F"/><circle cx="51" cy="42" r="12" fill="#FFFFFF"/><circle cx="52" cy="43" r="6.6" fill="#1D1A3F"/><path d="M34 59 Q40 64 46 59" fill="none" stroke="#1D1A3F" stroke-width="3.4" stroke-linecap="round"/>`,
    oppy: `<rect x="35" y="44" width="10" height="26" rx="5" fill="#5E39D1"/><rect x="4" y="16" width="72" height="38" rx="18" fill="#A07EFF"/><circle cx="26" cy="35" r="12" fill="#FFFFFF"/><circle cx="29" cy="35" r="6.6" fill="#1D1A3F"/><circle cx="54" cy="35" r="12" fill="#FFFFFF"/><circle cx="57" cy="35" r="6.6" fill="#1D1A3F"/>`,
    ginny: `<ellipse cx="40" cy="12" rx="36" ry="4.5" fill="#D93A6B"/><rect x="37" y="10" width="6" height="14" fill="#D93A6B"/><rect x="12" y="22" width="56" height="50" rx="20" fill="#FF5C8A"/><circle cx="29" cy="44" r="12" fill="#FFFFFF"/><circle cx="29" cy="43" r="6.6" fill="#1D1A3F"/><circle cx="51" cy="44" r="12" fill="#FFFFFF"/><circle cx="51" cy="43" r="6.6" fill="#1D1A3F"/><ellipse cx="40" cy="62" rx="3.6" ry="4.4" fill="#1D1A3F"/>`,
    voyager: `<circle cx="40" cy="40" r="34" fill="#E9DCC6"/><circle cx="40" cy="42" r="25" fill="#D8C6A8"/><circle cx="29" cy="40" r="11" fill="#FFFFFF"/><circle cx="29" cy="43" r="6" fill="#1D1A3F"/><circle cx="51" cy="40" r="11" fill="#FFFFFF"/><circle cx="51" cy="43" r="6" fill="#1D1A3F"/><path d="M34 57 Q40 62 46 57" fill="none" stroke="#1D1A3F" stroke-width="3.4" stroke-linecap="round"/>`,
    viking: `<polygon points="14,40 27,16 53,16 66,40 53,64 27,64" fill="#E0553B" stroke="#E0553B" stroke-width="10" stroke-linejoin="round"/><circle cx="29" cy="38" r="12" fill="#FFFFFF"/><circle cx="29" cy="36" r="6.6" fill="#1D1A3F"/><circle cx="51" cy="38" r="12" fill="#FFFFFF"/><circle cx="51" cy="36" r="6.6" fill="#1D1A3F"/><path d="M34 55 Q40 61 46 55" fill="none" stroke="#1D1A3F" stroke-width="3.4" stroke-linecap="round"/>`
  };
  const BUDDIES = [["eagle", "Eagle"], ["hadley", "Hadley"], ["oppy", "Oppy"], ["ginny", "Ginny"], ["voyager", "Voyager"], ["viking", "Viking"]];
  const buddy = (id, label = "") => `<svg viewBox="0 0 80 80" ${aria(label)}>${BUDDY_ART[id] || BUDDY_ART.eagle}</svg>`;

  /* ---------- The 13 chapter patches ---------- */
  const PATCH_BG = { moon: "#1F43C4", mars: "#B23A1E", deep: "#0B1A5C", eros: "#5E39D1", sun: "#13795B", ceres: "#2F55D6" };
  const EMBLEM = {
    // 1 Surveyor 3: the robot that tested the ground
    1: () => `<g transform="translate(0 2)"><path d="M-14 6 L14 6 L0 -12 Z" stroke="none"/><path d="M-14 6 L-24 24 M14 6 L24 24 M0 6 L0 24 M0 -12 L0 -22" stroke-width="3.5" fill="none"/><path d="M-8 -26 Q0 -18 8 -26" fill="none" stroke-width="3"/><path d="M14 0 L24 -6 L27 0" stroke-width="2.5" fill="none"/></g>`,
    // 2 Apollo 11 and the Moon mirror: a laser goes in, bounces back
    2: () => `<path d="M-4 -16 L-14 -30 M4 -16 L14 -30" stroke-width="2.5" stroke-dasharray="3 4" fill="none"/><rect x="-20" y="-12" width="40" height="30" rx="3" fill="none" stroke-width="3.5"/><circle cx="-11" cy="-2" r="4" stroke="none"/><circle cx="0" cy="-2" r="4" stroke="none"/><circle cx="11" cy="-2" r="4" stroke="none"/><circle cx="-11" cy="9" r="4" stroke="none"/><circle cx="0" cy="9" r="4" stroke="none"/><circle cx="11" cy="9" r="4" stroke="none"/><path d="M-14 18 L-18 26 M14 18 L18 26" stroke-width="3" fill="none"/>`,
    // 3 Apollo 12 Intrepid: the lander's bottom half, and the first moonquake made by people
    3: () => `<g transform="translate(0 -4)"><rect x="-20" y="-12" width="40" height="14" rx="3" stroke="none"/><path d="M-16 0 L-27 20 M16 0 L27 20 M0 2 L0 20" stroke-width="4" fill="none"/><path d="M-7 2 L7 2 L9 9 L-9 9 Z" stroke="none"/></g><path d="M-30 25 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6 l6 6 l6 -6" stroke-width="3" fill="none"/>`,
    // 4 Apollo 15: the first Moon car
    4: () => `<g transform="translate(0 4)"><rect x="-24" y="-4" width="48" height="10" rx="3" stroke="none"/><circle cx="-17" cy="14" r="7" fill="none" stroke-width="3.5"/><circle cx="17" cy="14" r="7" fill="none" stroke-width="3.5"/><path d="M-4 -4 L-4 -16 M10 -4 L10 -14" stroke-width="3" fill="none"/><path d="M-2 -24 Q8 -14 18 -24 Z" stroke="none"/></g>`,
    // 5 Pioneer 10: the message in a bottle, heading for a red star
    5: () => `<path d="M-26 -8 Q0 14 26 -8 Q0 2 -26 -8 Z" stroke="none"/><path d="M0 2 L0 -20" stroke-width="2.5" fill="none"/><circle cx="0" cy="-22" r="3" stroke="none"/><rect x="-7" y="4" width="14" height="9" rx="2" stroke="none"/><path d="M-6 10 L-23 21 M6 10 L23 21" stroke-width="2.5" fill="none"/><circle cx="-24" cy="22" r="3.5" stroke="none"/><circle cx="24" cy="22" r="3.5" stroke="none"/><path d="M18 -32 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" stroke="none"/>`,
    // 6 Viking 1: the lander with a lab and a scoop
    6: () => `<path d="M-18 -16 Q-6 -28 6 -16 Z" stroke="none"/><path d="M-6 -6 L-6 -16" stroke-width="3" fill="none"/><rect x="-15" y="-6" width="30" height="12" rx="3" stroke="none"/><path d="M-12 6 L-22 21 M12 6 L22 21 M0 6 L0 21" stroke-width="3.5" fill="none"/><ellipse cx="-22" cy="23" rx="5" ry="2.5" stroke="none"/><ellipse cx="22" cy="23" rx="5" ry="2.5" stroke="none"/><ellipse cx="0" cy="23" rx="4" ry="2" stroke="none"/><path d="M15 -2 L25 -10 L29 -3" stroke-width="3" fill="none"/>`,
    // 7 Pathfinder: the bouncing beach ball
    7: bg => `<path d="M-32 22 H30" stroke-width="2.5" fill="none"/><path d="M-31 21 Q-27 4 -23 21 Q-20 11 -17 21" stroke-width="2.5" stroke-dasharray="2 4" fill="none"/><g stroke="${bg}" stroke-width="2"><circle cx="-1" cy="-10" r="10"/><circle cx="-9" cy="2" r="10"/><circle cx="9" cy="2" r="10"/><circle cx="0" cy="11" r="9"/></g>`,
    // 8 NEAR Shoemaker: landing on asteroid Eros
    8: bg => `<path d="M-28 12 Q-30 0 -16 -2 Q-6 -8 8 -4 Q26 -4 28 8 Q28 20 10 20 Q-4 24 -18 22 Q-28 20 -28 12 Z" stroke="none"/><circle cx="-12" cy="10" r="3" fill="${bg}" stroke="none"/><circle cx="6" cy="12" r="4" fill="${bg}" stroke="none"/><circle cx="16" cy="4" r="2.4" fill="${bg}" stroke="none"/><g transform="translate(2 -19)"><rect x="-4" y="-4" width="8" height="8" rx="1" stroke="none"/><rect x="-16" y="-2" width="10" height="4" stroke="none"/><rect x="6" y="-2" width="10" height="4" stroke="none"/><path d="M0 -4 L0 -9" stroke-width="2" fill="none"/></g><path d="M2 -12 L2 -8" stroke-width="2" stroke-dasharray="1 3" fill="none"/>`,
    // 9 Spirit and Opportunity: the twin robot geologists
    9: () => `<rect x="-28" y="-6" width="56" height="5" rx="1.5" stroke="none"/><rect x="-12" y="-1" width="24" height="9" rx="2" stroke="none"/><path d="M12 -6 L12 -20" stroke-width="3" fill="none"/><rect x="6" y="-27" width="13" height="7" rx="2" stroke="none"/><path d="M-18 8 L-20 13 M0 8 L0 13 M18 8 L20 13" stroke-width="2.5" fill="none"/><circle cx="-20" cy="18" r="5" fill="none" stroke-width="3"/><circle cx="0" cy="18" r="5" fill="none" stroke-width="3"/><circle cx="20" cy="18" r="5" fill="none" stroke-width="3"/>`,
    // 10 Kepler: a planet passes its star, and the light dips
    10: bg => `<circle cx="0" cy="-8" r="15" stroke="none"/><circle cx="6" cy="-6" r="4.5" fill="${bg}" stroke="none"/><path d="M-26 19 H-9 Q-6 26 0 26 Q6 26 9 19 H26" fill="none" stroke-width="3"/><path d="M-22 -28 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" stroke="none"/>`,
    // 11 Dawn: long solar wings and a gentle engine
    11: bg => `<rect x="-31" y="-6" width="22" height="7" rx="1.5" stroke="none"/><rect x="9" y="-6" width="22" height="7" rx="1.5" stroke="none"/><path d="M-9 -2.5 H-6 M6 -2.5 H9" stroke-width="2" fill="none"/><rect x="-6" y="-10" width="12" height="15" rx="2" stroke="none"/><path d="M-4 -10 Q0 -17 4 -10" fill="none" stroke-width="2.5"/><path d="M0 8 L0 12 M0 16 L0 19 M0 23 L0 25" stroke-width="3" fill="none"/><circle cx="20" cy="18" r="7" stroke="none"/><circle cx="18" cy="16" r="1.8" fill="${bg}" stroke="none"/>`,
    // 12 InSight: taking Mars's pulse
    12: bg => `<path d="M-30 22 H-12 l3 -3 l3 3 l3 -3 l3 3 H30" stroke-width="2.5" fill="none"/><circle cx="-19" cy="-8" r="10" stroke="none"/><circle cx="19" cy="-8" r="10" stroke="none"/><path d="M-19 -18 V2 M-29 -8 H-9 M19 -18 V2 M9 -8 H29" stroke="${bg}" stroke-width="1.5" fill="none"/><rect x="-10" y="-6" width="20" height="10" rx="2" stroke="none"/><path d="M-6 4 L-11 18 M6 4 L11 18" stroke-width="3" fill="none"/><path d="M14 22 A7 7 0 0 1 28 22 Z" stroke="none"/>`,
    // 13 Ingenuity: the first helicopter on another planet
    13: () => `<path d="M-28 -20 H28" stroke-width="3.5" fill="none"/><path d="M-24 -12 H24" stroke-width="3" fill="none"/><rect x="-7" y="-28" width="14" height="5" rx="1" stroke="none"/><path d="M0 -23 V-2" stroke-width="3" fill="none"/><rect x="-8" y="-3" width="16" height="12" rx="3" stroke="none"/><path d="M-6 8 L-16 24 M6 8 L16 24 M-2 9 L-6 24 M2 9 L6 24" stroke-width="2.2" fill="none"/>`
  };
  function patch(n, body, label = "") {
    const bg = PATCH_BG[body] || PATCH_BG.moon, draw = EMBLEM[n] || EMBLEM[1];
    return `<svg viewBox="0 0 160 160" ${aria(label)}>
<circle cx="80" cy="80" r="78" fill="${CREAM}"/><circle cx="80" cy="80" r="71" fill="${ORANGE}"/>
<circle cx="80" cy="80" r="65.5" fill="none" stroke="${NAVY}" stroke-width="2" stroke-dasharray="3 3"/><circle cx="80" cy="80" r="61" fill="${bg}"/>
<g transform="translate(80 80) scale(1.5)" fill="${CREAM}" stroke="${CREAM}" stroke-linecap="round" stroke-linejoin="round">${draw(bg)}</g>
</svg>`;
  }

  /* ---------- Icons (24 × 24 line icons from the canvas) ---------- */
  const ICON = {
    camera: `<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>`,
    close: `<path d="M6 6l12 12M18 6 6 18"/>`,
    back: `<path d="M14.5 5.5 8 12l6.5 6.5"/>`,
    chevron: `<path d="M9.5 5.5 16 12l-6.5 6.5"/>`,
    home: `<path d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5"/>`,
    jacket: `<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4.5"/>`,
    me: `<circle cx="12" cy="8" r="4"/><path d="M4 20.5c.8-4 3.8-6.5 8-6.5s7.2 2.5 8 6.5"/>`,
    globe: `<circle cx="12" cy="12" r="9.5"/><path d="M2.5 12h19M12 2.5c3 3 3 16 0 19M12 2.5c-3 3-3 16 0 19"/>`,
    hand: `<path d="M7 11V5a1.5 1.5 0 0 1 3 0v5M10 10V3.5a1.5 1.5 0 0 1 3 0V10M13 10V4.5a1.5 1.5 0 0 1 3 0V11M16 11V7a1.5 1.5 0 0 1 3 0v8a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-2.7L4.5 14a1.5 1.5 0 0 1 2.4-1.7L8 13.5"/>`,
    grownups: `<circle cx="8" cy="7" r="3.2"/><path d="M2.5 20c.4-3.6 2.6-6 5.5-6s5.1 2.4 5.5 6"/><circle cx="17.5" cy="10" r="2.4"/><path d="M14.8 20c.2-2.8 1.3-4.6 2.7-4.6s3.6 1.8 4 4.6"/>`,
    warning: `<path d="M12 3 2.5 20h19L12 3z"/><path d="M12 10v5M12 17.6v.2"/>`,
    check: `<path d="M5 12.5 10 17.5 19 7"/>`,
    checkCircle: `<circle cx="12" cy="12" r="9.5"/><path d="M7.5 12.5 10.5 15.5 16.5 9"/>`,
    image: `<rect x="3" y="4.5" width="18" height="15" rx="3"/><circle cx="8.5" cy="10" r="1.8"/><path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5"/>`,
    external: `<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>`,
    refresh: `<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>`,
    impact: `<path d="M19.5 14.5A8.5 8.5 0 1 1 9.5 4.5a7 7 0 0 0 10 10z"/><path d="M17 3.5v3M15.5 5h3"/>`
  };
  function icon(name, { size = 24, width = 2.3, cls = "" } = {}) {
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round">${ICON[name] || ""}</svg>`;
  }
  const play = (playing, size = 28) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="${ORANGE}"/>${playing ? `<rect x="8" y="8" width="8" height="8" rx="1.5" fill="${NAVY}"/>` : `<path d="M10 7.5v9l7-4.5z" fill="${NAVY}"/>`}</svg>`;

  /* ---------- Scenes ---------- */
  // The camera view from the canvas: a sweet wrapper on a path next to grass.
  const scene = (label = "") => `<svg viewBox="0 0 390 844" preserveAspectRatio="xMidYMid slice" ${aria(label)}>
<rect width="390" height="844" fill="#9AA3B5"/>
<path d="M0 0 H390 V250 Q200 300 0 230 Z" fill="#6E9F68"/><path d="M0 230 Q200 300 390 250 V268 Q200 318 0 248 Z" fill="#5C8A57"/>
<circle cx="70" cy="560" r="16" fill="#8892A6"/><circle cx="320" cy="690" r="22" fill="#8892A6"/><circle cx="300" cy="400" r="9" fill="#8892A6"/><circle cx="90" cy="740" r="10" fill="#8892A6"/>
<path d="M60 120 q14 -30 30 0 q-15 12 -30 0 Z" fill="#4F7B4B"/><path d="M290 90 q14 -30 30 0 q-15 12 -30 0 Z" fill="#4F7B4B"/>
<g transform="rotate(-14 195 440)"><rect x="120" y="398" width="150" height="84" rx="12" fill="#E8457A"/><path d="M120 410 l-22 -14 v88 l22 -14 Z M270 410 l22 -14 v88 l-22 -14 Z" fill="#C92F63"/><rect x="146" y="420" width="98" height="14" rx="7" fill="#FFD6E3"/><rect x="146" y="444" width="64" height="12" rx="6" fill="#FFD6E3"/></g>
</svg>`;
  const frame = () => `<svg class="scan-frame" viewBox="0 0 300 300" aria-hidden="true" fill="none" stroke="${CREAM}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 60 V28 Q6 6 28 6 H60 M240 6 h32 q22 0 22 22 v32 M294 240 v32 q0 22 -22 22 h-32 M60 294 H28 Q6 294 6 272 V240"/></svg>`;

  // A bin with litter dropping in (Bin it). Colours follow the bin.
  const BIN_LOOK = {
    white: { body: "#FFFFFF", lid: "#E6E9F5", mark: `<g fill="none" stroke="#1F43C4" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(175 156)"><path d="M-6 -22 L6 -22 L16 -6"/><path d="M22 6 L14 22 L-4 22"/><path d="M-16 20 L-24 4 L-14 -10"/><path d="M10 -12 L17 -5 L22 -14"/><path d="M0 16 L-5 22 L1 28"/><path d="M-20 -8 L-13 -11 L-10 -2"/></g>` },
    green: { body: "#3F8F4B", lid: "#2F7A3C", mark: `<g fill="none" stroke="${CREAM}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(175 156)"><path d="M-18 22 C-20 -6 6 -22 22 -24 C22 -6 12 20 -18 22 Z"/><path d="M-18 22 L8 -6"/></g>` },
    black: { body: "#22252E", lid: "#3A3E4A", mark: `<g fill="none" stroke="#8A90A6" stroke-width="6" stroke-linecap="round" transform="translate(175 156)"><path d="M-20 -22 V26 M0 -22 V26 M20 -22 V26"/></g>` },
    special_dropoff: { body: "#F2B33D", lid: "#D99A1E", mark: `<g fill="none" stroke="${NAVY}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" transform="translate(175 156)"><path d="M0 -26 -28 22 H28 Z"/><path d="M0 -8 V6 M0 14 V15"/></g>` }
  };
  function bin(kind, label = "") {
    const b = BIN_LOOK[kind] || BIN_LOOK.black;
    return `<svg viewBox="0 0 350 230" ${aria(label)}>
<path d="M0 196 Q175 172 350 196 V230 H0 Z" fill="${NAVY}" opacity=".45"/>
<g class="drop"><g transform="rotate(18 180 46)"><rect x="150" y="28" width="60" height="34" rx="6" fill="#E8457A"/><path d="M150 34 l-10 -7 v40 l10 -7 Z M210 34 l10 -7 v40 l-10 -7 Z" fill="#C92F63"/></g></g>
<path d="M160 78 q16 10 30 0" fill="none" stroke="#FFC98F" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9"/>
<path d="M118 104 H232 L222 200 Q221 208 213 208 H137 Q129 208 128 200 Z" fill="${b.body}"/>
<rect x="106" y="90" width="138" height="18" rx="9" fill="${b.lid}"/>
${b.mark}
</svg>`;
  }

  // The sparkles behind "Patch unlocked!"
  const sparkles = () => `<svg class="sparkles" viewBox="0 0 390 420" aria-hidden="true">
<path d="M52 70 Q52 90 72 90 Q52 90 52 110 Q52 90 32 90 Q52 90 52 70 Z" fill="#FFC98F"/>
<path d="M338 120 Q338 136 354 136 Q338 136 338 152 Q338 136 322 136 Q338 136 338 120 Z" fill="#FFC98F"/>
<path d="M318 40 Q318 50 328 50 Q318 50 318 60 Q318 50 308 50 Q318 50 318 40 Z" fill="${CREAM}"/>
<path d="M70 300 Q70 310 80 310 Q70 310 70 320 Q70 310 60 310 Q70 310 70 300 Z" fill="${CREAM}"/>
<path d="M330 330 Q330 344 344 344 Q330 344 330 358 Q330 344 316 344 Q330 344 330 330 Z" fill="#FFC98F"/>
<circle cx="96" cy="170" r="5" fill="#FF7A9C"/><circle cx="300" cy="230" r="5" fill="#A07EFF"/><circle cx="120" cy="40" r="4" fill="${CREAM}"/><circle cx="270" cy="90" r="4" fill="#FF7A9C"/>
</svg>`;

  /* ---------- The finale map: where the 13 machines rest ---------- */
  const PINS = { 1: [130, 100], 2: [168, 100], 3: [140, 122], 4: [156, 78], 5: [334, 200], 6: [244, 132], 7: [266, 124], 8: [212, 50], 9: [290, 156], 10: [47, 68], 11: [318, 56], 12: [276, 178], 13: [246, 168] };
  function map(unlocked, L, label = "") {
    const pin = i => {
      const [x, y] = PINS[i], on = i <= unlocked;
      return `<g class="pin${on ? " on" : ""}"><circle cx="${x}" cy="${y}" r="11"/><text x="${x}" y="${y + 4.5}" text-anchor="middle">${i}</text></g>`;
    };
    const txt = (x, y, s, a = "middle") => `<text class="lbl" x="${x}" y="${y}" text-anchor="${a}">${String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</text>`;
    let pins = ""; for (let i = 1; i <= 13; i++) pins += pin(i);
    return `<svg class="map" viewBox="0 0 360 250" ${aria(label)}>
<rect x="0" y="0" width="360" height="250" rx="22" fill="${NAVY}"/>
<g fill="${CREAM}" opacity=".55"><circle cx="96" cy="26" r="1.6"/><circle cx="200" cy="20" r="1.4"/><circle cx="250" cy="70" r="1.2"/><circle cx="350" cy="140" r="1.4"/><circle cx="190" cy="160" r="1.2"/><circle cx="70" cy="230" r="1.4"/><circle cx="300" cy="110" r="1.2"/></g>
<clipPath id="mapClip"><rect x="0" y="0" width="360" height="250" rx="22"/></clipPath>
<g clip-path="url(#mapClip)"><circle cx="-20" cy="125" r="88" fill="none" stroke="#8FA3EA" stroke-width="2" stroke-dasharray="3 6"/><circle cx="-20" cy="125" r="58" fill="#FFC98F"/><circle cx="-20" cy="125" r="46" fill="#FFA45C" opacity=".6"/></g>
${txt(14, 200, L.sun)}
<circle cx="112" cy="198" r="16" fill="#1F43C4" stroke="#8FA3EA" stroke-width="2"/><path d="M103 192 q5 -6 10 -1 q4 5 -2 9 q-6 2 -8 -8z M116 204 q5 -2 7 2 q-2 5 -7 3z" fill="#2F9E73"/>
${txt(112, 232, L.earth)}
<circle cx="150" cy="104" r="36" fill="#C9D3FA"/><circle cx="140" cy="88" r="5" fill="#A9B4D6"/><circle cx="164" cy="118" r="7" fill="#A9B4D6"/><circle cx="128" cy="118" r="3.5" fill="#A9B4D6"/>
${txt(150, 156, L.moon)}
<circle cx="264" cy="152" r="46" fill="#D9673A"/><path d="M228 140 q14 -10 30 -2 q8 6 -4 10 q-16 2 -26 -8z M268 186 q12 -8 24 -2 q-6 8 -24 2z" fill="#B6450A"/>
${txt(264, 216, L.mars)}
<path d="M200 50 q-2 -10 10 -10 q14 -2 16 8 q2 10 -10 12 q-14 2 -16 -10z" fill="#A9B4D6"/>
${txt(212, 80, L.eros)}
<circle cx="318" cy="56" r="16" fill="#A9B4D6"/>
${txt(318, 90, L.ceres)}
<path d="M316 216 Q326 208 334 200 L358 170" fill="none" stroke="#8FA3EA" stroke-width="2" stroke-dasharray="3 5"/>
${txt(352, 240, L.deep, "end")}
${pins}
</svg>`;
  }

  /* ---------- Impact: litter to the Moon ---------- */
  // Simple silhouettes of the tower's milestones (48 × 48), in the colour of the text around them.
  const MILESTONE_ART = {
    kid: `<circle cx="24" cy="8" r="5.5"/><path d="M17 18 q7 -4 14 0 l-1 13 h-12 z"/><path d="M18 30 h5 v15 h-5z M25 30 h5 v15 h-5z"/><path d="M17 19 l-6 9 M31 19 l6 9" stroke="currentColor" stroke-width="4" stroke-linecap="round" fill="none"/>`,
    cristo: `<circle cx="24" cy="7" r="3.6"/><path d="M3 13 h42 v4 h-42z"/><path d="M20 12 h8 l3 26 h-14z"/><path d="M16 38 h16 v8 h-16z"/>`,
    liberty: `<path d="M14 46 l3 -10 h14 l3 10z"/><path d="M19 36 l2 -19 h6 l2 19z"/><circle cx="24" cy="13" r="3.4"/><path d="M20 10 l-2 -3 M24 9 v-4 M28 10 l2 -3 M27 18 l6 -12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" fill="none"/><path d="M33 6 q-3 -3 0 -6 q3 3 0 6z" fill="#FF7A1A"/>`,
    saturnV: `<path d="M24 2 c3 3 4 7 4 11 v25 h-8 v-25 c0 -4 1 -8 4 -11z"/><path d="M20 30 l-5 12 h5z M28 30 l5 12 h-5z"/><path d="M21 38 h6 l1 6 h-8z"/><path d="M20 19 h8 M20 29 h8" stroke="${NAVY}" stroke-width="1.6"/>`,
    oneWTC: `<path d="M17 46 l3 -35 h8 l3 35z"/><path d="M24 11 v-10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M24 11 L19.5 46 M24 11 L28.5 46" stroke="${NAVY}" stroke-width="1"/>`,
    burj: `<path d="M17 46 V38 H19 V29 H21 V20 H22.5 V11 H23.5 V2 L24 0.5 L24.5 2 V11 H25.5 V20 H27 V29 H29 V38 H31 V46 Z"/>`,
    everest: `<path d="M1 46 L17 18 L22 25 L29 10 L47 46 Z" fill="#8FA3EA"/><path d="M29 10 L24.6 19 L27 17.5 L29.5 20.5 L32 17.8 L33.6 18.4 Z"/>`,
    iss: `<path d="M3 24 h42" stroke="currentColor" stroke-width="3" stroke-linecap="round"/><rect x="5" y="12" width="9" height="24" rx="1"/><rect x="34" y="12" width="9" height="24" rx="1"/><rect x="15.5" y="15" width="5" height="18" rx="1"/><rect x="27.5" y="15" width="5" height="18" rx="1"/><rect x="20" y="20" width="8" height="8" rx="2"/>`,
    moon: `<circle cx="24" cy="24" r="19" fill="#C9D3FA"/><circle cx="17" cy="19" r="4" fill="#A9B4D6"/><circle cx="29" cy="31" r="5" fill="#A9B4D6"/><circle cx="31" cy="15" r="2.5" fill="#A9B4D6"/>`
  };
  const milestone = id => `<svg class="ms-art" viewBox="0 0 48 48" aria-hidden="true" fill="currentColor">${MILESTONE_ART[id] || ""}</svg>`;

  // The litter tower between two milestones: cans, bottles and wrappers stacked up to `progress` (0 to 1).
  function stack(progress) {
    const top = 14, ground = 196, h = Math.max(0, Math.min(1, progress)) * (ground - top);
    return `<svg class="litter-stack" viewBox="0 0 120 200" aria-hidden="true">
<defs><pattern id="litterPattern" width="40" height="24" patternUnits="userSpaceOnUse">
<rect width="40" height="24" fill="#2F55D6"/>
<rect x="2" y="3" width="11" height="18" rx="3" fill="#E0553B"/><rect x="2" y="7" width="11" height="4" fill="${CREAM}" opacity=".85"/>
<rect x="16" y="7" width="9" height="15" rx="3" fill="#8FD3C1"/><rect x="18.5" y="3" width="4" height="5" rx="1" fill="#2F9E73"/>
<rect x="28" y="9" width="9" height="9" rx="2" fill="#FF7A9C"/><path d="M28 10 l-2 -2 v11 l2 -2z M37 10 l2 -2 v11 l-2 -2z" fill="#E8457A"/>
</pattern></defs>
<path d="M4 ${top} H116" stroke="#FFC98F" stroke-width="2.5" stroke-dasharray="4 5" stroke-linecap="round"/>
${h > 0 ? `<rect class="stack-fill" x="22" y="${(ground - h).toFixed(1)}" width="76" height="${h.toFixed(1)}" rx="8" fill="url(#litterPattern)" stroke="${CREAM}" stroke-width="2.5"/>` : ""}
<path d="M4 ${ground + 1} H116" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"/>
</svg>`;
  }

  // From Earth to the Moon on a log scale: a dot per milestone, the tower's place marked.
  function strip(dots, at, L, label) {
    const x0 = 26, x1 = 294, X = p => (x0 + p * (x1 - x0)).toFixed(1), tx = X(at);
    const esc = s => String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
    return `<svg class="strip" viewBox="0 0 320 66" ${aria(label)}>
<path d="M${x0} 30 H${x1}" stroke="#8FA3EA" stroke-width="3" stroke-linecap="round"/>
<path d="M${x0} 30 H${tx}" stroke="${ORANGE}" stroke-width="5" stroke-linecap="round"/>
${dots.map(d => `<circle cx="${X(d.pos)}" cy="30" r="4.5" fill="${d.passed ? ORANGE : NAVY}" stroke="${d.passed ? CREAM : "#8FA3EA"}" stroke-width="2"/>`).join("")}
<circle cx="13" cy="30" r="11" fill="#1F43C4" stroke="#8FA3EA" stroke-width="2"/><path d="M7 26 q4 -5 8 -1 q3 4 -2 7 q-5 2 -6 -6z M15 33 q4 -2 6 2 q-2 4 -6 2z" fill="#2F9E73"/>
<circle cx="307" cy="30" r="11" fill="#C9D3FA"/><circle cx="303" cy="27" r="2.6" fill="#A9B4D6"/><circle cx="310" cy="34" r="3" fill="#A9B4D6"/>
<path d="M${tx} 22 l-6 -10 h12 z" fill="#FFC98F" stroke="${NAVY}" stroke-width="1.5" stroke-linejoin="round"/>
<text class="lbl" x="13" y="60" text-anchor="middle">${esc(L.earth)}</text><text class="lbl" x="307" y="60" text-anchor="middle">${esc(L.moon)}</text>
</svg>`;
  }

  /* ---------- The Boi de Mamão storyteller (boi.json, from the team's spec) ----------
     Original characters in the app's cartoony style (flat colours, thick outlines, big friendly eyes), inspired by the
     boi de mamão tradition of Florianópolis and Santa Catarina. They are not copied from any group's costumes.
     No gradients; the one id (Bernúncia's stripe clip path) is made fresh for each drawing, so any number can share a page. */
  const OUT = INK, FABRIC = "#E0553B", HIDE = CREAM, SPOT = "#A0603E", MUZZLE = "#FFA3B8", HORN = "#FFE3B0", SHOE = "#5A3A2E", YELLOW = "#F2B33D", PINK = "#FF7A9C", LAV = "#8FA3EA";
  const RIBBON = ["#C9D3FA", "#D9673A", NAVY];   // from the Boi's horns: Moon grey, Mars red, deep-space blue
  const r1 = n => +n.toFixed(1);
  // A chita-style flower and leaf for the Boi's fabric
  function flower(x, y, r, petal = "#FFC98F") {
    let s = "";
    for (let a = -90; a < 270; a += 72) s += `<circle cx="${r1(x + r * Math.cos(a * Math.PI / 180))}" cy="${r1(y + r * Math.sin(a * Math.PI / 180))}" r="${r1(r * .62)}" fill="${petal}"/>`;
    return s + `<circle cx="${x}" cy="${y}" r="${r1(r * .52)}" fill="${YELLOW}" stroke="${OUT}" stroke-width="1.5"/>`;
  }
  const leaf = (x, y, rot) => `<ellipse cx="${x}" cy="${y}" rx="7" ry="3.2" fill="#2F9E73" transform="rotate(${rot} ${x} ${y})"/>`;
  const limb = (d, color, w = 10, edge = 7) => `<path d="${d}" fill="none" stroke="${OUT}" stroke-width="${w + edge}" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
  const mirrored = svg => `<g transform="matrix(-1 0 0 1 300 0)">${svg}</g>`;   // Bernúncia facing left, towards the Bull
  const hoof = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="7" fill="${SHOE}" stroke="${OUT}" stroke-width="3"/>`;
  const zzz = (x, y, s) => `<path d="M${x} ${y} h${s} l-${s} ${r1(s * 1.15)} h${s}" fill="none" stroke="${LAV}" stroke-width="${r1(Math.max(2.5, s / 5))}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const note = (x, y, c) => `<g fill="${c}" stroke="${c}"><ellipse cx="${x}" cy="${y}" rx="6" ry="4.6" transform="rotate(-20 ${x} ${y})" stroke="none"/><path d="M${x + 5} ${y - 1} V${y - 24} q8 4 10 12" fill="none" stroke-width="3" stroke-linecap="round"/></g>`;

  /* The Boi's head, centred near (100, 66) in a 200 × 220 box. Moods: smile, talk, sleep. */
  function boiHeadArt(mood = "smile") {
    // Three ribbons tied to each horn tip, fluttering out and down (outlined, so each shows on any background)
    const ribbons = (x, y, d) => [[-12, 4, -8, 22, -22, 30], [-16, -2, -22, 14, -30, 14], [-4, 12, 2, 28, -8, 42]]
      .map(([a, b, c, e, f, g], i) => limb(`M${x} ${y} c${d * a} ${b} ${d * c} ${e} ${d * f} ${g}`, RIBBON[i], 5, 3.5)).join("")
      + `<circle cx="${x}" cy="${y}" r="4.5" fill="${YELLOW}" stroke="${OUT}" stroke-width="2.5"/>`;
    const eyes = mood === "sleep"
      ? `<path d="M77 63 Q86 70 95 63 M105 63 Q114 70 123 63" fill="none" stroke="${OUT}" stroke-width="4" stroke-linecap="round"/>`
      : `<circle cx="86" cy="62" r="10.5" fill="#FFFFFF" stroke="${OUT}" stroke-width="3"/><circle cx="114" cy="62" r="10.5" fill="#FFFFFF" stroke="${OUT}" stroke-width="3"/>
<circle cx="87.5" cy="63.5" r="6" fill="${OUT}"/><circle cx="115.5" cy="63.5" r="6" fill="${OUT}"/><circle cx="85.4" cy="61" r="2.1" fill="#FFFFFF"/><circle cx="113.4" cy="61" r="2.1" fill="#FFFFFF"/>`;
    const mouth = mood === "talk" ? `<path d="M90 95 Q100 110 110 95 Z" fill="${OUT}" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/><ellipse cx="100" cy="102" rx="5" ry="2.4" fill="${PINK}"/>`
      : mood === "sleep" ? `<path d="M95 98 Q100 101 105 98" fill="none" stroke="${OUT}" stroke-width="3.2" stroke-linecap="round"/>`
      : `<path d="M89 96 Q100 106 111 96" fill="none" stroke="${OUT}" stroke-width="3.6" stroke-linecap="round"/>`;
    const face = "M64 46 Q100 24 136 46 Q146 72 132 94 Q100 110 68 94 Q54 72 64 46 Z";
    return `<path d="M74 46 Q50 46 42 14 Q60 30 80 36 Z" fill="${HORN}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
<path d="M126 46 Q150 46 158 14 Q140 30 120 36 Z" fill="${HORN}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/>
${ribbons(43, 16, 1)}${ribbons(157, 16, -1)}
<path d="M63 52 Q41 44 32 57 Q42 73 65 67 Z" fill="${HIDE}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/><path d="M58 56 Q46 54 42 59 Q48 65 59 63 Z" fill="${MUZZLE}"/>
<path d="M137 52 Q159 44 168 57 Q158 73 135 67 Z" fill="${HIDE}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/><path d="M142 56 Q154 54 158 59 Q152 65 141 63 Z" fill="${MUZZLE}"/>
<path d="${face}" fill="${HIDE}"/>
<path d="M107 44 Q130 37 136 53 Q134 71 118 72 Q103 63 107 44 Z" fill="${SPOT}"/>
<path d="${face}" fill="none" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
<path d="M100 37 l2.6 5.4 5.9 .8 -4.3 4.1 1 5.9 -5.2 -2.8 -5.2 2.8 1 -5.9 -4.3 -4.1 5.9 -.8 z" fill="#FFD84D" stroke="${OUT}" stroke-width="2" stroke-linejoin="round"/>
${eyes}
<ellipse cx="100" cy="90" rx="25" ry="14.5" fill="${MUZZLE}" stroke="${OUT}" stroke-width="3.5"/>
<ellipse cx="91" cy="87" rx="3" ry="4" fill="${OUT}"/><ellipse cx="109" cy="87" rx="3" ry="4" fill="${OUT}"/>
${mouth}`;
  }

  /* The whole Boi, in a 200 × 220 box. Poses: wave, talk, dance, sleep. */
  function boiArt(pose = "wave") {
    const shadow = `<ellipse cx="100" cy="212" rx="76" ry="7" fill="${NAVY}" opacity=".35"/>`;
    if (pose === "sleep") return `${shadow}
<path d="M24 206 Q26 148 106 146 Q186 148 188 206 Z" fill="${FABRIC}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
${flower(92, 172, 8)}${leaf(106, 182, 30)}${flower(132, 166, 7, HIDE)}${flower(164, 186, 7.5)}${leaf(150, 192, -30)}
<path d="M26 196 Q106 206 186 196 L188 206 Q106 214 24 206 Z" fill="${YELLOW}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
<g transform="translate(-14 114) scale(.78) rotate(-14 100 66)">${boiHeadArt("sleep")}</g>
${zzz(132, 96, 12)}${zzz(152, 70, 16)}${zzz(174, 40, 20)}`;
    const arms = {
      wave: limb("M150 122 Q170 112 174 90", FABRIC) + hoof(175, 84) + limb("M50 122 Q34 134 32 152", FABRIC) + hoof(32, 157)
        + `<path d="M186 74 q7 5 6 14 M192 62 q12 8 10 24" fill="none" stroke="${HIDE}" stroke-width="3.5" stroke-linecap="round"/>`,
      talk: limb("M50 122 Q32 130 28 148", FABRIC) + hoof(27, 153) + limb("M150 122 Q168 130 172 148", FABRIC) + hoof(173, 153),
      dance: limb("M50 120 Q30 108 26 86", FABRIC) + hoof(25, 80) + limb("M150 120 Q170 108 174 86", FABRIC) + hoof(175, 80)
    }[pose] || "";
    const feet = pose === "dance"
      ? `<ellipse cx="78" cy="207" rx="13" ry="7" fill="${SHOE}" stroke="${OUT}" stroke-width="3"/><ellipse cx="132" cy="198" rx="13" ry="7" fill="${SHOE}" stroke="${OUT}" stroke-width="3" transform="rotate(-24 132 198)"/>`
      : `<ellipse cx="80" cy="207" rx="13" ry="7" fill="${SHOE}" stroke="${OUT}" stroke-width="3"/><ellipse cx="120" cy="207" rx="13" ry="7" fill="${SHOE}" stroke="${OUT}" stroke-width="3"/>`;
    let collar = ""; for (let x = 62; x <= 139; x += 12.8) collar += `<circle cx="${r1(x)}" cy="108" r="7.5" fill="${YELLOW}" stroke="${OUT}" stroke-width="2.5"/>`;
    const figure = `${feet}
<path d="M46 108 Q100 92 154 108 Q164 152 176 196 Q100 214 24 196 Q36 152 46 108 Z" fill="${FABRIC}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
${flower(72, 136, 8.5)}${leaf(86, 146, 35)}${flower(126, 128, 7.5, HIDE)}${leaf(112, 136, -30)}${flower(98, 164, 9.5)}${leaf(80, 172, -25)}${flower(146, 168, 7.5, HIDE)}${flower(52, 174, 7.5, HIDE)}${leaf(128, 178, 25)}
<path d="M27 184 Q100 202 173 184 L176 196 Q100 214 24 196 Z" fill="${YELLOW}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
${collar}${arms}
${boiHeadArt(pose === "talk" ? "talk" : "smile")}`;
    return pose === "dance"
      ? `${shadow}<g transform="rotate(-6 100 208)">${figure}</g>${note(18, 52, HIDE)}${note(178, 40, "#FFC98F")}${note(186, 150, HIDE)}`
      : shadow + figure;
  }

  /* Bernúncia, the litter eater of the bull dance, drawn after the team's reference picture: one long yellow body with
     black stripes that runs into a long pointed snout, one round eye, a mouth open like a long V, and two pairs of legs
     (the children inside her). In a 300 × 160 box (y from 20), facing right like the picture.
     States: idle (mouth a little open, as in the picture), open (wide, to eat), chew (closed, eye squeezed happily).
     As she eats, a warm glow grows behind her tummy (fed: 0 to 13; three halo levels, sparkles when full). Her drawing
     itself never changes. animated: every state is drawn, and the page switches them with the classes s-idle, s-open and s-chew. */
  function bernGlow(fed) {
    const k = Math.max(0, Math.min(13, Math.floor(fed) || 0));
    return { fill: k ? Math.round((.3 + .7 * k / 13) * 100) / 100 : 0, r1: k >= 1 ? .5 : 0, r2: k >= 5 ? .34 : 0, r3: k >= 9 ? .22 : 0, sp: k >= 13 ? 1 : 0 };
  }
  let bernIds = 0;   // each drawing gets its own clip-path id, so two Bernúncias on a page never share one
  function bernArt({ state = "idle", fed = 0, animated = false } = {}) {
    const g = bernGlow(fed), id = "bn" + (++bernIds);
    // Mouth states: [state, class, how far the lower jaw opens]. A still drawing has one; an animated one has all three
    const states = [["idle", "bn-closed", 4], ["open", "bn-open", 36], ["chew", "bn-chew", -8]].filter(([st]) => animated || st === state);
    const GOLD = "#F5C13A", GLOW = "#FFF1A6", MOUTH = "#FFFFFF";
    // The body and the upper jaw are one shape, as in the picture; the lower jaw hinges under the eye
    const BODY = "M8 118 C9 92 34 70 92 64 C150 57 214 57 250 58 C266 58 284 54 294 56 C301 57 301 66 293 67 L246 80 C245 92 242 102 234 110 C220 120 150 124 96 124 C60 125 30 124 8 118 Z";
    const JAW = "M246 82 L288 76 Q295 78 292 84 Q288 92 278 94 L238 109 Q234 100 246 82 Z";
    const hx = 246, hy = 80;
    const rp = (x, y, deg) => { const a = deg * Math.PI / 180, dx = x - hx, dy = y - hy; return [r1(hx + dx * Math.cos(a) - dy * Math.sin(a)), r1(hy + dx * Math.sin(a) + dy * Math.cos(a))]; };
    // Black stripes running along the body, as in the picture: they follow the back and stop just before the eye
    const stripes = ["M0 116 C16 90 60 74 110 70 S200 66 224 66", "M4 124 C22 102 66 88 116 85 S200 78 224 77", "M12 130 C34 114 74 101 122 99 S200 90 224 88", "M26 132 C50 122 90 114 130 113 S200 104 222 99"]
      .map(d => `<path d="${d}"/>`).join("");
    // Two pairs of legs, feet pointing forward
    const legs = [[66, 122, 56], [86, 123, 88], [172, 120, 162], [192, 119, 196]].map(([x, top, ax]) =>
      `<path d="M${x} ${top} L${ax} 154" stroke="${OUT}" stroke-width="10" stroke-linecap="round"/><path d="M${ax - 5.5} 150 L${ax + 14} 151 Q${ax + 21} 155.5 ${ax + 14} 160 L${ax - 5.5} 160 Q${ax - 8.5} 155 ${ax - 5.5} 150 Z" fill="${OUT}"/>`).join("");
    const mouth = (cls, deg) => {
      const [lx, ly] = rp(288, 76, deg);
      return `<g class="${cls}"><path d="M${hx} ${hy - 1} L293 66 L${lx} ${ly} Z" fill="${MOUTH}"/><g transform="rotate(${deg} ${hx} ${hy})"><path d="${JAW}" fill="${GOLD}" stroke="${OUT}" stroke-width="3.5" stroke-linejoin="round"/></g></g>`;
    };
    const eye = (cls, happy) => `<g class="${cls}"><circle cx="241" cy="66" r="8" fill="#FFFFFF" stroke="${OUT}" stroke-width="3.5"/>${happy
      ? `<path d="M236 68 Q241 61 246 68" fill="none" stroke="${OUT}" stroke-width="3" stroke-linecap="round"/>`
      : `<circle cx="242.5" cy="66.5" r="3.6" fill="${OUT}"/><circle cx="243.6" cy="65" r="1.2" fill="#FFFFFF"/>`}</g>`;
    const star = (x, y) => `<path d="M${x} ${y - 8} l2.4 5.6 5.6 2.4 -5.6 2.4 -2.4 5.6 -2.4 -5.6 -5.6 -2.4 5.6 -2.4z" fill="#FFFFFF"/>`;
    return `<ellipse cx="150" cy="164" rx="122" ry="6" fill="${NAVY}" opacity=".3"/>
<ellipse data-part="r3" cx="140" cy="104" rx="136" ry="52" fill="${GLOW}" opacity="${g.r3}"/><ellipse data-part="r2" cx="140" cy="106" rx="124" ry="42" fill="${GLOW}" opacity="${g.r2}"/>
<ellipse data-part="r1" cx="140" cy="108" rx="112" ry="32" fill="${GLOW}" opacity="${g.r1}"/><ellipse data-part="fill" cx="140" cy="112" rx="96" ry="20" fill="${GLOW}" opacity="${g.fill}"/>
${legs}
${states.map(([, cls, deg]) => mouth(cls, deg)).join("")}
<clipPath id="${id}"><path d="${BODY}"/></clipPath>
<path d="${BODY}" fill="${GOLD}"/>
<g clip-path="url(#${id})" fill="none" stroke="${OUT}" stroke-width="7.5" stroke-linecap="round">${stripes}</g>
<path d="${BODY}" fill="none" stroke="${OUT}" stroke-width="4.5" stroke-linejoin="round"/>
${states.map(([st, cls]) => eye(cls, st === "chew")).join("")}
<g data-part="sp" opacity="${g.sp}">${star(40, 60)}${star(176, 40)}${star(272, 112)}</g>
${animated ? `<g class="bn-snack"><rect x="263" y="-4" width="24" height="15" rx="3" fill="#E8457A" stroke="${OUT}" stroke-width="2"/><path d="M263 -1 l-6 -4 v17 l6 -4 Z M287 -1 l6 -4 v17 l-6 -4 Z" fill="#C92F63" stroke="${OUT}" stroke-width="1.5" stroke-linejoin="round"/></g>` : ""}`;
  }

  /* Maricota, the very tall woman of the play with long, swinging arms (a cameo in chapter 2), in a 100 × 250 box. */
  function maricotaArt() {
    const SKIN = "#C98559", DRESS = "#A07EFF";
    let dots = ""; for (const [x, y] of [[44, 80], [56, 104], [40, 128], [58, 150], [36, 176], [62, 192], [48, 206]]) dots += `<circle cx="${x}" cy="${y}" r="3.6" fill="${HIDE}"/>`;
    return `<ellipse cx="50" cy="244" rx="36" ry="5" fill="${NAVY}" opacity=".35"/>
<path d="M42 226 V236 M58 226 V236" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
<ellipse cx="39" cy="238" rx="9" ry="5" fill="${PINK}" stroke="${OUT}" stroke-width="2.5"/><ellipse cx="61" cy="238" rx="9" ry="5" fill="${PINK}" stroke="${OUT}" stroke-width="2.5"/>
<path d="M36 56 L64 56 L84 228 Q50 236 16 228 Z" fill="${DRESS}" stroke="${OUT}" stroke-width="4" stroke-linejoin="round"/>
${dots}
<path d="M19 214 Q50 222 81 214 L84 228 Q50 236 16 228 Z" fill="${YELLOW}" stroke="${OUT}" stroke-width="3" stroke-linejoin="round"/>
${limb("M37 62 Q14 112 9 170", SKIN, 6)}<circle cx="9" cy="174" r="6" fill="${SKIN}" stroke="${OUT}" stroke-width="3"/>
${limb("M63 62 Q90 106 93 166", SKIN, 6)}<circle cx="93" cy="170" r="6" fill="${SKIN}" stroke="${OUT}" stroke-width="3"/>
<path d="M30 56 Q50 66 70 56 Q66 50 50 50 Q34 50 30 56 Z" fill="${YELLOW}" stroke="${OUT}" stroke-width="2.5" stroke-linejoin="round"/>
<rect x="45" y="40" width="10" height="14" fill="${SKIN}" stroke="${OUT}" stroke-width="2.5"/>
<circle cx="50" cy="8" r="8" fill="#3A2418" stroke="${OUT}" stroke-width="2.5"/>
<circle cx="50" cy="28" r="17" fill="${SKIN}" stroke="${OUT}" stroke-width="3.5"/>
<path d="M33 27 Q33 10 50 10 Q67 10 67 27 Q60 17 50 17 Q40 17 33 27 Z" fill="#3A2418"/>
${flower(63, 12, 4, PINK)}
<circle cx="44" cy="28" r="5.2" fill="#FFFFFF" stroke="${OUT}" stroke-width="2"/><circle cx="56" cy="28" r="5.2" fill="#FFFFFF" stroke="${OUT}" stroke-width="2"/><circle cx="44.6" cy="29" r="2.8" fill="${OUT}"/><circle cx="56.6" cy="29" r="2.8" fill="${OUT}"/>
<circle cx="39" cy="35" r="3" fill="${PINK}" opacity=".6"/><circle cx="61" cy="35" r="3" fill="${PINK}" opacity=".6"/>
<path d="M45 37 Q50 42 55 37" fill="none" stroke="${OUT}" stroke-width="2.5" stroke-linecap="round"/>`;
  }

  const boi = ({ pose = "wave", label = "", cls = "" } = {}) => `<svg class="${cls}" viewBox="0 0 200 220" ${aria(label)}>${boiArt(pose)}</svg>`;
  const boiHead = ({ mood = "smile", label = "", cls = "" } = {}) => `<svg class="${cls}" viewBox="6 4 188 114" ${aria(label)}>${boiHeadArt(mood)}</svg>`;
  // mirror: facing left instead (towards the Bull, on the choice card and in the finale)
  const bernuncia = ({ state = "idle", fed = 0, animated = false, mirror = false, label = "", cls = "" } = {}) =>
    `<svg class="bern s-${state}${cls ? " " + cls : ""}" viewBox="0 20 300 160" ${aria(label)}>${(mirror ? mirrored : x => x)(bernArt({ state, fed, animated }))}</svg>`;
  // The choice card: the Bull waving, with Bernúncia peeking in behind him
  const boiCard = (label = "") => `<svg viewBox="0 0 240 220" ${aria(label)}><g transform="translate(146 88) scale(.62)">${mirrored(bernArt({}))}</g><g transform="translate(-6 14) scale(.9)">${boiArt("wave")}</g></svg>`;
  // Chapter 2: Maricota is very tall, but Eagle's legs reached the Moon first
  const tallFriends = (label = "") => `<svg viewBox="0 0 300 250" ${aria(label)}><path d="M8 243 H292" stroke="${LAV}" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 8"/>
<g transform="translate(40 0)">${maricotaArt()}</g><g transform="translate(150 104) scale(.64)">${eagleArt({ look: "center" })}</g></svg>`;

  window.ART = { eagle, eagleHead, buddy, BUDDIES, patch, icon, play, scene, frame, bin, sparkles, map, milestone, stack, strip,
    boi, boiHead, bernuncia, bernGlow, boiCard, tallFriends };
})();
