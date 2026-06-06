"use client";

import { useEffect } from "react";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Play page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-6 max-w-md w-full text-center">
        <h1 className="text-2xl font-bold mb-3">Bir şeyler ters gitti</h1>
        <p className="text-gray-300 mb-4">
          Sayfa yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors font-semibold"
        >
          Yeniden Dene
        </button>
      </div>
    </div>
  );
}

