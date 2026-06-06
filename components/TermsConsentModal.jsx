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
    title: "Hoş Geldiniz! 👋",
    description:
      "GDG on Campus Trakya platformuna hoş geldiniz. Devam etmeden önce lütfen aşağıdaki şartları okuyup kabul edin.",
    privacyPrefix: "Gizlilik Politikasını",
    privacySuffix: "okudum ve kabul ediyorum.",
    privacyHelp:
      "Kişisel verilerinizin nasıl toplandığını, kullanıldığını ve korunduğunu öğrenin.",
    termsPrefix: "Kullanım Şartlarını",
    termsSuffix: "okudum ve kabul ediyorum.",
    termsHelp:
      "Platform kullanımı, hesap sorumluluklarınız ve topluluk kurallarını inceleyin.",
    kvkkTitle: "KVKK Bilgilendirmesi:",
    kvkkBody:
      "Bu platform KVKK uyarınca kişisel verilerinizi açık rızanızla işlemektedir. Verileriniz yalnızca etkinlik organizasyonu, istatistiksel analiz ve destek hizmetleri için kullanılacaktır.",
    decline: "Reddet ve Çıkış Yap",
    accept: "Kabul Et ve Devam Et",
  },
  en: {
    title: "Welcome! 👋",
    description:
      "Welcome to the GDG on Campus Trakya platform. Before continuing, please read and accept the terms below.",
    privacyPrefix: "I have read and accept the",
    privacySuffix: "Privacy Policy.",
    privacyHelp:
      "Learn how your personal data is collected, used, and protected.",
    termsPrefix: "I have read and accept the",
    termsSuffix: "Terms of Use.",
    termsHelp:
      "Review platform usage rules, your account responsibilities, and the community guidelines.",
    kvkkTitle: "Privacy Notice:",
    kvkkBody:
      "This platform processes your personal data for community operations, statistical analysis, and support services in line with applicable privacy obligations.",
    decline: "Decline and Sign Out",
    accept: "Accept and Continue",
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

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent
        className="max-h-[90vh] max-w-2xl overflow-y-auto border-gray-700 bg-gray-800 text-white"
        onInteractOutside={(event) => event.preventDefault()}
        onEscapeKeyDown={(event) => event.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-blue-400">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="mt-4 text-base text-gray-300">
            {copy.description}
          </DialogDescription>
        </DialogHeader>

        <div className="my-6 space-y-6">
          <div className="flex items-start space-x-3 rounded-lg border border-gray-600/50 bg-gray-700/30 p-4">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={setPrivacyAccepted}
              className="mt-1 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            />
            <div className="flex-1">
              <Label
                htmlFor="privacy"
                className="cursor-pointer text-sm font-medium text-white"
              >
                {locale === "en" ? `${copy.privacyPrefix} ` : ""}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  {locale === "en" ? "Privacy Policy" : copy.privacyPrefix}
                </Link>{" "}
                {locale === "en" ? "" : copy.privacySuffix}
                {locale === "en" ? copy.privacySuffix : ""}
              </Label>
              <p className="mt-1 text-xs text-gray-400">{copy.privacyHelp}</p>
            </div>
          </div>

          <div className="flex items-start space-x-3 rounded-lg border border-gray-600/50 bg-gray-700/30 p-4">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={setTermsAccepted}
              className="mt-1 data-[state=checked]:border-blue-600 data-[state=checked]:bg-blue-600"
            />
            <div className="flex-1">
              <Label
                htmlFor="terms"
                className="cursor-pointer text-sm font-medium text-white"
              >
                {locale === "en" ? `${copy.termsPrefix} ` : ""}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-blue-400 underline hover:text-blue-300"
                >
                  {locale === "en" ? "Terms of Use" : copy.termsPrefix}
                </Link>{" "}
                {locale === "en" ? "" : copy.termsSuffix}
                {locale === "en" ? copy.termsSuffix : ""}
              </Label>
              <p className="mt-1 text-xs text-gray-400">{copy.termsHelp}</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-500/30 bg-blue-900/20 p-4">
            <p className="text-sm leading-relaxed text-gray-300">
              <strong className="text-blue-400">{copy.kvkkTitle}</strong>{" "}
              {copy.kvkkBody}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            onClick={onDecline}
            className="w-full border-gray-600 bg-gray-700 text-white hover:bg-gray-600 sm:w-auto"
          >
            {copy.decline}
          </Button>
          <Button
            onClick={() => bothAccepted && onAccept()}
            disabled={!bothAccepted}
            className={`w-full sm:w-auto ${
              bothAccepted
                ? "bg-blue-600 hover:bg-blue-700"
                : "cursor-not-allowed bg-gray-600"
            }`}
          >
            {copy.accept}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
