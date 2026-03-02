// Shared types for the comic processing pipeline (Task 5+)
// Each uploaded image flows through: pending → identifying → grading → complete | error

import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';

export type ProcessingStatus =
  | 'pending'
  | 'identifying'
  | 'grading'
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
  error?: string;
}
