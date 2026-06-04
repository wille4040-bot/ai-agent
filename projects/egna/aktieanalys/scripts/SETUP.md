# Setup — Daglig aktieanalys

## 1. Installera beroenden
```bash
pip install -r requirements.txt
```

## 2. Sätt din Anthropic API-nyckel
```bash
# Mac/Linux — lägg i ~/.zshrc eller ~/.bashrc
export ANTHROPIC_API_KEY="sk-ant-..."

# Windows (PowerShell)
$env:ANTHROPIC_API_KEY="sk-ant-..."
```

## 3. Konfigurera git remote (om inte redan gjort)
```bash
cd /sökväg/till/repon
git remote add origin https://github.com/DITTNAMN/aktieanalys.git
git push -u origin main
```

## 4. Kör rapporten
```bash
python3 aktieanalys.py
```

## 5. Automatisera med cron (Mac/Linux)
Kör varje vardag kl 17:30 (efter Stockholmsbörsen stängt):
```bash
crontab -e
# Lägg till:
30 17 * * 1-5 cd /sökväg/till/repon/projects/egna/aktieanalys/scripts && python3 aktieanalys.py >> ~/aktieanalys.log 2>&1
```

## Vad skriptet gör
1. Hämtar realtidskurser för alla 11 innehav via yfinance
2. Hämtar nyhetsrubriker per aktie
3. Screener ett universum av ~25 aktier för "Dagens Vinnare" (momentum + nyheter)
4. Skickar all data till Claude Opus som skriver analystexterna på svenska
5. Sparar rapporten som `dagliga/YYYY-MM-DD.md`
6. Git commit + push till origin/main
