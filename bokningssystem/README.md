# Bokningssystemet – onlinebokning för tjänsteföretag

Ett bokningssystem (SaaS) som lokala tjänsteföretag – frisörer, massörer,
hantverkare, hundtrimmare med flera – kan använda för att ta emot bokningar
dygnet runt. Byggs i faser; detta är **Fas 1 (MVP)**.

## Vad som är klart i Fas 1

| Del | Beskrivning |
|---|---|
| Bokningssida | Kunden väljer tjänst → dag → ledig tid → fyller i uppgifter → klart. Mobilanpassad, på svenska, under en minut att slutföra. |
| Lediga tider | Räknas ut automatiskt ur öppettider + tjänstens längd. Dubbelbokning är omöjlig – spärren sitter i databasen. |
| Bekräftelse | Direkt på skärmen + mail till kunden (mail aktiveras med en gratis Resend-nyckel). |
| Adminpanel | Ägaren loggar in och ser dagens och kommande bokningar, och kan avboka. |
| Testkund | "Frisör Lisa" med 5 tjänster och öppettider mån–lör. |

## Mappstruktur

```
bokningssystem/
├── README.md              <- den här filen
├── KOM-IGANG.md           <- steg-för-steg-guide för att starta allt
├── supabase/
│   ├── migrations/
│   │   ├── 001_grundschema.sql          <- tabeller, säkerhet, funktioner
│   │   └── 002_testdata_frisor_lisa.sql <- testkunden
│   └── functions/
│       └── skicka-bekraftelse/          <- bekräftelsemail (serverfunktion)
└── frontend/              <- själva webbappen (React + Vite)
    └── src/
        ├── pages/Bokning.jsx      <- bokningsflödet (kundens sida)
        ├── pages/admin/Admin.jsx  <- adminpanelen (ägarens sida)
        ├── pages/Start.jsx        <- startsidan
        └── lib/                   <- koppling till Supabase + datumhjälp
```

## Teknikval och kostnader

| Verktyg | Används till | Gratis? |
|---|---|---|
| **Supabase** | Databas, inloggning, API | Gratis upp till 500 MB databas + 50 000 användare – räcker länge. Betald plan från ca 25 USD/mån när det växer. |
| **React + Vite** | Webbappen | Helt gratis (öppen källkod). |
| **Netlify/Vercel** | Publicera sidan på internet | Gratisplanen räcker gott i början. |
| **Resend** | Bekräftelsemail | Gratis 100 mail/dag (3 000/mån). Betald plan från 20 USD/mån. |
| Stripe (Fas 2) | Ta betalt av företagen | Gratis konto; avgift ca 1,5–2,9 % + 1,80 kr per transaktion. |

**Varför just dessa?** Supabase ger databas, inloggning och API i ett – utan
egen server att underhålla. React + Vite är dagens standard och funkar
perfekt med Netlify/Vercel. Resend är enklast i klassen för mail.

## Kommande faser

- **Fas 2:** flera företag, egen registrering, full adminpanel
  (tjänster/öppettider/semester), Stripe-prenumerationer.
- **Fas 3:** SMS-påminnelser, avbokningslänk, betalning vid bokning,
  flera anställda, statistik m.m.
