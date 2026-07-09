# 🔆 Beacon

**Find the clinical trial that could change your life.**

Beacon is a patient-first clinical trial finder. Answer a few plain questions — condition, age, location — and get recruiting trials near you, translated into human language: what the trial tests, what the study team will check before you can join, who to call, and what questions to bring to your doctor.

**Live data. Zero servers. Free for patients, forever.**

## Why this exists

- **~80% of clinical trials are delayed** because they can't recruit enough participants.
- **Fewer than 5% of eligible cancer patients** ever enroll in a trial.
- The data to fix this is public: ClinicalTrials.gov lists **590,000+ studies** with eligibility criteria, site locations, and contact info — but its interface was built for researchers, not for a scared person who just got a diagnosis.

Beacon is the missing translation layer. Every patient matched is a trial accelerated; every trial accelerated is a treatment that arrives sooner for everyone.

## What makes it different

- **Plain language everywhere.** Eligibility criteria are parsed into readable "you may/may not be able to join if…" checklists. Medical jargon gets tap-to-see explanations (60+ term glossary).
- **Distance that matters.** Sites are sorted by how far they are from *you*, because trials mean regular visits.
- **Honest by design.** Beacon never determines eligibility, never editorializes efficacy, and links every trial to its official registry record. It flags trials whose age/sex requirements may not match — it doesn't hide them.
- **Privacy is absolute.** There is no backend. Searches go straight from the browser to the public registry. No accounts, no analytics, no tracking, ever. Saved trials live in `localStorage` only.
- **Built for the appointment.** Save promising trials, then print a summary — with registry IDs — to hand to your doctor. Plus an auto-generated "questions to ask" list tailored to each study.

## Architecture

A fully static single-page app — no API keys, no ops, $0 hosting.

- **Data:** [ClinicalTrials.gov API v2](https://clinicaltrials.gov/data-api/api) (free, CORS-open, queried directly from the browser)
- **Geocoding:** browser geolocation, with OpenStreetMap Nominatim as text-search fallback
- **Stack:** Vite + React + TypeScript, zero runtime dependencies beyond React (~75 KB gzipped total)
- **Routing:** hash-based, so searches are shareable URLs and any static host works with no config

```
src/
  api/ctgov.ts        typed ClinicalTrials.gov client
  api/geocode.ts      geolocation + Nominatim + haversine
  lib/eligibility.ts  criteria-blob → structured checklist parser
  lib/glossary.ts     medical jargon → plain language
  lib/format.ts       phases, statuses, ages, dates, distances
  state/saved.ts      localStorage saved-trials store
  components/         wizard, results, trial detail, saved list
```

## Run it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (parser, glossary, formatting)
npm run e2e        # live smoke test against the real registry
npm run build      # production build → dist/
```

Deploy `dist/` to any static host — Vercel, Netlify, GitHub Pages, Cloudflare Pages. No environment variables needed.

## Roadmap

- Email/push alerts when a new matching trial opens (needs a tiny backend — privacy model: alerts opt-in only)
- LLM-assisted eligibility pre-screening chat ("answer 5 questions to see which criteria may apply to you")
- Multilingual UI — trial discovery gaps are worst for non-English speakers
- Condition autocomplete tuned to lay vocabulary ("skin cancer" → melanoma, basal cell…)
- Sponsor-side recruitment tools — the business model that keeps the patient side free forever

## The important disclaimer

Beacon is an information tool, **not medical advice**. Whether a trial is right for you is a decision for you, your doctor, and the study team. Trial data comes from ClinicalTrials.gov and may change; always confirm details with the study team.

---

*Data: ClinicalTrials.gov, U.S. National Library of Medicine. Location search: © OpenStreetMap contributors (Nominatim).*
