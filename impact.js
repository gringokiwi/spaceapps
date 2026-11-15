/* Litter to the Moon: the milestones and the maths for the Impact screen (from the team's spec).
   Heights are compared in whole centimetres, so boundaries like 12 pieces = 1.2 m are exact.
   Loaded as a plain script: it sets window.IMPACT. */
(function (root) {
  "use strict";

  const PIECE_HEIGHT_M = 0.1;

  const MILESTONES = [
    { id: "kid",       heightM: 1.2,       en: "a 7-year-old",                   pt: "uma criança de 7 anos",          es: "un niño de 7 años" },
    { id: "cristo",    heightM: 38,        en: "Christ the Redeemer",            pt: "o Cristo Redentor",              es: "el Cristo Redentor" },
    { id: "liberty",   heightM: 93,        en: "the Statue of Liberty",          pt: "a Estátua da Liberdade",         es: "la Estatua de la Libertad" },
    { id: "saturnV",   heightM: 111,       en: "the Saturn V Moon rocket",       pt: "o foguete lunar Saturno V",      es: "el cohete lunar Saturno V" },
    { id: "oneWTC",    heightM: 541,       en: "One World Trade Center",         pt: "o One World Trade Center",       es: "el One World Trade Center" },
    { id: "burj",      heightM: 828,       en: "the Burj Khalifa",               pt: "o Burj Khalifa",                 es: "el Burj Khalifa" },
    { id: "everest",   heightM: 8849,      en: "Mount Everest",                  pt: "o Monte Everest",                es: "el monte Everest" },
    { id: "iss",       heightM: 400000,    en: "the International Space Station", pt: "a Estação Espacial Internacional", es: "la Estación Espacial Internacional" },
    { id: "moon",      heightM: 384400000, en: "the Moon",                       pt: "a Lua",                          es: "la Luna" },
  ];

  /* The Moon line shows once the total passes the 96 bags left on the Moon (97 and up). */
  const MOON_BAGS = 96;

  const cm = m => Math.round(m * 100);
  const PIECE_CM = cm(PIECE_HEIGHT_M);

  /* Where the tower stands: its height, the milestone just passed (or none yet), the next one (or none
     once it reaches the Moon), and how far it has climbed between them, from 0 to 1. */
  function tower(total) {
    const pieces = Math.max(0, Math.floor(Number(total) || 0)), heightCm = pieces * PIECE_CM;
    let passed = null, next = null;
    for (const m of MILESTONES) { if (cm(m.heightM) <= heightCm) passed = m; else { next = m; break; } }
    const low = passed ? cm(passed.heightM) : 0;
    const progress = next ? (heightCm - low) / (cm(next.heightM) - low) : 1;
    return { pieces, heightM: heightCm / 100, passed, next, progress, reachedMoon: !next, moonLine: pieces > MOON_BAGS };
  }

  /* Heights as people say them: "128 m", "8.8 km", "400 km", in the language's number format.
     Two small additions to the spec's rule, for the small towers of the first days:
     centimetres under 1 m ("50 cm", not "0 m"), and one decimal under 10 m ("1.2 m", not "1 m"). */
  function formatHeight(m, locale) {
    const f = (n, d) => new Intl.NumberFormat(locale, { maximumFractionDigits: d }).format(n);
    if (m < 1) return `${f(m * 100, 0)} cm`;
    if (m < 10) return `${f(m, 1)} m`;
    if (Math.round(m) < 1000) return `${f(m, 0)} m`;
    return `${f(m / 1000, 1)} km`;
  }

  /* Position on the Earth-to-Moon strip, from 0 to 1, on a log scale from one piece (10 cm) to the Moon. */
  function stripPos(m) {
    if (!(m > 0)) return 0;
    const lo = Math.log10(PIECE_HEIGHT_M), hi = Math.log10(MILESTONES[MILESTONES.length - 1].heightM);
    return Math.min(1, Math.max(0, (Math.log10(m) - lo) / (hi - lo)));
  }

  root.IMPACT = { PIECE_HEIGHT_M, MILESTONES, MOON_BAGS, tower, formatHeight, stripPos };
})(typeof window !== "undefined" ? window : globalThis);
