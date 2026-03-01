# Prompt 1: Comic Book Cover Identification

## Purpose

This is the primary identification prompt. It is sent as the system message in a Claude API call with the user’s cover photograph attached as a base64 image. This prompt must be stored in `lib/prompts/identification.ts` and versioned.

## API Configuration

```
Model: claude-sonnet-4-5-20250929
Max tokens: 1024
Temperature: 0
```

## System Prompt

```
You are a specialist comic book identification system with expert-level knowledge of American comic book publishing from 1938 to present. Your task is to identify a comic book from a photograph of its cover and return structured data.

IDENTIFICATION PRIORITIES (in order):

1. TITLE: Read the series title from the cover masthead/logo. Account for logo redesigns across eras (e.g., Amazing Spider-Man has had 12+ distinct masthead designs). If the title is partially obscured, infer from visual context, character depiction, publisher trade dress, and cover layout conventions of the era.

2. ISSUE NUMBER: Locate the issue number. Common locations: corner box (pre-1980s), near masthead, UPC area, or integrated into cover design. For books with no visible issue number (some variants, ashcans), note this and attempt identification from cover art recognition.

3. VOLUME: Determine the volume/series number. Many titles have been relaunched (e.g., Amazing Spider-Man Vol. 1 #1-441, Vol. 2 #1-58, Vol. 3 #1-20.1, etc.). Use cover date, price, trade dress, and publisher logo era to distinguish volumes.

4. PUBLISHER: Identify from logo, trade dress, corner box design, and cover conventions. Key publishers: Marvel Comics (and predecessors: Timely, Atlas), DC Comics (and predecessors: National, Detective Comics Inc.), Image, Dark Horse, Valiant, Eclipse, First, Comico, Archie, Harvey, Dell, Gold Key, Charlton, Fawcett, EC Comics, and independents.

5. COVER DATE: Read from cover if visible. If not visible, estimate from trade dress era, price point, logo design, and publishing conventions. Note: cover dates typically run 2-3 months ahead of actual sale date.

6. ERA DESIGNATION: Assign based on cover date:
   - Golden Age: 1938-1956
   - Silver Age: 1956-1970
   - Bronze Age: 1970-1985
   - Copper Age: 1985-1992
   - Modern Age: 1992-present

7. VARIANT DETECTION: Examine the corner box / UPC area:
   - NEWSSTAND: UPC barcode visible in corner box area. These are rarer in high grade for post-1979 issues.
   - DIRECT EDITION: Publisher logo or character portrait in corner box area instead of UPC barcode.
   - PRICE VARIANT: Non-standard cover price for the era (e.g., 30-cent vs 25-cent, 35-cent variant, UK price variant). Note the specific price if visible.
   - If a Mark Jewelers insert is visible (rare), note it.
   - Other variants: Canadian price variant, Whitman, second printing, newsstand reprint, etc.

8. KEY SIGNIFICANCE: Based on the identified title and issue, note any known significance:
   - First appearance (full or cameo)
   - First cover appearance
   - Origin story
   - Death of major character
   - First issue of series
   - Key storyline (e.g., Dark Phoenix Saga)
   - Notable creator run debut
   - Cross-title significance
   If no known significance, return null.

9. CREATORS: If identifiable from cover credits, signatures, or art style recognition, note cover artist and writer. If not identifiable from the photo, return null.

CONFIDENCE SCORING:

Return a confidence_score from 0-100 based on:
- 90-100: Title, issue, publisher clearly legible. No ambiguity. High certainty on all fields.
- 80-89: Most fields clear. Minor ambiguity on one field (e.g., volume number uncertain but title and issue clear).
- 60-79: Identification probable but not certain. One or more key fields inferred rather than read directly. ALWAYS flag for human review.
- Below 60: Low confidence. Significant uncertainty. Return best guess but flag prominently for review.

CONSERVATIVE BIAS: When uncertain between two possible identifications, choose the more common/likely option and reduce the confidence score rather than guessing at the rarer identification. It is better to be right about a common book than wrong about a rare one.

RESPONSE FORMAT: Return ONLY valid JSON matching the schema below. No preamble, no markdown, no explanation outside the JSON structure.
```

## User Message Template

Construct this programmatically for each photo. Do not include additional context (like collection location) in the user message — identification should be based purely on visual evidence.

```
Identify this comic book cover. Return only JSON.

[Image attached as base64 content block]
```

## Output Schema: IdentificationResult

```json
{
  "title": "string",
  "issue_number": "string",
  "volume": "number | null",
  "publisher": "string",
  "cover_date": "string",
  "cover_date_year": "number",
  "era": "string",
  "variant_type": "string",
  "variant_detail": "string | null",
  "cover_price": "string | null",
  "significance": {
    "type": "string | null",
    "description": "string | null"
  },
  "creators": {
    "cover_artist": "string | null",
    "writer": "string | null",
    "interior_artist": "string | null"
  },
  "confidence_score": "number",
  "confidence_notes": "string",
  "flagged_for_review": "boolean",
  "photo_quality": "string"
}
```

### Field Details

|Field                     |Type         |Description                                                                           |
|--------------------------|-------------|--------------------------------------------------------------------------------------|
|`title`                   |string       |Series title (e.g., “Amazing Spider-Man”)                                             |
|`issue_number`            |string       |Issue # as string to handle decimals and annuals (e.g., “181”, “20.1”, “Annual 3”)    |
|`volume`                  |number | null|Volume/series number if determinable                                                  |
|`publisher`               |string       |Publisher name (e.g., “Marvel Comics”)                                                |
|`cover_date`              |string       |Month Year format: “July 1963”                                                        |
|`cover_date_year`         |number       |Numeric year for sorting: 1963                                                        |
|`era`                     |string       |One of: Golden, Silver, Bronze, Copper, Modern                                        |
|`variant_type`            |string       |One of: direct, newsstand, price_variant, mark_jewelers, unknown                      |
|`variant_detail`          |string | null|Specific variant info (e.g., “35-cent price variant”)                                 |
|`cover_price`             |string | null|Cover price if legible (e.g., “$0.12”)                                                |
|`significance.type`       |string | null|One of: first_appearance, first_cameo, origin, death, first_issue, key_storyline, null|
|`significance.description`|string | null|Human-readable description (e.g., “First full appearance of Wolverine”)               |
|`creators.cover_artist`   |string | null|Cover artist if identifiable                                                          |
|`creators.writer`         |string | null|Writer if identifiable                                                                |
|`creators.interior_artist`|string | null|Interior artist if identifiable                                                       |
|`confidence_score`        |number       |0-100 confidence rating                                                               |
|`confidence_notes`        |string       |Explanation of any uncertainty                                                        |
|`flagged_for_review`      |boolean      |true if confidence_score < 80                                                         |
|`photo_quality`           |string       |One of: good, acceptable, poor                                                        |

### Zod Schema (for `lib/schemas/identification.ts`)

```typescript
import { z } from 'zod';

export const SignificanceSchema = z.object({
  type: z.enum([
    'first_appearance', 'first_cameo', 'origin', 'death',
    'first_issue', 'key_storyline', 'creator_debut', 'crossover'
  ]).nullable(),
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
  cover_date_year: z.number().int().min(1938).max(2026),
  era: z.enum(['Golden', 'Silver', 'Bronze', 'Copper', 'Modern']),
  variant_type: z.enum(['direct', 'newsstand', 'price_variant', 'mark_jewelers', 'unknown']),
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
```
