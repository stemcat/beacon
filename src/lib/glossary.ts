/**
 * Plain-language glossary for clinical trial jargon.
 *
 * Definitions are informational translations, not medical advice; they aim
 * for the reading level of a nervous family member, not a study coordinator.
 */

export const GLOSSARY: Record<string, string> = {
  "randomized": "Participants are assigned to treatment groups by chance (like a coin flip), not chosen by the doctor. This keeps the comparison fair.",
  "randomization": "Assigning participants to treatment groups by chance, like a coin flip, to keep the comparison fair.",
  "placebo": "A look-alike treatment with no active medicine. Comparing against it shows whether the real treatment truly works.",
  "double-blind": "Neither you nor your study doctor knows which treatment you're getting, so expectations can't skew the results.",
  "single-blind": "You don't know which treatment you're getting, but your study doctor does.",
  "open label": "Everyone — you and the doctors — knows which treatment you're getting. There's no secrecy in this study.",
  "open-label": "Everyone — you and the doctors — knows which treatment you're getting. There's no secrecy in this study.",
  "phase 1": "An early study focused on safety: finding the right dose and watching for side effects, usually with a small group.",
  "phase 2": "A mid-stage study checking whether the treatment works and continuing to watch safety, usually with a larger group.",
  "phase 3": "A late-stage study comparing the new treatment against the current standard in a large group — the last step before approval.",
  "phase 4": "A study of a treatment that's already approved, watching how it performs in everyday use over time.",
  "informed consent": "The process where the study team explains everything — risks, benefits, what's involved — and you decide freely, in writing, whether to join. You can leave the study at any time.",
  "eligibility criteria": "The rules for who can and can't join a study, designed to keep participants safe and results meaningful.",
  "inclusion criteria": "The things that must be true about you to join the study.",
  "exclusion criteria": "The things that would prevent you from joining the study, usually for your own safety.",
  "intervention": "Whatever the study is testing — a drug, a device, a procedure, or even a lifestyle change.",
  "arm": "One of the groups in a study. Each arm gets a different treatment (or a placebo) so results can be compared.",
  "cohort": "A group of participants who share something in common and are followed together during the study.",
  "dose escalation": "The dose starts low for safety and is gradually increased in later groups as researchers learn how it's tolerated.",
  "first-line": "The first treatment normally given for a condition, before any others have been tried.",
  "second-line": "A treatment given after the first standard treatment didn't work or stopped working.",
  "refractory": "The condition didn't respond to previous treatment.",
  "relapsed": "The condition came back after a period of improvement.",
  "remission": "Signs and symptoms of the disease have decreased or disappeared, though it may not be cured.",
  "metastatic": "Cancer that has spread from where it started to other parts of the body.",
  "unresectable": "Cannot be removed with surgery.",
  "biopsy": "Taking a small sample of tissue so it can be examined under a microscope.",
  "histologically confirmed": "The diagnosis was confirmed by examining a tissue sample under a microscope — the most certain kind of diagnosis.",
  "adjuvant": "Extra treatment given after the main treatment (often surgery) to lower the chance the disease comes back.",
  "neoadjuvant": "Treatment given before the main treatment (often surgery), usually to shrink the disease first.",
  "chemotherapy": "Medicines that kill fast-growing cells, used mainly to treat cancer.",
  "immunotherapy": "Treatment that helps your own immune system recognize and fight the disease.",
  "targeted therapy": "Medicine designed to attack specific features of diseased cells while sparing healthy ones.",
  "monoclonal antibody": "A lab-made immune protein designed to lock onto one specific target in the body.",
  "checkpoint inhibitor": "A type of immunotherapy that releases the 'brakes' on your immune system so it can attack cancer cells.",
  "progression-free survival": "How long people live without their disease getting worse.",
  "overall survival": "How long people live after starting treatment, regardless of what happens with the disease.",
  "adverse event": "Any unwanted medical problem that happens during a study, whether or not the treatment caused it.",
  "side effects": "Unwanted effects of a treatment, ranging from mild (nausea, fatigue) to serious. The study team must explain the known ones before you join.",
  "washout period": "A stretch of time before the study when you must stop taking certain medicines so they don't interfere with the results.",
  "screening": "The tests and questions used to check whether you can join a study, done before it starts.",
  "baseline": "Your starting measurements, taken before treatment begins, so changes can be tracked.",
  "contraindication": "A reason a particular treatment could be harmful for you and shouldn't be used.",
  "comorbidity": "Another health condition you have in addition to the one being studied.",
  "biomarker": "Something measurable in your body — often in blood or tissue — that gives clues about your health or how a treatment is working.",
  "ecog performance status": "A 0–5 score of how well you can go about daily life. 0 means fully active; 1 means restricted from strenuous activity but able to do light work.",
  "karnofsky": "A 0–100 score of how well you can carry out daily activities; higher is better.",
  "measurable disease": "Tumors large enough to be measured on scans, so doctors can track whether treatment is shrinking them.",
  "recist": "A standard rulebook doctors use to measure on scans whether tumors are shrinking, stable, or growing.",
  "irecist": "A version of the RECIST measuring rules adapted for immunotherapy, which can make scans look worse before they get better.",
  "standard of care": "The treatment doctors would normally give for your condition today — the benchmark new treatments are compared against.",
  "standard treatment": "The treatment doctors would normally give for your condition today.",
  "investigational": "Not yet approved by regulators — still being studied.",
  "sponsor": "The organization that runs and pays for the study — a company, university, hospital, or government agency.",
  "principal investigator": "The lead doctor or scientist responsible for the study at a site.",
  "protocol": "The study's detailed rulebook: who can join, what happens when, and how safety is monitored.",
  "observational study": "Researchers watch and measure without assigning any treatment — you receive your normal care.",
  "interventional study": "A study where participants receive a specific treatment or activity assigned by the protocol.",
  "healthy volunteers": "People without the condition being studied, who join to help researchers understand safety or normal function.",
  "life expectancy": "How long doctors estimate a person is likely to live; some studies require a minimum estimate so participants can complete the study.",
  "intravenous": "Given through a needle or tube into a vein (an IV).",
  "subcutaneous": "Injected under the skin, like an insulin shot.",
  "pharmacokinetics": "How your body absorbs, spreads, breaks down, and gets rid of a drug — often measured with blood draws.",
  "efficacy": "How well a treatment works under study conditions.",
  "hba1c": "A blood test showing your average blood sugar over the past 2–3 months.",
  "bmi": "Body mass index — a number based on your height and weight, used as a rough measure of body size.",
  "hypertension": "High blood pressure.",
  "immunosuppressive": "Medicine that lowers the activity of your immune system.",
  "corticosteroids": "Anti-inflammatory medicines like prednisone; many studies limit their use because they affect the immune system.",
  "cns metastases": "Cancer that has spread to the brain or spinal cord.",
  "brain metastases": "Cancer that has spread to the brain from somewhere else in the body.",
  "leptomeningeal": "Involving the thin membranes and fluid surrounding the brain and spinal cord.",
  "crossover": "Partway through the study, participants switch groups — for example, from placebo to the real treatment.",
  "expanded access": "A way for seriously ill patients to receive an investigational treatment outside of a clinical trial when no good alternative exists.",
  "contraception": "Studies often require reliable birth control because investigational treatments may harm a pregnancy.",
  "renal": "Relating to the kidneys.",
  "hepatic": "Relating to the liver.",
  "cardiac": "Relating to the heart.",
  "prior therapy": "Treatments you've already had; many studies require or exclude specific ones.",
  "systemic therapy": "Treatment that travels through the whole body (like pills or IV drugs), rather than targeting one spot.",
};

export interface GlossaryMatch {
  term: string;
  index: number;
  length: number;
}

let matcher: RegExp | null = null;

function getMatcher(): RegExp {
  if (!matcher) {
    const terms = Object.keys(GLOSSARY)
      .sort((a, b) => b.length - a.length)
      .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]+"));
    matcher = new RegExp(`\\b(${terms.join("|")})\\b`, "gi");
  }
  return matcher;
}

/** Look up a term's plain-language explanation (case- and hyphen-insensitive). */
export function explainTerm(term: string): string | undefined {
  const norm = term.toLowerCase().replace(/[\s-]+/g, " ").trim();
  return GLOSSARY[norm] ?? GLOSSARY[norm.replace(/ /g, "-")];
}

/**
 * Find glossary terms in a block of text. Matches never overlap, and each
 * distinct term is only annotated on its first occurrence to avoid turning
 * paragraphs into a sea of dotted underlines.
 */
export function findGlossaryTerms(text: string): GlossaryMatch[] {
  const out: GlossaryMatch[] = [];
  const seen = new Set<string>();
  const re = getMatcher();
  re.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const norm = m[1].toLowerCase().replace(/[\s-]+/g, " ");
    if (seen.has(norm)) continue;
    seen.add(norm);
    out.push({ term: m[1], index: m.index, length: m[1].length });
  }
  return out;
}
