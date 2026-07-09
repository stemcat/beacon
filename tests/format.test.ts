import { describe, expect, it } from "vitest";
import { haversineMiles } from "../src/api/geocode";
import { radiusKmLabel, setUnit, unitForLocale } from "../src/lib/units";
import {
  formatAgeRange,
  formatDate,
  formatDistance,
  formatPhases,
  formatStatus,
  parseAgeYears,
  statusTone,
} from "../src/lib/format";

describe("parseAgeYears", () => {
  it("parses years, months, and weeks", () => {
    expect(parseAgeYears("18 Years")).toBe(18);
    expect(parseAgeYears("6 Months")).toBeCloseTo(0.5);
    expect(parseAgeYears("52 Weeks")).toBeCloseTo(1);
  });
  it("returns null for missing or N/A values", () => {
    expect(parseAgeYears(undefined)).toBeNull();
    expect(parseAgeYears("N/A")).toBeNull();
  });
});

describe("formatAgeRange", () => {
  it("formats open-ended and bounded ranges", () => {
    expect(formatAgeRange("18 Years", undefined)).toBe("18 and older");
    expect(formatAgeRange("18 Years", "65 Years")).toBe("18 to 65");
    expect(formatAgeRange(undefined, undefined)).toBe("All ages");
  });
});

describe("formatPhases", () => {
  it("formats single and combined phases", () => {
    expect(formatPhases(["PHASE1"])).toBe("Phase 1");
    expect(formatPhases(["PHASE1", "PHASE2"])).toBe("Phase 1/2");
    expect(formatPhases(["EARLY_PHASE1"])).toBe("Early Phase 1");
  });
  it("returns null when not applicable", () => {
    expect(formatPhases(["NA"])).toBeNull();
    expect(formatPhases([])).toBeNull();
    expect(formatPhases(undefined)).toBeNull();
  });
});

describe("status formatting", () => {
  it("maps registry statuses to human labels and tones", () => {
    expect(formatStatus("RECRUITING")).toBe("Recruiting now");
    expect(statusTone("RECRUITING")).toBe("good");
    expect(formatStatus("NOT_YET_RECRUITING")).toBe("Opening soon");
    expect(statusTone("COMPLETED")).toBe("muted");
  });
});

describe("formatDate", () => {
  it("formats year-month and year-only dates", () => {
    expect(formatDate("2023-10-13")).toBe("Oct 2023");
    expect(formatDate("2026-04")).toBe("Apr 2026");
    expect(formatDate("2026")).toBe("2026");
    expect(formatDate(undefined)).toBeNull();
  });
});

describe("haversineMiles", () => {
  it("computes known distances within tolerance", () => {
    const montreal = { lat: 45.5017, lng: -73.5673 };
    const toronto = { lat: 43.6532, lng: -79.3832 };
    const miles = haversineMiles(montreal, toronto);
    expect(miles).toBeGreaterThan(300); // real-world ≈ 313 mi
    expect(miles).toBeLessThan(325);
  });
  it("is zero for identical points", () => {
    expect(haversineMiles({ lat: 45, lng: -73 }, { lat: 45, lng: -73 })).toBe(0);
  });
});

describe("formatDistance", () => {
  it("adapts precision to magnitude (miles default outside a browser)", () => {
    expect(formatDistance(0.4)).toBe("under 1 mi");
    expect(formatDistance(3.14)).toBe("3.1 mi");
    expect(formatDistance(42.7)).toBe("43 mi");
  });

  it("converts to km when the unit is km", () => {
    setUnit("km");
    expect(formatDistance(0.4)).toBe("under 1 km");
    expect(formatDistance(3.14)).toBe("5.1 km");
    expect(formatDistance(100)).toBe("161 km");
    setUnit("mi");
  });
});

describe("units", () => {
  it("defaults by locale region: Canada km, US miles", () => {
    expect(unitForLocale("en-CA")).toBe("km");
    expect(unitForLocale("fr-CA")).toBe("km");
    expect(unitForLocale("en-US")).toBe("mi");
    expect(unitForLocale("en-GB")).toBe("mi");
    expect(unitForLocale("es-MX")).toBe("km");
    expect(unitForLocale("fr")).toBe("km");
    expect(unitForLocale("en")).toBe("mi");
  });

  it("rounds radius km labels to friendly values", () => {
    expect(radiusKmLabel(25)).toBe(40);
    expect(radiusKmLabel(50)).toBe(80);
    expect(radiusKmLabel(100)).toBe(160);
    expect(radiusKmLabel(250)).toBe(400);
  });
});
