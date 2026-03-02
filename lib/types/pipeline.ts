// Shared types for the comic processing pipeline (Tasks 5–7)
// Each uploaded image flows through:
//   pending → identifying → grading → valuating → complete | error
// After questionnaire submission, adjusted_offer is populated.

import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';
import type { ValuationResult } from '@/lib/schemas/valuation';
import type { OfferResult } from '@/lib/schemas/offer';

export type ProcessingStatus =
  | 'pending'
  | 'identifying'
  | 'grading'
  | 'valuating'
  | 'complete'
  | 'error';

export interface ComicProcessingState {
  /** Matches ProcessedImage.id from the upload step */
  id: string;
  originalName: string;
  thumbnailDataUrl: string;
  status: ProcessingStatus;
  identification?: IdentificationResult;
  condition?: ConditionResult;
  valuation?: ValuationResult;
  /** Base offer from pipeline (pre-questionnaire, unadjusted for storage) */
  offer?: OfferResult;
  /** Recalculated offer after questionnaire grade adjustment is applied */
  adjusted_offer?: OfferResult;
  error?: string;
}
