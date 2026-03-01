// TODO: Task 5 — Implement comic identification endpoint
// Calls Claude Vision API with identification prompt, validates with Zod schema
import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}
