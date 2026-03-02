// Grade adjustment logic — pure, deterministic, no AI calls
// Applies storage and restoration context from the seller questionnaire to
// produce an FMV multiplier used to recalculate per-book offers.
// Source: Implementation Spec §X

import type { SellerQuestionnaire } from '@/lib/schemas/questionnaire';
import { calculateBookOffer } from '@/lib/services/offer';
import type { OfferResult } from '@/lib/schemas/offer';
import type { ValuationResult } from '@/lib/schemas/valuation';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GradeAdjustment {
  /** Multiplier applied to fmv_low / fmv_high before recalculating the offer.
   *  1.0 = no change.  >1 = storage confidence boost.  <1 = condition concern. */
  fmv_multiplier: number;
  /** True if any known restoration was declared — all books flagged for review. */
  restoration_flag: boolean;
  /** Human-readable reasons shown in the UI and included in the appraisal report. */
  adjustment_reasons: string[];
}

// ---------------------------------------------------------------------------
// Adjustment computation
// ---------------------------------------------------------------------------

/**
 * Compute the FMV multiplier and flag based on seller-reported storage conditions.
 *
 * Adjustment tiers (applied multiplicatively so combined conditions compound):
 *   Storage type × location:
 *     bagged+boarded + climate_controlled → ×1.15
 *     bagged+boarded + normal_interior    → ×1.05
 *     bagged+boarded + garage_basement    → ×0.95 (boarding helps but environment hurts)
 *     bagged_only + climate_controlled    → ×1.05
 *     bagged_only + normal_interior       → ×1.00 (neutral baseline)
 *     bagged_only + garage_basement       → ×0.85
 *     loose + climate_controlled          → ×0.90
 *     loose + normal_interior             → ×0.85
 *     loose + garage_basement             → ×0.70
 *     mixed (any location)                → ×0.90
 *     unknown storage                     → ×0.90
 *   Known restorations: ×0.75 (and restoration_flag = true)
 */
export function computeGradeAdjustment(
  questionnaire: SellerQuestionnaire,
): GradeAdjustment {
  const reasons: string[] = [];
  let multiplier = 1.0;

  const { storage_type, storage_location, known_restorations } = questionnaire;

  // ── Storage type + location combined ─────────────────────────────────────

  if (storage_type === 'bagged_boarded') {
    if (storage_location === 'climate_controlled') {
      multiplier *= 1.15;
      reasons.push('Excellent storage: bagged, boarded, and climate controlled (+15%)');
    } else if (storage_location === 'normal_interior') {
      multiplier *= 1.05;
      reasons.push('Good storage: bagged and boarded in a conditioned space (+5%)');
    } else if (storage_location === 'garage_basement') {
      multiplier *= 0.95;
      reasons.push(
        'Mixed storage: bagged and boarded but in garage/basement environment (−5%)',
      );
    } else {
      // unknown — minor positive for bags/boards
      multiplier *= 1.00;
    }
  } else if (storage_type === 'bagged_only') {
    if (storage_location === 'climate_controlled') {
      multiplier *= 1.05;
      reasons.push('Good storage: bagged and climate controlled (+5%)');
    } else if (storage_location === 'garage_basement') {
      multiplier *= 0.85;
      reasons.push('Suboptimal storage: bagged but stored in garage/basement (−15%)');
    }
    // normal_interior or unknown → ×1.00 neutral, no reason needed
  } else if (storage_type === 'loose') {
    if (storage_location === 'climate_controlled') {
      multiplier *= 0.90;
      reasons.push('Books stored loose — some surface wear likely despite good climate (−10%)');
    } else if (storage_location === 'garage_basement') {
      multiplier *= 0.70;
      reasons.push(
        'Books stored loose in garage/basement — significant wear risk (−30%)',
      );
    } else {
      multiplier *= 0.85;
      reasons.push('Books stored loose without bags — surface wear likely (−15%)');
    }
  } else {
    // mixed or unknown
    multiplier *= 0.90;
    reasons.push('Mixed or unknown storage conditions — conservative adjustment (−10%)');
  }

  // ── Known restorations ────────────────────────────────────────────────────

  if (known_restorations) {
    multiplier *= 0.75;
    reasons.push(
      'Known restoration, pressing, or cleaning declared — all books flagged for human review (−25%)',
    );
  }

  return {
    fmv_multiplier: Math.round(multiplier * 1000) / 1000,
    restoration_flag: known_restorations,
    adjustment_reasons: reasons,
  };
}

// ---------------------------------------------------------------------------
// Apply adjustment to a single book's valuation → new OfferResult
// ---------------------------------------------------------------------------

/**
 * Apply a GradeAdjustment to a book's raw ValuationResult and return
 * a recalculated OfferResult reflecting the storage-adjusted FMV.
 */
export function applyAdjustmentToOffer(
  valuation: ValuationResult,
  adjustment: GradeAdjustment,
): OfferResult {
  const adjustedLow =
    Math.round(valuation.fmv_low * adjustment.fmv_multiplier * 100) / 100;
  const adjustedHigh =
    Math.round(valuation.fmv_high * adjustment.fmv_multiplier * 100) / 100;
  const adjustedMidpoint = Math.round(((adjustedLow + adjustedHigh) / 2) * 100) / 100;

  return calculateBookOffer(adjustedLow, adjustedHigh, adjustedMidpoint);
}
