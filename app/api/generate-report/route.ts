// Task 8 — PDF & CSV generation endpoint
// Accepts pipeline results + questionnaire, generates reference number,
// builds collection summary, returns PDF (base64), CSV string, and summary.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SellerQuestionnaireSchema } from '@/lib/schemas/questionnaire';
import { IdentificationResultSchema } from '@/lib/schemas/identification';
import { ConditionResultSchema } from '@/lib/schemas/condition';
import { ValuationResultSchema } from '@/lib/schemas/valuation';
import { OfferResultSchema } from '@/lib/schemas/offer';
import { generateReferenceNumber } from '@/lib/utils/reference-number';
import { buildCollectionSummary } from '@/lib/services/offer';
import { generatePDF } from '@/lib/services/pdf-generator';
import { generateCSV } from '@/lib/services/csv-generator';

const GradeAdjustmentSchema = z.object({
  fmv_multiplier: z.number(),
  restoration_flag: z.boolean(),
  adjustment_reasons: z.array(z.string()),
});

const ReportBookSchema = z.object({
  identification: IdentificationResultSchema,
  condition: ConditionResultSchema,
  valuation: ValuationResultSchema,
  offer: OfferResultSchema,
  adjusted_offer: OfferResultSchema,
});

const RequestBodySchema = z.object({
  seller: SellerQuestionnaireSchema,
  adjustment: GradeAdjustmentSchema,
  books: z.array(ReportBookSchema).min(1),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = RequestBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request body', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { seller, adjustment, books } = parsed.data;
  const reference_number = generateReferenceNumber();
  const generated_at = new Date().toISOString();
  const summary = buildCollectionSummary(books, reference_number);

  const reportData = { reference_number, generated_at, seller, adjustment, summary, books };

  let pdfBuffer: Buffer;
  let csv: string;
  try {
    [pdfBuffer, csv] = await Promise.all([
      generatePDF(reportData),
      Promise.resolve(generateCSV(reportData)),
    ]);
  } catch (err) {
    console.error('Report generation failed:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }

  return NextResponse.json({
    reference_number,
    generated_at,
    summary,
    pdf_base64: pdfBuffer.toString('base64'),
    csv,
  });
}
