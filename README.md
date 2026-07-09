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
- **Interactive self-check.** Mark each criterion "true for me / not true / not sure" — the "not sure" list becomes your agenda for the study team. Marks stay on your device.
- **Speaks patient, searches doctor.** Lay vocabulary is widened into registry terms ("skin cancer" also searches melanoma, basal cell, squamous cell) — attacking the documented 57% discoverability gap.
- **Distance that matters.** Sites are sorted by how far they are from *you*, because trials mean regular visits.
- **Watched searches, zero servers.** Watch a search and Beacon re-checks it in your browser on every visit, flagging newly opened trials. Nobody — including us — knows what you're watching.
- **Honest by design.** Beacon never determines eligibility, never editorializes efficacy, and links every trial to its official registry record. It flags trials whose age/sex requirements may not match — it doesn't hide them.
- **Privacy is absolute.** Searches go straight from the browser to the public registry — no accounts, no analytics, no tracking, ever. Saved trials, self-check marks, and watched searches live in `localStorage` only. A CSP technically enforces the allowed destinations. The only server-side features are strictly opt-in (email alerts and the contact form) and each states exactly what it touches.
- **Built for the appointment.** Save promising trials, then print a summary — with registry IDs — to hand to your doctor. Plus an auto-generated "questions to ask" list tailored to each study.
- **English, français, español.** UI chrome is fully translated (registry content remains English, clearly noted).
- **Embeddable anywhere.** Advocacy orgs and clinics get a one-line `<script>` widget (`#/partners`) — zero-data, so there's nothing for their legal team to review.
- **Findable.** `npm run seo` generates static plain-language pages for 72 conditions and ~2,000 trials (FAQ + MedicalStudy structured data, sitemap) — the programmatic SEO engine that makes Beacon discoverable where patients actually start: a search box.

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
npm run dev            # local dev server
npm test               # unit tests (parser, glossary, conditions, formatting)
npm run e2e            # live smoke test against the real registry
npm run build          # production build → dist/
npm run seo            # generate static SEO pages into dist/ (set BEACON_BASE_URL)
npm run build:launch   # build + SEO in one step
```

## Launch checklist (Canada-first)

Production: **https://beacontrials.ca** (Vercel; repo `stemcat/beacon`; `vercel.json` runs the SEO generator on every deploy).

1. ~~Register `.ca` domain~~ ✅ `beacontrials.ca`
2. ~~Deploy~~ ✅ Vercel, auto-deploys on push to `main`; app + widget + 2,794-URL bilingual sitemap verified live
3. Once the domain is Valid in Vercel: set env var `BEACON_BASE_URL=https://beacontrials.ca` (pins canonicals — auto-detect picks Vercel's *shortest* custom domain, which a future redirect domain could hijack), then **redeploy once** so sitemap/canonical/hreflang switch from the vercel.app URL.
4. Daily SEO refresh: create a Vercel Deploy Hook (branch `main`) and save it as GitHub secret `VERCEL_DEPLOY_HOOK_URL` — `.github/workflows/daily-refresh.yml` triggers it daily at 06:00 UTC.
5. Google Search Console: add `beacontrials.ca` as a Domain property (DNS TXT), submit `https://beacontrials.ca/sitemap.xml`. Bonus: import into Bing Webmaster Tools (older demographic skews Bing).
6. Offer the widget (`/#/partners`) to Canadian advocacy orgs first — MS Canada, Canadian Cancer Society, Diabetes Canada, and Quebec orgs where the French widget + Law 25 compliance is an unmatched pitch.
7. Before promoting Spanish, have a native speaker review the ~160 strings in `src/lib/i18n.ts` (French is reviewed; Spanish is drafted).

## Strategy (updated after competitive research, July 2026)

Every funded competitor (Power ~31k trials, Massive Bio ~19k, Leal Health ~20k, TrialFinderData ~8k) covers a **curated subset** of the registry — because their referral/recruitment business models only monetize trials they have relationships with. Nobody offers **full-registry coverage + per-trial plain-language translation + zero data collection**. That combination is Beacon's identity, and it is structurally hard for referral businesses to copy without breaking their own economics. Peer-reviewed evidence says the default destination fails patients: 57% of eligible trials were not discoverable via ClinicalTrials.gov's own search even though they were listed there (PMC12193830).

**Go-to-market: Canada-first.** The product stays global (cross-border trials are often a Canadian patient's nearest option — the search deliberately includes US border sites), but every distribution surface targets Canada:

- **3,590 recruiting trials** currently have a Canadian site (1,358 in Quebec) — real inventory, and Health Canada requires registration in ClinicalTrials.gov, so coverage is complete.
- **Every funded competitor is US-centric and English-only.** Nobody competes for "essais cliniques cancer du sein Montréal" — or seriously for "clinical trials Toronto."
- **The bilingual UI is a structural moat in Quebec**, where French capability is a requirement for health organizations, and US competitors won't build it for 8M people.
- **Quebec's Law 25 + PIPEDA favor us by design:** the zero-data widget is the only one a Canadian clinic can embed with nothing for their privacy officer to review.
- The SEO generator emits **bilingual pages**: 72 Canada-national condition pages + 30 conditions × 12 metros, in English and French with hreflang pairing.

Roadmap status:

1. ~~Programmatic SEO~~ ✅ shipped (Canada-first, bilingual)
2. ~~Zero-data embeddable widget~~ ✅ shipped (`#/partners`, leads with Law 25/PIPEDA)
3. ~~Lay-vocabulary search expansion~~ ✅ shipped (EN + FR + ES condition names, accent-folded)
4. ~~Multilingual UI~~ ✅ shipped (EN/FR reviewed; ES pending native review)
5. **AI cross-trial screening** — deliberately deferred. A per-trial AI questionnaire was shipped, then removed: paraphrasing medical criteria risks false confidence and duplicated the verbatim self-check. If AI returns, it's as "answer once, screen all results" triage on the results page (the TrialGPT-validated pattern), reusing the public-text-only architecture in git history.
6. Email alerts for new matching trials (needs a minimal backend; strictly opt-in) — interim: client-side watched searches, already shipped

Deliberately **not** on the roadmap: sponsor-paid patient referrals. That model is why every competitor ends up with curated subsets and data collection. Beacon's long-term value is being the neutral, complete, private layer — trust is the moat.

## Optional backend features (email alerts + contact form)

The core product needs no backend. Two opt-in features use Vercel Edge Functions in `api/`, and both stay dark (UI hidden, endpoints return 503) until configured:

**Email alerts** (`/api/alerts/*`) — double opt-in, daily cron (`vercel.json`), one-click unsubscribe that deletes everything. Stores only: email, the watched search, language, seen trial IDs. Unconfirmed signups auto-purge after 7 days.

Setup (all free tiers; add env vars in Vercel → Settings → Environment Variables):

| Env var | Service | Free tier |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | [upstash.com](https://upstash.com) Redis (or Vercel Marketplace) | 10k commands/day |
| `RESEND_API_KEY` | [resend.com](https://resend.com) — verify the beacontrials.ca domain (DNS records) | 3,000 emails/month |
| `ALERTS_FROM_EMAIL` | e.g. `Beacon <alerts@beacontrials.ca>` | — |
| `CRON_SECRET` | any random string — Vercel uses it to authenticate the daily cron | — |

## The important disclaimer

Beacon is an information tool, **not medical advice**. Whether a trial is right for you is a decision for you, your doctor, and the study team. Trial data comes from ClinicalTrials.gov and may change; always confirm details with the study team.

---

*Data: ClinicalTrials.gov, U.S. National Library of Medicine. Location search: © OpenStreetMap contributors (Nominatim).*
