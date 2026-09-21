# Cabins

Website för uthyrning av stugor/hütten. Byggd med Vite + React och
react-i18next för flerspråkighet.

## Stack

- **Vite + React 18** – samma grund som `projects/sllr`.
- **react-router-dom** – klientrouting (SPA).
- **react-i18next** – tre språk: **tyska (standard)**, svenska, engelska.
  Valt språk sparas i `localStorage` (`cabins.lang`).

## Struktur (steg 1)

```
src/
  i18n.js               # i18next-init, språkval + persistens
  locales/              # de.json (standard), sv.json, en.json
  data/cabins.js        # platshållardata för stugor
  components/           # Layout, Navbar, LanguageSwitcher, Footer, Placeholder
  pages/                # Home, Cabins, CabinDetail, Equipment, About, ContactFaq, NotFound
```

Rutter: `/`, `/cabins`, `/cabins/:id`, `/equipment`, `/about`, `/contact`.
URL-vägar hålls språkneutrala; endast texten översätts.

Innehåll som saknas visas som platshållare (`common.placeholder`) tills det
riktiga innehållet läggs till.

## Utveckling

```bash
npm install
npm run dev      # startar Vite-dev-server
npm run build    # produktionsbygge till dist/
npm run preview  # förhandsvisa bygget
```

## Deploy (senare)

`public/_redirects` finns förberedd för SPA-routing på Netlify. Rot-`netlify.toml`
pekar i dagsläget på `projects/sllr`; en egen deploy-konfiguration för det här
projektet läggs till i ett senare steg.
