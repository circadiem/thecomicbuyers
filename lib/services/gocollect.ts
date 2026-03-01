// TODO: Task 6 — Implement GoCollect API client
// Queries FMV data by title/issue/grade; applies fallback table when no data
// Source: Implementation Spec §VI.A, §VI.C

import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';
import type { ValuationResult } from '@/lib/schemas/valuation';

export async function valuateComic(
  _identification: IdentificationResult,
  _condition: ConditionResult,
): Promise<ValuationResult> {
  throw new Error('Not implemented — see Task 6');
}
