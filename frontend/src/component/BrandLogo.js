'use client';

import Image from 'next/image';
import Link from 'next/link';
import logo from '../../public/logo/logo.svg';
import { BRAND } from '@/constants/brand';

/**
 * Company mark. The SVG already includes the wordmark;
 * optional caption is for website / tagline only.
 * @param {'header' | 'auth' | 'compact'} variant
 */
export default function BrandLogo({
  variant = 'header',
  caption = null,
  href,
}) {
  const sizes = {
    header: { width: 150, height: 50 },
    auth: { width: 200, height: 66 },
    compact: { width: 120, height: 40 },
  }[variant];

  const content = (
    <span className="inline-flex flex-col items-start gap-0.5 min-w-0">
      <Image
        src={logo}
        alt={BRAND.name}
        width={sizes.width}
        height={sizes.height}
        priority={variant !== 'compact'}
        className="h-auto w-auto max-h-16 object-contain shrink-0"
      />
      {caption ? (
        <span
          className="text-[11px] font-medium tracking-wide truncate pl-0.5"
          style={{ color: BRAND.colors.muted }}
        >
          {caption}
        </span>
      ) : null}
    </span>
  );

  if (!href) return content;

  const isExternal = href.startsWith('http');
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex no-underline hover:opacity-90 transition-opacity"
        aria-label={`${BRAND.name} — ${BRAND.websiteLabel}`}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className="inline-flex no-underline hover:opacity-90 transition-opacity">
      {content}
    </Link>
  );
}
