// Task 6 — Offer calculation endpoint
// POST /api/calculate-offer
// Body: { fmv_low: number; fmv_high: number; fmv_midpoint: number }
// Returns: OfferResult (tier + offer_low/high)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { calculateBookOffer } from '@/lib/services/offer';

const RequestSchema = z.object({
  fmv_low: z.number().nonnegative(),
  fmv_high: z.number().nonnegative(),
  fmv_midpoint: z.number().nonnegative(),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const { fmv_low, fmv_high, fmv_midpoint } = parsed.data;

  try {
    const result = calculateBookOffer(fmv_low, fmv_high, fmv_midpoint);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/calculate-offer] Unexpected error:', err);
    return NextResponse.json({ error: 'Offer calculation failed' }, { status: 500 });
  }
}
