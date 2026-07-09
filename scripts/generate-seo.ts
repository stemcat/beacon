/**
 * Programmatic SEO generator. Run AFTER `vite build`:
 *
 *   npm run build && npm run seo            # all conditions
 *   npm run seo -- --limit 3                # quick test run
 *
 * For each curated condition it fetches the top recruiting trials from the
 * live registry and emits static, self-contained, plain-language pages:
 *
 *   dist/c/<condition-slug>/index.html   condition hub page
 *   dist/t/<nctid>/index.html            per-trial plain-language page
 *   dist/sitemap.xml, dist/robots.txt
 *
 * Set BEACON_BASE_URL (e.g. https://beacon.example.org) for absolute URLs in
 * the sitemap and canonical tags; unset, pages still work with relative links.
 */

import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { searchStudies, officialUrl, type Trial } from "../src/api/ctgov";
import { expandCondition } from "../src/lib/conditions";
import { parseEligibility } from "../src/lib/eligibility";
import { formatAgeRange, formatPhases, formatSex, formatStatus } from "../src/lib/format";

const DIST = join(process.cwd(), "dist");
const BASE_URL = (process.env.BEACON_BASE_URL ?? "").replace(/\/$/, "");
const TRIALS_PER_CONDITION = 30;

const CONDITIONS = [
  "Breast cancer", "Lung cancer", "Prostate cancer", "Colorectal cancer", "Melanoma",
  "Pancreatic cancer", "Ovarian cancer", "Bladder cancer", "Kidney cancer", "Liver cancer",
  "Stomach cancer", "Esophageal cancer", "Brain tumor", "Leukemia", "Lymphoma",
  "Multiple myeloma", "Head and neck cancer", "Cervical cancer", "Endometrial cancer",
  "Thyroid cancer", "Sarcoma", "Mesothelioma", "Type 2 diabetes", "Type 1 diabetes",
  "Obesity", "Heart failure", "Hypertension", "Atrial fibrillation", "Coronary artery disease",
  "High cholesterol", "Stroke", "Alzheimer's disease", "Parkinson's disease", "Multiple sclerosis",
  "Epilepsy", "Migraine", "ALS", "Depression", "Anxiety", "Bipolar disorder", "Schizophrenia",
  "PTSD", "ADHD", "Autism", "Asthma", "COPD", "Cystic fibrosis", "Pulmonary fibrosis",
  "Rheumatoid arthritis", "Osteoarthritis", "Lupus", "Psoriasis", "Atopic dermatitis",
  "Crohn's disease", "Ulcerative colitis", "Celiac disease", "Chronic kidney disease",
  "Fatty liver", "Hepatitis B", "HIV", "Osteoporosis", "Endometriosis", "PCOS",
  "Sickle cell disease", "Hemophilia", "Macular degeneration", "Glaucoma", "Hearing loss",
  "Chronic pain", "Fibromyalgia", "Long COVID", "Insomnia", "Smoking",
];

const args = process.argv.slice(2);
const limitIdx = args.indexOf("--limit");
const limit = limitIdx >= 0 ? parseInt(args[limitIdx + 1], 10) : CONDITIONS.length;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const slugify = (s: string) =>
  s.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const CSS = `
:root{--bg:#faf9f6;--surface:#fff;--text:#1f2933;--soft:#52606d;--accent:#0f766e;--border:#e4e0d8}
@media(prefers-color-scheme:dark){:root{--bg:#12161b;--surface:#1b2129;--text:#e8eaed;--soft:#9aa5b1;--accent:#2dd4bf;--border:#2c343f}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;font-size:17px;line-height:1.6}
main{max-width:760px;margin:0 auto;padding:24px 20px 64px}a{color:var(--accent)}
.top{max-width:760px;margin:0 auto;padding:16px 20px;font-weight:800;font-size:20px}.top a{color:var(--text);text-decoration:none}
.card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px;margin:16px 0}
h1{font-size:28px;line-height:1.2;letter-spacing:-.02em}h2{font-size:20px}h3{font-size:17px;margin:0 0 6px}
.badge{display:inline-block;font-size:12.5px;font-weight:700;padding:2px 10px;border-radius:999px;border:1px solid var(--border);color:var(--soft);margin-right:6px}
.soft{color:var(--soft);font-size:15px}.cta{display:inline-block;background:var(--accent);color:#fff;border-radius:10px;padding:11px 20px;font-weight:600;text-decoration:none;margin:8px 0}
ul{padding-left:22px}li{margin:6px 0}.note{font-size:13.5px;color:var(--soft);border:1px solid var(--border);border-radius:12px;padding:12px 16px;margin-top:24px}
`.trim();

function page(opts: {
  title: string;
  description: string;
  canonicalPath: string;
  body: string;
  jsonLd?: object;
}): string {
  const canonical = BASE_URL ? `${BASE_URL}${opts.canonicalPath}` : "";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(opts.title)}</title>
<meta name="description" content="${esc(opts.description)}">
${canonical ? `<link rel="canonical" href="${esc(canonical)}">` : ""}
<meta property="og:title" content="${esc(opts.title)}">
<meta property="og:description" content="${esc(opts.description)}">
<meta property="og:type" content="website">
<meta name="color-scheme" content="light dark">
<style>${CSS}</style>
${opts.jsonLd ? `<script type="application/ld+json">${JSON.stringify(opts.jsonLd)}</script>` : ""}
</head>
<body>
<div class="top"><a href="../../">🔆 Beacon</a></div>
<main>
${opts.body}
<div class="note"><strong>Beacon is an information tool, not medical advice.</strong> Whether a trial is right for you is a decision for you, your doctor, and the study team. Trial details come from the official registry, ClinicalTrials.gov, and may change — always confirm with the study team. Beacon collects no data about you: this page has no cookies, no accounts, and no tracking.</div>
</main>
</body>
</html>`;
}

const updated = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });

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
<p class="soft">Verify everything on the <a href="${esc(officialUrl(t.nctId))}" rel="noopener">official ClinicalTrials.gov record</a>. Page updated ${updated}.</p>`;

  return page({
    title,
    description,
    canonicalPath: `/t/${t.nctId}/`,
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

function conditionPage(condition: string, trials: Trial[], totalCount: number | null): string {
  const slug = slugify(condition);
  const expansion = expandCondition(condition);
  const title = `${condition} Clinical Trials Recruiting Now (${updated}) — Plain-Language Guide`;
  const description = `${totalCount?.toLocaleString() ?? "Many"} ${condition.toLowerCase()} clinical trials are recruiting participants. Free plain-language summaries: who qualifies, where each trial runs, and who to call. No account needed.`;

  const faq = [
    {
      q: `How do I find a ${condition.toLowerCase()} clinical trial near me?`,
      a: `Use Beacon's free search: enter "${condition.toLowerCase()}", your age, and your location, and you'll see recruiting trials sorted by distance, each explained in plain language. Beacon searches the full official registry (ClinicalTrials.gov) and never requires an account.`,
    },
    {
      q: "Does joining a clinical trial cost money?",
      a: "The study treatment and study-related tests are usually provided at no cost, and some trials help with travel. Always ask the study team what is covered and check with your insurance about routine care costs.",
    },
    {
      q: "Can I leave a clinical trial after joining?",
      a: "Yes. Participation is always voluntary, and you can leave a trial at any time, for any reason, without losing your normal medical care.",
    },
    {
      q: "Do I qualify for these trials?",
      a: `Every trial has its own eligibility criteria. Beacon translates each trial's criteria into a plain-language checklist you can review and bring to your doctor — only the study team can confirm whether you qualify.`,
    },
  ];

  const body = `
<h1>${esc(condition)} clinical trials recruiting now</h1>
<p class="soft">${totalCount != null ? `${totalCount.toLocaleString()} recruiting trials` : "Live trials"} in the official registry · updated ${updated} · free, no account, no tracking</p>
${expansion.added.length ? `<p class="soft">Also covers trials registered under: ${expansion.added.map(esc).join(", ")}.</p>` : ""}
<a class="cta" href="../../#/results?cond=${encodeURIComponent(condition)}">Search near your location →</a>
${trials
  .map(
    (t) => `<div class="card">
<h3><a href="../../t/${esc(t.nctId)}/">${esc(t.briefTitle)}</a></h3>
<p><span class="badge">${esc(formatStatus(t.overallStatus))}</span>${formatPhases(t.phases) ? `<span class="badge">${esc(formatPhases(t.phases)!)}</span>` : ""}<span class="badge">${t.locations.length} site${t.locations.length === 1 ? "" : "s"}</span></p>
${t.briefSummary ? `<p class="soft">${esc(t.briefSummary.slice(0, 240))}${t.briefSummary.length > 240 ? "…" : ""}</p>` : ""}
</div>`,
  )
  .join("")}
${totalCount != null && totalCount > trials.length ? `<a class="cta" href="../../#/results?cond=${encodeURIComponent(condition)}">See all ${totalCount.toLocaleString()} ${esc(condition.toLowerCase())} trials →</a>` : ""}
<div class="card"><h2>Common questions</h2>${faq.map((f) => `<h3>${esc(f.q)}</h3><p class="soft">${esc(f.a)}</p>`).join("")}</div>`;

  return page({
    title,
    description,
    canonicalPath: `/c/${slug}/`,
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

async function main() {
  if (!existsSync(DIST)) {
    console.error("dist/ not found — run `npm run build` first.");
    process.exit(1);
  }

  const conditions = CONDITIONS.slice(0, limit);
  const trialPages = new Map<string, Trial>();
  const sitemapPaths: string[] = ["/"];

  for (const [i, condition] of conditions.entries()) {
    try {
      const res = await searchStudies({
        condition: expandCondition(condition).query,
        pageSize: TRIALS_PER_CONDITION,
        extraFields: ["EligibilityCriteria", "CentralContactName", "CentralContactPhone", "CentralContactEMail", "CentralContactRole"],
      });
      const slug = slugify(condition);
      const dir = join(DIST, "c", slug);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "index.html"), conditionPage(condition, res.trials, res.totalCount));
      sitemapPaths.push(`/c/${slug}/`);
      res.trials.forEach((t) => trialPages.set(t.nctId, t));
      console.log(`[${i + 1}/${conditions.length}] ${condition}: ${res.trials.length} trials (${res.totalCount} total)`);
    } catch (e) {
      console.error(`[${i + 1}/${conditions.length}] ${condition} FAILED:`, e instanceof Error ? e.message : e);
    }
  }

  for (const [nctId, trial] of trialPages) {
    const dir = join(DIST, "t", nctId);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "index.html"), trialPage(trial));
    sitemapPaths.push(`/t/${nctId}/`);
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

  console.log(
    `\nGenerated ${conditions.length} condition pages + ${trialPages.size} trial pages` +
      (BASE_URL ? " + sitemap.xml" : " (no sitemap — set BEACON_BASE_URL)") +
      " + robots.txt",
  );
}

await main();
