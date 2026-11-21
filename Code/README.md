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
| `components/` | One file per section (Hero, Expertise, Work, Motion, Studio, Impact, Journey, Process, About, Footer) plus Intro, Nav, LanguageSwitcher, icons, logo and flags |
| `components/canvas/` | Canvas pieces: `CalcadaoWave` (Copacabana wave band), `EditTimeline` (video timeline synced to the reel), `CareerGlobe` (3D dot globe), `PaperStage` (hero print transitions), `Ambient` (ambilight glow for the studio screen) |
| `lib/i18n.ts` | Every piece of copy in `en`, `pt`, `es` |
| `lib/work.ts` | Project manifest: image paths, sizes, category and localized titles |
| `lib/studio.ts` | AI ad-film manifest: clip ids, sizes, durations, category and localized titles |
| `public/work`, `public/photos` | Portfolio images and portraits (copied from `../docs`) |
| `public/studio` | Client AI ad films (from `../docs/videos`): 1280px main file, `-preview` hover loop and poster per clip |
| `public/media`, `public/textures` | Showreel cut from the client films (`reel-studio`), stock video loops and surface textures |

To add a project: drop the image into `public/work/<category>/` and add one `W(...)` line in `lib/work.ts`.
To add a film: put `<id>.mp4`, `<id>-preview.mp4` and `<id>.jpg` in `public/studio/` and add one `F(...)` line in `lib/studio.ts`.

## Media credits

- Stock video loops (`hero-cove`, `surf-texture` in `public/media`): [Mixkit](https://mixkit.co) — Mixkit Stock Video Free License, trimmed and re-encoded.
- Ad films (`public/studio`, `reel-studio`): Diego Silveira’s own client work.
- Textures (`public/textures`), all via Wikimedia Commons:
  - `plaster.jpg` — "White textured coat finish clean seamless building wall texture", Sisters.seamless, CC0
  - `linen.jpg` — "ClothPack16", SpaceToast, public domain
  - `wood.jpg` — "Wood texture, light", Kurt Kaiser, CC0
  - `selaron.jpg` — "Tiled steps of Escadaria Selarón, Rio de Janeiro, Brazil", Wilfredor, CC0
