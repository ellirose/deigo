import type { Lang } from "./i18n";
import type { IconName } from "@/components/Icons";

export type Cat = "web" | "app" | "brand" | "poster" | "illustration" | "apparel" | "fashion";

export type WorkItem = {
  id: string;
  src: string;
  w: number;
  h: number;
  cat: Cat;
  title: Record<Lang, string>;
};

const T = (en: string, pt: string, es: string) => ({ en, pt, es });
const W = (cat: Cat, folder: string, file: string, w: number, h: number, title: Record<Lang, string>): WorkItem => ({
  id: file,
  src: `/work/${folder}/${file}.jpg`,
  w,
  h,
  cat,
  title,
});

const ITEMS: WorkItem[] = [
  W("web", "web-design", "sneak-connect-sneaker-ecommerce", 736, 1307, T("Sneak Connect — sneaker store", "Sneak Connect — loja de tênis", "Sneak Connect — tienda de zapatillas")),
  W("web", "web-design", "glowcare-beauty-ecommerce", 736, 1104, T("GlowCare — beauty e-commerce", "GlowCare — e-commerce de beleza", "GlowCare — e-commerce de belleza")),
  W("web", "web-design", "pilates-era-yoga-studio", 736, 1252, T("Pilates Era — yoga studio", "Pilates Era — estúdio de yoga", "Pilates Era — estudio de yoga")),
  W("web", "web-design", "china-study-education-site", 736, 1308, T("Study in China — education agency", "Estudar na China — agência educacional", "Estudiar en China — agencia educativa")),
  W("web", "dashboard-design", "factory-monitor-dashboard", 736, 414, T("Factory Monitor — IoT dashboard", "Factory Monitor — painel IoT", "Factory Monitor — panel IoT")),

  W("app", "mobile-app-design", "techhub-electronics-app", 736, 1104, T("TechHub — electronics app", "TechHub — app de eletrônicos", "TechHub — app de electrónica")),
  W("app", "mobile-app-design", "skin-analysis-app", 736, 1308, T("Skin analysis app", "App de análise de pele", "App de análisis de piel")),
  W("app", "mobile-app-design", "sneaker-shop-app", 736, 1104, T("Sneaker shop app", "App de loja de tênis", "App de tienda de zapatillas")),
  W("app", "mobile-app-design", "fitness-workout-app", 736, 1104, T("Home fitness app", "App de treino em casa", "App de fitness en casa")),

  W("brand", "branding-typography", "a-monogram-04-final-mark", 626, 626, T("“A” monogram", "Monograma “A”", "Monograma “A”")),
  W("brand", "branding-typography", "glow-3d-fluffy-lettering", 736, 736, T("Glow — 3D lettering", "Glow — lettering 3D", "Glow — lettering 3D")),
  W("brand", "branding-typography", "a-monogram-03-construction-grid", 736, 734, T("Monogram construction grid", "Grade de construção do monograma", "Retícula de construcción del monograma")),
  W("brand", "branding-typography", "a-monogram-06-interlocked-variant", 736, 736, T("Interlocked mark", "Marca entrelaçada", "Marca entrelazada")),

  W("poster", "posters-social-media", "bmw-m4-gt3-poster", 736, 1307, T("BMW M4 GT3 — poster concept", "BMW M4 GT3 — conceito de pôster", "BMW M4 GT3 — concepto de póster")),
  W("poster", "posters-social-media", "stay-with-me-editorial-poster", 736, 1105, T("Stay With Me — editorial poster", "Stay With Me — pôster editorial", "Stay With Me — póster editorial")),
  W("poster", "posters-social-media", "f1-car-blueprint-poster", 736, 1308, T("F1 blueprint poster", "Pôster blueprint F1", "Póster blueprint F1")),
  W("poster", "posters-social-media", "all-about-me-social-collage", 736, 1308, T("All About Me — social collage", "All About Me — colagem social", "All About Me — collage social")),
  W("poster", "posters-social-media", "race-car-95-sketch-poster", 736, 1312, T("Race car sketch poster", "Pôster sketch de carro de corrida", "Póster boceto de auto de carreras")),

  W("illustration", "illustration", "rio-de-janeiro-3d-map", 736, 922, T("Rio de Janeiro — 3D map", "Rio de Janeiro — mapa 3D", "Río de Janeiro — mapa 3D")),
  W("illustration", "illustration", "aura-character-sheet", 720, 756, T("Aura — character sheet", "Aura — ficha de personagem", "Aura — hoja de personaje")),
  W("illustration", "illustration", "brasil-map-illustration", 736, 1308, T("Brasil — illustrated map", "Brasil — mapa ilustrado", "Brasil — mapa ilustrado")),

  W("apparel", "uniform-apparel-design", "barista-uniform", 736, 1104, T("Barista uniform", "Uniforme de barista", "Uniforme de barista")),
  W("apparel", "uniform-apparel-design", "angelj-football-jersey", 736, 975, T("Football jersey concept", "Conceito de camisa de futebol", "Concepto de camiseta de fútbol")),
  W("apparel", "uniform-apparel-design", "hotel-front-desk-uniform", 736, 981, T("Hotel front-desk uniform", "Uniforme de recepção de hotel", "Uniforme de recepción de hotel")),
  W("apparel", "uniform-apparel-design", "school-uniform-navy-polo", 736, 736, T("School uniform — navy polo", "Uniforme escolar — polo marinho", "Uniforme escolar — polo marino")),
  W("apparel", "uniform-apparel-design", "industrial-workwear-uniform", 736, 981, T("Industrial workwear", "Uniforme industrial", "Ropa de trabajo industrial")),
  W("apparel", "uniform-apparel-design", "xtreme-sport-kids-football-kit", 736, 1065, T("Kids football kit", "Kit de futebol infantil", "Equipación de fútbol infantil")),
  W("apparel", "uniform-apparel-design", "corporate-grey-suits", 736, 981, T("Corporate grey suits", "Ternos corporativos cinza", "Trajes corporativos grises")),
  W("apparel", "uniform-apparel-design", "sage-polo-staff-uniform", 700, 800, T("Staff polo — sage", "Polo de equipe — sálvia", "Polo de personal — salvia")),
  W("apparel", "uniform-apparel-design", "school-uniform-light-blue", 736, 981, T("School uniform — sky blue", "Uniforme escolar — azul-celeste", "Uniforme escolar — celeste")),
  W("apparel", "uniform-apparel-design", "green-sports-team-uniform", 736, 1104, T("Team sportswear — green", "Uniforme esportivo — verde", "Uniforme deportivo — verde")),
  W("apparel", "uniform-apparel-design", "school-uniform-varsity-jacket", 736, 981, T("School uniform — varsity jacket", "Uniforme escolar — jaqueta college", "Uniforme escolar — chaqueta varsity")),

  W("fashion", "fashion-styling", "tennis-outfit-flatlay", 736, 1104, T("Tennis outfit editorial", "Editorial look tênis", "Editorial look tenis")),
  W("fashion", "fashion-styling", "blush-pink-office-outfit", 675, 1200, T("Blush office look", "Look office rosé", "Look de oficina rosa")),
  W("fashion", "fashion-styling", "sage-suit-set-flatlay", 736, 1077, T("Sage suit set", "Conjunto alfaiataria sálvia", "Conjunto sastre salvia")),
];

/** Round-robin across categories so the "All" view mixes disciplines. */
function interleave(items: WorkItem[]): WorkItem[] {
  const groups = new Map<Cat, WorkItem[]>();
  for (const it of items) groups.set(it.cat, [...(groups.get(it.cat) ?? []), it]);
  const out: WorkItem[] = [];
  const queues = [...groups.values()];
  while (queues.some((q) => q.length)) for (const q of queues) if (q.length) out.push(q.shift()!);
  return out;
}

export const WORK = interleave(ITEMS);

export const CATS: { id: Cat | "all"; icon: IconName }[] = [
  { id: "all", icon: "grid" },
  { id: "web", icon: "web" },
  { id: "app", icon: "phone" },
  { id: "brand", icon: "brand" },
  { id: "poster", icon: "poster" },
  { id: "illustration", icon: "brush" },
  { id: "apparel", icon: "shirt" },
  { id: "fashion", icon: "hanger" },
];

export const CASE_STUDY: WorkItem[] = [
  ["a-monogram-01-sketch-explorations", 719, 694],
  ["a-monogram-02-pencil-sketch", 736, 981],
  ["a-monogram-03-construction-grid", 736, 734],
  ["a-monogram-04-final-mark", 626, 626],
  ["a-monogram-05-app-icon", 720, 1280],
  ["a-monogram-06-interlocked-variant", 736, 736],
].map(([file, w, h], i) =>
  W("brand", "branding-typography", file as string, w as number, h as number, T(`Step ${i + 1}`, `Etapa ${i + 1}`, `Paso ${i + 1}`)),
);
