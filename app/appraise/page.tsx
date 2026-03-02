'use client';

// Tasks 4/5/6/7 — Full appraisal tool
// Phases: upload → processing → done → questionnaire → offer
// Pipeline: identify → grade → valuate → offer (concurrent per image)
// Questionnaire: grade adjustment applied to produce adjusted_offer per book

import { useCallback, useState } from 'react';
import UploadComponent from '@/components/upload';
import ResultsFeed from '@/components/results';
import Questionnaire from '@/components/questionnaire';
import type { ProcessedImage } from '@/lib/types/upload';
import type { ComicProcessingState } from '@/lib/types/pipeline';
import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';
import type { ValuationResult } from '@/lib/schemas/valuation';
import type { OfferResult } from '@/lib/schemas/offer';
import type { SellerQuestionnaire } from '@/lib/schemas/questionnaire';
import {
  computeGradeAdjustment,
  applyAdjustmentToOffer,
} from '@/lib/services/grade-adjustment';
import type { GradeAdjustment } from '@/lib/services/grade-adjustment';
import { OFFER_VALIDITY_DAYS } from '@/lib/config/constants';

// ---------------------------------------------------------------------------
// API call helper
// ---------------------------------------------------------------------------

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Request to ${path} failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Currency formatter
// ---------------------------------------------------------------------------

function fmt(n: number): string {
  return n < 1 ? `$${n.toFixed(2)}` : `$${Math.round(n).toLocaleString()}`;
}

// ---------------------------------------------------------------------------
// Phase type
// ---------------------------------------------------------------------------

type Phase = 'upload' | 'processing' | 'done' | 'questionnaire' | 'offer';

// ---------------------------------------------------------------------------
// Adjusted offer summary component
// ---------------------------------------------------------------------------

function AdjustedOfferSummary({
  comics,
  questionnaire,
  adjustment,
}: {
  comics: ComicProcessingState[];
  questionnaire: SellerQuestionnaire;
  adjustment: GradeAdjustment;
}) {
  const completed = comics.filter(
    (c) => c.status === 'complete' && c.adjusted_offer,
  );
  const totalOfferLow = completed.reduce(
    (sum, c) => sum + (c.adjusted_offer?.offer_low ?? 0),
    0,
  );
  const totalOfferHigh = completed.reduce(
    (sum, c) => sum + (c.adjusted_offer?.offer_high ?? 0),
    0,
  );
  const errored = comics.filter((c) => c.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Total offer */}
      <div className="rounded-xl bg-green-50 px-6 py-5 ring-1 ring-green-200">
        <p className="text-sm font-medium text-green-700">Estimated Cash Offer</p>
        <p className="mt-1 text-3xl font-bold text-green-900">
          {fmt(totalOfferLow)} – {fmt(totalOfferHigh)}
        </p>
        <p className="mt-1 text-xs text-green-600">
          Based on {completed.length} identified book
          {completed.length !== 1 ? 's' : ''}
          {errored > 0 && ` · ${errored} could not be processed`}
        </p>
      </div>

      {/* Storage adjustment notice */}
      {adjustment.adjustment_reasons.length > 0 && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 ring-1 ring-blue-100">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            Storage adjustment applied
          </p>
          <ul className="space-y-0.5">
            {adjustment.adjustment_reasons.map((reason, i) => (
              <li key={i} className="text-xs text-blue-700">
                · {reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Restoration flag */}
      {adjustment.restoration_flag && (
        <div className="rounded-lg bg-amber-50 px-4 py-3 ring-1 ring-amber-200">
          <p className="text-xs font-semibold text-amber-800">
            Restoration disclosure noted — all books will be reviewed by our team
            before finalising the offer.
          </p>
        </div>
      )}

      {/* Seller recap */}
      <div className="rounded-lg border border-gray-200 bg-white px-4 py-3 text-xs text-gray-600 space-y-0.5">
        <p>
          <span className="font-medium text-gray-800">{questionnaire.name}</span> ·{' '}
          {questionnaire.email} · {questionnaire.phone}
        </p>
        <p>
          {questionnaire.city}, {questionnaire.state} {questionnaire.zip}
        </p>
      </div>

      {/* Submit CTA — Task 9 */}
      <button
        type="button"
        disabled
        title="Submission flow coming in Task 9"
        className="w-full cursor-not-allowed rounded-md bg-green-600 px-5 py-3 text-sm font-semibold text-white opacity-50 shadow-sm"
      >
        Submit for Formal Offer →
      </button>
      <p className="text-center text-xs text-gray-400">
        Offer valid for {OFFER_VALIDITY_DAYS} days from submission date
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AppraisePage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [readyImages, setReadyImages] = useState<ProcessedImage[]>([]);
  const [comics, setComics] = useState<ComicProcessingState[]>([]);
  const [questionnaire, setQuestionnaire] = useState<SellerQuestionnaire | null>(null);
  const [adjustment, setAdjustment] = useState<GradeAdjustment | null>(null);

  const updateComic = useCallback(
    (id: string, patch: Partial<ComicProcessingState>) => {
      setComics((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  const processOne = useCallback(
    async (img: ProcessedImage) => {
      updateComic(img.id, { status: 'identifying' });
      let identification: IdentificationResult;
      try {
        identification = await apiPost<IdentificationResult>('/api/identify', {
          imageBase64: img.processedBase64,
          mimeType: img.mimeType,
        });
      } catch (err) {
        updateComic(img.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Identification failed',
        });
        return;
      }

      updateComic(img.id, { status: 'grading', identification });
      let condition: ConditionResult;
      try {
        condition = await apiPost<ConditionResult>('/api/grade', {
          imageBase64: img.processedBase64,
          mimeType: img.mimeType,
          identification,
        });
      } catch (err) {
        updateComic(img.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Grading failed',
        });
        return;
      }

      updateComic(img.id, { status: 'valuating', condition });
      let valuation: ValuationResult;
      try {
        valuation = await apiPost<ValuationResult>('/api/valuate', {
          identification,
          condition,
        });
      } catch (err) {
        updateComic(img.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Valuation failed',
        });
        return;
      }

      let offer: OfferResult;
      try {
        offer = await apiPost<OfferResult>('/api/calculate-offer', {
          fmv_low: valuation.fmv_low,
          fmv_high: valuation.fmv_high,
          fmv_midpoint: valuation.fmv_midpoint,
        });
      } catch (err) {
        updateComic(img.id, {
          status: 'error',
          error: err instanceof Error ? err.message : 'Offer calculation failed',
        });
        return;
      }

      updateComic(img.id, { status: 'complete', valuation, offer });
    },
    [updateComic],
  );

  function handleStartAppraisal() {
    if (readyImages.length === 0) return;
    const initial: ComicProcessingState[] = readyImages.map((img) => ({
      id: img.id,
      originalName: img.originalName,
      thumbnailDataUrl: img.thumbnailDataUrl,
      status: 'pending',
    }));
    setComics(initial);
    setPhase('processing');
    Promise.all(readyImages.map((img) => processOne(img))).then(() => {
      setPhase('done');
    });
  }

  function handleQuestionnaireSubmit(data: SellerQuestionnaire) {
    const adj = computeGradeAdjustment(data);
    setQuestionnaire(data);
    setAdjustment(adj);
    setComics((prev) =>
      prev.map((comic) => {
        if (comic.status !== 'complete' || !comic.valuation) return comic;
        return { ...comic, adjusted_offer: applyAdjustmentToOffer(comic.valuation, adj) };
      }),
    );
    setPhase('offer');
  }

  function handleStartOver() {
    setPhase('upload');
    setReadyImages([]);
    setComics([]);
    setQuestionnaire(null);
    setAdjustment(null);
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Appraise Your Collection
        </h1>
        <p className="mt-3 text-base text-gray-600">
          Photograph each comic book cover — front cover only, one photo per book. Our AI
          will identify, grade, and value every issue instantly.
        </p>
      </div>

      {/* UPLOAD */}
      {phase === 'upload' && (
        <>
          <div className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <strong>Minimum collection size: 100 books.</strong> If you have fewer than
            100 comics, we&apos;re not the right fit — but we&apos;re happy to point you
            elsewhere.
          </div>
          <UploadComponent onImagesReady={setReadyImages} />
          {readyImages.length > 0 && (
            <div className="mt-8 flex items-center justify-between rounded-lg bg-gray-50 px-6 py-4 ring-1 ring-gray-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold text-gray-900">{readyImages.length}</span>{' '}
                {readyImages.length === 1 ? 'photo' : 'photos'} ready
              </p>
              <button
                type="button"
                onClick={handleStartAppraisal}
                className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Start Appraisal →
              </button>
            </div>
          )}
        </>
      )}

      {/* PROCESSING */}
      {phase === 'processing' && (
        <>
          <h2 className="mb-6 text-lg font-semibold text-gray-900">
            Processing your collection…
          </h2>
          <ResultsFeed comics={comics} />
        </>
      )}

      {/* DONE */}
      {phase === 'done' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Identification complete</h2>
            <button
              type="button"
              onClick={handleStartOver}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Start over
            </button>
          </div>
          <ResultsFeed comics={comics} />
          <div className="mt-8 rounded-lg bg-blue-50 px-6 py-5 ring-1 ring-blue-200 text-center">
            <p className="text-sm font-medium text-blue-900">
              Ready for your personalised cash offer?
            </p>
            <p className="mt-1 text-xs text-blue-700">
              Answer a few quick questions about storage and timing so we can fine-tune the
              valuation.
            </p>
            <button
              type="button"
              onClick={() => setPhase('questionnaire')}
              className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              Continue →
            </button>
          </div>
        </>
      )}

      {/* QUESTIONNAIRE */}
      {phase === 'questionnaire' && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Tell us about your collection
            </h2>
            <button
              type="button"
              onClick={() => setPhase('done')}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Back to results
            </button>
          </div>
          <Questionnaire onSubmit={handleQuestionnaireSubmit} />
        </>
      )}

      {/* OFFER */}
      {phase === 'offer' && questionnaire && adjustment && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your offer estimate</h2>
            <button
              type="button"
              onClick={handleStartOver}
              className="text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              ← Start over
            </button>
          </div>
          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <AdjustedOfferSummary
                comics={comics}
                questionnaire={questionnaire}
                adjustment={adjustment}
              />
            </div>
            <div className="md:col-span-3">
              <p className="mb-3 text-sm font-medium text-gray-700">Per-book breakdown</p>
              <ResultsFeed comics={comics} useAdjusted />
            </div>
          </div>
        </>
      )}
    </main>
  );
}
