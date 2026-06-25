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
import { useLocale } from "next-intl";
import { adminCopy } from "@/utils/adminCopy";

const COPY = {
  tr: {
    fetchError: "Quiz'ler yüklenirken hata oluştu!",
    gameStarted: "Oyun başlatıldı!",
    gameStartError: "Oyun başlatılırken hata oluştu!",
    quizActivated: "Quiz aktif edildi!",
    quizDeactivated: "Quiz pasif edildi!",
    statusChangeError: "Durum değiştirilirken hata oluştu!",
    confirmDeleteQuiz: "Bu quiz'i silmek istediğinize emin misiniz?",
    quizDeleted: "Quiz silindi!",
    deleteError: "Quiz silinirken hata oluştu!",
    title: "Quiz Yönetimi",
    subtitle: "canlı quiz'lerinizi yönetin ve oyun başlatın",
    gameHistory: "📊 Oyun Geçmişi",
    newQuiz: "+ Yeni Quiz",
    totalQuiz: "Toplam Quiz",
    activeQuiz: "Aktif Quiz",
    totalPlays: "Toplam Oynama",
    noQuizzes: "Henüz quiz oluşturulmamış",
    createFirstQuiz: "İlk Quiz'i Oluştur",
    kahoot: "🏆 Kahoot",
    classic: "📊 Klasik",
    questions: (n) => `📝 ${n} Soru`,
    timesPlayed: (n) => `🎮 ${n} Kez`,
    startGame: "🎮 Oyun Başlat",
    editLabel: "✏️ Düzenle",
    deactivate: "⏸ Pasifleştir",
    activate: "▶ Aktifleştir",
    deleteLabel: "🗑 Sil",
    dateLocale: "tr-TR",
  },
  en: {
    fetchError: "An error occurred while loading quizzes!",
    gameStarted: "Game started!",
    gameStartError: "An error occurred while starting the game!",
    quizActivated: "Quiz activated!",
    quizDeactivated: "Quiz deactivated!",
    statusChangeError: "An error occurred while changing the status!",
    confirmDeleteQuiz: "Are you sure you want to delete this quiz?",
    quizDeleted: "Quiz deleted!",
    deleteError: "An error occurred while deleting the quiz!",
    title: "Quiz Management",
    subtitle: "manage your live quizzes and start games",
    gameHistory: "📊 Game History",
    newQuiz: "+ New Quiz",
    totalQuiz: "Total Quizzes",
    activeQuiz: "Active Quizzes",
    totalPlays: "Total Plays",
    noQuizzes: "No quizzes created yet",
    createFirstQuiz: "Create First Quiz",
    kahoot: "🏆 Kahoot",
    classic: "📊 Classic",
    questions: (n) => `📝 ${n} Questions`,
    timesPlayed: (n) => `🎮 ${n} times`,
    startGame: "🎮 Start Game",
    editLabel: "✏️ Edit",
    deactivate: "⏸ Deactivate",
    activate: "▶ Activate",
    deleteLabel: "🗑 Delete",
    dateLocale: "en-US",
  },
};

export default function ManageQuizzesPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const a = adminCopy(locale);
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
        toast.error(a.accessDeniedToast);
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
      toast.error(copy.fetchError);
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

      toast.success(copy.gameStarted);
      router.push(`/admin/quiz/host/${gameId}`);
    } catch (error) {
      logger.error("Error starting game:", error);
      toast.error(copy.gameStartError);
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
        !currentStatus ? copy.quizActivated : copy.quizDeactivated
      );
    } catch (error) {
      logger.error("Error toggling quiz status:", error);
      toast.error(copy.statusChangeError);
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm(copy.confirmDeleteQuiz)) return;

    try {
      await deleteDoc(doc(db, "quizzes", quizId));
      setQuizzes(quizzes.filter((q) => q.id !== quizId));
      toast.success(copy.quizDeleted);
    } catch (error) {
      logger.error("Error deleting quiz:", error);
      toast.error(copy.deleteError);
    }
  };

  if (loading || loadingQuizzes) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">{a.loading}</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">{a.accessDenied}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">{copy.title}</h1>
            <p className="text-sm sm:text-base text-gray-300">{copy.subtitle}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <Link
              href="/admin/quiz/history"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-semibold text-center text-sm sm:text-base"
            >
              {copy.gameHistory}
            </Link>
            <Link
              href="/admin/quiz/create"
              className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-semibold text-center text-sm sm:text-base"
            >
              {copy.newQuiz}
            </Link>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">{copy.totalQuiz}</div>
            <div className="text-2xl sm:text-3xl font-bold text-white">{quizzes.length}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">{copy.activeQuiz}</div>
            <div className="text-2xl sm:text-3xl font-bold text-green-400">
              {quizzes.filter((q) => q.isActive).length}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
            <div className="text-gray-400 text-xs sm:text-sm mb-1">{copy.totalPlays}</div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-400">
              {quizzes.reduce((sum, q) => sum + (q.playCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Quizzes List */}
        {quizzes.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-8 sm:p-12 border border-white/20 text-center">
            <p className="text-gray-400 text-base sm:text-lg mb-4">{copy.noQuizzes}</p>
            <Link
              href="/admin/quiz/create"
              className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm sm:text-base"
            >
              {copy.createFirstQuiz}
            </Link>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 hover:bg-white/15 transition-colors"
              >
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg sm:text-xl font-bold text-white">{quiz.title}</h3>
                      <span
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                          quiz.isActive
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                        }`}
                      >
                        {quiz.isActive ? a.active : a.passive}
                      </span>
                      <span className="px-2 sm:px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                        {quiz.category}
                      </span>
                      <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${
                        quiz.gameMode === "kahoot"
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-blue-500/20 text-blue-400"
                      }`}>
                        {quiz.gameMode === "kahoot" ? copy.kahoot : copy.classic}
                      </span>
                    </div>

                    {quiz.description && (
                      <p className="text-gray-400 text-xs sm:text-sm mb-3">{quiz.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-400">
                      <span>{copy.questions(quiz.questionCount)}</span>
                      <span>{copy.timesPlayed(quiz.playCount || 0)}</span>
                      <span className="hidden sm:inline">👤 {quiz.createdByName || quiz.createdBy}</span>
                      {quiz.lastPlayedAt && (
                        <span className="hidden sm:inline">
                          🕐 {new Date(quiz.lastPlayedAt.seconds * 1000).toLocaleDateString(copy.dateLocale)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      onClick={() => handleStartGame(quiz)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-semibold text-sm"
                      disabled={!quiz.isActive}
                    >
                      {copy.startGame}
                    </button>

                    <Link
                      href={`/admin/quiz/edit/${quiz.id}`}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm text-center"
                    >
                      {copy.editLabel}
                    </Link>

                    <button
                      onClick={() => handleToggleActive(quiz.id, quiz.isActive)}
                      className={`w-full sm:w-auto px-3 sm:px-4 py-2 rounded-lg transition-colors text-sm ${
                        quiz.isActive
                          ? "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400"
                          : "bg-green-500/20 hover:bg-green-500/30 text-green-400"
                      }`}
                    >
                      {quiz.isActive ? copy.deactivate : copy.activate}
                    </button>

                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors text-sm"
                    >
                      {copy.deleteLabel}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Back to Admin */}
        <div className="mt-6 sm:mt-8">
          <Link
            href="/admin"
            className="inline-block px-4 sm:px-6 py-2 sm:py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm sm:text-base"
          >
            ← {a.backToAdmin}
          </Link>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        theme="dark"
      />
    </div>
  );
}
