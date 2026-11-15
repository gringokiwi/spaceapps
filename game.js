/* debris: pick up litter on Earth and unlock the stories of 13 machines people left in space.
   The screens follow the design canvas "Debris App Screens". The story is the team's storyboard,
   "Abandoned but Not Forgotten" (content.json, from docs/abandoned-but-not-forgotten-storyboard.md).
   One round: scan a piece of litter → hear the next chapter → bin it → earn that chapter's patch.
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
  const app = document.getElementById("app");

  /* ---------- Saving on this phone (if the browser blocks it, the game still works without saving) ---------- */
  const PREFIX = DEMO ? "debris.demo." : "debris.";
  const KEYS = ["lang", "profile", "binned", "log", "pending", "lastNew", "introDone", "safetyDone", "finaleSeen", "jacketSeen"];
  const load = (k, d) => { try { const v = localStorage.getItem(PREFIX + k); return v == null ? d : JSON.parse(v); } catch { return d; } };
  const save = (k, v) => { try { localStorage.setItem(PREFIX + k, JSON.stringify(v)); } catch {} };

  /* ---------- Words on the screen, in English, Spanish and Portuguese ---------- */
  const UI = {
    en: {
      langName: "English",
      demo: "Demo mode: Eagle pretends to scan, so you can try every screen. The real game uses AI.",
      back: "Back", menu: "Menu", listen: "Listen", stop: "Stop",
      nav: { home: "Home", jacket: "Jacket", me: "Me" },
      welcome: { mascot: "Eagle the lander, the debris mascot", tagline: "Every piece left behind has a story.", body: "Pick up litter on Earth. Unlock the stories of the machines we left on the Moon and Mars.", go: "Let's go!", grownups: "For grown-ups", language: "Language" },
      opening: { kicker: "The story begins", hook: "Did you know?", go: "I'm ready!" },
      safety: { bubble: "Hi, I'm Eagle! Four quick rules before we explore.", title: "Stay safe out there", go: "Got it!",
        rules: [["Gloves on", "Or use a litter picker."], ["Bring a grown-up", "Stay where they can see you."], ["Sharp or broken? Don't touch", "Glass, needles, metal: ask an adult."], ["Photos aren't kept", "We check each photo, then delete it. No faces, please."]] },
      profile: { title: "What should we call you?", sub: "Pick a space nickname. Don't use your real name.", nick: "Nickname", nickMissing: "Type a nickname first.", buddy: "Choose your crew buddy", privacy: "Your nickname and buddy stay on this phone. No account, no email.", go: "Ready!",
        names: ["MoonWalker", "StarHopper", "CometKid", "RocketFox", "OrbitRider", "Stardust"] },
      home: { title: "Home", patches: "{n} of {total}", patchesLabel: "{n} of {total} patches. Open my jacket", meLabel: "My profile: {nick}", jacket: "My explorer jacket",
        toGo: { one: "1 patch to go", other: "{n} patches to go" }, allDone: "Every patch earned!", counter: "Kids everywhere have found {n} pieces of litter.", schools: "Bring debris to your school or your next beach cleanup!",
        scan: "Scan litter", holding: "You're holding: {item}", holdingSub: "Bin it to earn your next patch.", binNow: "Bin my litter", finale: "See the finale", finaleSub: "All 13 patches are on your jacket." },
      steps: { names: ["Scan", "Story", "Bin it", "Patch"], label: "Step {i} of 4: {name}" },
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
        thenTap: "Then tap the button.", thenTapPatch: "Then tap the button to earn your patch.", legend: "Bin colours",
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
        "To keep the AI affordable, each phone can send a limited number of photos a day. The server keeps only counts, never the photo or the address it came from."] },
      usage: { title: "Live usage", intro: "Real numbers from this app, counted as kids scan. They refresh on their own.", all: "Everyone, so far", today: "Today", total: "pieces found", players: "players", photos: "photos scanned", pieces: "pieces found", note: "Only numbers are counted: no names, no photos. A day is counted in UTC time.", demo: "Demo mode doesn't show live numbers. Open the app without ?demo to see them.", wait: "Getting the numbers…", fail: "The numbers aren't available right now." },
      explore: { title: "All the stories", hint: "For teachers, parents and judges: open any chapter without scanning. Your patches stay the same.", back: "Back to all the stories" },
      sources: { title: "Where the stories come from", intro: "Every chapter comes from the team's storyboard, “Abandoned but Not Forgotten”. These are the pages its facts come from." },
      finale: { kicker: "You did it!", count: { one: "You picked up 1 piece of litter!", other: "You picked up {n} pieces of litter!" }, map: "Where they rest today", patches: "Your patches", home: "Back to home",
        mapLabel: "A map of the 13 resting places: 4 on the Moon, 5 on Mars, and 4 more out in space." },
      bodies: { moon: "Moon", mars: "Mars", deep: "Deep space", eros: "Asteroid", sun: "Around the Sun", ceres: "Ceres" },
      map: { sun: "Sun", earth: "Earth", moon: "Moon", mars: "Mars", eros: "Eros", ceres: "Ceres", deep: "Deep space" },
      types: { plastic: "plastic", can: "can", paper_cardboard: "paper or cardboard", glass: "glass", organic: "food scraps", batteries_electronics: "batteries or electronics", chemicals: "chemicals", sharp_object: "something sharp", other: "litter", none: "not litter" },
      errors: { generic: "Something went wrong. Try again.", photo: "I couldn't open that photo. Try another one.", offline: "No connection. Check the internet and try again.", load: "The stories didn't load. Check the internet and try again." }
    },
    es: {
      langName: "Español",
      demo: "Modo demo: Eagle finge escanear para que puedas probar todas las pantallas. El juego de verdad usa IA.",
      back: "Atrás", menu: "Menú", listen: "Escuchar", stop: "Parar",
      nav: { home: "Inicio", jacket: "Chaqueta", me: "Yo" },
      welcome: { mascot: "Eagle, el módulo lunar, la mascota de debris", tagline: "Todo lo que se queda atrás tiene una historia.", body: "Recoge basura en la Tierra. Desbloquea las historias de las máquinas que dejamos en la Luna y en Marte.", go: "¡Vamos!", grownups: "Para adultos", language: "Idioma" },
      opening: { kicker: "Empieza la historia", hook: "¿Sabías que…?", go: "¡Empecemos!" },
      safety: { bubble: "¡Hola, soy Eagle! Cuatro reglas rápidas antes de explorar.", title: "Cuídate allá afuera", go: "¡Entendido!",
        rules: [["Ponte guantes", "O usa una pinza para recoger basura."], ["Ve con un adulto", "Quédate donde te pueda ver."], ["¿Cortante o roto? No lo toques", "Vidrio, agujas, metal: pídele ayuda a un adulto."], ["No guardamos las fotos", "Revisamos cada foto y luego la borramos. Sin caras, por favor."]] },
      profile: { title: "¿Cómo te llamamos?", sub: "Elige un apodo espacial. No uses tu nombre real.", nick: "Apodo", nickMissing: "Primero escribe un apodo.", buddy: "Elige quién viaja contigo", privacy: "Tu apodo y tu elección se quedan en este teléfono. Sin cuenta, sin correo.", go: "¡Listo!",
        names: ["CaminaLunas", "SaltaEstrellas", "Cometa", "ZorroCohete", "Órbita", "PolvoEstelar"] },
      home: { title: "Inicio", patches: "{n} de {total}", patchesLabel: "{n} de {total} parches. Abrir mi chaqueta", meLabel: "Mi perfil: {nick}", jacket: "Mi chaqueta de exploración",
        toGo: { one: "Falta 1 parche", other: "Faltan {n} parches" }, allDone: "¡Tienes todos los parches!", counter: "Niños y niñas de todas partes han encontrado {n} pedazos de basura.", schools: "¡Lleva debris a tu escuela o a tu próxima limpieza de playa!",
        scan: "Escanear basura", holding: "Tienes en la mano: {item}", holdingSub: "Échala en la caneca para ganar tu próximo parche.", binNow: "Botar mi basura", finale: "Ver el gran final", finaleSub: "Los 13 parches están en tu chaqueta." },
      steps: { names: ["Escanear", "Historia", "A la caneca", "Parche"], label: "Paso {i} de 4: {name}" },
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
        "Para que la IA no cueste demasiado, cada teléfono puede enviar un número limitado de fotos al día. El servidor solo guarda conteos, nunca la foto ni la dirección de donde vino."] },
      usage: { title: "Uso en vivo", intro: "Números reales de esta app, contados mientras los niños escanean. Se actualizan solos.", all: "Entre todos, hasta ahora", today: "Hoy", total: "pedazos encontrados", players: "jugadores", photos: "fotos escaneadas", pieces: "pedazos encontrados", note: "Solo se cuentan números: sin nombres y sin fotos. El día se cuenta en hora UTC.", demo: "El modo demo no muestra números en vivo. Abre la app sin ?demo para verlos.", wait: "Buscando los números…", fail: "Los números no están disponibles ahora." },
      explore: { title: "Todas las historias", hint: "Para profes, familias y jurados: abre cualquier capítulo sin escanear. Tus parches no cambian.", back: "Volver a todas las historias" },
      sources: { title: "De dónde vienen las historias", intro: "Cada capítulo viene del guion del equipo, «Abandoned but Not Forgotten». Estas son las páginas de donde salen sus datos." },
      finale: { kicker: "¡Lo lograste!", count: { one: "¡Recogiste 1 pedazo de basura!", other: "¡Recogiste {n} pedazos de basura!" }, map: "Dónde descansan hoy", patches: "Tus parches", home: "Volver al inicio",
        mapLabel: "Un mapa de los 13 lugares de descanso: 4 en la Luna, 5 en Marte y 4 más en el espacio." },
      bodies: { moon: "Luna", mars: "Marte", deep: "Espacio profundo", eros: "Asteroide", sun: "Alrededor del Sol", ceres: "Ceres" },
      map: { sun: "Sol", earth: "Tierra", moon: "Luna", mars: "Marte", eros: "Eros", ceres: "Ceres", deep: "Espacio profundo" },
      types: { plastic: "plástico", can: "lata", paper_cardboard: "papel o cartón", glass: "vidrio", organic: "restos de comida", batteries_electronics: "pilas o electrónicos", chemicals: "químicos", sharp_object: "algo cortante", other: "basura", none: "no es basura" },
      errors: { generic: "Algo falló. Intenta otra vez.", photo: "No pude abrir esa foto. Prueba con otra.", offline: "No hay conexión. Revisa el internet e intenta otra vez.", load: "Las historias no cargaron. Revisa el internet e intenta otra vez." }
    },
    pt: {
      langName: "Português",
      demo: "Modo demo: o Eagle finge que escaneia para você testar todas as telas. O jogo de verdade usa IA.",
      back: "Voltar", menu: "Menu", listen: "Ouvir", stop: "Parar",
      nav: { home: "Início", jacket: "Jaqueta", me: "Eu" },
      welcome: { mascot: "Eagle, o módulo lunar, mascote do debris", tagline: "Tudo o que ficou para trás tem uma história.", body: "Recolha lixo na Terra. Desbloqueie as histórias das máquinas que deixamos na Lua e em Marte.", go: "Vamos lá!", grownups: "Para adultos", language: "Idioma" },
      opening: { kicker: "A história começa", hook: "Você sabia?", go: "Vamos lá!" },
      safety: { bubble: "Oi, eu sou o Eagle! Quatro regrinhas rápidas antes de explorar.", title: "Cuide-se lá fora", go: "Entendi!",
        rules: [["Use luvas", "Ou use um pegador de lixo."], ["Leve um adulto", "Fique onde ele possa te ver."], ["Cortante ou quebrado? Não toque", "Vidro, agulhas, metal: chame um adulto."], ["As fotos não ficam guardadas", "A gente confere cada foto e depois apaga. Sem rostos, por favor."]] },
      profile: { title: "Como vamos te chamar?", sub: "Escolha um apelido espacial. Não use seu nome de verdade.", nick: "Apelido", nickMissing: "Escreva um apelido primeiro.", buddy: "Escolha quem viaja com você", privacy: "Seu apelido e sua escolha ficam neste celular. Sem conta, sem e-mail.", go: "Pronto!",
        names: ["AndaLua", "PulaEstrela", "Cometa", "RaposaFoguete", "Órbita", "PoeiraEstelar"] },
      home: { title: "Início", patches: "{n} de {total}", patchesLabel: "{n} de {total} emblemas. Abrir minha jaqueta", meLabel: "Meu perfil: {nick}", jacket: "Minha jaqueta de exploração",
        toGo: { one: "Falta 1 emblema", other: "Faltam {n} emblemas" }, allDone: "Você ganhou todos os emblemas!", counter: "Crianças do mundo todo já encontraram {n} pedaços de lixo.", schools: "Leve o debris para a sua escola ou para o próximo mutirão de limpeza da praia!",
        scan: "Escanear lixo", holding: "Você está segurando: {item}", holdingSub: "Jogue na lixeira para ganhar seu próximo emblema.", binNow: "Jogar meu lixo fora", finale: "Ver o grande final", finaleSub: "Os 13 emblemas estão na sua jaqueta." },
      steps: { names: ["Escanear", "História", "Na lixeira", "Emblema"], label: "Passo {i} de 4: {name}" },
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
        "Para a IA não custar caro demais, cada celular pode enviar um número limitado de fotos por dia. O servidor guarda só contagens, nunca a foto nem o endereço de onde ela veio."] },
      usage: { title: "Uso ao vivo", intro: "Números reais deste app, contados enquanto as crianças escaneiam. Eles se atualizam sozinhos.", all: "Todo mundo, até agora", today: "Hoje", total: "lixos encontrados", players: "jogadores", photos: "fotos escaneadas", pieces: "lixos encontrados", note: "Só números são contados: sem nomes e sem fotos. O dia é contado no horário UTC.", demo: "O modo demo não mostra números ao vivo. Abra o app sem ?demo para ver.", wait: "Buscando os números…", fail: "Os números não estão disponíveis agora." },
      explore: { title: "Todas as histórias", hint: "Para professores, famílias e jurados: abra qualquer capítulo sem escanear. Seus emblemas não mudam.", back: "Voltar para todas as histórias" },
      sources: { title: "De onde vêm as histórias", intro: "Cada capítulo vem do roteiro da equipe, “Abandoned but Not Forgotten”. Estas são as páginas de onde vêm os fatos." },
      finale: { kicker: "Você conseguiu!", count: { one: "Você recolheu 1 pedaço de lixo!", other: "Você recolheu {n} pedaços de lixo!" }, map: "Onde elas estão hoje", patches: "Seus emblemas", home: "Voltar ao início",
        mapLabel: "Um mapa dos 13 lugares de descanso: 4 na Lua, 5 em Marte e mais 4 no espaço." },
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
    introDone: !!load("introDone", false), safetyDone: !!load("safetyDone", false), finaleSeen: !!load("finaleSeen", false),
    content: null, counter: null, counterAt: 0,
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
    const names = t("steps.names");
    return h`<div class="steps" role="img" aria-label="${t("steps.label", { i, name: names[i - 1] })}">${names.map((nm, k) =>
      k + 1 < i ? h`<span class="dot done"></span>` : k + 1 === i ? h`<span class="cur">${k + 1} ${nm}</span>` : h`<span class="dot"></span>`)}</div>`;
  }
  const say = (text, { mood = "happy", look = "right", label = "Eagle" } = {}) =>
    h`<div class="say">${raw(A.eagleHead({ label, mood, look, cls: "say-eagle" }))}<p class="bubble">${text}</p></div>`;
  const nav = cur => h`<nav class="nav" aria-label="${t("menu")}">${["home", "jacket", "me"].map(k =>
    h`<button type="button" data-go="${k}" ${cur === k ? raw('aria-current="page"') : ""}>${ico(k)}<span>${t("nav." + k)}</span></button>`)}</nav>`;
  function listenBtn(key) {
    if (!canSpeak) return "";
    const on = speaking === key;
    return h`<button type="button" class="listen" data-act="listen" data-key="${key}" aria-pressed="${on}">${raw(A.play(on))}<span>${on ? t("stop") : t("listen")}</span></button>`;
  }
  const photo = (image, badge) => h`<div class="photo">${image ? h`<img src="${image}" alt="${t("found.photoAlt")}">` : raw(A.scene())}${badge || ""}</div>`;
  const binChip = (k, on) => { const [name, what] = t("bin.names." + k); return h`<div class="chip-bin${on ? " on" : ""}" role="listitem"><span class="swatch swatch-${k}"></span><b>${name}</b><span>${what}</span></div>`; };

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

  screens.opening = ({ from }) => {
    const i = L(S.content.intro), replay = from === "jacket" || from === "explore";
    return { theme: "t-blue", cls: "opening", html: h`
      ${replay ? h`<div class="top">${backBtn(t("back"), goAttrs(from))}</div>` : ""}
      <span class="kicker">${t("opening.kicker")}</span>
      <h1 tabindex="-1">${i.title}</h1>
      ${listenBtn("intro")}
      ${i.script.map(p => h`<p class="script">${p}</p>`)}
      <div class="hook-card"><b>${t("opening.hook")}</b><p>${i.hook}</p></div>
      ${say(i.pickup)}
      <div class="grow"></div>
      ${replay ? h`<button type="button" class="btn btn-primary" ${raw(goAttrs(from))}>${from === "explore" ? t("explore.back") : t("story.toJacket")}</button>`
        : h`<button type="button" class="btn btn-primary" data-act="openingDone">${t("opening.go")}</button>`}` };
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
    const n = S.binned, p = S.profile, pend = S.pending;
    const greet = n === 0 ? L(S.content.intro).pickup : chText(n).pickup;
    refreshCounter();
    return { theme: "t-blue", cls: "home", html: h`
      <header class="home-top">
        <button type="button" class="who" data-go="me" aria-label="${t("home.meLabel", { nick: p.nick })}">${raw(A.buddy(p.buddy))}<span>${p.nick}</span></button>
        <button type="button" class="count-pill" data-go="jacket" aria-label="${t("home.patchesLabel", { n, total: TOTAL })}"><span class="pill-dot" aria-hidden="true"></span>${t("home.patches", { n, total: TOTAL })}</button>
      </header>
      <h1 class="sr-only" tabindex="-1">${t("home.title")}</h1>
      <div class="home-eagle">${raw(A.eagle({ label: "Eagle", look: "right", cls: "home-eagle-art" }))}<p class="bubble">${greet}</p></div>
      ${pend ? h`<button type="button" class="card card-peach holding" data-go="bin">
          <span class="holding-text"><b>${t("home.holding", { item: cap(pend.item || t("types." + pend.type)) })}</b><span>${t("home.holdingSub")}</span></span>${ico("chevron", { width: 2.6 })}</button>` : ""}
      <button type="button" class="card card-navy jacket-card" data-go="jacket">
        <span class="row-between"><b>${t("home.jacket")}</b><span class="peach">${n >= TOTAL ? t("home.allDone") : tn("home.toGo", TOTAL - n)}</span></span>
        <span class="dots13" aria-hidden="true">${range(TOTAL).map(i => h`<span class="${i <= n ? "on" : ""}"></span>`)}</span>
      </button>
      <div class="card card-blue2 counter" id="counter">${ico("globe", { size: 30, width: 2.2 })}<p>${counterText()}</p></div>
      ${n >= TOTAL ? h`<button type="button" class="card card-peach holding" data-go="finale"><span class="holding-text"><b>${t("home.finale")}</b><span>${t("home.finaleSub")}</span></span>${ico("chevron", { width: 2.6 })}</button>` : ""}
      <div class="grow"></div>
      ${pend ? h`<button type="button" class="btn btn-primary btn-big" data-go="bin">${ico("check", { size: 30, width: 2.6 })}${t("home.binNow")}</button>`
        : h`<button type="button" class="btn btn-primary btn-big" data-go="scan">${ico("camera", { size: 30, width: 2.4 })}${t("home.scan")}</button>`}
      ${nav("home")}` };
  };
  const counterText = () => S.counter > 0 ? h`${splitBold(t("home.counter"), "n", fmt(S.counter))} ${t("home.schools")}` : h`${t("home.schools")}`;

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
    const p = S.pending, next = S.binned + 1, extra = next > TOTAL;
    return { theme: "t-cream", cls: "found", html: h`
      <div class="top">${backBtn(t("found.back"), 'data-act="rescan"')}${steps(2)}</div>
      ${photo(S.scan.image, h`<span class="badge badge-green">${ico("check", { size: 18, width: 3 })}${t("found.safe")}</span>`)}
      <div class="titles">
        <h1 tabindex="-1">${cap(p.item || t("types." + p.type))}</h1>
        <p class="bin-line"><span class="swatch swatch-${p.bin}"></span><span>${t("found.goes." + p.bin)}</span></p>
      </div>
      <div class="grow say-end">${say(extra ? t("found.extra") : t("found.bubble." + chapter(next).body))}</div>
      ${extra ? h`<button type="button" class="btn btn-primary" data-go="bin">${t("found.binIt")}</button>`
        : h`<button type="button" class="btn btn-primary" ${raw(goAttrs("story", { n: next, from: "round" }))}>${t("found.hear")}</button>`}
      <button type="button" class="btn-link" data-act="rescan">${t("found.wrong")}</button>` };
  };

  screens.story = ({ n, from = "round" }) => {
    const ch = chapter(n), c = L(ch), round = from === "round", img = safeImg(ch.image);
    const back = round ? (S.scan && S.scan.kind === "found" ? backBtn(t("found.back"), goAttrs("found")) : backBtn(t("back"), goAttrs("home"))) : backBtn(t("back"), goAttrs(from));
    const section = sec => sec.k === "help"
      ? h`<div class="help-box">${ico("checkCircle", { size: 28, width: 2.6 })}<p><b>${t("story.sec.help")}:</b> ${sec.t}</p></div>`
      : h`<section class="sec"><h2>${t("story.sec." + sec.k)}</h2>${sec.list ? h`<ul>${sec.list.map(x => h`<li>${x}</li>`)}</ul>` : h`<p>${sec.t}</p>`}</section>`;
    return { theme: "t-cream", cls: "story", html: h`
      <div class="story-head">
        <div class="top">${back}${round ? steps(2) : ""}</div>
        <div class="story-title">
          <div class="story-text"><span class="chip">${t("story.chapter", { n, tag: c.tag })}</span><h1 tabindex="-1">${c.title}</h1><span class="where">${c.place}</span></div>
          <div class="story-patch">${raw(A.patch(n, ch.body, t("story.patchAlt", { short: c.short })))}</div>
        </div>
      </div>
      <div class="story-body">
        ${img ? h`<figure class="story-photo"><img src="${img}" alt="${c.title}"><figcaption>${t("story.credit", { by: ch.credit || "NASA" })}</figcaption></figure>` : ""}
        ${listenBtn("chapter:" + n)}
        ${c.sections.map(section)}
        <div class="hook-say">${say(h`<b>${t("story.hook")}</b> ${c.hook}`, { mood: "happy" })}</div>
        <p class="sources"><b>${t("story.sources")}:</b> ${ch.links.map((l, i) => h`${i ? ", " : ""}<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer">${l.name}</a>`)}</p>
        <div class="grow"></div>
        ${round ? h`<button type="button" class="btn btn-primary" data-go="bin">${t("story.binNow")}</button>`
          : h`<button type="button" class="btn btn-outline" ${raw(goAttrs(from))}>${from === "finale" ? t("story.toFinale") : from === "explore" ? t("explore.back") : t("story.toJacket")}</button>`}
      </div>` };
  };

  screens.bin = () => {
    const p = S.pending, extra = S.binned >= TOTAL, inRound = S.scan && S.scan.kind === "found" && !extra;
    const color = t("bin.names." + p.bin)[0].toLowerCase();
    return { theme: "t-cream", cls: "bin", html: h`
      <div class="top">${inRound ? backBtn(t("bin.back"), goAttrs("story", { n: S.binned + 1, from: "round" })) : backBtn(t("back"), goAttrs("home"))}${steps(3)}</div>
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
    const n = S.binned;
    const cards = range(TOTAL).map(i => {
      const ch = chapter(i), c = L(ch), isNew = i === S.lastNew;
      return i <= n
        ? h`<button type="button" class="patch-card${isNew ? " is-new" : ""}" ${raw(goAttrs("story", { n: i, from: "jacket" }))}>${raw(A.patch(i, ch.body))}<span>${c.short}${isNew ? h` <em>· ${t("jacket.newTag")}</em>` : ""}</span></button>`
        : h`<div class="patch-card locked"><span class="q" aria-hidden="true">?</span><span>${t("jacket.locked", { place: t("bodies." + ch.body) })}</span></div>`;
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
    <ol class="src-list">${S.content.chapters.map(ch => h`<li><b>${L(ch).short}</b><span>${ch.links.map((l, i) =>
      h`${i ? " · " : ""}<a href="${safeUrl(l.url)}" target="_blank" rel="noopener noreferrer">${l.name}</a>`)}</span></li>`)}</ol>
    <button type="button" class="btn btn-outline" ${raw(goAttrs(from))}>${t("back")}</button>` });

  screens.finale = () => {
    const f = L(S.content.finale), first = !S.finaleSeen;
    if (first) { S.finaleSeen = true; persist(); }
    return { theme: "t-blue", cls: "finale", html: h`
      <div class="top">${backBtn(t("finale.home"), goAttrs("home"))}</div>
      <span class="kicker">${t("finale.kicker")}</span>
      <h1 tabindex="-1">${f.title}</h1>
      ${listenBtn("finale")}
      ${f.script.map(p => h`<p class="script">${p}</p>`)}
      <div class="card card-navy count-card">${tn("finale.count", S.log.length)}</div>
      <section class="map-card"><h2>${t("finale.map")}</h2>${raw(A.map(S.binned, t("map"), t("finale.mapLabel")))}</section>
      <section><h2>${t("finale.patches")}</h2><div class="badges">${range(TOTAL).map(i =>
        h`<button type="button" class="badge-btn" ${raw(goAttrs("story", { n: i, from: "finale" }))} aria-label="${chText(i).short}">${raw(A.patch(i, chapter(i).body))}</button>`)}</div></section>
      <button type="button" class="btn btn-primary" data-go="home">${t("finale.home")}</button>`,
      after: () => { if (first) confetti(); } };
  };

  /* ---------- Moving between screens (the phone's back button works too) ---------- */
  const okRound = () => !!(S.scan && S.pending && S.scan.kind === "found");
  const GUARD = {
    welcome: () => true, grownups: () => true, photos: () => true, sources: () => true, safety: () => true, profile: () => true, opening: () => true,
    home: () => !!S.profile, jacket: () => !!S.profile, me: () => !!S.profile,
    scan: () => !!S.profile && !(S.pending && S.pending.saved),
    found: okRound,
    danger: () => !!(S.scan && S.scan.kind === "danger"),
    retry: () => !!(S.scan && ["no", "unsure", "photo", "error"].includes(S.scan.kind)),
    story: p => Number.isInteger(p.n) && p.n >= 1 && p.n <= TOTAL && (p.from === "explore" || p.n <= S.binned || (!!S.pending && p.n === S.binned + 1)),
    explore: () => true, usage: () => true,
    bin: () => !!S.pending,
    unlocked: () => !!S.earned,
    finale: () => S.binned >= TOTAL
  };
  const fallback = () => (S.profile ? "home" : "welcome");
  /* Screens an address like …/#jacket may open directly (a reload, a bookmark, a typed address). */
  const OPEN_BY_ADDRESS = ["home", "jacket", "me", "finale", "grownups", "photos", "sources", "explore", "usage"];
  const fromAddress = () => { const name = location.hash.slice(1); return OPEN_BY_ADDRESS.includes(name) && GUARD[name]({}) ? name : fallback(); };
  function go(name, params = {}, { replace = false } = {}) {
    if (!screens[name] || !GUARD[name](params)) { name = fallback(); params = {}; replace = true; }
    leave();
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
    S.view = { name, params };
    render(true);
  });
  function render(focus) {
    const { name, params } = S.view;
    const keep = document.activeElement && document.activeElement.id;
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
  }
  function leave() { clearInterval(usageTimer); if (window.JACKET3D) window.JACKET3D.unmount(); stopCamera(); stopSpeech(); const c = document.getElementById("confetti"); if (c) c.textContent = ""; }

  /* ---------- Taps ---------- */
  app.addEventListener("click", e => {
    const el = e.target.closest("[data-go],[data-act]");
    if (!el || !app.contains(el)) return;
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
  });
  app.addEventListener("input", e => {
    if (e.target.id !== "nick") return;
    const err = document.getElementById("nickErr"); if (err) err.hidden = true;
    e.target.removeAttribute("aria-invalid");
  });
  app.addEventListener("submit", e => {
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

  const nextOnboarding = () => (!S.introDone ? "opening" : !S.safetyDone ? "safety" : !S.profile ? "profile" : "home");
  const ACT = {
    start: () => go(nextOnboarding()),
    openingDone: () => { S.introDone = true; persist(); go(nextOnboarding()); },
    safetyDone: () => { S.safetyDone = true; persist(); go(nextOnboarding()); },
    lang: el => setLang(el.dataset.lang),
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
    reload: () => location.reload()
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
    if (S.log.length > 2000) S.log = S.log.slice(-2000);
    if (S.binned < TOTAL) { S.binned += 1; S.lastNew = S.binned; S.earned = { n: S.binned }; }
    else S.earned = { extra: true };
    S.pending = null; S.scan = null;
    persist();
    go("unlocked", {}, { replace: true });
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
    if (typeof j.total === "number") { S.counter = j.total; S.counterAt = Date.now(); }
    const r = j.result || {};
    if (j.retake) return showRetry("photo", image, r.message);
    if (r.dangerous) { S.scan = { kind: "danger", image, result: r }; return go("danger", {}, { replace: true }); }
    if (r.is_trash === "yes") {
      S.pending = { item: String(r.item || "").slice(0, 40), type: r.type || "other", bin: BINS.includes(r.bin) ? r.bin : "black", saved: false };
      S.scan = { kind: "found", image, result: r };
      persist();
      return go("found", {}, { replace: true });
    }
    showRetry(r.is_trash === "unsure" ? "unsure" : "no", image, r.message);
  }
  function showRetry(kind, image, message) { S.scan = { kind, image, message }; go("retry", {}, { replace: true }); }

  /* ---------- The counter shared by everyone ---------- */
  function refreshCounter() {
    if (DEMO) { if (S.counter == null) S.counter = 1287; return; }
    if (Date.now() - S.counterAt < 60000) return;
    S.counterAt = Date.now();
    fetch("/api/counter").then(r => (r.ok ? r.json() : null)).then(j => {
      if (!j || typeof j.total !== "number") return;
      S.counter = j.total;
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
    return { result, retake, counts, total: counts ? (S.counter || 1287) + 1 : null };
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
    if (key === "intro") { const i = L(S.content.intro); return [i.title, ...i.script, t("opening.hook"), i.hook, i.pickup]; }
    if (key === "finale") { const f = L(S.content.finale); return [f.title, ...f.script]; }
    const c = chText(+key.split(":")[1]);
    return [c.title, ...c.sections.map(s => `${t("story.sec." + s.k)}. ${s.t || (s.list || []).join(" ")}`), t("story.hook"), c.hook];
  }
  function toggleSpeech(key) {
    if (!canSpeak) return;
    if (speaking === key) return stopSpeech();
    speechSynthesis.cancel();
    speaking = key; paintListen();
    const voice = voiceFor(S.lang), parts = speechParts(key).filter(Boolean);
    parts.forEach((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = VOICES[S.lang][0]; if (voice) u.voice = voice; u.rate = 0.95;
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
    try {
      const r = await fetch("content.json", { cache: "no-cache" });
      if (!r.ok) throw new Error("content");
      S.content = await r.json();
    } catch {
      app.className = "screen t-blue";
      app.innerHTML = h`<div class="grow center-col"><h1>${t("errors.load")}</h1></div><button type="button" class="btn btn-primary" data-act="reload">${t("retry.again")}</button>`.s;
      return;
    }
    // A piece found before the page was closed is still in the child's hand: it waits on Home to be binned.
    if (S.pending && !S.pending.saved) { S.pending.saved = true; persist(); }
    const name = fromAddress();
    S.view = { name, params: {} };
    try { history.replaceState({ name, params: {} }, "", "#" + name); } catch {}
    render(false);
  }
  start();
})();
