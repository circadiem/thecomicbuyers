// TODO: Task 2 — Implement ConditionResult Zod schema
// Source: Implementation Spec §IV.B

export type ConditionResult = {
  grade_low: number;
  grade_high: number;
  grade_midpoint: number;
  grade_label_low: string;
  grade_label_high: string;
  primary_defects: Array<{
    type: string;
    severity: string;
    location: string;
    color_breaking: boolean;
    description: string;
  }>;
  cover_assessment: {
    gloss: string;
    color_integrity: string;
    notes: string;
  };
  spine_assessment: {
    stress_lines: number;
    roll: string;
    splits: boolean;
    notes: string;
  };
  corner_assessment: {
    sharpness: string;
    weakest_corner: string;
    notes: string;
  };
  limitations_noted: string[];
  storage_inference: string;
  pressing_potential: string;
  grade_limiting_factor: string;
};
