const assert = require("assert/strict");
const vm = require("vm"), ctx = { window: {} }; vm.runInNewContext(require("fs").readFileSync(require("path").join(__dirname, "../impact.js"), "utf8"), ctx); const I = ctx.window.IMPACT;
let ok = 0; const t = (name, fn) => { fn(); ok++; console.log("ok -", name); };
const H = (m, l = "en-US") => I.formatHeight(m, l);
t("spec worked example: 1,284 pieces", () => {
  const w = I.tower(1284);
  assert.equal(H(w.heightM), "128 m"); assert.equal(w.passed.id, "saturnV"); assert.equal(w.next.id, "oneWTC");
  assert.ok(Math.abs(w.progress - 0.0405) < 0.0005, String(w.progress)); assert.equal(w.moonLine, true);
});
t("5 pieces: no milestone yet, next is a 7-year-old", () => { const w = I.tower(5); assert.equal(w.passed, null); assert.equal(w.next.id, "kid"); assert.ok(Math.abs(w.progress - 0.5 / 1.2) < 1e-9); assert.equal(H(w.heightM), "50 cm"); });
t("0 pieces", () => { const w = I.tower(0); assert.equal(w.passed, null); assert.equal(w.next.id, "kid"); assert.equal(w.progress, 0); assert.equal(H(w.heightM), "0 cm"); assert.equal(I.stripPos(w.heightM), 0); });
t("1 piece is 10 cm", () => assert.equal(H(I.tower(1).heightM), "10 cm"));
t("11 pieces: still below a 7-year-old", () => { const w = I.tower(11); assert.equal(w.passed, null); assert.equal(H(w.heightM), "1.1 m"); });
t("12 pieces: exactly a 7-year-old counts as passed", () => { const w = I.tower(12); assert.equal(w.passed.id, "kid"); assert.equal(w.next.id, "cristo"); assert.equal(w.progress, 0); assert.equal(H(w.heightM), "1.2 m"); });
t("380 pieces: exactly Christ the Redeemer", () => { const w = I.tower(380); assert.equal(w.passed.id, "cristo"); assert.equal(w.next.id, "liberty"); assert.equal(H(w.heightM), "38 m"); });
t("379 pieces: just below", () => { const w = I.tower(379); assert.equal(w.passed.id, "kid"); assert.equal(w.next.id, "cristo"); });
t("Moon line: hidden at 96, shown at 97", () => { assert.equal(I.tower(96).moonLine, false); assert.equal(I.tower(97).moonLine, true); assert.equal(I.tower(95).moonLine, false); });
t("Everest and the ISS", () => { const e = I.tower(88490); assert.equal(e.passed.id, "everest"); assert.equal(H(e.heightM), "8.8 km"); const s = I.tower(4000000); assert.equal(s.passed.id, "iss"); assert.equal(H(s.heightM), "400 km"); });
t("Reaching the Moon", () => { const w = I.tower(3844000000); assert.equal(w.reachedMoon, true); assert.equal(w.next, null); assert.equal(w.passed.id, "moon"); assert.equal(w.progress, 1); assert.equal(H(w.heightM), "384,400 km"); assert.equal(I.stripPos(w.heightM), 1); assert.equal(I.tower(3843999999).reachedMoon, false); });
t("Number formats per language", () => {
  assert.equal(H(128.4, "pt-BR"), "128 m"); assert.equal(H(8849, "pt-BR"), "8,8 km"); assert.equal(H(8849, "es-CO"), "8,8 km");
  assert.equal(H(384400000, "pt-BR"), "384.400 km"); assert.equal(H(384400000, "es-CO"), "384.400 km"); assert.equal(H(1.2, "es-CO"), "1,2 m");
  assert.equal(new Intl.NumberFormat("es-CO").format(1284), "1.284"); assert.equal(new Intl.NumberFormat("pt-BR").format(1284), "1.284"); assert.equal(new Intl.NumberFormat("en-US").format(1284), "1,284");
});
t("Milestone heights shown as the spec words them", () => {
  const shown = Array.from(I.MILESTONES, m => H(m.heightM)); assert.deepEqual(shown, ["1.2 m", "38 m", "93 m", "111 m", "541 m", "828 m", "8.8 km", "400 km", "384,400 km"]);
});
t("Strip: log scale, ordered, Earth to Moon", () => {
  const xs = Array.from(I.MILESTONES, m => I.stripPos(m.heightM)); for (let i = 1; i < xs.length; i++) assert.ok(xs[i] > xs[i - 1]);
  assert.equal(I.stripPos(0.1), 0); assert.ok(xs[0] > 0.1 && xs[0] < 0.12, String(xs[0]));
});
t("Bad totals are treated as 0", () => { assert.equal(I.tower(-3).pieces, 0); assert.equal(I.tower("x").pieces, 0); assert.equal(I.tower(4.7).pieces, 4); });
console.log(`\n${ok} checks passed`);
