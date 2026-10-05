"use client";

/* Hallmark · genre: playful-editorial · personality tests share the home page exception (design.md)
 * macrostructure: big title + search, then a grid of cover cards
 */
import { useState, useEffect } from "react";
import { generateSlug } from "@/lib/slug";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/page";
import { MARKS, TestCard } from "@/components/personality/cards";

const COPY = {
  tr: {
    loading: "Testler yükleniyor…",
    title: "Kişilik testleri",
    subtitle: "Birkaç dakikalık testler. Soruları cevapla, sonucunu hikâyende ya da arkadaşlarınla paylaş.",
    count: (n) => `${n} test`,
    search: "Test ara",
    clear: "Aramayı temizle",
    questionCount: (count) => `${count} soru`,
    start: "Başla",
    noResults: "Eşleşen test yok",
    noTests: "Henüz test yok",
    noResultsBody: (query) => `"${query}" ile eşleşen bir test bulunamadı.`,
    noTestsBody: "Yeni testler eklendiğinde burada görünecek.",
  },
  en: {
    loading: "Loading tests…",
    title: "Personality tests",
    subtitle: "Tests that take a few minutes. Answer the questions, then share your result in your story or with friends.",
    count: (n) => (n === 1 ? "1 test" : `${n} tests`),
    search: "Search tests",
    clear: "Clear search",
    questionCount: (count) => `${count} questions`,
    start: "Start",
    noResults: "Nothing matches",
    noTests: "No tests yet",
    noResultsBody: (query) => `No test matches "${query}".`,
    noTestsBody: "New tests appear here when they are added.",
  },
};

export default function PersonalityTestClient({ initialTests = [] }) {
  const locale = useLocale();
  const copy = COPY[locale] || COPY.tr;

  const [tests, setTests] = useState(initialTests);
  const [loading, setLoading] = useState(initialTests.length === 0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialTests.length > 0) return;

    const fetchTests = async () => {
      try {
        // Only without server data, so Firestore is not part of the page's bundle. Destructure
        // each import directly: webpack can then drop the Firestore exports nobody uses.
        const { db } = await import("@/firebase");
        const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
        const testsQuery = query(collection(db, "personality_tests"), orderBy("order", "asc"));
        const querySnapshot = await getDocs(testsQuery);

        setTests(
          querySnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              ...data,
              id: doc.id,
              slug: data.slug || generateSlug(data.title || ""),
              questionCount: data.questionCount || data.questions?.length || 0,
            };
          })
        );
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [initialTests]);

  const search = searchQuery.trim().toLocaleLowerCase(locale === "en" ? "en" : "tr");
  const filteredTests = tests.filter((test) => {
    if (!search) return true;
    const haystack = `${getLocalizedField(test, "title", locale) || ""} ${getLocalizedField(test, "description", locale) || ""}`;
    return haystack.toLocaleLowerCase(locale === "en" ? "en" : "tr").includes(search);
  });

  return (
    <div className="mx-auto w-full max-w-page px-gutter pb-16 pt-8 md:pt-12">
      <header className="grid items-end gap-6 border-b border-rule pb-8 md:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <div className="flex gap-1.5" aria-hidden="true">
            {MARKS.map((mark) => (
              <span key={mark} className={`h-2 w-10 rounded-sm ${mark}`} />
            ))}
          </div>
          <h1 className="mt-5 font-display text-[clamp(2.5rem,6vw,4.75rem)] font-extrabold leading-[0.95] tracking-tight">
            {copy.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-ink-2">{copy.subtitle}</p>
        </div>

        <div>
          {!loading && tests.length > 0 && (
            <p className="mb-2 font-outlier text-sm tabular-nums text-muted-foreground">{copy.count(tests.length)}</p>
          )}
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.search}
              aria-label={copy.search}
              className="pl-10 pr-11 [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={copy.clear}
                className="absolute right-0 top-1/2 flex h-control w-11 -translate-y-1/2 items-center justify-center rounded text-muted-foreground transition-colors duration-micro hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </header>

      {loading ? (
        <p className="mt-8 text-md text-ink-2">{copy.loading}</p>
      ) : filteredTests.length > 0 ? (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTests.map((test, index) => (
            <li key={test.id}>
              <TestCard
                test={test}
                index={index}
                priority={index < 4}
                title={getLocalizedField(test, "title", locale)}
                description={getLocalizedField(test, "description", locale)}
                questionsLabel={copy.questionCount(test.questionCount || test.questions?.length || 0)}
                startLabel={copy.start}
              />
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-8">
          <EmptyState
            title={searchQuery ? copy.noResults : copy.noTests}
            description={searchQuery ? copy.noResultsBody(searchQuery) : copy.noTestsBody}
          />
        </div>
      )}
    </div>
  );
}
