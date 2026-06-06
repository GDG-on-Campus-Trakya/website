// Global, non-localized fallback. Locale-aware 404s are handled by
// app/[locale]/not-found.js (which renders inside NextIntlClientProvider).
// This root fallback must stay self-contained — no next-intl hooks/Link —
// because the root layout no longer provides the i18n context.
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white">
      <div className="text-center p-4">
        <h1 className="text-8xl md:text-9xl font-bold text-purple-500 animate-pulse">
          404
        </h1>
        <p className="mt-4 text-xl md:text-2xl font-semibold">
          Sayfa bulunamadı / Page not found
        </p>
        <div className="mt-8">
          <a
            href="/"
            className="inline-block rounded-full bg-white/10 px-8 py-3 text-lg font-bold transition-transform hover:scale-105 hover:bg-white/20"
          >
            Ana sayfa / Home
          </a>
        </div>
      </div>
    </div>
  );
}
