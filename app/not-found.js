// Global, non-localized fallback. Locale-aware 404s are handled by
// app/[locale]/not-found.js (which renders inside NextIntlClientProvider).
// This root fallback must stay self-contained — no next-intl hooks/Link —
// because the root layout no longer provides the i18n context.
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-page flex-col items-start justify-center px-gutter py-16">
      <p className="font-outlier text-sm text-muted-foreground">404</p>
      <h1 className="mt-3 max-w-2xl font-display text-[length:var(--text-display-s)] font-extrabold">
        Sayfa bulunamadı / Page not found
      </h1>
      <a
        href="/"
        className="mt-8 inline-flex h-control items-center rounded bg-brand px-5 text-sm font-medium text-brand-ink transition-colors duration-micro ease-out hover:bg-brand-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        Ana sayfa / Home
      </a>
    </div>
  );
}
