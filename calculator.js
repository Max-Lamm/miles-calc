// ============================================================================
// MILES Preisrechner — Tarifdaten, Berechnungslogik, DOM-Binding
// ============================================================================

// ----- Tarifdaten (alle Werte in Euro, Dauer in Stunden) --------------------

// Jedes Paket hat einen `tier` (Tabellenspalte) und ein `label` (km-Variante).
// Mehrere Pakete können denselben tier teilen (z. B. 1 Tag / 50 km vs. 1 Tag / 150 km);
// pro Zelle wird automatisch das günstigste anwendbare gewählt.
const TARIFFS = {
  S: {
    label: "S",
    description: "Kleinwagen",
    standard: { perKm: 0.79, unlock: 1.00, parkPerMin: 0.35, minCharge: 0 },
    extraKmPrice: 0.59,
    packages: [
      { tier: "3h",     label: "3h / 40 km",      durationH: 3,   inclKm: 40,  price: 39.99 },
      { tier: "6h",     label: "6h / 50 km",      durationH: 6,   inclKm: 50,  price: 44.99 },
      { tier: "1 Tag",  label: "Flex",            durationH: 24,  inclKm: 0,   price: 24.99 },
      { tier: "1 Tag",  label: "1 Tag / 50 km",   durationH: 24,  inclKm: 50,  price: 49.99 },
      { tier: "1 Tag",  label: "1 Tag / 100 km",  durationH: 24,  inclKm: 100, price: 79.99 },
      { tier: "1 Tag",  label: "1 Tag / 150 km",  durationH: 24,  inclKm: 150, price: 99.99 },
      { tier: "2 Tage", label: "2 Tage / 100 km", durationH: 48,  inclKm: 100, price: 84.99 },
      { tier: "2 Tage", label: "2 Tage / 300 km", durationH: 48,  inclKm: 300, price: 189.99 },
      { tier: "3 Tage", label: "3 Tage / 150 km", durationH: 72,  inclKm: 150, price: 119.99 },
      { tier: "3 Tage", label: "3 Tage / 350 km", durationH: 72,  inclKm: 350, price: 219.99 },
      { tier: "4 Tage", label: "4 Tage / 200 km", durationH: 96,  inclKm: 200, price: 174.99 },
      { tier: "5 Tage", label: "5 Tage / 250 km", durationH: 120, inclKm: 250, price: 199.99 },
      { tier: "7 Tage", label: "7 Tage / 350 km", durationH: 168, inclKm: 350, price: 299.99 },
      { tier: "9 Tage", label: "9 Tage / 450 km", durationH: 216, inclKm: 450, price: 370.99 },
    ],
  },
  M: {
    label: "M",
    description: "Mittelklasse",
    standard: { perKm: 0.79, unlock: 1.00, parkPerMin: 0.35, minCharge: 0 },
    extraKmPrice: 0.69,
    packages: [
      { tier: "3h",     label: "3h / 40 km",      durationH: 3,   inclKm: 40,  price: 39.99 },
      { tier: "6h",     label: "6h / 50 km",      durationH: 6,   inclKm: 50,  price: 44.99 },
      { tier: "1 Tag",  label: "Flex",            durationH: 24,  inclKm: 0,   price: 24.99 },
      { tier: "1 Tag",  label: "1 Tag / 50 km",   durationH: 24,  inclKm: 50,  price: 59.99 },
      { tier: "1 Tag",  label: "1 Tag / 100 km",  durationH: 24,  inclKm: 100, price: 89.99 },
      { tier: "1 Tag",  label: "1 Tag / 150 km",  durationH: 24,  inclKm: 150, price: 114.99 },
      { tier: "2 Tage", label: "2 Tage / 100 km", durationH: 48,  inclKm: 100, price: 104.99 },
      { tier: "2 Tage", label: "2 Tage / 300 km", durationH: 48,  inclKm: 300, price: 214.99 },
      { tier: "3 Tage", label: "3 Tage / 150 km", durationH: 72,  inclKm: 150, price: 149.99 },
      { tier: "3 Tage", label: "3 Tage / 350 km", durationH: 72,  inclKm: 350, price: 249.99 },
      { tier: "4 Tage", label: "4 Tage / 200 km", durationH: 96,  inclKm: 200, price: 184.99 },
      { tier: "5 Tage", label: "5 Tage / 250 km", durationH: 120, inclKm: 250, price: 229.99 },
      { tier: "7 Tage", label: "7 Tage / 350 km", durationH: 168, inclKm: 350, price: 318.99 },
      { tier: "9 Tage", label: "9 Tage / 450 km", durationH: 216, inclKm: 450, price: 410.99 },
    ],
  },
  L: {
    label: "L",
    description: "Transporter",
    standard: { perKm: 1.09, unlock: 2.00, parkPerMin: 0.35, minCharge: 15.00 },
    extraKmPrice: 0.69,
    packages: [
      { tier: "3h",     label: "3h / 35 km",      durationH: 3,  inclKm: 35,  price: 49.99 },
      { tier: "6h",     label: "6h / 50 km",      durationH: 6,  inclKm: 50,  price: 64.99 },
      { tier: "1 Tag",  label: "1 Tag / 125 km",  durationH: 24, inclKm: 125, price: 99.99 },
      { tier: "2 Tage", label: "2 Tage / 250 km", durationH: 48, inclKm: 250, price: 199.99 },
      { tier: "3 Tage", label: "3 Tage / 375 km", durationH: 72, inclKm: 375, price: 279.99 },
      { tier: "4 Tage", label: "4 Tage / 500 km", durationH: 96, inclKm: 500, price: 369.99 },
    ],
  },
  XL: {
    label: "XL",
    description: "großer Transporter",
    standard: { perKm: 1.09, unlock: 2.00, parkPerMin: 0.35, minCharge: 20.00 },
    extraKmPrice: 0.79,
    packages: [
      { tier: "3h",     label: "3h / 35 km",      durationH: 3,  inclKm: 35,  price: 59.99 },
      { tier: "6h",     label: "6h / 50 km",      durationH: 6,  inclKm: 50,  price: 74.99 },
      { tier: "1 Tag",  label: "1 Tag / 125 km",  durationH: 24, inclKm: 125, price: 119.99 },
      { tier: "2 Tage", label: "2 Tage / 250 km", durationH: 48, inclKm: 250, price: 219.99 },
      { tier: "3 Tage", label: "3 Tage / 375 km", durationH: 72, inclKm: 375, price: 299.99 },
      { tier: "4 Tage", label: "4 Tage / 500 km", durationH: 96, inclKm: 500, price: 388.99 },
    ],
  },
};

const CLASS_ORDER = ["S", "M", "L", "XL"];

// Dauer-Tiers als Tabellenspalten. Pro Zelle wird die günstigste km-Variante gewählt.
const PACKAGE_COLUMNS = ["3h", "6h", "1 Tag", "2 Tage", "3 Tage", "4 Tage", "5 Tage", "7 Tage", "9 Tage"];

// Oberhalb dieser Dauer macht der Minutentarif keinen Sinn mehr — geschätzte
// Parkminuten × 0,35 €/min ergeben Fantasiepreise, die Miles so nicht anwendet.
// Pakete gewinnen bei Langzeitmieten sowieso.
const STANDARD_MAX_DURATION_MIN = 24 * 60;

const PASSES = [
  { id: "none",   label: "Ohne Pass", monthly: 0,      yearly: 0,       credit: 0,   dStd: 0,    dPkg: 0,    noUnlock: false },
  { id: "silber", label: "Silber",    monthly: 9.99,   yearly: 99.99,   credit: 10,  dStd: 0.10, dPkg: 0.05, noUnlock: false },
  { id: "gold",   label: "Gold",      monthly: 49.99,  yearly: 549.99,  credit: 50,  dStd: 0.15, dPkg: 0.10, noUnlock: false },
  { id: "platin", label: "Platin",    monthly: 59.99,  yearly: 659.99,  credit: 50,  dStd: 0.15, dPkg: 0.10, noUnlock: true  },
  { id: "black",  label: "Black",     monthly: 250.00, yearly: 2749.99, credit: 250, dStd: 0.15, dPkg: 0.15, noUnlock: true  },
];

// ----- Formatierung ---------------------------------------------------------

const fmtEUR = n => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// ----- Reine Berechnungsfunktionen ------------------------------------------

const roundKm = km => Math.ceil(km);

// Standardtarif = Unlock + km × €/km + Parkminuten × €/min
// Parkminuten geschätzt: Gesamtdauer − Fahrzeit(km × 2 min, entspricht Ø 30 km/h).
function standardPrice(standard, km, durationMin) {
  const billedKm = roundKm(km);
  const driveMin = billedKm * 2;
  const parkMin = Math.max(0, durationMin - driveMin);
  const kmCost = billedKm * standard.perKm;
  const parkCost = parkMin * standard.parkPerMin;
  const raw = standard.unlock + kmCost + parkCost;
  const price = Math.max(raw, standard.minCharge);
  return {
    kind: "standard",
    applicable: true,
    price,
    breakdown: {
      unlock: standard.unlock,
      billedKm,
      perKm: standard.perKm,
      kmCost,
      driveMin,
      parkMin,
      parkPerMin: standard.parkPerMin,
      parkCost,
      rawTotal: raw,
      clampedToMin: price > raw ? standard.minCharge : null,
    },
  };
}

// Paket-Tarif = Paketpreis + max(0, km − inklusiveKm) × Zusatz-km-Preis
// Nicht anwendbar, wenn Dauer das Paket übersteigt.
function packagePrice(pkg, extraKmPrice, km, durationMin, minCharge) {
  if (durationMin > pkg.durationH * 60) {
    return { kind: "package", applicable: false, reason: "Dauer überschreitet Paket", pkg };
  }
  const billedKm = roundKm(km);
  const extraKm = Math.max(0, billedKm - pkg.inclKm);
  const extraKmCost = extraKm * extraKmPrice;
  const raw = pkg.price + extraKmCost;
  const price = Math.max(raw, minCharge);
  return {
    kind: "package",
    applicable: true,
    price,
    pkg,
    breakdown: {
      packageLabel: pkg.label,
      packageTier: pkg.tier,
      packageBase: pkg.price,
      inclKm: pkg.inclKm,
      billedKm,
      extraKm,
      extraKmPrice,
      extraKmCost,
      rawTotal: raw,
      clampedToMin: price > raw ? minCharge : null,
    },
  };
}

// Alle Optionen einer Klasse (Standard + Pakete) mit Pass-Optimierung.
// Pro Dauer-Tier wird die günstigste km-Variante des Tiers ausgewählt.
function classOptions(classKey, km, durationMin) {
  const t = TARIFFS[classKey];

  // Standardtarif: oberhalb 24 h als nicht anwendbar markieren.
  const standard = standardPrice(t.standard, km, durationMin);
  if (durationMin > STANDARD_MAX_DURATION_MIN) {
    standard.applicable = false;
    standard.reason = "Minutentarif nur für Kurzzeitmieten (≤ 24 h) sinnvoll";
  }
  standard.optimized = standard.applicable ? optimizeWithPass(standard, t.standard) : null;

  // Beste km-Variante pro Dauer-Tier.
  const cellByTier = {};
  for (const tier of PACKAGE_COLUMNS) {
    const candidates = t.packages.filter(p => p.tier === tier);
    let bestForTier = null;
    for (const pkg of candidates) {
      const calc = packagePrice(pkg, t.extraKmPrice, km, durationMin, t.standard.minCharge);
      if (!calc.applicable) continue;
      calc.optimized = optimizeWithPass(calc, t.standard);
      if (!bestForTier || calc.optimized.finalPrice < bestForTier.optimized.finalPrice) {
        bestForTier = calc;
      }
    }
    cellByTier[tier] = bestForTier;
  }

  // Klassen-Bestpreis über alle anwendbaren Zellen.
  const applicable = [
    ...(standard.applicable ? [standard] : []),
    ...Object.values(cellByTier).filter(Boolean),
  ];
  const best = applicable.reduce((a, b) => {
    if (!a) return b;
    return a.optimized.finalPrice <= b.optimized.finalPrice ? a : b;
  }, null);

  const maxPkgH = Math.max(...t.packages.map(p => p.durationH));

  return {
    classKey,
    label: t.label,
    description: t.description,
    standard,
    cellByTier,
    best,
    maxPkgH,
  };
}

// Alle Klassen. Winner = Klasse mit niedrigstem optimiertem Bestpreis.
function allOptions(km, durationMin) {
  const classes = CLASS_ORDER.map(k => classOptions(k, km, durationMin));
  const winner = classes.reduce((a, b) => {
    if (!a || !a.best) return b;
    if (!b.best) return a;
    return a.best.optimized.finalPrice <= b.best.optimized.finalPrice ? a : b;
  }, null);
  return { classes, winner };
}

// Optimale Einzelfahrt-Kosten: Basispreis vs. Pass-für-diesen-Monat.
// User-Modell: zu Monatsbeginn Pass buchen, Fahrt machen, vor Auto-Renew kündigen.
// Die volle Monatsgebühr wird dieser einen Fahrt zugeschrieben, Guthaben absorbiert
// den Trippreis bis zu seiner Höhe.
function optimizeWithPass(option, standardTariff) {
  if (!option || !option.applicable) return null;
  // Ausgangspunkt: ohne Pass
  let best = {
    pass: PASSES[0],
    finalPrice: option.price,
    discountedTrip: option.price,
    passOverhead: 0,
    creditUsed: 0,
    savings: 0,
  };
  for (let i = 1; i < PASSES.length; i++) {
    const pass = PASSES[i];
    let raw = option.breakdown.rawTotal;
    let discount;
    if (option.kind === "standard") {
      if (pass.noUnlock) raw -= standardTariff.unlock;
      discount = pass.dStd;
    } else {
      discount = pass.dPkg;
    }
    const discountedTrip = Math.max(raw * (1 - discount), standardTariff.minCharge);
    const creditUsed = Math.min(discountedTrip, pass.credit);
    const finalPrice = pass.monthly + (discountedTrip - creditUsed);
    if (finalPrice < best.finalPrice - 0.005) {
      best = {
        pass,
        finalPrice,
        discountedTrip,
        passOverhead: pass.monthly,
        creditUsed,
        savings: option.price - finalPrice,
      };
    }
  }
  return best;
}

// ----- DOM-Binding ----------------------------------------------------------

function parseNum(value) {
  if (value === "" || value == null) return NaN;
  const n = Number(String(value).replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
}

function nextFullHour(date) {
  const d = new Date(date);
  if (d.getMinutes() > 0 || d.getSeconds() > 0 || d.getMilliseconds() > 0) {
    d.setHours(d.getHours() + 1, 0, 0, 0);
  } else {
    d.setSeconds(0, 0);
  }
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toMinutes() {
  const startVal = document.getElementById("dt-start").value;
  const endVal   = document.getElementById("dt-end").value;
  if (!startVal || !endVal) return NaN;
  const diffMs = new Date(endVal).getTime() - new Date(startVal).getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return NaN;
  return diffMs / 60000;
}

function breakdownText(option) {
  if (!option || !option.applicable) return "";
  const b = option.breakdown;
  let baseText;
  if (option.kind === "standard") {
    const parts = [
      `Entsperrung ${fmtEUR(b.unlock)}`,
      `${b.billedKm} km × ${fmtEUR(b.perKm)} = ${fmtEUR(b.kmCost)}`,
      `${b.parkMin} Parkmin × ${fmtEUR(b.parkPerMin)} = ${fmtEUR(b.parkCost)}`,
    ];
    baseText = parts.join(" + ") + ` = ${fmtEUR(b.rawTotal)}`;
  } else {
    const parts = [`${b.packageLabel}-Paket ${fmtEUR(b.packageBase)} (inkl. ${b.inclKm} km)`];
    if (b.extraKm > 0) parts.push(`${b.extraKm} Zusatz-km × ${fmtEUR(b.extraKmPrice)} = ${fmtEUR(b.extraKmCost)}`);
    baseText = parts.join(" + ") + ` = ${fmtEUR(b.rawTotal)}`;
  }
  if (b.clampedToMin != null) baseText += ` · Mindestbetrag ${fmtEUR(b.clampedToMin)}`;

  const opt = option.optimized;
  if (!opt || opt.pass.id === "none") return `Ohne Pass: ${baseText}`;

  const passLine = `Mit ${opt.pass.label}-Pass (${fmtEUR(opt.pass.monthly)}/Mo, ${fmtEUR(opt.pass.credit)} Guthaben):`;
  const calc = `${fmtEUR(opt.discountedTrip)} rabattiert + ${fmtEUR(opt.passOverhead)} Abo − ${fmtEUR(opt.creditUsed)} Guthaben = ${fmtEUR(opt.finalPrice)}`;
  const saved = `Ersparnis ggü. ohne Pass: ${fmtEUR(opt.savings)}`;
  return `${baseText}\n\n${passLine}\n${calc}\n${saved}`;
}

function renderEmpty() {
  document.getElementById("results-body").innerHTML = "";
}

function render() {
  const km = parseNum(document.getElementById("km").value);
  const durationMin = toMinutes();

  const startVal = document.getElementById("dt-start").value;
  const endVal   = document.getElementById("dt-end").value;
  const hasTimeError = startVal && endVal &&
    new Date(endVal).getTime() <= new Date(startVal).getTime();

  const errorEl = document.getElementById("datetime-error");
  const dtEnd   = document.getElementById("dt-end");
  const dtStart = document.getElementById("dt-start");
  if (errorEl) errorEl.hidden = !hasTimeError;
  if (dtEnd)   dtEnd.classList.toggle("is-invalid", !!hasTimeError);
  if (dtStart) dtStart.classList.toggle("is-invalid", !!hasTimeError);

  if (!Number.isFinite(km) || km < 0 || !Number.isFinite(durationMin)) {
    renderEmpty();
    return;
  }

  const { classes } = allOptions(km, durationMin);

  // Tabelle
  const body = document.getElementById("results-body");
  body.innerHTML = "";
  for (const cls of classes) {
    const row = document.createElement("tr");

    const head = document.createElement("th");
    head.scope = "row";
    let headContent = `<span class="cls-label">${cls.label}</span><span class="cls-desc">${cls.description}</span>`;
    if (!cls.best) {
      headContent += `<span class="cls-hint">nicht verfügbar für diese Dauer</span>`;
    }
    head.innerHTML = headContent;
    row.appendChild(head);

    // Standard-Spalte
    row.appendChild(buildCell(cls.standard, cls.best));

    // Paket-Tier-Spalten
    for (const tier of PACKAGE_COLUMNS) {
      const opt = cls.cellByTier[tier];
      if (!opt) {
        const td = document.createElement("td");
        td.className = "cell cell-na";
        td.textContent = "—";
        td.title = "Kein Paket dieser Klasse für diese Dauer verfügbar.";
        row.appendChild(td);
        continue;
      }
      row.appendChild(buildCell(opt, cls.best));
    }
    body.appendChild(row);
  }
}

function buildCell(option, bestOfClass) {
  const td = document.createElement("td");
  td.className = "cell";
  if (!option || !option.applicable) {
    td.textContent = "—";
    td.classList.add("cell-na");
    td.title = option && option.reason ? option.reason : "Nicht anwendbar";
    return td;
  }
  const opt = option.optimized;
  // Kleines Label oben: welche km-Variante wurde gewählt (z. B. "Flex", "1 Tag / 100 km").
  // Für die Standard-Zelle und bei eindeutigen Tiers (3h, 6h) optional, zeigen wir es immer
  // für Konsistenz — außer Standard, der keinen Paketnamen hat.
  if (option.kind === "package") {
    const sub = document.createElement("div");
    sub.className = "cell-sub";
    sub.textContent = option.pkg.label;
    td.appendChild(sub);
  }
  const priceEl = document.createElement("div");
  priceEl.className = "cell-price";
  priceEl.textContent = fmtEUR(opt.finalPrice);
  td.appendChild(priceEl);
  if (opt.pass.id !== "none") {
    const badge = document.createElement("span");
    badge.className = `pass-badge pass-${opt.pass.id}`;
    badge.textContent = `${opt.pass.label} −${fmtEUR(opt.savings)}`;
    td.appendChild(badge);
  }
  if (bestOfClass && option === bestOfClass) td.classList.add("cell-best");
  td.title = breakdownText(option);
  return td;
}

// ----- Streckenberechnung (Nominatim + OSRM) --------------------------------

const selectedCoords = { start: null, end: null };

async function nominatimSearch(query) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}`
    + `&format=json&limit=5&addressdetails=0&countrycodes=de,at,ch,lu`
    + `&viewbox=5.87,47.27,15.04,55.06&bounded=0`;
  const res  = await fetch(url, { headers: { "Accept-Language": "de", "User-Agent": "MILES-Preisrechner/1.0" } });
  return res.json();
}

function renderSuggestions(results, listEl, inputEl, key) {
  listEl.innerHTML = "";
  if (!results.length) { listEl.hidden = true; return; }
  for (const r of results) {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.dataset.lat = r.lat;
    li.dataset.lon = r.lon;
    const parts = r.display_name.split(", ");
    const main  = parts.slice(0, 2).join(", ");
    const sub   = parts.slice(2, 4).join(", ");
    li.innerHTML = `<span class="ac-main">${main}</span>${sub ? `<span class="ac-sub">${sub}</span>` : ""}`;
    li.addEventListener("mousedown", e => {
      e.preventDefault();
      selectSuggestion(li, inputEl, listEl, key);
    });
    listEl.appendChild(li);
  }
  listEl.hidden = false;
}

function selectSuggestion(li, inputEl, listEl, key) {
  inputEl.value = li.querySelector(".ac-main").textContent;
  selectedCoords[key] = { lat: li.dataset.lat, lon: li.dataset.lon };
  listEl.hidden = true;
  if (selectedCoords.start && selectedCoords.end) calcRoute();
}

function setupAutocomplete(inputEl, listEl, key) {
  let timer;
  inputEl.addEventListener("input", () => {
    selectedCoords[key] = null;
    clearTimeout(timer);
    const query = inputEl.value.trim();
    if (query.length < 3) { listEl.hidden = true; return; }
    timer = setTimeout(async () => {
      const results = await nominatimSearch(query);
      renderSuggestions(results, listEl, inputEl, key);
    }, 300);
  });

  inputEl.addEventListener("keydown", e => {
    if (e.key === "Escape") { listEl.hidden = true; return; }
    if (listEl.hidden) return;
    const items  = Array.from(listEl.querySelectorAll("li"));
    const active = listEl.querySelector("li.ac-active");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = active ? active.nextElementSibling : items[0];
      active?.classList.remove("ac-active");
      next?.classList.add("ac-active");
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = active ? active.previousElementSibling : items[items.length - 1];
      active?.classList.remove("ac-active");
      prev?.classList.add("ac-active");
    } else if (e.key === "Enter") {
      const activeItem = listEl.querySelector("li.ac-active");
      if (activeItem) { e.preventDefault(); selectSuggestion(activeItem, inputEl, listEl, key); }
    }
  });

  inputEl.addEventListener("blur", () => { setTimeout(() => { listEl.hidden = true; }, 150); });
}

async function calcRoute() {
  const startVal = document.getElementById("route-start").value.trim();
  const endVal   = document.getElementById("route-end").value.trim();
  if (!startVal || !endVal) return;

  const resultEl = document.getElementById("route-result");
  const calcBtn  = document.getElementById("route-calc-btn");
  resultEl.textContent = "Berechnung läuft…";
  resultEl.className = "route-result";
  resultEl.hidden = false;
  calcBtn.disabled = true;

  try {
    const fromResults = selectedCoords.start ? [selectedCoords.start] : await nominatimSearch(startVal);
    const toResults   = selectedCoords.end   ? [selectedCoords.end]   : await nominatimSearch(endVal);
    const from = selectedCoords.start || fromResults[0];
    const to   = selectedCoords.end   || toResults[0];

    if (!from || !to) {
      resultEl.textContent = !from
        ? `Startort „${startVal}" nicht gefunden.`
        : `Zielort „${endVal}" nicht gefunden.`;
      resultEl.classList.add("route-result--error");
      return;
    }

    const url  = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=false`;
    const res  = await fetch(url);
    const data = await res.json();
    const meters = data.routes?.[0]?.distance;
    if (!meters) {
      resultEl.textContent = "Route konnte nicht berechnet werden.";
      resultEl.classList.add("route-result--error");
      return;
    }

    const returnTrip = document.getElementById("route-return").checked;
    const km = Math.round(meters / 1000 / 5) * 5 * (returnTrip ? 2 : 1);
    resultEl.textContent = returnTrip
      ? `≈ ${km} km übernommen (Hin- & Rückfahrt).`
      : `≈ ${km} km Fahrdistanz übernommen.`;

    const kmInput  = document.getElementById("km");
    const kmSlider = document.getElementById("km-slider");
    kmInput.value  = km;
    kmSlider.value = km;
    const pct = ((km - kmSlider.min) / (kmSlider.max - kmSlider.min)) * 100;
    kmSlider.style.backgroundSize = `${pct}% 100%`;
    document.getElementById("km-section").hidden = false;
    render();
  } catch {
    resultEl.textContent = "Netzwerkfehler – bitte erneut versuchen.";
    resultEl.classList.add("route-result--error");
  } finally {
    calcBtn.disabled = false;
  }
}

// ----- Init ------------------------------------------------------------------

function init() {
  const kmInput  = document.getElementById("km");
  const kmSlider = document.getElementById("km-slider");

  function updateSliderFill(slider) {
    const pct = ((slider.value - slider.min) / (slider.max - slider.min)) * 100;
    slider.style.backgroundSize = `${pct}% 100%`;
  }

  if (kmInput && kmSlider) {
    function snapKm(val) {
      return Math.min(500, Math.max(0, Math.round((parseFloat(val) || 0) / 5) * 5));
    }
    kmInput.addEventListener("input", () => {
      kmSlider.value = snapKm(kmInput.value);
      updateSliderFill(kmSlider);
      render();
    });
    kmInput.addEventListener("blur", () => {
      kmInput.value = snapKm(kmInput.value);
      kmSlider.value = kmInput.value;
      updateSliderFill(kmSlider);
      render();
    });
    kmSlider.addEventListener("input", () => {
      kmInput.value = kmSlider.value;
      updateSliderFill(kmSlider);
      render();
    });
    updateSliderFill(kmSlider);
  }

  const btnManual    = document.getElementById("btn-manual");
  const btnRoute     = document.getElementById("btn-route");
  const kmSection    = document.getElementById("km-section");
  const routeSection = document.getElementById("route-section");

  function setMode(mode) {
    const isRoute = mode === "route";
    kmSection.hidden    = isRoute;
    routeSection.hidden = !isRoute;
    btnManual.classList.toggle("active", !isRoute);
    btnRoute.classList.toggle("active", isRoute);
    if (isRoute) {
      document.getElementById("route-result").hidden = true;
    }
  }

  if (btnManual && btnRoute) {
    btnManual.addEventListener("click", () => setMode("manual"));
    btnRoute.addEventListener("click",  () => setMode("route"));
  }

  const routeCalcBtn = document.getElementById("route-calc-btn");
  if (routeCalcBtn) {
    routeCalcBtn.addEventListener("click", calcRoute);
    setupAutocomplete(document.getElementById("route-start"), document.getElementById("ac-start"), "start");
    setupAutocomplete(document.getElementById("route-end"),   document.getElementById("ac-end"),   "end");
  }

  const routeReturn = document.getElementById("route-return");
  if (routeReturn) {
    routeReturn.addEventListener("change", () => {
      if (!document.getElementById("route-result").hidden) calcRoute();
    });
  }

  const dtStart = document.getElementById("dt-start");
  const dtEnd   = document.getElementById("dt-end");
  if (dtStart && dtEnd) {
    const startStr = nextFullHour(new Date());
    const endDate  = new Date(startStr);
    endDate.setDate(endDate.getDate() + 1);
    dtStart.value = startStr;
    dtEnd.value   = nextFullHour(endDate);

    [dtStart, dtEnd].forEach(el => {
      el.addEventListener("input", render);
      el.addEventListener("change", render);
    });
  }

  render();
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
}

const API = {
  TARIFFS, PASSES, CLASS_ORDER, PACKAGE_COLUMNS,
  roundKm, standardPrice, packagePrice, classOptions, allOptions, optimizeWithPass,
};

if (typeof window !== "undefined") window.MilesCalc = API;
if (typeof module !== "undefined" && module.exports) module.exports = API;
