import { z } from 'zod';

// =============================================================================
// Domain & answer type unions (Zod enums for validation)
// =============================================================================

export const CAIQ_DOMAINS = [
  'AIS', 'AAC', 'BCR', 'CCC', 'CEK', 'DSP', 'GRC', 'HRS', 'IAM', 'IPY',
  'IVS', 'LOG', 'SEF', 'STA', 'TVM', 'UEM',
] as const;

export type CAIQDomain = (typeof CAIQ_DOMAINS)[number];

export const caiqDomainSchema = z.enum(CAIQ_DOMAINS);

export const CAIQ_ANSWER_TYPES = ['YES', 'NO', 'NOT_APPLICABLE', 'CONDITIONAL'] as const;
export type CAIQAnswerType = (typeof CAIQ_ANSWER_TYPES)[number];
export const caiqAnswerTypeSchema = z.enum(CAIQ_ANSWER_TYPES);

export const CONFIDENCE_TIERS = ['EXACT_MATCH', 'SEMANTIC_MATCH', 'AI_GENERATED', 'FLAGGED'] as const;
export type ConfidenceTier = (typeof CONFIDENCE_TIERS)[number];
export const confidenceTierSchema = z.enum(CONFIDENCE_TIERS);

export const GENERATED_BY_VALUES = ['KB_EXACT', 'KB_SEMANTIC', 'AI_PRIMARY', 'AI_FALLBACK', 'HUMAN'] as const;
export type CAIQGeneratedBy = (typeof GENERATED_BY_VALUES)[number];
export const generatedBySchema = z.enum(GENERATED_BY_VALUES);

export const CLOUD_MODELS = ['IaaS', 'PaaS', 'SaaS', 'Hybrid'] as const;
export type CloudModel = (typeof CLOUD_MODELS)[number];
export const cloudModelSchema = z.enum(CLOUD_MODELS);

export const ORG_SIZES = ['Startup', 'SMB', 'Enterprise'] as const;
export type OrgSize = (typeof ORG_SIZES)[number];
export const orgSizeSchema = z.enum(ORG_SIZES);

// =============================================================================
// FrameworkMapping
// =============================================================================

export interface FrameworkMapping {
  framework: string;
  controlId: string;
  description?: string;
}

export const frameworkMappingSchema = z.object({
  framework: z.string(),
  controlId: z.string(),
  description: z.string().optional(),
});

// =============================================================================
// CAIQKnowledgeEntry
// =============================================================================

export interface CAIQKnowledgeEntry {
  questionId: string;
  domain: CAIQDomain;
  question: string;
  keywords: string[];
  baseAnswer: string;
  orgAnswer?: string;
  evidenceRequired: string[];
  frameworkMappings: FrameworkMapping[];
  expectedAnswerType: CAIQAnswerType;
  reviewerNotes?: string;
  jurisdictionNotes?: Record<string, string>;
  lastReviewed?: string;
}

export const caiqKnowledgeEntrySchema = z.object({
  questionId: z.string(),
  domain: caiqDomainSchema,
  question: z.string(),
  keywords: z.array(z.string()),
  baseAnswer: z.string(),
  orgAnswer: z.string().optional(),
  evidenceRequired: z.array(z.string()),
  frameworkMappings: z.array(frameworkMappingSchema),
  expectedAnswerType: caiqAnswerTypeSchema,
  reviewerNotes: z.string().optional(),
  jurisdictionNotes: z.record(z.string(), z.string()).optional(),
  lastReviewed: z.string().optional(),
});

// =============================================================================
// CAIQAnswer (with Zod for runtime validation)
// =============================================================================

export interface CAIQAnswer {
  questionId: string;
  answer: string;
  answerType: CAIQAnswerType;
  confidence: number;
  tier: ConfidenceTier;
  sources: string[];
  evidenceRefs: string[];
  frameworkRefs: FrameworkMapping[];
  needsReview: boolean;
  auditId: string;
  generatedAt: string;
  generatedBy: CAIQGeneratedBy;
  reviewedBy?: string;
  reviewedAt?: string;
  corrections?: string;
}

export const caiqAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.string(),
  answerType: caiqAnswerTypeSchema,
  confidence: z.number().min(0).max(1),
  tier: confidenceTierSchema,
  sources: z.array(z.string()),
  evidenceRefs: z.array(z.string()),
  frameworkRefs: z.array(frameworkMappingSchema),
  needsReview: z.boolean(),
  auditId: z.string(),
  generatedAt: z.string(),
  generatedBy: generatedBySchema,
  reviewedBy: z.string().optional(),
  reviewedAt: z.string().optional(),
  corrections: z.string().optional(),
});

// =============================================================================
// OrganizationContext & OrgControl (with Zod for runtime validation)
// =============================================================================

export interface OrgControl {
  framework: string;
  controlId: string;
  status: string;
  description: string;
}

export const orgControlSchema = z.object({
  framework: z.string(),
  controlId: z.string(),
  status: z.string(),
  description: z.string(),
});

/** answerOverrides and evidenceLinks are JSON-serializable as Record (plain object). */
export interface OrganizationContext {
  name: string;
  industry: string;
  cloudModel: CloudModel;
  jurisdictions: string[];
  frameworks: string[];
  size: OrgSize;
  relevantControls?: OrgControl[];
  answerOverrides?: Record<string, string>;
  evidenceLinks?: Record<string, string[]>;
}

export const organizationContextSchema = z.object({
  name: z.string(),
  industry: z.string(),
  cloudModel: cloudModelSchema,
  jurisdictions: z.array(z.string()),
  frameworks: z.array(z.string()),
  size: orgSizeSchema,
  relevantControls: z.array(orgControlSchema).optional(),
  answerOverrides: z.record(z.string(), z.string()).optional(),
  evidenceLinks: z.record(z.string(), z.array(z.string())).optional(),
});

// =============================================================================
// CAIQGenerateOptions (API input – with Zod)
// =============================================================================

export interface CAIQGenerateOptions {
  includeEvidence: boolean;
  autoApproveThreshold: number;
  flagThreshold: number;
  maxAIRetries: number;
}

export const caiqGenerateOptionsSchema = z.object({
  includeEvidence: z.boolean(),
  autoApproveThreshold: z.number(),
  flagThreshold: z.number(),
  maxAIRetries: z.number(),
});

// =============================================================================
// CAIQStats & CAIQAnswerSet
// =============================================================================

export interface CAIQStats {
  total: number;
  highConfidence: number;
  mediumConfidence: number;
  lowConfidence: number;
  flagged: number;
  estimatedAccuracy: number;
  coverageByDomain: Record<CAIQDomain, { answered: number; total: number }>;
}

export const caiqStatsSchema = z.object({
  total: z.number(),
  highConfidence: z.number(),
  mediumConfidence: z.number(),
  lowConfidence: z.number(),
  flagged: z.number(),
  estimatedAccuracy: z.number(),
  coverageByDomain: z.record(caiqDomainSchema, z.object({
    answered: z.number(),
    total: z.number(),
  })),
});

export interface CAIQAnswerSet {
  answers: CAIQAnswer[];
  stats: CAIQStats;
}

export const caiqAnswerSetSchema = z.object({
  answers: z.array(caiqAnswerSchema),
  stats: caiqStatsSchema,
});

// =============================================================================
// ValidationCheck & ValidationResult
// =============================================================================

export interface ValidationCheck {
  name: string;
  passed: boolean;
  details: string;
}

export const validationCheckSchema = z.object({
  name: z.string(),
  passed: z.boolean(),
  details: z.string(),
});

export interface ValidationResult {
  questionId: string;
  originalConfidence: number;
  validatedConfidence: number;
  checks: ValidationCheck[];
  needsReview: boolean;
}

export const validationResultSchema = z.object({
  questionId: z.string(),
  originalConfidence: z.number(),
  validatedConfidence: z.number(),
  checks: z.array(validationCheckSchema),
  needsReview: z.boolean(),
});

// =============================================================================
// ScoredKBEntry & ParsedCAIQQuestion
// =============================================================================

export interface ScoredKBEntry {
  questionId: string;
  score: number;
  entry?: CAIQKnowledgeEntry;
}

export const scoredKBEntrySchema = z.object({
  questionId: z.string(),
  score: z.number(),
  entry: caiqKnowledgeEntrySchema.optional(),
});

export interface ParsedCAIQQuestion {
  id: string;
  domain: CAIQDomain;
  domainName: string;
  text: string;
  subQuestions?: string[];
}

export const parsedCAIQQuestionSchema = z.object({
  id: z.string(),
  domain: caiqDomainSchema,
  domainName: z.string(),
  text: z.string(),
  subQuestions: z.array(z.string()).optional(),
});
