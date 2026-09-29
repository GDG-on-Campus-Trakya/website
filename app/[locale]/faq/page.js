import { setRequestLocale } from "next-intl/server";
import { pageMetadata } from "@/lib/page-meta";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd } from "@/lib/structured-data";
import { FAQ_DATA } from "./faq-data";
import FaqClient from "./FaqClient";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return pageMetadata("faq", locale);
}

export default async function FaqPage({ params }) {
  const { locale } = await params;
  setRequestLocale(locale);

  const questions = (FAQ_DATA[locale] || FAQ_DATA.tr).flatMap(
    (group) => group.questions
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          inLanguage: locale,
          mainEntity: questions.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
        }}
      />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          {
            name: locale === "en" ? "FAQ" : "Sıkça Sorulan Sorular",
            path: "/faq",
          },
        ])}
      />
      <FaqClient />
    </>
  );
}
