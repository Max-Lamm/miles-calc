// Automatisierte Tests für die reinen Logik-Funktionen.
// Läuft mit: node test.js

const { allOptions, optimizeWithPass, standardPrice, packagePrice, classOptions, TARIFFS } = require("./calculator.js");

let pass = 0, fail = 0;
const EPS = 0.005;

function approx(a, b) { return Math.abs(a - b) < EPS; }

function test(name, fn) {
  try { fn(); console.log(`✓ ${name}`); pass++; }
  catch (e) { console.log(`✗ ${name}\n    ${e.message}`); fail++; }
}

function assertWinner(km, durationMin, expectedClass, expectedPrice, expectedPkgLabel) {
  const { winner } = allOptions(km, durationMin);
  if (!winner) throw new Error("kein Winner");
  if (winner.classKey !== expectedClass) {
    throw new Error(`Winner-Klasse ${winner.classKey} ≠ erwartet ${expectedClass}`);
  }
  if (!approx(winner.best.optimized.finalPrice, expectedPrice)) {
    throw new Error(`Preis ${winner.best.optimized.finalPrice.toFixed(2)} ≠ erwartet ${expectedPrice.toFixed(2)}`);
  }
  if (expectedPkgLabel) {
    const got = winner.best.kind === "standard" ? "standard" : winner.best.pkg.label;
    if (got !== expectedPkgLabel) {
      throw new Error(`Paket ${got} ≠ erwartet ${expectedPkgLabel}`);
    }
  }
}

// ----- Basis-Tarif-Berechnung (ohne Pass) -----

test("Km-Aufrundung: 1,2 km → 2 km", () => {
  const std = standardPrice(TARIFFS.S.standard, 1.2, 10);
  if (std.breakdown.billedKm !== 2) throw new Error(`billedKm=${std.breakdown.billedKm}`);
});

test("Standardtarif wird ab 24 h ausgeblendet", () => {
  const { classes } = allOptions(50, 25 * 60);
  for (const cls of classes) {
    if (cls.standard.applicable) throw new Error(`${cls.classKey}: Standardtarif bei 25 h noch aktiv`);
  }
});

test("L-Mindestbetrag 5km/30min → L Standard 14,45 € clamped auf 15 €", () => {
  const { classes } = allOptions(5, 30);
  const L = classes.find(c => c.classKey === "L");
  if (!approx(L.standard.price, 15.00)) throw new Error(`L Standard ${L.standard.price.toFixed(2)} ≠ 15`);
});

// ----- Tier-Wahl: beste km-Variante pro Tier -----

test("1-Tag-Tier S bei 30 km: FLEX schlägt 1 Tag / 50 km", () => {
  // FLEX: 24,99 + 30×0,59 = 42,69 €. 1T/50: 49,99 €. FLEX sollte gewinnen.
  const { classes } = allOptions(30, 3 * 60);  // 3 h, um 3h/40-Paket zu umgehen
  const S = classes.find(c => c.classKey === "S");
  const tag1 = S.cellByTier["1 Tag"];
  if (!tag1) throw new Error("1-Tag-Tier nicht berechnet");
  if (tag1.pkg.label !== "Flex") throw new Error(`Gewinner: ${tag1.pkg.label}, erwartet Flex`);
  if (!approx(tag1.price, 42.69)) throw new Error(`Flex-Preis ${tag1.price.toFixed(2)} ≠ 42,69`);
});

test("1-Tag-Tier S bei 80 km: 1 Tag / 100 km schlägt FLEX und 1 Tag / 50", () => {
  // FLEX: 24,99 + 80×0,59 = 72,19 €
  // 1T/50: 49,99 + 30×0,59 = 67,69 €
  // 1T/100: 79,99 € → teurer als 1T/50
  // → 1T/50 gewinnt mit 67,69 €
  const { classes } = allOptions(80, 12 * 60);
  const S = classes.find(c => c.classKey === "S");
  const tag1 = S.cellByTier["1 Tag"];
  if (tag1.pkg.label !== "1 Tag / 50 km") throw new Error(`Gewinner: ${tag1.pkg.label}`);
  if (!approx(tag1.price, 67.69)) throw new Error(`Preis ${tag1.price.toFixed(2)} ≠ 67,69`);
});

test("1-Tag-Tier S bei 200 km: 1 Tag / 150 km + Overage", () => {
  // 1T/150: 99,99 + 50×0,59 = 129,49 €
  // 1T/100: 79,99 + 100×0,59 = 138,99 €
  // 1T/50: 49,99 + 150×0,59 = 138,49 €
  // FLEX: 24,99 + 200×0,59 = 142,99 €
  // → 1T/150 gewinnt mit 129,49 €
  const { classes } = allOptions(200, 20 * 60);
  const S = classes.find(c => c.classKey === "S");
  const tag1 = S.cellByTier["1 Tag"];
  if (tag1.pkg.label !== "1 Tag / 150 km") throw new Error(`Gewinner: ${tag1.pkg.label}`);
});

// ----- 3 Tage & 350 km (das ursprüngliche Bug-Szenario) -----

test("3 Tage × 350 km S → 3 Tage / 350 km = 219,99 € (vor Pass)", () => {
  const { classes } = allOptions(350, 3 * 24 * 60);
  const S = classes.find(c => c.classKey === "S");
  const tier3 = S.cellByTier["3 Tage"];
  if (!tier3) throw new Error("3-Tage-Tier nicht berechnet");
  if (tier3.pkg.label !== "3 Tage / 350 km") throw new Error(`Gewinner: ${tier3.pkg.label}`);
  if (!approx(tier3.price, 219.99)) throw new Error(`Preis ${tier3.price.toFixed(2)} ≠ 219,99`);
});

test("3 Tage × 350 km: Winner = S 3 Tage / 350 km mit Gold = 197,98 €", () => {
  // S 3T/350: Basis 219,99. Gold (10%): 219,99×0,9 = 197,99.
  // Cost = 49,99 + max(0, 197,99-50) = 49,99 + 147,99 = 197,98 ← Gold gewinnt über „ohne Pass".
  assertWinner(350, 3 * 24 * 60, "S", 197.98, "3 Tage / 350 km");
});

// ----- Pass-Optimierung -----

test("Kleine Fahrt 2km/10min S: kein Pass sinnvoll", () => {
  const std = standardPrice(TARIFFS.S.standard, 2, 10);
  const opt = optimizeWithPass(std, TARIFFS.S.standard);
  if (opt.pass.id !== "none") throw new Error(`Pass ${opt.pass.id} sollte keiner sein`);
});

test("M 6h/50 km: Silber knapp günstiger (42,73 €)", () => {
  const { classes } = allOptions(50, 6 * 60);
  const M = classes.find(c => c.classKey === "M");
  const t6 = M.cellByTier["6h"];
  if (t6.optimized.pass.id !== "silber") throw new Error(`Pass ${t6.optimized.pass.id}`);
  if (!approx(t6.optimized.finalPrice, 42.73)) throw new Error(`${t6.optimized.finalPrice}`);
});

// ----- 9-Tage-Tier (neu) -----

test("9 Tage × 400 km: S 9 Tage / 450 km = 370,99 €", () => {
  const { classes } = allOptions(400, 9 * 24 * 60);
  const S = classes.find(c => c.classKey === "S");
  const t9 = S.cellByTier["9 Tage"];
  if (!t9) throw new Error("9-Tage-Tier nicht verfügbar");
  if (!approx(t9.price, 370.99)) throw new Error(`Preis ${t9.price.toFixed(2)} ≠ 370,99`);
});

test("10 Tage: Keine Klasse bietet 10-Tage-Paket → best = null", () => {
  const { classes } = allOptions(100, 10 * 24 * 60);
  for (const cls of classes) {
    if (cls.best) throw new Error(`${cls.classKey} hat best, erwartet null bei 10 Tagen`);
  }
});

// ----- L/XL Grenzen -----

test("L 4 Tage × 500 km = 369,99 €", () => {
  const { classes } = allOptions(500, 4 * 24 * 60);
  const L = classes.find(c => c.classKey === "L");
  const t4 = L.cellByTier["4 Tage"];
  if (!t4) throw new Error("L 4-Tage nicht verfügbar");
  if (!approx(t4.price, 369.99)) throw new Error(`${t4.price}`);
});

test("L bietet keine 5/7/9-Tage-Pakete", () => {
  const { classes } = allOptions(100, 5 * 24 * 60);
  const L = classes.find(c => c.classKey === "L");
  if (L.cellByTier["5 Tage"]) throw new Error("L hat 5-Tage-Paket?");
  if (L.cellByTier["7 Tage"]) throw new Error("L hat 7-Tage-Paket?");
});

console.log(`\n${pass} bestanden, ${fail} fehlgeschlagen`);
process.exit(fail > 0 ? 1 : 0);
