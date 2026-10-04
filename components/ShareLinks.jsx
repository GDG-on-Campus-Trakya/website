"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Link2, Share2 } from "lucide-react";

const COPY = {
  tr: {
    share: "Paylaş",
    copy: "Bağlantıyı kopyala",
    copied: "Bağlantı kopyalandı.",
    copyFailed: "Kopyalanamadı; adres çubuğundaki bağlantıyı kullan.",
  },
  en: {
    share: "Share",
    copy: "Copy link",
    copied: "Link copied.",
    copyFailed: "Could not copy; use the link in the address bar.",
  },
};

const linkClass =
  "inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-sm text-sm font-medium text-brand underline underline-offset-4 decoration-1 transition-colors duration-micro ease-out hover:decoration-2";

/** Share a page: the phone's share sheet where there is one, copy link, and WhatsApp. */
export default function ShareLinks({ title }) {
  const copy = COPY[useLocale() === "en" ? "en" : "tr"];
  const [pageUrl, setPageUrl] = useState("");
  const [canShare, setCanShare] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    setPageUrl(window.location.href);
    setCanShare(typeof navigator.share === "function");
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setStatus("copied");
    } catch {
      setStatus("copyFailed");
    }
    setTimeout(() => setStatus(null), 4000);
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5">
        {canShare && (
          <button
            type="button"
            className={linkClass}
            onClick={() => navigator.share({ title, url: pageUrl }).catch(() => {})}
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            {copy.share}
          </button>
        )}
        <button type="button" className={linkClass} onClick={copyLink}>
          <Link2 className="h-4 w-4" aria-hidden="true" />
          {copy.copy}
        </button>
        <a
          className={linkClass}
          href={`https://wa.me/?text=${encodeURIComponent(`${title} ${pageUrl}`.trim())}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          WhatsApp
        </a>
      </div>
      <p role="status" className="min-h-[1lh] text-sm text-ink-2">
        {status && copy[status]}
      </p>
    </div>
  );
}
