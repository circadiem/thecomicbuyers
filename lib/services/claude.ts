// Claude API client wrapper
// Exposes: identifyComic, assessCondition, generateHiddenGemExplanation
// Handles: retries with exponential backoff, JSON extraction, Zod validation
// Source: Implementation Spec §III.D, §IV.D, §XII.A

import Anthropic from '@anthropic-ai/sdk';
import type { ZodSchema } from 'zod';
import { CLAUDE_MODEL, MAX_RETRIES, BASE_RETRY_DELAY_MS } from '@/lib/config/constants';
import {
  IDENTIFICATION_SYSTEM_PROMPT,
  IDENTIFICATION_USER_MESSAGE,
  IDENTIFICATION_MAX_TOKENS,
  IDENTIFICATION_TEMPERATURE,
} from '@/lib/prompts/identification';
import {
  CONDITION_SYSTEM_PROMPT,
  buildConditionUserMessage,
  CONDITION_MAX_TOKENS,
  CONDITION_TEMPERATURE,
} from '@/lib/prompts/condition';
import {
  HIDDEN_GEM_SYSTEM_PROMPT,
  buildHiddenGemUserMessage,
  HIDDEN_GEM_MAX_TOKENS,
  HIDDEN_GEM_TEMPERATURE,
} from '@/lib/prompts/hidden-gems';
import {
  IdentificationResultSchema,
  type IdentificationResult,
} from '@/lib/schemas/identification';
import {
  ConditionResultSchema,
  type ConditionResult,
} from '@/lib/schemas/condition';

// ---------------------------------------------------------------------------
// Exported types
// ---------------------------------------------------------------------------

export type ImageMediaType =
  | 'image/jpeg'
  | 'image/png'
  | 'image/gif'
  | 'image/webp';

// ---------------------------------------------------------------------------
// Exported error classes
// ---------------------------------------------------------------------------

export class ClaudeApiError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ClaudeApiError';
  }
}

export class ClaudeValidationError extends Error {
  constructor(
    message: string,
    readonly rawResponse: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'ClaudeValidationError';
  }
}

// ---------------------------------------------------------------------------
// Anthropic client singleton
// ---------------------------------------------------------------------------

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new ClaudeApiError(
        'ANTHROPIC_API_KEY environment variable is not set',
      );
    }
    // maxRetries: 0 — disables the SDK's built-in retry so withRetry() owns
    // all backoff timing and we never double-retry a 429.
    _client = new Anthropic({ apiKey, maxRetries: 0 });
  }
  return _client;
}

// ---------------------------------------------------------------------------
// Internal utilities
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Strips markdown code fences that Claude sometimes emits despite instructions
 * to return only JSON. Falls back to the trimmed raw string.
 *
 * Intentionally strict: only matches when the ENTIRE string is a fenced block.
 * If Claude adds preamble prose the regex fails → parse fails → retry triggers.
 */
function extractJson(raw: string): string {
  const fenced = raw.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?```\s*$/);
  return fenced ? fenced[1].trim() : raw.trim();
}

function isRetryableApiError(err: unknown): boolean {
  return (
    err instanceof Anthropic.RateLimitError ||
    err instanceof Anthropic.InternalServerError ||
    err instanceof Anthropic.APIConnectionError
  );
}

/**
 * Calls fn up to MAX_RETRIES times with exponential backoff.
 * Non-retryable API errors are re-thrown immediately as ClaudeApiError.
 */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Anthropic.APIError && !isRetryableApiError(err)) {
        throw new ClaudeApiError(
          `Claude API error ${err.status}: ${err.message}`,
          err,
        );
      }
      lastError = err;
      if (attempt < MAX_RETRIES) {
        await sleep(BASE_RETRY_DELAY_MS * Math.pow(2, attempt));
      }
    }
  }
  throw new ClaudeApiError(
    'Claude API call failed after maximum retries',
    lastError,
  );
}

// ---------------------------------------------------------------------------
// Internal: vision call → JSON parse → Zod validate
// ---------------------------------------------------------------------------

interface VisionCallParams {
  imageBase64: string;
  mediaType: ImageMediaType;
  systemPrompt: string;
  userMessage: string;
  maxTokens: number;
  temperature: number;
}

async function attemptVisionCall(params: VisionCallParams): Promise<string> {
  const { imageBase64, mediaType, systemPrompt, userMessage, maxTokens, temperature } =
    params;

  const message = await withRetry(() =>
    getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            { type: 'text', text: userMessage },
          ],
        },
      ],
    }),
  );

  const block = message.content[0];
  return block.type === 'text' ? block.text : '';
}

/**
 * Full cycle: vision call → extract JSON → Zod validate.
 * Per spec §XII.A: if JSON parse or Zod validation fails, retry the API call
 * once more before giving up.
 */
async function callClaudeVisionForJson<T>(
  params: VisionCallParams,
  schema: ZodSchema<T>,
): Promise<T> {
  let lastRaw = '';

  for (let jsonAttempt = 0; jsonAttempt < 2; jsonAttempt++) {
    const raw = await attemptVisionCall(params);
    lastRaw = raw;

    let parsed: unknown;
    try {
      parsed = JSON.parse(extractJson(raw));
    } catch {
      // JSON parse failed — loop will retry the API call (up to 2 times)
      continue;
    }

    const result = schema.safeParse(parsed);
    if (result.success) {
      return result.data;
    }

    // Zod validation failed — loop will retry the API call
    lastRaw = raw;
  }

  throw new ClaudeValidationError(
    'Claude response failed JSON parsing or schema validation after 2 attempts',
    lastRaw,
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Identify a comic book from a base64-encoded cover image.
 * Returns a validated IdentificationResult or throws ClaudeApiError /
 * ClaudeValidationError.
 */
export async function identifyComic(
  imageBase64: string,
  mediaType: ImageMediaType = 'image/jpeg',
): Promise<IdentificationResult> {
  return callClaudeVisionForJson(
    {
      imageBase64,
      mediaType,
      systemPrompt: IDENTIFICATION_SYSTEM_PROMPT,
      userMessage: IDENTIFICATION_USER_MESSAGE,
      maxTokens: IDENTIFICATION_MAX_TOKENS,
      temperature: IDENTIFICATION_TEMPERATURE,
    },
    IdentificationResultSchema,
  );
}

/**
 * Assess the physical condition of a comic book from a base64-encoded cover
 * image, using the identification context to calibrate era-appropriate
 * expectations.
 * Returns a validated ConditionResult or throws ClaudeApiError /
 * ClaudeValidationError.
 */
export async function assessCondition(
  imageBase64: string,
  context: IdentificationResult,
  mediaType: ImageMediaType = 'image/jpeg',
): Promise<ConditionResult> {
  return callClaudeVisionForJson(
    {
      imageBase64,
      mediaType,
      systemPrompt: CONDITION_SYSTEM_PROMPT,
      userMessage: buildConditionUserMessage(
        context.title,
        context.issue_number,
        context.cover_date,
        context.publisher,
        context.era,
      ),
      maxTokens: CONDITION_MAX_TOKENS,
      temperature: CONDITION_TEMPERATURE,
    },
    ConditionResultSchema,
  );
}

/**
 * Generate a plain-language explanation of why a book is a hidden gem,
 * suitable for a non-collector audience.
 * Returns trimmed prose text (not JSON).
 * Throws ClaudeApiError on network/API failure or empty response.
 */
export async function generateHiddenGemExplanation(
  title: string,
  issue: string,
  coverDate: string,
  publisher: string,
  significanceDescription: string,
  fmvLow: number,
  fmvHigh: number,
): Promise<string> {
  const message = await withRetry(() =>
    getClient().messages.create({
      model: CLAUDE_MODEL,
      max_tokens: HIDDEN_GEM_MAX_TOKENS,
      temperature: HIDDEN_GEM_TEMPERATURE,
      system: HIDDEN_GEM_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: buildHiddenGemUserMessage(
            title,
            issue,
            coverDate,
            publisher,
            significanceDescription,
            fmvLow,
            fmvHigh,
          ),
        },
      ],
    }),
  );

  const block = message.content[0];
  const text = block.type === 'text' ? block.text.trim() : '';

  if (!text) {
    throw new ClaudeApiError(
      'Claude returned an empty response for hidden gem explanation',
    );
  }

  return text;
}
