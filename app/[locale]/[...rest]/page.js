import { notFound } from "next/navigation";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: locale === "en" ? "Page not found" : "Sayfa bulunamadı",
    robots: { index: false },
  };
}

// Unmatched paths under a locale (a typo such as /evets) land here, so they get the localized
// 404 with the navigation and footer instead of the bare global fallback.
export default function UnknownPage() {
  notFound();
}
