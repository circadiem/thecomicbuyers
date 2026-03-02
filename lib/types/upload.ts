// Shared types for the upload → processing pipeline
// ProcessedImage flows from Task 4 (upload) into Task 5 (processing pipeline)

export interface ProcessedImage {
  /** Unique client-side identifier (crypto.randomUUID) */
  id: string;
  /** Original filename from the user's device */
  originalName: string;
  /** Data URL used for thumbnail preview only — not sent to API */
  thumbnailDataUrl: string;
  /** Base64-encoded JPEG, ready for Claude Vision API */
  processedBase64: string;
  /** Always 'image/jpeg' after client-side processing */
  mimeType: string;
}
