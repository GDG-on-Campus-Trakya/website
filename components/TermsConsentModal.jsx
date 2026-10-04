"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";

const COPY = {
  tr: {
    title: "Başlamadan önce",
    description:
      "Hesabını kullanmaya başlamadan önce gizlilik politikasını ve kullanım şartlarını onaylaman gerekiyor.",
    privacyPrefix: "Gizlilik Politikasını",
    privacySuffix: "okudum ve kabul ediyorum.",
    privacyHelp:
      "Kişisel verilerinin nasıl toplandığını, kullanıldığını ve korunduğunu anlatır.",
    termsPrefix: "Kullanım Şartlarını",
    termsSuffix: "okudum ve kabul ediyorum.",
    termsHelp:
      "Siteyi kullanma kurallarını, hesabınla ilgili sorumluluklarını ve topluluk kurallarını anlatır.",
    kvkkTitle: "KVKK Bilgilendirmesi:",
    kvkkBody:
      "Bu platform KVKK uyarınca kişisel verilerinizi açık rızanızla işlemektedir. Verileriniz yalnızca etkinlik organizasyonu, istatistiksel analiz ve destek hizmetleri için kullanılacaktır.",
    decline: "Reddet ve çıkış yap",
    accept: "Onayla ve devam et",
  },
  en: {
    title: "Before you start",
    description:
      "Before you use your account, confirm the privacy policy and the terms of use.",
    privacyPrefix: "I have read and accept the",
    // The link text supplies "Privacy Policy"; repeating it here printed it twice.
    privacySuffix: ".",
    privacyHelp:
      "Learn how your personal data is collected, used, and protected.",
    termsPrefix: "I have read and accept the",
    termsSuffix: ".",
    termsHelp:
      "Review platform usage rules, your account responsibilities, and the community guidelines.",
    kvkkTitle: "Privacy Notice:",
    kvkkBody:
      "This platform processes your personal data for community operations, statistical analysis, and support services in line with applicable privacy obligations.",
    decline: "Decline and sign out",
    accept: "Accept and continue",
  },
};

export default function TermsConsentModal({ isOpen, onAccept, onDecline }) {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open");
      document.body.style.overflow = "hidden";
    } else {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const bothAccepted = privacyAccepted && termsAccepted;

  const linkClass =
    "text-brand underline underline-offset-4 decoration-1 hover:decoration-2";

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-w-2xl [&>button]:hidden"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{copy.title}</DialogTitle>
          <DialogDescription className="mt-2 text-base text-ink-2">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-2">
          <div className="flex items-start gap-3 border-t border-rule py-4">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={setPrivacyAccepted}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor="privacy" className="cursor-pointer text-sm leading-normal">
                {locale === "en" ? `${copy.privacyPrefix} ` : ""}
                <Link href="/privacy" target="_blank" className={linkClass}>
                  {locale === "en" ? "Privacy Policy" : copy.privacyPrefix}
                </Link>
                {locale === "en" ? copy.privacySuffix : ` ${copy.privacySuffix}`}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{copy.privacyHelp}</p>
            </div>
          </div>

          <div className="flex items-start gap-3 border-t border-rule py-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label htmlFor="terms" className="cursor-pointer text-sm leading-normal">
                {locale === "en" ? `${copy.termsPrefix} ` : ""}
                <Link href="/terms" target="_blank" className={linkClass}>
                  {locale === "en" ? "Terms of Use" : copy.termsPrefix}
                </Link>
                {locale === "en" ? copy.termsSuffix : ` ${copy.termsSuffix}`}
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">{copy.termsHelp}</p>
            </div>
          </div>

          <p className="border-t border-rule pt-4 text-sm text-ink-2">
            <strong className="font-semibold text-ink">{copy.kvkkTitle}</strong>{" "}
            {copy.kvkkBody}
          </p>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:space-x-0">
          <Button variant="outline" onClick={onDecline} className="w-full sm:w-auto">
            {copy.decline}
          </Button>
          <Button
            onClick={() => bothAccepted && onAccept()}
            disabled={!bothAccepted}
            className="w-full sm:w-auto"
          >
            {copy.accept}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
