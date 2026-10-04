"use client";
import { useEffect } from "react";
import { useLocale } from "next-intl";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAccount } from "@/app/AuthProvider";
import PostUpload from "@/components/PostUpload";
import { useRouter } from "@/i18n/navigation";
import { loginHref } from "@/utils/redirect";
import { PageContainer, PageHeader } from "@/components/ui/page";

const COPY = {
  tr: {
    loading: "Yükleniyor...",
    loginRequired: "Giriş yapmanız gerekiyor...",
    title: "Fotoğraf paylaş",
    description: "Paylaştığın fotoğraf herkese açık sosyal sayfada görünür.",
  },
  en: {
    loading: "Loading...",
    loginRequired: "You need to sign in...",
    title: "Share a photo",
    description: "The photo you share appears on the public social page.",
  },
};

export default function UploadPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { user, loading } = useAccount();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace(loginHref("/social/upload"));
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <PageContainer>
        <p role="status" className="text-ink-2">
          {loading ? copy.loading : copy.loginRequired}
        </p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title={copy.title} description={copy.description} />
      <div className="max-w-lg">
        <PostUpload
          onUploadComplete={() => router.push("/social")}
          onCancel={() => router.push("/social")}
        />
      </div>
      <ToastContainer position="top-right" autoClose={4000} newestOnTop closeOnClick pauseOnHover theme="light" />
    </PageContainer>
  );
}
