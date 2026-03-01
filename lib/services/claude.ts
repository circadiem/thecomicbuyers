// TODO: Task 3 — Implement Claude API client wrapper
// Exposes: identifyComic(imageBase64) and assessCondition(imageBase64, context)
// Includes retry logic with exponential backoff, JSON parsing, Zod validation
// Source: Implementation Spec §III.D, §IV.D, §XII.A

import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';

export async function identifyComic(
  _imageBase64: string,
): Promise<IdentificationResult> {
  throw new Error('Not implemented — see Task 3');
}

export async function assessCondition(
  _imageBase64: string,
  _context: IdentificationResult,
): Promise<ConditionResult> {
  throw new Error('Not implemented — see Task 3');
}
