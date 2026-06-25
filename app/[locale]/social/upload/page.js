"use client";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import PostUpload from "@/components/PostUpload";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";

const COPY = {
  tr: {
    loading: "Yükleniyor...",
    loginRequired: "Giriş yapmanız gerekiyor...",
  },
  en: {
    loading: "Loading...",
    loginRequired: "You need to sign in...",
  },
};

export default function UploadPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/");
    }
  }, [user, loading, router]);

  const handleUploadComplete = () => {
    router.push("/social");
  };

  const handleCancel = () => {
    router.push("/social");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">{copy.loading}</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg">{copy.loginRequired}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen font-sans bg-gradient-to-b from-[#1a1a2e] to-[#000000] text-white py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <PostUpload 
          onUploadComplete={handleUploadComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}