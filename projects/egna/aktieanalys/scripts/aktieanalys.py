#!/usr/bin/env python3
"""
Daglig aktieanalys-agent
Kör med: python3 aktieanalys.py
Kräver: pip install yfinance anthropic
Kräver env-variabel: ANTHROPIC_API_KEY
"""

import os
import sys
import subprocess
from datetime import datetime, date
import yfinance as yf
import anthropic

# ── Konfiguration ────────────────────────────────────────────────────────────

PORTFOLIO = {
    "MU":        "Micron Technology",
    "MRVL":      "Marvell Technology",
    "MSFT":      "Microsoft",
    "AMD":        "AMD",
    "NOW":       "ServiceNow",
    "ABB.ST":    "ABB",
    "INVE-B.ST": "Investor B",
    "ASML":      "ASML Holding",
    "ATCO-B.ST": "Atlas Copco B",
    "EQT.ST":    "EQT",
    "SYNACT.ST": "Synact Pharma",
}

INDICES = {
    "^GSPC":   "S&P 500",
    "^IXIC":   "NASDAQ Composite",
    "^OMX":    "OMX Stockholm 30",
    "EURUSD=X":"EUR/USD",
    "SEK=X":   "USD/SEK",
    "^TNX":    "10-årig US ränta (%)",
    "BZ=F":    "Brent Olja (USD)",
}

# Aktier att screena för "Dagens Vinnare" (utanför portföljen)
VINNARE_UNIVERSE = [
    "NVDA", "TSM", "AVGO", "ARM", "QCOM", "LRCX", "AMAT", "KLAC",
    "CRM", "SNOW", "PLTR", "NET", "DDOG", "MDB", "CRWD",
    "GEHC", "LLY", "NVO", "ISRG",
    "ERIC-B.ST", "SAND.ST", "VOLV-B.ST", "SEB-A.ST", "SWED-A.ST",
    "HEXA-B.ST", "ALIV-SDB.ST", "HUSQ-B.ST", "TELIA.ST",
]

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
OUTPUT_DIR = os.path.join(REPO_ROOT, "projects/egna/aktieanalys/dagliga")

# ── Datahämtning ─────────────────────────────────────────────────────────────

def fetch_stock(ticker: str) -> dict | None:
    """Hämtar kurs, daglig/veckovis förändring och nyheter för en aktie."""
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="7d")
        if len(hist) < 2:
            return None

        price     = hist["Close"].iloc[-1]
        prev      = hist["Close"].iloc[-2]
        day_chg   = (price - prev) / prev * 100
        week_chg  = (price - hist["Close"].iloc[0]) / hist["Close"].iloc[0] * 100

        news_items = []
        for n in (t.news or [])[:3]:
            title = n.get("content", {}).get("title") or n.get("title", "")
            if title:
                news_items.append(title)

        currency = "SEK" if ticker.endswith(".ST") else "USD"

        return {
            "ticker":    ticker,
            "price":     price,
            "day_chg":   day_chg,
            "week_chg":  week_chg,
            "currency":  currency,
            "news":      news_items,
        }
    except Exception as e:
        print(f"  Varning: kunde inte hämta {ticker}: {e}", file=sys.stderr)
        return None


def fetch_index(ticker: str) -> dict | None:
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period="2d")
        if len(hist) < 2:
            return None
        price   = hist["Close"].iloc[-1]
        prev    = hist["Close"].iloc[-2]
        day_chg = (price - prev) / prev * 100
        return {"price": price, "day_chg": day_chg}
    except:
        return None


def screen_vinnare(universe: list[str]) -> tuple[str, dict] | None:
    """Väljer dagens vinnare baserat på momentum + nyhetsvolym."""
    candidates = []
    for ticker in universe:
        data = fetch_stock(ticker)
        if data and len(data["news"]) > 0:
            score = data["day_chg"] + (len(data["news"]) * 0.5)
            candidates.append((ticker, data, score))

    if not candidates:
        return None
    candidates.sort(key=lambda x: x[2], reverse=True)
    best = candidates[0]
    return best[0], best[1]

# ── Formatering ───────────────────────────────────────────────────────────────

def fmt(val: float, decimals: int = 2) -> str:
    return f"{val:.{decimals}f}"

def fmt_chg(pct: float) -> str:
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.2f}%"

def fmt_price(data: dict) -> str:
    return f"{fmt(data['price'])} {data['currency']}"

# ── Rapportgenerering med Claude ──────────────────────────────────────────────

def generate_report(today: str) -> str:
    print("Hämtar portföljdata...")
    portfolio_data = {}
    for ticker, name in PORTFOLIO.items():
        print(f"  {ticker}...", end=" ", flush=True)
        d = fetch_stock(ticker)
        portfolio_data[ticker] = (name, d)
        print("ok" if d else "saknas")

    print("\nHämtar indexdata...")
    index_data = {}
    for ticker, name in INDICES.items():
        d = fetch_index(ticker)
        index_data[ticker] = (name, d)

    print("\nSöker Dagens Vinnare...")
    vinnare_result = screen_vinnare(VINNARE_UNIVERSE)

    # ── Bygg datablocket som skickas till Claude ──────────────────────────────
    data_block = f"DATUM: {today}\n\n"

    data_block += "MARKNADSINDEX:\n"
    for ticker, (name, d) in index_data.items():
        if d:
            data_block += f"  {name}: {fmt(d['price'], 2)} ({fmt_chg(d['day_chg'])})\n"
        else:
            data_block += f"  {name}: data saknas\n"

    data_block += "\nPORTFÖLJDATA:\n"
    for ticker, (name, d) in portfolio_data.items():
        if d:
            data_block += (
                f"  {name} ({ticker}): "
                f"kurs={fmt_price(d)}, dag={fmt_chg(d['day_chg'])}, "
                f"vecka={fmt_chg(d['week_chg'])}\n"
            )
            for headline in d["news"]:
                data_block += f"    - {headline}\n"
        else:
            data_block += f"  {name} ({ticker}): data saknas\n"

    if vinnare_result:
        v_ticker, v_data = vinnare_result
        data_block += f"\nDAGENS VINNARE KANDIDAT: {v_ticker}\n"
        data_block += f"  kurs={fmt_price(v_data)}, dag={fmt_chg(v_data['day_chg'])}\n"
        for headline in v_data["news"]:
            data_block += f"  - {headline}\n"

    # ── Anropa Claude ─────────────────────────────────────────────────────────
    print("\nGenererar analys med Claude...")
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("ANTHROPIC_API_KEY saknas — skriver rapport med rådata.", file=sys.stderr)
        return build_raw_report(today, portfolio_data, index_data, vinnare_result)

    client = anthropic.Anthropic(api_key=api_key)

    system_prompt = """Du är en erfaren aktieanalytiker. Du skriver dagliga analysrapporter på svenska.
Skriv konkret, faktabaserat och kortfattat. Använd siffrorna du fått.
Undvik tomma fraser. Ge faktiska riktkurser, procentsatser och händelser där det finns data.
Formatera rapporten i Markdown."""

    user_prompt = f"""Skriv en komplett daglig aktieanalysrapport baserad på följande data:

{data_block}

Rapporten ska innehålla dessa sektioner i exakt denna ordning, på svenska:

# Daglig Aktieanalys — {today}

## Sammanfattning
(2-3 meningar om dagens marknadsstämning baserat på data. Ange om stämningen är Bullish/Neutral/Bearish)

## Makro & Marknad
(Tabell med index + kort kommentar om makrohändelser som syns i data)

## Portföljöversikt
(Tabell: Bolag | Ticker | Kurs | Dag % | Vecka % | Kommentar)

## Bolagsanalyser
(En kortfattad sektion per bolag med kurs, rörelse och nyhetsrubrik. 3-5 meningar per bolag.)

## ⭐ Dagens Vinnare
(Välj EN aktie utanför portföljen som du tror kan prestera starkt idag baserat på data + nyheter.
Motivera med konkreta argument. Inkludera ticker, kurs och varför just nu.)

## Slutsats & Åtgärder
(Bullet-lista med 3-4 konkreta åtgärder/saker att bevaka)

---
*Rapporten är informativ och utgör inte finansiell rådgivning.*"""

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4096,
        messages=[{"role": "user", "content": user_prompt}],
        system=system_prompt,
    )

    return message.content[0].text


def build_raw_report(today, portfolio_data, index_data, vinnare_result) -> str:
    """Fallback: ren datarapport utan Claude-analys."""
    lines = [f"# Daglig Aktieanalys — {today}\n"]
    lines.append("## Makro & Marknad\n")
    lines.append("| Indikator | Värde | Dag % |")
    lines.append("|-----------|-------|-------|")
    for ticker, (name, d) in index_data.items():
        if d:
            lines.append(f"| {name} | {fmt(d['price'],2)} | {fmt_chg(d['day_chg'])} |")
    lines.append("")

    lines.append("## Portföljöversikt\n")
    lines.append("| Bolag | Ticker | Kurs | Dag % | Vecka % |")
    lines.append("|-------|--------|------|-------|---------|")
    for ticker, (name, d) in portfolio_data.items():
        if d:
            lines.append(f"| {name} | {ticker} | {fmt_price(d)} | {fmt_chg(d['day_chg'])} | {fmt_chg(d['week_chg'])} |")
        else:
            lines.append(f"| {name} | {ticker} | — | — | — |")
    lines.append("")

    if vinnare_result:
        v_ticker, v_data = vinnare_result
        lines.append(f"## ⭐ Dagens Vinnare — {v_ticker}\n")
        lines.append(f"Kurs: {fmt_price(v_data)} | Dag: {fmt_chg(v_data['day_chg'])}\n")
        for h in v_data["news"]:
            lines.append(f"- {h}")

    lines.append("\n---\n*Rapporten är informativ och utgör inte finansiell rådgivning.*")
    return "\n".join(lines)

# ── Git-operationer ───────────────────────────────────────────────────────────

def git_commit_push(filepath: str, today: str):
    print("\nCommittar och pushar...")
    try:
        subprocess.run(["git", "add", filepath], cwd=REPO_ROOT, check=True)
        subprocess.run(
            ["git", "commit", "-m", f"Daglig aktieanalys {today}"],
            cwd=REPO_ROOT, check=True
        )
        subprocess.run(
            ["git", "push", "-u", "origin", "main"],
            cwd=REPO_ROOT, check=True
        )
        print("✓ Pushad till origin/main")
    except subprocess.CalledProcessError as e:
        print(f"Git-fel: {e}", file=sys.stderr)

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    skip_git = "--skip-git" in sys.argv
    today = date.today().strftime("%Y-%m-%d")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, f"{today}.md")

    if os.path.exists(output_path):
        print(f"Rapport för {today} finns redan: {output_path}")
        sys.exit(0)

    report = generate_report(today)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\n✓ Rapport sparad: {output_path}")

    if not skip_git:
        git_commit_push(output_path, today)


if __name__ == "__main__":
    main()
