import { describe, expect, it } from "vitest";
import { parseEligibility, unescapeCriteria } from "../src/lib/eligibility";

// Real excerpts from ClinicalTrials.gov records, fetched 2026-07-08.

const NUMBERED_STYLE = `Inclusion Criteria:

1. Ability to understand and willingness to sign written informed consent before performance of any study procedures
2. Age ≥ 18 years
3. Participants with solid tumors or lymphomas, confirmed by available histopathology records
4. Participants must have a minimum of one injectable and measurable lesion.

Exclusion Criteria: Patients will be excluded from this study if they meet any of the following criteria (Part 1a and Part 1b).

1. Other malignancy active within the previous 2 years except for basal or squamous cell skin cancer
2. Prior organ transplant`;

const STAR_STYLE_WITH_NESTING = `Inclusion Criteria:

* Male or female participants aged 18 years or older at Screening.
* Histologically confirmed unresectable Stage IIIB to IV metastatic melanoma.
* ECOG performance status of 0 or 1 at Screening.

Exclusion Criteria:

* Uncontrolled intercurrent illness, including but not limited to:

  * Active systemic infection or fever ≥ 38°C within 5 days prior to Screening
  * Symptomatic congestive heart failure
* Pregnant or breast-feeding women.`;

const HYBRID_ENUMERATOR_STYLE = `Inclusion Criteria:

* 1\\. Patients with one of the following cancer types: urothelial carcinoma, renal carcinoma
* 2\\. Metastatic disease for which the treatment has not been initiated yet
* 3\\. Age ≥ 18 years

Exclusion Criteria:

* 1\\. Patient with localized disease.
* 2\\. Pregnant or breast-feeding women.`;

const MAIN_PREFIX_STYLE = `Main Inclusion Criteria:

* Age ≥ 18 years old
* Diagnosis of diabetes mellitus based on self-reported history
* Gender: males and females

Main Exclusion Criteria:

* Patients with significantly reduced life expectancy (less than 5 years)
* With Drug abuse`;

describe("unescapeCriteria", () => {
  it("removes registry markdown escapes", () => {
    expect(unescapeCriteria("HIV viral load \\<400 copies/mL")).toBe("HIV viral load <400 copies/mL");
    expect(unescapeCriteria("1\\. First item")).toBe("1. First item");
    expect(unescapeCriteria("males \\< 40 mg/dL")).toBe("males < 40 mg/dL");
  });
});

describe("parseEligibility", () => {
  it("parses numbered criteria with prose after the exclusion header", () => {
    const result = parseEligibility(NUMBERED_STYLE);
    expect(result.parsed).toBe(true);
    const [inc, exc] = result.sections;
    expect(inc.kind).toBe("inclusion");
    expect(inc.items).toHaveLength(4);
    expect(inc.items[1].text).toContain("Age ≥ 18 years");
    expect(exc.kind).toBe("exclusion");
    expect(exc.preamble).toContain("Patients will be excluded");
    expect(exc.items).toHaveLength(2);
  });

  it("parses star bullets and keeps nested sub-bullets as children", () => {
    const result = parseEligibility(STAR_STYLE_WITH_NESTING);
    expect(result.parsed).toBe(true);
    const exc = result.sections.find((s) => s.kind === "exclusion")!;
    expect(exc.items).toHaveLength(2);
    expect(exc.items[0].text).toContain("Uncontrolled intercurrent illness");
    expect(exc.items[0].children).toHaveLength(2);
    expect(exc.items[0].children[0]).toContain("Active systemic infection");
    expect(exc.items[1].text).toContain("Pregnant");
  });

  it("strips redundant enumerators in hybrid '* 1.' bullets", () => {
    const result = parseEligibility(HYBRID_ENUMERATOR_STYLE);
    expect(result.parsed).toBe(true);
    const inc = result.sections.find((s) => s.kind === "inclusion")!;
    expect(inc.items).toHaveLength(3);
    expect(inc.items[0].text).toMatch(/^Patients with one of the following/);
    expect(inc.items[2].text).toBe("Age ≥ 18 years");
  });

  it("recognizes 'Main Inclusion Criteria' header variants", () => {
    const result = parseEligibility(MAIN_PREFIX_STYLE);
    expect(result.parsed).toBe(true);
    expect(result.sections.map((s) => s.kind)).toEqual(["inclusion", "exclusion"]);
    expect(result.sections[0].items).toHaveLength(3);
    expect(result.sections[1].items).toHaveLength(2);
  });

  it("joins wrapped continuation lines into the previous bullet", () => {
    const wrapped = `Inclusion Criteria:\n\n1. Patients must have adequate organ function\nas defined by laboratory values\n2. Second criterion`;
    const result = parseEligibility(wrapped);
    const inc = result.sections[0];
    expect(inc.items).toHaveLength(2);
    expect(inc.items[0].text).toBe(
      "Patients must have adequate organ function as defined by laboratory values",
    );
  });

  it("falls back gracefully when there is no recognizable structure", () => {
    const prose = "Participants must be adults in generally good health, per investigator judgment.";
    const result = parseEligibility(prose);
    expect(result.parsed).toBe(false);
    expect(result.raw).toBe(prose);
  });

  it("handles empty input", () => {
    const result = parseEligibility("");
    expect(result.parsed).toBe(false);
    expect(result.sections).toHaveLength(0);
  });
});
