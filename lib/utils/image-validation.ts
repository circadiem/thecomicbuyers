// TODO: Task 4 — Implement image validation pipeline
// Checks: file type, file size, resolution, aspect ratio, blur detection
// Converts HEIC → JPEG, resizes to max 2048px, compresses to quality 85
// Source: Implementation Spec §IX

export type ImageValidationResult =
  | { valid: true; processedBase64: string; mimeType: string }
  | { valid: false; reason: string };

export async function validateAndProcessImage(
  _file: File | Buffer,
  _mimeType: string,
): Promise<ImageValidationResult> {
  throw new Error('Not implemented — see Task 4');
}
