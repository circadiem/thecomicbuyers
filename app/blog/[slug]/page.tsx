import type { Metadata } from 'next';

interface Props {
  params: { slug: string };
}

// TODO: Task 10 — Build individual blog article pages with SEO metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: `${params.slug} | TheComicBuyers.com Blog`,
  };
}

export default function BlogArticlePage({ params }: Props) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold">{params.slug}</h1>
      <p className="mt-4 text-gray-600">Coming soon.</p>
    </main>
  );
}
