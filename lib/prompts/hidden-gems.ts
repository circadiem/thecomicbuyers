// Hidden gems detection logic and explanation prompt
// Source: docs/prompts/prompt_hidden_gems.md (Implementation Spec §V)
//
// Architecture:
//   Part 1: detectHiddenGems() — pure code, no AI
//   Part 2: HIDDEN_GEM_SYSTEM_PROMPT + buildHiddenGemUserMessage() — Claude API call

import { OBVIOUS_KEYS } from '@/lib/config/obvious-keys';
import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ValuationResult } from '@/lib/schemas/valuation';

// ---------------------------------------------------------------------------
// Part 1: Detection Logic (code, no AI)
// ---------------------------------------------------------------------------

export interface HiddenGemCandidate {
  identification: IdentificationResult;
  valuation: ValuationResult;
}

/**
 * Returns books that qualify as hidden gems. A book qualifies if ALL of:
 * 1. FMV midpoint exceeds $50
 * 2. significance.type is NOT null (has collector significance)
 * 3. NOT on the OBVIOUS_KEYS exclusion list
 */
export function detectHiddenGems(
  books: HiddenGemCandidate[],
): HiddenGemCandidate[] {
  return books.filter(({ identification, valuation }) => {
    // Criterion 1: FMV midpoint exceeds $50
    if (valuation.fmv_midpoint <= 50) return false;

    // Criterion 2: Has collector significance
    if (!identification.significance.type) return false;

    // Criterion 3: Not on the obvious keys list
    const bookKey = `${identification.title} #${identification.issue_number}`;
    const isObvious = OBVIOUS_KEYS.some(
      (key) => key.toLowerCase() === bookKey.toLowerCase(),
    );
    if (isObvious) return false;

    return true;
  });
}

// ---------------------------------------------------------------------------
// Part 2: Explanation Generation (Claude API call)
// ---------------------------------------------------------------------------

export const HIDDEN_GEM_SYSTEM_PROMPT = `You write brief, clear explanations of why a comic book is more valuable than a non-collector would expect. Your audience is someone who knows nothing about comics and has just learned that a book in their collection is worth money.

Tone: Warm, informative, slightly surprising. Not salesy. Think: a knowledgeable friend explaining something interesting.

Length: 2-3 sentences maximum. No jargon without explanation.

Structure: What the book IS, why it MATTERS to collectors, and what it is WORTH in plain language.

Rules:
- Never use exclamation points
- Never say "you won't believe" or "surprisingly" or other clickbait language
- Do not mention grading scales or CGC
- Express value as a plain dollar range
- If the significance involves a character, briefly note why that character matters (movie franchise, cultural icon, etc.)
- Return only the explanation text. No JSON. No formatting. Just the sentences.`;

export function buildHiddenGemUserMessage(
  title: string,
  issue: string,
  coverDate: string,
  publisher: string,
  significanceDescription: string,
  fmvLow: number,
  fmvHigh: number,
): string {
  return `Explain why this book is a hidden gem for a non-collector:

Title: ${title} #${issue} (${coverDate})
Publisher: ${publisher}
Significance: ${significanceDescription}
Estimated Value: $${fmvLow} - $${fmvHigh}

Write 2-3 sentences. Plain language. No collector jargon.`;
}

// API call configuration — imported by lib/services/claude.ts
export const HIDDEN_GEM_MAX_TOKENS = 256;
export const HIDDEN_GEM_TEMPERATURE = 0.3;
