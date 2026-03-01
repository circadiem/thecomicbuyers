// Zod validation schema for ValuationResult
// Source: Implementation Spec §VI.B
// ValuationResult is assembled by lib/services/gocollect.ts (Task 6)
// and is not a direct Claude API response — but it is validated at assembly time.

import { z } from 'zod';

export const ValuationResultSchema = z.object({
  gocollect_match: z.boolean(),
  fmv_low: z.number().min(0),
  fmv_high: z.number().min(0),
  fmv_midpoint: z.number().min(0),
  data_source: z.enum(['gocollect', 'interpolated', 'manual']),
  last_sale_date: z.string().nullable(),
  sales_volume_90d: z.number().int().min(0).nullable(),
  trend: z.enum(['rising', 'stable', 'declining']).nullable(),
  census_count: z.number().int().min(0).nullable(),
  is_hidden_gem: z.boolean(),
  hidden_gem_explanation: z.string().nullable(),
});

export type ValuationResult = z.infer<typeof ValuationResultSchema>;
