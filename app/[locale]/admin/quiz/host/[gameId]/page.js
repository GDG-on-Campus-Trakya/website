"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { checkUserRole } from "@/utils/roleUtils";
import { logger } from "@/utils/logger";
import {
  subscribeToGame,
  subscribeToPlayers,
  subscribeToLeaderboard,
  subscribeToQuestionWinners,
  nextQuestion,
  updateGameStatus,
  updateLeaderboard,
  updateQuestionWinner,
  endGame,
  deleteGame,
  allPlayersAnswered
} from "@/utils/quizUtils";

export default function HostGamePage() {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId;

  const [game, setGame] = useState(null);
  const [players, setPlayers] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionWinners, setQuestionWinners] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showResults, setShowResults] = useState(false);

  const questionStats = useMemo(() => {
    if (!currentQuestion || !players || !game) {
      return { totalAnswers: 0, optionCounts: [], correctCount: 0 };
    }

    const questionIndex = game.currentQuestion;
    const optionsCount = currentQuestion.options?.length || 0;

    const stats = {
      totalAnswers: 0,
      optionCounts: new Array(optionsCount).fill(0),
      correctCount: 0
    };

    Object.values(players).forEach((player) => {
      if (player.answers && player.answers[questionIndex]) {
        const answer = player.answers[questionIndex];
        stats.totalAnswers++;

        // Validate answer index is within bounds
        const answerIndex = answer.answer;
        if (typeof answerIndex === 'number' && answerIndex >= 0 && answerIndex < optionsCount) {
          stats.optionCounts[answerIndex]++;
        }

        if (answer.isCorrect) stats.correctCount++;
      }
    });

    return stats;
  }, [players, game?.currentQuestion, currentQuestion?.id, currentQuestion?.options]);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        router.push("/");
        return;
      }

      const role = await checkUserRole(user.email);
      if (!role) {
        toast.error("Bu sayfaya erişim yetkiniz yok!");
        router.push("/admin");
        return;
      }

      setUserRole(role);
    };

    if (!loading && user) {
      checkAccess();
    }
  }, [user, loading, router]);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const unsubscribeGame = subscribeToGame(gameId, (gameData) => {
      if (!gameData) {
        toast.error("Oyun bulunamadı!");
        router.push("/admin/quiz/manage");
        return;
      }

      setGame(gameData);

      // Update current question
      if (gameData.currentQuestion >= 0 && gameData.questions) {
        setCurrentQuestion(gameData.questions[gameData.currentQuestion]);
      }
    });

    const unsubscribePlayers = subscribeToPlayers(gameId, (playersData) => {
      setPlayers(playersData);
    });

    const unsubscribeLeaderboard = subscribeToLeaderboard(gameId, (leaderboardData) => {
      setLeaderboard(leaderboardData);
    });

    const unsubscribeWinners = subscribeToQuestionWinners(gameId, (winnersData) => {
      setQuestionWinners(winnersData);
    });

    return () => {
      unsubscribeGame();
      unsubscribePlayers();
      unsubscribeLeaderboard();
      unsubscribeWinners();
    };
  }, [gameId, router]);

  // Timer for question
  useEffect(() => {
    if (!game || game.status !== "playing" || !currentQuestion) return;

    const questionStartTime = game.questionStartedAt;
    const timeLimit = currentQuestion.timeLimit;

    // Validate timestamp is not stale (from previous question)
    const isStaleTimestamp = questionStartTime &&
                            !isNaN(questionStartTime) &&
                            ((Date.now() - questionStartTime) / 1000) > timeLimit;

    if (!questionStartTime || isNaN(questionStartTime) || isStaleTimestamp) {
      logger.warn('Invalid questionStartedAt on host timer', {
        questionStartTime,
        currentQuestion: game.currentQuestion,
        isStale: isStaleTimestamp
      });
      // Set to full time and wait for valid timestamp
      setTimeLeft(timeLimit);
      return;
    }

    // Initialize timer with correct remaining time
    const initialElapsed = (Date.now() - questionStartTime) / 1000;
    const initialRemaining = Math.max(0, timeLimit - initialElapsed);
    setTimeLeft(Math.ceil(initialRemaining));

    const interval = setInterval(() => {
      const elapsed = (Date.now() - questionStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);
      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(interval);
        handleShowResults();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [game, currentQuestion]);

  const handleStartGame = async () => {
    try {
      await nextQuestion(gameId, 0);
      setShowResults(false);
      toast.success("Oyun başladı!");
    } catch (error) {
      logger.error("Error starting game:", error);
      toast.error("Oyun başlatılırken hata oluştu!");
    }
  };

  const handleShowResults = async () => {
    try {
      await Promise.all([
        updateGameStatus(gameId, "question_review"),
        game.gameMode === "kahoot"
          ? updateQuestionWinner(gameId, game.currentQuestion)
          : updateLeaderboard(gameId)
      ]);

      setShowResults(true);
    } catch (error) {
      logger.error("Error showing results:", error);
      toast.error("Sonuçlar gösterilirken hata oluştu!");
    }
  };

  const handleNextQuestion = async () => {
    try {
      const nextIndex = game.currentQuestion + 1;

      if (nextIndex >= game.totalQuestions) {
        await handleEndGame();
        return;
      }

      await nextQuestion(gameId, nextIndex);
      setShowResults(false);
      toast.success("Sonraki soru!");
    } catch (error) {
      logger.error("Error moving to next question:", error);
      toast.error("Sonraki soruya geçilirken hata oluştu!");
    }
  };

  const handleEndGame = async () => {
    if (!confirm("Oyunu sonlandırmak istediğinize emin misiniz?")) return;

    try {
      await endGame(gameId);
      toast.success("Oyun sonlandı!");
    } catch (error) {
      logger.error("Error ending game:", error);
      toast.error("Oyun sonlandırılırken hata oluştu!");
    }
  };

  const handleDeleteAndExit = async () => {
    if (!confirm("Oyunu silip çıkmak istediğinize emin misiniz?")) return;

    try {
      await deleteGame(gameId);
      toast.success("Oyun silindi!");
      router.push("/admin/quiz/manage");
    } catch (error) {
      logger.error("Error deleting game:", error);
      toast.error("Oyun silinirken hata oluştu!");
    }
  };

  const playerCount = Object.keys(players).length;
  const connectedPlayerCount = useMemo(
    () => Object.values(players).filter((p) => p.isConnected).length,
    [players]
  );

  if (loading || !game) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Erişim Reddedildi</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-white mb-2">{game.quizTitle}</h1>
              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-base text-gray-300">
                <span className="text-lg sm:text-2xl font-mono">{game.gameCode}</span>
                <span className="hidden sm:inline">•</span>
                <span>👥 {connectedPlayerCount}/{playerCount}</span>
                <span className="hidden sm:inline">•</span>
                <span>
                  📝 {game.currentQuestion + 1}/{game.totalQuestions}
                </span>
              </div>
            </div>
            <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
              {game.status === "finished" ? (
                <button
                  onClick={handleDeleteAndExit}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  Çıkış
                </button>
              ) : (
                <button
                  onClick={handleEndGame}
                  className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm sm:text-base"
                >
                  Bitir
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Waiting State */}
            {game.status === "waiting" && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-12 border border-white/20 text-center">
                <div className="mb-4 sm:mb-6">
                  <div className="text-4xl sm:text-6xl font-bold text-white mb-3 sm:mb-4">{game.gameCode}</div>
                  <p className="text-base sm:text-xl text-gray-300">
                    Oyuncular bu kodu kullanarak katılabilir
                  </p>
                  <p className="text-sm sm:text-base text-gray-400 mt-2">
                    gdgoncampustrakya.com/game
                  </p>
                </div>

                <button
                  onClick={handleStartGame}
                  disabled={playerCount === 0}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg transition-colors font-bold text-base sm:text-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Oyunu Başlat ({playerCount})
                </button>
              </div>
            )}

            {/* Playing State */}
            {game.status === "playing" && currentQuestion && !showResults && (
              <div className="space-y-4 sm:space-y-6">
                {/* Timer */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-sm sm:text-base text-gray-300">Kalan Süre</span>
                    <div className="text-3xl sm:text-5xl font-bold text-white">
                      {timeLeft}s
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 sm:h-4 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        timeLeft > 10 ? "bg-green-500" : timeLeft > 5 ? "bg-yellow-500" : "bg-red-500"
                      }`}
                      style={{
                        width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-white/20">
                  {/* Question Image */}
                  {currentQuestion.imageUrl && (
                    <div className="mb-4 sm:mb-6">
                      <Image
                        src={currentQuestion.imageUrl}
                        alt="Question"
                        width={900}
                        height={600}
                        priority
                        className="w-full max-w-2xl mx-auto h-auto rounded-lg"
                      />
                    </div>
                  )}

                  <h2 className="text-xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">
                    {currentQuestion.question}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {currentQuestion.options.map((option, index) => {
                      const colors = [
                        "from-red-500 to-pink-500",
                        "from-blue-500 to-cyan-500",
                        "from-yellow-500 to-orange-500",
                        "from-green-500 to-emerald-500"
                      ];

                      return (
                        <div
                          key={index}
                          className={`bg-gradient-to-r ${colors[index]} p-4 sm:p-6 rounded-xl text-white font-semibold text-sm sm:text-lg`}
                        >
                          {option}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Answer Stats */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className="text-sm sm:text-base text-white font-semibold">Cevaplayan</span>
                    <span className="text-xl sm:text-2xl font-bold text-white">
                      {questionStats.totalAnswers}/{connectedPlayerCount}
                    </span>
                  </div>
                  <button
                    onClick={handleShowResults}
                    className="w-full py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-semibold text-sm sm:text-base"
                  >
                    Sonuçları Göster
                  </button>
                </div>
              </div>
            )}

            {/* Results State */}
            {(game.status === "question_review" || showResults) && currentQuestion && (
              <div className="space-y-4 sm:space-y-6">
                {/* Question Winner (Kahoot Mode) */}
                {game.gameMode === "kahoot" && questionWinners[game.currentQuestion] && (
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl sm:rounded-2xl p-6 sm:p-8 border-4 border-yellow-300 text-center">
                    <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🏆</div>
                    <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">Kazanan!</h2>
                    <div className="text-xl sm:text-3xl font-bold text-white mb-2">
                      {questionWinners[game.currentQuestion].name}
                    </div>
                    <div className="text-base sm:text-xl text-white/90">
                      ⚡ En hızlı doğru cevap: {questionWinners[game.currentQuestion].timeSpent.toFixed(2)} saniye
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-8 border border-white/20">
                  {/* Question Image */}
                  {currentQuestion.imageUrl && (
                    <div className="mb-4 sm:mb-6">
                      <Image
                        src={currentQuestion.imageUrl}
                        alt="Question"
                        width={900}
                        height={600}
                        className="w-full max-w-2xl mx-auto h-auto rounded-lg opacity-50"
                      />
                    </div>
                  )}

                  <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6">
                    {currentQuestion.question}
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {currentQuestion.options.map((option, index) => {
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const answerCount = questionStats.optionCounts?.[index] || 0;
                      const percentage = questionStats.totalAnswers > 0
                        ? Math.round((answerCount / questionStats.totalAnswers) * 100)
                        : 0;

                      return (
                        <div
                          key={index}
                          className={`p-4 sm:p-6 rounded-xl border-4 ${
                            isCorrect
                              ? "bg-green-500/30 border-green-500"
                              : "bg-gray-700/30 border-gray-600"
                          }`}
                        >
                          <div className="text-white font-semibold text-sm sm:text-lg mb-1 sm:mb-2">
                            {option}
                          </div>
                          <div className="text-xs sm:text-base text-gray-300">
                            {answerCount} cevap ({percentage}%)
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 sm:mt-6 text-center text-white">
                    <div className="text-sm sm:text-lg">
                      ✅ Doğru: {questionStats.correctCount} / {questionStats.totalAnswers}
                    </div>
                  </div>
                </div>

                {/* Next Button */}
                <button
                  onClick={handleNextQuestion}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-bold text-base sm:text-xl"
                >
                  {game.currentQuestion + 1 >= game.totalQuestions
                    ? "Oyunu Bitir"
                    : "Sonraki Soru →"}
                </button>
              </div>
            )}

            {/* Finished State */}
            {game.status === "finished" && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-6 sm:p-12 border border-white/20 text-center">
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🎉</div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">Oyun Bitti!</h2>
                <p className="text-base sm:text-xl text-gray-300 mb-6 sm:mb-8">
                  {game.gameMode === "kahoot"
                    ? "Her soru için kazananlar gösterildi!"
                    : "Kazananları görmek için yan paneli kontrol edin"}
                </p>
                <button
                  onClick={handleDeleteAndExit}
                  className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-colors font-bold text-base sm:text-xl"
                >
                  Quiz Yönetimine Dön
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Leaderboard (Classic Mode Only) */}
            {game.gameMode !== "kahoot" && (
              <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">🏆 Sıralama</h3>
                {leaderboard.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.slice(0, 10).map((player, index) => (
                      <div
                        key={player.userId}
                        className={`p-2 sm:p-3 rounded-lg ${
                          index === 0
                            ? "bg-yellow-500/20 border border-yellow-500"
                            : index === 1
                            ? "bg-gray-400/20 border border-gray-400"
                            : index === 2
                            ? "bg-orange-500/20 border border-orange-500"
                            : "bg-white/5"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-lg sm:text-2xl font-bold text-white">
                              {index + 1}
                            </span>
                            <div>
                              <div className="text-sm sm:text-base text-white font-semibold truncate max-w-[120px] sm:max-w-none">
                                {player.name}
                              </div>
                              <div className="text-xs text-gray-400">
                                ✅ {player.correctAnswers} doğru
                              </div>
                            </div>
                          </div>
                          <div className="text-lg sm:text-xl font-bold text-white">
                            {player.score}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm sm:text-base text-gray-400 text-center">Henüz sıralama yok</p>
                )}
              </div>
            )}

            {/* Players */}
            <div className="bg-white/10 backdrop-blur-lg rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/20">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">
                👥 Oyuncular ({connectedPlayerCount})
              </h3>
              <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
                {Object.values(players).map((player) => (
                  <div
                    key={player.userId}
                    className="flex items-center justify-between p-2 bg-white/5 rounded-lg"
                  >
                    <span className="text-xs sm:text-sm text-white truncate max-w-[150px] sm:max-w-none">{player.name}</span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        player.isConnected ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
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
