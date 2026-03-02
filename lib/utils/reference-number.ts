// Reference number generator
// Format: TCB-YYYYMMDD-XXXX  (e.g., TCB-20260302-A4F2)
// XXXX = 4-character uppercase hex for uniqueness within a day.

export function generateReferenceNumber(): string {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');

  const suffix = Math.floor(Math.random() * 0x10000)
    .toString(16)
    .toUpperCase()
    .padStart(4, '0');

  return `TCB-${date}-${suffix}`;
}
