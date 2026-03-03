// Service area data — all 10 states where TheComicBuyers.com operates.
// Used by /areas/[state] dynamic pages for static generation and local SEO.

export interface ServiceArea {
  /** State abbreviation */
  code: string;
  /** Full display name (may differ from official state name for FL) */
  name: string;
  /** URL slug used in /areas/[state] */
  slug: string;
  /** Representative cities for local SEO copy */
  cities: string[];
  /** One-liner for geo landing page subheadline */
  tagline: string;
}

export const SERVICE_AREAS: ServiceArea[] = [
  {
    code: 'CT',
    name: 'Connecticut',
    slug: 'connecticut',
    cities: ['Hartford', 'New Haven', 'Stamford', 'Bridgeport', 'Waterbury'],
    tagline: 'Serving all of Connecticut — from Stamford to Storrs.',
  },
  {
    code: 'MA',
    name: 'Massachusetts',
    slug: 'massachusetts',
    cities: ['Boston', 'Worcester', 'Springfield', 'Cambridge', 'Lowell'],
    tagline: 'Serving all of Massachusetts — from the Cape to the Berkshires.',
  },
  {
    code: 'RI',
    name: 'Rhode Island',
    slug: 'rhode-island',
    cities: ['Providence', 'Cranston', 'Warwick', 'Pawtucket', 'Newport'],
    tagline: 'Serving all of Rhode Island.',
  },
  {
    code: 'NH',
    name: 'New Hampshire',
    slug: 'new-hampshire',
    cities: ['Manchester', 'Nashua', 'Concord', 'Dover', 'Portsmouth'],
    tagline: 'Serving all of New Hampshire.',
  },
  {
    code: 'VT',
    name: 'Vermont',
    slug: 'vermont',
    cities: ['Burlington', 'South Burlington', 'Rutland', 'Montpelier', 'Barre'],
    tagline: 'Serving all of Vermont.',
  },
  {
    code: 'ME',
    name: 'Maine',
    slug: 'maine',
    cities: ['Portland', 'Lewiston', 'Bangor', 'Augusta', 'Biddeford'],
    tagline: 'Serving all of Maine.',
  },
  {
    code: 'NY',
    name: 'New York',
    slug: 'new-york',
    cities: ['New York City', 'Buffalo', 'Albany', 'Rochester', 'Syracuse'],
    tagline: 'Serving all of New York — from NYC to the Finger Lakes.',
  },
  {
    code: 'NJ',
    name: 'New Jersey',
    slug: 'new-jersey',
    cities: ['Newark', 'Jersey City', 'Paterson', 'Trenton', 'Camden'],
    tagline: 'Serving all of New Jersey.',
  },
  {
    code: 'PA',
    name: 'Pennsylvania',
    slug: 'pennsylvania',
    cities: ['Philadelphia', 'Pittsburgh', 'Allentown', 'Erie', 'Reading'],
    tagline: 'Serving all of Pennsylvania — from Philly to Pittsburgh.',
  },
  {
    code: 'FL',
    name: 'South Florida',
    slug: 'south-florida',
    cities: ['Miami', 'Fort Lauderdale', 'West Palm Beach', 'Boca Raton', 'Pompano Beach'],
    tagline: 'Serving Miami-Dade, Broward, and Palm Beach counties.',
  },
];

export function getAreaBySlug(slug: string): ServiceArea | undefined {
  return SERVICE_AREAS.find((a) => a.slug === slug);
}
