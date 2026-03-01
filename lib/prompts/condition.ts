// TODO: Task 2 — Add condition assessment system prompt
// Source: Implementation Spec §IV.A
// Model: claude-sonnet-4-5-20250929 | Max tokens: 1500 | Temperature: 0

export const CONDITION_SYSTEM_PROMPT = '';

export function buildConditionUserMessage(
  title: string,
  issue: string,
  coverDate: string,
  publisher: string,
  era: string,
): string {
  return `Assess the condition of this comic book cover. Context: This has been identified as ${title} #${issue} (${coverDate}), ${publisher}. ${era} era. Grade conservatively. Return only JSON.`;
}
