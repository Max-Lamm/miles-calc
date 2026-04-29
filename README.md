# MILES Preisrechner

Vergleicht alle MILES-Tarife (Klassen S, M, L, XL) für eine gegebene Strecke und Mietdauer – inklusive automatischer Pass-Optimierung.

**Live:** [tools.maxlamm.de/miles-calc](https://tools.maxlamm.de/miles-calc/)

---

## Was der Rechner macht

- Gibt Entfernung (km) und Mietdauer ein (Minuten / Stunden / Tage)
- Berechnet den günstigsten Preis für jede Fahrzeugklasse über alle verfügbaren Zeitpakete (3h bis 9 Tage)
- Prüft automatisch, ob ein MILES Pass (Silber, Gold, Platin, Black) die Fahrt günstiger macht – unter der Annahme, dass der Pass nur für diesen Monat gebucht und danach gekündigt wird
- Tooltip auf jeder Zelle zeigt die vollständige Rechnung (Basispreis, Extrakilometer, Rabatt, Guthaben)

## Fahrzeugklassen

| Klasse | Typ              |
|--------|------------------|
| S      | Kleinwagen       |
| M      | Mittelklasse     |
| L      | Transporter      |
| XL     | Großer Transporter |

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
