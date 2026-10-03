import { setRequestLocale } from "next-intl/server";
import { getAllTests } from "@/lib/personality-test";
import PersonalityTestClient from "./PersonalityTestClient";
import { getLocalizedField } from "@/utils/localeUtils";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

export const revalidate = 600;

export async function generateMetadata({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";

  return buildMetadata({
    locale,
    path: "/personality-test",
    title: isEnglish ? "Personality Tests" : "Kişilik Testleri",
    description: isEnglish
      ? "Which character, which series hero, which technology? Discover yourself with fun personality tests from GDG on Campus Trakya University."
      : "Hangi karakter, hangi dizi kahramanı, hangi teknoloji? Eğlenceli kişilik testleriyle kendini keşfet! GDG on Campus Trakya Üniversitesi kişilik testleri.",
  });
}

export default async function PersonalityTestPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";
  const tests = await getAllTests();
  const pageUrl = absoluteUrl(locale, "/personality-test");

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: isEnglish ? "Personality Tests" : "Kişilik Testleri",
      description: isEnglish
        ? "Discover yourself with fun personality tests. Which character, which series hero, which technology?"
        : "Eğlenceli kişilik testleriyle kendini keşfet! Hangi karakter, hangi dizi kahramanı, hangi teknoloji?",
      url: pageUrl,
      provider: {
        "@type": "Organization",
        name: isEnglish
          ? "GDG on Campus Trakya University"
          : "GDG on Campus Trakya Üniversitesi",
      },
      hasPart: tests.map((test) => ({
        "@type": "Quiz",
        name: getLocalizedField(test, "title", locale),
        description: getLocalizedField(test, "description", locale),
        url: absoluteUrl(locale, `/personality-test/${test.slug}`),
        numberOfQuestions: test.questionCount,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: isEnglish ? "Home" : "Ana Sayfa",
          item: absoluteUrl(locale),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: isEnglish ? "Personality Tests" : "Kişilik Testleri",
          item: pageUrl,
        },
      ],
    },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />
      <PersonalityTestClient initialTests={tests} />
    </>
  );
}
