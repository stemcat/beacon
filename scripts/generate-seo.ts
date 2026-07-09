/**
 * Canada-first programmatic SEO generator. Run AFTER `vite build`:
 *
 *   npm run build && npm run seo              # full run (~430 API calls)
 *   npm run seo -- --limit 3 --metro-limit 2  # quick test run
 *
 * Emits static, self-contained, plain-language pages in BOTH official
 * languages:
 *
 *   dist/c/<condition>/index.html             Canada-wide condition page (EN)
 *   dist/fr/c/<condition>/index.html          Canada-wide condition page (FR)
 *   dist/c/<condition>/<city>/index.html      metro page (EN), top 30 conditions × 12 metros
 *   dist/fr/c/<condition>/<city>/index.html   metro page (FR)
 *   dist/t/<nctid>/index.html                 per-trial plain-language page (EN)
 *   dist/sitemap.xml, dist/robots.txt
 *
 * The product stays global — these pages are the go-to-market surface.
 * Metro searches use a 100-mile radius, which deliberately includes US
 * border sites (often a Canadian patient's nearest option).
 *
 * Set BEACON_BASE_URL (e.g. https://beacon.ca) for sitemap/canonical/hreflang.
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { searchStudies, officialUrl, type Trial } from "../src/api/ctgov";
import { expandCondition } from "../src/lib/conditions";
import { parseEligibility } from "../src/lib/eligibility";
import { formatAgeRange, formatPhases, formatSex, formatStatus } from "../src/lib/format";

const DIST = join(process.cwd(), "dist");
// Canonical production URL, pinned in code so canonicals/sitemap/hreflang
// never drift. BEACON_BASE_URL env var overrides (forks, staging).
const BASE_URL = (process.env.BEACON_BASE_URL ?? "https://beacontrials.ca").replace(/\/$/, "");
const METRO_RADIUS_MILES = 100; // API filter value
const METRO_RADIUS_KM = 160; // displayed on pages — Canada is metric

type PageLang = "en" | "fr";

interface Metro {
  slug: string;
  en: string;
  fr: string;
  lat: number;
  lng: number;
}

const METROS: Metro[] = [
  { slug: "toronto", en: "Toronto", fr: "Toronto", lat: 43.6532, lng: -79.3832 },
  { slug: "montreal", en: "Montreal", fr: "Montréal", lat: 45.5017, lng: -73.5673 },
  { slug: "vancouver", en: "Vancouver", fr: "Vancouver", lat: 49.2827, lng: -123.1207 },
  { slug: "calgary", en: "Calgary", fr: "Calgary", lat: 51.0447, lng: -114.0719 },
  { slug: "edmonton", en: "Edmonton", fr: "Edmonton", lat: 53.5461, lng: -113.4938 },
  { slug: "ottawa", en: "Ottawa", fr: "Ottawa", lat: 45.4215, lng: -75.6972 },
  { slug: "winnipeg", en: "Winnipeg", fr: "Winnipeg", lat: 49.8951, lng: -97.1384 },
  { slug: "quebec-city", en: "Quebec City", fr: "Québec", lat: 46.8139, lng: -71.208 },
  { slug: "hamilton", en: "Hamilton", fr: "Hamilton", lat: 43.2557, lng: -79.8711 },
  { slug: "halifax", en: "Halifax", fr: "Halifax", lat: 44.6488, lng: -63.5752 },
  { slug: "london-ontario", en: "London (Ontario)", fr: "London (Ontario)", lat: 42.9849, lng: -81.2453 },
  { slug: "saskatoon", en: "Saskatoon", fr: "Saskatoon", lat: 52.1332, lng: -106.67 },
];

interface SeoCondition {
  en: string;
  fr: string;
  /** Top conditions also get per-metro pages. */
  metro?: boolean;
}

const CONDITIONS: SeoCondition[] = [
  { en: "Breast cancer", fr: "Cancer du sein", metro: true },
  { en: "Lung cancer", fr: "Cancer du poumon", metro: true },
  { en: "Prostate cancer", fr: "Cancer de la prostate", metro: true },
  { en: "Colorectal cancer", fr: "Cancer colorectal", metro: true },
  { en: "Melanoma", fr: "Mélanome", metro: true },
  { en: "Pancreatic cancer", fr: "Cancer du pancréas", metro: true },
  { en: "Ovarian cancer", fr: "Cancer de l'ovaire", metro: true },
  { en: "Bladder cancer", fr: "Cancer de la vessie", metro: true },
  { en: "Kidney cancer", fr: "Cancer du rein", metro: true },
  { en: "Leukemia", fr: "Leucémie", metro: true },
  { en: "Lymphoma", fr: "Lymphome", metro: true },
  { en: "Multiple myeloma", fr: "Myélome multiple", metro: true },
  { en: "Brain tumor", fr: "Tumeur cérébrale", metro: true },
  { en: "Type 2 diabetes", fr: "Diabète de type 2", metro: true },
  { en: "Obesity", fr: "Obésité", metro: true },
  { en: "Heart failure", fr: "Insuffisance cardiaque", metro: true },
  { en: "Hypertension", fr: "Hypertension", metro: true },
  { en: "Atrial fibrillation", fr: "Fibrillation auriculaire", metro: true },
  { en: "Stroke", fr: "AVC", metro: true },
  { en: "Alzheimer's disease", fr: "Maladie d'Alzheimer", metro: true },
  { en: "Parkinson's disease", fr: "Maladie de Parkinson", metro: true },
  { en: "Multiple sclerosis", fr: "Sclérose en plaques", metro: true },
  { en: "Epilepsy", fr: "Épilepsie", metro: true },
  { en: "Depression", fr: "Dépression", metro: true },
  { en: "Anxiety", fr: "Anxiété", metro: true },
  { en: "Schizophrenia", fr: "Schizophrénie", metro: true },
  { en: "Asthma", fr: "Asthme", metro: true },
  { en: "COPD", fr: "MPOC", metro: true },
  { en: "Rheumatoid arthritis", fr: "Polyarthrite rhumatoïde", metro: true },
  { en: "Crohn's disease", fr: "Maladie de Crohn", metro: true },
  { en: "Liver cancer", fr: "Cancer du foie" },
  { en: "Stomach cancer", fr: "Cancer de l'estomac" },
  { en: "Esophageal cancer", fr: "Cancer de l'œsophage" },
  { en: "Head and neck cancer", fr: "Cancer de la tête et du cou" },
  { en: "Cervical cancer", fr: "Cancer du col de l'utérus" },
  { en: "Endometrial cancer", fr: "Cancer de l'endomètre" },
  { en: "Thyroid cancer", fr: "Cancer de la thyroïde" },
  { en: "Sarcoma", fr: "Sarcome" },
  { en: "Mesothelioma", fr: "Mésothéliome" },
  { en: "Type 1 diabetes", fr: "Diabète de type 1" },
  { en: "Coronary artery disease", fr: "Maladie coronarienne" },
  { en: "High cholesterol", fr: "Cholestérol élevé" },
  { en: "Migraine", fr: "Migraine" },
  { en: "ALS", fr: "SLA (maladie de Lou Gehrig)" },
  { en: "Bipolar disorder", fr: "Trouble bipolaire" },
  { en: "PTSD", fr: "Trouble de stress post-traumatique" },
  { en: "ADHD", fr: "TDAH" },
  { en: "Autism", fr: "Autisme" },
  { en: "Cystic fibrosis", fr: "Fibrose kystique" },
  { en: "Pulmonary fibrosis", fr: "Fibrose pulmonaire" },
  { en: "Osteoarthritis", fr: "Arthrose" },
  { en: "Lupus", fr: "Lupus" },
  { en: "Psoriasis", fr: "Psoriasis" },
  { en: "Atopic dermatitis", fr: "Dermatite atopique (eczéma)" },
  { en: "Ulcerative colitis", fr: "Colite ulcéreuse" },
  { en: "Celiac disease", fr: "Maladie cœliaque" },
  { en: "Chronic kidney disease", fr: "Maladie rénale chronique" },
  { en: "Fatty liver", fr: "Stéatose hépatique" },
  { en: "Hepatitis B", fr: "Hépatite B" },
  { en: "HIV", fr: "VIH" },
  { en: "Osteoporosis", fr: "Ostéoporose" },
  { en: "Endometriosis", fr: "Endométriose" },
  { en: "PCOS", fr: "Syndrome des ovaires polykystiques" },
  { en: "Sickle cell disease", fr: "Drépanocytose" },
  { en: "Hemophilia", fr: "Hémophilie" },
  { en: "Macular degeneration", fr: "Dégénérescence maculaire" },
  { en: "Glaucoma", fr: "Glaucome" },
  { en: "Chronic pain", fr: "Douleur chronique" },
  { en: "Fibromyalgia", fr: "Fibromyalgie" },
  { en: "Long COVID", fr: "COVID longue" },
  { en: "Insomnia", fr: "Insomnie" },
  { en: "Smoking", fr: "Tabagisme" },
];

// Localized template strings for the static pages.
const L = {
  en: {
    titleNational: (c: string, d: string) => `${c} Clinical Trials in Canada Recruiting Now (${d})`,
    titleMetro: (c: string, city: string, d: string) => `${c} Clinical Trials in ${city} (${d}) — Plain-Language Guide`,
    descNational: (n: string, c: string) =>
      `${n} ${c.toLowerCase()} clinical trials are recruiting at Canadian sites. Free plain-language summaries in English and French: who qualifies, where each trial runs, who to call. No account needed.`,
    descMetro: (n: string, c: string, city: string) =>
      `${n} ${c.toLowerCase()} clinical trials are recruiting within ${METRO_RADIUS_KM} km of ${city}, including sites across the US border. Free plain-language summaries — who qualifies and who to call.`,
    h1National: (c: string) => `${c} clinical trials recruiting in Canada`,
    h1Metro: (c: string, city: string) => `${c} clinical trials near ${city}`,
    subtitle: (n: string) => `${n} recruiting trials in the official registry · updated`,
    subtitleTail: "free · no account · no tracking · English & français",
    borderNote: `Searches within ${METRO_RADIUS_KM} km deliberately include sites across the US border — often a Canadian patient's nearest option.`,
    alsoCovers: "Also covers trials registered under:",
    ctaSearch: "Search near your location →",
    ctaAll: (n: string, c: string) => `See all ${n} ${c.toLowerCase()} trials →`,
    faqTitle: "Common questions",
    sites: (n: number) => `${n} site${n === 1 ? "" : "s"}`,
    faq: (c: string) => [
      {
        q: `How do I find a ${c.toLowerCase()} clinical trial near me in Canada?`,
        a: `Use Beacon's free search: enter "${c.toLowerCase()}", your age, and your location, and you'll see recruiting trials sorted by distance, each explained in plain language — including sites just across the US border. Beacon searches the full official registry and never requires an account.`,
      },
      {
        q: "Does joining a clinical trial cost money?",
        a: "The study treatment and study-related tests are usually provided at no cost, and some trials help with travel. In Canada, your provincial health coverage continues to apply to your routine care — always confirm details with the study team.",
      },
      {
        q: "Can I leave a clinical trial after joining?",
        a: "Yes. Participation is always voluntary, and you can leave a trial at any time, for any reason, without losing your normal medical care.",
      },
      {
        q: "Do I qualify for these trials?",
        a: "Every trial has its own eligibility criteria. Beacon translates each trial's criteria into a plain-language checklist you can review and bring to your doctor — only the study team can confirm whether you qualify.",
      },
    ],
    disclaimer:
      "<strong>Beacon is an information tool, not medical advice.</strong> Whether a trial is right for you is a decision for you, your doctor, and the study team. Trial details come from the official registry, ClinicalTrials.gov, and may change — always confirm with the study team. Beacon collects no data about you: this page has no cookies, no accounts, and no tracking.",
    inOtherLang: "Cette page existe aussi en français",
    updatedWord: "Page updated",
  },
  fr: {
    titleNational: (c: string, d: string) => `Essais cliniques — ${c} au Canada, recrutement en cours (${d})`,
    titleMetro: (c: string, city: string, d: string) => `Essais cliniques — ${c} à ${city} (${d}) — guide en langage clair`,
    descNational: (n: string, c: string) =>
      `${n} essais cliniques (${c.toLowerCase()}) recrutent dans des sites canadiens. Résumés gratuits en langage clair, en français et en anglais : qui est admissible, où se déroule chaque essai, qui appeler. Aucun compte requis.`,
    descMetro: (n: string, c: string, city: string) =>
      `${n} essais cliniques (${c.toLowerCase()}) recrutent à moins de ${METRO_RADIUS_KM} km de ${city}, y compris des sites de l'autre côté de la frontière américaine. Résumés gratuits en langage clair.`,
    h1National: (c: string) => `Essais cliniques au Canada : ${c.toLowerCase()}`,
    h1Metro: (c: string, city: string) => `Essais cliniques près de ${city} : ${c.toLowerCase()}`,
    subtitle: (n: string) => `${n} essais en recrutement dans le registre officiel · mis à jour en`,
    subtitleTail: "gratuit · sans compte · sans pistage · English & français",
    borderNote: `Les recherches dans un rayon de ${METRO_RADIUS_KM} km incluent volontairement les sites de l'autre côté de la frontière américaine — souvent l'option la plus proche pour un patient canadien.`,
    alsoCovers: "Couvre aussi les essais enregistrés sous :",
    ctaSearch: "Chercher près de chez vous →",
    ctaAll: (n: string, c: string) => `Voir les ${n} essais (${c.toLowerCase()}) →`,
    faqTitle: "Questions fréquentes",
    sites: (n: number) => `${n} site${n === 1 ? "" : "s"}`,
    faq: (c: string) => [
      {
        q: `Comment trouver un essai clinique (${c.toLowerCase()}) près de chez moi au Canada ?`,
        a: `Utilisez la recherche gratuite de Beacon : entrez « ${c.toLowerCase()} », votre âge et votre lieu, et vous verrez les essais en recrutement triés par distance, chacun expliqué en langage clair — y compris les sites juste de l'autre côté de la frontière américaine. Beacon interroge le registre officiel complet et n'exige jamais de compte.`,
      },
      {
        q: "Participer à un essai clinique coûte-t-il de l'argent ?",
        a: "Le traitement à l'étude et les examens liés à l'étude sont habituellement fournis sans frais, et certains essais aident avec les déplacements. Au Canada, votre régime provincial d'assurance maladie continue de couvrir vos soins courants — confirmez toujours les détails avec l'équipe de l'étude.",
      },
      {
        q: "Puis-je quitter un essai clinique après y avoir adhéré ?",
        a: "Oui. La participation est toujours volontaire et vous pouvez quitter un essai à tout moment, pour n'importe quelle raison, sans perdre vos soins médicaux habituels.",
      },
      {
        q: "Suis-je admissible à ces essais ?",
        a: "Chaque essai a ses propres critères d'admissibilité. Beacon traduit les critères de chaque essai en une liste en langage clair que vous pouvez passer en revue et apporter à votre médecin — seule l'équipe de l'étude peut confirmer votre admissibilité.",
      },
    ],
    disclaimer:
      "<strong>Beacon est un outil d'information, pas un avis médical.</strong> La décision de participer à un essai vous appartient, à vous, à votre médecin et à l'équipe de l'étude. Les détails proviennent du registre officiel ClinicalTrials.gov et peuvent changer — confirmez toujours auprès de l'équipe de l'étude. Beacon ne collecte aucune donnée sur vous : cette page n'a ni témoins, ni comptes, ni pistage.",
    inOtherLang: "This page is also available in English",
    updatedWord: "Page mise à jour en",
  },
};

const args = process.argv.slice(2);
const flag = (name: string, fallback: number) => {
  const i = args.indexOf(name);
  return i >= 0 ? parseInt(args[i + 1], 10) : fallback;
};
const conditionLimit = flag("--limit", CONDITIONS.length);
const metroLimit = flag("--metro-limit", METROS.length);

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const CSS = `
:root{--bg:#faf9f6;--surface:#fff;--text:#1f2933;--soft:#52606d;--accent:#0f766e;--border:#e4e0d8}
@media(prefers-color-scheme:dark){:root{--bg:#12161b;--surface:#1b2129;--text:#e8eaed;--soft:#9aa5b1;--accent:#2dd4bf;--border:#2c343f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:17px;line-height:1.6}
main{max-width:760px;margin:0 auto;padding:24px 20px 64px}a{color:var(--accent)}
.top{max-width:760px;margin:0 auto;padding:16px 20px;font-weight:800;font-size:20px;display:flex;justify-content:space-between;align-items:center}.top a{color:var(--text);text-decoration:none}.top .lang{font-size:14px;font-weight:600}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin:16px 0}
h1{font-size:28px;line-height:1.2;letter-spacing:-.02em}h2{font-size:20px}h3{font-size:17px;margin:0 0 6px}
.badge{display:inline-block;font-size:12.5px;font-weight:700;padding:2px 10px;border-radius:999px;border:1px solid var(--border);color:var(--soft);margin-right:6px}
.soft{color:var(--soft);font-size:15px}.cta{display:inline-block;background:var(--accent);color:#fff;border-radius:10px;padding:11px 20px;font-weight:600;text-decoration:none;margin:8px 0}
ul{padding-left:22px}li{margin:6px 0}.note{font-size:13.5px;color:var(--soft);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-top:24px}
`.trim();

function page(opts: {
  lang: PageLang;
  title: string;
  description: string;
  canonicalPath: string;
  alternatePath?: string;
  rootRel: string;
  body: string;
  jsonLd?: object;
}): string {
  const canonical = BASE_URL ? `${BASE_URL}${opts.canonicalPath}` : "";
  const alternate = BASE_URL && opts.alternatePath ? `${BASE_URL}${opts.alternatePath}` : "";
  const otherLang = opts.lang === "en" ? "fr" : "en";
  return `<!doctype html>
<html lang="${opts.lang === "fr" ? "fr-CA" : "en-CA"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
${alternate ? `<link rel="alternate" hreflang="${otherLang}-CA" href="${esc(alternate)}"><link rel="alternate" hreflang="${opts.lang}-CA" href="${esc(canonical)}">` : ""}
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light dark">
<style>${CSS}</style>
${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ""}
</head>
<body>
<div class="top"><a href="${opts.rootRel}">🔆 Beacon</a>${opts.alternatePath ? `<a class="lang" href="${esc(opts.alternatePath.replace(/^\//, opts.rootRel))}">${L[opts.lang].inOtherLang}</a>` : ""}</div>
<main>
${opts.body}
<div class="note">${L[opts.lang].disclaimer}</div>
</main>
</body>
</html>`;
}

const now = new Date();
const updatedEn = now.toLocaleDateString("en-CA", { month: "long", year: "numeric" });
const updatedFr = now.toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
const updatedFor = (lang: PageLang) => (lang === "fr" ? updatedFr : updatedEn);

function trialPage(t: Trial): string {
  const phase = formatPhases(t.phases);
  const parsed = t.eligibilityCriteria ? parseEligibility(t.eligibilityCriteria) : null;
  const sites = t.locations.slice(0, 12);
  const siteCities = [...new Set(t.locations.map((l) => [l.city, l.state ?? l.country].filter(Boolean).join(", ")))];
  const title = `${t.briefTitle.slice(0, 90)}${t.briefTitle.length > 90 ? "…" : ""} — plain-language summary (${t.nctId})`;
  const description = `Plain-language guide to clinical trial ${t.nctId}: who may qualify, where it's running${siteCities.length ? ` (${siteCities.slice(0, 3).join("; ")}${siteCities.length > 3 ? " and more" : ""})` : ""}, and how to contact the study team.`;

  const criteriaHtml = parsed?.parsed
    ? parsed.sections
        .filter((s) => s.items.length > 0)
        .map(
          (s) => `<h3>${s.kind === "inclusion" ? "✅ You may be able to join if…" : s.kind === "exclusion" ? "🚫 You may not be able to join if…" : esc(s.title)}</h3>
<ul>${s.items.slice(0, 20).map((i) => `<li>${esc(i.text)}${i.children.length ? `<ul>${i.children.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ul>
${s.items.length > 20 ? `<p class="soft">+ ${s.items.length - 20} more criteria — see the full checklist in the app.</p>` : ""}`,
        )
        .join("")
    : t.eligibilityCriteria
      ? `<p class="soft">${esc(t.eligibilityCriteria.slice(0, 1200))}…</p>`
      : "";

  const contact = t.centralContacts[0];

  const body = `
<p class="soft"><a href="../../">← Search all trials on Beacon</a></p>
<h1>${esc(t.briefTitle)}</h1>
<p>
<span class="badge">${esc(formatStatus(t.overallStatus))}</span>
${phase ? `<span class="badge">${esc(phase)}</span>` : ""}
<span class="badge">${esc(t.nctId)}</span>
</p>
<p class="soft">Run by ${esc(t.leadSponsor ?? "unknown sponsor")} · for ${esc(formatAgeRange(t.minimumAge, t.maximumAge))} · ${esc(formatSex(t.sex))}${t.healthyVolunteers ? " · accepts healthy volunteers" : ""}</p>
${t.briefSummary ? `<div class="card"><h2>What this study is about</h2><p>${esc(t.briefSummary)}</p></div>` : ""}
${criteriaHtml ? `<div class="card"><h2>Who can join (things the study team will check)</h2>${criteriaHtml}</div>` : ""}
${sites.length ? `<div class="card"><h2>Where this trial is running</h2><ul>${sites.map((l) => `<li>${esc([l.facility, l.city, l.state, l.country].filter(Boolean).join(", "))}</li>`).join("")}</ul>${t.locations.length > sites.length ? `<p class="soft">+ ${t.locations.length - sites.length} more sites.</p>` : ""}</div>` : ""}
${contact ? `<div class="card"><h2>Who to contact</h2><p>${esc(contact.name ?? "Study team")}${contact.phone ? ` · ${esc(contact.phone)}` : ""}${contact.email ? ` · ${esc(contact.email)}` : ""}</p><p class="soft">It's completely normal to call and ask questions before deciding anything. Mention the study ID: ${esc(t.nctId)}.</p></div>` : ""}
<a class="cta" href="../../#/trial/${esc(t.nctId)}">Open the interactive checklist for this trial →</a>
<p class="soft">Verify everything on the <a href="${esc(officialUrl(t.nctId))}" rel="noopener">official ClinicalTrials.gov record</a>. Page updated ${updatedEn}.</p>`;

  return page({
    lang: "en",
    title,
    description,
    canonicalPath: `/t/${t.nctId}/`,
    rootRel: "../../",
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "MedicalStudy",
      name: t.briefTitle,
      description: t.briefSummary?.slice(0, 500),
      identifier: t.nctId,
      status: t.overallStatus,
      sponsor: t.leadSponsor ? { "@type": "Organization", name: t.leadSponsor } : undefined,
      healthCondition: t.conditions.join(", "),
      url: BASE_URL ? `${BASE_URL}/t/${t.nctId}/` : undefined,
    },
  });
}

interface CondPageOpts {
  lang: PageLang;
  cond: SeoCondition;
  metro?: Metro;
  trials: Trial[];
  totalCount: number | null;
}

function conditionPage(o: CondPageOpts): string {
  const s = L[o.lang];
  const name = o.lang === "fr" ? o.cond.fr : o.cond.en;
  const cityName = o.metro ? (o.lang === "fr" ? o.metro.fr : o.metro.en) : null;
  const slug = slugify(o.cond.en);
  const date = updatedFor(o.lang);
  const n = o.totalCount != null ? o.totalCount.toLocaleString(o.lang === "fr" ? "fr-CA" : "en-CA") : "—";
  const expansion = expandCondition(o.cond.en);

  const depth = (o.lang === "fr" ? 1 : 0) + (o.metro ? 3 : 2);
  const rootRel = "../".repeat(depth);
  const pathOf = (lang: PageLang) =>
    `${lang === "fr" ? "/fr" : ""}/c/${slug}/${o.metro ? o.metro.slug + "/" : ""}`;

  const appSearch = o.metro
    ? `${rootRel}#/results?cond=${encodeURIComponent(o.cond.en)}&lat=${o.metro.lat}&lng=${o.metro.lng}&loc=${encodeURIComponent(cityName!)}&radius=${METRO_RADIUS_MILES}`
    : `${rootRel}#/results?cond=${encodeURIComponent(o.cond.en)}`;

  const faq = s.faq(name);
  const title = o.metro ? s.titleMetro(name, cityName!, date) : s.titleNational(name, date);
  const description = o.metro ? s.descMetro(n, name, cityName!) : s.descNational(n, name);

  const body = `
<h1>${esc(o.metro ? s.h1Metro(name, cityName!) : s.h1National(name))}</h1>
<p class="soft">${s.subtitle(n)} ${date} · ${s.subtitleTail}</p>
${o.metro ? `<p class="soft">${s.borderNote}</p>` : ""}
${expansion.added.length ? `<p class="soft">${s.alsoCovers} ${expansion.added.map(esc).join(", ")}.</p>` : ""}
<a class="cta" href="${appSearch}">${s.ctaSearch}</a>
${o.trials
  .map(
    (t) => `<div class="card">
<h3><a href="${rootRel}t/${esc(t.nctId)}/">${esc(t.briefTitle)}</a></h3>
<p><span class="badge">${esc(formatStatus(t.overallStatus))}</span>${formatPhases(t.phases) ? `<span class="badge">${esc(formatPhases(t.phases)!)}</span>` : ""}<span class="badge">${s.sites(t.locations.length)}</span></p>
${t.briefSummary ? `<p class="soft">${esc(t.briefSummary.slice(0, 240))}${t.briefSummary.length > 240 ? "…" : ""}</p>` : ""}
</div>`,
  )
  .join("")}
${o.totalCount != null && o.totalCount > o.trials.length ? `<a class="cta" href="${appSearch}">${s.ctaAll(n, name)}</a>` : ""}
<div class="card"><h2>${s.faqTitle}</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p class="soft">${esc(f.a)}</p>`).join("")}</div>
<p class="soft">${s.updatedWord} ${date}.</p>`;

  return page({
    lang: o.lang,
    title,
    description,
    canonicalPath: pathOf(o.lang),
    alternatePath: pathOf(o.lang === "en" ? "fr" : "en"),
    rootRel,
    body,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  });
}

function writePage(relDir: string, html: string, sitemapPaths: string[]) {
  const dir = join(DIST, relDir);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  sitemapPaths.push(`/${relDir.replace(/\\/g, "/")}/`.replace(/\/+/g, "/"));
}

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(1);
  }

  const conditions = CONDITIONS.slice(0, conditionLimit);
  const metros = METROS.slice(0, metroLimit);
  const trialPages = new Map<string, Trial>();
  const sitemapPaths: string[] = ["/"];
  const extraFields = [
    "EligibilityCriteria",
    "CentralContactName",
    "CentralContactPhone",
    "CentralContactEMail",
    "CentralContactRole",
  ];

  for (const [i, cond] of conditions.entries()) {
    const slug = slugify(cond.en);
    try {
      const res = await searchStudies({
        condition: expandCondition(cond.en).query,
        locationCountry: "Canada",
        pageSize: 30,
        extraFields,
      });
      writePage(`c/${slug}`, conditionPage({ lang: "en", cond, trials: res.trials, totalCount: res.totalCount }), sitemapPaths);
      writePage(`fr/c/${slug}`, conditionPage({ lang: "fr", cond, trials: res.trials, totalCount: res.totalCount }), sitemapPaths);
      res.trials.forEach((t) => trialPages.set(t.nctId, t));
      console.log(`[${i + 1}/${conditions.length}] ${cond.en}: ${res.totalCount} in Canada`);
    } catch (e) {
      console.error(`[${i + 1}/${conditions.length}] ${cond.en} FAILED:`, e instanceof Error ? e.message : e);
    }

    if (!cond.metro) continue;
    for (const metro of metros) {
      try {
        const res = await searchStudies({
          condition: expandCondition(cond.en).query,
          lat: metro.lat,
          lng: metro.lng,
          radiusMiles: METRO_RADIUS_MILES,
          pageSize: 10,
          extraFields,
        });
        writePage(`c/${slug}/${metro.slug}`, conditionPage({ lang: "en", cond, metro, trials: res.trials, totalCount: res.totalCount }), sitemapPaths);
        writePage(`fr/c/${slug}/${metro.slug}`, conditionPage({ lang: "fr", cond, metro, trials: res.trials, totalCount: res.totalCount }), sitemapPaths);
        res.trials.forEach((t) => trialPages.set(t.nctId, t));
      } catch (e) {
        console.error(`  ${cond.en} × ${metro.en} FAILED:`, e instanceof Error ? e.message : e);
      }
    }
  }

  for (const [nctId, trial] of trialPages) {
    writePage(`t/${nctId}`, trialPage(trial), sitemapPaths);
  }

  if (BASE_URL) {
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapPaths.map((p) => `<url><loc>${esc(BASE_URL + p)}</loc></url>`).join("\n")}
</urlset>`;
    writeFileSync(join(DIST, "sitemap.xml"), sitemap);
  }
  writeFileSync(
    join(DIST, "robots.txt"),
    `User-agent: *\nAllow: /\n${BASE_URL ? `Sitemap: ${BASE_URL}/sitemap.xml\n` : ""}`,
  );

  const metroPageCount = conditions.filter((c) => c.metro).length * metros.length;
  console.log(
    `\nGenerated ${conditions.length} national condition pages ×2 languages, ` +
      `${metroPageCount} metro pages ×2 languages, ${trialPages.size} trial pages` +
      (BASE_URL ? ", sitemap.xml" : " (no sitemap — set BEACON_BASE_URL)") +
      ", robots.txt",
  );
}

await main();
