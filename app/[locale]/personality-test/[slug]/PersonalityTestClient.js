"use client";

/* Hallmark · genre: playful-editorial · personality tests share the home page exception (design.md)
 * macrostructure: cover intro -> one question per screen (quiz-coloured A-D tiles) -> result card
 * with a story image and a result link to share
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { generateSlug } from "@/lib/slug";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";
import { canOptimizeImage } from "@/lib/images";
import { pickResult } from "@/lib/personality-result";
import { ArrowLeft, ArrowRight, Check, Download, Link2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/page";
import { MARKS, ResultCard, TestCard } from "@/components/personality/cards";

const COPY = {
  tr: {
    loading: "Test yükleniyor…",
    notFound: "Bu test yok ya da kaldırılmış.",
    allTests: "Tüm testler",
    questions: (n) => `${n} soru`,
    start: "Başla",
    startHint: "Bir cevap seçince sıradaki soruya geçersin; istersen geri dönebilirsin.",
    question: (n, total) => `Soru ${n} / ${total}`,
    previous: "Önceki soru",
    next: "Sonraki soru",
    keys: "1–4 ya da A–D tuşlarıyla da seçebilirsin.",
    progress: (n, total) => `${total} sorudan ${n} tanesi cevaplandı`,
    yourResult: "Sonucun",
    share: "Paylaş",
    story: "Hikâye görseli",
    storyFailed: "Görsel hazırlanamadı; bağlantıyı paylaşabilirsin.",
    nativeShare: "Bağlantıyı paylaş",
    copyLink: "Bağlantıyı kopyala",
    copied: "Bağlantı kopyalandı.",
    copyFailed: "Kopyalanamadı; adres çubuğundaki bağlantıyı paylaş.",
    whatsapp: "WhatsApp'ta paylaş",
    x: "X'te paylaş",
    linkedin: "LinkedIn'de paylaş",
    retry: "Yeniden çöz",
    more: "Başka bir test çöz",
    // No suffix after the result: "Ben Ronaldo'im" breaks Turkish vowel harmony.
    shareText: (resultTitle, testTitle) => `${testTitle} testindeki sonucum: ${resultTitle}. Sen de çöz:`,
  },
  en: {
    loading: "Loading test…",
    notFound: "This test does not exist or has been removed.",
    allTests: "All tests",
    questions: (n) => (n === 1 ? "1 question" : `${n} questions`),
    start: "Start",
    startHint: "Picking an answer takes you to the next question; you can always go back.",
    question: (n, total) => `Question ${n} of ${total}`,
    previous: "Previous question",
    next: "Next question",
    keys: "You can also pick with the 1–4 or A–D keys.",
    progress: (n, total) => `${n} of ${total} questions answered`,
    yourResult: "Your result",
    share: "Share",
    story: "Story image",
    storyFailed: "The image could not be made; share the link instead.",
    nativeShare: "Share link",
    copyLink: "Copy link",
    copied: "Link copied.",
    copyFailed: "Could not copy; share the link in the address bar.",
    whatsapp: "Share on WhatsApp",
    x: "Share on X",
    linkedin: "Share on LinkedIn",
    retry: "Take it again",
    more: "Try another test",
    shareText: (resultTitle, testTitle) => `My result in the ${testTitle} test: ${resultTitle}. Take it too:`,
  },
};

// Answer tiles keep the quiz order and letters: red, blue, yellow, green.
const OPTION_TILES = [
  "bg-mark-red text-brand-ink",
  "bg-mark-blue text-brand-ink",
  "bg-mark-yellow text-ink",
  "bg-mark-green text-brand-ink",
];
const LETTERS = ["A", "B", "C", "D"];
const KEYS = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };

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

function BackLink({ label }) {
  return (
    <Button asChild variant="ghost" size="sm" className="-ml-3">
      <Link href="/personality-test">
        <ArrowLeft aria-hidden="true" />
        {label}
      </Link>
    </Button>
  );
}

export default function PersonalityTestClient({ slug, initialTestData = null, moreTests = [] }) {
  const locale = useLocale();
  const copy = COPY[locale] || COPY.tr;

  const [testData, setTestData] = useState(initialTestData);
  const [loading, setLoading] = useState(!initialTestData);
  const [stage, setStage] = useState("intro");
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);
  const [story, setStory] = useState({ status: "idle", blob: null });
  const [shareStatus, setShareStatus] = useState(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const topRef = useRef(null);
  const headingRef = useRef(null);
  const advancing = useRef(false);
  const moved = useRef(false);
  const testPath = useRef(null);

  useEffect(() => {
    setCanNativeShare(typeof navigator.share === "function");
    testPath.current = window.location.pathname.replace(/\/$/, "");
  }, []);

  useEffect(() => {
    if (initialTestData) return;
    if (!slug) {
      setLoading(false);
      return;
    }

    const fetchTest = async () => {
      try {
        // Only without server data, so Firestore is not part of the page's bundle. Destructure
        // each import directly: webpack can then drop the Firestore exports nobody uses.
        const { db } = await import("@/firebase");
        const { collection, getDocs } = await import("firebase/firestore");
        const snapshot = await getDocs(collection(db, "personality_tests"));
        const matchingDoc = snapshot.docs.find(
          (doc) => (doc.data().slug || generateSlug(doc.data().title || "")) === slug
        );
        if (matchingDoc) setTestData({ id: matchingDoc.id, ...matchingDoc.data() });
      } catch (error) {
        console.error("Error fetching test:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTest();
  }, [slug, initialTestData]);

  const total = testData?.questions?.length || 0;

  // A new screen: bring its top into view and move focus to its heading for screen readers.
  useEffect(() => {
    if (!moved.current) return;
    const top = topRef.current;
    if (top && top.getBoundingClientRect().top < 0) top.scrollIntoView({ block: "start" });
    headingRef.current?.focus({ preventScroll: true });
  }, [stage, current]);

  const go = (nextStage, nextIndex = current) => {
    moved.current = true;
    setStage(nextStage);
    setCurrent(nextIndex);
  };

  const finish = (finalAnswers) => {
    const picked = pickResult(testData, finalAnswers);
    setResult(picked);
    setStory({ status: "idle", blob: null });
    setShareStatus(null);
    // The address bar now holds the result's own link, so copying it shares the result.
    if (testPath.current) window.history.replaceState(null, "", `${testPath.current}/${picked.slug}`);
    go("result");
  };

  const choose = useCallback(
    (optionIndex) => {
      if (advancing.current || stage !== "questions") return;
      const nextAnswers = [...answers];
      nextAnswers[current] = optionIndex;
      setAnswers(nextAnswers);
      advancing.current = true;
      // A short beat so the choice is seen before the next question replaces it.
      window.setTimeout(() => {
        advancing.current = false;
        if (current < total - 1) go("questions", current + 1);
        else finish(nextAnswers);
      }, 220);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [answers, current, stage, total]
  );

  useEffect(() => {
    if (stage !== "questions") return;
    const onKey = (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (event.target.closest?.("input, textarea, select, [contenteditable]")) return;
      const index = KEYS[event.key.toLowerCase()];
      if (index === undefined || index >= (testData.questions[current]?.options?.length || 0)) return;
      event.preventDefault();
      choose(index);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stage, current, choose, testData]);

  // Make the story image as soon as the result shows, so sharing it is one tap (iOS only opens
  // the share sheet straight from a tap).
  useEffect(() => {
    if (stage !== "result" || !result) return;
    let cancelled = false;
    setStory({ status: "loading", blob: null });
    fetch(`/api/personality-test/${encodeURIComponent(slug)}/${encodeURIComponent(result.slug)}?format=story&locale=${locale}`)
      .then((response) => {
        if (!response.ok) throw new Error(`Story image: ${response.status}`);
        return response.blob();
      })
      .then((blob) => !cancelled && setStory({ status: "ready", blob }))
      .catch((error) => {
        console.error(error);
        if (!cancelled) setStory({ status: "failed", blob: null });
      });
    return () => {
      cancelled = true;
    };
  }, [stage, result, slug, locale]);

  const restart = () => {
    setAnswers([]);
    setResult(null);
    if (testPath.current) window.history.replaceState(null, "", testPath.current);
    go("questions", 0);
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-page px-gutter py-10">
        <p className="text-md text-ink-2">{copy.loading}</p>
      </div>
    );
  }

  if (!testData) {
    return (
      <div className="mx-auto w-full max-w-page px-gutter py-10">
        <EmptyState
          title={copy.notFound}
          action={
            <Button asChild>
              <Link href="/personality-test">{copy.allTests}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const testTitle = getLocalizedField(testData, "title", locale);
  const testDescription = getLocalizedField(testData, "description", locale);

  if (stage === "intro") {
    return (
      <div className="mx-auto w-full max-w-page px-gutter pb-16 pt-6 md:pt-8">
        <BackLink label={copy.allTests} />
        <div className="mt-4 grid items-center gap-8 md:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] md:gap-12">
          {testData.imageUrl && (
            <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-paper-2">
              <Image
                src={testData.imageUrl}
                alt=""
                fill
                priority
                sizes="(min-width: 768px) 55vw, 100vw"
                unoptimized={!canOptimizeImage(testData.imageUrl)}
                className="object-cover"
              />
            </div>
          )}
          <div className={testData.imageUrl ? "" : "md:col-span-2"}>
            <div className="flex gap-1.5" aria-hidden="true">
              {MARKS.map((mark) => (
                <span key={mark} className={`h-2 w-10 rounded-sm ${mark}`} />
              ))}
            </div>
            <h1 className="mt-5 font-display text-[clamp(2.25rem,5vw,4rem)] font-extrabold leading-[0.95] tracking-tight [overflow-wrap:anywhere]">
              {testTitle}
            </h1>
            {testDescription && <p className="mt-5 max-w-measure text-lg text-ink-2">{testDescription}</p>}
            <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
              <Button size="lg" onClick={() => go("questions", 0)}>
                {copy.start}
                <ArrowRight aria-hidden="true" />
              </Button>
              <span className="font-outlier text-sm tabular-nums text-muted-foreground">{copy.questions(total)}</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">{copy.startHint}</p>
          </div>
        </div>
      </div>
    );
  }

  if (stage === "result" && result) {
    const shareUrl = () => window.location.href;
    const shareText = () => copy.shareText(result.title, testTitle);
    const fileName = `${slug}-${result.slug}.png`;

    const shareStory = async () => {
      if (!story.blob) return;
      const file = new File([story.blob], fileName, { type: story.blob.type || "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
        } catch {
          // Closing the share sheet rejects too; nothing to report.
        }
        return;
      }
      const url = URL.createObjectURL(story.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    };

    const shareNatively = async () => {
      try {
        await navigator.share({ text: shareText(), url: shareUrl() });
      } catch {
        // Closing the share sheet rejects too; nothing to report.
      }
    };

    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(shareUrl());
        setShareStatus("copied");
      } catch {
        setShareStatus("copyFailed");
      }
    };

    const open = (url) => window.open(url, "_blank", "noopener,noreferrer");

    return (
      <div ref={topRef} className="mx-auto w-full max-w-page scroll-mt-20 px-gutter pb-16 pt-6 md:pt-8">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
          <BackLink label={copy.allTests} />
          <p className="text-sm font-semibold text-ink-2">{testTitle}</p>
        </div>

        <div className="mt-4">
          <ResultCard result={result} label={copy.yourResult} headingLevel="h1" headingRef={headingRef} priority>
            <div className="mt-8 border-t border-rule pt-6">
              <h2 className="text-sm font-semibold text-ink">
                {copy.share}
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {story.status !== "failed" && (
                  <Button size="lg" onClick={shareStory} disabled={story.status !== "ready"} loading={story.status === "loading"}>
                    <Download aria-hidden="true" />
                    {copy.story}
                  </Button>
                )}
                {canNativeShare && (
                  <Button size="lg" variant="outline" onClick={shareNatively}>
                    <Share2 aria-hidden="true" />
                    {copy.nativeShare}
                  </Button>
                )}
                <Button size="lg" variant="outline" onClick={copyLink}>
                  <Link2 aria-hidden="true" />
                  {copy.copyLink}
                </Button>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <ShareButton
                  background="#25D366"
                  label={copy.whatsapp}
                  onClick={() => open(`https://wa.me/?text=${encodeURIComponent(`${shareText()} ${shareUrl()}`)}`)}
                >
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </ShareButton>
                <ShareButton
                  background="#000000"
                  label={copy.x}
                  onClick={() =>
                    open(`https://x.com/intent/post?text=${encodeURIComponent(shareText())}&url=${encodeURIComponent(shareUrl())}`)
                  }
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </ShareButton>
                <ShareButton
                  background="#0A66C2"
                  label={copy.linkedin}
                  onClick={() => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl())}`)}
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </ShareButton>
              </div>
              <p role="status" className="mt-2 min-h-[1lh] text-sm text-ink-2">
                {shareStatus ? copy[shareStatus] : story.status === "failed" ? copy.storyFailed : ""}
              </p>
              <Button variant="ghost" onClick={restart} className="-ml-3 mt-2">
                {copy.retry}
              </Button>
            </div>
          </ResultCard>
        </div>

        {moreTests.length > 0 && (
          <section aria-labelledby="more-tests" className="mt-16">
            <h2 id="more-tests" className="font-display text-3xl font-extrabold md:text-4xl">
              {copy.more}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {moreTests.map((test, index) => (
                <li key={test.id}>
                  <TestCard
                    test={test}
                    index={index + 1}
                    title={getLocalizedField(test, "title", locale)}
                    description={getLocalizedField(test, "description", locale)}
                    questionsLabel={copy.questions(test.questionCount)}
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

  const question = testData.questions[current];
  const chosen = answers[current];
  const answeredCount = answers.filter((answer) => answer !== undefined).length;

  return (
    <div ref={topRef} className="mx-auto w-full max-w-4xl scroll-mt-20 px-gutter pb-16 pt-6 md:pt-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="min-w-0 truncate text-sm font-semibold text-ink-2">{testTitle}</h1>
        <p className="shrink-0 font-outlier text-sm tabular-nums text-muted-foreground">
          {current + 1} / {total}
        </p>
      </div>
      <div
        role="progressbar"
        aria-label={copy.progress(answeredCount, total)}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={answeredCount}
        className="mt-3 flex gap-1"
      >
        {testData.questions.map((_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full transition-colors duration-short ${
              answers[index] !== undefined ? "bg-brand" : index === current ? "bg-ink" : "bg-rule"
            }`}
          />
        ))}
      </div>

      <div key={current} className="animate-in fade-in-0 slide-in-from-right-4 duration-short">
        <p className="mt-10 font-outlier text-sm text-muted-foreground md:mt-14">{copy.question(current + 1, total)}</p>
        <h2
          id="question-title"
          ref={headingRef}
          tabIndex={-1}
          className="mt-3 font-display text-[clamp(1.75rem,4.5vw,3rem)] font-extrabold leading-[1.05] tracking-tight outline-none [overflow-wrap:anywhere]"
        >
          {question.question}
        </h2>

        <div role="group" aria-labelledby="question-title" className="mt-8 grid gap-3 md:grid-cols-2">
          {question.options.map((option, index) => {
            const isChosen = chosen === index;
            return (
              <button
                key={index}
                type="button"
                aria-pressed={isChosen}
                onClick={() => choose(index)}
                className={`group flex min-h-[4.5rem] items-stretch overflow-hidden rounded-lg text-left transition-colors duration-micro ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${
                  isChosen ? "bg-paper-3 ring-2 ring-inset ring-ink" : "bg-paper-2 hover:bg-paper-3"
                }`}
              >
                <span
                  className={`flex w-14 shrink-0 items-center justify-center font-display text-2xl font-extrabold ${OPTION_TILES[index % 4]}`}
                  aria-hidden="true"
                >
                  {LETTERS[index] || index + 1}
                </span>
                <span className="flex min-w-0 flex-1 items-center px-4 py-3 text-lg font-semibold leading-snug">
                  {option.text}
                </span>
                <span className="flex w-10 shrink-0 items-center justify-center" aria-hidden="true">
                  {isChosen && <Check className="h-5 w-5" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 flex min-h-control items-center justify-between gap-4">
        {current > 0 ? (
          <Button variant="ghost" onClick={() => go("questions", current - 1)} className="-ml-3">
            <ArrowLeft aria-hidden="true" />
            {copy.previous}
          </Button>
        ) : (
          <p className="hidden text-sm text-muted-foreground md:block">{copy.keys}</p>
        )}
        {chosen !== undefined && current < total - 1 && (
          <Button variant="outline" onClick={() => go("questions", current + 1)} className="ml-auto">
            {copy.next}
            <ArrowRight aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
