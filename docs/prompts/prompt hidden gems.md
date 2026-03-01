# Prompt 3: Hidden Gems Detection & Explanation

## Purpose

The Hidden Gems feature identifies books in a seller’s collection that are unexpectedly valuable and generates plain-language explanations of why. This is a trust-building feature designed for sellers who do not know what they own. The experience of discovering unexpected value creates positive emotional association with the brand and generates word-of-mouth referrals.

## Architecture

Hidden Gems detection is split into two parts:

1. **Detection logic** — Pure code, no AI. Runs after identification and valuation are complete.
1. **Explanation generation** — Claude API call to produce the natural-language explanation for the report.

-----

## Part 1: Detection Logic (Code)

Stored in `lib/prompts/hidden-gems.ts` as a utility function, not a prompt.

### Qualification Criteria

A book qualifies as a “hidden gem” if **ALL** of the following are true:

1. The FMV midpoint exceeds **$50**
1. The `significance.type` is **NOT null** (the book has collector significance)
1. The book is **NOT** on the “Obvious Keys” exclusion list (see below)

### Obvious Keys Exclusion List

These are books that even non-collectors would likely recognize as valuable. If a book is on this list, it is an expected find, not a hidden gem. Maintain this as a hardcoded array in the codebase.

```typescript
// lib/config/obvious-keys.ts

export const OBVIOUS_KEYS: string[] = [
  // Golden Age
  "Action Comics #1",
  "Detective Comics #27",
  "Batman #1",
  "Superman #1",
  "Captain America Comics #1",
  "Marvel Comics #1",
  "Wonder Woman #1",
  "All Star Comics #8",
  "Flash Comics #1",
  "Sensation Comics #1",

  // Silver Age
  "Amazing Fantasy #15",
  "Fantastic Four #1",
  "Incredible Hulk #1",
  "Amazing Spider-Man #1",
  "X-Men #1",
  "Avengers #1",
  "Journey into Mystery #83",
  "Tales of Suspense #39",
  "Brave and the Bold #28",
  "Showcase #4",
  "Justice League of America #1",
  "Tales to Astonish #27",
  "Green Lantern #1",

  // Bronze Age (widely recognized)
  "Incredible Hulk #181",
  "Giant-Size X-Men #1",
  "Amazing Spider-Man #129",
  "House of Secrets #92",

  // Copper / Modern (culturally iconic)
  "Batman: The Killing Joke",
  "Teenage Mutant Ninja Turtles #1",
  "Amazing Spider-Man #300",
  "New Mutants #98",
  "Batman Adventures #12",
  "Spawn #1",
  "Walking Dead #1",

  // Add more as needed — target ~50 entries
];
```

### Detection Function

```typescript
// lib/prompts/hidden-gems.ts

import { OBVIOUS_KEYS } from '@/lib/config/obvious-keys';
import type { IdentificationResult } from '@/lib/schemas/identification';
import type { ValuationResult } from '@/lib/schemas/valuation';

interface HiddenGemCandidate {
  identification: IdentificationResult;
  valuation: ValuationResult;
}

export function detectHiddenGems(
  books: HiddenGemCandidate[]
): HiddenGemCandidate[] {
  return books.filter((book) => {
    const { identification, valuation } = book;

    // Criterion 1: FMV midpoint exceeds $50
    if (valuation.fmv_midpoint <= 50) return false;

    // Criterion 2: Has collector significance
    if (!identification.significance.type) return false;

    // Criterion 3: Not on the obvious keys list
    const bookKey = `${identification.title} #${identification.issue_number}`;
    const isObvious = OBVIOUS_KEYS.some(
      (key) => key.toLowerCase() === bookKey.toLowerCase()
    );
    if (isObvious) return false;

    return true;
  });
}
```

-----

## Part 2: Explanation Generation (Claude API)

For each book that passes the hidden gem filter, call Claude to generate a brief, non-technical explanation of why the book is valuable. This text appears in the “Books You Might Not Know Are Valuable” section of the PDF report.

### API Configuration

```
Model: claude-sonnet-4-5-20250929
Max tokens: 256
Temperature: 0.3
```

Temperature is slightly above 0 here to allow natural variation in the explanatory text. Each explanation should feel fresh, not templated.

### System Prompt

```
You write brief, clear explanations of why a comic book is more valuable than a non-collector would expect. Your audience is someone who knows nothing about comics and has just learned that a book in their collection is worth money.

Tone: Warm, informative, slightly surprising. Not salesy. Think: a knowledgeable friend explaining something interesting.

Length: 2-3 sentences maximum. No jargon without explanation.

Structure: What the book IS, why it MATTERS to collectors, and what it is WORTH in plain language.

Rules:
- Never use exclamation points
- Never say "you won't believe" or "surprisingly" or other clickbait language
- Do not mention grading scales or CGC
- Express value as a plain dollar range
- If the significance involves a character, briefly note why that character matters (movie franchise, cultural icon, etc.)
- Return only the explanation text. No JSON. No formatting. Just the sentences.
```

### User Message Template

```
Explain why this book is a hidden gem for a non-collector:

Title: [title] #[issue] ([cover_date])
Publisher: [publisher]
Significance: [significance.description]
Estimated Value: $[fmv_low] - $[fmv_high]

Write 2-3 sentences. Plain language. No collector jargon.
```

### Example Outputs

**Marvel Spotlight #5 (August 1972), Marvel Comics**
*First appearance of Ghost Rider*

> “This issue from 1972 is where Ghost Rider first appeared in Marvel Comics. The character went on to star in multiple series, a Nicolas Cage film franchise, and a recent MCU appearance. Copies in this condition range typically sell for $800–$1,200 at auction.”

**Werewolf By Night #32 (August 1975), Marvel Comics**
*First appearance of Moon Knight*

> “Moon Knight made his debut in this 1975 issue as a villain fighting a werewolf, which is not the origin story most people expect for a character who now has his own Disney+ series. That debut appearance makes this book worth $300–$500 in this condition.”

**New Mutants #87 (March 1990), Marvel Comics**
*First appearance of Cable*

> “Cable first showed up in this 1990 issue before becoming a major figure in the X-Men universe and appearing in Deadpool 2 played by Josh Brolin. It is one of the more affordable key issues from this era, currently selling for $75–$150.”

**Iron Fist #14 (August 1977), Marvel Comics**
*First appearance of Sabretooth*

> “Before he became Wolverine’s arch-nemesis across decades of X-Men stories and multiple films, Sabretooth first appeared here in an Iron Fist comic in 1977. That unexpected origin makes this a book most people overlook, and it is worth $150–$300 in this condition.”

-----

## Integration Notes

- The hidden gem explanation is stored in the `ValuationResult.hidden_gem_explanation` field
- In the PDF report, hidden gems appear in their own section BEFORE the full inventory table, to front-load the trust-building moment
- On the web UI, hidden gems should be visually distinguished with a subtle highlight or badge
- If a collection has zero hidden gems, omit the section entirely — do not show an empty “Hidden Gems” section
- Maximum hidden gems to highlight: 10. If more than 10 qualify, show the top 10 by FMV descending
