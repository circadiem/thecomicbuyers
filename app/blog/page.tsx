import type { Metadata } from 'next';
import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/content/blog';

export const metadata: Metadata = {
  title: 'Blog | TheComicBuyers.com',
  description:
    'Guides, tips, and market insights for comic book collectors and sellers. Key issue identification, grading, valuation, and era deep-dives.',
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogPage() {
  const sorted = [...BLOG_POSTS].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <main>
      <section className="bg-gray-900 px-4 py-16 text-center sm:px-6">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          The ComicBuyers Blog
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
          Guides for collectors, sellers, and anyone wondering what their collection is worth.
        </p>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-3xl space-y-8">
          {sorted.map((post) => (
            <article key={post.slug} className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="mb-2 flex items-center gap-3 text-xs text-gray-400">
                <time dateTime={post.date}>{fmtDate(post.date)}</time>
                <span>·</span>
                <span>{post.readTime} min read</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900">
                <Link href={`/blog/${post.slug}`} className="hover:text-red-600">
                  {post.title}
                </Link>
              </h2>
              <p className="mb-4 text-sm leading-relaxed text-gray-600">{post.excerpt}</p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
