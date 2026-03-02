'use client';

// Task 4 — Appraisal tool page: photo upload step
// Task 5 will extend this page with the processing pipeline and results feed.

import { useState } from 'react';
import UploadComponent from '@/components/upload';
import type { ProcessedImage } from '@/lib/types/upload';

export default function AppraisePage() {
  const [readyImages, setReadyImages] = useState<ProcessedImage[]>([]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          Appraise Your Collection
        </h1>
        <p className="mt-3 text-base text-gray-600">
          Photograph each comic book cover — front cover only, one photo per book.
          Our AI will identify and grade every issue instantly.
        </p>
      </div>

      {/* Minimum collection notice */}
      <div className="mb-6 rounded-md bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-200">
        <strong>Minimum collection size: 100 books.</strong> If you have fewer than 100
        comics, we&apos;re not the right fit — but we&apos;re happy to point you elsewhere.
      </div>

      <UploadComponent onImagesReady={setReadyImages} />

      {/* Action bar */}
      {readyImages.length > 0 && (
        <div className="mt-8 flex items-center justify-between rounded-lg bg-gray-50 px-6 py-4 ring-1 ring-gray-200">
          <p className="text-sm text-gray-700">
            <span className="font-semibold text-gray-900">{readyImages.length}</span>{' '}
            {readyImages.length === 1 ? 'photo' : 'photos'} ready to appraise
          </p>
          <button
            type="button"
            disabled
            title="Processing pipeline coming in Task 5"
            className="inline-flex items-center rounded-md bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm opacity-50 cursor-not-allowed"
          >
            Start Appraisal →
          </button>
        </div>
      )}
    </main>
  );
}
