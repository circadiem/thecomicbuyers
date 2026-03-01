// App-wide constants

// Claude model — never change without updating all API call sites
export const CLAUDE_MODEL = 'claude-sonnet-4-5-20250929';

// Minimum collection size — enforced at qualification step
export const MIN_COLLECTION_SIZE = 100;

// Hidden gems thresholds
export const HIDDEN_GEM_FMV_THRESHOLD = 50; // FMV midpoint must exceed $50
export const MAX_HIDDEN_GEMS = 10; // Maximum highlighted per collection

// Offer validity window
export const OFFER_VALIDITY_DAYS = 14;

// Service states
export const SERVICE_STATES = [
  'CT', // Connecticut
  'MA', // Massachusetts
  'RI', // Rhode Island
  'NH', // New Hampshire
  'VT', // Vermont
  'ME', // Maine
  'NY', // New York
  'NJ', // New Jersey
  'PA', // Pennsylvania
  'FL', // South Florida (Miami-Dade, Broward, Palm Beach)
] as const;

export type ServiceState = (typeof SERVICE_STATES)[number];

// Image processing limits
export const MAX_IMAGE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB
export const MAX_IMAGE_DIMENSION = 2048; // px on longest edge
export const JPEG_QUALITY = 85;
export const MIN_IMAGE_WIDTH = 640;
export const MIN_IMAGE_HEIGHT = 480;

// Rate limiting — max requests per IP per hour (unauthenticated)
export const RATE_LIMIT_RPH = 50;

// API retry config (exponential backoff)
export const MAX_RETRIES = 3;
export const BASE_RETRY_DELAY_MS = 2000;

// Daily API spending cap (USD) — adjust as volume scales
export const DAILY_API_CAP_USD = 100;

// Obvious keys exclusion list — books too well-known to be "hidden gems"
// Source: Implementation Spec §V.A
export const OBVIOUS_KEYS: ReadonlyArray<{ title: string; issue: string }> = [
  { title: 'Action Comics', issue: '1' },
  { title: 'Detective Comics', issue: '27' },
  { title: 'Amazing Fantasy', issue: '15' },
  { title: 'Amazing Spider-Man', issue: '1' },
  { title: 'Batman', issue: '1' },
  { title: 'Superman', issue: '1' },
  { title: 'Incredible Hulk', issue: '1' },
  { title: 'X-Men', issue: '1' },
  { title: 'Fantastic Four', issue: '1' },
  { title: 'Avengers', issue: '1' },
  { title: 'Iron Man', issue: '1' },
  { title: 'Thor', issue: '1' },
  { title: 'Captain America Comics', issue: '1' },
  { title: 'Flash Comics', issue: '1' },
  { title: 'More Fun Comics', issue: '52' },
  { title: 'Adventure Comics', issue: '247' },
  { title: 'Showcase', issue: '4' },
  { title: 'Showcase', issue: '22' },
  { title: 'Brave and the Bold', issue: '28' },
  { title: 'Journey into Mystery', issue: '83' },
  { title: 'Tales of Suspense', issue: '39' },
  { title: 'Tales to Astonish', issue: '27' },
  { title: 'Tales to Astonish', issue: '35' },
  { title: 'Strange Tales', issue: '110' },
  { title: 'Daredevil', issue: '1' },
  { title: 'Silver Surfer', issue: '1' },
  { title: 'Captain Marvel', issue: '1' },
  { title: 'Incredible Hulk', issue: '181' },
  { title: 'Giant-Size X-Men', issue: '1' },
  { title: 'X-Men', issue: '94' },
  { title: 'X-Men', issue: '101' },
  { title: 'X-Men', issue: '129' },
  { title: 'Uncanny X-Men', issue: '266' },
  { title: 'New Mutants', issue: '98' },
  { title: 'Amazing Spider-Man', issue: '129' },
  { title: 'Amazing Spider-Man', issue: '300' },
  { title: 'Amazing Spider-Man', issue: '252' },
  { title: 'Batman', issue: '227' },
  { title: 'Batman', issue: '251' },
  { title: 'House of Secrets', issue: '92' },
  { title: 'Swamp Thing', issue: '37' },
  { title: 'Crisis on Infinite Earths', issue: '7' },
  { title: 'Batman: The Dark Knight Returns', issue: '1' },
  { title: 'Watchmen', issue: '1' },
  { title: 'Spawn', issue: '1' },
  { title: 'Walking Dead', issue: '1' },
  { title: 'Saga', issue: '1' },
  { title: 'Teenage Mutant Ninja Turtles', issue: '1' },
  { title: 'Bone', issue: '1' },
  { title: 'Preacher', issue: '1' },
] as const;
