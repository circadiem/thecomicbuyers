// Task 9 — Final submission endpoint
// Accepts the full appraisal payload, generates PDF + CSV, sends seller
// confirmation and internal notification emails, returns the reference number.

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
import { sendSellerConfirmation, sendInternalNotification } from '@/lib/services/email';

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
  const submitted_at = new Date().toISOString();
  const summary = buildCollectionSummary(books, reference_number);

  const reportData = { reference_number, generated_at: submitted_at, seller, adjustment, summary, books };

  // Generate PDF and CSV concurrently
  let pdfBuffer: Buffer;
  let csv: string;
  try {
    [pdfBuffer, csv] = await Promise.all([
      generatePDF(reportData),
      Promise.resolve(generateCSV(reportData)),
    ]);
  } catch (err) {
    console.error('Report generation failed during submission:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }

  // Send emails concurrently; log but do not fail submission if email errors
  const emailResults = await Promise.allSettled([
    sendSellerConfirmation(reportData),
    sendInternalNotification(reportData, pdfBuffer, csv),
  ]);

  for (const result of emailResults) {
    if (result.status === 'rejected') {
      console.error('Email send error (non-fatal):', result.reason);
    }
  }

  return NextResponse.json({ reference_number, submitted_at });
}
