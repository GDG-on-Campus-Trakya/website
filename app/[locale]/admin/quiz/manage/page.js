"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { logger } from "@/utils/logger";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { checkUserRole, ROLES } from "@/utils/roleUtils";
import { createGame } from "@/utils/quizUtils";
import { Link } from "@/i18n/navigation";
import { ArrowLeft, Clock, Pause, Pencil, Play, Trash2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Stat } from "@/components/ui/stat";
import { PageHeader, EmptyState } from "@/components/ui/page";

export default function ManageQuizzesPage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      const role = await checkUserRole(user.email);
      if (role !== ROLES.ADMIN) {
        toast.error("Bu sayfaya erişim yetkiniz yok!");
        router.push("/admin");
        return;
      }

      setUserRole(role);
      fetchQuizzes();
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const quizzesRef = collection(db, "quizzes");
      const q = query(quizzesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);

      const quizzesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));

      setQuizzes(quizzesData);
    } catch (error) {
      logger.error("Error fetching quizzes:", error);
      toast.error("Quiz'ler yüklenirken hata oluştu!");
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleStartGame = async (quiz) => {
    try {
      const gameData = {
        quizId: quiz.id,
        quizTitle: quiz.title,
        hostId: user.email,
        hostName: user.displayName || user.email,
        totalQuestions: quiz.questionCount,
        questions: quiz.questions,
        gameMode: quiz.gameMode || "classic" // Include game mode from quiz
      };

      const gameId = await createGame(gameData);

      // Update quiz play count
      const quizRef = doc(db, "quizzes", quiz.id);
      await updateDoc(quizRef, {
        playCount: (quiz.playCount || 0) + 1,
        lastPlayedAt: new Date()
      });

      toast.success("Oyun başlatıldı!");
      router.push(`/admin/quiz/host/${gameId}`);
    } catch (error) {
      logger.error("Error starting game:", error);
      toast.error("Oyun başlatılırken hata oluştu!");
    }
  };

  const handleToggleActive = async (quizId, currentStatus) => {
    try {
      const quizRef = doc(db, "quizzes", quizId);
      await updateDoc(quizRef, {
        isActive: !currentStatus
      });

      setQuizzes(
        quizzes.map((q) =>
          q.id === quizId ? { ...q, isActive: !currentStatus } : q
        )
      );

      toast.success(
        !currentStatus ? "Quiz aktif edildi!" : "Quiz pasif edildi!"
      );
    } catch (error) {
      logger.error("Error toggling quiz status:", error);
      toast.error("Durum değiştirilirken hata oluştu!");
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm("Bu quiz'i silmek istediğinize emin misiniz?")) return;

    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      toast.success("Quiz silindi!");
    } catch (error) {
      logger.error("Error deleting quiz:", error);
      toast.error("Quiz silinirken hata oluştu!");
    }
  };

  if (loading || loadingQuizzes) {
    return <p className="py-12 text-ink-2">Yükleniyor...</p>;
  }

  if (!userRole) {
    return (
      <p role="alert" className="py-12 font-medium text-error">
        Erişim Reddedildi
      </p>
    );
  }

  return (
    <div>
      <PageHeader
        title="Quiz Yönetimi"
        description="canlı quiz'lerinizi yönetin ve oyun başlatın"
        actions={
          <>
            <Button asChild variant="outline">
              <Link href="/admin/quiz/history">Oyun Geçmişi</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/quiz/create">+ Yeni Quiz</Link>
            </Button>
          </>
        }
      />

      {/* Statistics */}
      <dl className="grid grid-cols-3 gap-4 sm:gap-8">
        <Stat label="Toplam Quiz" value={quizzes.length} />
        <Stat label="Aktif Quiz" value={quizzes.filter((q) => q.isActive).length} />
        <Stat
          label="Toplam Oynama"
          value={quizzes.reduce((sum, q) => sum + (q.playCount || 0), 0)}
        />
      </dl>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <EmptyState
          className="mt-10"
          title="Henüz quiz oluşturulmamış"
          action={
            <Button asChild>
              <Link href="/admin/quiz/create">İlk Quiz'i Oluştur</Link>
            </Button>
          }
        />
      ) : (
        <ul className="mt-10 border-t-2 border-ink">
          {quizzes.map((quiz) => (
            <li key={quiz.id} className="border-b border-rule py-5">
              <div className="flex flex-col gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="mr-1 min-w-0 break-words font-display text-lg font-bold">
                      {quiz.title}
                    </h2>
                    <Badge variant={quiz.isActive ? "success" : "neutral"}>
                      {quiz.isActive ? "Aktif" : "Pasif"}
                    </Badge>
                    <Badge>{quiz.category}</Badge>
                    <Badge>{quiz.gameMode === "kahoot" ? "Kahoot" : "Klasik"}</Badge>
                  </div>

                  {quiz.description && (
                    <p className="mt-2 max-w-measure text-sm text-muted-foreground">
                      {quiz.description}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span>
                      <span className="font-outlier tabular-nums">{quiz.questionCount}</span> Soru
                    </span>
                    <span>
                      <span className="font-outlier tabular-nums">{quiz.playCount || 0}</span> Kez
                    </span>
                    <span className="hidden items-center gap-1.5 sm:inline-flex">
                      <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      {quiz.createdByName || quiz.createdBy}
                    </span>
                    {quiz.lastPlayedAt && (
                      <span className="hidden items-center gap-1.5 sm:inline-flex">
                        <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="font-outlier tabular-nums">
                          {new Date(quiz.lastPlayedAt.seconds * 1000).toLocaleDateString("tr-TR")}
                        </span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => handleStartGame(quiz)} disabled={!quiz.isActive}>
                    <Play aria-hidden="true" />
                    Oyun Başlat
                  </Button>

                  <Button asChild variant="outline">
                    <Link href={`/admin/quiz/edit/${quiz.id}`}>
                      <Pencil aria-hidden="true" />
                      Düzenle
                    </Link>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleToggleActive(quiz.id, quiz.isActive)}
                  >
                    {quiz.isActive ? (
                      <Pause aria-hidden="true" />
                    ) : (
                      <Play aria-hidden="true" />
                    )}
                    {quiz.isActive ? "Pasifleştir" : "Aktifleştir"}
                  </Button>

                  <Button variant="destructive" onClick={() => handleDeleteQuiz(quiz.id)}>
                    <Trash2 aria-hidden="true" />
                    Sil
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Back to Admin */}
      <div className="mt-10">
        <Button asChild variant="link">
          <Link href="/admin">
            <ArrowLeft aria-hidden="true" />
            Admin Paneline Dön
          </Link>
        </Button>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="light"
      />
    </div>
  );
}
