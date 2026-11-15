/* debris: pick up litter on Earth and unlock the stories of 13 machines people left in space.
   The screens follow the design canvas "Debris App Screens". The story is the team's storyboard,
   "Abandoned but Not Forgotten" (content.json, from docs/abandoned-but-not-forgotten-storyboard.md).
   One round: scan a piece of litter → hear the next chapter → bin it → earn that chapter's patch.
   Two storytellers tell the same facts: the Space Explorer (the storyboard) or the Boi de Mamão (boi.json, the team's spec
   "Boi de Mamão Storyteller"). With the Boi: scan → bin it → Bernúncia eats the piece → the explorer wakes → its chapter.
   Everything about the player stays on this phone (localStorage), so closing the app loses nothing.
   Photos are shrunk, sent once to the scanner (/api/scan) and forgotten.
   ?demo in the address: no server and no AI, Eagle pretends to scan (handy for showing the app). */
(function () {
  "use strict";
  const A = window.ART;
  const TOTAL = 13;
  const LANGS = ["en", "es", "pt"];
  const BINS = ["white", "green", "black", "special_dropoff"];
  const DEMO = /[?&]demo\b/.test(location.search);
  /* In demo mode the Impact screen shows sample data, labelled "Demo data": 1,284 pieces (the spec's worked example), or ?total=N. */
  const demoParam = DEMO && /[?&]total=(\d{1,12})(?:&|$)/.exec(location.search);
  let demoTotal = demoParam ? Number(demoParam[1]) : 1284;
  const app = document.getElementById("app");

  /* ---------- Saving on this phone (if the browser blocks it, the game still works without saving) ---------- */
  const PREFIX = DEMO ? "debris.demo." : "debris.";
  const KEYS = ["lang", "profile", "binned", "log", "pending", "lastNew", "introDone", "safetyDone", "finaleSeen", "jacketSeen", "tickets", "teller", "tellerChosen"];
  const load = (k, d) => { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {} };

  /* ---------- Words on the screen, in English, Spanish and Portuguese ---------- */
  const UI = {
    en: {
      langName: "English",
      demo: "Demo mode: Eagle pretends to scan, so you can try every screen. The real game uses AI.",
      back: "Back", menu: "Menu", listen: "Listen", stop: "Stop",
      nav: { home: "Home", jacket: "Jacket", impact: "Impact", me: "Me" },
      welcome: { mascot: "Eagle the lander, the debris mascot", tagline: "Every piece left behind has a story.", body: "Pick up litter on Earth. Unlock the stories of the machines we left on the Moon and Mars.", go: "Let's go!", grownups: "For grown-ups", language: "Language" },
      opening: { kicker: "The story begins", hook: "Did you know?", go: "I'm ready!" },
      safety: { bubble: "Hi, I'm Eagle! Four quick rules before we explore.", title: "Stay safe out there", go: "Got it!",
        rules: [["Gloves on", "Or use a litter picker."], ["Bring a grown-up", "Stay where they can see you."], ["Sharp or broken? Don't touch", "Glass, needles, metal: ask an adult."], ["Photos aren't kept", "We check each photo, then delete it. No faces, please."]] },
      profile: { title: "What should we call you?", sub: "Pick a space nickname. Don't use your real name.", nick: "Nickname", nickMissing: "Type a nickname first.", buddy: "Choose your crew buddy", privacy: "Your nickname and buddy stay on this phone. No account, no email.", go: "Ready!",
        names: ["MoonWalker", "StarHopper", "CometKid", "RocketFox", "OrbitRider", "Stardust"] },
      home: { title: "Home", patches: "{n} of {total}", patchesLabel: "{n} of {total} patches. Open my jacket", meLabel: "My profile: {nick}", jacket: "My explorer jacket",
        toGo: { one: "1 patch to go", other: "{n} patches to go" }, allDone: "Every patch earned!", counter: "Kids everywhere have picked up {n} pieces of litter.", schools: "Bring debris to your school or your next beach cleanup!",
        scan: "Scan litter", holding: "You're holding: {item}", holdingSub: "Bin it to earn your next patch.", binNow: "Bin my litter", finale: "See the finale", finaleSub: "All 13 patches are on your jacket." },
      steps: { names: ["Scan", "Story", "Bin it", "Patch"], label: "Step {i} of 4: {name}" },
      stepsBoi: ["Scan", "Bin it", "Wake up", "Story"],
      teller: { chooseTitle: "Choose your storyteller", optionSpace: "Space Explorer", optionBoi: "The Bull", boiTag: "From Florianópolis", go: "Let's go!", settingLabel: "Storyteller",
        credit: "Inspired by the traditional bull dance of Florianópolis and Santa Catarina." },
      scan: { close: "Close and go home", hint: "Fit one piece of litter inside the frame", shutter: "Take the photo", privacy: "No people or faces in the photo. We check it, then delete it.",
        looking: "Eagle is looking…", noCamera: "Tap the button to take a photo with your camera.", choose: "Choose a photo instead", starting: "Starting the camera…" },
      found: { back: "Back to the camera", safe: "Litter · safe to pick up", photoAlt: "Your photo",
        goes: { white: "Goes in the white bin (recycling). Hold on to it for now.", green: "Goes in the green bin (food scraps). Hold on to it for now.", black: "Goes in the black bin (everything else). Hold on to it for now.", special_dropoff: "Needs a special drop-off point. A grown-up will take it there." },
        bubble: { moon: "Nice find! Somebody left that by accident. Want to hear about something we left on the Moon on purpose?", mars: "Nice find! Somebody left that by accident. Want to hear about something we left on Mars on purpose?", deep: "Nice find! Somebody left that by accident. Want to hear about something we sent into deep space on purpose?", eros: "Nice find! Somebody left that by accident. Want to hear about something we left on an asteroid on purpose?", sun: "Nice find! Somebody left that by accident. Want to hear about something we left circling the Sun on purpose?", ceres: "Nice find! Somebody left that by accident. Want to hear about something we left circling Ceres on purpose?" },
        extra: "Nice find! Every story is unlocked, so this one is just for the planet.", hear: "Hear the story", binIt: "Bin it", wrong: "That's not right, scan again" },
      story: { chapter: "Chapter {n} · {tag}", hook: "Did you know?", sources: "Sources", credit: "Image: {by}", binNow: "Now bin your litter!", toJacket: "Back to my jacket", toFinale: "Back to the finale", patchAlt: "The {short} patch",
        sec: { where: "Where it is now", was: "What it was", left: "What was left behind", did: "What it did", why: "Why it was left there", help: "Still helping us" } },
      bin: { back: "Back to the story", title: { white: "Pop it in the white bin", green: "Pop it in the green bin", black: "Pop it in the black bin", special_dropoff: "Give it to a grown-up" },
        meaning: { white: "White is for recycling.", green: "Green is for food scraps.", black: "Black is for everything else.", special_dropoff: "It needs a special drop-off point. A grown-up will take it there." },
        thenTap: "Then tap the button.", thenTapPatch: "Then tap the button to earn your patch.", legend: "Bin colors",
        names: { white: ["White", "Recycling"], green: ["Green", "Food scraps"], black: ["Black", "Everything else"], special_dropoff: ["Special", "With a grown-up"] },
        art: "A {color} bin with litter dropping into it", done: "It's in the bin!", doneSpecial: "A grown-up has it!", later: "No bin nearby? Save it for later" },
      unlocked: { title: "Patch unlocked!", line: "One less piece of litter on Earth, and one more story on your jacket.", of: "{n} of {total} patches earned", jacket: "See my jacket", again: "Scan another piece", finale: "See the finale",
        extraTitle: "Nice work!", extraLine: { one: "You've binned 1 piece of litter.", other: "You've binned {n} pieces of litter." } },
      danger: { badge: "Ask an adult", title: "Stop! Don't touch it.", looks: "I think I see: {item}. It could hurt you.", fallback: "something sharp", eagle: "Eagle looking careful",
        steps: ["Take a step back.", "Tell a grown-up where it is.", "Find something safer to scan."], bubble: "Good spotting! Sharp things never count for a patch, so you never have to touch them.", again: "Scan something else", home: "Back to home" },
      retry: { no: "That's not litter", unsure: "Hmm, I'm not sure", photo: "Let's try another photo", error: "Something went wrong", again: "Try again", home: "Back to home" },
      jacket: { title: "My explorer jacket", hint: "Tap a patch to hear its story again.", spin: "Drag the jacket to spin it!", locked: "{place} · locked", newTag: "new", scan: "Scan to unlock the next one", opening: "Hear the opening story again" },
      me: { buddy: "Crew buddy: {name}", change: "Change", log: "My cleanup log", binned: "binned", plastic: "plastic", paper: "paper", cans: "cans", language: "Language",
        grownups: "For grown-ups", safety: "Safety rules", photos: "How photos are handled", sources: "Where the stories come from", explore: "Explore all the stories", usage: "Live usage", privacy: "No accounts, no payments, no ads. Nothing here is stored with a child's name.",
        reset: "Start over on this phone", resetConfirm: "Start over? This clears the nickname, patches and cleanup log on this phone." },
      photos: { title: "How photos are handled", body: [
        "When a child takes a photo, the phone makes it smaller and sends it once to our scanner. The scanner asks Claude, an AI made by Anthropic, whether the photo shows litter and which bin it goes in.",
        "This app doesn't keep the photo: not on our server, not in our logs and not on this phone.",
        "Photos of people, faces or screens don't count. Eagle asks for another photo instead.",
        "The nickname, crew buddy, patches and cleanup log stay on this phone. There are no accounts, payments or ads.",
        "To keep the AI affordable, each phone can send a limited number of photos a day. The server keeps only counts, and random one-time numbers that stop a pick-up being counted twice: never the photo or the address it came from."] },
      usage: { title: "Live usage", intro: "Real numbers from this app, counted as kids scan. They refresh on their own.", all: "Everyone, so far", today: "Today", total: "pieces found", players: "players", photos: "photos scanned", pieces: "pieces found", note: "Only numbers are counted: no names, no photos. A day is counted in UTC time.", demo: "Demo mode doesn't show live numbers. Open the app without ?demo to see them.", wait: "Getting the numbers…", fail: "The numbers aren't available right now." },
      explore: { title: "All the stories", hint: "For teachers, parents and judges: open any chapter without scanning. Your patches stay the same.", back: "Back to all the stories" },
      sources: { title: "Where the stories come from", intro: "Every chapter comes from the team's storyboard, “Abandoned but Not Forgotten”. These are the pages its facts come from." },
      finale: { kicker: "You did it!", count: { one: "You picked up 1 piece of litter!", other: "You picked up {n} pieces of litter!" }, map: "Where they rest today", patches: "Your patches", home: "Back to home", impact: "See our impact",
        mapLabel: "A map of the 13 resting places: 4 on the Moon, 5 on Mars, and 4 more out in space." },
      impact: { title: "Our impact", pilot: "Pilot: Florianópolis", totalLabel: "pieces of litter picked up",
        moonBags: "That's more than all the bags astronauts left on the Moon!",
        towerPassed: "Our litter tower is {height} tall, taller than {passed}!", towerStart: "Our litter tower is {height} tall!",
        nextStop: "Next stop: {next}", reachedMoon: "We reached the Moon!", assumption: "If every piece were stacked 10 cm high.",
        demoData: "Demo data", loading: "Counting…", error: "The total didn't load. Check the internet and try again.", again: "Try again",
        strip: "From Earth to the Moon: our litter tower is {height} so far.", earth: "Earth", moon: "Moon" },
      bodies: { moon: "Moon", mars: "Mars", deep: "Deep space", eros: "Asteroid", sun: "Around the Sun", ceres: "Ceres" },
      map: { sun: "Sun", earth: "Earth", moon: "Moon", mars: "Mars", eros: "Eros", ceres: "Ceres", deep: "Deep space" },
      types: { plastic: "plastic", can: "can", paper_cardboard: "paper or cardboard", glass: "glass", organic: "food scraps", batteries_electronics: "batteries or electronics", chemicals: "chemicals", sharp_object: "something sharp", other: "litter", none: "not litter" },
      errors: { generic: "Something went wrong. Try again.", photo: "I couldn't open that photo. Try another one.", offline: "No connection. Check the internet and try again.", load: "The stories didn't load. Check the internet and try again." }
    },
    es: {
      langName: "Español",
      demo: "Modo demo: Eagle finge escanear para que puedas probar todas las pantallas. El juego de verdad usa IA.",
      back: "Atrás", menu: "Menú", listen: "Escuchar", stop: "Parar",
      nav: { home: "Inicio", jacket: "Chaqueta", impact: "Impacto", me: "Yo" },
      welcome: { mascot: "Eagle, el módulo lunar, la mascota de debris", tagline: "Todo lo que se queda atrás tiene una historia.", body: "Recoge basura en la Tierra. Desbloquea las historias de las máquinas que dejamos en la Luna y en Marte.", go: "¡Vamos!", grownups: "Para adultos", language: "Idioma" },
      opening: { kicker: "Empieza la historia", hook: "¿Sabías que…?", go: "¡Empecemos!" },
      safety: { bubble: "¡Hola, soy Eagle! Cuatro reglas rápidas antes de explorar.", title: "Cuídate allá afuera", go: "¡Entendido!",
        rules: [["Ponte guantes", "O usa una pinza para recoger basura."], ["Ve con un adulto", "Quédate donde te pueda ver."], ["¿Cortante o roto? No lo toques", "Vidrio, agujas, metal: pídele ayuda a un adulto."], ["No guardamos las fotos", "Revisamos cada foto y luego la borramos. Sin caras, por favor."]] },
      profile: { title: "¿Cómo te llamamos?", sub: "Elige un apodo espacial. No uses tu nombre real.", nick: "Apodo", nickMissing: "Primero escribe un apodo.", buddy: "Elige quién viaja contigo", privacy: "Tu apodo y tu elección se quedan en este teléfono. Sin cuenta, sin correo.", go: "¡Listo!",
        names: ["CaminaLunas", "SaltaEstrellas", "Cometa", "ZorroCohete", "Órbita", "PolvoEstelar"] },
      home: { title: "Inicio", patches: "{n} de {total}", patchesLabel: "{n} de {total} parches. Abrir mi chaqueta", meLabel: "Mi perfil: {nick}", jacket: "Mi chaqueta de exploración",
        toGo: { one: "Falta 1 parche", other: "Faltan {n} parches" }, allDone: "¡Tienes todos los parches!", counter: "Niños y niñas de todas partes han recogido {n} pedazos de basura.", schools: "¡Lleva debris a tu escuela o a tu próxima limpieza de playa!",
        scan: "Escanear basura", holding: "Tienes en la mano: {item}", holdingSub: "Échala en la caneca para ganar tu próximo parche.", binNow: "Botar mi basura", finale: "Ver el gran final", finaleSub: "Los 13 parches están en tu chaqueta." },
      steps: { names: ["Escanear", "Historia", "A la caneca", "Parche"], label: "Paso {i} de 4: {name}" },
      stepsBoi: ["Escanear", "A la caneca", "Despertar", "Historia"],
      teller: { chooseTitle: "Elige quién cuenta la historia", optionSpace: "Explorador espacial", optionBoi: "El Toro", boiTag: "De Florianópolis", go: "¡Vamos!", settingLabel: "Quién cuenta la historia",
        credit: "Inspirado en la danza tradicional del toro de Florianópolis y Santa Catarina." },
      scan: { close: "Cerrar e ir al inicio", hint: "Pon un pedazo de basura dentro del marco", shutter: "Tomar la foto", privacy: "Sin personas ni caras en la foto. La revisamos y luego la borramos.",
        looking: "Eagle está mirando…", noCamera: "Toca el botón para tomar una foto con tu cámara.", choose: "Mejor elegir una foto", starting: "Encendiendo la cámara…" },
      found: { back: "Volver a la cámara", safe: "Basura · se puede recoger", photoAlt: "Tu foto",
        goes: { white: "Va en la caneca blanca (reciclaje). Por ahora, llévala contigo.", green: "Va en la caneca verde (restos de comida). Por ahora, llévala contigo.", black: "Va en la caneca negra (todo lo demás). Por ahora, llévala contigo.", special_dropoff: "Necesita un punto especial de recolección. Un adulto la llevará." },
        bubble: { moon: "¡Buen hallazgo! Alguien dejó eso sin querer. ¿Quieres saber de algo que dejamos en la Luna a propósito?", mars: "¡Buen hallazgo! Alguien dejó eso sin querer. ¿Quieres saber de algo que dejamos en Marte a propósito?", deep: "¡Buen hallazgo! Alguien dejó eso sin querer. ¿Quieres saber de algo que enviamos al espacio profundo a propósito?", eros: "¡Buen hallazgo! Alguien dejó eso sin querer. ¿Quieres saber de algo que dejamos en un asteroide a propósito?", sun: "¡Buen hallazgo! Alguien dejó eso sin querer. ¿Quieres saber de algo que dejamos dando vueltas alrededor del Sol a propósito?", ceres: "¡Buen hallazgo! Alguien dejó eso sin querer. ¿Quieres saber de algo que dejamos dando vueltas alrededor de Ceres a propósito?" },
        extra: "¡Buen hallazgo! Ya desbloqueaste todas las historias, así que esta es solo por el planeta.", hear: "Escuchar la historia", binIt: "A la caneca", wrong: "No es eso, escanear otra vez" },
      story: { chapter: "Capítulo {n} · {tag}", hook: "¿Sabías que…?", sources: "Fuentes", credit: "Imagen: {by}", binNow: "¡Ahora bota tu basura!", toJacket: "Volver a mi chaqueta", toFinale: "Volver al final", patchAlt: "El parche de {short}",
        sec: { where: "Dónde está ahora", was: "Qué era", left: "Qué dejaron allí", did: "Qué hizo", why: "Por qué se quedó allí", help: "Todavía nos ayuda" } },
      bin: { back: "Volver a la historia", title: { white: "Échala en la caneca blanca", green: "Échala en la caneca verde", black: "Échala en la caneca negra", special_dropoff: "Dásela a un adulto" },
        meaning: { white: "La blanca es para reciclaje.", green: "La verde es para restos de comida.", black: "La negra es para todo lo demás.", special_dropoff: "Necesita un punto especial de recolección. Un adulto la llevará." },
        thenTap: "Después toca el botón.", thenTapPatch: "Después toca el botón para ganar tu parche.", legend: "Colores de las canecas",
        names: { white: ["Blanca", "Reciclaje"], green: ["Verde", "Restos de comida"], black: ["Negra", "Todo lo demás"], special_dropoff: ["Especial", "Con un adulto"] },
        art: "Una caneca {color} con basura cayendo adentro", done: "¡Ya está en la caneca!", doneSpecial: "¡Ya la tiene un adulto!", later: "¿No hay caneca cerca? Guárdala para después" },
      unlocked: { title: "¡Parche desbloqueado!", line: "Un pedazo de basura menos en la Tierra y una historia más en tu chaqueta.", of: "{n} de {total} parches ganados", jacket: "Ver mi chaqueta", again: "Escanear otro pedazo", finale: "Ver el gran final",
        extraTitle: "¡Buen trabajo!", extraLine: { one: "Ya botaste 1 pedazo de basura.", other: "Ya botaste {n} pedazos de basura." } },
      danger: { badge: "Pídele ayuda a un adulto", title: "¡Alto! No lo toques.", looks: "Creo que veo: {item}. Te puede lastimar.", fallback: "algo cortante", eagle: "Eagle con cuidado",
        steps: ["Da un paso atrás.", "Dile a un adulto dónde está.", "Busca algo más seguro para escanear."], bubble: "¡Bien visto! Las cosas cortantes nunca cuentan para un parche, así que nunca tienes que tocarlas.", again: "Escanear otra cosa", home: "Volver al inicio" },
      retry: { no: "Eso no es basura", unsure: "Mmm, no estoy seguro", photo: "Probemos con otra foto", error: "Algo falló", again: "Intentar otra vez", home: "Volver al inicio" },
      jacket: { title: "Mi chaqueta de exploración", hint: "Toca un parche para escuchar su historia otra vez.", spin: "¡Arrastra la chaqueta para girarla!", locked: "{place} · bloqueado", newTag: "nuevo", scan: "Escanea para desbloquear el siguiente", opening: "Escuchar otra vez el comienzo" },
      me: { buddy: "Viaja contigo: {name}", change: "Cambiar", log: "Mi registro de limpieza", binned: "botados", plastic: "plástico", paper: "papel", cans: "latas", language: "Idioma",
        grownups: "Para adultos", safety: "Reglas de seguridad", photos: "Qué pasa con las fotos", sources: "De dónde vienen las historias", explore: "Explorar todas las historias", usage: "Uso en vivo", privacy: "Sin cuentas, sin pagos, sin anuncios. Nada se guarda con el nombre de un niño o una niña.",
        reset: "Empezar de nuevo en este teléfono", resetConfirm: "¿Empezar de nuevo? Esto borra el apodo, los parches y el registro de este teléfono." },
      photos: { title: "Qué pasa con las fotos", body: [
        "Cuando un niño o una niña toma una foto, el teléfono la achica y la envía una sola vez a nuestro escáner. El escáner le pregunta a Claude, una IA hecha por Anthropic, si la foto muestra basura y en qué caneca va.",
        "Esta app no guarda la foto: ni en nuestro servidor, ni en nuestros registros, ni en este teléfono.",
        "Las fotos de personas, caras o pantallas no cuentan. Eagle pide otra foto.",
        "El apodo, quien viaja contigo, los parches y el registro de limpieza se quedan en este teléfono. No hay cuentas, pagos ni anuncios.",
        "Para que la IA no cueste demasiado, cada teléfono puede enviar un número limitado de fotos al día. El servidor solo guarda conteos, y números al azar de un solo uso para que una recogida no se cuente dos veces: nunca la foto ni la dirección de donde vino."] },
      usage: { title: "Uso en vivo", intro: "Números reales de esta app, contados mientras los niños escanean. Se actualizan solos.", all: "Entre todos, hasta ahora", today: "Hoy", total: "pedazos encontrados", players: "jugadores", photos: "fotos escaneadas", pieces: "pedazos encontrados", note: "Solo se cuentan números: sin nombres y sin fotos. El día se cuenta en hora UTC.", demo: "El modo demo no muestra números en vivo. Abre la app sin ?demo para verlos.", wait: "Buscando los números…", fail: "Los números no están disponibles ahora." },
      explore: { title: "Todas las historias", hint: "Para profes, familias y jurados: abre cualquier capítulo sin escanear. Tus parches no cambian.", back: "Volver a todas las historias" },
      sources: { title: "De dónde vienen las historias", intro: "Cada capítulo viene del guion del equipo, «Abandoned but Not Forgotten». Estas son las páginas de donde salen sus datos." },
      finale: { kicker: "¡Lo lograste!", count: { one: "¡Recogiste 1 pedazo de basura!", other: "¡Recogiste {n} pedazos de basura!" }, map: "Dónde descansan hoy", patches: "Tus parches", home: "Volver al inicio", impact: "Ver nuestro impacto",
        mapLabel: "Un mapa de los 13 lugares de descanso: 4 en la Luna, 5 en Marte y 4 más en el espacio." },
      impact: { title: "Nuestro impacto", pilot: "Piloto: Florianópolis", totalLabel: "piezas de basura recogidas",
        moonBags: "¡Eso es más que todas las bolsas que los astronautas dejaron en la Luna!",
        towerPassed: "¡Nuestra torre de basura mide {height}, más alta que {passed}!", towerStart: "¡Nuestra torre de basura mide {height}!",
        nextStop: "Próxima parada: {next}", reachedMoon: "¡Llegamos a la Luna!", assumption: "Si cada pieza se apilara con 10 cm de altura.",
        demoData: "Datos de demostración", loading: "Contando…", error: "El total no cargó. Revisa el internet e intenta otra vez.", again: "Intentar otra vez",
        strip: "De la Tierra a la Luna: nuestra torre de basura mide {height} por ahora.", earth: "Tierra", moon: "Luna" },
      bodies: { moon: "Luna", mars: "Marte", deep: "Espacio profundo", eros: "Asteroide", sun: "Alrededor del Sol", ceres: "Ceres" },
      map: { sun: "Sol", earth: "Tierra", moon: "Luna", mars: "Marte", eros: "Eros", ceres: "Ceres", deep: "Espacio profundo" },
      types: { plastic: "plástico", can: "lata", paper_cardboard: "papel o cartón", glass: "vidrio", organic: "restos de comida", batteries_electronics: "pilas o electrónicos", chemicals: "químicos", sharp_object: "algo cortante", other: "basura", none: "no es basura" },
      errors: { generic: "Algo falló. Intenta otra vez.", photo: "No pude abrir esa foto. Prueba con otra.", offline: "No hay conexión. Revisa el internet e intenta otra vez.", load: "Las historias no cargaron. Revisa el internet e intenta otra vez." }
    },
    pt: {
      langName: "Português",
      demo: "Modo demo: o Eagle finge que escaneia para você testar todas as telas. O jogo de verdade usa IA.",
      back: "Voltar", menu: "Menu", listen: "Ouvir", stop: "Parar",
      nav: { home: "Início", jacket: "Jaqueta", impact: "Impacto", me: "Eu" },
      welcome: { mascot: "Eagle, o módulo lunar, mascote do debris", tagline: "Tudo o que ficou para trás tem uma história.", body: "Recolha lixo na Terra. Desbloqueie as histórias das máquinas que deixamos na Lua e em Marte.", go: "Vamos lá!", grownups: "Para adultos", language: "Idioma" },
      opening: { kicker: "A história começa", hook: "Você sabia?", go: "Vamos lá!" },
      safety: { bubble: "Oi, eu sou o Eagle! Quatro regrinhas rápidas antes de explorar.", title: "Cuide-se lá fora", go: "Entendi!",
        rules: [["Use luvas", "Ou use um pegador de lixo."], ["Leve um adulto", "Fique onde ele possa te ver."], ["Cortante ou quebrado? Não toque", "Vidro, agulhas, metal: chame um adulto."], ["As fotos não ficam guardadas", "A gente confere cada foto e depois apaga. Sem rostos, por favor."]] },
      profile: { title: "Como vamos te chamar?", sub: "Escolha um apelido espacial. Não use seu nome de verdade.", nick: "Apelido", nickMissing: "Escreva um apelido primeiro.", buddy: "Escolha quem viaja com você", privacy: "Seu apelido e sua escolha ficam neste celular. Sem conta, sem e-mail.", go: "Pronto!",
        names: ["AndaLua", "PulaEstrela", "Cometa", "RaposaFoguete", "Órbita", "PoeiraEstelar"] },
      home: { title: "Início", patches: "{n} de {total}", patchesLabel: "{n} de {total} emblemas. Abrir minha jaqueta", meLabel: "Meu perfil: {nick}", jacket: "Minha jaqueta de exploração",
        toGo: { one: "Falta 1 emblema", other: "Faltam {n} emblemas" }, allDone: "Você ganhou todos os emblemas!", counter: "Crianças do mundo todo já recolheram {n} pedaços de lixo.", schools: "Leve o debris para a sua escola ou para o próximo mutirão de limpeza da praia!",
        scan: "Escanear lixo", holding: "Você está segurando: {item}", holdingSub: "Jogue na lixeira para ganhar seu próximo emblema.", binNow: "Jogar meu lixo fora", finale: "Ver o grande final", finaleSub: "Os 13 emblemas estão na sua jaqueta." },
      steps: { names: ["Escanear", "História", "Na lixeira", "Emblema"], label: "Passo {i} de 4: {name}" },
      stepsBoi: ["Escanear", "Na lixeira", "Acordar", "História"],
      teller: { chooseTitle: "Escolha quem conta a história", optionSpace: "Explorador Espacial", optionBoi: "Boi de Mamão", boiTag: "De Florianópolis", go: "Vamos lá!", settingLabel: "Quem conta a história",
        credit: "Inspirado na tradição do boi de mamão de Florianópolis e Santa Catarina." },
      scan: { close: "Fechar e voltar ao início", hint: "Coloque um lixo dentro do quadro", shutter: "Tirar a foto", privacy: "Sem pessoas ou rostos na foto. A gente confere e depois apaga.",
        looking: "O Eagle está olhando…", noCamera: "Toque no botão para tirar uma foto com a câmera.", choose: "Escolher uma foto", starting: "Ligando a câmera…" },
      found: { back: "Voltar para a câmera", safe: "Lixo · pode recolher", photoAlt: "Sua foto",
        goes: { white: "Vai na lixeira branca (recicláveis). Segure com você por enquanto.", green: "Vai na lixeira verde (restos de comida). Segure com você por enquanto.", black: "Vai na lixeira preta (todo o resto). Segure com você por enquanto.", special_dropoff: "Precisa ir para um ponto de coleta especial. Um adulto vai levar." },
        bubble: { moon: "Que achado! Alguém deixou isso sem querer. Quer saber de algo que deixamos na Lua de propósito?", mars: "Que achado! Alguém deixou isso sem querer. Quer saber de algo que deixamos em Marte de propósito?", deep: "Que achado! Alguém deixou isso sem querer. Quer saber de algo que mandamos para o espaço profundo de propósito?", eros: "Que achado! Alguém deixou isso sem querer. Quer saber de algo que deixamos num asteroide de propósito?", sun: "Que achado! Alguém deixou isso sem querer. Quer saber de algo que deixamos girando em volta do Sol de propósito?", ceres: "Que achado! Alguém deixou isso sem querer. Quer saber de algo que deixamos girando em volta de Ceres de propósito?" },
        extra: "Que achado! Você já desbloqueou todas as histórias, então este é só pelo planeta.", hear: "Ouvir a história", binIt: "Para a lixeira", wrong: "Não é isso, escanear de novo" },
      story: { chapter: "Capítulo {n} · {tag}", hook: "Você sabia?", sources: "Fontes", credit: "Imagem: {by}", binNow: "Agora jogue seu lixo na lixeira!", toJacket: "Voltar para minha jaqueta", toFinale: "Voltar para o final", patchAlt: "O emblema de {short}",
        sec: { where: "Onde está agora", was: "O que era", left: "O que ficou lá", did: "O que fez", why: "Por que ficou lá", help: "Ainda nos ajuda" } },
      bin: { back: "Voltar para a história", title: { white: "Jogue na lixeira branca", green: "Jogue na lixeira verde", black: "Jogue na lixeira preta", special_dropoff: "Entregue para um adulto" },
        meaning: { white: "A branca é para recicláveis.", green: "A verde é para restos de comida.", black: "A preta é para todo o resto.", special_dropoff: "Precisa ir para um ponto de coleta especial. Um adulto vai levar." },
        thenTap: "Depois toque no botão.", thenTapPatch: "Depois toque no botão para ganhar seu emblema.", legend: "Cores das lixeiras",
        names: { white: ["Branca", "Recicláveis"], green: ["Verde", "Restos de comida"], black: ["Preta", "Todo o resto"], special_dropoff: ["Especial", "Com um adulto"] },
        art: "Uma lixeira {color} com lixo caindo dentro", done: "Já está na lixeira!", doneSpecial: "Já está com um adulto!", later: "Sem lixeira por perto? Guarde para depois" },
      unlocked: { title: "Emblema desbloqueado!", line: "Um lixo a menos na Terra e mais uma história na sua jaqueta.", of: "{n} de {total} emblemas ganhos", jacket: "Ver minha jaqueta", again: "Escanear outro lixo", finale: "Ver o grande final",
        extraTitle: "Muito bem!", extraLine: { one: "Você já jogou 1 lixo na lixeira.", other: "Você já jogou {n} lixos na lixeira." } },
      danger: { badge: "Chame um adulto", title: "Pare! Não toque.", looks: "Acho que estou vendo: {item}. Pode te machucar.", fallback: "algo cortante", eagle: "Eagle com cuidado",
        steps: ["Dê um passo para trás.", "Conte para um adulto onde está.", "Procure algo mais seguro para escanear."], bubble: "Bem observado! Coisas cortantes nunca valem emblema, então você nunca precisa tocar nelas.", again: "Escanear outra coisa", home: "Voltar ao início" },
      retry: { no: "Isso não é lixo", unsure: "Hmm, não tenho certeza", photo: "Vamos tentar outra foto", error: "Algo deu errado", again: "Tentar de novo", home: "Voltar ao início" },
      jacket: { title: "Minha jaqueta de exploração", hint: "Toque num emblema para ouvir a história de novo.", spin: "Arraste a jaqueta para girar!", locked: "{place} · bloqueado", newTag: "novo", scan: "Escaneie para desbloquear o próximo", opening: "Ouvir o começo de novo" },
      me: { buddy: "Viaja com você: {name}", change: "Mudar", log: "Meu registro de limpeza", binned: "na lixeira", plastic: "plástico", paper: "papel", cans: "latas", language: "Idioma",
        grownups: "Para adultos", safety: "Regras de segurança", photos: "O que acontece com as fotos", sources: "De onde vêm as histórias", explore: "Explorar todas as histórias", usage: "Uso ao vivo", privacy: "Sem contas, sem pagamentos, sem anúncios. Nada fica guardado com o nome de uma criança.",
        reset: "Começar de novo neste celular", resetConfirm: "Começar de novo? Isso apaga o apelido, os emblemas e o registro deste celular." },
      photos: { title: "O que acontece com as fotos", body: [
        "Quando uma criança tira uma foto, o celular diminui a imagem e a envia uma única vez para o nosso scanner. O scanner pergunta ao Claude, uma IA feita pela Anthropic, se a foto mostra lixo e em qual lixeira ele vai.",
        "Este app não guarda a foto: nem no nosso servidor, nem nos nossos registros, nem neste celular.",
        "Fotos de pessoas, rostos ou telas não contam. O Eagle pede outra foto.",
        "O apelido, quem viaja com você, os emblemas e o registro de limpeza ficam neste celular. Não há contas, pagamentos nem anúncios.",
        "Para a IA não custar caro demais, cada celular pode enviar um número limitado de fotos por dia. O servidor guarda só contagens, e números aleatórios de uso único para que um recolhimento não conte duas vezes: nunca a foto nem o endereço de onde ela veio."] },
      usage: { title: "Uso ao vivo", intro: "Números reais deste app, contados enquanto as crianças escaneiam. Eles se atualizam sozinhos.", all: "Todo mundo, até agora", today: "Hoje", total: "lixos encontrados", players: "jogadores", photos: "fotos escaneadas", pieces: "lixos encontrados", note: "Só números são contados: sem nomes e sem fotos. O dia é contado no horário UTC.", demo: "O modo demo não mostra números ao vivo. Abra o app sem ?demo para ver.", wait: "Buscando os números…", fail: "Os números não estão disponíveis agora." },
      explore: { title: "Todas as histórias", hint: "Para professores, famílias e jurados: abra qualquer capítulo sem escanear. Seus emblemas não mudam.", back: "Voltar para todas as histórias" },
      sources: { title: "De onde vêm as histórias", intro: "Cada capítulo vem do roteiro da equipe, “Abandoned but Not Forgotten”. Estas são as páginas de onde vêm os fatos." },
      finale: { kicker: "Você conseguiu!", count: { one: "Você recolheu 1 pedaço de lixo!", other: "Você recolheu {n} pedaços de lixo!" }, map: "Onde elas estão hoje", patches: "Seus emblemas", home: "Voltar ao início", impact: "Veja nosso impacto",
        mapLabel: "Um mapa dos 13 lugares de descanso: 4 na Lua, 5 em Marte e mais 4 no espaço." },
      impact: { title: "Nosso impacto", pilot: "Piloto: Florianópolis", totalLabel: "pedaços de lixo recolhidos",
        moonBags: "Isso é mais do que todos os sacos que os astronautas deixaram na Lua!",
        towerPassed: "Nossa torre de lixo tem {height} de altura, mais alta que {passed}!", towerStart: "Nossa torre de lixo tem {height} de altura!",
        nextStop: "Próxima parada: {next}", reachedMoon: "Chegamos à Lua!", assumption: "Se cada pedaço fosse empilhado com 10 cm de altura.",
        demoData: "Dados de demonstração", loading: "Contando…", error: "O total não carregou. Confira a internet e tente de novo.", again: "Tentar de novo",
        strip: "Da Terra à Lua: nossa torre de lixo tem {height} até agora.", earth: "Terra", moon: "Lua" },
      bodies: { moon: "Lua", mars: "Marte", deep: "Espaço profundo", eros: "Asteroide", sun: "Em volta do Sol", ceres: "Ceres" },
      map: { sun: "Sol", earth: "Terra", moon: "Lua", mars: "Marte", eros: "Eros", ceres: "Ceres", deep: "Espaço profundo" },
      types: { plastic: "plástico", can: "lata", paper_cardboard: "papel ou papelão", glass: "vidro", organic: "restos de comida", batteries_electronics: "pilhas ou eletrônicos", chemicals: "produtos químicos", sharp_object: "algo cortante", other: "lixo", none: "não é lixo" },
      errors: { generic: "Algo deu errado. Tente de novo.", photo: "Não consegui abrir essa foto. Tente outra.", offline: "Sem conexão. Confira a internet e tente de novo.", load: "As histórias não carregaram. Confira a internet e tente de novo." }
    }
  };

  /* ---------- State ---------- */
  const guessLang = () => { const l = String(navigator.language || "en").slice(0, 2).toLowerCase(); return LANGS.includes(l) ? l : "en"; };
  const int = (v, lo, hi) => Number.isInteger(v) ? Math.min(hi, Math.max(lo, v)) : lo;
  const S = {
    lang: LANGS.includes(load("lang")) ? load("lang") : guessLang(),
    profile: load("profile", null),                    // { nick, buddy }
    binned: int(load("binned", 0), 0, TOTAL),          // patches earned: chapter n is earned when the n-th piece is binned
    log: Array.isArray(load("log", [])) ? load("log", []) : [],   // every piece binned: [{ date, type }]
    pending: load("pending", null),                    // the piece in the child's hand: { item, type, bin, saved }
    lastNew: int(load("lastNew", 0), 0, TOTAL),
    tickets: (Array.isArray(load("tickets", [])) ? load("tickets", []) : []).filter(x => typeof x === "string").slice(-50),   // pick-ups waiting to be counted on the server
    introDone: !!load("introDone", false), safetyDone: !!load("safetyDone", false), finaleSeen: !!load("finaleSeen", false),
    teller: load("teller") === "boi" ? "boi" : "space",   // who tells the story: "space" (the storyboard) or "boi" (the Boi de Mamão)
    tellerChosen: !!load("tellerChosen", false),
    boi: null,        // the Boi's lines (boi.json); if they don't load, the app runs with the space story only
    content: null, counter: null, pickups: null, counterAt: 0, impact: null,   // counter: pieces found (Live usage); pickups: confirmed in the bin (Home, Impact)
    view: null,       // { name, params }
    scan: null,       // this round's photo and answer: { kind, image, result, message }. Never saved.
    earned: null      // what was just earned, for the Unlocked screen: { n } or { extra: true }
  };
  if (!S.profile || typeof S.profile.nick !== "string") S.profile = null;
  if (S.pending && !BINS.includes(S.pending.bin)) S.pending = null;
  const persist = () => KEYS.forEach(k => save(k, S[k]));

  /* ---------- Text helpers ---------- */
  const lookup = (o, path) => path.split(".").reduce((x, k) => (x == null ? x : x[k]), o);
  const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (m, k) => (vars && k in vars ? vars[k] : m));
  const locale = () => ({ en: "en-US", es: "es-CO", pt: "pt-BR" }[S.lang]);
  const fmt = n => Number(n).toLocaleString(locale());
  function t(path, vars) {
    let v = lookup(UI[S.lang], path);
    if (v == null) v = lookup(UI.en, path);
    return typeof v === "string" && vars ? fill(v, vars) : v;
  }
  const tn = (path, n, vars) => fill(t(path)[n === 1 ? "one" : "other"], Object.assign({ n: fmt(n) }, vars));
  const L = obj => (obj && (obj[S.lang] || obj.en)) || {};
  const chapter = n => S.content.chapters[n - 1];
  const chText = n => L(chapter(n));
  const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
  const lower = s => s && s.length > 1 && s.charAt(1) === s.charAt(1).toLowerCase() ? s.charAt(0).toLowerCase() + s.slice(1) : s;
  const range = n => Array.from({ length: n }, (_, i) => i + 1);
  const buddyName = id => (A.BUDDIES.find(b => b[0] === id) || A.BUDDIES[0])[1];

  /* ---------- Safe HTML: every value is escaped unless it is raw() ---------- */
  const ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
  const esc = s => String(s).replace(/[&<>"']/g, c => ESC[c]);
  function Raw(s) { this.s = s; }
  const raw = s => new Raw(String(s));
  const show = v => v == null || v === false ? "" : v instanceof Raw ? v.s : Array.isArray(v) ? v.map(show).join("") : esc(v);
  const h = (strs, ...vals) => raw(strs.reduce((out, s, i) => out + show(vals[i - 1]) + s));
  const safeUrl = u => /^https:\/\/[^\s"'<>]+$/.test(u) ? u : "#";
  const safeImg = u => /^(https:\/\/|img\/)[^\s"'<>]+$/.test(u || "") ? u : "";
  const splitBold = (tpl, key, value) => { const [a, b] = String(tpl).split("{" + key + "}"); return h`${a}<b>${value}</b>${b || ""}`; };

  /* ---------- Pieces used on several screens ---------- */
  const ico = (name, o) => raw(A.icon(name, o));
  const backBtn = (label, attrs) => h`<button type="button" class="circle-btn" aria-label="${label}" ${raw(attrs)}>${ico("back", { width: 2.6 })}</button>`;
  const goAttrs = (name, params = {}) => `data-go="${esc(name)}"` + (params.n ? ` data-n="${+params.n}"` : "") + (params.from ? ` data-from="${esc(params.from)}"` : "");
  function steps(i) {
    const names = isBoi() ? t("stepsBoi") : t("steps.names");
    return h`<div class="steps" role="img" aria-label="${t("steps.label", { i, name: names[i - 1] })}">${names.map((nm, k) =>
      k + 1 < i ? h`<span class="dot done"></span>` : k + 1 === i ? h`<span class="cur">${k + 1} ${nm}</span>` : h`<span class="dot"></span>`)}</div>`;
  }
  const say = (text, { mood = "happy", look = "right", label = "Eagle" } = {}) =>
    h`<div class="say">${raw(A.eagleHead({ label, mood, look, cls: "say-eagle" }))}<p class="bubble">${text}</p></div>`;
  const nav = cur => h`<nav class="nav" aria-label="${t("menu")}">${["home", "jacket", "impact", "me"].map(k =>
    h`<button type="button" data-go="${k}" ${cur === k ? raw('aria-current="page"') : ""}>${ico(k)}<span>${t("nav." + k)}</span></button>`)}</nav>`;
  function listenBtn(key) {
    if (!canSpeak) return "";
    const on = speaking === key;
    return h`<button type="button" class="listen" data-act="listen" data-key="${key}" aria-pressed="${on}">${raw(A.play(on))}<span>${on ? t("stop") : t("listen")}</span></button>`;
  }
  const photo = (image, badge) => h`<div class="photo">${image ? h`<img src="${image}" alt="${t("found.photoAlt")}">` : raw(A.scene())}${badge || ""}</div>`;
  const binChip = (k, on) => { const [name, what] = t("bin.names." + k); return h`<div class="chip-bin${on ? " on" : ""}" role="listitem"><span class="swatch swatch-${k}"></span><b>${name}</b><span>${what}</span></div>`; };
  const reducedMotion = () => !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* ---------- The storyteller: the Space Explorer (the storyboard) or the Boi de Mamão (boi.json, the team's spec) ----------
     The facts in every chapter are the same for both; only the narrator, the pick-up moment and a few lines change.
     The Boi's lines are in English and Portuguese: Spanish players see the English lines until Spanish is written. */
  const BERNUNCIA = "Bernúncia";   // the Portuguese spelling the team agrees on ("Bernúncia" or "Bernunça"): change it here, and every Portuguese line follows
  // The English lines (also shown to Spanish players for now) are for Americans and use no Portuguese: the Bull, the Dragon, "Chomp!"
  const isBoi = () => S.teller === "boi" && !!S.boi;
  const boiLang = () => (S.lang === "pt" ? "pt" : "en");
  const B = obj => (obj && (obj[boiLang()] || obj.en)) || "";
  const boiAttr = () => (boiLang() !== S.lang ? raw(` lang="${boiLang()}"`) : "");   // a Spanish page marks the English Boi lines as English
  const sayBoi = (text, boiWords = true) =>
    h`<div class="say">${raw(A.boiHead({ mood: "talk", cls: "say-boi" }))}<p class="bubble"${boiWords ? boiAttr() : ""}>${text}</p></div>`;
  // The Boi's line after Bernúncia eats: the four lines take turns (by chapter, so a reload says the same), {next} is the explorer waking up
  function pickupLine(n) {
    if (n >= TOTAL) return B(S.boi.allAwake);
    const lines = B(S.boi.pickups), ch = chapter(n);
    return fill(lines[(n - 1) % lines.length], { next: (ch[boiLang()] || ch.en).short });
  }
  function validBoi(b) {
    const both = o => !!o && ["en", "pt"].every(k => o[k] != null && o[k].length > 0);
    const ok = !!b && Array.isArray(b.chapters) && b.chapters.length === TOTAL && b.chapters.every((c, i) => c && c.n === i + 1 && both(c))
      && both(b.verse) && both(b.opening) && both(b.firstPickup) && both(b.pickups) && both(b.allAwake) && both(b.finale)
      && both(b.sound) && !!b.added && both(b.added.title) && both(b.added.found) && both(b.added.homeNext)
      && ["en", "pt"].every(k => b.pickups[k].every(x => typeof x === "string" && x.includes("{next}")));
    if (!ok) return null;
    return BERNUNCIA === "Bernúncia" ? b : JSON.parse(JSON.stringify(b).replace(/Bernúncia/g, BERNUNCIA));
  }

  /* Sound for the Boi: "Nhac!" and a few seconds of festive music, made right here on the phone (an original tune, no recordings).
     It only starts after a tap, stops when the screen changes and fails silently. A phone on silent may play nothing. */
  const sound = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null, live = [];
    const hz = m => 440 * Math.pow(2, (m - 69) / 12);
    function unlock() {
      try { if (!AC) return null; if (!ctx) ctx = new AC(); if (ctx.state === "suspended" && ctx.resume) ctx.resume().catch(() => {}); return ctx; } catch { return null; }
    }
    function keep(node) { live.push(node); node.onended = () => { live = live.filter(x => x !== node); }; }
    function tone(c, out, { m, m2, at, dur, type = "triangle", vol = .2 }) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(hz(m), at); if (m2 != null) o.frequency.exponentialRampToValueAtTime(hz(m2), at + dur);
      g.gain.setValueAtTime(.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + .012); g.gain.exponentialRampToValueAtTime(.0001, at + dur);
      o.connect(g); g.connect(out); o.start(at); o.stop(at + dur + .02); keep(o);
    }
    function hiss(c, out, { at, dur, vol = .3, freq = 1500, q = 1 }) {
      const n = Math.max(1, Math.floor(c.sampleRate * dur)), buf = c.createBuffer(1, n, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2);
      const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      src.buffer = buf; f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(out); src.start(at); keep(src);
    }
    function play(score) {
      const c = unlock(); if (!c) return;
      try { const out = c.createGain(); out.gain.value = .5; out.connect(c.destination); score(c, out, c.currentTime + .03); } catch {}
    }
    return {
      unlock,
      // A big bite and two chews
      nhac: () => play((c, out, t) => {
        hiss(c, out, { at: t, dur: .09, vol: .9, freq: 1100, q: .8 });
        tone(c, out, { m: 62, m2: 48, at: t + .01, dur: .15, type: "square", vol: .1 });
        hiss(c, out, { at: t + .22, dur: .06, vol: .6, freq: 800 });
        hiss(c, out, { at: t + .36, dur: .06, vol: .5, freq: 700 });
      }),
      // An explorer wakes up: four notes going up
      wake: () => play((c, out, t) => [72, 76, 79, 84].forEach((m, i) => tone(c, out, { m, at: t + i * .1, dur: i === 3 ? .45 : .14, vol: .2 }))),
      // About 4 seconds of festa: a tune, a bass, a drum on the beat and a triangle in between (written for this app)
      festa: () => play((c, out, t) => {
        const e = .17;
        const tune = [[72, 1], [69, 1], [72, 1], [77, 2], [76, 1], [74, 1], [72, 1], [70, 1], [74, 1], [77, 1], [81, 2], [79, 1], [77, 1], [76, 1], [77, 1], [76, 1], [74, 1], [72, 1], [69, 1], [72, 1], [77, 2]];
        let at = t;
        for (const [m, d] of tune) { tone(c, out, { m, at, dur: d * e * .9, type: "square", vol: .06 }); tone(c, out, { m: m + 12, at, dur: d * e * .5, vol: .04 }); at += d * e; }
        [53, 48, 53, 48, 46, 53, 46, 48, 53, 48, 53, 53].forEach((m, i) => tone(c, out, { m, at: t + i * 2 * e, dur: e * 1.6, vol: .2 }));
        for (let i = 0; i < 24; i++) {
          if (i % 2) hiss(c, out, { at: t + i * e, dur: .04, vol: .16, freq: 7000, q: 2 });
          if (i % 4 === 0 || i % 4 === 3) tone(c, out, { m: 40, m2: 28, at: t + i * e, dur: .16, type: "sine", vol: .32 });
        }
      }),
      stop: () => { live.forEach(n => { try { n.stop(); } catch {} }); live = []; }
    };
  })();

  /* ---------- Screens ---------- */
  const screens = {};

  screens.welcome = () => ({ theme: "t-blue", cls: "welcome", html: h`
    <div class="lang-pick" role="group" aria-label="${t("welcome.language")}">${LANGS.map(l =>
      h`<button type="button" data-act="lang" data-lang="${l}" lang="${l}" aria-pressed="${l === S.lang}">${UI[l].langName}</button>`)}</div>
    <div class="hero">
      ${raw(A.eagle({ label: t("welcome.mascot"), cls: "hero-eagle" }))}
      <h1 class="wordmark" tabindex="-1">debris</h1>
      <p class="tagline">${t("welcome.tagline")}</p>
    </div>
    <p class="lede">${t("welcome.body")}</p>
    <button type="button" class="btn btn-primary" data-act="start">${t("welcome.go")}</button>
    <button type="button" class="btn-link" data-go="grownups">${t("welcome.grownups")}</button>` });

  /* Choose your storyteller: on first launch, right after "Let's go!". Space Explorer is chosen to start with. Later: Me → Storyteller. */
  screens.storyteller = () => ({ theme: "t-blue", cls: "teller", html: h`
    <form class="teller-form grow" data-form="teller" novalidate>
      <h1 tabindex="-1">${t("teller.chooseTitle")}</h1>
      <fieldset class="teller-cards"><legend class="sr-only">${t("teller.chooseTitle")}</legend>${["space", "boi"].map(k => h`
        <label class="teller-card${k === S.teller ? " on" : ""}"><input type="radio" name="teller" value="${k}" ${k === S.teller ? raw("checked") : ""}>
          <span class="teller-art">${raw(k === "boi" ? A.boiCard() : A.eagle())}</span>
          <b>${t(k === "boi" ? "teller.optionBoi" : "teller.optionSpace")}</b>${k === "boi" ? h`<span class="teller-tag">${t("teller.boiTag")}</span>` : ""}
        </label>`)}
      </fieldset>
      <p class="fine">${t("teller.credit")}</p>
      <div class="grow"></div>
      <button type="submit" class="btn btn-primary">${t("teller.go")}</button>
    </form>` });

  screens.opening = ({ from }) => {
    const replay = from === "jacket" || from === "explore";
    const top = replay ? h`<div class="top">${backBtn(t("back"), goAttrs(from))}</div>` : "";
    const end = replay ? h`<button type="button" class="btn btn-primary" ${raw(goAttrs(from))}>${from === "explore" ? t("explore.back") : t("story.toJacket")}</button>`
      : h`<button type="button" class="btn btn-primary" data-act="openingDone">${t("opening.go")}</button>`;
    if (isBoi()) {
      // The Bull dances in while the verse appears (and plays), then talks to the child. The safety rules still come next.
      // Each language shows its own verse only: Americans see the English one, Brazilians the Portuguese one.
      const b = S.boi, la = boiAttr(), talk = B(b.opening);
      return { theme: "t-blue", cls: "opening boi-opening", html: h`
        ${top}
        <span class="kicker">${t("opening.kicker")}</span>
        <h1 tabindex="-1"${la}>${B(b.added.title)}</h1>
        <div class="boi-stage">${raw(A.boi({ pose: "dance", cls: "boi-dance-in" }))}</div>
        <div class="verse"><span class="verse-note" aria-hidden="true">♪</span>
          <div class="verse-main"${la}>${B(b.verse).map(l => h`<p>${l}</p>`)}</div>
        </div>
        ${listenBtn("intro")}
        ${talk.slice(0, 2).map(p => h`<p class="script"${la}>${p}</p>`)}
        <div class="boi-nap">${raw(A.boi({ pose: "sleep" }))}</div>
        ${talk.slice(2).map(p => h`<p class="script"${la}>${p}</p>`)}
        ${sayBoi(B(b.firstPickup))}
        <div class="grow"></div>
        ${end}`, after: () => { if (fromTap()) sound.festa(); } };
    }
    const i = L(S.content.intro);
    return { theme: "t-blue", cls: "opening", html: h`
      ${top}
      <span class="kicker">${t("opening.kicker")}</span>
      <h1 tabindex="-1">${i.title}</h1>
      ${listenBtn("intro")}
      ${i.script.map(p => h`<p class="script">${p}</p>`)}
      <div class="hook-card"><b>${t("opening.hook")}</b><p>${i.hook}</p></div>
      ${say(i.pickup)}
      <div class="grow"></div>
      ${end}` };
  };

  screens.safety = ({ from }) => {
    const review = from === "me" || from === "grownups", icons = ["hand", "grownups", "warning", "camera"];
    return { theme: "t-cream", cls: "safety", html: h`
      ${review ? h`<div class="top">${backBtn(t("back"), goAttrs(from))}</div>` : ""}
      ${say(t("safety.bubble"), { mood: "smile", look: "center" })}
      <h1 tabindex="-1">${t("safety.title")}</h1>
      <ul class="rules">${t("safety.rules").map((r, k) =>
        h`<li class="rule${k === 2 ? " warn" : ""}">${ico(icons[k], { size: 34, width: 2.2 })}<div><b>${r[0]}</b><span>${r[1]}</span></div></li>`)}</ul>
      <div class="grow"></div>
      ${review ? h`<button type="button" class="btn btn-primary" ${raw(goAttrs(from))}>${t("back")}</button>`
        : h`<button type="button" class="btn btn-primary" data-act="safetyDone">${t("safety.go")}</button>`}` };
  };

  screens.profile = ({ from }) => {
    const editing = from === "me", p = S.profile || {};
    const names = t("profile.names"), nick = p.nick || names[Math.floor(Math.random() * names.length)], chosen = p.buddy || "eagle";
    return { theme: "t-cream", cls: "profile", html: h`
      ${editing ? h`<div class="top">${backBtn(t("back"), goAttrs("me"))}</div>` : ""}
      <form class="stack grow" data-form="profile" data-from="${from || ""}" novalidate>
        <div class="titles"><h1 tabindex="-1">${t("profile.title")}</h1><p class="sub">${t("profile.sub")}</p></div>
        <div class="field-wrap">
          <label for="nick">${t("profile.nick")}</label>
          <input id="nick" name="nick" class="field" type="text" maxlength="16" autocomplete="off" autocapitalize="words" spellcheck="false" value="${nick}" aria-describedby="nickErr">
          <p class="field-err" id="nickErr" hidden>${t("profile.nickMissing")}</p>
        </div>
        <fieldset class="buddies"><legend>${t("profile.buddy")}</legend>
          <div class="buddy-grid">${A.BUDDIES.map(([id, name]) =>
            h`<label class="buddy${id === chosen ? " on" : ""}"><input type="radio" name="buddy" value="${id}" ${id === chosen ? raw("checked") : ""}>${raw(A.buddy(id))}<span>${name}</span></label>`)}</div>
        </fieldset>
        <p class="note">${t("profile.privacy")}</p>
        <div class="grow"></div>
        <button type="submit" class="btn btn-primary">${t("profile.go")}</button>
      </form>` };
  };

  screens.home = () => {
    const n = S.binned, p = S.profile, pend = S.pending, boi = isBoi();
    const greet = boi ? B(n === 0 ? S.boi.firstPickup : n >= TOTAL ? S.boi.allAwake : S.boi.added.homeNext)
      : n === 0 ? L(S.content.intro).pickup : chText(n).pickup;
    refreshCounter();
    return { theme: "t-blue", cls: "home", html: h`
      <header class="home-top">
        <button type="button" class="who" data-go="me" aria-label="${t("home.meLabel", { nick: p.nick })}">${raw(A.buddy(p.buddy))}<span>${p.nick}</span></button>
        <button type="button" class="count-pill" data-go="jacket" aria-label="${t("home.patchesLabel", { n, total: TOTAL })}"><span class="pill-dot" aria-hidden="true"></span>${t("home.patches", { n, total: TOTAL })}</button>
      </header>
      <h1 class="sr-only" tabindex="-1">${t("home.title")}</h1>
      <div class="home-eagle">${raw(boi ? A.boi({ pose: "talk", label: t("teller.optionBoi"), cls: "home-eagle-art" }) : A.eagle({ label: "Eagle", look: "right", cls: "home-eagle-art" }))}<p class="bubble"${boi ? boiAttr() : ""}>${greet}</p></div>
      ${pend ? h`<button type="button" class="card card-peach holding" data-go="bin">
          <span class="holding-text"><b>${t("home.holding", { item: cap(pend.item || t("types." + pend.type)) })}</b><span>${t("home.holdingSub")}</span></span>${ico("chevron", { width: 2.6 })}</button>` : ""}
      <button type="button" class="card card-navy jacket-card" data-go="jacket">
        <span class="row-between"><b>${t("home.jacket")}</b><span class="peach">${n >= TOTAL ? t("home.allDone") : tn("home.toGo", TOTAL - n)}</span></span>
        <span class="dots13" aria-hidden="true">${range(TOTAL).map(i => h`<span class="${i <= n ? "on" : ""}"></span>`)}</span>
      </button>
      <button type="button" class="card card-blue2 counter" id="counter" data-go="impact">${ico("globe", { size: 30, width: 2.2 })}<p>${counterText()}</p>${ico("chevron", { width: 2.6 })}</button>
      ${n >= TOTAL ? h`<button type="button" class="card card-peach holding" data-go="finale"><span class="holding-text"><b>${t("home.finale")}</b><span>${t("home.finaleSub")}</span></span>${ico("chevron", { width: 2.6 })}</button>` : ""}
      <div class="grow"></div>
      ${pend ? h`<button type="button" class="btn btn-primary btn-big" data-go="bin">${ico("check", { size: 30, width: 2.6 })}${t("home.binNow")}</button>`
        : h`<button type="button" class="btn btn-primary btn-big" data-go="scan">${ico("camera", { size: 30, width: 2.4 })}${t("home.scan")}</button>`}
      ${nav("home")}` };
  };
  const counterText = () => S.pickups > 0 ? h`${splitBold(t("home.counter"), "n", fmt(S.pickups))} ${t("home.schools")}` : h`${t("home.schools")}`;

  screens.scan = () => {
    if (S.pending && !S.pending.saved) { S.pending = null; persist(); }   // an unconfirmed find is dropped when the camera opens again
    return { theme: "t-scan", cls: "scan", html: h`
      <div class="scan-media"><video id="cam" playsinline muted autoplay hidden></video><div class="scan-art" id="scanArt">${raw(A.scene())}</div></div>
      <div class="scan-dim" aria-hidden="true"></div>
      <div class="scan-ui">
        <div class="top"><button type="button" class="circle-btn" data-go="home" aria-label="${t("scan.close")}">${ico("close", { width: 2.6 })}</button>${steps(1)}</div>
        <h1 class="scan-hint" tabindex="-1">${t("scan.hint")}</h1>
        <div class="scan-frame-wrap">${raw(A.frame())}</div>
        <div class="scan-bottom">
          <p class="scan-status" id="scanStatus" role="status">${t("scan.starting")}</p>
          <button type="button" class="shutter" data-act="shoot" aria-label="${t("scan.shutter")}">${ico("camera", { size: 38, width: 2.4 })}</button>
          <p class="scan-note">${t("scan.privacy")}</p>
          <button type="button" class="btn-link" data-act="choose">${t("scan.choose")}</button>
        </div>
      </div>
      <input type="file" accept="image/*" capture="environment" id="fileCam" class="sr-only" tabindex="-1" aria-hidden="true">
      <input type="file" accept="image/*" id="filePick" class="sr-only" tabindex="-1" aria-hidden="true">
      <div class="scan-busy" id="scanBusy" hidden><span class="spinner" aria-hidden="true"></span><p role="status">${t("scan.looking")}</p></div>`,
      after: startScanScreen };
  };

  screens.found = () => {
    const p = S.pending, next = S.binned + 1, extra = next > TOTAL, boi = isBoi();
    return { theme: "t-cream", cls: "found", html: h`
      <div class="top">${backBtn(t("found.back"), 'data-act="rescan"')}${steps(2)}</div>
      ${photo(S.scan.image, h`<span class="badge badge-green">${ico("check", { size: 18, width: 3 })}${t("found.safe")}</span>`)}
      <div class="titles">
        <h1 tabindex="-1">${cap(p.item || t("types." + p.type))}</h1>
        <p class="bin-line"><span class="swatch swatch-${p.bin}"></span><span>${t("found.goes." + p.bin)}</span></p>
      </div>
      <div class="grow say-end">${boi ? (extra ? sayBoi(t("found.extra"), false) : sayBoi(B(S.boi.added.found))) : say(extra ? t("found.extra") : t("found.bubble." + chapter(next).body))}</div>
      ${extra || boi ? h`<button type="button" class="btn btn-primary" data-go="bin">${t("found.binIt")}</button>`
        : h`<button type="button" class="btn btn-primary" ${raw(goAttrs("story", { n: next, from: "round" }))}>${t("found.hear")}</button>`}
      <button type="button" class="btn-link" data-act="rescan">${t("found.wrong")}</button>` };
  };

  screens.story = ({ n, from = "round" }) => {
    const ch = chapter(n), c = L(ch), round = from === "round", boiRound = from === "boi", img = safeImg(ch.image);
    const back = round ? (S.scan && S.scan.kind === "found" ? backBtn(t("found.back"), goAttrs("found")) : backBtn(t("back"), goAttrs("home")))
      : boiRound ? backBtn(t("back"), goAttrs(S.earned && S.earned.n === n && isBoi() ? "feast" : "home")) : backBtn(t("back"), goAttrs(from));
    const end = round ? h`<button type="button" class="btn btn-primary" data-go="bin">${t("story.binNow")}</button>`
      : boiRound ? (n >= TOTAL ? h`<button type="button" class="btn btn-primary" data-go="finale">${t("unlocked.finale")}</button><button type="button" class="btn btn-outline" data-go="jacket">${t("unlocked.jacket")}</button>`
        : h`<button type="button" class="btn btn-primary" data-go="scan">${t("unlocked.again")}</button><button type="button" class="btn btn-outline" data-go="jacket">${t("unlocked.jacket")}</button>`)
      : h`<button type="button" class="btn btn-outline" ${raw(goAttrs(from))}>${from === "finale" ? t("story.toFinale") : from === "explore" ? t("explore.back") : t("story.toJacket")}</button>`;
    const section = sec => sec.k === "help"
      ? h`<div class="help-box">${ico("checkCircle", { size: 28, width: 2.6 })}<p><b>${t("story.sec.help")}:</b> ${sec.t}</p></div>`
      : h`<section class="sec"><h2>${t("story.sec." + sec.k)}</h2>${sec.list ? h`<ul>${sec.list.map(x => h`<li>${x}</li>`)}</ul>` : h`<p>${sec.t}</p>`}</section>`;
    return { theme: "t-cream", cls: "story", html: h`
      <div class="story-head">
        <div class="top">${back}${round ? steps(2) : boiRound ? steps(4) : ""}</div>
        <div class="story-title">
          <div class="story-text"><span class="chip">${t("story.chapter", { n, tag: c.tag })}</span><h1 tabindex="-1">${c.title}</h1><span class="where">${c.place}</span></div>
          <div class="story-patch">${raw(A.patch(n, ch.body, t("story.patchAlt", { short: c.short })))}</div>
        </div>
      </div>
      <div class="story-body">
        ${isBoi() ? h`<div class="boi-intro">${sayBoi(B(S.boi.chapters[n - 1]))}${n === 2 ? h`<div class="tall-friends">${raw(A.tallFriends())}</div>` : ""}</div>` : ""}
        ${img ? h`<figure class="story-photo"><img src="${img}" alt="${c.title}"><figcaption>${t("story.credit", { by: ch.credit || "NASA" })}</figcaption></figure>` : ""}
        ${listenBtn("chapter:" + n)}
        ${c.sections.map(section)}
        <div class="hook-say">${isBoi() ? sayBoi(h`<b>${t("story.hook")}</b> ${c.hook}`, false) : say(h`<b>${t("story.hook")}</b> ${c.hook}`, { mood: "happy" })}</div>
        <p class="sources"><b>${t("story.sources")}:</b> ${ch.links.map((l, i) => h`${i ? ", " : ""}<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer">${l.name}</a>`)}</p>
        <div class="grow"></div>
        ${end}
      </div>` };
  };

  screens.bin = () => {
    const p = S.pending, extra = S.binned >= TOTAL, found = !!(S.scan && S.scan.kind === "found"), inRound = found && !extra, boi = isBoi();
    const color = t("bin.names." + p.bin)[0].toLowerCase();
    const back = boi && found ? backBtn(t("back"), goAttrs("found"))
      : inRound ? backBtn(t("bin.back"), goAttrs("story", { n: S.binned + 1, from: "round" })) : backBtn(t("back"), goAttrs("home"));
    return { theme: "t-cream", cls: "bin", html: h`
      <div class="top">${back}${steps(boi ? 2 : 3)}</div>
      <div class="titles"><h1 tabindex="-1">${t("bin.title." + p.bin)}</h1><p class="sub">${t("bin.meaning." + p.bin)} ${extra ? t("bin.thenTap") : t("bin.thenTapPatch")}</p></div>
      <div class="bin-art">${raw(A.bin(p.bin, t("bin.art", { color })))}</div>
      <div class="legend${p.bin === "special_dropoff" ? " four" : ""}" role="list" aria-label="${t("bin.legend")}">${["white", "green", "black"].map(k => binChip(k, k === p.bin))}${p.bin === "special_dropoff" ? binChip("special_dropoff", true) : ""}</div>
      <div class="grow"></div>
      <button type="button" class="btn btn-primary" data-act="binned">${ico("check", { size: 28, width: 2.6 })}${p.bin === "special_dropoff" ? t("bin.doneSpecial") : t("bin.done")}</button>
      <button type="button" class="btn-link" data-act="later">${t("bin.later")}</button>` };
  };

  screens.unlocked = () => {
    const e = S.earned;
    if (e.extra) return { theme: "t-blue", cls: "unlocked", html: h`
      ${raw(A.sparkles())}
      <div class="grow center-col">${raw(A.eagle({ label: "Eagle", cls: "mid-eagle" }))}<h1 tabindex="-1">${t("unlocked.extraTitle")}</h1><p class="line">${tn("unlocked.extraLine", S.log.length)}</p></div>
      <button type="button" class="btn btn-primary" data-go="scan">${t("unlocked.again")}</button>
      <button type="button" class="btn btn-outline" data-go="finale">${t("unlocked.finale")}</button>`, after: confetti };
    const n = e.n, ch = chapter(n), c = L(ch), last = n >= TOTAL;
    return { theme: "t-blue", cls: "unlocked", html: h`
      ${raw(A.sparkles())}
      <div class="top center">${steps(4)}</div>
      <div class="center-col">
        <div class="big-patch">${raw(A.patch(n, ch.body, t("story.patchAlt", { short: c.short })))}</div>
        <h1 tabindex="-1">${t("unlocked.title")}</h1>
        <p class="patch-name">${c.short}</p>
        <p class="line">${t("unlocked.line")}</p>
        <div class="progress" role="img" aria-label="${t("unlocked.of", { n, total: TOTAL })}">
          <span class="progress-dots">${range(TOTAL).map(i => h`<span class="${i < n ? "on" : i === n ? "on now" : ""}"></span>`)}</span>
          <b>${t("home.patches", { n, total: TOTAL })}</b>
        </div>
      </div>
      ${say(c.pickup)}
      <div class="grow"></div>
      ${last ? h`<button type="button" class="btn btn-primary" data-go="finale">${t("unlocked.finale")}</button><button type="button" class="btn btn-outline" data-go="jacket">${t("unlocked.jacket")}</button>`
        : h`<button type="button" class="btn btn-primary" data-go="jacket">${t("unlocked.jacket")}</button><button type="button" class="btn btn-outline" data-go="scan">${t("unlocked.again")}</button>`}`,
      after: confetti };
  };

  /* The Boi's pick-up moment: Bernúncia gobbles the confirmed piece ("Nhac!"), her tummy glows a little brighter, the Boi says
     his line and the next explorer wakes up with a little dance; then its chapter opens. It plays once per pick-up:
     coming Back to this screen shows it settled, with no second "Nhac!". */
  let feastTimers = [];
  screens.feast = () => {
    const e = S.earned, played = !!e.played, fed = Math.min(S.binned, TOTAL), cls = "feast" + (played ? " is-played" : "");
    const stage = h`<div class="feast-stage${played ? " fed" : ""}" id="feastStage">${raw(A.bernuncia({ fed: played || e.extra ? fed : fed - 1, animated: !played, cls: "bern-big" }))}<h1 class="nhac" tabindex="-1"${boiAttr()}>${B(S.boi.sound)}</h1></div>`;
    if (e.extra) return { theme: "t-blue", cls, html: h`
      ${stage}
      <div class="feast-say">${sayBoi(tn("unlocked.extraLine", S.log.length), false)}</div>
      <div class="grow"></div>
      <button type="button" class="btn btn-primary" data-go="scan">${t("unlocked.again")}</button>
      <button type="button" class="btn btn-outline" data-go="finale">${t("unlocked.finale")}</button>`, after: playFeast };
    const n = e.n, ch = chapter(n), c = L(ch);
    return { theme: "t-blue", cls, html: h`
      <div class="top center">${steps(3)}</div>
      ${stage}
      <div class="feast-say">${sayBoi(pickupLine(n))}</div>
      <div class="wake${played ? " awake" : ""}" id="wake">
        <div class="wake-patch">${raw(A.patch(n, ch.body, t("story.patchAlt", { short: c.short })))}<span class="zzz" aria-hidden="true">z z z</span></div>
        <b class="patch-name">${c.short}</b>
        <div class="progress" role="img" aria-label="${t("unlocked.of", { n, total: TOTAL })}">
          <span class="progress-dots">${range(TOTAL).map(i => h`<span class="${i < n ? "on" : i === n ? "on now" : ""}"></span>`)}</span>
          <b>${t("home.patches", { n, total: TOTAL })}</b>
        </div>
      </div>
      <div class="grow"></div>
      <button type="button" class="btn btn-primary" ${raw(goAttrs("story", { n, from: "boi" }))}>${t("found.hear")}</button>`, after: playFeast };
  };
  function playFeast() {
    const e = S.earned;
    if (!e || e.played) return;
    e.played = true;
    const stage = document.getElementById("feastStage"), svg = stage && stage.querySelector(".bern"), wake = document.getElementById("wake");
    const glow = A.bernGlow(Math.min(S.binned, TOTAL));
    const mouth = st => { if (svg) { svg.classList.remove("s-idle", "s-open", "s-chew"); svg.classList.add("s-" + st); } };
    const brighter = () => { if (svg) svg.querySelectorAll("[data-part]").forEach(el => { el.style.opacity = glow[el.dataset.part]; }); };
    const ate = () => { if (stage) stage.classList.add("fed"); sound.nhac(); };
    const awake = () => { if (wake) wake.classList.add("awake"); if (!e.extra) sound.wake(); };
    if (reducedMotion()) { brighter(); ate(); if (wake) wake.classList.add("awake"); return; }
    const at = (ms, fn) => feastTimers.push(setTimeout(fn, ms));
    at(180, () => mouth("open"));
    at(560, () => { mouth("chew"); ate(); });
    at(1000, () => { mouth("idle"); brighter(); });
    at(1250, awake);
  }

  screens.danger = () => {
    const r = S.scan.result || {}, item = r.item ? lower(r.item) : t("danger.fallback");
    return { theme: "t-cream", cls: "danger", html: h`
      <div class="top"><span></span>${steps(1)}</div>
      ${photo(S.scan.image, h`<span class="badge badge-yellow">${ico("warning", { size: 18, width: 2.6 })}${t("danger.badge")}</span>`)}
      <div class="titles"><h1 tabindex="-1">${t("danger.title")}</h1><p class="sub">${splitBold(t("danger.looks"), "item", item)}</p></div>
      <ol class="steps-list">${t("danger.steps").map((s, i) => h`<li><span class="num" aria-hidden="true">${i + 1}</span><span>${s}</span></li>`)}</ol>
      <div class="grow say-end">${say(t("danger.bubble"), { mood: "worried", look: "center", label: t("danger.eagle") })}</div>
      <button type="button" class="btn btn-primary" data-act="rescan">${t("danger.again")}</button>
      <button type="button" class="btn-link" data-go="home">${t("danger.home")}</button>` };
  };

  screens.retry = () => {
    const sc = S.scan;
    return { theme: "t-cream", cls: "retry", html: h`
      <div class="top">${backBtn(t("retry.home"), goAttrs("home"))}${steps(1)}</div>
      ${sc.image ? photo(sc.image) : ""}
      <h1 tabindex="-1">${t("retry." + sc.kind)}</h1>
      <div class="grow say-end">${say(sc.message || t("errors.generic"), { mood: sc.kind === "error" ? "worried" : "smile", look: "center" })}</div>
      <button type="button" class="btn btn-primary" data-act="rescan">${ico("refresh", { size: 26, width: 2.6 })}${t("retry.again")}</button>
      <button type="button" class="btn-link" data-go="home">${t("retry.home")}</button>` };
  };

  screens.jacket = () => {
    const n = S.binned, boi = isBoi();
    const cards = range(TOTAL).map(i => {
      const ch = chapter(i), c = L(ch), isNew = i === S.lastNew;
      return i <= n
        ? h`<button type="button" class="patch-card${isNew ? " is-new" : ""}" ${raw(goAttrs("story", { n: i, from: "jacket" }))}>${raw(A.patch(i, ch.body))}<span>${c.short}${isNew ? h` <em>· ${t("jacket.newTag")}</em>` : ""}</span></button>`
        : h`<div class="patch-card locked"><span class="q${boi ? " zz" : ""}" aria-hidden="true">${boi ? "zzz" : "?"}</span><span>${t("jacket.locked", { place: t("bodies." + ch.body) })}</span></div>`;
    });
    const cta = S.pending ? h`<button type="button" class="btn btn-primary" data-go="bin">${ico("check", { size: 28, width: 2.6 })}${t("home.binNow")}</button>`
      : n >= TOTAL ? h`<button type="button" class="btn btn-primary" data-go="finale">${t("home.finale")}</button>`
      : h`<button type="button" class="btn btn-primary" data-go="scan">${ico("camera", { size: 28, width: 2.4 })}${t("jacket.scan")}</button>`;
    return { theme: "t-blue", cls: "jacket", html: h`
      <div class="row-between end"><h1 tabindex="-1">${t("jacket.title")}</h1><span class="count">${t("home.patches", { n, total: TOTAL })}</span></div>
      <div class="jacket3d" id="jacket3d" aria-hidden="true" hidden></div>
      <p class="sub jacket3d-hint" id="jacket3dHint" hidden>${t("jacket.spin")}</p>
      <p class="sub">${t("jacket.hint")}</p>
      <div class="patches">${cards}</div>
      <section class="map-card"><h2>${t("finale.map")}</h2>${raw(A.map(n, t("map"), t("finale.mapLabel")))}</section>
      <button type="button" class="btn-link" ${raw(goAttrs("opening", { from: "jacket" }))}>${t("jacket.opening")}</button>
      <div class="grow"></div>
      ${cta}
      ${nav("jacket")}`, after: showJacket3d };
  };

  /* The 3D jacket (jacket3d.js, loaded only when this screen opens). Patches earned since the last
     visit get stuck on with an animation. If 3D can't run on this phone, the patch cards are enough. */
  let jacket3dScript = null;
  function showJacket3d() {
    const el = document.getElementById("jacket3d");
    if (!el || !window.WebGLRenderingContext) return;
    if (!jacket3dScript) jacket3dScript = new Promise((ok, fail) => {
      const s = document.createElement("script"); s.src = "jacket3d.js"; s.onload = ok; s.onerror = () => { jacket3dScript = null; fail(); };
      document.head.appendChild(s);
    });
    jacket3dScript.then(() => {
      if (!el.isConnected || !window.JACKET3D) return;
      const n = S.binned, seen = int(load("jacketSeen", Math.max(0, n - 1)), 0, n);
      const reduced = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
      return window.JACKET3D.mount(el, { earned: n, fresh: range(n).filter(i => i > seen), reduced,
        patchSvg: i => A.patch(i, chapter(i).body), onStuck: i => save("jacketSeen", Math.max(i, int(load("jacketSeen", 0), 0, TOTAL))) });
    }).then(ok => { const hint = document.getElementById("jacket3dHint"); if (ok && hint) hint.hidden = false; }).catch(() => {});
  }

  const grownupsCard = from => h`<section class="card card-navy grownups"><h2>${t("me.grownups")}</h2>
      <button type="button" class="row-link" ${raw(goAttrs("safety", { from }))}>${t("me.safety")}${ico("chevron", { size: 20, width: 2.6 })}</button>
      <button type="button" class="row-link" ${raw(goAttrs("photos", { from }))}>${t("me.photos")}${ico("chevron", { size: 20, width: 2.6 })}</button>
      <button type="button" class="row-link" ${raw(goAttrs("explore", { from }))}>${t("me.explore")}${ico("chevron", { size: 20, width: 2.6 })}</button>
      <button type="button" class="row-link" ${raw(goAttrs("usage", { from }))}>${t("me.usage")}${ico("chevron", { size: 20, width: 2.6 })}</button>
      <button type="button" class="row-link" ${raw(goAttrs("sources", { from }))}>${t("me.sources")}${ico("chevron", { size: 20, width: 2.6 })}</button>
      <p class="fine">${t("me.privacy")}</p>
      ${from === "me" ? h`<button type="button" class="row-link quiet" data-act="reset">${t("me.reset")}</button>` : ""}
    </section>`;

  const tellerPick = () => !S.boi ? "" : h`<section class="card teller-set" aria-labelledby="tellerLbl"><h2 id="tellerLbl">${t("teller.settingLabel")}</h2>
      <div class="teller-pick">${["space", "boi"].map(k => h`<button type="button" id="teller-${k}" data-act="teller" data-teller="${k}" aria-pressed="${S.teller === k}">${raw(k === "boi" ? A.boiHead({ mood: "smile" }) : A.eagleHead({ mood: "smile" }))}<span><b>${t(k === "boi" ? "teller.optionBoi" : "teller.optionSpace")}</b>${k === "boi" ? h`<small>${t("teller.boiTag")}</small>` : ""}</span></button>`)}</div>
      <p class="note">${t("teller.credit")}</p></section>`;

  screens.me = () => {
    const p = S.profile, count = type => S.log.filter(x => x.type === type).length;
    return { theme: "t-cream", cls: "me", html: h`
      <div class="me-head">${raw(A.buddy(p.buddy))}<div class="me-name"><h1 tabindex="-1">${p.nick}</h1><span class="sub">${t("me.buddy", { name: buddyName(p.buddy) })}</span></div>
        <button type="button" class="pill-btn" ${raw(goAttrs("profile", { from: "me" }))}>${t("me.change")}</button></div>
      <section class="card"><h2>${t("me.log")}</h2><div class="tiles">
        <div class="tile strong"><b>${fmt(S.log.length)}</b><span>${t("me.binned")}</span></div>
        <div class="tile"><b>${fmt(count("plastic"))}</b><span>${t("me.plastic")}</span></div>
        <div class="tile"><b>${fmt(count("paper_cardboard"))}</b><span>${t("me.paper")}</span></div>
        <div class="tile"><b>${fmt(count("can"))}</b><span>${t("me.cans")}</span></div>
      </div></section>
      <section class="card row-between"><label for="lang"><b>${t("me.language")}</b></label>
        <select id="lang" class="select" data-change="lang">${LANGS.map(l => h`<option value="${l}" lang="${l}" ${l === S.lang ? raw("selected") : ""}>${UI[l].langName}</option>`)}</select></section>
      ${tellerPick()}
      ${grownupsCard("me")}
      <div class="grow"></div>
      ${nav("me")}` };
  };

  screens.grownups = () => ({ theme: "t-cream", cls: "info", html: h`
    <div class="top">${backBtn(t("back"), goAttrs("welcome"))}</div>
    <h1 tabindex="-1">${t("welcome.grownups")}</h1>
    ${grownupsCard("grownups")}
    <div class="grow"></div>` });

  screens.photos = ({ from = "me" }) => ({ theme: "t-cream", cls: "info", html: h`
    <div class="top">${backBtn(t("back"), goAttrs(from))}</div>
    <h1 tabindex="-1">${t("photos.title")}</h1>
    ${t("photos.body").map(p => h`<p class="para">${p}</p>`)}
    <div class="grow"></div>
    <button type="button" class="btn btn-outline" ${raw(goAttrs(from))}>${t("back")}</button>` });

  /* Every chapter open, without scanning (for teachers, parents and judges). It never changes the player's patches. */
  screens.explore = ({ from = S.profile ? "me" : "grownups" }) => {
    S.exploreFrom = from;
    const cards = range(TOTAL).map(i => {
      const ch = chapter(i), c = L(ch);
      return h`<button type="button" class="patch-card" ${raw(goAttrs("story", { n: i, from: "explore" }))}>${raw(A.patch(i, ch.body))}<span>${c.short}</span></button>`;
    });
    return { theme: "t-blue", cls: "jacket", html: h`
      <div class="top">${backBtn(t("back"), goAttrs(from))}</div>
      <div class="row-between end"><h1 tabindex="-1">${t("explore.title")}</h1><span class="count">${TOTAL}</span></div>
      <p class="sub">${t("explore.hint")}</p>
      ${tellerPick()}
      <div class="patches">${cards}</div>
      <section class="map-card"><h2>${t("finale.map")}</h2>${raw(A.map(TOTAL, t("map"), t("finale.mapLabel")))}</section>
      <button type="button" class="btn-link" ${raw(goAttrs("opening", { from: "explore" }))}>${t("jacket.opening")}</button>
      <div class="grow"></div>` };
  };

  /* Live usage: real numbers from /api/counter, refreshed every 15 seconds while the screen is open. */
  let usageTimer = null;
  const usageTiles = j => {
    const n = v => fmt(Number(v) || 0), ty = (j.live && j.live.types) || {}, d = j.live || {};
    return h`<section class="card"><h2>${t("usage.all")}</h2><div class="tiles three">
        <div class="tile strong wide"><b>${n(j.total)}</b><span>${t("usage.total")}</span></div>
        <div class="tile"><b>${n(ty.plastic)}</b><span>${t("me.plastic")}</span></div>
        <div class="tile"><b>${n(ty.paper_cardboard)}</b><span>${t("me.paper")}</span></div>
        <div class="tile"><b>${n(ty.can)}</b><span>${t("me.cans")}</span></div>
      </div></section>
      <section class="card"><h2>${t("usage.today")}</h2><div class="tiles three">
        <div class="tile"><b>${n(d.players)}</b><span>${t("usage.players")}</span></div>
        <div class="tile"><b>${n(d.photos)}</b><span>${t("usage.photos")}</span></div>
        <div class="tile"><b>${n(d.pieces)}</b><span>${t("usage.pieces")}</span></div>
      </div></section>`;
  };
  function loadUsage() {
    const box = document.getElementById("usage"); if (!box || DEMO) return;
    fetch("/api/counter").then(r => (r.ok ? r.json() : Promise.reject())).then(j => {
      if (!document.getElementById("usage") || typeof j.total !== "number") return;
      box.innerHTML = usageTiles(j).s;
    }).catch(() => { if (document.getElementById("usage") && !box.querySelector(".tiles")) box.innerHTML = h`<p class="para">${t("usage.fail")}</p>`.s; });
  }
  screens.usage = ({ from = S.profile ? "me" : "grownups" }) => ({ theme: "t-cream", cls: "info", html: h`
    <div class="top">${backBtn(t("back"), goAttrs(from))}</div>
    <h1 tabindex="-1">${t("usage.title")}</h1>
    <p class="para">${t("usage.intro")}</p>
    <div id="usage" aria-live="polite"><p class="para">${DEMO ? t("usage.demo") : t("usage.wait")}</p></div>
    <p class="para">${t("usage.note")}</p>
    <div class="grow"></div>
    <button type="button" class="btn btn-outline" ${raw(goAttrs(from))}>${t("back")}</button>`,
    after: () => { loadUsage(); clearInterval(usageTimer); usageTimer = setInterval(loadUsage, 15000); } });

  screens.sources = ({ from = "me" }) => ({ theme: "t-cream", cls: "info", html: h`
    <div class="top">${backBtn(t("back"), goAttrs(from))}</div>
    <h1 tabindex="-1">${t("sources.title")}</h1>
    <p class="para">${t("sources.intro")}</p>
    ${S.boi ? h`<p class="para">${t("teller.credit")}</p>` : ""}
    <ol class="src-list">${S.content.chapters.map(ch => h`<li><b>${L(ch).short}</b><span>${ch.links.map((l, i) =>
      h`${i ? " · " : ""}<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer">${l.name}</a>`)}</span></li>`)}</ol>
    <button type="button" class="btn btn-outline" ${raw(goAttrs(from))}>${t("back")}</button>` });

  screens.finale = () => {
    const f = L(S.content.finale), first = !S.finaleSeen, boi = isBoi(), la = boiAttr();
    if (first) { S.finaleSeen = true; persist(); }
    return { theme: "t-blue", cls: "finale", html: h`
      <div class="top">${backBtn(t("finale.home"), goAttrs("home"))}</div>
      <span class="kicker">${t("finale.kicker")}</span>
      <h1 tabindex="-1">${f.title}</h1>
      ${boi ? h`<div class="party" aria-hidden="true">
        <div class="dance-row">${range(TOTAL).map(i => raw(A.patch(i, chapter(i).body)))}</div>
        <div class="party-cast">${raw(A.boi({ pose: "dance", cls: "boi-dancing" }))}${raw(A.bernuncia({ fed: TOTAL, mirror: true, cls: "bern-party" }))}</div>
      </div>` : ""}
      ${listenBtn("finale")}
      ${boi ? B(S.boi.finale).map(p => h`<p class="script"${la}>${p}</p>`) : f.script.map(p => h`<p class="script">${p}</p>`)}
      <div class="card card-navy count-card">${tn("finale.count", S.log.length)}</div>
      <section class="map-card"><h2>${t("finale.map")}</h2>${raw(A.map(S.binned, t("map"), t("finale.mapLabel")))}</section>
      <section><h2>${t("finale.patches")}</h2><div class="badges">${range(TOTAL).map(i =>
        h`<button type="button" class="badge-btn" ${raw(goAttrs("story", { n: i, from: "finale" }))} aria-label="${chText(i).short}">${raw(A.patch(i, chapter(i).body))}</button>`)}</div></section>
      ${boi ? h`<button type="button" class="btn btn-primary" data-go="impact">${t("finale.impact")}</button><button type="button" class="btn-link" data-go="home">${t("finale.home")}</button>`
        : h`<button type="button" class="btn btn-primary" data-go="home">${t("finale.home")}</button>`}`,
      after: () => { if (first) confetti(); if (boi && fromTap()) sound.festa(); } };
  };

  /* ---------- Impact: litter to the Moon (the team's spec) ---------- */
  screens.impact = () => {
    if (!S.impact || S.impact.visit !== visit) startImpact();
    const I = S.impact, IM = window.IMPACT;
    const head = h`<div class="impact-head"><h1 tabindex="-1">${t("impact.title")}</h1><span class="tag">${t("impact.pilot")}</span>${DEMO ? h`<span class="tag tag-demo">${t("impact.demoData")}</span>` : ""}</div>`;
    if (I.status !== "ok") return { theme: "t-blue", cls: "impact", html: h`${head}
      <div class="grow center-col">${I.status === "error"
        ? h`<p class="lede">${t("impact.error")}</p><button type="button" class="btn btn-outline" data-act="impactRetry">${t("impact.again")}</button>`
        : h`<span class="spinner" aria-hidden="true"></span><p role="status">${t("impact.loading")}</p>`}</div>
      ${nav("impact")}` };
    const w = IM.tower(I.total), H = m => IM.formatHeight(m, locale()), name = m => m[S.lang] || m.en, height = H(w.heightM);
    const row = (m, cls) => h`<div class="ms ${cls}">${raw(A.milestone(m.id))}<span><b>${cap(name(m))}</b><small>${H(m.heightM)}</small></span></div>`;
    const dots = IM.MILESTONES.filter(m => m.id !== "moon").map(m => ({ pos: IM.stripPos(m.heightM), passed: !!w.passed && m.heightM <= w.passed.heightM }));
    return { theme: "t-blue", cls: "impact", html: h`${head}
      <div class="total-card">
        <p class="big-total" id="bigTotal" aria-hidden="true">${fmt(I.animated ? I.total : 0)}</p>
        <p class="total-label" aria-hidden="true">${t("impact.totalLabel")}</p>
        <p class="sr-only">${fmt(I.total)} ${t("impact.totalLabel")}</p>
      </div>
      ${w.moonLine ? h`<p class="moon-line">${t("impact.moonBags")}</p>` : ""}
      <section class="tower-card" aria-labelledby="towerLine">
        <p class="tower-line" id="towerLine">${w.passed ? t("impact.towerPassed", { height, passed: name(w.passed) }) : t("impact.towerStart", { height })}</p>
        ${row(w.next || w.passed, "next")}
        <div class="stack-wrap${I.animated ? "" : " grow-in"}">${raw(A.stack(w.progress))}</div>
        ${w.passed && w.next ? row(w.passed, "passed") : ""}
        <p class="next-stop">${w.next ? t("impact.nextStop", { next: name(w.next) }) : t("impact.reachedMoon")}</p>
      </section>
      <div class="strip-card">${raw(A.strip(dots, IM.stripPos(w.heightM), { earth: t("impact.earth"), moon: t("impact.moon") }, t("impact.strip", { height })))}</div>
      <p class="footnote">${t("impact.assumption")}</p>
      ${nav("impact")}`,
      after: () => { if (!I.animated) { I.animated = true; countUp(document.getElementById("bigTotal"), I.total); } } };
  };
  /* The big number counts up from 0 in about 1.5 s, or shows at once when the phone asks for less motion. */
  function countUp(el, to) {
    if (!el) return;
    if (!(to > 0) || (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) { el.textContent = fmt(to); return; }
    const start = performance.now(), ms = 1500;
    const step = now => {
      if (!el.isConnected) return;
      const k = Math.min(1, (now - start) / ms);
      el.textContent = fmt(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  /* A fresh total each time the screen opens; pick-ups still waiting on this phone are sent first. */
  function startImpact() {
    const v = visit;
    if (DEMO) { S.impact = { visit: v, status: "ok", total: demoTotal, animated: false }; return; }
    S.impact = { visit: v, status: "loading", total: null, animated: false };
    sendTickets()
      .then(() => fetch("/api/counter", { cache: "no-store" }))
      .then(r => (r.ok ? r.json() : Promise.reject(new Error("counter"))))
      .then(j => {
        if (typeof j.pickups !== "number") throw new Error("counter");
        S.pickups = j.pickups; S.counterAt = Date.now();
        if (S.impact && S.impact.visit === v) Object.assign(S.impact, { status: "ok", total: j.pickups });
      })
      .catch(() => { if (S.impact && S.impact.visit === v) S.impact.status = "error"; })
      .then(() => { if (S.impact && S.impact.visit === v && S.view && S.view.name === "impact") render(false); });
  }

  /* ---------- Moving between screens (the phone's back button works too) ---------- */
  const okRound = () => !!(S.scan && S.pending && S.scan.kind === "found");
  const GUARD = {
    welcome: () => true, grownups: () => true, photos: () => true, sources: () => true, safety: () => true, profile: () => true, opening: () => true,
    storyteller: () => !!S.boi,
    home: () => !!S.profile, jacket: () => !!S.profile, me: () => !!S.profile,
    scan: () => !!S.profile && !(S.pending && S.pending.saved),
    found: okRound,
    danger: () => !!(S.scan && S.scan.kind === "danger"),
    retry: () => !!(S.scan && ["no", "unsure", "photo", "error"].includes(S.scan.kind)),
    story: p => Number.isInteger(p.n) && p.n >= 1 && p.n <= TOTAL && (p.from === "explore" || p.n <= S.binned || (!!S.pending && p.n === S.binned + 1)),
    explore: () => true, usage: () => true,
    bin: () => !!S.pending,
    unlocked: () => !!S.earned,
    feast: () => !!S.earned && isBoi(),
    finale: () => S.binned >= TOTAL,
    impact: () => true
  };
  const fallback = () => (S.profile ? "home" : "welcome");
  /* Screens an address like …/#jacket may open directly (a reload, a bookmark, a typed address). */
  const OPEN_BY_ADDRESS = ["home", "jacket", "impact", "me", "finale", "grownups", "photos", "sources", "explore", "usage"];
  let visit = 0;   // counts screen openings: the Impact screen reads a fresh total on each one
  let tapVisit = -1;   // the last opening that came from a tap (not the phone's Back button): music only plays after a tap
  const fromTap = () => tapVisit === visit;
  const fromAddress = () => { const name = location.hash.slice(1); return OPEN_BY_ADDRESS.includes(name) && GUARD[name]({}) ? name : fallback(); };
  function go(name, params = {}, { replace = false } = {}) {
    if (!screens[name] || !GUARD[name](params)) { name = fallback(); params = {}; replace = true; }
    leave();
    visit++; tapVisit = visit;
    S.view = { name, params };
    try { history[replace ? "replaceState" : "pushState"]({ name, params }, "", "#" + name); } catch {}
    render(true);
  }
  window.addEventListener("popstate", e => {
    if (!S.content) return;
    const known = e.state && screens[e.state.name];
    let name = known ? e.state.name : fromAddress(), params = (known && e.state.params) || {};
    if (!GUARD[name](params)) { name = fallback(); params = {}; }
    if (!known || name !== e.state.name) { try { history.replaceState({ name, params }, "", "#" + name); } catch {} }
    leave();
    visit++;
    S.view = { name, params };
    render(true);
  });
  function render(focus) {
    const { name, params } = S.view;
    const active = document.activeElement, keep = active && active.id, keepHeading = !!active && active.tagName === "H1";
    const v = screens[name](params || {});
    app.className = "screen " + v.theme + (v.cls ? " " + v.cls : "");
    app.innerHTML = v.html.s;
    document.documentElement.lang = S.lang;
    const h1 = app.querySelector("h1"), title = h1 ? h1.textContent.trim() : "";
    document.title = title && title !== "debris" ? `${title} · debris` : "debris";
    if (focus) window.scrollTo(0, 0);
    if (v.after) v.after();
    if (focus && h1) h1.focus({ preventScroll: true });
    else if (keep && document.getElementById(keep)) document.getElementById(keep).focus({ preventScroll: true });
    else if (keepHeading && h1) h1.focus({ preventScroll: true });
  }
  function leave() {
    clearInterval(usageTimer); if (window.JACKET3D) window.JACKET3D.unmount(); stopCamera(); stopSpeech();
    feastTimers.forEach(clearTimeout); feastTimers = []; sound.stop();
    const c = document.getElementById("confetti"); if (c) c.textContent = "";
  }

  /* ---------- Taps ---------- */
  app.addEventListener("click", e => {
    const el = e.target.closest("[data-go],[data-act]");
    if (!el || !app.contains(el)) return;
    if (isBoi()) sound.unlock();
    if (el.dataset.go) {
      const params = {};
      if (el.dataset.n) params.n = +el.dataset.n;
      if (el.dataset.from) params.from = el.dataset.from;
      go(el.dataset.go, params);
    } else if (ACT[el.dataset.act]) ACT[el.dataset.act](el);
  });
  app.addEventListener("change", e => {
    const el = e.target;
    if (el.matches("[data-change=lang]")) setLang(el.value);
    if (el.name === "buddy") app.querySelectorAll(".buddy").forEach(b => b.classList.toggle("on", b.contains(el)));
    if (el.name === "teller") app.querySelectorAll(".teller-card").forEach(b => b.classList.toggle("on", b.contains(el)));
  });
  app.addEventListener("input", e => {
    if (e.target.id !== "nick") return;
    const err = document.getElementById("nickErr"); if (err) err.hidden = true;
    e.target.removeAttribute("aria-invalid");
  });
  app.addEventListener("submit", e => {
    const tf = e.target.closest("form[data-form=teller]");
    if (tf) {
      e.preventDefault();
      const picked = tf.querySelector("input[name=teller]:checked");
      S.teller = picked && picked.value === "boi" ? "boi" : "space"; S.tellerChosen = true; persist();
      if (isBoi()) sound.unlock();
      return go(nextOnboarding());
    }
    const form = e.target.closest("form[data-form=profile]");
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector("#nick"), nick = input.value.replace(/\s+/g, " ").trim().slice(0, 16);
    if (!nick) { form.querySelector("#nickErr").hidden = false; input.setAttribute("aria-invalid", "true"); input.focus(); return; }
    const picked = form.querySelector("input[name=buddy]:checked");
    S.profile = { nick, buddy: picked ? picked.value : "eagle" };
    persist();
    go(form.dataset.from === "me" ? "me" : "home", {}, { replace: form.dataset.from === "me" });
  });

  // First launch: choose the storyteller (if the Boi's lines loaded), the opening, the safety rules, the nickname. Players who
  // already heard the opening never see the choice: they stay with the space story and can switch in Me.
  const nextOnboarding = () => (!S.introDone ? (S.boi && !S.tellerChosen ? "storyteller" : "opening") : !S.safetyDone ? "safety" : !S.profile ? "profile" : "home");
  const ACT = {
    start: () => go(nextOnboarding()),
    openingDone: () => { S.introDone = true; persist(); go(nextOnboarding()); },
    safetyDone: () => { S.safetyDone = true; persist(); go(nextOnboarding()); },
    lang: el => setLang(el.dataset.lang),
    teller: el => {
      const k = el.dataset.teller === "boi" ? "boi" : "space";
      if (k === S.teller) return;
      S.teller = k; persist(); stopSpeech(); sound.stop(); render(false);   // patches, the cleanup log and the jacket stay as they are
    },
    listen: el => toggleSpeech(el.dataset.key),
    shoot: () => shoot(),
    choose: () => { const f = document.getElementById("filePick"); if (f) f.click(); },
    rescan: () => { if (S.pending && !S.pending.saved) S.pending = null; S.scan = null; persist(); go("scan", {}, { replace: true }); },
    binned: () => binIt(),
    later: () => { if (S.pending) { S.pending.saved = true; persist(); } go("home"); },
    reset: () => {
      if (!window.confirm(t("me.resetConfirm"))) return;
      KEYS.forEach(k => { try { localStorage.removeItem(PREFIX + k); } catch {} });
      location.replace(location.pathname + location.search);
    },
    reload: () => location.reload(),
    impactRetry: () => { S.impact = null; render(false); }
  };

  function setLang(l) {
    if (!LANGS.includes(l) || l === S.lang) return;
    S.lang = l; persist(); stopSpeech();
    const banner = document.getElementById("demo"); if (banner && DEMO) banner.textContent = t("demo");
    render(false);
  }

  /* ---------- One round: bin it, earn the patch ---------- */
  function binIt() {
    const p = S.pending;
    if (!p) return go(fallback(), {}, { replace: true });
    S.log.push({ date: new Date().toISOString(), type: p.type || "other" });
    // The shared total goes up by 1 on the server with this piece's ticket, sent in the background: the patch never waits.
    if (DEMO) { demoTotal += 1; S.pickups = demoTotal; }
    else if (p.ticket) S.tickets = S.tickets.concat(p.ticket).slice(-50);
    if (S.log.length > 2000) S.log = S.log.slice(-2000);
    if (S.binned < TOTAL) { S.binned += 1; S.lastNew = S.binned; S.earned = { n: S.binned }; }
    else S.earned = { extra: true };
    S.pending = null; S.scan = null;
    persist();
    go(isBoi() ? "feast" : "unlocked", {}, { replace: true });
    sendTickets();
  }

  /* ---------- Camera and scanner ---------- */
  let stream = null, camToken = 0, busy = false;
  function startScanScreen() {
    busy = false;
    ["fileCam", "filePick"].forEach(id => { const f = document.getElementById(id); if (f) f.addEventListener("change", onFile); });
    startCamera();
  }
  async function startCamera() {
    const token = ++camToken, status = document.getElementById("scanStatus");
    const noCamera = () => { if (token === camToken && status) status.textContent = t("scan.noCamera"); };
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return noCamera();
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } }, audio: false });
      const video = document.getElementById("cam");
      if (token !== camToken || !video) { s.getTracks().forEach(tr => tr.stop()); return; }
      stream = s; video.srcObject = s; video.hidden = false;
      await video.play().catch(() => {});
      const art = document.getElementById("scanArt"); if (art) art.hidden = true;
      if (status) { status.textContent = ""; status.hidden = true; }
    } catch { noCamera(); }
  }
  function stopCamera() {
    camToken++;
    if (stream) { stream.getTracks().forEach(tr => tr.stop()); stream = null; }
  }
  async function shoot() {
    if (busy) return;
    const video = document.getElementById("cam");
    if (stream && video && video.videoWidth) return analyse(grab(video));
    if (DEMO) return analyse(await demoPhoto());
    const f = document.getElementById("fileCam"); if (f) f.click();
  }
  function grab(video) {
    const s = Math.min(1, 1024 / Math.max(video.videoWidth, video.videoHeight)), c = document.createElement("canvas");
    c.width = Math.round(video.videoWidth * s); c.height = Math.round(video.videoHeight * s);
    c.getContext("2d").drawImage(video, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  }
  /* Shrink a chosen photo on the phone (≤ 1024 px, JPEG) before it is sent. */
  function shrink(file) {
    return new Promise((ok, fail) => {
      const url = URL.createObjectURL(file), img = new Image();
      img.onload = () => {
        const s = Math.min(1, 1024 / Math.max(img.naturalWidth, img.naturalHeight)), c = document.createElement("canvas");
        c.width = Math.round(img.naturalWidth * s); c.height = Math.round(img.naturalHeight * s);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); ok(c.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => { URL.revokeObjectURL(url); fail(new Error("photo")); };
      img.src = url;
    });
  }
  async function onFile(e) {
    const f = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!f || busy) return;
    try { analyse(await shrink(f)); } catch { showRetry("error", null, t("errors.photo")); }
  }
  function setBusy(on) {
    busy = on;
    const b = document.getElementById("scanBusy"); if (b) b.hidden = !on;
    app.querySelectorAll(".shutter, [data-act=choose]").forEach(x => { x.disabled = on; });
  }
  async function analyse(image) {
    if (!image) return showRetry("error", null, t("errors.photo"));
    const token = camToken;
    setBusy(true);
    let j;
    try {
      if (DEMO) j = await demoScan();
      else {
        const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 25000);
        let r;
        try { r = await fetch("/api/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image, lang: S.lang }), signal: ctl.signal }); }
        finally { clearTimeout(timer); }
        j = await r.json().catch(() => ({}));
        if (!r.ok) { j = { error: j.error || t("errors.generic") }; }
      }
    } catch { j = { error: t("errors.offline") }; }
    if (token !== camToken || !S.view || S.view.name !== "scan") return;   // the child left the camera meanwhile
    setBusy(false);
    if (j.error) return showRetry("error", image, j.error);
    if (typeof j.total === "number") S.counter = j.total;   // pieces found (Live usage); pick-ups only change with a ticket
    const r = j.result || {};
    if (j.retake) return showRetry("photo", image, r.message);
    if (r.dangerous) { S.scan = { kind: "danger", image, result: r }; return go("danger", {}, { replace: true }); }
    if (r.is_trash === "yes") {
      S.pending = { item: String(r.item || "").slice(0, 40), type: r.type || "other", bin: BINS.includes(r.bin) ? r.bin : "black", saved: false, ticket: typeof j.ticket === "string" ? j.ticket : null };
      S.scan = { kind: "found", image, result: r };
      persist();
      return go("found", {}, { replace: true });
    }
    showRetry(r.is_trash === "unsure" ? "unsure" : "no", image, r.message);
  }
  function showRetry(kind, image, message) { S.scan = { kind, image, message }; go("retry", {}, { replace: true }); }

  /* ---------- Pick-ups waiting to be counted: sent one by one; if the phone is offline they wait for the next try ---------- */
  let sending = null;
  function sendTickets() {
    if (DEMO || !S.tickets.length) return Promise.resolve();
    if (sending) return sending;
    sending = (async () => {
      while (S.tickets.length) {
        let r, j = {};
        try { r = await fetch("/api/pickup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ticket: S.tickets[0] }) }); j = await r.json().catch(() => ({})); }
        catch { break; }                                              // offline: try again later
        if (!(r.ok || r.status === 400 || r.status === 410)) break;   // the server can't count right now
        S.tickets = S.tickets.slice(1); persist();                   // counted, already counted, or never countable
        if (r.ok && typeof j.pickups === "number") { S.pickups = j.pickups; S.counterAt = Date.now(); }
      }
    })().finally(() => { sending = null; });
    return sending;
  }

  /* ---------- The counter shared by everyone ---------- */
  function refreshCounter() {
    if (DEMO) { S.pickups = demoTotal; return; }
    if (Date.now() - S.counterAt < 60000) return;
    S.counterAt = Date.now();
    fetch("/api/counter").then(r => (r.ok ? r.json() : null)).then(j => {
      if (!j || typeof j.pickups !== "number") return;
      S.pickups = j.pickups; S.counter = j.total;
      const el = document.getElementById("counter");
      if (el) el.querySelector("p").innerHTML = counterText().s;
    }).catch(() => {});
  }

  /* ---------- Demo mode: no server, no AI ---------- */
  const DEMO_RESULTS = [
    { is_trash: "yes", type: "plastic", bin: "white", item: { en: "Plastic wrapper", es: "Envoltura de plástico", pt: "Embalagem de plástico" } },
    { is_trash: "yes", type: "can", bin: "white", item: { en: "Drink can", es: "Lata de gaseosa", pt: "Lata de refrigerante" } },
    { is_trash: "yes", type: "sharp_object", bin: "special_dropoff", dangerous: true, item: { en: "Broken glass", es: "Vidrio roto", pt: "Vidro quebrado" } },
    { is_trash: "yes", type: "organic", bin: "green", item: { en: "Banana peel", es: "Cáscara de banano", pt: "Casca de banana" } },
    { is_trash: "no", type: "none", bin: "none", item: { en: "Leaf", es: "Hoja", pt: "Folha" }, message: { en: "That's a leaf. Leaves aren't litter!", es: "Es una hoja. ¡Las hojas no son basura!", pt: "É uma folha. Folhas não são lixo!" } },
    { is_trash: "yes", type: "paper_cardboard", bin: "white", item: { en: "Paper cup", es: "Vaso de papel", pt: "Copo de papel" } },
    { photo_problem: "screen", is_trash: "no", type: "none", bin: "none", message: { en: "That looks like a screen. Take a photo of the real object, not a screen!", es: "Eso parece una pantalla. ¡Toma una foto del objeto de verdad, no de una pantalla!", pt: "Isso parece uma tela. Tire uma foto do objeto de verdade, não de uma tela!" } },
    { is_trash: "yes", type: "other", bin: "black", item: { en: "Dirty napkin", es: "Servilleta sucia", pt: "Guardanapo sujo" } }
  ];
  let demoN = 0;
  async function demoScan() {
    await new Promise(r => setTimeout(r, 1100));
    const d = DEMO_RESULTS[demoN++ % DEMO_RESULTS.length];
    const result = { photo_problem: d.photo_problem || "none", is_trash: d.is_trash, type: d.type, bin: d.bin, dangerous: !!d.dangerous, item: d.item ? L(d.item) : "", message: d.message ? L(d.message) : "" };
    const retake = result.photo_problem !== "none", counts = !retake && result.is_trash === "yes";
    return { result, retake, counts: counts && !result.dangerous, ticket: null };
  }
  /* Without a camera, demo mode "photographs" the drawn scene from the design. */
  function demoPhoto() {
    return new Promise(ok => {
      const svg = A.scene().replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" '), img = new Image();
      img.onload = () => { const c = document.createElement("canvas"); c.width = 640; c.height = 640; c.getContext("2d").drawImage(img, 0, 245, 390, 390, 0, 0, 640, 640); ok(c.toDataURL("image/jpeg", 0.85)); };
      img.onerror = () => ok(null);
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
    });
  }

  /* ---------- Reading aloud, where the browser can ---------- */
  const canSpeak = "speechSynthesis" in window && typeof window.SpeechSynthesisUtterance === "function";
  const VOICES = { en: ["en-US", "en-GB", "en"], es: ["es-MX", "es-US", "es-419", "es-CO", "es"], pt: ["pt-BR", "pt"] };
  let speaking = null;
  function voiceFor(lang) {
    const all = speechSynthesis.getVoices() || [];
    for (const want of VOICES[lang]) { const v = all.find(x => String(x.lang).replace("_", "-").toLowerCase().startsWith(want.toLowerCase())); if (v) return v; }
    return null;
  }
  function speechParts(key) {
    const mine = text => ({ text, lang: S.lang }), boi = text => ({ text, lang: boiLang() });
    if (key === "intro") {
      if (!isBoi()) { const i = L(S.content.intro); return [i.title, ...i.script, t("opening.hook"), i.hook, i.pickup].map(mine); }
      const b = S.boi;
      return [boi(B(b.added.title)), ...B(b.verse).map(boi), ...B(b.opening).map(boi), boi(B(b.firstPickup))];
    }
    if (key === "finale") { const f = L(S.content.finale); return [mine(f.title), ...(isBoi() ? B(S.boi.finale).map(boi) : f.script.map(mine))]; }
    const n = +key.split(":")[1], c = chText(n);
    return [...(isBoi() ? [boi(B(S.boi.chapters[n - 1]))] : []), mine(c.title),
      ...c.sections.map(s => mine(`${t("story.sec." + s.k)}. ${s.t || (s.list || []).join(" ")}`)), mine(t("story.hook")), mine(c.hook)];
  }
  function toggleSpeech(key) {
    if (!canSpeak) return;
    if (speaking === key) return stopSpeech();
    speechSynthesis.cancel();
    speaking = key; paintListen();
    const parts = speechParts(key).filter(p => p.text);
    parts.forEach(({ text, lang }, i) => {
      const u = new SpeechSynthesisUtterance(text), voice = voiceFor(lang);
      u.lang = VOICES[lang][0]; if (voice) u.voice = voice; u.rate = 0.95;
      if (i === parts.length - 1) u.onend = u.onerror = () => { if (speaking === key) { speaking = null; paintListen(); } };
      speechSynthesis.speak(u);
    });
  }
  function stopSpeech() { if (canSpeak) speechSynthesis.cancel(); if (speaking) { speaking = null; paintListen(); } }
  function paintListen() {
    app.querySelectorAll("[data-act=listen]").forEach(b => {
      const on = b.dataset.key === speaking;
      b.setAttribute("aria-pressed", String(on));
      b.innerHTML = A.play(on) + `<span>${esc(on ? t("stop") : t("listen"))}</span>`;
    });
  }

  /* ---------- Confetti ---------- */
  function confetti() {
    if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = document.getElementById("confetti"), colors = ["#FF7A1A", "#FFC98F", "#FFF4E8", "#2F9E73", "#FF7A9C", "#A07EFF"];
    if (!box) return;
    box.textContent = "";
    for (let i = 0; i < 56; i++) {
      const c = document.createElement("i");
      c.style.left = Math.random() * 100 + "%"; c.style.background = colors[i % colors.length];
      c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s"; c.style.animationDelay = Math.random() * 0.4 + "s";
      box.appendChild(c);
    }
    setTimeout(() => { box.textContent = ""; }, 3800);
  }

  /* ---------- Start ---------- */
  async function start() {
    document.documentElement.lang = S.lang;
    if (DEMO) { const b = document.getElementById("demo"); if (b) { b.hidden = false; b.textContent = t("demo"); } }
    const boiLines = Promise.race([
      fetch("boi.json", { cache: "no-cache" }).then(r => (r.ok ? r.json() : null)),
      new Promise(ok => setTimeout(() => ok(null), 8000))
    ]).then(validBoi).catch(() => null);
    try {
      const r = await fetch("content.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("content");
      S.content = await r.json();
    } catch {
      app.className = "screen t-blue";
      app.innerHTML = h`<div class="grow center-col"><h1>${t("errors.load")}</h1></div><button type="button" class="btn btn-primary" data-act="reload">${t("retry.again")}</button>`.s;
      return;
    }
    S.boi = await boiLines;
    // A piece found before the page was closed is still in the child's hand: it waits on Home to be binned.
    if (S.pending && !S.pending.saved) { S.pending.saved = true; persist(); }
    sendTickets();   // pick-ups confirmed while offline are counted now
    const name = fromAddress();
    S.view = { name, params: {} };
    try { history.replaceState({ name, params: {} }, "", "#" + name); } catch {}
    render(false);
  }
  start();
})();
