# Prompt 2: Condition Assessment

## Purpose

This prompt evaluates the physical condition of a comic book from the cover photograph. It is called after identification so the model has context about the specific title and era, which informs condition expectations. Stored in `lib/prompts/condition.ts`.

## API Configuration

```
Model: claude-sonnet-4-5-20250929
Max tokens: 1500
Temperature: 0
```

The condition prompt gets more token headroom than identification because defect descriptions can be verbose. 1500 tokens is sufficient for even heavily damaged books.

## System Prompt

```
You are a specialist comic book grading system applying the Overstreet / CGC grading scale (0.5 to 10.0). Your task is to assess the physical condition of a comic book from a photograph of its cover and return a conservative grade range.

GRADING PHILOSOPHY: You grade to buy, not to sell. This means you deliberately estimate below the optimistic scenario. Your grade range should represent a realistic floor and a probable ceiling. The actual grade, determined by physical inspection, should ideally fall at or above your midpoint estimate.

ASSESSMENT CRITERIA (evaluate each):

1. COVER GLOSS & REFLECTIVITY
   - Assess visible sheen and light reflection
   - Note: flash photography can artificially enhance gloss
   - Compare reflectivity to expected baseline for the era (Golden/Silver Age covers had different printing processes than Modern covers)

2. SPINE CONDITION
   - Spine stress lines (count and severity)
   - Spine roll (visible lean when viewed from above)
   - Color-breaking vs non-color-breaking stress
   - Spine splits (length and position)
   - Overall spine alignment and tightness

3. CORNER CONDITION
   - Sharpness vs blunting
   - Corner creases or bends
   - Assess all visible corners (typically 2-3 from a front cover photo)
   - Note if any corner is notably weaker than others

4. SURFACE CONDITION
   - Tears, chips, or missing pieces (note size and location)
   - Foxing or brown spots
   - Staining (water, liquid, fingerprint oils)
   - Writing, stamps, or stickers on cover
   - Color fading or sun bleaching
   - Production defects (miscut, miswrap, ink spots)

5. STAPLE CONDITION (if visible)
   - Rust (none, minor, significant)
   - Staple migration
   - Loose or popped staples
   - Staple alignment

6. GENERAL ASSESSMENT
   - Overall impression of preservation quality
   - Assessment of storage conditions (was this book cared for, or is it a survivor of neglect?)
   - Any signs of professional cleaning or pressing (unnaturally flat for an older book, etc.)

GRADE SCALE REFERENCE:
  10.0 (Gem Mint) - Perfect in every way
  9.8  (Near Mint/Mint) - Nearly perfect; minor printing defects only
  9.6  (Near Mint+) - Minor defect; nearly flat cover
  9.4  (Near Mint) - Minor wear; almost perfect
  9.2  (Near Mint-) - Minor cover wear; small defects
  9.0  (Very Fine/Near Mint) - Minor wear beginning to show
  8.0  (Very Fine) - Minor wear; small creases or bends
  7.0  (Fine/Very Fine) - Minor to moderate wear
  6.0  (Fine) - Above-average but with wear evident
  5.0  (Very Good/Fine) - Average but presentable
  4.0  (Very Good) - Below-average; significant wear
  3.0  (Good/Very Good) - Heavily read; multiple defects
  2.0  (Good) - Major defects; complete but damaged
  1.0  (Fair) - Severely damaged; barely complete

LIMITATIONS YOU MUST ACKNOWLEDGE:
You CANNOT assess from a cover photo alone:
- Interior page quality (white, off-white, cream, tan)
- Centerfold attachment
- Interior writing, stamps, or cut coupons
- Marvel Value Stamp presence/absence
- Subscription crease (may not be visible from front)
- Staple migration behind cover
- Professional restoration (color touch, tear seals)

Because of these limitations, your grade range should span at least 1.0 full grade points (e.g., 6.0-7.0, not 6.5-7.0) unless the book is clearly in exceptional or very poor condition.

RESPONSE FORMAT: Return ONLY valid JSON matching the schema. No preamble, no markdown, no explanation outside JSON.
```

## User Message Template

The condition assessment receives the image plus identification context to calibrate era-appropriate expectations:

```
Assess the condition of this comic book cover.

Context: This has been identified as [title] #[issue] ([cover_date]), [publisher]. [era] era.

Grade conservatively. Return only JSON.

[Image attached as base64 content block]
```

### Template Variables

|Variable      |Source                           |Example          |
|--------------|---------------------------------|-----------------|
|`[title]`     |IdentificationResult.title       |“Incredible Hulk”|
|`[issue]`     |IdentificationResult.issue_number|“181”            |
|`[cover_date]`|IdentificationResult.cover_date  |“November 1974”  |
|`[publisher]` |IdentificationResult.publisher   |“Marvel Comics”  |
|`[era]`       |IdentificationResult.era         |“Bronze”         |

## Output Schema: ConditionResult

```json
{
  "grade_low": 5.5,
  "grade_high": 7.0,
  "grade_midpoint": 6.25,
  "grade_label_low": "Fine",
  "grade_label_high": "Fine/Very Fine",
  "primary_defects": [
    {
      "type": "spine_stress",
      "severity": "minor",
      "location": "lower spine, approximately 1/3 from bottom",
      "color_breaking": false,
      "description": "Two light stress lines visible at lower third of spine. Non-color-breaking. Consistent with normal handling wear for the era."
    }
  ],
  "cover_assessment": {
    "gloss": "moderate",
    "color_integrity": "good",
    "notes": "Cover retains above-average gloss for a 1974 printing. Reds and greens hold strong saturation. No visible fading."
  },
  "spine_assessment": {
    "stress_lines": 2,
    "roll": "none",
    "splits": false,
    "notes": "Spine is tight and well-aligned. Two minor stress lines at lower third. No roll detected from this angle."
  },
  "corner_assessment": {
    "sharpness": "slightly_blunted",
    "weakest_corner": "bottom_right",
    "notes": "Top corners appear sharp. Bottom right shows slight blunting. Bottom left partially obscured by angle."
  },
  "limitations_noted": [
    "Interior page quality cannot be assessed",
    "Centerfold attachment unknown",
    "Marvel Value Stamp status unknown",
    "Staple condition partially visible only"
  ],
  "storage_inference": "Book appears to have been stored with reasonable care. Cover condition suggests bag and board storage for at least part of its life.",
  "pressing_potential": "minor_improvement",
  "grade_limiting_factor": "Slight corner blunting at bottom right and two spine stress lines are the primary grade-limiting factors."
}
```

### Field Details

|Field                             |Type    |Description                                                                                                    |
|----------------------------------|--------|---------------------------------------------------------------------------------------------------------------|
|`grade_low`                       |number  |Conservative floor estimate (e.g., 5.5)                                                                        |
|`grade_high`                      |number  |Probable ceiling estimate (e.g., 7.0)                                                                          |
|`grade_midpoint`                  |number  |Calculated: (grade_low + grade_high) / 2                                                                       |
|`grade_label_low`                 |string  |Human-readable grade name for floor                                                                            |
|`grade_label_high`                |string  |Human-readable grade name for ceiling                                                                          |
|`primary_defects`                 |array   |List of observed defects                                                                                       |
|`primary_defects[].type`          |string  |One of: spine_stress, corner_blunt, tear, stain, foxing, writing, chip, crease, color_loss, staple_rust, fading|
|`primary_defects[].severity`      |string  |One of: minor, moderate, significant                                                                           |
|`primary_defects[].location`      |string  |Descriptive location on the book                                                                               |
|`primary_defects[].color_breaking`|boolean |Does the defect break through the ink layer?                                                                   |
|`primary_defects[].description`   |string  |Detailed observation                                                                                           |
|`cover_assessment.gloss`          |string  |One of: high, moderate, low, absent                                                                            |
|`cover_assessment.color_integrity`|string  |One of: excellent, good, fair, poor                                                                            |
|`spine_assessment.stress_lines`   |number  |Count of visible stress lines                                                                                  |
|`spine_assessment.roll`           |string  |One of: none, slight, moderate, significant                                                                    |
|`corner_assessment.sharpness`     |string  |One of: sharp, slightly_blunted, blunted, rounded                                                              |
|`corner_assessment.weakest_corner`|string  |One of: top_left, top_right, bottom_left, bottom_right                                                         |
|`limitations_noted`               |string[]|What cannot be assessed from the photo                                                                         |
|`storage_inference`               |string  |Assessment of likely storage quality                                                                           |
|`pressing_potential`              |string  |One of: none, minor_improvement, significant                                                                   |
|`grade_limiting_factor`           |string  |The single biggest factor limiting the grade                                                                   |

### Zod Schema (for `lib/schemas/condition.ts`)

```typescript
import { z } from 'zod';

export const DefectSchema = z.object({
  type: z.enum([
    'spine_stress', 'corner_blunt', 'tear', 'stain', 'foxing',
    'writing', 'chip', 'crease', 'color_loss', 'staple_rust', 'fading'
  ]),
  severity: z.enum(['minor', 'moderate', 'significant']),
  location: z.string(),
  color_breaking: z.boolean(),
  description: z.string(),
});

export const CoverAssessmentSchema = z.object({
  gloss: z.enum(['high', 'moderate', 'low', 'absent']),
  color_integrity: z.enum(['excellent', 'good', 'fair', 'poor']),
  notes: z.string(),
});

export const SpineAssessmentSchema = z.object({
  stress_lines: z.number().int().min(0),
  roll: z.enum(['none', 'slight', 'moderate', 'significant']),
  splits: z.boolean(),
  notes: z.string(),
});

export const CornerAssessmentSchema = z.object({
  sharpness: z.enum(['sharp', 'slightly_blunted', 'blunted', 'rounded']),
  weakest_corner: z.enum(['top_left', 'top_right', 'bottom_left', 'bottom_right']),
  notes: z.string(),
});

export const ConditionResultSchema = z.object({
  grade_low: z.number().min(0.5).max(10.0),
  grade_high: z.number().min(0.5).max(10.0),
  grade_midpoint: z.number().min(0.5).max(10.0),
  grade_label_low: z.string(),
  grade_label_high: z.string(),
  primary_defects: z.array(DefectSchema),
  cover_assessment: CoverAssessmentSchema,
  spine_assessment: SpineAssessmentSchema,
  corner_assessment: CornerAssessmentSchema,
  limitations_noted: z.array(z.string()),
  storage_inference: z.string(),
  pressing_potential: z.enum(['none', 'minor_improvement', 'significant']),
  grade_limiting_factor: z.string(),
});

export type ConditionResult = z.infer<typeof ConditionResultSchema>;
```

## Seller Questionnaire Grade Adjustments

After the AI condition assessment, the seller questionnaire applies collection-level adjustments to all ConditionResult objects:

|Question                     |Response              |Adjustment                      |
|-----------------------------|----------------------|--------------------------------|
|How were these comics stored?|Bags & boards in boxes|No adjustment                   |
|                             |Loose in boxes        |-0.5 from grade_high            |
|                             |Loose on shelves      |-0.5 from both                  |
|                             |Attic or basement     |-1.0 from both                  |
|                             |Unknown               |-0.5 from grade_high            |
|General page color?          |White                 |No adjustment                   |
|                             |Off-white             |No adjustment (expected for age)|
|                             |Yellowed              |-0.5 from both                  |
|                             |Brittle               |-1.5 from both                  |
|                             |Mixed / Unknown       |-0.5 from grade_high            |
|Missing pages or cut coupons?|None                  |No adjustment                   |
|                             |A few                 |Flag affected books for review  |
|                             |Many                  |-2.0 from both                  |
|                             |Unknown               |-0.5 from grade_high            |
|Climate-controlled storage?  |Yes                   |No adjustment                   |
|                             |No                    |-0.5 from grade_high            |
|                             |Partially / Unknown   |-0.25 from grade_high           |

**Rules:**

- Adjustments are cumulative
- Adjusted grade can never drop below 0.5
- Maximum total adjustment: -3.0 points from the AI’s original estimate
- Recalculate grade_midpoint after adjustments
