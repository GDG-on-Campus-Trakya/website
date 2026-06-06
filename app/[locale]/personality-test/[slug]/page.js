import { setRequestLocale } from "next-intl/server";
import { getAllTests, getTestBySlug } from "@/lib/personality-test";
import PersonalityTestClient from "./PersonalityTestClient";
import { getLocalizedField } from "@/utils/localeUtils";

export async function generateStaticParams() {
  const tests = await getAllTests();
  return tests.map((test) => ({
    slug: test.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";
  const test = await getTestBySlug(slug);

  if (!test) {
    return {
      title: isEnglish ? "Test Not Found" : "Test Bulunamadı",
      description: isEnglish
        ? "The personality test you are looking for could not be found."
        : "Aradığınız kişilik testi bulunamadı.",
    };
  }

  const title = getLocalizedField(test, "title", locale);
  const description =
    getLocalizedField(test, "description", locale) ||
    (isEnglish
      ? `${title} - A fun personality test. Take it now and share your result with your friends!`
      : `${title} - Eğlenceli kişilik testi. Hemen çöz ve sonucunu arkadaşlarınla paylaş!`);

  return {
    title,
    description,
    keywords: isEnglish
      ? [
          title,
          "personality test",
          "character test",
          "which character are you",
          "fun quiz",
          "personality quiz",
        ]
      : [
          title,
          "kişilik testi",
          "karakter testi",
          "hangi karaktersin",
          "eğlenceli test",
          "kişilik testi çöz",
        ],
    openGraph: {
      title: `${title} | GDG on Campus Trakya`,
      description,
      type: "website",
      url: `/personality-test/${slug}`,
      ...(test.imageUrl && {
        images: [
          {
            url: test.imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | GDG on Campus Trakya`,
      description,
      ...(test.imageUrl && { images: [test.imageUrl] }),
    },
    alternates: {
      canonical: `/personality-test/${slug}`,
    },
  };
}

export default async function PersonalityTestPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";
  const test = await getTestBySlug(slug);
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL || "https://gdgoncampustu.com";

  const title = test ? getLocalizedField(test, "title", locale) : null;
  const description = test
    ? getLocalizedField(test, "description", locale) ||
      (isEnglish
        ? `${title} - A fun personality test`
        : `${title} - Eğlenceli kişilik testi`)
    : null;

  const jsonLd = test
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Quiz",
          name: title,
          description,
          url: `${baseUrl}/personality-test/${slug}`,
          numberOfQuestions: test.questions?.length || 0,
          about: {
            "@type": "Thing",
            name: isEnglish ? "Personality Test" : "Kişilik Testi",
          },
          provider: {
            "@type": "Organization",
            name: isEnglish
              ? "GDG on Campus Trakya University"
              : "GDG on Campus Trakya Üniversitesi",
            url: baseUrl,
          },
          ...(test.imageUrl && {
            image: test.imageUrl,
          }),
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
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: `${baseUrl}/personality-test/${slug}`,
            },
          ],
        },
      ]
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <PersonalityTestClient
        slug={slug}
        initialTestData={test ? JSON.parse(JSON.stringify(test)) : null}
      />
    </>
  );
}
