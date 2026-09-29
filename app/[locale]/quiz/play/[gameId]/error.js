"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

const COPY = {
  tr: {
    title: "Bir şeyler ters gitti",
    description: "Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.",
    retry: "Yeniden Dene",
  },
  en: {
    title: "Something went wrong",
    description: "An error occurred while loading the page. Please try again.",
    retry: "Try Again",
  },
};

export default function Error({ error, reset }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];

  useEffect(() => {
    console.error("Play page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center bg-stage px-4 py-10 text-stage-ink sm:px-6">
      <div className="mx-auto w-full max-w-md border-y border-stage-rule py-8">
        <h1 className="mb-3 font-display text-3xl font-bold">{copy.title}</h1>
        <p className="mb-6 text-stage-muted">{copy.description}</p>
        <Button onClick={reset}>{copy.retry}</Button>
      </div>
    </div>
  );
}
