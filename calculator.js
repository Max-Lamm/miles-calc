// ============================================================================
// Car-Sharing Preisrechner — Tarifdaten, Berechnungslogik, DOM-Binding
// Multi-Provider: MILES, Sixt share, Free2Move
// ============================================================================

// ----- Geteilte Konstanten --------------------------------------------------

const CLASS_ORDER = ["S", "M", "L", "XL"];

// Oberhalb dieser Dauer macht der Minutentarif keinen Sinn mehr — geschätzte
// Parkminuten × Park-€/min ergeben Fantasiepreise, die in Realität keiner anwendet.
// Pakete gewinnen bei Langzeitmieten sowieso.
const STANDARD_MAX_DURATION_MIN_DEFAULT = 24 * 60;

// Leerer Pass-Stack — für Provider ohne Rabatt-/Membership-Modell.
// Sorgt dafür, dass `optimizeWithPass` den Basispreis durchreicht.
const PASSES_NONE = [
  { id: "none", label: "Ohne Pass", monthly: 0, credit: 0, dStd: 0, dPkg: 0, noUnlock: false },
];

const PASSES_FREE2MOVE = [
  { id: "none",    label: "Kein Guthaben",  monthly: 0,  credit: 0,   dStd: 0, dPkg: 0, noUnlock: false, kind: "credit" },
  { id: "tier50",  label: "Guthaben 50 €",  monthly: 45, credit: 50,  dStd: 0, dPkg: 0, noUnlock: false, kind: "credit" },
  { id: "tier100", label: "Guthaben 100 €", monthly: 85, credit: 100, dStd: 0, dPkg: 0, noUnlock: false, kind: "credit" },
];

// ----- MILES-Tarife ---------------------------------------------------------

// Jedes Paket hat einen `tier` (Tabellenspalte) und ein `label` (km-Variante).
// Mehrere Pakete können denselben tier teilen (z. B. 1 Tag / 50 km vs. 1 Tag / 150 km);
// pro Zelle wird automatisch das günstigste anwendbare gewählt.
const TARIFFS_MILES = {
  S: {
    label: "S",
    description: "Kleinwagen",
    nativeLabel: "MILES S — Kleinwagen",
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
    nativeLabel: "MILES M — Mittelklasse",
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
    nativeLabel: "MILES L — Transporter",
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
    nativeLabel: "MILES XL — großer Transporter",
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

const PACKAGE_COLUMNS_MILES = ["3h", "6h", "1 Tag", "2 Tage", "3 Tage", "4 Tage", "5 Tage", "7 Tage", "9 Tage"];

const PASSES_MILES = [
  { id: "none",   label: "Ohne Pass", monthly: 0,      yearly: 0,       credit: 0,   dStd: 0,    dPkg: 0,    noUnlock: false },
  { id: "silber", label: "Silber",    monthly: 9.99,   yearly: 99.99,   credit: 10,  dStd: 0.10, dPkg: 0.05, noUnlock: false },
  { id: "gold",   label: "Gold",      monthly: 49.99,  yearly: 549.99,  credit: 50,  dStd: 0.15, dPkg: 0.10, noUnlock: false },
  { id: "platin", label: "Platin",    monthly: 59.99,  yearly: 659.99,  credit: 50,  dStd: 0.15, dPkg: 0.10, noUnlock: true  },
  { id: "black",  label: "Black",     monthly: 250.00, yearly: 2749.99, credit: 250, dStd: 0.15, dPkg: 0.15, noUnlock: true  },
];

// ----- Sixt share -----------------------------------------------------------
// Sixt nutzt ein zweidimensionales Tarifmodell, das sich grundlegend von MILES
// unterscheidet:
//   1. ZEIT-PAKETE (Tagespauschalen): nur Mietdauer, keine Inklusiv-km
//   2. KM-PAKETE (separate Bundles für 50/100/.../750 km)
//   3. Direkt-km: 0,55 €/km, wenn kein Paket günstiger ist
//   4. Unlock: 0,95 € pro Fahrt, additiv zu allem
//
// Die App wählt automatisch die günstigste Kombination Zeit-Paket + Km-Paket-oder-Direkt.
// Beispiel (Quelle: User-App-Quote, Mai 2026):
//   M, 1 Tag, 50 km  = 23,99 (1 Tag) + 22,99 (50-km-Paket) + 0,95 (Unlock) = 47,93 €
//   M, 1 Tag, 250 km = 23,99 +        109,99 (250-km-Paket)        + 0,95 = 134,93 €
//
// Mapping Preisklassen (Sixt PK 1–5) auf unsere Klassen S/M/L/XL:
//   S  → PK 1 (Mini, z. B. Fiat 500)
//   M  → PK 3 (Mid, z. B. BMW 1er)
//   L  → PK 4 (Premium / SUV, z. B. BMW X1)
//   XL → PK 5 (Van / High-End, z. B. BMW 5er)
//
// Standardtarif (Minutentarif, ohne Tagespaket):
//   - Unlock 0,95 €, perKm 1,14 € (M, vom User bestätigt), parkPerMin 0,35 €/min
//   - Für S/L/XL ist perKm proportional skaliert (Schätzung, noch nicht App-verifiziert)
//
// Tagespakete (1–5 Tage) für M sind vom User App-verifiziert.
// 4-Tage- und 5-Tage-Werte für S/L/XL sind linear interpoliert zwischen 3 Tage und
// 7 Tage (offizielle Sixt-Webseite); 7-Tage-Werte stammen ebenfalls von der Webseite.

// Km-Pakete sind klassenunabhängig (gilt für PK 1–5 gleich, Quelle: User-App-Quote).
// Das 30-km-Paket erscheint bei 3h/6h-Buchungen — unsere Optimierer-Logik wählt
// für jedes Buchungs-Szenario das günstigste anwendbare Paket.
const KM_PACKAGES_SIXT = [
  { km: 30,  price: 14.99 },
  { km: 50,  price: 22.99 },
  { km: 100, price: 44.99 },
  { km: 150, price: 65.99 },
  { km: 200, price: 87.99 },
  { km: 250, price: 109.99 },
  { km: 350, price: 149.99 },
  { km: 500, price: 214.99 },
  { km: 750, price: 319.99 },
];

const TARIFFS_SIXT = {
  S: {
    label: "S",
    description: "Mini / Kleinwagen",
    nativeLabel: "Sixt share PK 1 — Mini (z. B. Fiat 500, Mini Cooper)",
    standard: { perKm: 0.99, unlock: 0.95, parkPerMin: 0.35, minCharge: 0 },
    extraKmPrice: 0.55,
    kmPackages: KM_PACKAGES_SIXT,
    packages: [
      { tier: "1h",     label: "City Flat 1h",   durationH: 1,   inclKm: 0, price: 7.99 },
      { tier: "3h",     label: "3h-Paket",       durationH: 3,   inclKm: 0, price: 6.99 },
      { tier: "6h",     label: "6h-Paket",       durationH: 6,   inclKm: 0, price: 8.99 },
      { tier: "1 Tag",  label: "1 Tag",          durationH: 24,  inclKm: 0, price: 15.99 },
      { tier: "2 Tage", label: "2 Tage",         durationH: 48,  inclKm: 0, price: 29.99 },
      { tier: "3 Tage", label: "3 Tage",         durationH: 72,  inclKm: 0, price: 42.99 },
      { tier: "4 Tage", label: "4 Tage",         durationH: 96,  inclKm: 0, price: 59.99 },
      { tier: "5 Tage", label: "5 Tage",         durationH: 120, inclKm: 0, price: 75.99 },
      { tier: "7 Tage", label: "7 Tage",         durationH: 168, inclKm: 0, price: 109.99 },
    ],
  },
  M: {
    label: "M",
    description: "Mittelklasse",
    nativeLabel: "Sixt share PK 3 — Mid (z. B. BMW 1er, Mercedes A-Klasse)",
    standard: { perKm: 1.14, unlock: 0.95, parkPerMin: 0.35, minCharge: 0 },
    extraKmPrice: 0.55,
    kmPackages: KM_PACKAGES_SIXT,
    packages: [
      { tier: "1h",     label: "City Flat 1h",   durationH: 1,   inclKm: 0, price: 10.99 },
      { tier: "3h",     label: "3h-Paket",       durationH: 3,   inclKm: 0, price: 10.49 },
      { tier: "6h",     label: "6h-Paket",       durationH: 6,   inclKm: 0, price: 13.49 },
      { tier: "1 Tag",  label: "1 Tag",          durationH: 24,  inclKm: 0, price: 23.99 },
      { tier: "2 Tage", label: "2 Tage",         durationH: 48,  inclKm: 0, price: 45.99 },
      { tier: "3 Tage", label: "3 Tage",         durationH: 72,  inclKm: 0, price: 64.99 },
      { tier: "4 Tage", label: "4 Tage",         durationH: 96,  inclKm: 0, price: 89.99 },
      { tier: "5 Tage", label: "5 Tage",         durationH: 120, inclKm: 0, price: 113.99 },
      { tier: "7 Tage", label: "7 Tage",         durationH: 168, inclKm: 0, price: 165.99 },
    ],
  },
  L: {
    label: "L",
    description: "Premium / SUV",
    nativeLabel: "Sixt share PK 4 — Premium / SUV (z. B. BMW X1, Mercedes GLA)",
    standard: { perKm: 1.29, unlock: 0.95, parkPerMin: 0.35, minCharge: 0 },
    extraKmPrice: 0.55,
    kmPackages: KM_PACKAGES_SIXT,
    packages: [
      { tier: "1h",     label: "City Flat 1h",   durationH: 1,   inclKm: 0, price: 12.49 },
      { tier: "3h",     label: "3h-Paket",       durationH: 3,   inclKm: 0, price: 11.99 },
      { tier: "6h",     label: "6h-Paket",       durationH: 6,   inclKm: 0, price: 15.99 },
      { tier: "1 Tag",  label: "1 Tag",          durationH: 24,  inclKm: 0, price: 27.99 },
      { tier: "2 Tage", label: "2 Tage",         durationH: 48,  inclKm: 0, price: 53.99 },
      { tier: "3 Tage", label: "3 Tage",         durationH: 72,  inclKm: 0, price: 74.99 },
      { tier: "4 Tage", label: "4 Tage",         durationH: 96,  inclKm: 0, price: 104.99 },
      { tier: "5 Tage", label: "5 Tage",         durationH: 120, inclKm: 0, price: 134.99 },
      { tier: "7 Tage", label: "7 Tage",         durationH: 168, inclKm: 0, price: 195.99 },
    ],
  },
  XL: {
    label: "XL",
    description: "Van / High-End",
    nativeLabel: "Sixt share PK 5 — Van / High-End (z. B. BMW 5er, Mercedes V-Klasse)",
    standard: { perKm: 1.49, unlock: 0.95, parkPerMin: 0.35, minCharge: 0 },
    extraKmPrice: 0.55,
    kmPackages: KM_PACKAGES_SIXT,
    packages: [
      { tier: "1h",     label: "City Flat 1h",   durationH: 1,   inclKm: 0, price: 14.99 },
      { tier: "3h",     label: "3h-Paket",       durationH: 3,   inclKm: 0, price: 15.99 },
      { tier: "6h",     label: "6h-Paket",       durationH: 6,   inclKm: 0, price: 20.99 },
      { tier: "1 Tag",  label: "1 Tag",          durationH: 24,  inclKm: 0, price: 36.99 },
      { tier: "2 Tage", label: "2 Tage",         durationH: 48,  inclKm: 0, price: 71.99 },
      { tier: "3 Tage", label: "3 Tage",         durationH: 72,  inclKm: 0, price: 99.99 },
      { tier: "4 Tage", label: "4 Tage",         durationH: 96,  inclKm: 0, price: 139.99 },
      { tier: "5 Tage", label: "5 Tage",         durationH: 120, inclKm: 0, price: 179.99 },
      { tier: "7 Tage", label: "7 Tage",         durationH: 168, inclKm: 0, price: 259.99 },
    ],
  },
};

const PACKAGE_COLUMNS_SIXT = ["1h", "3h", "6h", "1 Tag", "2 Tage", "3 Tage", "4 Tage", "5 Tage", "7 Tage"];

// ----- Free2Move ------------------------------------------------------------
// Free2Move München hat ein vielstufiges Tarifmodell, das sich grundlegend von
// MILES und Sixt unterscheidet:
//   1. ZEIT-PAKETE mit Inklusiv-km (1h, 2h, 4h, 6h, 9h) — keine inkl. km bei Stunden
//   2. TAGES-PAKETE in mehreren km-Varianten (60 / 125 / 200 km bei 1 Tag etc.) —
//      pro Variante ein eigener Zusatz-km-Preis (0,40–0,44 €/km)
//   3. MEHRTAGES-PAKETE ab 4 Tagen mit UNBEGRENZTEN km (pkg.unlimitedKm = true)
//   4. MINUTENTARIF mit 200 km inkl. — Zusatz-km nach Klasse (S 0,26 / M 0,27 / L 0,28)
//   5. GP-Buchungsgebühr (0,99 €) nur bei Sub-Tag-Mieten — verschwindet bei 1+ Tag
//   6. PLUS-SCHUTZ: klassen- und tier-abhängige Pauschalen, separat pro Tag
//
// Mapping Fahrzeuge → S/M/L/XL (User-Entscheidung):
//   S: Opel Corsa, Citroën C3
//   M: Opel Astra, Citroën C4, Opel Crossland, Peugeot 308 (308 mit Astra-Daten gemappt,
//      hat aber tatsächlich höhere Stunden-/Minutenpreise — Tagespakete sind identisch)
//   L: Peugeot 3008
//   XL: nicht angeboten → unavailable
//
// Quellen: App-Quotes für Opel Astra, Opel Corsa, Peugeot 3008, Peugeot 308 (Mai 2026,
// vom Nutzer geliefert) plus Übersichtspreise von der Free2Move-München-Seite.

const TARIFFS_FREE2MOVE = {
  S: {
    label: "S",
    description: "Kleinwagen",
    nativeLabel: "Free2Move S — Kleinwagen (Opel Corsa, Citroën C3)",
    standard: { perKm: 0.26, unlock: 0.99, parkPerMin: 0.19, minCharge: 0, inclKm: 200 },
    extraKmPrice: 0.40,  // Default; einzelne Pakete überschreiben über pkg.extraKmPrice
    packages: [
      // Stundenpakete: keine Inklusiv-km, Zusatz-km à 0,26 €/km
      { tier: "1h", label: "1h", durationH: 1, inclKm: 0, price:  7.99, extraKmPrice: 0.26 },
      { tier: "2h", label: "2h", durationH: 2, inclKm: 0, price: 16.99, extraKmPrice: 0.26 },
      { tier: "4h", label: "4h", durationH: 4, inclKm: 0, price: 22.99, extraKmPrice: 0.26 },
      { tier: "6h", label: "6h", durationH: 6, inclKm: 0, price: 28.99, extraKmPrice: 0.26 },
      { tier: "9h", label: "9h", durationH: 9, inclKm: 0, price: 37.99, extraKmPrice: 0.26 },
      // Tagespakete (1 Tag) — 3 km-Varianten
      { tier: "1 Tag",  label: "1 Tag / 60 km",   durationH: 24, inclKm: 60,  price: 41.99, extraKmPrice: 0.42 },
      { tier: "1 Tag",  label: "1 Tag / 125 km",  durationH: 24, inclKm: 125, price: 59.99, extraKmPrice: 0.40 },
      { tier: "1 Tag",  label: "1 Tag / 200 km",  durationH: 24, inclKm: 200, price: 84.99, extraKmPrice: 0.40 },
      // 2 Tage — 3 Varianten
      { tier: "2 Tage", label: "2 Tage / 120 km", durationH: 48, inclKm: 120, price:  73.99, extraKmPrice: 0.42 },
      { tier: "2 Tage", label: "2 Tage / 250 km", durationH: 48, inclKm: 250, price: 109.99, extraKmPrice: 0.40 },
      { tier: "2 Tage", label: "2 Tage / 400 km", durationH: 48, inclKm: 400, price: 159.99, extraKmPrice: 0.40 },
      // 3 Tage — eine Variante
      { tier: "3 Tage", label: "3 Tage / 180 km", durationH: 72, inclKm: 180, price: 104.99, extraKmPrice: 0.42 },
      // 4–7 Tage: unbegrenzt km
      { tier: "4 Tage", label: "4 Tage / unbegrenzt", durationH:  96, inclKm: 0, price: 118.99, unlimitedKm: true },
      { tier: "5 Tage", label: "5 Tage / unbegrenzt", durationH: 120, inclKm: 0, price: 131.99, unlimitedKm: true },
      { tier: "6 Tage", label: "6 Tage / unbegrenzt", durationH: 144, inclKm: 0, price: 156.99, unlimitedKm: true },
      { tier: "7 Tage", label: "7 Tage / unbegrenzt", durationH: 168, inclKm: 0, price: 181.99, unlimitedKm: true },
    ],
  },
  M: {
    label: "M",
    description: "Kompaktklasse",
    nativeLabel: "Free2Move M — Kompakt (Opel Astra, Citroën C4, Crossland; auch Peugeot 308 mit identischen Tagespaketen aber höheren Stunden-/Minutenpreisen)",
    standard: { perKm: 0.27, unlock: 0.99, parkPerMin: 0.22, minCharge: 0, inclKm: 200 },
    extraKmPrice: 0.41,
    packages: [
      { tier: "1h", label: "1h", durationH: 1, inclKm: 0, price:  9.49, extraKmPrice: 0.27 },
      { tier: "2h", label: "2h", durationH: 2, inclKm: 0, price: 12.99, extraKmPrice: 0.27 },
      { tier: "4h", label: "4h", durationH: 4, inclKm: 0, price: 22.49, extraKmPrice: 0.27 },
      { tier: "6h", label: "6h", durationH: 6, inclKm: 0, price: 31.99, extraKmPrice: 0.27 },
      { tier: "9h", label: "9h", durationH: 9, inclKm: 0, price: 42.49, extraKmPrice: 0.27 },
      { tier: "1 Tag",  label: "1 Tag / 60 km",   durationH: 24, inclKm:  60, price: 46.99, extraKmPrice: 0.43 },
      { tier: "1 Tag",  label: "1 Tag / 125 km",  durationH: 24, inclKm: 125, price: 64.99, extraKmPrice: 0.41 },
      { tier: "1 Tag",  label: "1 Tag / 200 km",  durationH: 24, inclKm: 200, price: 89.99, extraKmPrice: 0.41 },
      { tier: "2 Tage", label: "2 Tage / 120 km", durationH: 48, inclKm: 120, price:  78.99, extraKmPrice: 0.43 },
      { tier: "2 Tage", label: "2 Tage / 250 km", durationH: 48, inclKm: 250, price: 114.99, extraKmPrice: 0.41 },
      { tier: "2 Tage", label: "2 Tage / 400 km", durationH: 48, inclKm: 400, price: 164.99, extraKmPrice: 0.41 },
      { tier: "3 Tage", label: "3 Tage / 180 km", durationH: 72, inclKm: 180, price: 109.99, extraKmPrice: 0.43 },
      { tier: "4 Tage", label: "4 Tage / unbegrenzt", durationH:  96, inclKm: 0, price: 128.99, unlimitedKm: true },
      { tier: "5 Tage", label: "5 Tage / unbegrenzt", durationH: 120, inclKm: 0, price: 156.99, unlimitedKm: true },
      { tier: "6 Tage", label: "6 Tage / unbegrenzt", durationH: 144, inclKm: 0, price: 189.99, unlimitedKm: true },
      { tier: "7 Tage", label: "7 Tage / unbegrenzt", durationH: 168, inclKm: 0, price: 216.99, unlimitedKm: true },
    ],
  },
  L: {
    label: "L",
    description: "SUV / Premium",
    nativeLabel: "Free2Move L — SUV / Premium (Peugeot 3008)",
    standard: { perKm: 0.28, unlock: 0.99, parkPerMin: 0.25, minCharge: 0, inclKm: 200 },
    extraKmPrice: 0.42,
    packages: [
      { tier: "1h", label: "1h", durationH: 1, inclKm: 0, price: 10.99, extraKmPrice: 0.28 },
      { tier: "2h", label: "2h", durationH: 2, inclKm: 0, price: 14.99, extraKmPrice: 0.28 },
      { tier: "4h", label: "4h", durationH: 4, inclKm: 0, price: 25.49, extraKmPrice: 0.28 },
      { tier: "6h", label: "6h", durationH: 6, inclKm: 0, price: 35.49, extraKmPrice: 0.28 },
      { tier: "9h", label: "9h", durationH: 9, inclKm: 0, price: 46.99, extraKmPrice: 0.28 },
      { tier: "1 Tag",  label: "1 Tag / 60 km",   durationH: 24, inclKm:  60, price: 51.99, extraKmPrice: 0.44 },
      { tier: "1 Tag",  label: "1 Tag / 125 km",  durationH: 24, inclKm: 125, price: 69.99, extraKmPrice: 0.42 },
      { tier: "1 Tag",  label: "1 Tag / 200 km",  durationH: 24, inclKm: 200, price: 94.99, extraKmPrice: 0.42 },
      { tier: "2 Tage", label: "2 Tage / 120 km", durationH: 48, inclKm: 120, price:  93.99, extraKmPrice: 0.44 },
      { tier: "2 Tage", label: "2 Tage / 250 km", durationH: 48, inclKm: 250, price: 119.99, extraKmPrice: 0.42 },
      { tier: "2 Tage", label: "2 Tage / 400 km", durationH: 48, inclKm: 400, price: 169.99, extraKmPrice: 0.42 },
      { tier: "3 Tage", label: "3 Tage / 180 km", durationH: 72, inclKm: 180, price: 135.99, extraKmPrice: 0.44 },
      { tier: "4 Tage", label: "4 Tage / unbegrenzt", durationH:  96, inclKm: 0, price: 158.99, unlimitedKm: true },
      { tier: "5 Tage", label: "5 Tage / unbegrenzt", durationH: 120, inclKm: 0, price: 181.99, unlimitedKm: true },
      { tier: "6 Tage", label: "6 Tage / unbegrenzt", durationH: 144, inclKm: 0, price: 217.99, unlimitedKm: true },
      { tier: "7 Tage", label: "7 Tage / unbegrenzt", durationH: 168, inclKm: 0, price: 252.99, unlimitedKm: true },
    ],
  },
  XL: {
    label: "XL",
    description: "nicht verfügbar",
    nativeLabel: "Free2Move bietet in München aktuell keine XL-Transporter an",
    unavailable: true,
    standard: { perKm: 0, unlock: 0, parkPerMin: 0, minCharge: 0 },
    extraKmPrice: 0,
    packages: [],
  },
};

const PACKAGE_COLUMNS_FREE2MOVE = ["1h", "2h", "4h", "6h", "9h", "1 Tag", "2 Tage", "3 Tage", "4 Tage", "5 Tage", "6 Tage", "7 Tage"];

// ----- Provider-Registry ----------------------------------------------------

const PROVIDERS = {
  miles: {
    id: "miles",
    label: "MILES",
    brandClass: "provider-miles",
    tariffs: TARIFFS_MILES,
    passes: PASSES_MILES,
    packageColumns: PACKAGE_COLUMNS_MILES,
    standardMaxDurationMin: STANDARD_MAX_DURATION_MIN_DEFAULT,
    note: "Pass-Optimierung aktiv: günstigster Monats-Pass + Guthaben wird automatisch eingerechnet.",
  },
  sixt: {
    id: "sixt",
    label: "Sixt share",
    brandClass: "provider-sixt",
    tariffs: TARIFFS_SIXT,
    passes: PASSES_NONE,
    packageColumns: PACKAGE_COLUMNS_SIXT,
    standardMaxDurationMin: STANDARD_MAX_DURATION_MIN_DEFAULT,
    packageUnlock: 0.95,
    dailySurcharge: {
      label: "Smart-Schutz",
      // Tagespaket (>= 24h): pauschal pro angefangenem Tag. Klassenabhängig, weil der
      // Smart-Schutz mit dem Fahrzeug-Wiederbeschaffungswert skaliert.
      perDayByClass: {
        S: 7.99,             // Mini — Schätzung (M − 2,00 €)
        M: 9.99,             // BMW 1er, A-Klasse — App-bestätigt
        L: 14.99,            // Audi A3, BMW X1 — App-bestätigt
        XL: 19.99,           // Van / 5er — Schätzung (L + 5,00 €)
      },
      perDay: 9.99,          // Fallback, falls perDayByClass-Eintrag fehlt
      perMinute: 0.10,       // Minutentarif (Standard): pro Mietminute
      perKmPackage: 2.49,    // zusätzlich, wenn ein km-Paket gewählt wurde
      flatByTier: {          // Pauschale für spezifische Paket-Tiers (überschreibt perMinute/perDay)
        "1h": 3.59,          // City Flat — App-bestätigt (M-Klasse)
        "3h": 5.59,          // 3h-Paket — App-bestätigt (M-Klasse)
        "6h": 7.49,          // 6h-Paket — App-bestätigt (M-Klasse)
        // TODO: prüfen, ob diese Pauschalen auch für S/L/XL gelten oder klassenabhängig sind.
      },
      note: "0 € Selbstbeteiligung im Schadenfall (Voll-Kasko). Modus richtet sich nach gebuchtem Tarifmodell. Tagespauschalen klassenabhängig (S/M/L/XL).",
    },
    note: "Sixt rechnet mehrstufig: Zeit-Paket + Km-Paket-oder-Direkt + 0,95 € Unlock + Smart-Schutz (im Vergleich aktiv). Smart-Schutz: 9,99 €/Tag bei Tagespaketen, 0,10 €/min bei Minutentarif/Stundenpaketen, plus 2,49 € wenn ein km-Paket gewählt wurde. Tagespakete für M (PK 3) sind App-verifiziert (Mai 2026), Preise für S/L/XL aus offizieller Sixt-Tarifseite + interpolierte 4-/5-Tage-Werte. Alle Werte sind „ab\"-Preise und können dynamisch variieren.",
  },
  free2move: {
    id: "free2move",
    label: "Free2Move",
    brandClass: "provider-free2move",
    tariffs: TARIFFS_FREE2MOVE,
    passes: PASSES_FREE2MOVE,
    packageColumns: PACKAGE_COLUMNS_FREE2MOVE,
    standardMaxDurationMin: STANDARD_MAX_DURATION_MIN_DEFAULT,
    // GP-Gebühr: 0,99 € pauschal nur bei Sub-Tag-Buchungen (Stunden- und Minutentarif),
    // entfällt bei Tagespaketen (>= 24h).
    packageUnlock: { amount: 0.99, excludeFullDay: true },
    dailySurcharge: {
      label: "Plus-Schutz",
      // Tagespakete: pauschal pro angefangenem Tag, klassenabhängig (Voll-Kasko ohne SB).
      perDayByClass: {
        S: 7.99,   // Opel Corsa / Citroën C3 — App-bestätigt
        M: 8.99,   // Opel Astra / Crossland / Citroën C4 / Peugeot 308 — App-bestätigt
        L: 9.99,   // Peugeot 3008 — App-bestätigt
      },
      // Pauschal beim Minutentarif (Standardtarif) — 0,99 € unabhängig von Dauer/Klasse.
      flatStandard: 0.99,
      // Stundenpakete: pauschal pro Tier × Klasse (App-bestätigt für S/M/L).
      flatByTierByClass: {
        "1h": { S: 1.49, M: 1.99, L: 1.99 },
        "2h": { S: 1.99, M: 2.49, L: 2.99 },
        "4h": { S: 3.49, M: 3.99, L: 4.99 },
        "6h": { S: 4.99, M: 5.49, L: 6.99 },
        "9h": { S: 6.49, M: 7.49, L: 8.99 },
      },
      note: "Voll-Kasko ohne Selbstbehalt — wird im Vergleich immer aktiv mitgerechnet.",
    },
    note: "Guthaben-Kauf-Optimierung aktiv: günstigster Guthaben-Kauf (50 € für 45 € oder 100 € für 85 €) wird automatisch eingerechnet. Free2Move rechnet vielstufig: Paket + Zusatz-km × paket-spezifischem Preis + 0,99 € GP-Gebühr (nur bei Sub-Tag-Buchungen) + Plus-Schutz (klassen- und tier-abhängig). Tagespakete haben mehrere km-Varianten (60/125/200 km bei 1 Tag etc.) — pro Tier wählt der Rechner automatisch die günstigste. Ab 4 Tagen sind unbegrenzte km inkludiert. Quellen: App-Quotes für Astra, Corsa und 3008 (Mai 2026). Peugeot 308 nutzt die Astra-Tagespakete, hat aber höhere Stunden-/Minutenpreise.",
  },
};

const PROVIDER_ORDER = ["miles", "sixt", "free2move"];

// ----- Formatierung ---------------------------------------------------------

const fmtEUR = n => n.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

// ----- Reine Berechnungsfunktionen ------------------------------------------

const roundKm = km => Math.ceil(km);

// Anzahl angefangener 24-h-Mietetage. Wird für Tages-Aufschläge wie Sixt's
// Smart-Schutz genutzt (minimum 1, auch für sehr kurze Fahrten).
function daysStarted(durationMin) {
  return Math.max(1, Math.ceil(durationMin / 1440));
}

// Berechnet einen optionalen Versicherungs-/Schutz-Aufschlag.
// Priorisierungs-Reihenfolge bei der Auswahl der Hauptkomponente (oben gewinnt):
//   1. flatByTierByClass[tier][class]  — klassen- und tier-abhängige Pauschale (Free2Move 1h/2h/...)
//   2. flatByTier[tier]                — tier-Pauschale klassenunabhängig (Sixt City Flat)
//   3. flatStandard  (nur ctx.kind=standard) — Pauschale für Minutentarif (Free2Move 0,99 €)
//   4. perDayByClass[class] × days     — Tagespaket-Aufschlag, klassenabhängig (Sixt/Free2Move Tagespakete)
//      oder perDay × days              — Fallback ohne Klassen-Differenzierung
//   5. perMinute × durationMin         — Minutenmodell (Sixt-Standard/Stundenpakete ohne Pauschale)
// Zusätzlich (additiv): perKmPackage  — bei gewähltem km-Paket (Sixt 2,49 €).
// Liefert { cost, label, components[] } oder null, wenn nichts greift.
function computeSurcharge(dailySurcharge, durationMin, ctx = {}) {
  if (!dailySurcharge) return null;
  const components = [];
  let cost = 0;

  const flatTierByClass = (ctx.tier && ctx.classKey && dailySurcharge.flatByTierByClass
    && dailySurcharge.flatByTierByClass[ctx.tier])
    ? dailySurcharge.flatByTierByClass[ctx.tier][ctx.classKey]
    : null;
  const flatTier = (ctx.tier && dailySurcharge.flatByTier)
    ? dailySurcharge.flatByTier[ctx.tier]
    : null;
  const flat = flatTierByClass ?? flatTier ?? null;

  if (flat != null) {
    cost += flat;
    components.push({ kind: "flat", tier: ctx.tier, classKey: ctx.classKey, amount: flat });
  } else if (ctx.kind === "standard" && dailySurcharge.flatStandard != null) {
    cost += dailySurcharge.flatStandard;
    components.push({ kind: "flatStandard", amount: dailySurcharge.flatStandard });
  } else if (ctx.kind === "package" && ctx.isFullDayPackage) {
    const perDay = (dailySurcharge.perDayByClass && ctx.classKey && dailySurcharge.perDayByClass[ctx.classKey])
                 || dailySurcharge.perDay
                 || 0;
    if (perDay) {
      // Plus-Schutz/Smart-Schutz bei Tagespaketen richtet sich nach der gebuchten
      // PAKET-Länge, nicht der tatsächlichen Mietdauer. Wer ein 2-Tage-Paket bucht
      // und nur 1h fährt, zahlt trotzdem 2 × perDay.
      const days = ctx.pkgDurationH
        ? Math.max(1, Math.ceil(ctx.pkgDurationH / 24))
        : daysStarted(durationMin);
      const c = days * perDay;
      cost += c;
      components.push({ kind: "day", days, rate: perDay, amount: c });
    }
  } else if (dailySurcharge.perMinute) {
    const c = durationMin * dailySurcharge.perMinute;
    cost += c;
    components.push({ kind: "minute", min: durationMin, rate: dailySurcharge.perMinute, amount: c });
  }

  if (ctx.kmPackageUsed && dailySurcharge.perKmPackage) {
    const c = dailySurcharge.perKmPackage;
    cost += c;
    components.push({ kind: "kmPackage", amount: c });
  }

  if (!components.length) return null;
  return { cost, label: dailySurcharge.label, components };
}

// Standardtarif = Unlock + km × €/km + Parkminuten × €/min + optionaler Tagesaufschlag
// Parkminuten geschätzt: Gesamtdauer − Fahrzeit(km × 2 min, entspricht Ø 30 km/h).
function standardPrice(standard, km, durationMin, options = {}) {
  const billedKm = roundKm(km);
  const inclKm = standard.inclKm || 0;
  const extraKm = Math.max(0, billedKm - inclKm);

  // Zwei Modellierungs-Varianten:
  //
  // (A) MILES/Sixt-Stil (inclKm = 0): Fahrzeit ist in `perKm × km` enthalten
  //     (entweder direkt wie bei MILES, oder via Sixt-Trick `perKm = €/min × 2`).
  //     Park-Minuten = Gesamtdauer − Fahrzeit(km × 2 min, entspricht Ø 30 km/h).
  //
  // (B) Free2Move-Stil (inclKm > 0): Pro-Minuten-Tarif gilt für die GESAMTE Mietdauer
  //     (Fahrt + Stand). km-Kosten gibt es nur für die Extra-km über dem Inklusiv-Kontingent.
  //     Hier wäre der Sixt-Trick falsch, weil er die Fahrzeit doppelt abrechnen würde.
  const useInclusiveModel = inclKm > 0;
  const driveMin = useInclusiveModel ? 0 : billedKm * 2;
  const parkMin = useInclusiveModel ? durationMin : Math.max(0, durationMin - driveMin);
  const kmCost = extraKm * standard.perKm;
  const parkCost = parkMin * standard.parkPerMin;
  const surcharge = computeSurcharge(options.dailySurcharge, durationMin, {
    kind: "standard",
    classKey: options.classKey,
  });
  const surchargeCost = surcharge ? surcharge.cost : 0;
  const raw = standard.unlock + kmCost + parkCost + surchargeCost;
  const price = Math.max(raw, standard.minCharge);
  return {
    kind: "standard",
    applicable: true,
    price,
    breakdown: {
      unlock: standard.unlock,
      billedKm,
      inclKm,
      extraKm,
      perKm: standard.perKm,
      kmCost,
      driveMin,
      parkMin,
      parkPerMin: standard.parkPerMin,
      parkCost,
      surcharge,
      rawTotal: raw,
      clampedToMin: price > raw ? standard.minCharge : null,
    },
  };
}

// Wählt die günstigste km-Abrechnung für eine gegebene km-Distanz:
//   1. Reine Direkt-Abrechnung: km × extraKmPrice (kein Paket-Aufschlag)
//   2. Einzelnes km-Paket, das den Bedarf voll abdeckt (pkg.km >= km)
//   3. Größtes Paket unterhalb des Bedarfs + Direkt-Rest für die restlichen km
// `packageSurcharge` wird in den Vergleich einbezogen (z. B. Sixt 2,49 € km-Paket-
// Aufschlag), aber NICHT in `cost` gespeichert — er wird separat in computeSurcharge
// addiert. Sonst würden Pakete fälschlich gewählt, die ohne den Aufschlag günstig wirken.
// Liefert { cost, label, mode } — label/mode für den Tooltip.
function pickBestKmCharge(km, extraKmPrice, kmPackages, packageSurcharge = 0) {
  const directCost = km * extraKmPrice;
  if (!kmPackages || !kmPackages.length || km <= 0) {
    return { cost: directCost, label: `${km} km × ${extraKmPrice} € (direkt)`, mode: "direct" };
  }

  // Effektive Kosten = reine km-Kosten + Paket-Aufschlag (nur wenn ein Paket gewählt wird).
  // Wir tracken `bestEffective` separat, damit der Aufschlag nicht in `cost` landet.
  let best = { cost: directCost, label: `${km} km × ${extraKmPrice} € (direkt)`, mode: "direct" };
  let bestEffective = directCost;

  for (const pkg of kmPackages) {
    if (pkg.km >= km) {
      const cost = pkg.price;
      const effective = cost + packageSurcharge;
      if (effective < bestEffective) {
        best = { cost, label: `${pkg.km}-km-Paket`, mode: "package", pkg };
        bestEffective = effective;
      }
    } else {
      const rest = (km - pkg.km) * extraKmPrice;
      const cost = pkg.price + rest;
      const effective = cost + packageSurcharge;
      if (effective < bestEffective) {
        best = {
          cost,
          label: `${pkg.km}-km-Paket + ${km - pkg.km} km × ${extraKmPrice} €`,
          mode: "package+rest",
          pkg,
          restKm: km - pkg.km,
        };
        bestEffective = effective;
      }
    }
  }
  return best;
}

// Löst den paketspezifischen Unlock-Aufschlag auf:
//   - undefined/0  → 0
//   - Zahl         → gilt für alle Pakete (Sixt: 0,95 €)
//   - Object       → { amount, excludeFullDay } → entfällt bei pkg.durationH >= 24 (Free2Move GP)
function resolvePackageUnlock(packageUnlock, pkg) {
  if (!packageUnlock) return 0;
  if (typeof packageUnlock === "number") return packageUnlock;
  if (packageUnlock.excludeFullDay && pkg.durationH >= 24) return 0;
  return packageUnlock.amount || 0;
}

// Paket-Tarif = Paketpreis + km-Kosten (siehe pickBestKmCharge) + optionaler Unlock
//              + optionaler Tagesaufschlag (Smart-/Plus-Schutz).
// Nicht anwendbar, wenn Dauer das Paket übersteigt.
// `options`: { kmPackages, packageUnlock, dailySurcharge, classKey } — alle optional.
// Paket-Felder: `pkg.extraKmPrice` überschreibt klassenweites `extraKmPrice`;
//               `pkg.unlimitedKm: true` bedeutet keine Zusatz-km-Kosten (Free2Move 4+ Tage).
function packagePrice(pkg, extraKmPrice, km, durationMin, minCharge, options = {}) {
  if (durationMin > pkg.durationH * 60) {
    return { kind: "package", applicable: false, reason: "Dauer überschreitet Paket", pkg };
  }
  const billedKm = roundKm(km);
  const effectiveExtraKmPrice = pkg.extraKmPrice ?? extraKmPrice;
  const extraKm = pkg.unlimitedKm ? 0 : Math.max(0, billedKm - pkg.inclKm);

  const kmPackageSurcharge = (options.dailySurcharge && options.dailySurcharge.perKmPackage) || 0;
  let kmCharge;
  if (pkg.unlimitedKm) {
    kmCharge = { cost: 0, label: "unbegrenzt km inkl.", mode: "unlimited" };
  } else if (options.kmPackages) {
    kmCharge = pickBestKmCharge(extraKm, effectiveExtraKmPrice, options.kmPackages, kmPackageSurcharge);
  } else {
    kmCharge = { cost: extraKm * effectiveExtraKmPrice, label: null, mode: "direct" };
  }

  const unlock = resolvePackageUnlock(options.packageUnlock, pkg);
  const kmPackageUsed = kmCharge.mode === "package" || kmCharge.mode === "package+rest";
  const surcharge = computeSurcharge(options.dailySurcharge, durationMin, {
    kind: "package",
    tier: pkg.tier,
    classKey: options.classKey,
    pkgDurationH: pkg.durationH,
    isFullDayPackage: pkg.durationH >= 24,
    kmPackageUsed,
  });
  const surchargeCost = surcharge ? surcharge.cost : 0;
  const raw = pkg.price + kmCharge.cost + unlock + surchargeCost;
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
      unlimitedKm: !!pkg.unlimitedKm,
      billedKm,
      extraKm,
      extraKmPrice: effectiveExtraKmPrice,
      extraKmCost: kmCharge.cost,
      kmChargeLabel: kmCharge.label,
      kmChargeMode: kmCharge.mode,
      unlock,
      surcharge,
      rawTotal: raw,
      clampedToMin: price > raw ? minCharge : null,
    },
  };
}

// Alle Optionen einer Klasse (Standard + Pakete) mit Pass-Optimierung.
// Pro Dauer-Tier wird die günstigste km-Variante des Tiers ausgewählt.
function classOptions(provider, classKey, km, durationMin) {
  const t = provider.tariffs[classKey];

  // Klasse explizit als "nicht verfügbar" markiert (z. B. Free2Move XL).
  if (!t || t.unavailable) {
    return {
      classKey,
      label: t ? t.label : classKey,
      description: t ? t.description : "nicht verfügbar",
      nativeLabel: t ? t.nativeLabel : null,
      unavailable: true,
      standard: null,
      cellByTier: {},
      best: null,
      maxPkgH: 0,
    };
  }

  // Standardtarif: oberhalb der Provider-Schwelle als nicht anwendbar markieren.
  const standard = standardPrice(t.standard, km, durationMin, {
    dailySurcharge: provider.dailySurcharge,
    classKey,
  });
  if (durationMin > provider.standardMaxDurationMin) {
    standard.applicable = false;
    standard.reason = "Minutentarif nur für Kurzzeitmieten (≤ 24 h) sinnvoll";
  }
  standard.optimized = standard.applicable ? optimizeWithPass(standard, t.standard, provider.passes) : null;

  // Beste km-Variante pro Dauer-Tier.
  const pkgOptions = {
    kmPackages: t.kmPackages,
    packageUnlock: provider.packageUnlock || 0,
    dailySurcharge: provider.dailySurcharge,
    classKey,
  };
  const cellByTier = {};
  for (const tier of provider.packageColumns) {
    const candidates = t.packages.filter(p => p.tier === tier);
    let bestForTier = null;
    for (const pkg of candidates) {
      const calc = packagePrice(pkg, t.extraKmPrice, km, durationMin, t.standard.minCharge, pkgOptions);
      if (!calc.applicable) continue;
      calc.optimized = optimizeWithPass(calc, t.standard, provider.passes);
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

  const maxPkgH = t.packages.length ? Math.max(...t.packages.map(p => p.durationH)) : 0;

  return {
    classKey,
    label: t.label,
    description: t.description,
    nativeLabel: t.nativeLabel,
    unavailable: false,
    standard,
    cellByTier,
    best,
    maxPkgH,
  };
}

// Alle Klassen eines Providers. Winner = Klasse mit niedrigstem optimiertem Bestpreis.
function allOptions(provider, km, durationMin) {
  const classes = CLASS_ORDER.map(k => classOptions(provider, k, km, durationMin));
  const winner = classes.reduce((a, b) => {
    if (!a || !a.best) return b;
    if (!b.best) return a;
    return a.best.optimized.finalPrice <= b.best.optimized.finalPrice ? a : b;
  }, null);
  return { provider, classes, winner };
}

// Anbieterübergreifender Bestpreis. Liefert das Tripel mit dem niedrigsten finalPrice
// über alle Provider, oder null wenn keiner ein anwendbares Angebot hat.
function bestOverallOption(km, durationMin) {
  let winner = null; // { provider, classObj, option }
  for (const pid of PROVIDER_ORDER) {
    const provider = PROVIDERS[pid];
    const { classes } = allOptions(provider, km, durationMin);
    for (const classObj of classes) {
      if (!classObj.best) continue;
      const candidate = { provider, classObj, option: classObj.best };
      if (!winner || candidate.option.optimized.finalPrice < winner.option.optimized.finalPrice) {
        winner = candidate;
      }
    }
  }
  return winner;
}

// Optimale Einzelfahrt-Kosten: Basispreis vs. Pass-für-diesen-Monat.
// User-Modell (für MILES-Pässe): zu Monatsbeginn Pass buchen, Fahrt machen, vor Auto-Renew
// kündigen. Volle Monatsgebühr wird dieser einen Fahrt zugeschrieben, Guthaben absorbiert
// den Trippreis bis zu seiner Höhe.
// Bei Providern ohne Pass-Modell (passes = PASSES_NONE) bleibt der Basispreis stehen.
function optimizeWithPass(option, standardTariff, passes) {
  if (!option || !option.applicable) return null;
  // Ausgangspunkt: ohne Pass
  let best = {
    pass: passes[0],
    finalPrice: option.price,
    discountedTrip: option.price,
    passOverhead: 0,
    creditUsed: 0,
    savings: 0,
  };
  for (let i = 1; i < passes.length; i++) {
    const pass = passes[i];
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

function appendSurchargeParts(parts, surcharge) {
  if (!surcharge) return;
  for (const c of surcharge.components) {
    if (c.kind === "flat") {
      const classSuffix = c.classKey ? `, ${c.classKey}` : "";
      parts.push(`${surcharge.label} (${c.tier}${classSuffix}-Pauschale) ${fmtEUR(c.amount)}`);
    } else if (c.kind === "flatStandard") {
      parts.push(`${surcharge.label} (Minutentarif-Pauschale) ${fmtEUR(c.amount)}`);
    } else if (c.kind === "day") {
      parts.push(`${surcharge.label} ${c.days} × ${fmtEUR(c.rate)} = ${fmtEUR(c.amount)}`);
    } else if (c.kind === "minute") {
      parts.push(`${surcharge.label} ${c.min} min × ${fmtEUR(c.rate)} = ${fmtEUR(c.amount)}`);
    } else if (c.kind === "kmPackage") {
      parts.push(`${surcharge.label} km-Paket-Aufschlag ${fmtEUR(c.amount)}`);
    }
  }
}

function breakdownText(option, provider, classObj) {
  if (!option || !option.applicable) return "";
  const b = option.breakdown;
  let baseText;
  if (option.kind === "standard") {
    const parts = [
      `Entsperrung ${fmtEUR(b.unlock)}`,
    ];
    // Bei Inklusiv-km im Minutentarif zeigen wir die Aufteilung explizit.
    if (b.inclKm > 0) {
      if (b.extraKm > 0) {
        parts.push(`${b.inclKm} km inkl. + ${b.extraKm} km × ${fmtEUR(b.perKm)} = ${fmtEUR(b.kmCost)}`);
      } else {
        parts.push(`${b.billedKm} km (innerhalb ${b.inclKm} km inkl.) = 0,00 €`);
      }
    } else {
      parts.push(`${b.billedKm} km × ${fmtEUR(b.perKm)} = ${fmtEUR(b.kmCost)}`);
    }
    parts.push(`${b.parkMin} Parkmin × ${fmtEUR(b.parkPerMin)} = ${fmtEUR(b.parkCost)}`);
    appendSurchargeParts(parts, b.surcharge);
    baseText = parts.join(" + ") + ` = ${fmtEUR(b.rawTotal)}`;
  } else {
    const parts = [];
    let inclSuffix = "";
    if (b.unlimitedKm) inclSuffix = " (unbegrenzt km inkl.)";
    else if (b.inclKm > 0) inclSuffix = ` (inkl. ${b.inclKm} km)`;
    parts.push(`${b.packageLabel} ${fmtEUR(b.packageBase)}${inclSuffix}`);
    if (b.extraKm > 0 && !b.unlimitedKm) {
      const kmLabel = b.kmChargeLabel || `${b.extraKm} km × ${fmtEUR(b.extraKmPrice)}`;
      parts.push(`${kmLabel} = ${fmtEUR(b.extraKmCost)}`);
    }
    if (b.unlock && b.unlock > 0) {
      parts.push(`Entsperrung ${fmtEUR(b.unlock)}`);
    }
    appendSurchargeParts(parts, b.surcharge);
    baseText = parts.join(" + ") + ` = ${fmtEUR(b.rawTotal)}`;
  }
  if (b.clampedToMin != null) baseText += ` · Mindestbetrag ${fmtEUR(b.clampedToMin)}`;

  const opt = option.optimized;
  const header = provider
    ? `Anbieter: ${provider.label}${classObj && classObj.nativeLabel ? ` (${classObj.nativeLabel})` : ""}\n`
    : "";

  const isCredit = opt?.pass.kind === "credit";
  if (!opt || opt.pass.id === "none") {
    return `${header}${isCredit ? "Ohne Guthaben-Kauf" : "Ohne Pass"}: ${baseText}`;
  }
  if (isCredit) {
    const creditLine = `Mit ${opt.pass.label} (${fmtEUR(opt.pass.monthly)} Kauf, ${fmtEUR(opt.pass.credit)} Guthaben):`;
    const remainder = opt.finalPrice - opt.passOverhead;
    const calc = `${fmtEUR(opt.discountedTrip)} − ${fmtEUR(opt.creditUsed)} Guthaben = ${fmtEUR(remainder)} + ${fmtEUR(opt.passOverhead)} Kauf = ${fmtEUR(opt.finalPrice)}`;
    const saved = `Ersparnis ggü. ohne Guthaben-Kauf: ${fmtEUR(opt.savings)}`;
    return `${header}${baseText}\n\n${creditLine}\n${calc}\n${saved}`;
  }
  const passLine = `Mit ${opt.pass.label}-Pass (${fmtEUR(opt.pass.monthly)}/Mo, ${fmtEUR(opt.pass.credit)} Guthaben):`;
  const calc = `${fmtEUR(opt.discountedTrip)} rabattiert + ${fmtEUR(opt.passOverhead)} Abo − ${fmtEUR(opt.creditUsed)} Guthaben = ${fmtEUR(opt.finalPrice)}`;
  const saved = `Ersparnis ggü. ohne Pass: ${fmtEUR(opt.savings)}`;
  return `${header}${baseText}\n\n${passLine}\n${calc}\n${saved}`;
}

// Aktiver Tab — wird zwischen Re-Renders gehalten, damit der User beim Tippen
// nicht aus seinem Tab geworfen wird.
let activeProviderId = "miles";

function renderEmpty() {
  document.getElementById("provider-tabs").innerHTML = "";
  document.getElementById("provider-panels").innerHTML = "";
  document.getElementById("best-overall").hidden = true;
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

  // Pro Provider eine Auswertung berechnen + Best-Overall ermitteln.
  const perProvider = PROVIDER_ORDER.map(pid => allOptions(PROVIDERS[pid], km, durationMin));
  const overall = bestOverallOption(km, durationMin);

  renderBestOverall(overall);
  renderTabs();
  renderPanels(perProvider);
}

function renderBestOverall(overall) {
  const card = document.getElementById("best-overall");
  if (!overall) {
    card.hidden = true;
    return;
  }
  const { provider, classObj, option } = overall;
  card.hidden = false;
  card.className = `best-overall-card ${provider.brandClass}`;

  document.getElementById("best-provider").textContent = provider.label;
  document.getElementById("best-price").textContent = fmtEUR(option.optimized.finalPrice);

  const detail = document.getElementById("best-detail");
  const pkgPart = option.kind === "package" ? ` · ${option.pkg.label}` : " · Minutentarif";
  const passPart = (() => {
    const opt = option.optimized;
    if (!opt || opt.pass.id === "none") return "";
    return opt.pass.kind === "credit"
      ? ` · mit ${opt.pass.label} (−${fmtEUR(opt.savings)})`
      : ` · mit ${opt.pass.label}-Pass (−${fmtEUR(opt.savings)})`;
  })();
  detail.textContent = `Klasse ${classObj.label} (${classObj.description})${pkgPart}${passPart}`;
}

function renderTabs() {
  const tabs = document.getElementById("provider-tabs");
  tabs.innerHTML = "";
  for (const pid of PROVIDER_ORDER) {
    const provider = PROVIDERS[pid];
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `tab-btn ${provider.brandClass}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-selected", pid === activeProviderId ? "true" : "false");
    btn.dataset.provider = pid;
    btn.textContent = provider.label;
    btn.addEventListener("click", () => {
      activeProviderId = pid;
      // Tabs + Panels nur umschalten, nicht neu berechnen.
      for (const b of tabs.querySelectorAll(".tab-btn")) {
        b.setAttribute("aria-selected", b.dataset.provider === pid ? "true" : "false");
      }
      const panels = document.getElementById("provider-panels");
      for (const p of panels.querySelectorAll(".provider-panel")) {
        p.hidden = p.dataset.provider !== pid;
      }
    });
    tabs.appendChild(btn);
  }
}

function renderPanels(perProvider) {
  const panels = document.getElementById("provider-panels");
  panels.innerHTML = "";

  for (const result of perProvider) {
    const { provider, classes } = result;
    const panel = document.createElement("div");
    panel.className = `provider-panel ${provider.brandClass}`;
    panel.dataset.provider = provider.id;
    panel.setAttribute("role", "tabpanel");
    panel.hidden = provider.id !== activeProviderId;

    if (provider.note) {
      const note = document.createElement("p");
      note.className = "provider-note";
      note.textContent = provider.note;
      panel.appendChild(note);
    }

    const wrapper = document.createElement("div");
    wrapper.className = "table-wrapper";
    const table = document.createElement("table");
    table.className = "results-table";

    // Dynamischer Header je nach packageColumns des Providers
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.appendChild(makeTh("Klasse"));
    headRow.appendChild(makeTh("Standard", "min/km/park"));
    for (const tier of provider.packageColumns) {
      headRow.appendChild(makeTh(tier));
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    // Body: eine Zeile pro Klasse
    const tbody = document.createElement("tbody");
    for (const cls of classes) {
      const row = document.createElement("tr");

      const head = document.createElement("th");
      head.scope = "row";
      let headContent = `<span class="cls-label">${cls.label}</span><span class="cls-desc">${cls.description}</span>`;
      if (cls.unavailable) {
        headContent += `<span class="cls-hint">Anbieter hat keine Fahrzeuge dieser Klasse</span>`;
      } else if (!cls.best) {
        headContent += `<span class="cls-hint">nicht verfügbar für diese Dauer</span>`;
      }
      head.innerHTML = headContent;
      row.appendChild(head);

      if (cls.unavailable) {
        // Eine breite "—"-Zelle über Standard + alle Tier-Spalten.
        const td = document.createElement("td");
        td.className = "cell cell-na";
        td.colSpan = 1 + provider.packageColumns.length;
        td.textContent = "—";
        td.title = cls.nativeLabel || "Klasse nicht verfügbar";
        row.appendChild(td);
      } else {
        row.appendChild(buildCell(cls.standard, cls.best, provider, cls));
        for (const tier of provider.packageColumns) {
          const opt = cls.cellByTier[tier];
          if (!opt) {
            const td = document.createElement("td");
            td.className = "cell cell-na";
            td.textContent = "—";
            td.title = "Kein Paket dieser Klasse für diese Dauer verfügbar.";
            row.appendChild(td);
            continue;
          }
          row.appendChild(buildCell(opt, cls.best, provider, cls));
        }
      }
      tbody.appendChild(row);
    }
    table.appendChild(tbody);
    wrapper.appendChild(table);
    panel.appendChild(wrapper);
    panels.appendChild(panel);
  }
}

function makeTh(label, sub) {
  const th = document.createElement("th");
  th.scope = "col";
  th.innerHTML = sub
    ? `${label}<br><span class="col-sub">${sub}</span>`
    : label;
  return th;
}

function buildCell(option, bestOfClass, provider, classObj) {
  const td = document.createElement("td");
  td.className = "cell";
  if (!option || !option.applicable) {
    td.textContent = "—";
    td.classList.add("cell-na");
    td.title = option && option.reason ? option.reason : "Nicht anwendbar";
    return td;
  }
  const opt = option.optimized;
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
  td.title = breakdownText(option, provider, classObj);
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
  PROVIDERS, PROVIDER_ORDER, CLASS_ORDER,
  roundKm, standardPrice, packagePrice,
  classOptions, allOptions, optimizeWithPass, bestOverallOption,
};

if (typeof window !== "undefined") window.MilesCalc = API;
if (typeof module !== "undefined" && module.exports) module.exports = API;
