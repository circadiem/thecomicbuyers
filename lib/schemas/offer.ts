// TODO: Task 2 — Implement OfferResult Zod schema
// Source: Implementation Spec §VII.B

export type OfferResult = {
  tier: 'key_issues' | 'mid_tier' | 'common' | 'bulk';
  tier_label: string;
  fmv_low: number;
  fmv_high: number;
  offer_low: number;
  offer_high: number;
  offer_pct_applied: number;
  is_bulk: boolean;
};

// Collection-level summary — Source: Implementation Spec §VII.C
export type CollectionSummary = {
  total_books_identified: number;
  total_books_flagged: number;
  total_fmv_low: number;
  total_fmv_high: number;
  total_offer_low: number;
  total_offer_high: number;
  key_issues_count: number;
  hidden_gems_count: number;
  bulk_lot_count: number;
  breakdown_by_era: {
    golden: number;
    silver: number;
    bronze: number;
    copper: number;
    modern: number;
  };
  breakdown_by_publisher: Record<string, number>;
  reference_number: string;
};
