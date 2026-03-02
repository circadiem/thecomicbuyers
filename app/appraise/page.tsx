'use client';

// Tasks 4/5/6 — Appraisal tool: upload → identify → grade → valuate → offer
// Pipeline runs concurrently per image; each card updates in real-time.

import { useCallback, useState } from 'react';
import UploadComponent from '@/components/upload';
import ResultsFeed from '@/components/results';
import type { ProcessedImage } from '@/lib/types/upload';
import type { ComicProcessingState } from '@/lib/types/pipeline';
import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ConditionResult } from '@/lib/schemas/condition';
import type { ValuationResult } from '@/lib/schemas/valuation';
import type { OfferResult } from '@/lib/schemas/offer';

// ---------------------------------------------------------------------------
// API call helpers
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
// Phase type
// ---------------------------------------------------------------------------

type Phase = 'upload' | 'processing' | 'done';

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

export default function AppraisePage() {
  const [phase, setPhase] = useState<Phase>('upload');
  const [readyImages, setReadyImages] = useState<ProcessedImage[]>([]);
  const [comics, setComics] = useState<ComicProcessingState[]>([]);

  const updateComic = useCallback(
    (id: string, patch: Partial<ComicProcessingState>) => {
      setComics((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      );
    },
    [],
  );

  // Process one image through the full pipeline, updating state after each step
  const processOne = useCallback(
    async (img: ProcessedImage) => {
      // Step 1: Identify
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

      // Step 2: Grade
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

      // Step 3: Valuate (GoCollect + hidden gem detection)
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

      // Step 4: Calculate offer
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

  function handleStartOver() {
    setPhase('upload');
    setReadyImages([]);
    setComics([]);
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
          Photograph each comic book cover — front cover only, one photo per book. Our AI will
          identify, grade, and value every issue instantly.
        </p>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* UPLOAD PHASE                                                        */}
      {/* ------------------------------------------------------------------ */}
      {phase === 'upload' && (
        <>
          <div className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
            <strong>Minimum collection size: 100 books.</strong> If you have fewer than 100
            comics, we&apos;re not the right fit — but we&apos;re happy to point you elsewhere.
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

      {/* ------------------------------------------------------------------ */}
      {/* PROCESSING + DONE PHASES                                           */}
      {/* ------------------------------------------------------------------ */}
      {(phase === 'processing' || phase === 'done') && (
        <>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {phase === 'processing' ? 'Processing your collection…' : 'Appraisal complete'}
            </h2>
            {phase === 'done' && (
              <button
                type="button"
                onClick={handleStartOver}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                ← Start over
              </button>
            )}
          </div>

          <ResultsFeed comics={comics} />

          {/* Placeholder CTA — will become submission flow in Task 9 */}
          {phase === 'done' && (
            <div className="mt-8 rounded-lg bg-gray-50 px-6 py-5 ring-1 ring-gray-200 text-center">
              <p className="text-sm text-gray-600">
                Seller questionnaire and formal offer submission coming next.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  );
}
