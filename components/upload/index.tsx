'use client';

// Task 4 — Photo upload component with rapid scan camera interface
// Supports: standard file picker, drag-and-drop, and mobile camera capture
// Source: Implementation Spec §IX

import { useCallback, useRef, useState } from 'react';
import { validateAndProcessImage } from '@/lib/utils/image-validation';
import type { ProcessedImage } from '@/lib/types/upload';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function UploadIcon() {
  return (
    <svg
      className="mx-auto h-12 w-12 text-gray-400"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Per-image state types (internal to component)
// ---------------------------------------------------------------------------

type ImageStatus = 'processing' | 'valid' | 'error';

interface ImageEntry {
  id: string;
  originalName: string;
  thumbnailDataUrl: string;
  status: ImageStatus;
  // Set when status === 'valid'
  processedBase64?: string;
  mimeType?: string;
  // Set when status === 'error'
  errorMessage?: string;
}

// ---------------------------------------------------------------------------
// UploadComponent props
// ---------------------------------------------------------------------------

export interface UploadComponentProps {
  /** Called whenever the set of successfully validated images changes. */
  onImagesReady: (images: ProcessedImage[]) => void;
  /** Optional: hard limit on number of images (default: unlimited) */
  maxImages?: number;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UploadComponent({
  onImagesReady,
  maxImages,
}: UploadComponentProps) {
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Notify parent whenever images list changes — only valid entries
  function notifyParent(updatedImages: ImageEntry[]) {
    const ready: ProcessedImage[] = updatedImages
      .filter((img): img is ImageEntry & { status: 'valid'; processedBase64: string; mimeType: string } =>
        img.status === 'valid' && !!img.processedBase64 && !!img.mimeType,
      )
      .map((img) => ({
        id: img.id,
        originalName: img.originalName,
        thumbnailDataUrl: img.thumbnailDataUrl,
        processedBase64: img.processedBase64,
        mimeType: img.mimeType,
      }));
    onImagesReady(ready);
  }

  const processFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      // Check max images limit
      if (maxImages !== undefined) {
        const currentValid = images.filter((img) => img.status !== 'error').length;
        const remaining = maxImages - currentValid;
        if (remaining <= 0) return;
        fileArray.splice(remaining);
      }

      // Create placeholder entries immediately so the user sees progress
      const placeholders: ImageEntry[] = fileArray.map((file) => ({
        id: crypto.randomUUID(),
        originalName: file.name,
        thumbnailDataUrl: '',
        status: 'processing' as ImageStatus,
      }));

      setImages((prev) => {
        const updated = [...prev, ...placeholders];
        return updated;
      });

      // Process each file concurrently
      const results = await Promise.all(
        fileArray.map(async (file, idx) => {
          // Generate a quick thumbnail (original dimensions, unprocessed) for instant preview
          const thumbnailDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string ?? '');
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
          });

          const result = await validateAndProcessImage(file, file.type);

          return {
            id: placeholders[idx].id,
            thumbnailDataUrl,
            result,
          };
        }),
      );

      setImages((prev) => {
        const updated = prev.map((entry) => {
          const processed = results.find((r) => r.id === entry.id);
          if (!processed) return entry;

          if (processed.result.valid) {
            return {
              ...entry,
              thumbnailDataUrl: processed.thumbnailDataUrl,
              status: 'valid' as ImageStatus,
              processedBase64: processed.result.processedBase64,
              mimeType: processed.result.mimeType,
            };
          } else {
            return {
              ...entry,
              thumbnailDataUrl: processed.thumbnailDataUrl,
              status: 'error' as ImageStatus,
              errorMessage: processed.result.reason,
            };
          }
        });
        notifyParent(updated);
        return updated;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [images, maxImages, onImagesReady],
  );

  function removeImage(id: string) {
    setImages((prev) => {
      const updated = prev.filter((img) => img.id !== id);
      notifyParent(updated);
      return updated;
    });
  }

  // Drag-and-drop handlers
  function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      // Reset input so the same file can be re-selected if removed
      e.target.value = '';
    }
  }

  const validCount = images.filter((img) => img.status === 'valid').length;
  const processingCount = images.filter((img) => img.status === 'processing').length;
  const errorCount = images.filter((img) => img.status === 'error').length;

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          'relative rounded-lg border-2 border-dashed p-8 text-center transition-colors',
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400',
        ].join(' ')}
      >
        <UploadIcon />
        <p className="mt-4 text-sm font-medium text-gray-700">
          Drag &amp; drop comic cover photos here
        </p>
        <p className="mt-1 text-xs text-gray-500">JPEG, PNG, or WEBP — up to 20 MB each</p>

        <div className="mt-4 flex flex-wrap justify-center gap-3">
          {/* Standard file picker */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Choose Files
          </button>

          {/* Mobile camera capture */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <CameraIcon />
            Use Camera
          </button>
        </div>

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Choose comic cover photos"
        />
        {/* Camera input: capture="environment" opens rear camera on mobile */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileInputChange}
          className="sr-only"
          aria-label="Take photo with camera"
        />
      </div>

      {/* Status summary */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {validCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-green-700">
              <span className="h-2 w-2 rounded-full bg-green-500" />
              {validCount} ready
            </span>
          )}
          {processingCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-blue-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              {processingCount} processing…
            </span>
          )}
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 font-medium text-red-700">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              {errorCount} rejected
            </span>
          )}
        </div>
      )}

      {/* Thumbnail grid */}
      {images.length > 0 && (
        <ul
          role="list"
          className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
        >
          {images.map((img) => (
            <li key={img.id} className="relative">
              <div
                className={[
                  'group relative overflow-hidden rounded-lg bg-gray-100 ring-2',
                  img.status === 'valid'
                    ? 'ring-green-400'
                    : img.status === 'error'
                      ? 'ring-red-400'
                      : 'ring-blue-300',
                ].join(' ')}
              >
                {/* Thumbnail image */}
                {img.thumbnailDataUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={img.thumbnailDataUrl}
                    alt={img.originalName}
                    className="aspect-[3/4] w-full object-cover"
                  />
                ) : (
                  <div className="flex aspect-[3/4] w-full items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-500" />
                  </div>
                )}

                {/* Processing overlay */}
                {img.status === 'processing' && img.thumbnailDataUrl && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                    <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={() => removeImage(img.id)}
                  className="absolute right-1 top-1 hidden rounded-full bg-gray-900/70 p-1 text-white hover:bg-gray-900 group-hover:flex"
                  aria-label={`Remove ${img.originalName}`}
                >
                  <XIcon />
                </button>
              </div>

              {/* Filename and status */}
              <p className="mt-1 truncate text-xs text-gray-500" title={img.originalName}>
                {img.originalName}
              </p>

              {/* Error message */}
              {img.status === 'error' && img.errorMessage && (
                <p className="mt-0.5 text-xs text-red-600">{img.errorMessage}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
