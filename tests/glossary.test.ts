import { describe, expect, it } from "vitest";
import { explainTerm, findGlossaryTerms, GLOSSARY } from "../src/lib/glossary";

describe("explainTerm", () => {
  it("is case-insensitive", () => {
    expect(explainTerm("Placebo")).toBeDefined();
    expect(explainTerm("PLACEBO")).toBe(explainTerm("placebo"));
  });

  it("treats hyphens and spaces as equivalent", () => {
    expect(explainTerm("double blind")).toBe(GLOSSARY["double-blind"]);
    expect(explainTerm("open-label")).toBeDefined();
  });

  it("returns undefined for unknown terms", () => {
    expect(explainTerm("perfectly ordinary words")).toBeUndefined();
  });
});

describe("findGlossaryTerms", () => {
  it("finds terms and prefers the longest match", () => {
    const text = "This randomized double-blind study uses a placebo control.";
    const found = findGlossaryTerms(text).map((m) => m.term.toLowerCase());
    expect(found).toContain("randomized");
    expect(found).toContain("double-blind");
    expect(found).toContain("placebo");
  });

  it("annotates each term only once", () => {
    const text = "Placebo groups receive a placebo. The placebo is inert.";
    const found = findGlossaryTerms(text);
    expect(found.filter((m) => m.term.toLowerCase() === "placebo")).toHaveLength(1);
  });

  it("respects word boundaries", () => {
    // "arm" must not match inside "pharmacy" or "harmful".
    const found = findGlossaryTerms("The pharmacy dispensed nothing harmful.");
    expect(found.find((m) => m.term.toLowerCase() === "arm")).toBeUndefined();
  });

  it("returns matches with correct positions", () => {
    const text = "A placebo is used.";
    const [m] = findGlossaryTerms(text);
    expect(text.slice(m.index, m.index + m.length).toLowerCase()).toBe("placebo");
  });

  it("handles multi-word terms like ECOG performance status", () => {
    const found = findGlossaryTerms("ECOG performance status of 0 or 1 required.");
    expect(found.some((m) => m.term.toLowerCase().startsWith("ecog"))).toBe(true);
  });
});
