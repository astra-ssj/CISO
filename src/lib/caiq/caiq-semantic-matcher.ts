/**
 * CAIQ Semantic Matcher — Local TF-IDF + cosine similarity engine.
 *
 * Works entirely in-memory with no external API calls for data sovereignty
 * and compliance. Used to find KB entries similar to a query (e.g. for
 * transfer or answer suggestion).
 */

import type { CAIQKnowledgeEntry, CAIQDomain, ScoredKBEntry } from './types';

// =============================================================================
// Stop words: common English + compliance filler (low matching value in CAIQ)
// =============================================================================

const STOP_WORDS = new Set([
  // Common English
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
  'in', 'is', 'it', 'its', 'of', 'on', 'or', 'that', 'the', 'to', 'was', 'were',
  'will', 'with', 'this', 'but', 'they', 'have', 'had', 'what', 'when', 'where',
  'which', 'who', 'all', 'each', 'every', 'both', 'few', 'more', 'most', 'other',
  'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too',
  'very', 'just', 'can', 'should', 'now', 'if', 'then', 'into', 'out', 'up',
  'down', 'about', 'after', 'before', 'between', 'through', 'during', 'above',
  'below', 'again', 'further', 'once', 'here', 'there', 'any', 'being', 'does',
  'did', 'do', 'would', 'could', 'may', 'might', 'must', 'shall', 'also',
  // Compliance / CAIQ filler — appear in almost every question
  'ensure', 'maintain', 'maintained', 'maintaining', 'organization', 'organizations',
  'process', 'processes', 'procedure', 'procedures', 'procedural', 'established',
  'documented', 'approved', 'communicated', 'applied', 'evaluated', 'reviewed',
  'updated', 'appropriate', 'adequate', 'effective', 'effectively', 'relevant',
  'required', 'requirements', 'compliance', 'control', 'controls', 'policy',
  'policies', 'security', 'information', 'data', 'systems', 'capabilities',
  'guidance', 'planning', 'delivery', 'support', 'guide', 'covering', 'covered',
  'include', 'includes', 'including', 'provide', 'provides', 'provided', 'based',
  'accordance', 'regarding', 'related', 'associated', 'within', 'throughout',
  'whether', 'used', 'using', 'use', 'available', 'implemented', 'implementation',
  'implement', 'address', 'addressed', 'addresses', 'defined', 'define', 'defines',
  'identified', 'identify', 'identifies', 'managed', 'manage', 'manages',
  'management', 'monitored', 'monitor', 'monitors', 'monitoring', 'access',
  'activities', 'activity', 'applicable', 'assessment', 'assessments', 'audit',
  'audits', 'change', 'changes', 'environment', 'environments', 'formal',
  'formalized', 'periodic', 'regular', 'regularly', 'standard', 'standards',
  'documentation', 'documents', 'document', 'evidence', 'practice', 'practices',
  'responsibility', 'responsibilities', 'responsible', 'role', 'roles', 'scope',
  'specific', 'specifically', 'structure', 'structured', 'third', 'party',
  'vendor', 'vendors', 'service', 'services', 'provider', 'providers',
]);

const MIN_TOKEN_LENGTH = 3;
const DEFAULT_THRESHOLD = 0.1;
const DEFAULT_MAX_RESULTS = 10;
const DOMAIN_BOOST = 0.1;
const SCORE_CAP = 1.0;

// =============================================================================
// Tokenizer
// =============================================================================

/**
 * Normalizes and tokenizes text: lowercase, strip punctuation, split on
 * whitespace, drop short tokens and stop words.
 */
function tokenize(text: string): string[] {
  const normalized = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!normalized) return [];
  return normalized
    .split(' ')
    .filter((t) => t.length >= MIN_TOKEN_LENGTH && !STOP_WORDS.has(t));
}

// =============================================================================
// TF (term frequency) — raw count per document
// =============================================================================

function termFrequencies(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  for (const t of tokens) {
    tf.set(t, (tf.get(t) ?? 0) + 1);
  }
  return tf;
}

// =============================================================================
// IDF (inverse document frequency) — log((N+1)/(df+1)) + 1 to avoid log(0)
// =============================================================================

function computeIDF(
  docTokenMaps: Map<number, Map<string, number>>,
  vocabulary: string[]
): Map<string, number> {
  const N = docTokenMaps.size;
  const idf = new Map<string, number>();
  for (const term of vocabulary) {
    let df = 0;
    for (const tokenMap of docTokenMaps.values()) {
      if (tokenMap.has(term)) df++;
    }
    idf.set(term, Math.log((N + 1) / (df + 1)) + 1);
  }
  return idf;
}

// =============================================================================
// Document vector (TF-IDF) and cosine similarity
// =============================================================================

/** Builds a TF-IDF vector for a bag-of-words over the given vocabulary. */
function toTfIdfVector(
  tokenMap: Map<string, number>,
  vocabulary: string[],
  idf: Map<string, number>
): number[] {
  return vocabulary.map((term) => {
    const tf = tokenMap.get(term) ?? 0;
    const idfVal = idf.get(term) ?? 1;
    return tf * idfVal;
  });
}

/** Cosine similarity between two vectors (assumed same length). */
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

// =============================================================================
// Semantic matcher class
// =============================================================================

/**
 * Options for semantic similarity search (threshold and result limit).
 */
export interface FindSimilarOptions {
  /** Minimum cosine similarity to include (default 0.1). */
  threshold?: number;
  /** Maximum number of results to return (default 10). */
  maxResults?: number;
}

/**
 * Lightweight semantic matching engine using TF-IDF and cosine similarity.
 * All processing is local; no external API calls (data sovereignty compliant).
 * Used to find KB entries similar to a question for Tier 2 answers and transfer.
 */
export class CAIQSemanticMatcher {
  private entries: CAIQKnowledgeEntry[] = [];
  private vocabulary: string[] = [];
  private idf: Map<string, number> = new Map();
  private docVectors: number[][] = [];
  private docTokenMaps: Map<number, Map<string, number>> = new Map();

  /**
   * Builds the matcher from the full knowledge base. Call once with all
   * CAIQKnowledgeEntry[] (e.g. from getKnowledgeBase()).
   * @param entries - Full list of knowledge base entries
   */
  constructor(entries: CAIQKnowledgeEntry[]) {
    this.rebuildIndex(entries);
  }

  /**
   * Builds the searchable text for one KB entry: question + keywords + baseAnswer.
   */
  private getDocumentText(entry: CAIQKnowledgeEntry): string {
    const parts = [
      entry.question,
      entry.keywords.join(' '),
      entry.baseAnswer,
    ];
    return parts.filter(Boolean).join(' ');
  }

  /**
   * Rebuilds vocabulary, IDF, and document vectors from the given entries.
   * Call when the knowledge base is updated.
   *
   * @param entries - Full list of knowledge base entries (replaces current index)
   */
  rebuildIndex(entries: CAIQKnowledgeEntry[]): void {
    this.entries = [...entries];
    this.docTokenMaps = new Map();
    const vocabularySet = new Set<string>();

    for (let i = 0; i < this.entries.length; i++) {
      const text = this.getDocumentText(this.entries[i]);
      const tokens = tokenize(text);
      const tf = termFrequencies(tokens);
      this.docTokenMaps.set(i, tf);
      for (const t of tf.keys()) {
        vocabularySet.add(t);
      }
    }

    this.vocabulary = Array.from(vocabularySet).sort();
    this.idf = computeIDF(this.docTokenMaps, this.vocabulary);
    this.docVectors = [];

    for (let i = 0; i < this.entries.length; i++) {
      const tokenMap = this.docTokenMaps.get(i)!;
      this.docVectors.push(toTfIdfVector(tokenMap, this.vocabulary, this.idf));
    }
  }

  /**
   * Finds KB entries most similar to the query text using TF-IDF cosine similarity.
   * Optionally filters/boosts by domain: when `domain` is provided, same-domain
   * matches receive a 0.1 score boost (capped at 1.0).
   *
   * @param queryText - User or question text to match against the KB
   * @param domain - Optional domain filter; same-domain results get a small boost
   * @param options - Optional threshold and maxResults
   * @returns Sorted list of scored entries (highest score first), up to maxResults
   */
  findSimilar(
    queryText: string,
    domain?: CAIQDomain,
    options?: FindSimilarOptions
  ): ScoredKBEntry[] {
    const threshold = options?.threshold ?? DEFAULT_THRESHOLD;
    const maxResults = options?.maxResults ?? DEFAULT_MAX_RESULTS;

    const queryTokens = tokenize(queryText);
    const queryTf = termFrequencies(queryTokens);
    const queryVec = toTfIdfVector(queryTf, this.vocabulary, this.idf);

    const scored: ScoredKBEntry[] = [];

    for (let i = 0; i < this.entries.length; i++) {
      let score = cosineSimilarity(queryVec, this.docVectors[i]);

      // Domain boosting: same-domain matches get a small boost, capped at 1.0
      if (domain != null && this.entries[i].domain === domain) {
        score = Math.min(SCORE_CAP, score + DOMAIN_BOOST);
      }

      if (score >= threshold) {
        scored.push({
          questionId: this.entries[i].questionId,
          score,
          entry: this.entries[i],
        });
      }
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, maxResults);
  }

  /**
   * Returns the number of terms in the current vocabulary (after tokenization
   * and stop-word removal). Useful for diagnostics or tuning.
   */
  getVocabularySize(): number {
    return this.vocabulary.length;
  }
}
