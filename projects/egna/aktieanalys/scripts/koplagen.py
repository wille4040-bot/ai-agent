#!/usr/bin/env python3
"""
Köplägesrobot — hittar undervärderade aktier med köplägen.

Roboten screenar ett universum av aktier, hämtar fundamentala nyckeltal
(P/E, P/B, PEG, EV/EBITDA, direktavkastning, ROE, skuldsättning, tillväxt,
analytikerriktkurs) och tekniska signaler (RSI, avstånd till glidande medel,
rabatt mot 52-veckorstopp). Varje bolag får en värderingspoäng och en
timingpoäng. De högst rankade skickas till Claude som skriver köpcase på
svenska.

Kör med:  python3 koplagen.py
Kräver:   pip install -r requirements.txt   (yfinance, anthropic)
Miljö:    ANTHROPIC_API_KEY  (valfritt — utan den skrivs en ren datarapport)

Flaggor:
  --skip-git       Committa/pusha inte resultatet
  --top N          Antal köpcase att lyfta fram (default 6)
  --min-score N    Lägsta totalpoäng för att tas med (default 0)
"""

import os
import sys
import subprocess
from datetime import date

# ── Universum att screena ─────────────────────────────────────────────────────
# Bred mix av svenska/nordiska och amerikanska bolag. Utöka fritt.

UNIVERSE = {
    # ── USA: Tech & halvledare ──
    "MU":    "Micron Technology",
    "MRVL":  "Marvell Technology",
    "MSFT":  "Microsoft",
    "AMD":   "AMD",
    "NVDA":  "Nvidia",
    "AVGO":  "Broadcom",
    "QCOM":  "Qualcomm",
    "ASML":  "ASML Holding",
    "AMAT":  "Applied Materials",
    "LRCX":  "Lam Research",
    "TXN":   "Texas Instruments",
    "INTC":  "Intel",
    "GOOGL": "Alphabet",
    "META":  "Meta Platforms",
    "AAPL":  "Apple",
    "CRM":   "Salesforce",
    "ADBE":  "Adobe",
    # ── USA: Övrigt ──
    "PYPL":  "PayPal",
    "PFE":   "Pfizer",
    "UNH":   "UnitedHealth",
    "NKE":   "Nike",
    "DIS":   "Walt Disney",
    "KO":    "Coca-Cola",
    "JPM":   "JPMorgan Chase",
    # ── Sverige / Norden ──
    "ABB.ST":     "ABB",
    "INVE-B.ST":  "Investor B",
    "ATCO-B.ST":  "Atlas Copco B",
    "ATCO-A.ST":  "Atlas Copco A",
    "EQT.ST":     "EQT",
    "VOLV-B.ST":  "Volvo B",
    "SAND.ST":    "Sandvik",
    "ERIC-B.ST":  "Ericsson B",
    "HEXA-B.ST":  "Hexagon B",
    "SEB-A.ST":   "SEB A",
    "SWED-A.ST":  "Swedbank A",
    "SHB-A.ST":   "Handelsbanken A",
    "TELIA.ST":   "Telia",
    "HM-B.ST":    "H&M B",
    "ESSITY-B.ST":"Essity B",
    "ALFA.ST":    "Alfa Laval",
    "SKF-B.ST":   "SKF B",
    "HUSQ-B.ST":  "Husqvarna B",
    "EVO.ST":     "Evolution",
    "NIBE-B.ST":  "NIBE B",
    "SINCH.ST":   "Sinch",
    "SYNACT.ST":  "Synact Pharma",
}

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../.."))
OUTPUT_DIR = os.path.join(REPO_ROOT, "projects/egna/aktieanalys/koplagen")


# ── Tekniska indikatorer (ren Python, inga externa beroenden) ─────────────────

def rsi(closes: list[float], period: int = 14) -> float | None:
    """Relative Strength Index enligt Wilders utjämning."""
    if len(closes) < period + 1:
        return None
    gains, losses = [], []
    for i in range(1, len(closes)):
        diff = closes[i] - closes[i - 1]
        gains.append(max(diff, 0.0))
        losses.append(max(-diff, 0.0))
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100.0 - (100.0 / (1.0 + rs))


def sma(closes: list[float], period: int) -> float | None:
    """Enkelt glidande medelvärde."""
    if len(closes) < period:
        return None
    return sum(closes[-period:]) / period


# ── Poängsättning (ren Python — enhetstestbar utan nätverk) ────────────────────

def _val_score_pe(pe):
    if pe is None or pe <= 0:
        return None
    if pe < 10:  return 100
    if pe < 15:  return 85
    if pe < 20:  return 70
    if pe < 25:  return 55
    if pe < 30:  return 40
    if pe < 40:  return 25
    return 10

def _val_score_pb(pb):
    if pb is None or pb <= 0:
        return None
    if pb < 1:    return 100
    if pb < 1.5:  return 85
    if pb < 2.5:  return 70
    if pb < 4:    return 55
    if pb < 6:    return 40
    if pb < 10:   return 25
    return 10

def _val_score_peg(peg):
    if peg is None or peg <= 0:
        return None
    if peg < 0.75: return 100
    if peg < 1.0:  return 85
    if peg < 1.5:  return 70
    if peg < 2.0:  return 50
    if peg < 3.0:  return 30
    return 15

def _val_score_ev_ebitda(ev):
    if ev is None or ev <= 0:
        return None
    if ev < 6:   return 100
    if ev < 9:   return 85
    if ev < 12:  return 70
    if ev < 16:  return 50
    if ev < 22:  return 30
    return 15

def _val_score_roe(roe):
    # roe som decimal, t.ex. 0.18 = 18 %
    if roe is None:
        return None
    if roe >= 0.30: return 100
    if roe >= 0.20: return 85
    if roe >= 0.15: return 70
    if roe >= 0.10: return 55
    if roe >= 0.05: return 35
    if roe > 0:     return 20
    return 5

def _val_score_div(dy):
    # direktavkastning som decimal, 0.04 = 4 %
    if dy is None:
        return None
    if dy >= 0.06: return 100
    if dy >= 0.04: return 85
    if dy >= 0.025:return 70
    if dy >= 0.01: return 50
    if dy > 0:     return 35
    return 20

def _val_score_debt(de):
    # skuld/eget kapital. Lägre är bättre. yfinance ger ibland i procent.
    if de is None:
        return None
    if de > 5:      # troligen i procentform (t.ex. 45 = 0,45)
        de = de / 100.0
    if de < 0.25:  return 100
    if de < 0.5:   return 85
    if de < 1.0:   return 70
    if de < 1.5:   return 50
    if de < 2.5:   return 30
    return 15

def _val_score_upside(upside_pct):
    # analytikerriktkurs mot dagens kurs, i procent
    if upside_pct is None:
        return None
    if upside_pct >= 40: return 100
    if upside_pct >= 25: return 85
    if upside_pct >= 15: return 70
    if upside_pct >= 5:  return 55
    if upside_pct >= 0:  return 40
    if upside_pct >= -10:return 25
    return 10


def value_score(m: dict) -> tuple[float, list[str]]:
    """Viktad värderingspoäng 0-100. Returnerar (poäng, förklaringsrader)."""
    parts = [
        (_val_score_pe(m.get("pe")),          0.20, f"P/E {m.get('pe')}"),
        (_val_score_peg(m.get("peg")),        0.15, f"PEG {m.get('peg')}"),
        (_val_score_ev_ebitda(m.get("ev")),   0.15, f"EV/EBITDA {m.get('ev')}"),
        (_val_score_pb(m.get("pb")),          0.12, f"P/B {m.get('pb')}"),
        (_val_score_roe(m.get("roe")),        0.12, f"ROE {m.get('roe')}"),
        (_val_score_upside(m.get("upside")),  0.14, f"Analytikerpotential {m.get('upside')}%"),
        (_val_score_div(m.get("div")),        0.06, f"Direktavk. {m.get('div')}"),
        (_val_score_debt(m.get("debt")),      0.06, f"Skuld/EK {m.get('debt')}"),
    ]
    total_w = sum(w for s, w, _ in parts if s is not None)
    if total_w == 0:
        return 0.0, ["Otillräcklig fundamentaldata"]
    score = sum(s * w for s, w, _ in parts if s is not None) / total_w
    reasons = [label for s, w, label in parts if s is not None and s >= 70]
    return round(score, 1), reasons


def timing_score(m: dict) -> tuple[float, list[str]]:
    """Timing-/köplägespoäng 0-100 baserad på tekniska signaler."""
    reasons = []
    parts = []

    r = m.get("rsi")
    if r is not None:
        if r < 30:      s = 100; reasons.append(f"RSI {r:.0f} — översåld")
        elif r < 40:    s = 85;  reasons.append(f"RSI {r:.0f} — nära översåld")
        elif r < 50:    s = 65
        elif r < 60:    s = 50
        elif r < 70:    s = 35
        else:           s = 15
        parts.append((s, 0.35))

    # Rabatt mot 52-veckorstopp: större rabatt = bättre potentiellt läge
    disc = m.get("disc_from_high")  # procent under toppen (positivt tal)
    if disc is not None:
        if disc >= 40:   s = 100; reasons.append(f"{disc:.0f}% under 52v-topp")
        elif disc >= 25: s = 85;  reasons.append(f"{disc:.0f}% under 52v-topp")
        elif disc >= 15: s = 70
        elif disc >= 7:  s = 55
        elif disc >= 0:  s = 35
        else:            s = 15
        parts.append((s, 0.30))

    # Läge mot glidande medel: dip i uppåttrend är ett klassiskt köpläge
    p = m.get("price")
    ma50 = m.get("ma50")
    ma200 = m.get("ma200")
    if p and ma50 and ma200:
        uptrend = ma50 >= ma200
        below_ma50 = p < ma50
        above_ma200 = p > ma200
        if uptrend and below_ma50 and above_ma200:
            s = 95; reasons.append("Dip i uppåttrend (under MA50, över MA200)")
        elif uptrend and above_ma200:
            s = 70
        elif above_ma200:
            s = 55
        elif p < ma200 * 0.9:
            s = 45; reasons.append("Klart under MA200 — kontrarian")
        else:
            s = 35
        parts.append((s, 0.35))

    total_w = sum(w for _, w in parts)
    if total_w == 0:
        return 50.0, ["Ingen teknisk data — neutral timing"]
    score = sum(s * w for s, w in parts) / total_w
    return round(score, 1), reasons


def rate(total: float) -> str:
    if total >= 80: return "🟢 Starkt köpläge"
    if total >= 68: return "🟢 Köpläge"
    if total >= 55: return "🟡 Bevaka"
    if total >= 42: return "🟡 Neutral"
    return "🔴 Avvakta"


def evaluate(m: dict) -> dict:
    """Slår ihop värderings- och timingpoäng till en totalbedömning."""
    v, v_reasons = value_score(m)
    t, t_reasons = timing_score(m)
    # 60 % värdering, 40 % timing — undervärdering väger tyngst
    total = round(v * 0.60 + t * 0.40, 1)
    return {
        **m,
        "value_score": v,
        "timing_score": t,
        "total_score": total,
        "rating": rate(total),
        "reasons": v_reasons + t_reasons,
    }


# ── Datahämtning via yfinance ─────────────────────────────────────────────────

def fetch_metrics(ticker: str, name: str) -> dict | None:
    """Hämtar fundamentala nyckeltal + tekniska signaler för en aktie."""
    import yfinance as yf
    try:
        t = yf.Ticker(ticker)
        info = t.info or {}

        hist = t.history(period="1y")
        if hist is None or len(hist) < 30:
            return None
        closes = [float(c) for c in hist["Close"].tolist() if c == c]  # filtrera NaN
        if len(closes) < 30:
            return None

        price = closes[-1]
        high_52 = max(closes)
        low_52 = min(closes)
        ma50 = sma(closes, 50)
        ma200 = sma(closes, 200)
        rsi_val = rsi(closes, 14)
        disc_from_high = (high_52 - price) / high_52 * 100 if high_52 else None

        target = info.get("targetMeanPrice")
        upside = ((target - price) / price * 100) if target else None

        currency = info.get("currency") or ("SEK" if ticker.endswith(".ST") else "USD")

        news_items = []
        for n in (getattr(t, "news", None) or [])[:3]:
            title = (n.get("content", {}) or {}).get("title") or n.get("title", "")
            if title:
                news_items.append(title)

        return {
            "ticker":   ticker,
            "name":     name,
            "price":    round(price, 2),
            "currency": currency,
            "sector":   info.get("sector"),
            # Fundamenta
            "pe":     _num(info.get("trailingPE")),
            "fwd_pe": _num(info.get("forwardPE")),
            "pb":     _num(info.get("priceToBook")),
            "peg":    _num(info.get("trailingPegRatio") or info.get("pegRatio")),
            "ev":     _num(info.get("enterpriseToEbitda")),
            "roe":    _num(info.get("returnOnEquity")),
            "div":    _num(info.get("dividendYield")),
            "debt":   _num(info.get("debtToEquity")),
            "rev_growth": _num(info.get("revenueGrowth")),
            "margin":     _num(info.get("profitMargins")),
            "target":     _num(target),
            "upside":     round(upside, 1) if upside is not None else None,
            "recommendation": info.get("recommendationKey"),
            # Teknik
            "rsi":   round(rsi_val, 1) if rsi_val is not None else None,
            "ma50":  round(ma50, 2) if ma50 else None,
            "ma200": round(ma200, 2) if ma200 else None,
            "high_52": round(high_52, 2),
            "low_52":  round(low_52, 2),
            "disc_from_high": round(disc_from_high, 1) if disc_from_high is not None else None,
            "news": news_items,
        }
    except Exception as e:
        print(f"  Varning: kunde inte hämta {ticker}: {e}", file=sys.stderr)
        return None


def _num(x):
    """Konverterar till float om möjligt, annars None."""
    try:
        if x is None:
            return None
        f = float(x)
        return round(f, 4) if abs(f) < 1000 else round(f, 2)
    except (TypeError, ValueError):
        return None


# ── Rapportgenerering ──────────────────────────────────────────────────────────

def fmt_pct(x, decimals=1):
    return f"{x:+.{decimals}f}%" if x is not None else "—"

def fmt_num(x, decimals=1):
    return f"{x:.{decimals}f}" if x is not None else "—"


def build_data_block(today: str, ranked: list[dict], top_n: int) -> str:
    block = f"DATUM: {today}\n\n"
    block += f"KÖPKANDIDATER (rankade, topp {top_n} av {len(ranked)} screenade):\n\n"
    for i, c in enumerate(ranked[:top_n], 1):
        block += f"{i}. {c['name']} ({c['ticker']}) — {c['rating']}\n"
        block += (f"   Totalpoäng {c['total_score']} "
                  f"(värdering {c['value_score']}, timing {c['timing_score']})\n")
        block += f"   Kurs: {fmt_num(c['price'],2)} {c['currency']}"
        if c.get("sector"):
            block += f" | Sektor: {c['sector']}"
        block += "\n"
        block += (f"   P/E {fmt_num(c.get('pe'))} | Fwd P/E {fmt_num(c.get('fwd_pe'))} | "
                  f"P/B {fmt_num(c.get('pb'))} | PEG {fmt_num(c.get('peg'))} | "
                  f"EV/EBITDA {fmt_num(c.get('ev'))}\n")
        block += (f"   ROE {fmt_num((c.get('roe') or 0)*100) if c.get('roe') is not None else '—'} | "
                  f"Marginal {fmt_num((c.get('margin') or 0)*100) if c.get('margin') is not None else '—'} | "
                  f"Tillväxt {fmt_num((c.get('rev_growth') or 0)*100) if c.get('rev_growth') is not None else '—'} | "
                  f"Direktavk. {fmt_num((c.get('div') or 0)*100) if c.get('div') is not None else '—'} | "
                  f"Skuld/EK {fmt_num(c.get('debt'))}\n")
        block += (f"   Riktkurs (snitt): {fmt_num(c.get('target'),2)} → potential "
                  f"{fmt_pct(c.get('upside'))} | Analytiker: {c.get('recommendation') or '—'}\n")
        block += (f"   RSI {fmt_num(c.get('rsi'),0)} | MA50 {fmt_num(c.get('ma50'),2)} | "
                  f"MA200 {fmt_num(c.get('ma200'),2)} | "
                  f"{fmt_num(c.get('disc_from_high'),0)}% under 52v-topp\n")
        if c.get("reasons"):
            block += f"   Signaler: {', '.join(c['reasons'])}\n"
        for h in c.get("news", []):
            block += f"     • {h}\n"
        block += "\n"
    return block


def generate_report(today: str, top_n: int, min_score: float) -> str:
    print(f"Screenar {len(UNIVERSE)} bolag...")
    results = []
    for ticker, name in UNIVERSE.items():
        print(f"  {ticker}...", end=" ", flush=True)
        m = fetch_metrics(ticker, name)
        if m:
            results.append(evaluate(m))
            print(f"ok ({results[-1]['total_score']})")
        else:
            print("saknas")

    ranked = sorted(
        [r for r in results if r["total_score"] >= min_score],
        key=lambda r: r["total_score"],
        reverse=True,
    )

    if not ranked:
        return f"# Köplägesrapport — {today}\n\nIngen data kunde hämtas idag.\n"

    data_block = build_data_block(today, ranked, top_n)

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("\nANTHROPIC_API_KEY saknas — skriver ren datarapport.", file=sys.stderr)
        return build_raw_report(today, ranked, top_n)

    print("\nGenererar köpcase med Claude...")
    import anthropic
    client = anthropic.Anthropic(api_key=api_key)

    system_prompt = """Du är en värdeinriktad aktieanalytiker som letar efter undervärderade \
bolag med tydliga köplägen. Du skriver på svenska, konkret och faktabaserat, och använder \
de siffror du fått. Du väger samman fundamental värdering (billig relativt vinst, tillväxt \
och kvalitet) med timing (tekniska signaler, rabatt mot toppen, analytikerpotential). \
Du är ärlig med riskerna och gör tydlig skillnad på ett verkligt köpläge och en billig aktie \
som är billig av en anledning (värdefälla). Formatera i Markdown."""

    user_prompt = f"""Skriv en köplägesrapport baserad på följande screenade och rankade data:

{data_block}

Rapporten ska ha exakt dessa sektioner på svenska:

# Köplägesrobot — {today}

## Sammanfattning
(2-3 meningar: vilka teman/sektorer sticker ut bland de undervärderade bolagen idag?)

## 🎯 Toppköplägen
(För VARJE av topp {top_n} kandidaterna: en rubrik med bolag, ticker och betyg.
Skriv 4-6 meningar: varför bolaget ser undervärderat ut (nyckeltal), varför timingen är
intressant (tekniska signaler), föreslagen ingångskurs och riktkurs med uppsida i procent,
samt den största risken/värdefälle-varningen. Var konkret med siffrorna.)

## Rankningstabell
(Tabell: # | Bolag | Ticker | Kurs | Totalpoäng | Värdering | Timing | Potential | Betyg
för samtliga topp {top_n})

## Att undvika just nu
(1-2 bolag från listan som ser billiga ut men där du ser risk för värdefälla — motivera kort)

## Slutsats & Bevakning
(Bullet-lista med 3-4 konkreta åtgärder: vad att köpa/bevaka och vilka nivåer/triggers)

---
*Rapporten är automatiskt genererad och utgör inte finansiell rådgivning. Gör alltid egen research.*"""

    message = client.messages.create(
        model="claude-opus-4-8",
        max_tokens=4096,
        system=system_prompt,
        messages=[{"role": "user", "content": user_prompt}],
    )
    return message.content[0].text


def build_raw_report(today: str, ranked: list[dict], top_n: int) -> str:
    """Fallback utan Claude — ren datatabell."""
    lines = [f"# Köplägesrobot — {today}\n"]
    lines.append(f"> Screenade {len(ranked)} bolag. Rankade efter total köplägespoäng.\n")
    lines.append("## Rankningstabell\n")
    lines.append("| # | Bolag | Ticker | Kurs | Total | Värd. | Timing | Potential | Betyg |")
    lines.append("|---|-------|--------|------|-------|-------|--------|-----------|-------|")
    for i, c in enumerate(ranked[:top_n], 1):
        lines.append(
            f"| {i} | {c['name']} | {c['ticker']} | "
            f"{fmt_num(c['price'],2)} {c['currency']} | {c['total_score']} | "
            f"{c['value_score']} | {c['timing_score']} | {fmt_pct(c.get('upside'))} | "
            f"{c['rating']} |"
        )
    lines.append("")
    lines.append("## Detaljer\n")
    for i, c in enumerate(ranked[:top_n], 1):
        lines.append(f"### {i}. {c['name']} ({c['ticker']}) — {c['rating']}")
        lines.append(f"**Kurs:** {fmt_num(c['price'],2)} {c['currency']} | "
                     f"**P/E:** {fmt_num(c.get('pe'))} | **P/B:** {fmt_num(c.get('pb'))} | "
                     f"**PEG:** {fmt_num(c.get('peg'))} | **EV/EBITDA:** {fmt_num(c.get('ev'))}")
        lines.append(f"**Riktkurs:** {fmt_num(c.get('target'),2)} ({fmt_pct(c.get('upside'))}) | "
                     f"**RSI:** {fmt_num(c.get('rsi'),0)} | "
                     f"**Rabatt mot topp:** {fmt_num(c.get('disc_from_high'),0)}%")
        if c.get("reasons"):
            lines.append(f"**Signaler:** {', '.join(c['reasons'])}")
        lines.append("")
    lines.append("---\n*Rapporten är automatiskt genererad och utgör inte finansiell rådgivning.*")
    return "\n".join(lines)


# ── Git ────────────────────────────────────────────────────────────────────────

def git_commit_push(filepath: str, today: str):
    print("\nCommittar och pushar...")
    branch = os.environ.get("KOPLAGEN_BRANCH", "main")
    try:
        subprocess.run(["git", "add", filepath], cwd=REPO_ROOT, check=True)
        subprocess.run(["git", "commit", "-m", f"Köplägesrapport {today}"],
                       cwd=REPO_ROOT, check=True)
        subprocess.run(["git", "push", "-u", "origin", branch], cwd=REPO_ROOT, check=True)
        print(f"✓ Pushad till origin/{branch}")
    except subprocess.CalledProcessError as e:
        print(f"Git-fel: {e}", file=sys.stderr)


# ── Main ────────────────────────────────────────────────────────────────────────

def _arg(flag: str, default):
    if flag in sys.argv:
        i = sys.argv.index(flag)
        if i + 1 < len(sys.argv):
            return sys.argv[i + 1]
    return default


def main():
    skip_git = "--skip-git" in sys.argv
    top_n = int(_arg("--top", 6))
    min_score = float(_arg("--min-score", 0))

    today = date.today().strftime("%Y-%m-%d")
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    output_path = os.path.join(OUTPUT_DIR, f"{today}.md")

    if os.path.exists(output_path):
        print(f"Rapport för {today} finns redan: {output_path}")
        sys.exit(0)

    report = generate_report(today, top_n, min_score)

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(report)
    print(f"\n✓ Rapport sparad: {output_path}")

    if not skip_git:
        git_commit_push(output_path, today)


if __name__ == "__main__":
    main()
