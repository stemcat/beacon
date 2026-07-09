import { describe, expect, it } from "vitest";
import { itemStatus, summarize, type PreScreenItem } from "../src/lib/prescreen";

const inclusionMeets: PreScreenItem = {
  question: "Are you 18 or older?",
  kind: "inclusion",
  yesMeans: "meets",
  criterion: "Age ≥ 18 years",
};

const exclusionConflicts: PreScreenItem = {
  question: "Are you currently pregnant?",
  kind: "exclusion",
  yesMeans: "conflicts",
  criterion: "Pregnant or breast-feeding women",
};

describe("itemStatus", () => {
  it("inclusion criterion: yes meets, no concerns", () => {
    expect(itemStatus(inclusionMeets, "yes")).toBe("ok");
    expect(itemStatus(inclusionMeets, "no")).toBe("concern");
    expect(itemStatus(inclusionMeets, "unsure")).toBe("unsure");
  });

  it("exclusion criterion: yes conflicts, no is fine", () => {
    expect(itemStatus(exclusionConflicts, "yes")).toBe("concern");
    expect(itemStatus(exclusionConflicts, "no")).toBe("ok");
    expect(itemStatus(exclusionConflicts, "unsure")).toBe("unsure");
  });
});

describe("summarize", () => {
  const items = [inclusionMeets, exclusionConflicts];

  it("counts answered, ok, concerns, and unsure", () => {
    const s = summarize(items, { 0: "yes", 1: "yes" });
    expect(s.answered).toBe(2);
    expect(s.ok).toBe(1);
    expect(s.concerns).toBe(1);
    expect(s.concernItems[0].criterion).toContain("Pregnant");
  });

  it("ignores unanswered questions", () => {
    const s = summarize(items, { 0: "unsure" });
    expect(s.answered).toBe(1);
    expect(s.unsure).toBe(1);
    expect(s.total).toBe(2);
  });

  it("handles empty questionnaires", () => {
    const s = summarize([], {});
    expect(s.answered).toBe(0);
    expect(s.total).toBe(0);
  });
});
