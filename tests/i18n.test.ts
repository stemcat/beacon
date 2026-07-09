import { describe, expect, it } from "vitest";
import { expandCondition } from "../src/lib/conditions";
import { t, tn } from "../src/lib/i18n";

describe("t (English default)", () => {
  it("returns the English key untouched", () => {
    expect(t("Search")).toBe("Search");
  });
  it("substitutes placeholders", () => {
    expect(t("{done} of {total} points reviewed", { done: 2, total: 26 })).toBe(
      "2 of 26 points reviewed",
    );
  });
});

describe("tn plurals", () => {
  it("selects singular and plural keys", () => {
    expect(tn(1, "{n} new trial", "{n} new trials")).toBe("1 new trial");
    expect(tn(3, "{n} new trial", "{n} new trials")).toBe("3 new trials");
  });
});

describe("French/Spanish condition input", () => {
  it("maps French condition names to English registry terms", () => {
    expect(expandCondition("cancer du sein").query).toContain("breast cancer");
    expect(expandCondition("sclérose en plaques").query).toContain("multiple sclerosis");
  });
  it("matches with or without accents", () => {
    expect(expandCondition("mélanome").query).toContain("melanoma");
    expect(expandCondition("melanome").query).toContain("melanoma");
    expect(expandCondition("cancer du côlon").query).toContain("colorectal cancer");
    expect(expandCondition("cancer du colon").query).toContain("colorectal cancer");
  });
  it("maps Spanish condition names to English registry terms", () => {
    expect(expandCondition("cáncer de mama").query).toContain("breast cancer");
    expect(expandCondition("presión alta").query).toContain("hypertension");
    expect(expandCondition("presion alta").query).toContain("hypertension");
  });
});
