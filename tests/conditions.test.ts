import { describe, expect, it } from "vitest";
import { expandCondition, suggestConditions } from "../src/lib/conditions";

describe("expandCondition", () => {
  it("widens umbrella lay terms into an OR expression", () => {
    const r = expandCondition("skin cancer");
    expect(r.query).toBe("(skin cancer OR melanoma OR basal cell carcinoma OR squamous cell carcinoma)");
    expect(r.added).toEqual(["melanoma", "basal cell carcinoma", "squamous cell carcinoma"]);
  });

  it("maps eponyms and abbreviations", () => {
    expect(expandCondition("Lou Gehrig's disease").query).toContain("amyotrophic lateral sclerosis");
    expect(expandCondition("ALS").query).toContain("amyotrophic lateral sclerosis");
    expect(expandCondition("COLON CANCER").query).toContain("colorectal cancer");
  });

  it("passes unknown conditions through unchanged", () => {
    const r = expandCondition("melanoma");
    expect(r.query).toBe("melanoma");
    expect(r.added).toEqual([]);
  });

  it("does not re-add a term the user already typed", () => {
    const r = expandCondition("dementia");
    expect(r.added).not.toContain("dementia");
    expect(r.added).toContain("Alzheimer disease");
  });

  it("handles empty and whitespace input", () => {
    expect(expandCondition("").query).toBe("");
    expect(expandCondition("  ").added).toEqual([]);
  });
});

describe("suggestConditions", () => {
  it("suggests by prefix first", () => {
    const s = suggestConditions("lu");
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].startsWith("lu")).toBe(true);
  });

  it("requires at least two characters", () => {
    expect(suggestConditions("l")).toEqual([]);
  });

  it("caps the suggestion count", () => {
    expect(suggestConditions("ca", 4).length).toBeLessThanOrEqual(4);
  });
});
