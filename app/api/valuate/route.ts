// Task 6 — Valuation endpoint
// POST /api/valuate
// Body: { identification: IdentificationResult; condition: ConditionResult }
// Returns: ValuationResult (GoCollect data or interpolated fallback + hidden gem flag)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { valuateComic } from '@/lib/services/gocollect';
import { IdentificationResultSchema } from '@/lib/schemas/identification';
import { ConditionResultSchema } from '@/lib/schemas/condition';

const RequestSchema = z.object({
  identification: IdentificationResultSchema,
  condition: ConditionResultSchema,
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

  try {
    const result = await valuateComic(parsed.data.identification, parsed.data.condition);
    return NextResponse.json(result);
  } catch (err) {
    console.error('[/api/valuate] Unexpected error:', err);
    return NextResponse.json({ error: 'Valuation failed — please retry' }, { status: 500 });
  }
}
