# Car-Sharing Preisrechner

Vergleicht **MILES**, **Sixt share** und **Free2Move** für eine gegebene Strecke und Mietdauer — inklusive automatischer MILES-Pass-Optimierung. Anbieterübergreifender Bestpreis wird prominent oben angezeigt, Detail-Tabellen pro Anbieter in Tabs darunter.

**Live:** [tools.maxlamm.de/miles-calc](https://tools.maxlamm.de/miles-calc/)

---

## Was der Rechner macht

- Eingabe: Entfernung (km, manuell oder via Routenrechner) und Mietdauer (Datums-Picker)
- Berechnet pro Anbieter den günstigsten Preis für jede Fahrzeugklasse über alle verfügbaren Zeitpakete
- Bei MILES: prüft automatisch, ob ein Pass (Silber, Gold, Platin, Black) die Fahrt günstiger macht — Annahme: Pass nur für diesen Monat gebucht, danach gekündigt
- Bei Sixt share: rechnet automatisch Smart-Schutz (klassenabhängige Vollkasko-Pauschale) plus 0,95 € Unlock plus das günstigste km-Paket (50–750 km) oder Direkt-Abrechnung
- Bei Free2Move: rechnet automatisch Plus-Schutz (klassen- und tier-abhängig) plus 0,99 € GP-Gebühr (nur bei Sub-Tag-Mieten), wählt unter mehreren Tagespaket-Varianten (60/125/200 km bei 1 Tag etc.) die günstigste Kombination
- Best-Price-Card oben zeigt den anbieterübergreifenden Gesamtsieger
- Tooltip auf jeder Zelle zeigt die vollständige Rechnung (Basispreis, Extrakilometer, Rabatt/Versicherung, Guthaben)

## Anbieter & Fahrzeugklassen

Alle drei Anbieter werden auf das gemeinsame Schema S / M / L / XL gemappt. Die originale Fahrzeugkategorie steht im Tooltip jeder Klasse.

| Klasse | MILES | Sixt share (PK) | Free2Move |
|--------|-------|------------------|-----------|
| S  | Kleinwagen | PK 1: Mini (Fiat 500) | Opel Corsa, Citroën C3 |
| M  | Mittelklasse | PK 3: Mid (BMW 1er) | Opel Astra, Citroën C4, Crossland, Peugeot 308 |
| L  | Transporter | PK 4: Premium (Audi A3, BMW X1) | Peugeot 3008 |
| XL | Großer Transporter | PK 5: Van (BMW 5er) | — (nicht angeboten) |

### Datenquellen

| Anbieter | Status | Quelle |
|----------|--------|--------|
| MILES | offizielle Tarife inkl. Pass-Modell (Silber/Gold/Platin/Black) | miles-mobility.com |
| Sixt share | App-bestätigte Werte für M und L (Audi A3), interpolierte Werte für S/XL | App-Quotes Mai 2026 + sixt.de/share/tarife |
| Free2Move | App-bestätigte Werte für S (Corsa), M (Astra), L (3008) | App-Quotes Mai 2026 |

> **Hinweis:** Alle Preise sind „ab"-Preise und können je nach Verfügbarkeit dynamisch variieren. Versicherungs-Aufschläge (Smart-Schutz, Plus-Schutz) sind immer aktiv mitgerechnet, damit der Vergleich Apples-to-Apples ist. Pflegestelle für Tarif-Updates: `calculator.js` (Blöcke `TARIFFS_MILES`, `TARIFFS_SIXT`, `TARIFFS_FREE2MOVE`).

## Lokal nutzen

Keine Build-Schritte, keine Abhängigkeiten.

```bash
git clone https://github.com/Max-Lamm/miles-calc.git
cd miles-calc
open index.html   # oder einfach index.html im Browser öffnen
```

## Deployment

```bash
bash deploy.sh
```

Synchronisiert `index.html`, `styles.css` und `calculator.js` per rsync auf den Uberspace-Server.

---

> Richtwerte ohne Gewähr. Offizielle Preise in der [MILES App](https://www.miles-mobility.com/). Kein Bezug zur MILES Mobility GmbH.
