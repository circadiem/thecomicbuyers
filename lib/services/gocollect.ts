// GoCollect API client and valuation service
// Queries FMV data by title/issue/grade; applies fallback table when no data found.
// Also handles hidden gem detection + Claude explanation generation.
// Source: Implementation Spec §VI.A, §VI.C

import { z } from 'zod';
import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';
import { ValuationResultSchema, type ValuationResult } from '@/lib/schemas/valuation';
import { OBVIOUS_KEYS } from '@/lib/config/obvious-keys';
import { generateHiddenGemExplanation } from '@/lib/services/claude';
import { HIDDEN_GEM_FMV_THRESHOLD } from '@/lib/config/constants';

// ---------------------------------------------------------------------------
// GoCollect API response schema
// ---------------------------------------------------------------------------

const GoCollectResponseSchema = z.object({
  found: z.boolean(),
  fmv_low: z.number().nonnegative().optional(),
  fmv_high: z.number().nonnegative().optional(),
  fmv_midpoint: z.number().nonnegative().optional(),
  last_sale_date: z.string().nullable().optional(),
  sales_volume_90d: z.number().int().nonnegative().nullable().optional(),
  trend: z.enum(['rising', 'stable', 'declining']).nullable().optional(),
  census_count: z.number().int().nonnegative().nullable().optional(),
});

type GoCollectResponse = z.infer<typeof GoCollectResponseSchema>;

interface FmvData {
  fmv_low: number;
  fmv_high: number;
  fmv_midpoint: number;
  last_sale_date: string | null;
  sales_volume_90d: number | null;
  trend: 'rising' | 'stable' | 'declining' | null;
  census_count: number | null;
}

// ---------------------------------------------------------------------------
// Fallback FMV interpolation table
// Anchor points per era: [grade, fmv_low, fmv_high].
// Grades between anchors are linearly interpolated.
// ---------------------------------------------------------------------------

type EraTable = Array<{ grade: number; low: number; high: number }>;

const FMV_TABLE: Record<IdentificationResult['era'], EraTable> = {
  Golden: [
    { grade: 9.8, low: 5000, high: 15000 },
    { grade: 9.4, low: 2000, high: 5000 },
    { grade: 8.0, low: 500, high: 1500 },
    { grade: 6.0, low: 150, high: 400 },
    { grade: 4.0, low: 50, high: 150 },
    { grade: 2.0, low: 20, high: 50 },
    { grade: 0.5, low: 5, high: 20 },
  ],
  Silver: [
    { grade: 9.8, low: 1000, high: 5000 },
    { grade: 9.4, low: 300, high: 800 },
    { grade: 8.0, low: 75, high: 200 },
    { grade: 6.0, low: 25, high: 75 },
    { grade: 4.0, low: 10, high: 25 },
    { grade: 2.0, low: 3, high: 10 },
    { grade: 0.5, low: 1, high: 3 },
  ],
  Bronze: [
    { grade: 9.8, low: 100, high: 500 },
    { grade: 9.4, low: 40, high: 120 },
    { grade: 8.0, low: 15, high: 40 },
    { grade: 6.0, low: 5, high: 15 },
    { grade: 4.0, low: 2, high: 6 },
    { grade: 2.0, low: 1, high: 3 },
    { grade: 0.5, low: 0.5, high: 1.5 },
  ],
  Copper: [
    { grade: 9.8, low: 20, high: 80 },
    { grade: 9.4, low: 8, high: 25 },
    { grade: 8.0, low: 3, high: 10 },
    { grade: 6.0, low: 1, high: 4 },
    { grade: 4.0, low: 0.5, high: 2 },
    { grade: 2.0, low: 0.25, high: 1 },
    { grade: 0.5, low: 0.1, high: 0.5 },
  ],
  Modern: [
    { grade: 9.8, low: 5, high: 20 },
    { grade: 9.4, low: 2, high: 8 },
    { grade: 8.0, low: 1, high: 4 },
    { grade: 6.0, low: 0.5, high: 2 },
    { grade: 4.0, low: 0.25, high: 1 },
    { grade: 2.0, low: 0.1, high: 0.5 },
    { grade: 0.5, low: 0.1, high: 0.25 },
  ],
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function interpolateFmv(
  era: IdentificationResult['era'],
  gradeMidpoint: number,
): { fmv_low: number; fmv_high: number } {
  const table = FMV_TABLE[era];

  // Clamp to table bounds
  if (gradeMidpoint >= table[0].grade) {
    return { fmv_low: table[0].low, fmv_high: table[0].high };
  }
  const last = table[table.length - 1];
  if (gradeMidpoint <= last.grade) {
    return { fmv_low: last.low, fmv_high: last.high };
  }

  // Find bracketing anchors and interpolate
  for (let i = 0; i < table.length - 1; i++) {
    const upper = table[i];
    const lower = table[i + 1];
    if (gradeMidpoint <= upper.grade && gradeMidpoint >= lower.grade) {
      const t = (upper.grade - gradeMidpoint) / (upper.grade - lower.grade);
      return {
        fmv_low: Math.round(lerp(upper.low, lower.low, t) * 100) / 100,
        fmv_high: Math.round(lerp(upper.high, lower.high, t) * 100) / 100,
      };
    }
  }

  return { fmv_low: last.low, fmv_high: last.high };
}

// ---------------------------------------------------------------------------
// GoCollect HTTP client (single attempt, short timeout)
// GoCollect is a non-critical enhancement — interpolation fallback exists.
// A single 3 s attempt keeps the /api/valuate function well within any
// Vercel plan's function-duration limit even when GoCollect is unavailable.
// ---------------------------------------------------------------------------

async function fetchGoCollectFmv(
  title: string,
  issue: string,
  volume: number | null,
  grade: number,
): Promise<GoCollectResponse | null> {
  const apiKey = process.env.GOCOLLECT_API_KEY;
  const baseUrl = process.env.GOCOLLECT_BASE_URL ?? 'https://api.gocollect.com';

  if (!apiKey) {
    // No key configured — fall through to fallback table
    return null;
  }

  const params = new URLSearchParams({
    title,
    issue,
    grade: grade.toFixed(1),
    ...(volume != null ? { volume: String(volume) } : {}),
  });

  try {
    const res = await fetch(`${baseUrl}/v1/books/fmv?${params.toString()}`, {
      headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(3_000),
    });

    if (res.status === 404) return { found: false };
    if (!res.ok) throw new Error(`GoCollect API returned ${res.status}`);

    const raw: unknown = await res.json();
    const parsed = GoCollectResponseSchema.safeParse(raw);
    return parsed.success ? parsed.data : { found: false };
  } catch (err) {
    console.warn('[gocollect] API unavailable, using interpolation fallback:', err);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Valuate a comic book by querying GoCollect and falling back to an era-based
 * interpolation table. Handles hidden gem detection and Claude explanation.
 */
export async function valuateComic(
  identification: IdentificationResult,
  condition: ConditionResult,
): Promise<ValuationResult> {
  // 1. Try GoCollect
  const gcResponse = await fetchGoCollectFmv(
    identification.title,
    identification.issue_number,
    identification.volume,
    condition.grade_midpoint,
  );

  let fmvData: FmvData;
  let gocollect_match = false;
  let data_source: ValuationResult['data_source'] = 'interpolated';

  if (gcResponse?.found && gcResponse.fmv_low != null && gcResponse.fmv_high != null) {
    gocollect_match = true;
    data_source = 'gocollect';
    fmvData = {
      fmv_low: gcResponse.fmv_low,
      fmv_high: gcResponse.fmv_high,
      fmv_midpoint:
        gcResponse.fmv_midpoint ?? (gcResponse.fmv_low + gcResponse.fmv_high) / 2,
      last_sale_date: gcResponse.last_sale_date ?? null,
      sales_volume_90d: gcResponse.sales_volume_90d ?? null,
      trend: gcResponse.trend ?? null,
      census_count: gcResponse.census_count ?? null,
    };
  } else {
    // 2. Fallback: interpolate from era × grade table
    const { fmv_low, fmv_high } = interpolateFmv(identification.era, condition.grade_midpoint);
    fmvData = {
      fmv_low,
      fmv_high,
      fmv_midpoint: Math.round(((fmv_low + fmv_high) / 2) * 100) / 100,
      last_sale_date: null,
      sales_volume_90d: null,
      trend: null,
      census_count: null,
    };
  }

  // 3. Hidden gem detection
  const bookKey = `${identification.title} #${identification.issue_number}`;
  const isObvious = OBVIOUS_KEYS.some(
    (key) => key.toLowerCase() === bookKey.toLowerCase(),
  );
  const isHiddenGem =
    fmvData.fmv_midpoint > HIDDEN_GEM_FMV_THRESHOLD &&
    identification.significance.type !== null &&
    !isObvious;

  // 4. Claude explanation for hidden gems (non-fatal if it fails)
  let hidden_gem_explanation: string | null = null;
  if (isHiddenGem && identification.significance.description) {
    try {
      hidden_gem_explanation = await generateHiddenGemExplanation(
        identification.title,
        identification.issue_number,
        identification.cover_date,
        identification.publisher,
        identification.significance.description,
        fmvData.fmv_low,
        fmvData.fmv_high,
      );
    } catch (err) {
      console.warn('[gocollect] Hidden gem explanation failed:', err);
    }
  }

  // 5. Assemble and validate
  return ValuationResultSchema.parse({
    gocollect_match,
    fmv_low: fmvData.fmv_low,
    fmv_high: fmvData.fmv_high,
    fmv_midpoint: fmvData.fmv_midpoint,
    data_source,
    last_sale_date: fmvData.last_sale_date,
    sales_volume_90d: fmvData.sales_volume_90d,
    trend: fmvData.trend,
    census_count: fmvData.census_count,
    is_hidden_gem: isHiddenGem,
    hidden_gem_explanation,
  });
}
