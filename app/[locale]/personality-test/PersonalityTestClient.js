"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/firebase";
import { generateSlug } from "@/lib/slug";
import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { getLocalizedField } from "@/utils/localeUtils";

export default function PersonalityTestClient({ initialTests = [] }) {
  const locale = useLocale();
  const copy =
    locale === "en"
      ? {
          loading: "Loading tests...",
          title: "Personality Tests",
          subtitle: "Which test would you like to take?",
          search: "Search tests...",
          questionCount: (count) => `${count} questions`,
          start: "Start ->",
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
          questionCount: (count) => `${count} soru`,
          start: "Başla ->",
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
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 flex items-center justify-center">
        <div className="text-white text-2xl">{copy.loading}</div>
      </div>
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
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-black to-gray-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {copy.title}
          </h1>
          <p className="text-gray-400 text-lg">{copy.subtitle}</p>
        </div>

        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={copy.search}
              className="w-full bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl py-3 pl-12 pr-10 text-white placeholder-gray-400 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              >
                ×
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test, index) => {
            const title = getLocalizedField(test, "title", locale);
            const description = getLocalizedField(test, "description", locale);

            return (
              <div
                key={test.id}
                className="animate-fadeIn"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <Link
                  href={`/personality-test/${test.slug || generateSlug(test.title)}`}
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer hover:scale-105 h-full">
                    {test.imageUrl && (
                      <div className="mb-4 rounded-2xl overflow-hidden bg-white/5">
                        <img
                          src={test.imageUrl}
                          alt={title}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <h2 className="text-2xl font-bold text-white mb-2">
                      {title}
                    </h2>

                    <p className="text-gray-300 mb-4">{description}</p>

                    <div className="flex items-center justify-between text-sm text-gray-400">
                      <span>{copy.questionCount(test.questionCount || 10)}</span>
                      <span className="text-green-400">{copy.start}</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        {filteredTests.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">
              {searchQuery ? "\u{1F50D}" : "\u{1F3AD}"}
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {searchQuery ? copy.noResults : copy.noTests}
            </h2>
            <p className="text-gray-400">
              {searchQuery
                ? copy.noResultsBody(searchQuery)
                : copy.noTestsBody}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
