# Köplägesrobot — hittar undervärderade aktier med köplägen

`koplagen.py` är en robot som varje dag screenar ett universum av svenska och
amerikanska aktier, rankar dem efter hur **undervärderade** de ser ut och hur
bra **timingen** (köpläget) är just nu, och låter Claude skriva konkreta köpcase.

Detta kompletterar `aktieanalys.py`, som bevakar din fasta portfölj. Köplägesroboten
letar i stället brett efter *nya* möjligheter.

## Så här fungerar den

För varje bolag hämtas via `yfinance`:

**Fundamentala nyckeltal (värdering — 60 % av totalpoängen):**
| Nyckeltal        | Vikt  | Belönar |
|------------------|-------|---------|
| P/E              | 20 %  | Låg vinstmultipel |
| PEG              | 15 %  | Låg multipel i förhållande till tillväxt |
| EV/EBITDA        | 15 %  | Låg rörelsevärdering |
| Analytikerpotential | 14 % | Hög uppsida mot snittriktkurs |
| P/B              | 12 %  | Lågt pris mot eget kapital |
| ROE              | 12 %  | Hög lönsamhet (kvalitet) |
| Direktavkastning | 6 %   | Utdelning |
| Skuld/EK         | 6 %   | Låg skuldsättning |

**Tekniska signaler (timing — 40 % av totalpoängen):**
- **RSI(14):** under 30 = översåld, ett klassiskt köpläge
- **Rabatt mot 52-veckorstopp:** stor rabatt = mer potentiell uppsida
- **Läge mot glidande medel:** en dip under MA50 men över MA200 i en uppåttrend
  är ett starkt köpläge

Varje bolag får en **totalpoäng 0–100** och ett betyg:
`🟢 Starkt köpläge` · `🟢 Köpläge` · `🟡 Bevaka` · `🟡 Neutral` · `🔴 Avvakta`

De högst rankade skickas till Claude som skriver köpcase med föreslagen
ingångskurs, riktkurs, uppsida och den största risken (värdefälle-varning).

## Installation

```bash
pip install -r requirements.txt
export ANTHROPIC_API_KEY="sk-ant-..."   # valfritt — utan den skrivs en ren datarapport
```

## Kör

```bash
python3 koplagen.py                 # topp 6 köplägen, committar + pushar
python3 koplagen.py --skip-git      # kör utan git
python3 koplagen.py --top 10        # visa fler kandidater
python3 koplagen.py --min-score 55  # bara bolag över 55 i totalpoäng
```

Rapporten sparas som `projects/egna/aktieanalys/koplagen/YYYY-MM-DD.md`.

## Automatisera (varje vardag kl 18:00)

```bash
crontab -e
# Lägg till:
0 18 * * 1-5 cd /sökväg/till/repon/projects/egna/aktieanalys/scripts && python3 koplagen.py >> ~/koplagen.log 2>&1
```

## Anpassa

- **Universum:** redigera `UNIVERSE`-listan högst upp i `koplagen.py`.
- **Vikter/trösklar:** justera `_val_score_*`-funktionerna och vikterna i
  `value_score` / `timing_score`.
- **Branch för push:** sätt miljövariabeln `KOPLAGEN_BRANCH` (default `main`).

## Viktigt

Roboten är ett *researchverktyg*, inte finansiell rådgivning. Nyckeltal från
yfinance kan vara fördröjda eller ofullständiga, och en låg värdering kan vara
befogad (värdefälla). Gör alltid egen research innan du köper.
