/* Hallmark · genre: playful-editorial · personality tests share the home page exception (design.md)
 * A shared result: what someone got, then an invitation to take the test yourself.
 */
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { getAllTests, getTestBySlug } from "@/lib/personality-test";
import { findResult } from "@/lib/personality-result";
import { baseUrl, buildMetadata } from "@/lib/seo";
import { getLocalizedField } from "@/utils/localeUtils";
import { ResultCard, TestCard } from "@/components/personality/cards";

export const revalidate = 600;

const COPY = {
  tr: {
    allTests: "Tüm testler",
    label: (test) => `${test} sonucu`,
    yours: "Sen ne çıkacaksın?",
    yoursBody: (n) => `${n} soru, birkaç dakika. Sonucunu sen de paylaşabilirsin.`,
    take: "Testi çöz",
    more: "Başka testler",
    questions: (n) => `${n} soru`,
    start: "Başla",
    metaDescription: (result, test) => `${test} testinde çıkan sonuç: ${result}. Sen de çöz.`,
  },
  en: {
    allTests: "All tests",
    label: (test) => `${test}: result`,
    yours: "What will you get?",
    yoursBody: (n) => `${n} questions, a few minutes. You can share your result too.`,
    take: "Take the test",
    more: "More tests",
    questions: (n) => (n === 1 ? "1 question" : `${n} questions`),
    start: "Start",
    metaDescription: (result, test) => `A result in the ${test} test: ${result}. Take it too.`,
  },
};

async function load(slug, resultSlug) {
  const test = await getTestBySlug(slug);
  const result = test ? findResult(test, resultSlug) : null;
  return { test, result };
}

export async function generateMetadata({ params }) {
  const { locale, slug, result: resultSlug } = await params;
  const { test, result } = await load(slug, resultSlug);
  if (!result) return { robots: { index: false, follow: false } };

  const copy = COPY[locale] || COPY.tr;
  const testTitle = getLocalizedField(test, "title", locale);
  return buildMetadata({
    locale,
    path: `/personality-test/${slug}/${resultSlug}`,
    title: `${result.title} · ${testTitle}`,
    description: result.description || copy.metaDescription(result.title, testTitle),
    image: `${baseUrl}/api/personality-test/${encodeURIComponent(slug)}/${encodeURIComponent(resultSlug)}?locale=${locale}`,
    // A result is the test's page in another state; the test itself is what search should list.
    noindex: true,
  });
}

export default async function SharedResultPage({ params }) {
  const { locale, slug, result: resultSlug } = await params;
  setRequestLocale(locale);
  const copy = COPY[locale] || COPY.tr;

  const [{ test, result }, allTests] = await Promise.all([load(slug, resultSlug), getAllTests()]);
  if (!result) notFound();

  const testTitle = getLocalizedField(test, "title", locale);
  const questionCount = test.questions?.length || 0;
  const position = allTests.findIndex((entry) => entry.slug === slug);
  const moreTests = [1, 2, 3]
    .map((step) => allTests[(position + step + allTests.length) % allTests.length])
    .filter((entry, index, list) => entry && entry.slug !== slug && list.indexOf(entry) === index);

  return (
    <div className="mx-auto w-full max-w-page px-gutter pb-16 pt-6 md:pt-8">
      <Button asChild variant="ghost" size="sm" className="-ml-3">
        <Link href="/personality-test">
          <ArrowLeft aria-hidden="true" />
          {copy.allTests}
        </Link>
      </Button>

      <div className="mt-4">
        <ResultCard result={result} label={copy.label(testTitle)} headingLevel="h1" priority />
      </div>

      <section className="mt-6 flex flex-col gap-6 rounded-lg bg-brand p-6 text-brand-ink md:flex-row md:items-center md:justify-between md:p-10">
        <div>
          <h2 className="font-display text-3xl font-extrabold leading-tight md:text-5xl">{copy.yours}</h2>
          <p className="mt-2 text-lg">{copy.yoursBody(questionCount)}</p>
        </div>
        <Button asChild size="lg" variant="secondary" className="shrink-0">
          <Link href={`/personality-test/${slug}`}>
            {copy.take}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>

      {moreTests.length > 0 && (
        <section aria-labelledby="more-tests" className="mt-16">
          <h2 id="more-tests" className="font-display text-3xl font-extrabold md:text-4xl">
            {copy.more}
          </h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreTests.map((entry, index) => (
              <li key={entry.id}>
                <TestCard
                  test={entry}
                  index={index + 1}
                  title={getLocalizedField(entry, "title", locale)}
                  description={getLocalizedField(entry, "description", locale)}
                  questionsLabel={copy.questions(entry.questionCount)}
                  startLabel={copy.start}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
