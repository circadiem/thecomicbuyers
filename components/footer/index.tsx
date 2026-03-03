// Site footer — server component
import Link from 'next/link';
import { SERVICE_AREAS } from '@/lib/config/service-areas';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="text-sm font-bold text-gray-900">
              TheComicBuyers<span className="text-red-600">.com</span>
            </p>
            <p className="mt-2 text-xs text-gray-500 leading-relaxed">
              Legends of Superheroes, Est. 1993.<br />
              30+ years buying and selling vintage comic book collections.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Company
            </p>
            <ul className="space-y-2 text-sm text-gray-600">
              {[
                ['/how-it-works', 'How It Works'],
                ['/about', 'About Us'],
                ['/blog', 'Blog'],
                ['/appraise', 'Free Appraisal'],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-gray-900">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service areas */}
          <div className="sm:col-span-2">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">
              Service Areas
            </p>
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {SERVICE_AREAS.map((area) => (
                <Link
                  key={area.slug}
                  href={`/areas/${area.slug}`}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  {area.name}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 border-t border-gray-200 pt-6 text-xs text-gray-400">
          <p>
            © {year} TheComicBuyers.com · All offers are non-binding and subject to in-person
            verification of condition and authenticity.
          </p>
        </div>
      </div>
    </footer>
  );
}
