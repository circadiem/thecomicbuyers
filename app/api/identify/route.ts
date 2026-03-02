// Task 5 — Comic identification endpoint
// POST /api/identify
// Body: { imageBase64: string; mimeType: ImageMediaType }
// Returns: IdentificationResult (validated Zod schema)

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { identifyComic, ClaudeApiError, ClaudeValidationError } from '@/lib/services/claude';
import type { ImageMediaType } from '@/lib/services/claude';

const RequestSchema = z.object({
  imageBase64: z.string().min(1, 'imageBase64 is required'),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
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

  const { imageBase64, mimeType } = parsed.data;

  try {
    const result = await identifyComic(imageBase64, mimeType as ImageMediaType);
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ClaudeValidationError) {
      return NextResponse.json(
        { error: 'AI response could not be parsed — please retry' },
        { status: 422 },
      );
    }
    if (err instanceof ClaudeApiError) {
      return NextResponse.json(
        { error: 'AI service unavailable — please retry' },
        { status: 503 },
      );
    }
    console.error('[/api/identify] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
