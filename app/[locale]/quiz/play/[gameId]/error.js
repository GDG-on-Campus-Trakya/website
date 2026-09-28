"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Play page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100dvh-4rem)] flex-col justify-center bg-stage px-4 py-10 text-stage-ink sm:px-6">
      <div className="mx-auto w-full max-w-md border-y border-stage-rule py-8">
        <h1 className="mb-3 font-display text-3xl font-bold">Bir şeyler ters gitti</h1>
        <p className="mb-6 text-stage-muted">
          Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <Button onClick={reset}>Yeniden Dene</Button>
      </div>
    </div>
  );
}
