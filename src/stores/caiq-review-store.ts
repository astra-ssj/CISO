import { create } from "zustand";
import type {
  CAIQAnswer,
  CAIQDomain,
  CAIQAnswerType,
  CAIQGeneratedBy,
  ConfidenceTier,
  FrameworkMapping,
} from "@/lib/caiq/types";

// ─────────────────────────────────────────────────────────────────────────────
// Review-specific types (not in CAIQ core types)
// ─────────────────────────────────────────────────────────────────────────────

export const REVIEW_STATUSES = ["Pending", "Approved", "Rejected", "Edited", "Flagged"] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export interface CAIQReviewItem extends CAIQAnswer {
  /** Question text for display in review UI */
  questionText: string;
  /** Domain for filtering (derived or from KB) */
  domain: CAIQDomain;
  /** Human review status */
  reviewStatus: ReviewStatus;
  /** Original AI answer before any edit (for diff) */
  originalAnswer?: string;
  /** Reviewer notes (e.g. for edit rationale) */
  reviewerNotes?: string;
  /** Evidence link override from reviewer */
  evidenceLinkOverride?: string;
}

export interface AuditEntry {
  questionId: string;
  timestamp: string;
  action: "approve" | "reject" | "edit" | "flag";
  previousAnswer?: string;
  newAnswer?: string;
  reviewerNotes?: string;
  reviewedBy?: string;
}

export type SortField = "confidence" | "domain" | "questionId";
export type SortDir = "asc" | "desc";

interface CAIQReviewState {
  /** All answers in the review queue */
  items: CAIQReviewItem[];
  /** Stats snapshot (can be derived or from API) */
  stats: {
    total: number;
    approved: number;
    pending: number;
    flagged: number;
    estimatedAccuracy: number;
  };
  /** Selected question IDs for bulk actions */
  selectedIds: Set<string>;
  /** Audit log for edits/approvals */
  auditLog: AuditEntry[];

  // ── Filters (could be in URL in real app)
  filterDomain: CAIQDomain | "all";
  filterTier: ConfidenceTier | "all";
  filterStatus: ReviewStatus | "all";
  sortBy: SortField;
  sortDir: SortDir;

  // ── Actions
  setItems: (items: CAIQReviewItem[]) => void;
  setStats: (stats: Partial<CAIQReviewState["stats"]>) => void;
  setReviewStatus: (questionId: string, status: ReviewStatus) => void;
  updateAnswer: (questionId: string, updates: Partial<Pick<CAIQReviewItem, "answer" | "answerType" | "evidenceRefs" | "reviewerNotes" | "evidenceLinkOverride">>) => void;
  toggleSelect: (questionId: string) => void;
  selectAll: (questionIds: string[]) => void;
  clearSelection: () => void;
  setFilterDomain: (v: CAIQDomain | "all") => void;
  setFilterTier: (v: ConfidenceTier | "all") => void;
  setFilterStatus: (v: ReviewStatus | "all") => void;
  setSort: (field: SortField, dir?: SortDir) => void;
  addAuditEntry: (entry: Omit<AuditEntry, "timestamp">) => void;
  approveAllHighConfidence: (threshold?: number) => void;
  bulkSetStatus: (questionIds: string[], status: ReviewStatus) => void;
  getFilteredAndSortedItems: () => CAIQReviewItem[];
}

export const useCAIQReviewStore = create<CAIQReviewState>((set, get) => ({
  items: [],
  stats: { total: 0, approved: 0, pending: 0, flagged: 0, estimatedAccuracy: 0 },
  selectedIds: new Set(),
  auditLog: [],
  filterDomain: "all",
  filterTier: "all",
  filterStatus: "all",
  sortBy: "confidence",
  sortDir: "desc",

  setItems: (items) =>
    set((s) => ({
      items,
      stats: {
        ...s.stats,
        total: items.length,
        approved: items.filter((i) => i.reviewStatus === "Approved").length,
        pending: items.filter((i) => i.reviewStatus === "Pending").length,
        flagged: items.filter((i) => i.reviewStatus === "Flagged").length,
      },
    })),

  setStats: (stats) =>
    set((s) => ({ stats: { ...s.stats, ...stats } })),

  setReviewStatus: (questionId, status) =>
    set((s) => {
      const items = s.items.map((i) =>
        i.questionId === questionId ? { ...i, reviewStatus: status } : i
      );
      return {
        items,
        stats: {
          ...s.stats,
          approved: items.filter((i) => i.reviewStatus === "Approved").length,
          pending: items.filter((i) => i.reviewStatus === "Pending").length,
          flagged: items.filter((i) => i.reviewStatus === "Flagged").length,
        },
      };
    }),

  updateAnswer: (questionId, updates) =>
    set((s) => ({
      items: s.items.map((i) =>
        i.questionId === questionId ? { ...i, ...updates } : i
      ),
    })),

  toggleSelect: (questionId) =>
    set((s) => {
      const next = new Set(s.selectedIds);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return { selectedIds: next };
    }),

  selectAll: (questionIds) =>
    set({ selectedIds: new Set(questionIds) }),

  clearSelection: () => set({ selectedIds: new Set() }),

  setFilterDomain: (filterDomain) => set({ filterDomain }),
  setFilterTier: (filterTier) => set({ filterTier }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),

  setSort: (sortBy, sortDir) =>
    set((s) => ({
      sortBy,
      sortDir: sortDir ?? (s.sortBy === sortBy && s.sortDir === "desc" ? "asc" : "desc"),
    })),

  addAuditEntry: (entry) =>
    set((s) => ({
      auditLog: [
        ...s.auditLog,
        { ...entry, timestamp: new Date().toISOString() },
      ],
    })),

  approveAllHighConfidence: (threshold = 0.95) =>
    set((s) => {
      const items = s.items.map((i) =>
        i.confidence >= threshold && i.reviewStatus === "Pending"
          ? { ...i, reviewStatus: "Approved" as ReviewStatus }
          : i
      );
      return {
        items,
        stats: {
          ...s.stats,
          approved: items.filter((i) => i.reviewStatus === "Approved").length,
          pending: items.filter((i) => i.reviewStatus === "Pending").length,
        },
      };
    }),

  bulkSetStatus: (questionIds, status) =>
    set((s) => {
      const idSet = new Set(questionIds);
      const items = s.items.map((i) =>
        idSet.has(i.questionId) ? { ...i, reviewStatus: status } : i
      );
      return {
        items,
        selectedIds: new Set<string>(),
        stats: {
          ...s.stats,
          approved: items.filter((i) => i.reviewStatus === "Approved").length,
          pending: items.filter((i) => i.reviewStatus === "Pending").length,
          flagged: items.filter((i) => i.reviewStatus === "Flagged").length,
        },
      };
    }),

  getFilteredAndSortedItems: () => {
    const s = get();
    let list = [...s.items];
    if (s.filterDomain !== "all")
      list = list.filter((i) => i.domain === s.filterDomain);
    if (s.filterTier !== "all") list = list.filter((i) => i.tier === s.filterTier);
    if (s.filterStatus !== "all")
      list = list.filter((i) => i.reviewStatus === s.filterStatus);
    const mult = s.sortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      if (s.sortBy === "confidence")
        return mult * (a.confidence - b.confidence);
      if (s.sortBy === "domain")
        return mult * (a.domain.localeCompare(b.domain));
      return mult * (a.questionId.localeCompare(b.questionId));
    });
    return list;
  },
}));
