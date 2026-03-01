// TODO: Task 2 — Implement IdentificationResult Zod schema
// Source: Implementation Spec §III.B

export type IdentificationResult = {
  title: string;
  issue_number: string;
  volume: number | null;
  publisher: string;
  cover_date: string;
  cover_date_year: number;
  era: string;
  variant_type: string;
  variant_detail: string | null;
  cover_price: string | null;
  significance: {
    type: string | null;
    description: string | null;
  };
  creators: {
    cover_artist: string | null;
    writer: string | null;
    interior_artist: string | null;
  };
  confidence_score: number;
  confidence_notes: string;
  flagged_for_review: boolean;
  photo_quality: string;
};
