"use client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import PostUpload from "@/components/PostUpload";
import { useRouter } from "@/i18n/navigation";
import { useEffect } from "react";
import { PageContainer } from "@/components/ui/page";

export default function UploadPage() {
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
      <PageContainer>
        <p role="status" className="text-ink-2">Yükleniyor...</p>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <p role="status" className="text-ink-2">Giriş yapmanız gerekiyor...</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="max-w-2xl">
        <PostUpload
          onUploadComplete={handleUploadComplete}
          onCancel={handleCancel}
        />
      </div>
    </PageContainer>
  );
}