'use client';

import BrandLogo from '@/component/BrandLogo';
import { BRAND } from '@/constants/brand';

/** Shared chrome for /auth/* pages: logo, company name, polished card shell. */
export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.55]"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 80% 50% at 50% -10%, rgba(25, 75, 141, 0.18), transparent 55%),
            radial-gradient(ellipse 60% 40% at 100% 100%, rgba(188, 24, 25, 0.08), transparent 50%),
            linear-gradient(180deg, ${BRAND.colors.surface} 0%, #e8eef6 100%)
          `,
        }}
        aria-hidden
      />

      <div className="relative w-[28rem] max-w-[calc(100vw-2rem)]">
        <div className="mb-6 flex flex-col items-center text-center">
          <BrandLogo variant="auth" href={BRAND.websiteUrl} caption={BRAND.websiteLabel} />
          <p className="mt-3 text-sm" style={{ color: BRAND.colors.muted }}>
            {BRAND.tagline}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white px-7 py-8 shadow-[0_12px_40px_-16px_rgba(8,50,104,0.35)]">
          {(title || subtitle) && (
            <div className="mb-6 text-center">
              {title && (
                <h1
                  className="text-xl font-semibold tracking-tight"
                  style={{ color: BRAND.colors.navy }}
                >
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1.5 text-sm" style={{ color: BRAND.colors.muted }}>
                  {subtitle}
                </p>
              )}
            </div>
          )}
          {children}
        </div>

        {footer ? <div className="mt-5 text-center text-sm">{footer}</div> : null}

        <p className="mt-8 text-center text-xs" style={{ color: BRAND.colors.muted }}>
          {BRAND.legalName}
          {' · '}
          <a
            href={BRAND.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
            style={{ color: BRAND.colors.blue }}
          >
            {BRAND.websiteLabel}
          </a>
        </p>
      </div>
    </div>
  );
}
