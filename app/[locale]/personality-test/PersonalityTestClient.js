"use client";

import { useState, useEffect } from "react";
import { generateSlug } from "@/lib/slug";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";
import { ArrowRight, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader, EmptyState } from "@/components/ui/page";

export default function PersonalityTestClient({ initialTests = [] }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          loading: "Loading tests...",
          title: "Personality Tests",
          subtitle: "Which test would you like to take?",
          search: "Search tests...",
          clear: "Clear search",
          questionCount: (count) => `${count} questions`,
          start: "Start",
          noResults: "No results found",
          noTests: "No tests yet",
          noResultsBody: (query) => `No test matched "${query}".`,
          noTestsBody: "New tests will be added soon!",
        }
      : {
          loading: "Testler yükleniyor...",
          title: "Kişilik Testleri",
          subtitle: "Hangi teste katılmak istersin?",
          search: "Test ara...",
          clear: "Aramayı temizle",
          questionCount: (count) => `${count} soru`,
          start: "Başla",
          noResults: "Sonuç bulunamadı",
          noTests: "Henüz test yok",
          noResultsBody: (query) => `"${query}" ile eşleşen test bulunamadı.`,
          noTestsBody: "Yakında yeni testler eklenecek!",
        };

  const [tests, setTests] = useState(initialTests);
  const [loading, setLoading] = useState(initialTests.length === 0);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (initialTests.length > 0) return;

    const fetchTests = async () => {
      try {
        // Only without server data, so Firestore is not part of the page's bundle.
        const [{ db }, { collection, getDocs, query, orderBy }] = await Promise.all([
          import("@/firebase"),
          import("firebase/firestore"),
        ]);
        const testsRef = collection(db, "personality_tests");
        const testsQuery = query(testsRef, orderBy("order", "asc"));
        const querySnapshot = await getDocs(testsQuery);

        const testsData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const title = data.title || "";
          return {
            ...data,
            id: doc.id,
            slug: generateSlug(title),
          };
        });

        setTests(testsData);
      } catch (error) {
        console.error("Error fetching tests:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTests();
  }, [initialTests]);

  if (loading) {
    return (
      <PageContainer>
        <p className="text-md text-ink-2">{copy.loading}</p>
      </PageContainer>
    );
  }

  const filteredTests = tests.filter((test) => {
    const search = searchQuery.toLowerCase();
    const title = getLocalizedField(test, "title", locale)?.toLowerCase() || "";
    const description =
      getLocalizedField(test, "description", locale)?.toLowerCase() || "";

    return title.includes(search) || description.includes(search);
  });

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.subtitle} />

      <div className="relative mb-8 max-w-xl">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={copy.search}
          aria-label={copy.search}
          className="pl-10 pr-11"
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

      {filteredTests.length > 0 && (
        <ul className="border-t-2 border-ink">
          {filteredTests.map((test) => {
            const title = getLocalizedField(test, "title", locale);
            const description = getLocalizedField(test, "description", locale);

            return (
              <li key={test.id}>
                <Link
                  href={`/personality-test/${test.slug || generateSlug(test.title)}`}
                  className="group flex items-start gap-4 border-b border-rule py-5 transition-colors duration-micro ease-out hover:bg-paper-2 focus-visible:outline-offset-[-2px] sm:gap-6"
                >
                  {test.imageUrl && (
                    <div className="aspect-[4/3] w-24 shrink-0 overflow-hidden rounded bg-paper-2 sm:w-36">
                      <img
                        src={test.imageUrl}
                        alt={title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="font-display text-lg font-bold group-hover:underline group-hover:decoration-brand group-hover:decoration-2 group-hover:underline-offset-4">
                      {title}
                    </h2>
                    <p className="mt-1 max-w-measure text-ink-2">{description}</p>
                    <p className="mt-3 font-outlier text-sm tabular-nums text-muted-foreground">
                      {copy.questionCount(test.questionCount || 10)}
                    </p>
                  </div>

                  <span className="hidden items-center gap-1 self-center whitespace-nowrap font-medium text-brand sm:inline-flex">
                    {copy.start}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {filteredTests.length === 0 && !loading && (
        <EmptyState
          title={searchQuery ? copy.noResults : copy.noTests}
          description={
            searchQuery ? copy.noResultsBody(searchQuery) : copy.noTestsBody
          }
        />
      )}
    </PageContainer>
  );
}
