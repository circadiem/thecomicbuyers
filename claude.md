# TheComicBuyers.com — AI-Powered Collection Acquisition Platform

## Project Overview

TheComicBuyers.com and EstateComics.com are companion web properties that serve as the buy-side acquisition arm for vintage comic book collections. The core product is an AI-powered appraisal tool that allows sellers to photograph their comic book covers, receive instant identification and valuation, and submit a structured appraisal for a cash offer.

This project is the digital counterpart to Legends of Superheros, a brick-and-mortar comic shop established in 1993. Premium books acquired through this platform flow into a separate luxury e-commerce operation. The two brands operate independently — they should never cross-reference each other publicly.

## Documentation

All project requirements and build instructions live in `/docs/`:

- **`PDR_TheComicBuyers.md`** — Product Design & Requirements. The strategic document covering market opportunity, user flows, payment infrastructure, site architecture, channel strategy, content strategy, metrics, development phases, and risk assessment. Read this first for full context.
- **`Implementation_Spec_TheComicBuyers.md`** — Implementation Specification & AI Prompt Suite. The engineering blueprint covering system architecture, processing pipeline, file structure, all three AI prompts (identification, condition assessment, hidden gems), API contracts, output schemas, valuation engine, offer calculation, PDF report spec, image validation, seller questionnaire, email templates, error handling, and the 10-task build sequence. This is your primary build reference.
- **`prompts/`** — Standalone markdown files for each AI prompt, extracted for easy reference:
  - `prompt_identification.md` — Comic book cover identification system prompt and schema
  - `prompt_condition.md` — Condition assessment system prompt and schema
  - `prompt_hidden_gems.md` — Hidden gems detection logic and explanation prompt

## Tech Stack

|Component         |Technology                                        |
|------------------|--------------------------------------------------|
|Frontend          |Next.js 14+ (React), TypeScript, Tailwind CSS     |
|Backend / API     |Next.js API routes                                |
|AI Engine         |Anthropic Claude API (Sonnet) — multimodal vision |
|Valuation Data    |GoCollect API (with fallback table)               |
|PDF Generation    |Puppeteer or @react-pdf/renderer                  |
|CSV Export        |PapaParse                                         |
|Database          |PostgreSQL via Supabase                           |
|File Storage      |Cloudflare R2 or AWS S3                           |
|Email             |Resend (transactional)                            |
|Hosting           |Vercel                                            |
|Schema Validation |Zod                                               |
|Payments (Phase 3)|Circle (USDC), Strike/OpenNode (BTC), Stripe (ACH)|

## Build Sequence

Follow the 10-task sequence in Section XIII of the Implementation Spec. Each task is designed to be completable in a single session:

1. **Project Scaffold** — Initialize Next.js project, install deps, create file structure
1. **Prompts & Schemas** — Create prompt files and Zod validation schemas
1. **Claude API Client** — Build the wrapper with identification and condition functions
1. **Image Validation & Upload** — Build validation pipeline and upload components
1. **Processing Pipeline & Results UI** — Build API routes and real-time results feed
1. **GoCollect Integration & Valuation** — Build valuation service and offer calculation
1. **Seller Questionnaire** — Build questionnaire and grade adjustment logic
1. **PDF & CSV Generation** — Build report generation services
1. **Submission & Email** — Build submission flow and email notifications
1. **Landing Page & SEO Pages** — Build all static and dynamic pages

## Standing Instructions

- **Model**: Use `claude-sonnet-4-5-20250929` for all Claude API calls. Temperature 0 for all prompts.
- **File structure**: Follow the structure defined in Section II.B of the Implementation Spec exactly.
- **Schemas**: Every AI response must be validated through Zod schemas before entering the pipeline. Never trust raw API output.
- **Grading philosophy**: The system grades conservatively — “grade to buy, not to sell.” Condition estimates should trend below the optimistic scenario. Grade ranges span at least 1.0 full point.
- **Error handling**: Implement retries with exponential backoff for all external API calls. Never let a single failed image break the entire batch.
- **Conservative bias**: When the AI is uncertain between two identifications, it should choose the more common option and reduce the confidence score rather than guess at the rare identification.
- **Typing**: Full TypeScript throughout. No `any` types. All API responses are typed and validated.
- **Environment variables**: All API keys in `.env.local`. Never hardcode secrets.

## Key Schemas

The three core data objects that flow through the pipeline:

```
Photo → IdentificationResult → ConditionResult → ValuationResult → OfferResult → AppraisalReport
```

Full schemas for each are defined in the Implementation Spec (Sections III.B, IV.B, VI.B, VII.B, VII.C). Create corresponding Zod schemas in `lib/schemas/`.

## Geographic Focus

Service areas: New England (CT, MA, RI, NH, VT, ME), New York, New Jersey, Pennsylvania, and South Florida (Miami-Dade, Broward, Palm Beach). Build geographic landing pages for each state targeting local SEO queries.

## Minimum Collection Size

100 books. Collections under 100 receive a message directing them elsewhere. This is enforced at the qualification step before entering the appraisal tool.
