import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { BLOG_POSTS, getPostBySlug } from '@/lib/content/blog';

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return BLOG_POSTS.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getPostBySlug(params.slug);
  if (!post) return { title: 'Post Not Found | TheComicBuyers.com Blog' };
  return {
    title: `${post.title} | TheComicBuyers.com`,
    description: post.excerpt,
  };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function BlogArticlePage({ params }: Props) {
  const post = getPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <main>
      {/* Header */}
      <section className="bg-gray-900 px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <Link href="/blog" className="mb-4 inline-block text-xs font-medium text-gray-400 hover:text-gray-200">
            ← Back to Blog
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {post.title}
          </h1>
          <div className="mt-4 flex items-center gap-3 text-xs text-gray-400">
            <time dateTime={post.date}>{fmtDate(post.date)}</time>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section className="px-4 py-14 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div
            className="prose prose-gray max-w-none text-sm leading-relaxed [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_li]:my-1 [&_p]:my-4 [&_p]:text-gray-600 [&_strong]:text-gray-900 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* CTA */}
          <div className="mt-12 rounded-xl bg-red-50 px-6 py-6 text-center ring-1 ring-red-100">
            <p className="mb-1 text-sm font-semibold text-gray-900">
              Ready to find out what your collection is worth?
            </p>
            <p className="mb-4 text-xs text-gray-600">
              Free AI appraisal — no commitment required.
            </p>
            <Link
              href="/appraise"
              className="inline-block rounded-md bg-red-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
            >
              Start Free Appraisal →
            </Link>
          </div>

          {/* More articles */}
          <div className="mt-12">
            <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-gray-400">
              More from the blog
            </p>
            <div className="space-y-3">
              {BLOG_POSTS.filter((p) => p.slug !== post.slug)
                .slice(0, 3)
                .map((p) => (
                  <Link
                    key={p.slug}
                    href={`/blog/${p.slug}`}
                    className="block rounded-lg border border-gray-200 bg-white px-4 py-3 hover:bg-gray-50"
                  >
                    <p className="text-sm font-semibold text-gray-900">{p.title}</p>
                    <p className="mt-0.5 text-xs text-gray-500">{p.readTime} min read</p>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
