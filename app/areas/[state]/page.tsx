import type { Metadata } from 'next';

interface Props {
  params: { state: string };
}

// TODO: Task 10 — Build dynamic geo landing pages with local SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const state = params.state
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return {
    title: `Sell Your Comics in ${state} | TheComicBuyers.com`,
    description: `Get a free AI-powered appraisal for your vintage comic book collection in ${state}. Cash offers, no obligation.`,
  };
}

export default function StatePage({ params }: Props) {
  const state = params.state
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">
        Buy Comics in {state}
      </h1>
      <p className="mt-4 text-gray-600">Coming soon.</p>
    </main>
  );
}
