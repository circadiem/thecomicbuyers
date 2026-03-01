// Offer percentage tiers applied to FMV data
// Adjust these values without changing application logic
export const OFFER_TIERS = {
  key_issues: {
    label: 'Key Issues / Grails',
    fmv_floor: 500, // Books with FMV >= $500
    offer_pct_low: 0.50, // 50% of FMV low
    offer_pct_high: 0.60, // 60% of FMV high
  },
  mid_tier: {
    label: 'Mid-Tier Collectibles',
    fmv_floor: 50, // Books with FMV $50–$499
    offer_pct_low: 0.40,
    offer_pct_high: 0.50,
  },
  common: {
    label: 'Common / Reader Copies',
    fmv_floor: 10, // Books with FMV $10–$49
    offer_pct_low: 0.30,
    offer_pct_high: 0.40,
  },
  bulk: {
    label: 'Bulk Lot',
    fmv_floor: 0, // Books with FMV < $10
    flat_rate_low: 0.50, // $0.50 per book
    flat_rate_high: 2.00, // $2.00 per book
  },
} as const;

export type OfferTierKey = keyof typeof OFFER_TIERS;
