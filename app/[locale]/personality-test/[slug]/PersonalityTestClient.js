"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { generateSlug } from "@/lib/slug";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/page";

// Third-party brand colours stay inline; nothing else on this page uses a raw colour.
function ShareButton({ background, label, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      style={{ backgroundColor: background, color: "#fff" }}
      className="flex h-control w-control items-center justify-center rounded transition-opacity duration-micro hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      {children}
    </button>
  );
}

// Answer marks keep the quiz order: red, blue, yellow, green.
const OPTION_MARKS = ["bg-mark-red", "bg-mark-blue", "bg-mark-yellow", "bg-mark-green"];

export default function PersonalityTestClient({ slug, initialTestData = null }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          answerAll: "Please answer all questions.",
          copied: "Link copied. You can share it on Instagram.",
          loading: "Loading test...",
          notFound: "Test not found",
          backToTests: "Back to Tests",
          resultReady: "Your Result Is Ready!",
          whatsapp: "Share on WhatsApp",
          x: "Share on X",
          linkedin: "Share on LinkedIn",
          instagram: "Share on Instagram",
          retry: "Retake the Test",
          browseMore: "Browse Other Tests",
          footer: "GDG on Campus Trakya University",
          back: "Back",
          answered: (count, total) => `${count} / ${total} questions answered`,
          seeResult: "See Result",
          remaining: (count) => `Answer ${count} more questions to see the result`,
          shareText: (resultTitle, testTitle) =>
            `I am ${resultTitle}! Try the ${testTitle} test! GDG on Campus Trakya University`,
          shareShort: (resultTitle, testTitle, url) =>
            `I am ${resultTitle}! Try the ${testTitle} test: ${url}`,
        }
      : {
          answerAll: "Lütfen tüm soruları cevaplayın!",
          copied: "Link kopyalandı! Instagram'da paylaşabilirsin.",
          loading: "Test yükleniyor...",
          notFound: "Test bulunamadı",
          backToTests: "Testlere Dön",
          resultReady: "Sonucun Hazır!",
          whatsapp: "WhatsApp'ta Paylaş",
          x: "X'te Paylaş",
          linkedin: "LinkedIn'de Paylaş",
          instagram: "Instagram'da Paylaş",
          retry: "Testi Tekrar Çöz",
          browseMore: "Diğer Testlere Bak",
          footer: "GDG on Campus Trakya Üniversitesi",
          back: "Geri",
          answered: (count, total) => `${count} / ${total} soru cevaplandı`,
          seeResult: "Sonucu Gör",
          remaining: (count) =>
            `Sonucu görmek için ${count} soru daha cevaplayın`,
          shareText: (resultTitle, testTitle) =>
            `Ben ${resultTitle}'im! ${testTitle} testini dene! GDG on Campus Trakya Üniversitesi`,
          shareShort: (resultTitle, testTitle, url) =>
            `Ben ${resultTitle}'im! ${testTitle} testini dene: ${url}`,
        };

  const [testData, setTestData] = useState(initialTestData);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(!initialTestData);

  useEffect(() => {
    if (initialTestData) return;
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchTest = async () => {
      try {
        const snapshot = await getDocs(collection(db, "personality_tests"));
        const matchingDoc = snapshot.docs.find(
          (doc) => generateSlug(doc.data().title || "") === slug
        );

        if (matchingDoc) {
          setTestData({ id: matchingDoc.id, ...matchingDoc.data() });
        } else {
          console.error("Test not found for slug:", slug);
        }
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [slug, initialTestData]);

  const handleOptionSelect = (questionIndex, option) => {
    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  };

  const handleSubmit = () => {
    if (Object.keys(answers).length < testData.questions.length) {
      alert(copy.answerAll);
      return;
    }
    setShowResult(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getResult = () => {
    const scores = {};

    Object.values(answers).forEach((answer) => {
      Object.entries(answer.points).forEach(([app, points]) => {
        scores[app] = (scores[app] || 0) + points;
      });
    });

    let maxScore = 0;
    let resultKey = Object.keys(testData.results)[0];

    Object.entries(scores).forEach(([app, score]) => {
      if (score > maxScore) {
        maxScore = score;
        resultKey = app;
      }
    });

    return testData.results[resultKey];
  };

  const resetTest = () => {
    setAnswers({});
    setShowResult(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const getTestTitle = () => getLocalizedField(testData, "title", locale);
  const getTestDescription = () =>
    getLocalizedField(testData, "description", locale);

  const shareOnTwitter = () => {
    const result = getResult();
    const text = copy.shareText(result.title, getTestTitle());
    const url = window.location.href;
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareOnWhatsApp = () => {
    const result = getResult();
    const text = copy.shareShort(
      result.title,
      getTestTitle(),
      window.location.href
    );
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareOnLinkedIn = () => {
    const url = window.location.href;
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank"
    );
  };

  const shareOnInstagram = async () => {
    const result = getResult();
    const text = copy.shareShort(
      result.title,
      getTestTitle(),
      window.location.href
    );
    await navigator.clipboard.writeText(text);
    alert(copy.copied);
  };

  if (loading) {
    return (
      <PageContainer className="max-w-3xl">
        <p className="text-md text-ink-2">{copy.loading}</p>
      </PageContainer>
    );
  }

  if (!testData) {
    return (
      <PageContainer className="max-w-3xl">
        <EmptyState
          title={copy.notFound}
          action={
            <Button asChild>
              <Link href="/personality-test">{copy.backToTests}</Link>
            </Button>
          }
        />
      </PageContainer>
    );
  }

  if (showResult) {
    const result = getResult();

    return (
      <PageContainer className="max-w-3xl">
        <PageHeader title={copy.resultReady} description={getTestTitle()} />

        <article
          className="border-t-4 border-rule pt-6"
          style={result.color ? { borderTopColor: result.color } : undefined}
        >
          {result.imageUrl && (
            <img
              src={result.imageUrl}
              alt={result.title}
              className="mb-6 h-auto max-h-96 max-w-full rounded-lg border border-rule object-contain"
            />
          )}

          <h2 className="font-display text-display-s font-extrabold">
            {result.title}
          </h2>

          <p className="mt-4 max-w-measure text-md text-ink-2">
            {result.description}
          </p>

          {result.traits && (
            <ul className="mt-6 flex flex-wrap gap-2">
              {result.traits.map((trait, index) => (
                <li key={index}>
                  <Badge>{trait}</Badge>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="mt-8 flex flex-wrap gap-3 border-t border-rule pt-6">
          <ShareButton
            background="#25D366"
            label={copy.whatsapp}
            onClick={shareOnWhatsApp}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </ShareButton>
          <ShareButton background="#000000" label={copy.x} onClick={shareOnTwitter}>
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </ShareButton>
          <ShareButton
            background="#0A66C2"
            label={copy.linkedin}
            onClick={shareOnLinkedIn}
          >
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </ShareButton>
          <ShareButton
            background="#D6249F"
            label={copy.instagram}
            onClick={shareOnInstagram}
          >
            <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
            </svg>
          </ShareButton>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={resetTest}>
            {copy.retry}
          </Button>
          <Button asChild>
            <Link href="/personality-test">{copy.browseMore}</Link>
          </Button>
        </div>

        <p className="mt-10 text-sm text-muted-foreground">{copy.footer}</p>
      </PageContainer>
    );
  }

  const progress =
    (Object.keys(answers).length / testData.questions.length) * 100;
  const answeredCount = Object.keys(answers).length;

  return (
    <PageContainer className="max-w-3xl pb-0 md:pb-0">
      <Button asChild variant="ghost" size="sm" className="-ml-3 mb-4">
        <Link href="/personality-test">
          <ArrowLeft aria-hidden="true" />
          {copy.back}
        </Link>
      </Button>

      <PageHeader
        title={getTestTitle()}
        description={getTestDescription()}
        className="mb-6 md:mb-8"
      />

      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={testData.questions.length}
        aria-valuenow={answeredCount}
        className="h-1 w-full bg-rule"
      >
        <div
          className="h-full bg-brand transition-[width] duration-short ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mt-2 font-outlier text-sm tabular-nums text-muted-foreground">
        {copy.answered(answeredCount, testData.questions.length)}
      </p>

      <ol className="mt-8 space-y-10">
        {testData.questions.map((question, questionIndex) => (
          <li key={questionIndex} className="border-t border-rule pt-5">
            <h2 className="text-xl font-bold leading-tight md:text-2xl">
              {questionIndex + 1}. {question.question}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              {question.options.map((option, optionIndex) => {
                const isSelected = answers[questionIndex] === option;

                return (
                  <button
                    key={optionIndex}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => handleOptionSelect(questionIndex, option)}
                    className={`flex min-h-control items-center gap-3 rounded border px-4 py-3 text-left transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                      isSelected
                        ? "border-ink bg-paper-2"
                        : "border-input bg-background"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${OPTION_MARKS[optionIndex] || "bg-rule"}`}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 leading-snug">
                      {option.text}
                    </span>
                    <Check
                      className={`h-4 w-4 shrink-0 text-brand ${isSelected ? "" : "invisible"}`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-0 z-sticky mt-10 border-t border-rule bg-background py-4">
        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={answeredCount < testData.questions.length}
          className="w-full md:w-auto"
        >
          {answeredCount === testData.questions.length
            ? copy.seeResult
            : copy.remaining(testData.questions.length - answeredCount)}
        </Button>
      </div>
    </PageContainer>
  );
}
