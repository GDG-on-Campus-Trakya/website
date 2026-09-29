import { setRequestLocale } from "next-intl/server";
import { getAllTests, getTestBySlug } from "@/lib/personality-test";
import PersonalityTestClient from "./PersonalityTestClient";
import { getLocalizedField } from "@/utils/localeUtils";
import JsonLd from "@/components/JsonLd";
import { absoluteUrl, buildMetadata } from "@/lib/seo";

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
    return buildMetadata({
      locale,
      path: `/personality-test/${slug}`,
      title: isEnglish ? "Test Not Found" : "Test Bulunamadı",
      description: isEnglish
        ? "The personality test you are looking for could not be found."
        : "Aradığınız kişilik testi bulunamadı.",
      noindex: true,
    });
  }

  const title = getLocalizedField(test, "title", locale);
  const description =
    getLocalizedField(test, "description", locale) ||
    (isEnglish
      ? `${title} - A fun personality test. Take it now and share your result with your friends!`
      : `${title} - Eğlenceli kişilik testi. Hemen çöz ve sonucunu arkadaşlarınla paylaş!`);

  return buildMetadata({
    locale,
    path: `/personality-test/${slug}`,
    title,
    description,
    image: test.imageUrl || undefined,
  });
}

export default async function PersonalityTestPage({ params }) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const isEnglish = locale === "en";
  const test = await getTestBySlug(slug);
  const pageUrl = absoluteUrl(locale, `/personality-test/${slug}`);
  const listUrl = absoluteUrl(locale, "/personality-test");

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
          url: pageUrl,
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
            url: absoluteUrl(locale),
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
              item: absoluteUrl(locale),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: isEnglish ? "Personality Tests" : "Kişilik Testleri",
              item: listUrl,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: pageUrl,
            },
          ],
        },
      ]
    : null;

  return (
    <>
      <JsonLd data={jsonLd} />
      <PersonalityTestClient
        slug={slug}
        initialTestData={test ? JSON.parse(JSON.stringify(test)) : null}
      />
    </>
  );
}
