/**
 * Live end-to-end smoke test (network required): exercises the production
 * modules against the real ClinicalTrials.gov API, mirroring the user flow —
 * wizard search (melanoma near Montreal, 100 mi) → results → pagination →
 * open detail → parse eligibility → nearest-site distance → glossary.
 *
 * Run with: npm run e2e
 */
import { searchStudies, getStudy } from "../src/api/ctgov";
import { parseEligibility } from "../src/lib/eligibility";
import { haversineMiles } from "../src/api/geocode";
import { parseAgeYears } from "../src/lib/format";
import { findGlossaryTerms } from "../src/lib/glossary";

const montreal = { lat: 45.5017, lng: -73.5673 };

const fail = (msg: string): never => {
  console.error("❌ " + msg);
  process.exit(1);
};

// 1. Search as the wizard would
const res = await searchStudies({ condition: "melanoma", ...montreal, radiusMiles: 100 });
console.log(
  `1. Search: ${res.totalCount} recruiting melanoma trials within 100mi of Montreal; page has ${res.trials.length}; hasNextPage=${!!res.nextPageToken}`,
);
if (!res.trials.length) fail("no trials returned");
if (res.trials.some((t) => !t.nctId || !t.briefTitle)) fail("trial missing id/title");

// 2. Pagination
if (res.nextPageToken) {
  const page2 = await searchStudies({
    condition: "melanoma",
    ...montreal,
    radiusMiles: 100,
    pageToken: res.nextPageToken,
  });
  console.log(`2. Pagination: page 2 has ${page2.trials.length} trials`);
  if (page2.trials[0]?.nctId === res.trials[0]?.nctId) fail("page 2 repeats page 1");
} else {
  console.log("2. Pagination: single page (ok)");
}

// 3. Nearest-site distance, as the result cards compute it
const withGeo = res.trials.find((t) => t.locations.some((l) => l.lat != null));
if (!withGeo) fail("no trial with geo-tagged sites");
const nearest = Math.min(
  ...withGeo!.locations
    .filter((l) => l.lat != null)
    .map((l) => haversineMiles(montreal, { lat: l.lat!, lng: l.lng! })),
);
console.log(`3. Distance: nearest site for ${withGeo!.nctId} is ${nearest.toFixed(1)} mi`);
// The radius filter matches trials with ANY site in range; nearest listed site
// of a matched trial should be within the radius (small slack for geocoding).
if (!(nearest >= 0 && nearest <= 110)) fail("nearest site outside the 100mi radius (+slack)");

// 4. Detail fetch + eligibility parsing across several real studies
let parsedCount = 0;
for (const t of res.trials.slice(0, 5)) {
  const full = await getStudy(t.nctId);
  if (!full.eligibilityCriteria) continue;
  const parsed = parseEligibility(full.eligibilityCriteria);
  if (parsed.parsed) {
    parsedCount++;
    const items = parsed.sections.reduce((n, s) => n + s.items.length, 0);
    console.log(`4. ${t.nctId}: parsed ${parsed.sections.length} sections, ${items} criteria items`);
  } else {
    console.log(`4. ${t.nctId}: fell back to raw text (acceptable)`);
  }
}
if (parsedCount === 0) fail("eligibility parser failed on all 5 real studies");

// 5. Age parsing on real registry values
const t0 = res.trials[0];
console.log(
  `5. Age/sex fields: ${t0.nctId} minAge=${t0.minimumAge} (${parseAgeYears(t0.minimumAge)} yrs), sex=${t0.sex}`,
);

// 6. Glossary annotation on a real summary
const summary = res.trials.map((t) => t.briefSummary).find(Boolean) ?? "";
console.log(`6. Glossary: ${findGlossaryTerms(summary).length} terms annotated in a real summary`);

console.log("\n✅ End-to-end flow verified against the live registry.");
