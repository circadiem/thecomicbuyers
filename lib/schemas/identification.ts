// Zod validation schema for IdentificationResult
// Source: docs/prompts/prompt_identification.md (Implementation Spec §III.B)
// Every Claude identification API response must be parsed through this schema
// before entering the pipeline.

import { z } from 'zod';

export const SignificanceSchema = z.object({
  type: z
    .enum([
      'first_appearance',
      'first_cameo',
      'origin',
      'death',
      'first_issue',
      'key_storyline',
      'creator_debut',
      'crossover',
    ])
    .nullable(),
  description: z.string().nullable(),
});

export const CreatorsSchema = z.object({
  cover_artist: z.string().nullable(),
  writer: z.string().nullable(),
  interior_artist: z.string().nullable(),
});

export const IdentificationResultSchema = z.object({
  title: z.string().min(1),
  issue_number: z.string().min(1),
  volume: z.number().int().positive().nullable(),
  publisher: z.string().min(1),
  cover_date: z.string().min(1),
  cover_date_year: z.number().int().min(1938),
  era: z.enum(['Golden', 'Silver', 'Bronze', 'Copper', 'Modern']),
  variant_type: z.enum([
    'direct',
    'newsstand',
    'price_variant',
    'mark_jewelers',
    'unknown',
  ]),
  variant_detail: z.string().nullable(),
  cover_price: z.string().nullable(),
  significance: SignificanceSchema,
  creators: CreatorsSchema,
  confidence_score: z.number().min(0).max(100),
  confidence_notes: z.string(),
  flagged_for_review: z.boolean(),
  photo_quality: z.enum(['good', 'acceptable', 'poor']),
});

export type IdentificationResult = z.infer<typeof IdentificationResultSchema>;
