// TODO: Task 2 — Implement ValuationResult Zod schema
// Source: Implementation Spec §VI.B

export type ValuationResult = {
  gocollect_match: boolean;
  fmv_low: number;
  fmv_high: number;
  fmv_midpoint: number;
  data_source: 'gocollect' | 'interpolated' | 'manual';
  last_sale_date: string | null;
  sales_volume_90d: number | null;
  trend: 'rising' | 'stable' | 'declining' | null;
  census_count: number | null;
  is_hidden_gem: boolean;
  hidden_gem_explanation: string | null;
};
