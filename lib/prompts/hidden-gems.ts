// TODO: Task 2 — Add hidden gems explanation prompt
// Source: Implementation Spec §V.B
// Model: claude-sonnet-4-5-20250929 | Max tokens: 256 | Temperature: 0.3
// Note: Detection logic (isHiddenGem) lives in lib/utils/ — this file holds the explanation prompt only

export const HIDDEN_GEM_SYSTEM_PROMPT = '';

export function buildHiddenGemUserMessage(
  title: string,
  issue: string,
  coverDate: string,
  significanceDescription: string,
  fmvLow: number,
  fmvHigh: number,
): string {
  return `Explain why this book is a hidden gem for a non-collector:\nTitle: ${title} #${issue} (${coverDate})\nSignificance: ${significanceDescription}\nEstimated Value: $${fmvLow} - $${fmvHigh}\nWrite 2-3 sentences. Plain language. No collector jargon.`;
}
