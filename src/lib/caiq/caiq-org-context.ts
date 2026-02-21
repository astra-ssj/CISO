/**
 * CAIQ Organization Context — Builds OrganizationContext from Astra-CISO data stores.
 * Connects the CAIQ engine to the platform so answers are org-specific.
 */

import type {
  OrganizationContext,
  OrgControl,
  CAIQDomain,
  CloudModel,
  OrgSize,
} from './types';
import { COMPLIANCE_FRAMEWORKS, type FrameworkID } from '@/lib/compliance-frameworks';
import { useEvidenceStore } from '@/lib/evidence-store';
import { usePolicyStore } from '@/lib/policy-store';
import { getKnowledgeBase, getEntryByQuestionId, getEntriesByDomain } from './caiq-knowledge-base';

// -----------------------------------------------------------------------------
// Framework name mapping: Astra FrameworkID <-> CAIQ-expected display names
// -----------------------------------------------------------------------------

const FRAMEWORK_ID_TO_CAIQ_NAME: Record<FrameworkID, string> = {
  GDPR: 'GDPR',
  EU_AI_ACT: 'EU AI Act',
  NIST_CSF_2_0: 'NIST CSF 2.0',
  ISO_27001_2022: 'ISO 27001:2022',
  NIS2: 'NIS2',
};

/** Normalize policy/evidence framework id to our FrameworkID (e.g. ISO_27001 -> ISO_27001_2022). */
const NORMALIZE_FRAMEWORK_ID: Record<string, FrameworkID> = {
  ISO_27001: 'ISO_27001_2022',
  'ISO_27001_2022': 'ISO_27001_2022',
  NIST_CSF: 'NIST_CSF_2_0',
  NIST_CSF_2_0: 'NIST_CSF_2_0',
  GDPR: 'GDPR',
  NIS2: 'NIS2',
  EU_AI_ACT: 'EU_AI_ACT',
  SOC2: 'NIST_CSF_2_0',
  NIST_800_53: 'NIST_CSF_2_0',
};

/** KB uses display names like "ISO 27001:2022"; map to FrameworkID for evidence lookup. */
const CAIQ_NAME_TO_FRAMEWORK_ID: Record<string, FrameworkID> = {
  'ISO 27001:2022': 'ISO_27001_2022',
  'NIST CSF 2.0': 'NIST_CSF_2_0',
  GDPR: 'GDPR',
  NIS2: 'NIS2',
  'EU AI Act': 'EU_AI_ACT',
};

function normalizeToFrameworkId(frameworkOrId: string): FrameworkID | undefined {
  const key = frameworkOrId.trim();
  return NORMALIZE_FRAMEWORK_ID[key] ?? CAIQ_NAME_TO_FRAMEWORK_ID[key] ?? (key as FrameworkID);
}

function frameworkIdToCAIQName(id: string): string {
  return FRAMEWORK_ID_TO_CAIQ_NAME[id as FrameworkID] ?? id;
}

// -----------------------------------------------------------------------------
// Defaults when stores or env are missing
// -----------------------------------------------------------------------------

const DEFAULT_ORG_NAME = 'Organization';
const DEFAULT_INDUSTRY = 'Technology';
const DEFAULT_CLOUD_MODEL: CloudModel = 'Hybrid';
const DEFAULT_ORG_SIZE: OrgSize = 'SMB';

function parseJurisdictions(envValue: string | undefined): string[] {
  if (!envValue || typeof envValue !== 'string') return [];
  return envValue
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseCloudModel(envValue: string | undefined): CloudModel {
  if (!envValue) return DEFAULT_CLOUD_MODEL;
  const v = envValue.trim();
  if (['IaaS', 'PaaS', 'SaaS', 'Hybrid'].includes(v)) return v as CloudModel;
  return DEFAULT_CLOUD_MODEL;
}

function parseOrgSize(envValue: string | undefined): OrgSize {
  if (!envValue) return DEFAULT_ORG_SIZE;
  const v = envValue.trim();
  if (['Startup', 'SMB', 'Enterprise'].includes(v)) return v as OrgSize;
  return DEFAULT_ORG_SIZE;
}

// -----------------------------------------------------------------------------
// Active frameworks: from evidence + policy, then map to CAIQ names
// -----------------------------------------------------------------------------

function getActiveFrameworkIds(): FrameworkID[] {
  const evidenceItems = safeGetEvidenceItems();
  const policies = safeGetPolicies();

  const ids = new Set<string>();

  for (const e of evidenceItems) {
    const fid = normalizeToFrameworkId(e.framework);
    if (fid) ids.add(fid);
  }
  for (const p of policies) {
    for (const m of p.mappings ?? []) {
      const fid = normalizeToFrameworkId(m.frameworkId);
      if (fid) ids.add(fid);
    }
  }

  if (ids.size === 0) {
    return (Object.keys(COMPLIANCE_FRAMEWORKS) as FrameworkID[]);
  }
  return Array.from(ids) as FrameworkID[];
}

function safeGetEvidenceItems() {
  try {
    return useEvidenceStore.getState().evidenceItems ?? [];
  } catch {
    return [];
  }
}

function safeGetPolicies() {
  try {
    return usePolicyStore.getState().policies ?? [];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------------------------
// Build OrgControl[] from evidence store and policy store
// -----------------------------------------------------------------------------

function getControlDescription(frameworkId: FrameworkID, controlId: string): string {
  const def = COMPLIANCE_FRAMEWORKS[frameworkId];
  if (!def) return controlId;
  const isoStyle = controlId.startsWith('A.') ? controlId : `A.${controlId}`;
  const control = def.controls.find(
    (c) => c.id === controlId || c.id === isoStyle
  );
  return control?.name ?? control?.description ?? controlId;
}

function buildOrgControlsFromEvidence(): OrgControl[] {
  const items = safeGetEvidenceItems();
  const seen = new Set<string>();
  const controls: OrgControl[] = [];

  for (const e of items) {
    const fid = normalizeToFrameworkId(e.framework);
    if (!fid) continue;
    const caiqName = frameworkIdToCAIQName(fid);
    for (const controlId of e.controlIds ?? []) {
      const key = `${caiqName}:${controlId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      controls.push({
        framework: caiqName,
        controlId,
        status: e.status ?? 'UPLOADED',
        description: getControlDescription(fid, controlId),
      });
    }
  }
  return controls;
}

function buildOrgControlsFromPolicies(): OrgControl[] {
  const policies = safeGetPolicies();
  const seen = new Set<string>();
  const controls: OrgControl[] = [];

  for (const p of policies) {
    const status = p.status === 'ACTIVE' || p.status === 'APPROVED' ? 'Implemented' : p.status;
    for (const m of p.mappings ?? []) {
      const fid = normalizeToFrameworkId(m.frameworkId);
      if (!fid) continue;
      const caiqName = frameworkIdToCAIQName(fid);
      const controlId = m.controlId?.trim() ?? '';
      const key = `${caiqName}:${controlId}`;
      if (seen.has(key)) continue;
      seen.add(key);
      controls.push({
        framework: caiqName,
        controlId,
        status,
        description: getControlDescription(fid, controlId),
      });
    }
  }
  return controls;
}

function mergeOrgControls(evidence: OrgControl[], policy: OrgControl[]): OrgControl[] {
  const byKey = new Map<string, OrgControl>();
  for (const c of evidence) {
    byKey.set(`${c.framework}:${c.controlId}`, c);
  }
  for (const c of policy) {
    const k = `${c.framework}:${c.controlId}`;
    if (!byKey.has(k)) byKey.set(k, c);
  }
  return Array.from(byKey.values());
}

// -----------------------------------------------------------------------------
// Answer overrides: persisted CAIQ answers (e.g. manual overrides)
// -----------------------------------------------------------------------------

const CAIQ_OVERRIDES_STORAGE_KEY = 'aegis-caiq-answer-overrides';

function getAnswerOverrides(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CAIQ_OVERRIDES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

// -----------------------------------------------------------------------------
// evidenceLinks: questionId -> evidence identifiers
// -----------------------------------------------------------------------------

function buildEvidenceLinks(): Record<string, string[]> {
  const items = safeGetEvidenceItems();
  const kb = getKnowledgeBase();
  const links: Record<string, string[]> = {};

  for (const entry of kb) {
    const refs = getEvidenceForQuestionInternal(entry.questionId, items);
    if (refs.length > 0) links[entry.questionId] = refs;
  }
  return links;
}

function getEvidenceForQuestionInternal(
  questionId: string,
  evidenceItems: { id: string; name: string; framework: string; controlIds: string[] }[]
): string[] {
  const entry = getEntryByQuestionId(questionId);
  if (!entry?.frameworkMappings?.length) return [];

  const refs: string[] = [];
  for (const m of entry.frameworkMappings) {
    const fid = normalizeToFrameworkId(m.framework) ?? CAIQ_NAME_TO_FRAMEWORK_ID[m.framework];
    if (!fid) continue;
    const storeFramework = fid;
    for (const item of evidenceItems) {
      const itemFid = normalizeToFrameworkId(item.framework);
      if (itemFid !== storeFramework) continue;
      if ((item.controlIds ?? []).includes(m.controlId)) {
        refs.push(item.id || item.name);
      }
    }
  }
  return [...new Set(refs)];
}

// -----------------------------------------------------------------------------
// buildOrgContext()
// -----------------------------------------------------------------------------

/**
 * Builds a complete OrganizationContext from Astra-CISO stores and environment.
 * Uses evidence store, policy store, env vars (ASTRA_ORG_NAME, ASTRA_INDUSTRY, etc.),
 * and localStorage answer overrides. Uses sensible defaults when stores are empty.
 * @returns OrganizationContext for the CAIQ answer engine
 */
export async function buildOrgContext(): Promise<OrganizationContext> {
  const frameworks = getActiveFrameworkIds().map(frameworkIdToCAIQName);
  const fromEvidence = buildOrgControlsFromEvidence();
  const fromPolicy = buildOrgControlsFromPolicies();
  const relevantControls = mergeOrgControls(fromEvidence, fromPolicy);

  const jurisdictionEnv =
    typeof process !== 'undefined' && process.env ? process.env.ASTRA_JURISDICTION : undefined;
  const jurisdictions = parseJurisdictions(jurisdictionEnv);

  const industry =
    (typeof process !== 'undefined' && process.env && process.env.ASTRA_INDUSTRY) || DEFAULT_INDUSTRY;
  const cloudModel = parseCloudModel(
    typeof process !== 'undefined' && process.env ? process.env.ASTRA_CLOUD_MODEL : undefined
  );
  const size = parseOrgSize(
    typeof process !== 'undefined' && process.env ? process.env.ASTRA_ORG_SIZE : undefined
  );
  const name =
    (typeof process !== 'undefined' && process.env && process.env.ASTRA_ORG_NAME) || DEFAULT_ORG_NAME;

  const answerOverrides = getAnswerOverrides();
  const evidenceLinks = buildEvidenceLinks();

  return {
    name,
    industry,
    cloudModel,
    jurisdictions,
    frameworks: frameworks.length > 0 ? frameworks : Object.values(FRAMEWORK_ID_TO_CAIQ_NAME),
    size,
    relevantControls: relevantControls.length > 0 ? relevantControls : undefined,
    answerOverrides: Object.keys(answerOverrides).length > 0 ? answerOverrides : undefined,
    evidenceLinks: Object.keys(evidenceLinks).length > 0 ? evidenceLinks : undefined,
  };
}

// -----------------------------------------------------------------------------
// getRelevantControls(domain) — filter org controls by CAIQ domain
// -----------------------------------------------------------------------------

/**
 * Filters organization controls relevant to a CAIQ domain using KB framework mappings.
 * Overload: (domain, orgControls) returns filtered list synchronously;
 * (domain) builds context and returns controls for that domain asynchronously.
 * @param domain - CAIQ domain code (e.g. IAM, CEK, DSP)
 * @param orgControls - Optional pre-fetched org controls; if omitted, builds context first
 * @returns Filtered OrgControl[] or Promise of same
 */
export function getRelevantControls(domain: CAIQDomain, orgControls: OrgControl[]): OrgControl[];
export function getRelevantControls(domain: CAIQDomain): Promise<OrgControl[]>;
export function getRelevantControls(
  domain: CAIQDomain,
  orgControls?: OrgControl[]
): OrgControl[] | Promise<OrgControl[]> {
  const filterByDomain = (controls: OrgControl[]) => {
    if (!controls?.length) return [];
    const entries = getEntriesByDomain(domain);
    const allowed = new Set<string>();
    for (const e of entries) {
      for (const m of e.frameworkMappings ?? []) {
        allowed.add(`${m.framework}:${m.controlId}`);
      }
    }
    return controls.filter((c) => allowed.has(`${c.framework}:${c.controlId}`));
  };

  if (orgControls !== undefined) {
    return filterByDomain(orgControls);
  }
  return buildOrgContext().then((ctx) => filterByDomain(ctx.relevantControls ?? []));
}

// -----------------------------------------------------------------------------
// getEvidenceForQuestion(questionId) — evidence links for a question
// -----------------------------------------------------------------------------

/**
 * Returns evidence identifiers (ids or names) from the evidence store that are
 * relevant to the given CAIQ question via framework/control mappings in the KB.
 * @param questionId - CAIQ question ID (e.g. IAM-01, CEK-03)
 * @returns Array of evidence item ids or names
 */
export function getEvidenceForQuestion(questionId: string): string[] {
  const items = safeGetEvidenceItems();
  return getEvidenceForQuestionInternal(questionId, items);
}
