// Zod validation schema for ConditionResult
// Source: docs/prompts/prompt_condition.md (Implementation Spec §IV.B)
// Every Claude condition assessment API response must be parsed through this
// schema before entering the pipeline.

import { z } from 'zod';

export const DefectSchema = z.object({
  type: z.enum([
    'spine_stress',
    'corner_blunt',
    'tear',
    'stain',
    'foxing',
    'writing',
    'chip',
    'crease',
    'color_loss',
    'staple_rust',
    'fading',
  ]),
  severity: z.enum(['minor', 'moderate', 'significant']),
  location: z.string(),
  color_breaking: z.boolean(),
  description: z.string(),
});

export const ConditionResultSchema = z.object({
  grade_low: z.number().min(0.5).max(10.0),
  grade_high: z.number().min(0.5).max(10.0),
  grade_midpoint: z.number().min(0.5).max(10.0),
  grade_label_low: z.string(),
  grade_label_high: z.string(),
  primary_defects: z.array(DefectSchema),
  cover_assessment: z.object({
    gloss: z.enum(['high', 'moderate', 'low', 'absent']),
    color_integrity: z.enum(['excellent', 'good', 'fair', 'poor']),
    notes: z.string(),
  }),
  spine_assessment: z.object({
    stress_lines: z.number().int().min(0),
    roll: z.enum(['none', 'slight', 'moderate', 'significant']),
    splits: z.boolean(),
    notes: z.string(),
  }),
  corner_assessment: z.object({
    sharpness: z.enum(['sharp', 'slightly_blunted', 'blunted', 'rounded']),
    weakest_corner: z.enum([
      'top_left',
      'top_right',
      'bottom_left',
      'bottom_right',
    ]),
    notes: z.string(),
  }),
  limitations_noted: z.array(z.string()),
  storage_inference: z.string(),
  pressing_potential: z.enum(['none', 'minor_improvement', 'significant']),
  grade_limiting_factor: z.string(),
});

export type ConditionResult = z.infer<typeof ConditionResultSchema>;
