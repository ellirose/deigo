import type { IconName } from "@/components/Icons";
import type { Lang } from "./i18n";

/* AI ad films produced for clients. Each clip ships as a 1280px main file, a small
   hover-preview loop and a poster frame in /public/studio. */

export type StudioCat = "clothing" | "characters" | "food" | "beauty" | "jewelry" | "lifestyle" | "sports";

export type Film = {
  id: string;
  cat: StudioCat;
  w: number;
  h: number;
  dur: number;
  title: Record<Lang, string>;
};

const T = (en: string, pt: string, es: string): Record<Lang, string> => ({ en, pt, es });
const F = (cat: StudioCat, id: string, w: number, h: number, dur: number, title: Record<Lang, string>): Film => ({ id, cat, w, h, dur, title });

const FILMS: Film[] = [
  F("clothing", "animated-boutique-apparel-promotion", 1280, 720, 7.4, T("Boutique apparel promo", "Promo de boutique", "Promo de boutique")),
  F("clothing", "beige-trench-coat-editorial", 966, 1280, 5.3, T("Beige trench editorial", "Editorial trench bege", "Editorial gabardina beige")),
  F("clothing", "lavender-floral-hat-dress", 720, 1280, 8, T("Lavender hat & floral dress", "Chapéu lavanda e vestido floral", "Sombrero lavanda y vestido floral")),
  F("clothing", "white-suit-flower-field", 720, 1280, 6.4, T("White suit, flower field", "Terno branco no campo de flores", "Traje blanco entre flores")),
  F("characters", "brunette-smile-closeup", 1280, 720, 5.1, T("Smile close-up", "Close de sorriso", "Primer plano de sonrisa")),
  F("characters", "floral-dress-portrait", 720, 1280, 10, T("Floral dress portrait", "Retrato com vestido floral", "Retrato con vestido floral")),
  F("characters", "silver-blonde-cozy-portrait", 1280, 726, 8, T("Cozy knit portrait", "Retrato em tricô aconchegante", "Retrato acogedor en punto")),
  F("food", "celebration-cake-showcase", 720, 1280, 6, T("Anniversary cake reveal", "Bolo de aniversário", "Tarta de aniversario")),
  F("food", "fresh-fruit-breakfast-display", 720, 1280, 10, T("Fresh fruit breakfast", "Café da manhã com frutas", "Desayuno de fruta fresca")),
  F("food", "lemon-zest-cake", 1280, 720, 8, T("Lemon zest cake", "Bolo de limão siciliano", "Bizcocho de limón")),
  F("food", "pancake-stack-syrup", 1280, 720, 6.1, T("Pancake stack & syrup", "Panquecas com calda", "Tortitas con sirope")),
  F("food", "strawberry-boba-drink", 714, 1280, 5.2, T("Strawberry boba drink", "Bubble tea de morango", "Bubble tea de fresa")),
  F("beauty", "cotton-pad-skincare", 1280, 720, 5.1, T("Cotton-pad skincare", "Skincare com algodão", "Skincare con algodón")),
  F("beauty", "iridescent-perfume-bottle", 720, 1280, 8, T("Iridescent perfume", "Perfume iridescente", "Perfume iridiscente")),
  F("beauty", "skincare-face-touch", 1280, 874, 5, T("Morning skincare ritual", "Ritual de skincare matinal", "Ritual de skincare matutino")),
  F("jewelry", "jewelry-box-pearls", 720, 1280, 8, T("Pearl jewelry box", "Porta-joias com pérolas", "Joyero con perlas")),
  F("jewelry", "wedding-rings-book", 720, 1280, 8, T("Wedding rings, love story", "Alianças sobre um romance", "Alianzas sobre una novela")),
  F("lifestyle", "blonde-gold-jacket", 944, 1280, 5.8, T("Gold jacket portrait", "Retrato de jaqueta dourada", "Retrato de chaqueta dorada")),
  F("lifestyle", "bob-hair-warm-portrait", 720, 1280, 5.1, T("Warm-light bob portrait", "Retrato chanel em luz quente", "Retrato bob con luz cálida")),
  F("sports", "mountain-bike-jump", 1280, 720, 10, T("Mountain bike jump", "Salto de mountain bike", "Salto en bici de montaña")),
  F("sports", "park-runner", 726, 1280, 10, T("Park run", "Corrida no parque", "Carrera en el parque")),
  F("sports", "soccer-training", 1280, 720, 10, T("Soccer training drill", "Treino de futebol", "Entrenamiento de fútbol")),
];

/** Round-robin across categories so the "All" view mixes industries. */
function interleave(items: Film[]): Film[] {
  const groups = new Map<StudioCat, Film[]>();
  for (const it of items) groups.set(it.cat, [...(groups.get(it.cat) ?? []), it]);
  const queues = [...groups.values()];
  const out: Film[] = [];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

export const FILMS_ORDERED = interleave(FILMS);

export const STUDIO_CATS: { id: StudioCat | "all"; icon: IconName }[] = [
  { id: "all", icon: "grid" },
  { id: "clothing", icon: "hanger" },
  { id: "characters", icon: "face" },
  { id: "food", icon: "cake" },
  { id: "beauty", icon: "drop" },
  { id: "jewelry", icon: "gem" },
  { id: "lifestyle", icon: "sun" },
  { id: "sports", icon: "ball" },
];

export const filmSrc = (f: Film) => `/studio/${f.id}.mp4`;
export const filmPreview = (f: Film) => `/studio/${f.id}-preview.mp4`;
export const filmPoster = (f: Film) => `/studio/${f.id}.jpg`;
export const filmRatio = (f: Film) => {
  const r = f.w / f.h;
  return r > 1.5 ? "16:9" : r > 1.2 ? "3:2" : r > 0.7 ? "3:4" : "9:16";
};
export const fmtDur = (s: number) => `0:${String(Math.round(s)).padStart(2, "0")}`;
