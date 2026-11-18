# Diego Silveira — Portfolio

Next.js 16 (App Router, Turbopack) + Tailwind CSS 4. Single-page portfolio in English, Brazilian Portuguese and Spanish.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start   # production
```

## Structure

| Path | What it holds |
|---|---|
| `app/` | Layout (fonts, metadata), page composition, global styles and design tokens (`globals.css`), favicon |
| `components/` | One file per section (Hero, Expertise, Work, Motion, Impact, Journey, Process, About, Footer) plus Nav, LanguageSwitcher, icons, logo and flags |
| `components/canvas/` | Canvas pieces: `CalcadaoWave` (Copacabana wave band), `EditTimeline` (video timeline synced to the reel), `CareerGlobe` (3D dot globe) |
| `lib/i18n.ts` | Every piece of copy in `en`, `pt`, `es` |
| `lib/work.ts` | Project manifest: image paths, sizes, category and localized titles |
| `public/work`, `public/photos` | Portfolio images and portraits (copied from `../docs`) |
| `public/media`, `public/textures` | Stock video loops and surface textures |

To add a project: drop the image into `public/work/<category>/` and add one `W(...)` line in `lib/work.ts`.

## Media credits

- Video loops (`public/media`): [Mixkit](https://mixkit.co) — Mixkit Stock Video Free License (clips 7060, 44378, 2091), trimmed and re-encoded.
- Textures (`public/textures`), all via Wikimedia Commons:
  - `plaster.jpg` — "White textured coat finish clean seamless building wall texture", Sisters.seamless, CC0
  - `linen.jpg` — "ClothPack16", SpaceToast, public domain
  - `wood.jpg` — "Wood texture, light", Kurt Kaiser, CC0
  - `selaron.jpg` — "Tiled steps of Escadaria Selarón, Rio de Janeiro, Brazil", Wilfredor, CC0
