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

## Strategy (updated after competitive research, July 2026)

Every funded competitor (Power ~31k trials, Massive Bio ~19k, Leal Health ~20k, TrialFinderData ~8k) covers a **curated subset** of the registry — because their referral/recruitment business models only monetize trials they have relationships with. Nobody offers **full-registry coverage + per-trial plain-language translation + zero data collection**. That combination is Beacon's identity, and it is structurally hard for referral businesses to copy without breaking their own economics. Peer-reviewed evidence says the default destination fails patients: 57% of eligible trials were not discoverable via ClinicalTrials.gov's own search even though they were listed there (PMC12193830).

Roadmap, in order:

1. **Distribution via programmatic SEO** — pre-render plain-language pages per condition × region from the live registry. The static architecture makes this nearly free; a smaller player (TrialFinderData) is validating the channel at ~8k-trial scale.
2. **Zero-data embeddable widget** for patient advocacy orgs and clinics — Antidote proved the widget channel with 300+ partners; a widget that collects nothing needs no privacy/legal review to adopt.
3. **Lay-vocabulary search expansion** ("skin cancer" → melanoma, basal cell…) — directly attacks the 57%-undiscoverable problem, which is largely a query-formulation failure.
4. **LLM eligibility pre-screening** ("answer 5 questions to see which criteria may apply") — NIH's TrialGPT research cut screening time 42.6% but shipped no patient product; this remains unshipped industry-wide at full-registry scale.
5. **Multilingual UI** — discovery gaps are worst for non-English speakers; no competitor leads here.
6. Email alerts for new matching trials (needs a minimal backend; strictly opt-in, holds only an email + a search query).

Deliberately **not** on the roadmap: sponsor-paid patient referrals. That model is why every competitor ends up with curated subsets and data collection. Beacon's long-term value is being the neutral, complete, private layer — trust is the moat.

## The important disclaimer

Beacon is an information tool, **not medical advice**. Whether a trial is right for you is a decision for you, your doctor, and the study team. Trial data comes from ClinicalTrials.gov and may change; always confirm details with the study team.

---

*Data: ClinicalTrials.gov, U.S. National Library of Medicine. Location search: © OpenStreetMap contributors (Nominatim).*
