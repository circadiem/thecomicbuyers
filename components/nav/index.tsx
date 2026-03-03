// Site navigation — server component (no client state needed)
import Link from 'next/link';

const LINKS = [
  { href: '/how-it-works', label: 'How It Works' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
];

export default function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex-shrink-0 text-base font-bold text-gray-900 hover:text-gray-700"
        >
          TheComicBuyers<span className="text-red-600">.com</span>
        </Link>

        {/* Links + CTA */}
        <div className="flex items-center gap-1 sm:gap-4">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="hidden rounded px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 sm:inline-block"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/appraise"
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            Free Appraisal
          </Link>
        </div>
      </nav>
    </header>
  );
}
