import { setRequestLocale } from "next-intl/server";
import { getAllTests } from "@/lib/personality-test";
import PersonalityTestClient from "./PersonalityTestClient";
import { getLocalizedField } from "@/utils/localeUtils";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";

  return {
    title: isEnglish ? "Personality Tests" : "Kişilik Testleri",
    description: isEnglish
      ? "Which character, which series hero, which technology? Discover yourself with fun personality tests from GDG on Campus Trakya University."
      : "Hangi karakter, hangi dizi kahramanı, hangi teknoloji? Eğlenceli kişilik testleriyle kendini keşfet! GDG on Campus Trakya Üniversitesi kişilik testleri.",
    keywords: isEnglish
      ? [
          "personality test",
          "personality tests",
          "which character are you",
          "character test",
          "fun quiz",
          "personality quiz",
        ]
      : [
          "kişilik testi",
          "kişilik testleri",
          "hangi karaktersin",
          "karakter testi",
          "eğlenceli test",
          "hangi medcezir karakterisin",
          "dizi karakter testi",
          "kişilik testi çöz",
        ],
    openGraph: {
      title: isEnglish
        ? "Personality Tests | GDG on Campus Trakya"
        : "Kişilik Testleri | GDG on Campus Trakya",
      description: isEnglish
        ? "Discover yourself with fun personality tests. Which character are you?"
        : "Hangi karakter, hangi dizi kahramanı, hangi teknoloji? Eğlenceli kişilik testleriyle kendini keşfet!",
      type: "website",
      url: "/personality-test",
    },
    twitter: {
      card: "summary_large_image",
      title: isEnglish
        ? "Personality Tests | GDG on Campus Trakya"
        : "Kişilik Testleri | GDG on Campus Trakya",
      description: isEnglish
        ? "Discover yourself with fun personality tests. Which character are you?"
        : "Eğlenceli kişilik testleriyle kendini keşfet! Hangi karaktersin?",
    },
    alternates: {
      canonical: "/personality-test",
    },
  };
}

export default async function PersonalityTestPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";
  const tests = await getAllTests();
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://gdgoncampustu.com";

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: isEnglish ? "Personality Tests" : "Kişilik Testleri",
      description: isEnglish
        ? "Discover yourself with fun personality tests. Which character, which series hero, which technology?"
        : "Eğlenceli kişilik testleriyle kendini keşfet! Hangi karakter, hangi dizi kahramanı, hangi teknoloji?",
      url: `${baseUrl}/personality-test`,
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
        url: `${baseUrl}/personality-test/${test.slug}`,
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
          item: baseUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: isEnglish ? "Personality Tests" : "Kişilik Testleri",
          item: `${baseUrl}/personality-test`,
        },
      ],
    },
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PersonalityTestClient initialTests={tests} />
    </>
  );
}
