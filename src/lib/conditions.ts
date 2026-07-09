/**
 * Lay-vocabulary → registry-vocabulary expansion.
 *
 * Patients search in everyday words ("skin cancer", "sugar", "Lou Gehrig's
 * disease"); the registry indexes clinical terms. Peer-reviewed navigator
 * studies found 57% of eligible, listed trials weren't surfaced by naive
 * registry searches — largely a query-formulation gap. This module widens a
 * lay query into an OR-expression of registry terms (verified supported by
 * the ClinicalTrials.gov API's Essie syntax).
 */

interface Expansion {
  /** Lay names patients actually type (matched case-insensitively). */
  lay: string[];
  /** Registry terms OR-ed into the query alongside the user's own words. */
  terms: string[];
}

const EXPANSIONS: Expansion[] = [
  { lay: ["skin cancer"], terms: ["melanoma", "basal cell carcinoma", "squamous cell carcinoma"] },
  { lay: ["blood cancer"], terms: ["leukemia", "lymphoma", "multiple myeloma"] },
  { lay: ["lung cancer"], terms: ["non-small cell lung cancer", "small cell lung cancer"] },
  { lay: ["bowel cancer", "colon cancer", "rectal cancer"], terms: ["colorectal cancer"] },
  { lay: ["stomach cancer"], terms: ["gastric cancer"] },
  { lay: ["liver cancer"], terms: ["hepatocellular carcinoma"] },
  { lay: ["brain cancer", "brain tumor", "brain tumour"], terms: ["glioma", "glioblastoma", "brain neoplasm"] },
  { lay: ["kidney cancer"], terms: ["renal cell carcinoma"] },
  { lay: ["womb cancer", "uterine cancer"], terms: ["endometrial cancer"] },
  { lay: ["throat cancer"], terms: ["head and neck cancer", "laryngeal cancer", "pharyngeal cancer"] },
  { lay: ["bone cancer"], terms: ["osteosarcoma", "Ewing sarcoma", "bone neoplasm"] },
  { lay: ["bone marrow cancer", "myeloma"], terms: ["multiple myeloma"] },
  { lay: ["lou gehrig's disease", "lou gehrigs disease", "als"], terms: ["amyotrophic lateral sclerosis"] },
  { lay: ["memory loss", "dementia"], terms: ["Alzheimer disease", "dementia"] },
  { lay: ["heart disease"], terms: ["coronary artery disease", "heart failure", "cardiovascular disease"] },
  { lay: ["heart attack"], terms: ["myocardial infarction"] },
  { lay: ["irregular heartbeat"], terms: ["atrial fibrillation", "arrhythmia"] },
  { lay: ["high blood pressure"], terms: ["hypertension"] },
  { lay: ["high cholesterol"], terms: ["hypercholesterolemia", "dyslipidemia"] },
  { lay: ["stroke"], terms: ["ischemic stroke", "cerebrovascular accident"] },
  { lay: ["sugar", "sugar diabetes", "diabetes"], terms: ["diabetes mellitus", "type 2 diabetes", "type 1 diabetes"] },
  { lay: ["kidney disease"], terms: ["chronic kidney disease", "renal insufficiency"] },
  { lay: ["kidney failure"], terms: ["end stage renal disease", "kidney failure"] },
  { lay: ["fatty liver"], terms: ["nonalcoholic fatty liver disease", "metabolic dysfunction-associated steatotic liver disease", "NASH"] },
  { lay: ["overweight", "weight loss"], terms: ["obesity"] },
  { lay: ["emphysema", "smoker's lung", "smokers lung"], terms: ["chronic obstructive pulmonary disease", "COPD"] },
  { lay: ["lupus"], terms: ["systemic lupus erythematosus"] },
  { lay: ["ms"], terms: ["multiple sclerosis"] },
  { lay: ["arthritis"], terms: ["osteoarthritis", "rheumatoid arthritis"] },
  { lay: ["brittle bones", "bone loss"], terms: ["osteoporosis"] },
  { lay: ["eczema"], terms: ["atopic dermatitis"] },
  { lay: ["acid reflux", "heartburn"], terms: ["gastroesophageal reflux disease", "GERD"] },
  { lay: ["crohn's", "crohns", "colitis", "ibd"], terms: ["inflammatory bowel disease", "Crohn disease", "ulcerative colitis"] },
  { lay: ["celiac", "gluten intolerance"], terms: ["celiac disease"] },
  { lay: ["enlarged prostate"], terms: ["benign prostatic hyperplasia"] },
  { lay: ["seizures"], terms: ["epilepsy"] },
  { lay: ["adhd", "add"], terms: ["attention deficit hyperactivity disorder"] },
  { lay: ["autism"], terms: ["autism spectrum disorder"] },
  { lay: ["pcos"], terms: ["polycystic ovary syndrome"] },
  { lay: ["chronic fatigue", "me/cfs"], terms: ["myalgic encephalomyelitis", "chronic fatigue syndrome"] },
  { lay: ["long covid"], terms: ["post-acute COVID-19 syndrome", "long COVID"] },
  { lay: ["shingles"], terms: ["herpes zoster"] },
  { lay: ["drinking problem", "alcoholism"], terms: ["alcohol use disorder"] },
  { lay: ["drug addiction", "addiction"], terms: ["substance use disorder", "opioid use disorder"] },
  { lay: ["quit smoking", "smoking"], terms: ["smoking cessation", "nicotine dependence"] },
  { lay: ["hiv", "aids"], terms: ["HIV infection"] },
  { lay: ["low mood"], terms: ["depression", "major depressive disorder"] },
  { lay: ["manic depression"], terms: ["bipolar disorder"] },
  { lay: ["eating disorder"], terms: ["anorexia nervosa", "bulimia nervosa", "binge eating disorder"] },
  { lay: ["macular degeneration"], terms: ["age-related macular degeneration"] },
  { lay: ["sickle cell"], terms: ["sickle cell disease"] },
  { lay: ["period pain", "painful periods"], terms: ["endometriosis", "dysmenorrhea"] },
  { lay: ["trouble getting pregnant", "fertility"], terms: ["infertility"] },
  { lay: ["hay fever"], terms: ["allergic rhinitis"] },
];

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\w\s/'-]/g, "").replace(/\s+/g, " ").trim();
}

export interface ExpandedCondition {
  /** Essie OR-expression to send as query.cond. */
  query: string;
  /** Registry terms added beyond the user's own words (empty if none). */
  added: string[];
}

/** Widen a lay condition into registry vocabulary. Unknown terms pass through. */
export function expandCondition(input: string): ExpandedCondition {
  const norm = normalize(input);
  if (!norm) return { query: input.trim(), added: [] };
  const hit = EXPANSIONS.find((e) => e.lay.some((l) => normalize(l) === norm));
  if (!hit) return { query: input.trim(), added: [] };
  const added = hit.terms.filter((t) => normalize(t) !== norm);
  const parts = [input.trim(), ...added];
  return { query: `(${parts.join(" OR ")})`, added };
}

/** All searchable names (lay + registry), for autocomplete suggestions. */
const ALL_NAMES: string[] = (() => {
  const set = new Set<string>();
  for (const e of EXPANSIONS) {
    e.lay.forEach((l) => set.add(l));
    e.terms.forEach((t) => set.add(t.toLowerCase()));
  }
  return [...set].sort();
})();

export function suggestConditions(partial: string, limit = 6): string[] {
  const norm = normalize(partial);
  if (norm.length < 2) return [];
  const starts = ALL_NAMES.filter((n) => n.startsWith(norm));
  const contains = ALL_NAMES.filter((n) => !n.startsWith(norm) && n.includes(norm));
  return [...starts, ...contains].slice(0, limit);
}
