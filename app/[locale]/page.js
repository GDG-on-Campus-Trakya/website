import { setRequestLocale, getTranslations } from "next-intl/server";
import Landing from "@/components/landing/Landing";
import { getHomeData } from "@/lib/home-data";
import { pageMetadata } from "@/lib/page-meta";

// Events and announcements come from Firestore; refresh the static page every 10 minutes.
export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("home", locale);
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [t, data] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getHomeData(locale)
  ]);

  return (
    <Landing
      data={data}
      locale={locale === "en" ? "en" : "tr"}
      seo={{ title: t("seoTitle"), p1: t("seoP1"), p2: t("seoP2") }}
    />
  );
}
