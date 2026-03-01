// Obvious keys exclusion list for hidden gem detection
// Books so well-known that even non-collectors would recognize them as valuable.
// These are NOT hidden gems — they are expected finds.
// Format: "Title #Issue" — matched case-insensitively against identification results.
// Source: Implementation Spec §V.A / docs/prompts/prompt_hidden_gems.md

export const OBVIOUS_KEYS: readonly string[] = [
  // Golden Age
  'Action Comics #1',
  'Detective Comics #27',
  'Batman #1',
  'Superman #1',
  'Captain America Comics #1',
  'Marvel Comics #1',
  'Wonder Woman #1',
  'All Star Comics #8',
  'Flash Comics #1',
  'Sensation Comics #1',
  'More Fun Comics #52',
  'All-American Comics #16',
  'Captain Marvel Adventures #1',

  // Silver Age
  'Amazing Fantasy #15',
  'Fantastic Four #1',
  'Incredible Hulk #1',
  'Amazing Spider-Man #1',
  'X-Men #1',
  'Avengers #1',
  'Journey into Mystery #83',
  'Tales of Suspense #39',
  'Tales to Astonish #27',
  'Tales to Astonish #35',
  'Strange Tales #110',
  'Brave and the Bold #28',
  'Showcase #4',
  'Showcase #22',
  'Justice League of America #1',
  'Green Lantern #1',
  'Adventure Comics #247',
  'Daredevil #1',
  'Silver Surfer #1',
  'Captain Marvel #1',

  // Bronze Age (widely recognized)
  'Incredible Hulk #181',
  'Giant-Size X-Men #1',
  'X-Men #94',
  'X-Men #101',
  'X-Men #129',
  'Amazing Spider-Man #129',
  'House of Secrets #92',

  // Copper Age (culturally iconic)
  'Batman: The Killing Joke #1',
  'Amazing Spider-Man #300',
  'New Mutants #98',
  'Batman Adventures #12',
  'Spawn #1',
  'Uncanny X-Men #266',

  // Modern Age
  'Walking Dead #1',
  'Saga #1',
  'Teenage Mutant Ninja Turtles #1',
  'Preacher #1',
  'Bone #1',
] as const;
