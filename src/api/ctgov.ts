/**
 * Typed client for the ClinicalTrials.gov API v2.
 * Docs: https://clinicaltrials.gov/data-api/api
 *
 * The API is free, requires no key, and allows cross-origin requests, which
 * is what lets Beacon run entirely in the browser.
 */

const BASE = "https://clinicaltrials.gov/api/v2";

export interface TrialContact {
  name?: string;
  role?: string;
  phone?: string;
  email?: string;
}

export interface TrialLocation {
  facility?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  lat?: number;
  lng?: number;
  contacts: TrialContact[];
}

export interface Intervention {
  type?: string;
  name?: string;
  description?: string;
}

export interface Trial {
  nctId: string;
  briefTitle: string;
  officialTitle?: string;
  overallStatus?: string;
  briefSummary?: string;
  detailedDescription?: string;
  conditions: string[];
  phases: string[];
  studyType?: string;
  enrollment?: number;
  minimumAge?: string;
  maximumAge?: string;
  sex?: string;
  healthyVolunteers?: boolean;
  eligibilityCriteria?: string;
  locations: TrialLocation[];
  centralContacts: TrialContact[];
  leadSponsor?: string;
  interventions: Intervention[];
  startDate?: string;
  primaryCompletionDate?: string;
  lastUpdateDate?: string;
}

export interface SearchParams {
  condition: string;
  lat?: number;
  lng?: number;
  radiusMiles?: number;
  pageToken?: string;
  pageSize?: number;
  /** Extra registry field names beyond the card set (used by the SEO generator). */
  extraFields?: string[];
}

export interface SearchResult {
  trials: Trial[];
  totalCount: number | null;
  nextPageToken: string | null;
}

const SEARCH_FIELDS = [
  "NCTId",
  "BriefTitle",
  "OverallStatus",
  "BriefSummary",
  "Condition",
  "Phase",
  "StudyType",
  "EnrollmentCount",
  "MinimumAge",
  "MaximumAge",
  "Sex",
  "HealthyVolunteers",
  "LocationFacility",
  "LocationCity",
  "LocationState",
  "LocationCountry",
  "LocationStatus",
  "LocationGeoPoint",
  "LeadSponsorName",
  "InterventionType",
  "InterventionName",
  "StartDate",
  "LastUpdatePostDate",
].join(",");

// The registry returns deeply nested modules; `any` at the boundary keeps the
// mapping readable, and mapStudy() normalizes into our typed Trial.
/* eslint-disable @typescript-eslint/no-explicit-any */

function mapStudy(study: any): Trial {
  const p = study?.protocolSection ?? {};
  const id = p.identificationModule ?? {};
  const status = p.statusModule ?? {};
  const desc = p.descriptionModule ?? {};
  const design = p.designModule ?? {};
  const elig = p.eligibilityModule ?? {};
  const cond = p.conditionsModule ?? {};
  const contactsLocs = p.contactsLocationsModule ?? {};
  const sponsor = p.sponsorCollaboratorsModule ?? {};
  const arms = p.armsInterventionsModule ?? {};

  const locations: TrialLocation[] = (contactsLocs.locations ?? []).map((l: any) => ({
    facility: l.facility,
    city: l.city,
    state: l.state,
    country: l.country,
    status: l.status,
    lat: l.geoPoint?.lat,
    lng: l.geoPoint?.lon,
    contacts: (l.contacts ?? []).map((c: any) => ({
      name: c.name,
      role: c.role,
      phone: c.phone ? `${c.phone}${c.phoneExt ? " ext. " + c.phoneExt : ""}` : undefined,
      email: c.email,
    })),
  }));

  return {
    nctId: id.nctId ?? "",
    briefTitle: id.briefTitle ?? id.officialTitle ?? "Untitled study",
    officialTitle: id.officialTitle,
    overallStatus: status.overallStatus,
    briefSummary: desc.briefSummary,
    detailedDescription: desc.detailedDescription,
    conditions: cond.conditions ?? [],
    phases: design.phases ?? [],
    studyType: design.studyType,
    enrollment: design.enrollmentInfo?.count,
    minimumAge: elig.minimumAge,
    maximumAge: elig.maximumAge,
    sex: elig.sex,
    healthyVolunteers: elig.healthyVolunteers,
    eligibilityCriteria: elig.eligibilityCriteria,
    locations,
    centralContacts: (contactsLocs.centralContacts ?? []).map((c: any) => ({
      name: c.name,
      role: c.role,
      phone: c.phone ? `${c.phone}${c.phoneExt ? " ext. " + c.phoneExt : ""}` : undefined,
      email: c.email,
    })),
    leadSponsor: sponsor.leadSponsor?.name,
    interventions: (arms.interventions ?? []).map((i: any) => ({
      type: i.type,
      name: i.name,
      description: i.description,
    })),
    startDate: status.startDateStruct?.date,
    primaryCompletionDate: status.primaryCompletionDateStruct?.date,
    lastUpdateDate: status.lastUpdatePostDateStruct?.date,
  };
}

export async function searchStudies(params: SearchParams): Promise<SearchResult> {
  const q = new URLSearchParams();
  q.set("query.cond", params.condition);
  q.set("filter.overallStatus", "RECRUITING,NOT_YET_RECRUITING");
  if (params.lat != null && params.lng != null && params.radiusMiles) {
    q.set(
      "filter.geo",
      `distance(${params.lat.toFixed(4)},${params.lng.toFixed(4)},${params.radiusMiles}mi)`,
    );
  }
  q.set("fields", [SEARCH_FIELDS, ...(params.extraFields ?? [])].join(","));
  q.set("pageSize", String(params.pageSize ?? 20));
  q.set("countTotal", "true");
  q.set("sort", "@relevance");
  if (params.pageToken) q.set("pageToken", params.pageToken);

  const res = await fetch(`${BASE}/studies?${q}`);
  if (!res.ok) {
    throw new Error(`ClinicalTrials.gov returned ${res.status}. Please try again in a moment.`);
  }
  const data = await res.json();
  return {
    trials: (data.studies ?? []).map(mapStudy),
    totalCount: data.totalCount ?? null,
    nextPageToken: data.nextPageToken ?? null,
  };
}

/** Lightweight ID-only search used by watched-search new-trial detection. */
export async function searchStudyIds(params: SearchParams): Promise<string[]> {
  const q = new URLSearchParams();
  q.set("query.cond", params.condition);
  q.set("filter.overallStatus", "RECRUITING,NOT_YET_RECRUITING");
  if (params.lat != null && params.lng != null && params.radiusMiles) {
    q.set(
      "filter.geo",
      `distance(${params.lat.toFixed(4)},${params.lng.toFixed(4)},${params.radiusMiles}mi)`,
    );
  }
  q.set("fields", "NCTId");
  q.set("pageSize", "200");
  const res = await fetch(`${BASE}/studies?${q}`);
  if (!res.ok) throw new Error(`ClinicalTrials.gov returned ${res.status}.`);
  const data = await res.json();
  return (data.studies ?? [])
    .map((s: any) => s?.protocolSection?.identificationModule?.nctId)
    .filter(Boolean);
}

export async function getStudy(nctId: string): Promise<Trial> {
  const safe = encodeURIComponent(nctId.trim().toUpperCase());
  const res = await fetch(`${BASE}/studies/${safe}`);
  if (!res.ok) {
    throw new Error(
      res.status === 404
        ? `Study ${nctId} was not found in the registry.`
        : `ClinicalTrials.gov returned ${res.status}. Please try again in a moment.`,
    );
  }
  return mapStudy(await res.json());
}

/** Link to the official registry record — always shown so users can verify. */
export function officialUrl(nctId: string): string {
  return `https://clinicaltrials.gov/study/${encodeURIComponent(nctId)}`;
}
