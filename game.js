/* Planet Patrol: a child picks up litter, Spark (the robot) checks it from a photo,
   and every piece unlocks the next of 13 machines people left in space (content.json).
   Everything about the player lives on this phone (localStorage): language, nickname, avatar,
   log and progress, so closing the app never loses anything.
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
  const TOTAL = 13;
  const AVATARS = ["🧑‍🚀", "👽", "🤖", "🦊", "🐢", "🐙", "🦄", "🐝"];
  const LANGS = ["en", "es", "pt"];
  const VOICE = { en: "en-US", es: "es-ES", pt: "pt-BR" };

  /* ---------- Words on the screen, in English, Spanish and Portuguese ---------- */
  const UI = {
    en: {
      appName: "Planet Patrol", player: "Player", language: "Language", changeProfile: "Change my profile", myPoints: "My points",
      demo: "🎈 Demo mode: Spark is pretending to scan. The real game uses AI.",
      kickerScan: "🌍 Earth cleanup mission!", sparkTag: "Spark the cleanup robot",
      dontTouch: "Don't touch it!", callAdult: "Call a grown-up.", sparkSays: "🔎 Spark says", itIs: "It's", goesIn: "Goes in",
      takePhoto: "📷 Take a photo", takeAnother: "📷 Take another photo", looking: "Spark is looking…",
      allPlayers: "Picked up by all players", progress: (n) => `🚀 ${n} of ${TOTAL} spacecraft`, readNew: (s) => `🚀 Read about ${s}`,
      kickerMissions: "🎯 Your space journey", missions: "Missions", missionsSub: (n) => `${n} of ${TOTAL} spacecraft unlocked`,
      chapter0: "Opening", chapterN: (n) => `Chapter ${n}`, locked: "Locked", lockedHint: (k) => k === 1 ? "Pick up 1 more piece" : `Pick up ${k} more pieces`,
      finaleCard: "🎉 The finale", finaleLocked: "Collect all 13 to open the finale",
      kickerLog: "📒 Look how much you did!", myLog: "My log", pieces: "pieces", points: "points", spacecraft: "spacecraft", nothingYet: "Nothing yet. Take your first photo!",
      navScan: "Scan", navMissions: "Missions", navLog: "Log",
      kickerIntro: "🚀 A NASA Space Apps game", chooseLang: "Choose your language", begin: "▶ Begin", kickerStory: "📖 Before we start", didYouKnow: "💡 Did you know?", letsGo: "Let's go!",
      kickerProfile: "🚀 Join the patrol!", whatName: "What should we call you?", noRealName: "Make up a nickname. Don't use your real name.", nickname: "Nickname", nickHint: "e.g. Comet Rider", pickAvatar: "Pick your avatar", ready: "Ready!",
      kickerSafety: "🦺 Safety first", beforeStart: "Before you start", imReady: "I'm ready!", notNow: "Not now",
      unlocked: "🎉 New spacecraft unlocked!", awardText: (n) => `Piece number ${n}! You unlocked a new machine in space.`, readStory: "🚀 Read the story", keepCleaning: "Keep cleaning",
      close: "Close", findNext: "📷 Find the next piece", seeFinale: "🎉 See the finale", source: "Source:",
      sec: { where: "Where it is now", was: "What it was", left: "What was left behind", did: "What it did", why: "Why it was left there", help: "Still helping us" },
      kickerFinale: "🏆 You did it!", finaleCount: (n) => `You collected ${n} pieces of litter!`,
      listen: "🔊 Listen", stop: "⏹ Stop",
      bodies: { moon: "Moon", mars: "Mars", eros: "Eros", ceres: "Ceres", sun: "Sun", deep: "Deep space", earth: "You" },
      type: { plastic: "Plastic", can: "Can", paper_cardboard: "Paper or cardboard", glass: "Glass", organic: "Food scraps", batteries_electronics: "Batteries or electronics", chemicals: "Chemicals", sharp_object: "Something sharp", other: "Litter", none: "Not litter" },
      bin: { white: "White bin", green: "Green bin", black: "Black bin", special_dropoff: "Special drop-off", none: "None" },
      says: { idle: "Hi! I'm Spark. Find some litter and take a photo of it.", think: "Hmm… let me look…", yes: "Yes, that's litter! Well done.", no: "That's not litter.", unsure: "I'm not sure. Try another photo.", danger: "Careful! Don't touch it." },
      errors: { generic: "Something went wrong. Try again.", photo: "I couldn't open that photo. Try another one.", offline: "No connection. Try again." },
      points: "points", pointsEarned: (p) => `+${p} points`
    },
    es: {
      appName: "Patrulla Planeta", player: "Jugador", language: "Idioma", changeProfile: "Cambiar mi perfil", myPoints: "Mis puntos",
      demo: "🎈 Modo demo: Spark finge escanear. El juego de verdad usa IA.",
      kickerScan: "🌍 ¡Misión limpieza de la Tierra!", sparkTag: "Spark, el robot limpiador",
      dontTouch: "¡No lo toques!", callAdult: "Llama a un adulto.", sparkSays: "🔎 Spark dice", itIs: "Es", goesIn: "Va en",
      takePhoto: "📷 Tomar foto", takeAnother: "📷 Tomar otra foto", looking: "Spark está mirando…",
      allPlayers: "Recogidos por todos", progress: (n) => `🚀 ${n} de ${TOTAL} naves`, readNew: (s) => `🚀 Leer sobre ${s}`,
      kickerMissions: "🎯 Tu viaje espacial", missions: "Misiones", missionsSub: (n) => `${n} de ${TOTAL} naves desbloqueadas`,
      chapter0: "Inicio", chapterN: (n) => `Capítulo ${n}`, locked: "Bloqueado", lockedHint: (k) => k === 1 ? "Recoge 1 pedazo más" : `Recoge ${k} pedazos más`,
      finaleCard: "🎉 El gran final", finaleLocked: "Junta las 13 para abrir el final",
      kickerLog: "📒 ¡Mira todo lo que hiciste!", myLog: "Mi registro", pieces: "pedazos", points: "puntos", spacecraft: "naves", nothingYet: "Todavía nada. ¡Toma tu primera foto!",
      navScan: "Escanear", navMissions: "Misiones", navLog: "Registro",
      kickerIntro: "🚀 Un juego de NASA Space Apps", chooseLang: "Elige tu idioma", begin: "▶ Empezar", kickerStory: "📖 Antes de empezar", didYouKnow: "💡 ¿Sabías que…?", letsGo: "¡Vamos!",
      kickerProfile: "🚀 ¡Únete a la patrulla!", whatName: "¿Cómo te llamamos?", noRealName: "Inventa un apodo. No uses tu nombre real.", nickname: "Apodo", nickHint: "Ej.: Estrella Veloz", pickAvatar: "Elige tu avatar", ready: "¡Listo!",
      kickerSafety: "🦺 Primero la seguridad", beforeStart: "Antes de empezar", imReady: "¡Estoy listo!", notNow: "Ahora no",
      unlocked: "🎉 ¡Nueva nave desbloqueada!", awardText: (n) => `¡Pedazo número ${n}! Desbloqueaste una nueva máquina en el espacio.`, readStory: "🚀 Leer la historia", keepCleaning: "Seguir limpiando",
      close: "Cerrar", findNext: "📷 Buscar el siguiente pedazo", seeFinale: "🎉 Ver el final", source: "Fuente:",
      sec: { where: "Dónde está ahora", was: "Qué era", left: "Qué dejaron allí", did: "Qué hizo", why: "Por qué se quedó allí", help: "Todavía nos ayuda" },
      kickerFinale: "🏆 ¡Lo lograste!", finaleCount: (n) => `¡Recogiste ${n} pedazos de basura!`,
      listen: "🔊 Escuchar", stop: "⏹ Parar",
      bodies: { moon: "Luna", mars: "Marte", eros: "Eros", ceres: "Ceres", sun: "Sol", deep: "Espacio profundo", earth: "Tú" },
      type: { plastic: "Plástico", can: "Lata", paper_cardboard: "Papel o cartón", glass: "Vidrio", organic: "Restos de comida", batteries_electronics: "Pilas o electrónicos", chemicals: "Químicos", sharp_object: "Algo cortante", other: "Basura", none: "No es basura" },
      bin: { white: "Caneca blanca", green: "Caneca verde", black: "Caneca negra", special_dropoff: "Punto especial", none: "Ninguna" },
      says: { idle: "¡Hola! Soy Spark. Encuentra basura y tómale una foto.", think: "Mmm… déjame mirar…", yes: "¡Sí es basura! Bien hecho.", no: "Eso no es basura.", unsure: "No estoy seguro. Prueba con otra foto.", danger: "¡Cuidado! No lo toques." },
      errors: { generic: "Algo falló. Intenta otra vez.", photo: "No pude abrir esa foto. Prueba con otra.", offline: "No hay conexión. Intenta otra vez." },
      pointsEarned: (p) => `+${p} puntos`
    },
    pt: {
      appName: "Patrulha Planeta", player: "Jogador", language: "Idioma", changeProfile: "Mudar meu perfil", myPoints: "Meus pontos",
      demo: "🎈 Modo demo: o Spark está fingindo escanear. O jogo de verdade usa IA.",
      kickerScan: "🌍 Missão limpeza da Terra!", sparkTag: "Spark, o robô da limpeza",
      dontTouch: "Não toque!", callAdult: "Chame um adulto.", sparkSays: "🔎 O Spark diz", itIs: "É", goesIn: "Vai no",
      takePhoto: "📷 Tirar foto", takeAnother: "📷 Tirar outra foto", looking: "O Spark está olhando…",
      allPlayers: "Recolhidos por todos", progress: (n) => `🚀 ${n} de ${TOTAL} naves`, readNew: (s) => `🚀 Ler sobre ${s}`,
      kickerMissions: "🎯 Sua viagem espacial", missions: "Missões", missionsSub: (n) => `${n} de ${TOTAL} naves desbloqueadas`,
      chapter0: "Abertura", chapterN: (n) => `Capítulo ${n}`, locked: "Bloqueado", lockedHint: (k) => k === 1 ? "Recolha mais 1 lixo" : `Recolha mais ${k} lixos`,
      finaleCard: "🎉 O grande final", finaleLocked: "Junte as 13 para abrir o final",
      kickerLog: "📒 Veja tudo o que você fez!", myLog: "Meu registro", pieces: "lixos", points: "pontos", spacecraft: "naves", nothingYet: "Nada ainda. Tire sua primeira foto!",
      navScan: "Escanear", navMissions: "Missões", navLog: "Registro",
      kickerIntro: "🚀 Um jogo do NASA Space Apps", chooseLang: "Escolha seu idioma", begin: "▶ Começar", kickerStory: "📖 Antes de começar", didYouKnow: "💡 Você sabia?", letsGo: "Vamos!",
      kickerProfile: "🚀 Entre na patrulha!", whatName: "Como vamos te chamar?", noRealName: "Invente um apelido. Não use seu nome de verdade.", nickname: "Apelido", nickHint: "Ex.: Cometa Veloz", pickAvatar: "Escolha seu avatar", ready: "Pronto!",
      kickerSafety: "🦺 Segurança primeiro", beforeStart: "Antes de começar", imReady: "Estou pronto!", notNow: "Agora não",
      unlocked: "🎉 Nova nave desbloqueada!", awardText: (n) => `Lixo número ${n}! Você desbloqueou uma nova máquina no espaço.`, readStory: "🚀 Ler a história", keepCleaning: "Continuar limpando",
      close: "Fechar", findNext: "📷 Procurar o próximo lixo", seeFinale: "🎉 Ver o final", source: "Fonte:",
      sec: { where: "Onde está agora", was: "O que era", left: "O que ficou lá", did: "O que fez", why: "Por que ficou lá", help: "Ainda nos ajuda" },
      kickerFinale: "🏆 Você conseguiu!", finaleCount: (n) => `Você recolheu ${n} lixos!`,
      listen: "🔊 Ouvir", stop: "⏹ Parar",
      bodies: { moon: "Lua", mars: "Marte", eros: "Eros", ceres: "Ceres", sun: "Sol", deep: "Espaço profundo", earth: "Você" },
      type: { plastic: "Plástico", can: "Lata", paper_cardboard: "Papel ou papelão", glass: "Vidro", organic: "Restos de comida", batteries_electronics: "Pilhas ou eletrônicos", chemicals: "Produtos químicos", sharp_object: "Algo cortante", other: "Lixo", none: "Não é lixo" },
      bin: { white: "Lixeira branca", green: "Lixeira verde", black: "Lixeira preta", special_dropoff: "Ponto especial", none: "Nenhuma" },
      says: { idle: "Oi! Eu sou o Spark. Encontre um lixo e tire uma foto dele.", think: "Hmm… deixa eu ver…", yes: "Sim, é lixo! Muito bem.", no: "Isso não é lixo.", unsure: "Não tenho certeza. Tente outra foto.", danger: "Cuidado! Não toque." },
      errors: { generic: "Algo deu errado. Tente de novo.", photo: "Não consegui abrir essa foto. Tente outra.", offline: "Sem conexão. Tente de novo." },
      pointsEarned: (p) => `+${p} pontos`
    }
  };

  /* ---------- State ---------- */
  let lang = LANGS.includes(load("lang", "en")) ? load("lang", "en") : "en";
  let profile = load("profile", null);       // { nick, avatar }
  let log = load("log", []);                  // [{ date, day, type, points, dangerous }]
  let announced = load("announced", 0);       // how many spacecraft the player has already been told about
  let C = null;                               // content.json
  let robotState = "idle", robotText = null;
  const t = () => UI[lang];
  const L = obj => (obj && (obj[lang] || obj.en)) || {};

  /* ---------- Demo mode (?demo in the address): no server, no AI. Spark pretends, and the page says so. ---------- */
  const DEMO = /[?&]demo\b/.test(location.search);
  const DEMO_RESULTS = [
    { photo_problem: "none", is_trash: "yes", type: "plastic", bin: "white", dangerous: false, message: { en: "A plastic bottle! It goes in the white bin.", es: "¡Una botella de plástico! Va en la caneca blanca.", pt: "Uma garrafa de plástico! Vai na lixeira branca." } },
    { photo_problem: "none", is_trash: "yes", type: "can", bin: "white", dangerous: false, message: { en: "A can! Great catch.", es: "¡Una lata! Muy bien.", pt: "Uma lata! Boa pegada." } },
    { photo_problem: "none", is_trash: "yes", type: "glass", bin: "special_dropoff", dangerous: true, message: { en: "Don't touch it! That's broken glass. Call a grown-up.", es: "¡No lo toques! Es vidrio roto. Llama a un adulto.", pt: "Não toque! É vidro quebrado. Chame um adulto." } },
    { photo_problem: "none", is_trash: "no", type: "none", bin: "none", dangerous: false, message: { en: "That's a leaf. Leaves aren't litter!", es: "Es una hoja. ¡Las hojas no son basura!", pt: "É uma folha. Folhas não são lixo!" } },
    { photo_problem: "none", is_trash: "yes", type: "paper_cardboard", bin: "white", dangerous: false, message: { en: "A paper cup! Into the white bin it goes.", es: "¡Un vaso de papel! A la caneca blanca.", pt: "Um copo de papel! Para a lixeira branca." } },
    { photo_problem: "screen", is_trash: "no", type: "none", bin: "none", dangerous: false, message: { en: "That looks like a screen. Take a photo of the real object!", es: "Eso parece una pantalla. ¡Toma una foto del objeto de verdad!", pt: "Isso parece uma tela. Tire uma foto do objeto de verdade!" } },
    { photo_problem: "none", is_trash: "yes", type: "plastic", bin: "white", dangerous: false, message: { en: "A plastic bag! Good job.", es: "¡Una bolsa plástica! Buen trabajo.", pt: "Uma sacola plástica! Bom trabalho." } }
  ];
  let demoN = 0, demoTotal = 0;
  async function demoScan() {
    await new Promise(r => setTimeout(r, 1200));
    const d = DEMO_RESULTS[demoN++ % DEMO_RESULTS.length];
    const result = { ...d, message: d.message[lang] };
    const retake = result.photo_problem !== "none", counts = !retake && result.is_trash === "yes";
    return { result, retake, counts, total: counts ? ++demoTotal : null };
  }

  /* ---------- Language ---------- */
  function applyLang() {
    const u = t();
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(e => { const v = u[e.dataset.i18n]; if (typeof v === "string") e.textContent = v; });
    document.querySelectorAll("[data-i18n-label]").forEach(e => { const v = u[e.dataset.i18nLabel]; if (typeof v === "string") e.setAttribute("aria-label", v); });
    document.querySelectorAll("[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    $("langBtn").textContent = lang.toUpperCase();
    $("nick").placeholder = u.nickHint;
    paintProfile();
    document.title = u.appName;
    if (!snap.disabled) snap.textContent = log.length ? u.takeAnother : u.takePhoto;
    if (C) { $("safetyNote").textContent = "🧤 " + L(C.intro).safety; paintIntro(); }
    robot(robotState, robotText);
    paintListen();
    paintAll();
  }
  function setLang(l) { lang = l; save("lang", l); stopSpeech(); applyLang(); }
  $("langBtn").onclick = () => setLang(LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]);
  document.querySelectorAll("[data-lang]").forEach(b => { b.onclick = () => setLang(b.dataset.lang); });

  /* ---------- Narrator: the browser reads the text aloud, where it can ---------- */
  const canSpeak = "speechSynthesis" in window && typeof SpeechSynthesisUtterance === "function";
  let speaking = null;
  function stopSpeech() { if (canSpeak) speechSynthesis.cancel(); speaking = null; paintListen(); }
  function speak(key, texts) {
    if (!canSpeak) return;
    if (speaking === key) { stopSpeech(); return; }
    speechSynthesis.cancel(); speaking = key; paintListen();
    texts.filter(Boolean).forEach((tx, i, all) => {
      const u = new SpeechSynthesisUtterance(tx); u.lang = VOICE[lang]; u.rate = 0.95;
      if (i === all.length - 1) u.onend = () => { if (speaking === key) { speaking = null; paintListen(); } };
      speechSynthesis.speak(u);
    });
  }
  function paintListen() {
    document.querySelectorAll(".listen").forEach(b => { b.hidden = !canSpeak; b.textContent = speaking === b.dataset.speak ? t().stop : t().listen; });
  }
  document.querySelectorAll(".listen").forEach(b => { b.onclick = () => speak(b.dataset.speak, speechTexts[b.dataset.speak] ? speechTexts[b.dataset.speak]() : []); });
  let currentChapter = 0;
  const speechTexts = {
    intro: () => { const i = L(C.intro); return [i.title, ...i.script, i.hook, i.pickup]; },
    chapter: () => { const c = L(C.chapters[currentChapter - 1]); return [c.title, ...c.sections.map(s => s.t || (s.list || []).join(" ")), c.hook, c.pickup]; },
    finale: () => { const f = L(C.finale); return [f.title, ...f.script]; }
  };

  /* ---------- Robot ---------- */
  function robot(state, text) {
    robotState = state; robotText = text || null;
    $("robot").className = "robot r-" + state;
    $("says").textContent = text || t().says[state];
  }

  /* ---------- Confetti ---------- */
  function confetti() {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = $("confetti"), colors = ["#FF7A1A", "#FFC93C", "#2FBF71", "#3D8BFF", "#FF7DB0", "#9B6BFF"];
    for (let i = 0; i < 60; i++) {
      const c = el("i"); c.style.left = Math.random() * 100 + "%"; c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s"; c.style.animationDelay = Math.random() * .4 + "s"; box.appendChild(c);
    }
    setTimeout(() => { box.textContent = ""; }, 3800);
  }

  /* ---------- Opening ---------- */
  function openIntro(storyOnly) {
    $("introStart").hidden = !!storyOnly; $("introStory").hidden = !storyOnly;
    paintIntro();
    if (!$("intro").open) $("intro").showModal();
  }
  function paintIntro() {
    if (!C) return;
    const i = L(C.intro);
    $("introStoryTitle").textContent = i.title;
    const box = $("introScript"); box.textContent = ""; i.script.forEach(p => box.appendChild(el("p", "", p)));
    $("introHook").textContent = i.hook; $("introPickup").textContent = i.pickup;
  }
  $("beginBtn").onclick = () => { $("introStart").hidden = true; $("introStory").hidden = false; $("introStory").scrollIntoView({ block: "start" }); };
  $("letsGo").onclick = () => { save("introDone", true); stopSpeech(); $("intro").close(); if (!profile) openProfile(); };
  $("intro").addEventListener("cancel", e => { if (!load("introDone", false)) e.preventDefault(); });

  /* ---------- Profile: just a nickname and an avatar ---------- */
  function paintProfile() {
    $("pAvatar").textContent = profile ? profile.avatar : "🙂";
    $("pName").textContent = profile ? profile.nick : t().player;
  }
  function openProfile() {
    const box = $("avatars"); box.textContent = "";
    let picked = (profile && profile.avatar) || AVATARS[0];
    AVATARS.forEach(a => {
      const b = el("button", "", a); b.type = "button"; b.setAttribute("role", "radio"); b.setAttribute("aria-label", a);
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
    paintAll();
    window.scrollTo(0, 0);
  }
  document.querySelectorAll(".menu button").forEach(b => { b.onclick = () => show(b.dataset.view); });
  $("progressChip").onclick = () => show("missions");

  /* ---------- Photo: shrink it (≤ 1024 px, JPEG) on the phone ---------- */
  function shrink(file) {
    return new Promise((ok, fail) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("photo")); };
      img.src = url;
    });
  }

  /* ---------- Scan ---------- */
  const snap = $("snap"), file = $("file");
  snap.onclick = () => {
    if (!profile) { openProfile(); return; }
    if (!load("safetySeen", false)) { $("safetyText").textContent = L(C && C.intro).safety || ""; $("safety").showModal(); return; }
    file.click();
  };
  // The camera has to open straight from this tap, so it is not routed through the dialog's close event.
  $("safetyOk").onclick = () => { save("safetySeen", true); $("safety").close(); file.click(); };
  $("safetyLater").onclick = () => $("safety").close();

  file.onchange = async () => {
    const f = file.files && file.files[0];
    file.value = "";
    if (!f) return;
    $("alert").hidden = true; $("result").hidden = true; $("rPoints").textContent = ""; $("readNew").hidden = true;
    snap.disabled = true; snap.textContent = t().looking;
    robot("think");
    try {
      const image = await shrink(f);
      $("photoImg").src = image; $("photo").hidden = false;
      if (DEMO) { showResult(await demoScan()); return; }
      const r = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, lang }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { robot("no", j.error || t().errors.generic); return; }
      showResult(j);
    } catch (e) {
      robot("no", e.message === "photo" ? t().errors.photo : t().errors.offline);
    } finally {
      // The photo is only on screen until the next one; it is never saved.
      snap.disabled = false; snap.textContent = t().takeAnother;
    }
  };

  function showResult(j) {
    const r = j.result || {}, u = t();
    window.scrollTo({ top: 0, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    if (typeof j.total === "number") $("global").textContent = j.total.toLocaleString(lang);
    if (j.retake) { robot("unsure", r.message); return; }   // screen, people or blurry: doesn't count
    if (r.dangerous) { robot("danger", r.message || u.says.danger); $("alert").hidden = false; }
    else if (r.is_trash === "yes") robot("yes", r.message);
    else if (r.is_trash === "unsure") robot("unsure", r.message);
    else robot("no", r.message);

    $("rType").textContent = u.type[r.type] || "—";
    const b = $("rBin"); b.textContent = u.bin[r.bin] || "—"; b.className = "bin " + (r.bin || "");
    $("result").hidden = false;

    // Points: litter = 10. Dangerous litter too (the child did the right thing by telling a grown-up).
    const points = j.counts ? TRASH_POINTS : 0;
    log.push({ date: new Date().toISOString(), day: localDay(), type: r.type || "other", points, dangerous: !!r.dangerous });
    if (log.length > 1000) log = log.slice(-1000);
    save("log", log);
    if (points) $("rPoints").textContent = u.pointsEarned(points);
    paintAll();
    checkUnlocks();
  }
  const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  /* ---------- Progress: one piece of litter = one more spacecraft ---------- */
  const pickedUp = () => log.filter(x => x.points > 0);
  const totalPoints = () => log.reduce((s, x) => s + (x.points || 0), 0);
  const unlockedCount = () => Math.min(TOTAL, pickedUp().length);

  function checkUnlocks() {
    const n = unlockedCount();
    if (!C || n <= announced) return;
    announced = n; save("announced", n);
    const ch = C.chapters[n - 1], c = L(ch);
    $("awardBadge").textContent = ch.badge;
    $("t-award").textContent = `#${n} ${c.short}`;
    $("awardText").textContent = t().awardText(n);
    const rn = $("readNew"); rn.textContent = t().readNew(c.short); rn.hidden = false; rn.onclick = () => openChapter(n);
    const d = $("award");
    d.onclose = () => { if (d.returnValue === "story") openChapter(n); };
    d.returnValue = "";
    d.showModal();
    confetti();
  }

  /* ---------- A chapter ---------- */
  function openChapter(n) {
    if (!C || n < 1 || n > unlockedCount()) return;
    stopSpeech();
    currentChapter = n;
    const ch = C.chapters[n - 1], c = L(ch), u = t();
    $("cKicker").textContent = `${u.chapterN(n)} · ${c.tag}`;
    const art = $("cArt"); art.textContent = "";
    if (ch.image && /^(https:\/\/|img\/)/.test(ch.image)) { const im = el("img"); im.src = ch.image; im.alt = c.title; art.appendChild(im); }
    else art.appendChild(el("span", "chapterBadge body-" + ch.body, ch.badge));
    $("cTitle").textContent = c.title;
    const body = $("cBody"); body.textContent = "";
    c.sections.forEach(s => {
      body.appendChild(el("h3", "", s.h || u.sec[s.k] || ""));
      if (s.list) { const ul = el("ul"); s.list.forEach(x => ul.appendChild(el("li", "", x))); body.appendChild(ul); }
      else body.appendChild(el("p", "", s.t));
    });
    $("cHook").textContent = c.hook;
    $("cSource").textContent = `${u.source} ${c.source}`;
    $("cPickup").textContent = c.pickup;
    const last = n === TOTAL;
    $("cNext").textContent = last ? u.seeFinale : u.findNext;
    $("cNext").onclick = () => { $("chapter").close(); if (last) openFinale(); else { show("scan"); } };
    $("cClose").onclick = () => $("chapter").close();
    $("chapter").onclose = () => { stopSpeech(); if (last && !load("finaleSeen", false)) openFinale(); };
    $("chapter").showModal();
    $("chapter").scrollTop = 0;
  }

  /* ---------- Finale ---------- */
  function openFinale() {
    if (!C || unlockedCount() < TOTAL) return;
    save("finaleSeen", true);
    stopSpeech();
    const f = L(C.finale);
    $("fTitle").textContent = f.title;
    const box = $("fScript"); box.textContent = ""; f.script.forEach(p => box.appendChild(el("p", "", p)));
    $("fCount").textContent = t().finaleCount(pickedUp().length);
    paintBadges($("fBadges"));
    drawMap($("mapFinale"), false);
    $("fClose").onclick = () => $("finale").close();
    $("finale").onclose = stopSpeech;
    if (!$("finale").open) $("finale").showModal();
    confetti();
  }

  /* ---------- The map of the 13 resting places ---------- */
  const SPOTS = { 1: [116, 52], 2: [146, 48], 3: [120, 80], 4: [150, 76], 5: [338, 186], 6: [232, 128], 7: [256, 116], 8: [186, 188], 9: [280, 128], 10: [70, 84], 11: [316, 50], 12: [242, 160], 13: [272, 162] };
  const NS = "http://www.w3.org/2000/svg";
  const sv = (tag, attrs, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; return e; };
  function drawMap(box, interactive) {
    const u = t(), n = unlockedCount();
    box.textContent = "";
    const s = sv("svg", { viewBox: "0 0 360 230", class: "map", role: "img", "aria-label": u.missionsSub(n) });
    s.appendChild(sv("rect", { x: 2, y: 2, width: 356, height: 226, rx: 22, class: "mapSky" }));
    [[20, 20], [200, 24], [300, 210], [24, 200], [180, 110], [340, 110]].forEach(([x, y]) => s.appendChild(sv("circle", { cx: x, cy: y, r: 1.8, class: "mapStar" })));
    s.appendChild(sv("circle", { cx: 34, cy: 120, r: 50, class: "orbit" }));
    s.appendChild(sv("circle", { cx: 34, cy: 120, r: 22, class: "sun" }));
    s.appendChild(sv("circle", { cx: 133, cy: 64, r: 36, class: "moonB" }));
    s.appendChild(sv("circle", { cx: 256, cy: 140, r: 44, class: "marsB" }));
    s.appendChild(sv("path", { d: "M174 188 q4 -12 14 -8 q12 -2 10 10 q-2 10 -14 8 q-12 2 -10 -10z", class: "rock" }));
    s.appendChild(sv("circle", { cx: 316, cy: 50, r: 15, class: "ceresB" }));
    s.appendChild(sv("path", { d: "M300 110 Q330 140 352 210", class: "trail" }));
    s.appendChild(sv("circle", { cx: 100, cy: 190, r: 16, class: "earthB" }));
    const label = (x, y, txt, anchor = "middle") => s.appendChild(sv("text", { x, y, class: "mapLbl", "text-anchor": anchor }, txt));
    label(34, 160, u.bodies.sun); label(133, 116, u.bodies.moon); label(256, 200, u.bodies.mars); label(186, 214, u.bodies.eros);
    label(316, 80, u.bodies.ceres); label(350, 222, u.bodies.deep, "end"); label(100, 222, "🌍 " + u.bodies.earth);
    for (let i = 1; i <= TOTAL; i++) {
      const [x, y] = SPOTS[i], open = i <= n, c = C ? L(C.chapters[i - 1]) : {};
      const g = sv("g", { class: "pin" + (open ? " open" : "") });
      g.appendChild(sv("title", {}, open ? `${i}. ${c.short} · ${c.place}` : `${i}. ${u.locked}`));
      g.appendChild(sv("circle", { cx: x, cy: y, r: 11 }));
      g.appendChild(sv("text", { x, y: y + 4.5, "text-anchor": "middle" }, String(i)));
      if (interactive && open) {
        g.setAttribute("tabindex", "0"); g.setAttribute("role", "button"); g.setAttribute("aria-label", `${i}. ${c.short}`);
        g.addEventListener("click", () => openChapter(i));
        g.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openChapter(i); } });
      }
      s.appendChild(g);
    }
    box.appendChild(s);
  }

  /* ---------- Painting ---------- */
  function paintBadges(box) {
    box.textContent = "";
    const n = unlockedCount();
    (C ? C.chapters : []).slice(0, n).forEach(ch => { const b = el("span", "badgeDot", ch.badge); b.title = L(ch).short; box.appendChild(b); });
  }
  function paintAll() {
    const u = t(), n = unlockedCount();
    $("myPoints").textContent = totalPoints();
    $("progressText").textContent = u.progress(n);
    $("progressBar").style.width = (100 * n / TOTAL) + "%";
    if (!C) return;
    // Missions: opening + 13 chapters + finale
    $("missionsSub").textContent = u.missionsSub(n);
    drawMap($("mapMissions"), true);
    const ul = $("chapterList"); ul.textContent = "";
    const card = (badge, title, small, open, onClick, extra) => {
      const li = el("li"), b = el("button", "storyBtn" + (open ? "" : " closed") + (extra || "")); b.type = "button";
      b.appendChild(el("span", "badgeDot", open ? badge : "🔒"));
      const tx = el("div", "txt"); tx.appendChild(el("b", "", title)); tx.appendChild(el("small", "", small)); b.appendChild(tx);
      b.disabled = !open; if (open) b.onclick = onClick;
      li.appendChild(b); ul.appendChild(li);
    };
    card("💩", L(C.intro).title, u.chapter0, true, () => openIntro(true));
    C.chapters.forEach((ch, i) => {
      const k = i + 1, open = k <= n, c = L(ch);
      card(ch.badge, open ? c.title : `${u.chapterN(k)} · ${u.locked}`, open ? `${u.chapterN(k)} · ${c.tag}` : u.lockedHint(k - pickedUp().length), open, () => openChapter(k));
    });
    card("🏆", u.finaleCard, n >= TOTAL ? L(C.finale).title : u.finaleLocked, n >= TOTAL, openFinale, " finaleCard");
    // Log
    $("logItems").textContent = pickedUp().length;
    $("logPoints").textContent = totalPoints();
    $("logShips").textContent = n;
    paintBadges($("badges"));
    const ll = $("logList"); ll.textContent = "";
    if (!log.length) { ll.appendChild(el("li", "empty", u.nothingYet)); return; }
    log.slice(-30).reverse().forEach(x => {
      const li = el("li"), d = new Date(x.date);
      li.appendChild(el("span", "", `${d.toLocaleDateString(lang, { day: "numeric", month: "short" })} · ${u.type[x.type] || x.type}${x.dangerous ? " ⚠️" : ""}`));
      li.appendChild(el("span", "pts", x.points ? `+${x.points}` : "0"));
      ll.appendChild(li);
    });
  }

  /* ---------- Start ---------- */
  async function start() {
    $("demoBanner").hidden = !DEMO;
    paintProfile();
    try { const r = await fetch("content.json", { cache: "no-cache" }); if (r.ok) C = await r.json(); } catch { C = null; }
    applyLang();
    // Someone who already had pieces before this version: don't replay every unlock.
    if (announced > unlockedCount()) { announced = unlockedCount(); save("announced", announced); }
    if (!DEMO) fetch("/api/counter").then(r => r.ok ? r.json() : null).then(j => { if (j && typeof j.total === "number") $("global").textContent = j.total.toLocaleString(lang); }).catch(() => {});
    if (!load("introDone", false)) openIntro(false);
    else if (!profile) openProfile();
  }
  start();
})();
