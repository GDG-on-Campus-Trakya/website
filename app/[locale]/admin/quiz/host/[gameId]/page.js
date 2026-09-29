"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Check, ClipboardList, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      <p className="py-10 text-lg">Yükleniyor...</p>
    );
  }

  if (!userRole) {
    return (
      <p className="py-10 text-lg font-semibold">Erişim Reddedildi</p>
    );
  }

  // Answer tile hues keep their order: red, blue, yellow, green. Letters carry the shape cue.
  const optionColors = ["bg-mark-red", "bg-mark-blue", "bg-mark-yellow", "bg-mark-green"];
  const optionLetters = ["A", "B", "C", "D"];
  const letterChipClass =
    "flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 border-ink font-display text-lg font-extrabold text-ink md:h-12 md:w-12 md:text-2xl";

  return (
    <div className="min-h-[calc(100dvh-7rem)] rounded-lg bg-stage p-3 text-stage-ink sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-4 border-b border-stage-rule pb-4 sm:mb-6 sm:pb-6">
          <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end sm:gap-4">
            <div className="min-w-0">
              <h1 className="mb-2 break-words font-display text-2xl font-extrabold sm:text-4xl">{game.quizTitle}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-stage-muted sm:text-base">
                <span className="font-outlier text-lg font-bold tabular-nums text-stage-ink sm:text-2xl">{game.gameCode}</span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="font-outlier tabular-nums">{connectedPlayerCount}/{playerCount}</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ClipboardList className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="font-outlier tabular-nums">
                    {game.currentQuestion + 1}/{game.totalQuestions}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:gap-3">
              {game.status === "finished" ? (
                <Button
                  variant="destructive"
                  onClick={handleDeleteAndExit}
                  className="flex-1 sm:flex-none"
                >
                  Çıkış
                </Button>
              ) : (
                <Button
                  variant="destructive"
                  onClick={handleEndGame}
                  className="flex-1 sm:flex-none"
                >
                  Bitir
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Main Content */}
          <div className="min-w-0 space-y-4 sm:space-y-6">
            {/* Waiting State */}
            {game.status === "waiting" && (
              <div className="border-b border-stage-rule pb-8 sm:pb-12">
                <div className="mb-6 sm:mb-8">
                  <div className="mb-3 break-all font-outlier text-6xl font-bold tabular-nums sm:mb-4 sm:text-8xl">{game.gameCode}</div>
                  <p className="text-base text-stage-muted sm:text-xl">
                    Oyuncular bu kodu kullanarak katılabilir
                  </p>
                  <p className="mt-2 text-sm text-stage-muted sm:text-base">
                    gdgoncampustrakya.com/game
                  </p>
                </div>

                <Button
                  size="lg"
                  onClick={handleStartGame}
                  disabled={playerCount === 0}
                >
                  Oyunu Başlat ({playerCount})
                </Button>
              </div>
            )}

            {/* Playing State */}
            {game.status === "playing" && currentQuestion && !showResults && (
              <div className="space-y-4 sm:space-y-6">
                {/* Timer */}
                <div>
                  <div className="mb-3 flex items-baseline justify-between sm:mb-4">
                    <span className="text-sm text-stage-muted sm:text-base">Kalan Süre</span>
                    <div className="font-outlier text-6xl font-bold tabular-nums md:text-7xl">
                      {timeLeft}s
                    </div>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-sm bg-stage-2 sm:h-4">
                    <div
                      className={`h-full transition-[width] duration-1000 ease-linear ${
                        timeLeft > 10 ? "bg-success" : timeLeft > 5 ? "bg-warning" : "bg-error"
                      }`}
                      style={{
                        width: `${(timeLeft / currentQuestion.timeLimit) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Question */}
                <div className="border-t-2 border-stage-ink pt-4 sm:pt-6">
                  {/* Question Image */}
                  {currentQuestion.imageUrl && (
                    <div className="mb-4 sm:mb-6">
                      <Image
                        src={currentQuestion.imageUrl}
                        alt="Question"
                        width={900}
                        height={600}
                        priority
                        className="mx-auto h-auto w-full max-w-2xl rounded"
                      />
                    </div>
                  )}

                  <h2 className="mb-4 text-balance break-words font-display text-3xl font-bold sm:mb-6 md:text-5xl">
                    {currentQuestion.question}
                  </h2>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {currentQuestion.options.map((option, index) => (
                      <div
                        key={index}
                        className={`${optionColors[index]} flex min-h-20 items-center gap-3 rounded-lg p-4 text-lg font-bold text-ink sm:gap-4 sm:p-6 md:text-3xl`}
                      >
                        <span className={letterChipClass} aria-hidden="true">
                          {optionLetters[index]}
                        </span>
                        <span className="min-w-0 break-words">{option}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Answer Stats */}
                <div className="flex flex-col gap-4 border-t border-stage-rule pt-4 sm:flex-row sm:items-center sm:justify-between sm:pt-6">
                  <div className="flex items-baseline gap-4">
                    <span className="text-sm font-semibold sm:text-base">Cevaplayan</span>
                    <span className="font-outlier text-3xl font-bold tabular-nums">
                      {questionStats.totalAnswers}/{connectedPlayerCount}
                    </span>
                  </div>
                  <Button onClick={handleShowResults} size="lg">
                    Sonuçları Göster
                  </Button>
                </div>
              </div>
            )}

            {/* Results State */}
            {(game.status === "question_review" || showResults) && currentQuestion && (
              <div className="space-y-4 sm:space-y-6">
                {/* Question Winner (Kahoot Mode) */}
                {game.gameMode === "kahoot" && questionWinners[game.currentQuestion] && (
                  <div className="rounded-lg bg-warning p-6 text-ink sm:p-8">
                    <Trophy className="mb-3 h-10 w-10 sm:mb-4 sm:h-14 sm:w-14" aria-hidden="true" />
                    <h2 className="mb-2 font-display text-3xl font-bold sm:text-5xl">Kazanan!</h2>
                    <div className="mb-2 break-words font-display text-xl font-bold sm:text-3xl">
                      {questionWinners[game.currentQuestion].name}
                    </div>
                    <div className="text-base sm:text-xl">
                      En hızlı doğru cevap: <span className="font-outlier tabular-nums">{questionWinners[game.currentQuestion].timeSpent.toFixed(2)}</span> saniye
                    </div>
                  </div>
                )}

                {/* Correct Answer */}
                <div>
                  {/* Question Image */}
                  {currentQuestion.imageUrl && (
                    <div className="mb-4 sm:mb-6">
                      <Image
                        src={currentQuestion.imageUrl}
                        alt="Question"
                        width={900}
                        height={600}
                        className="mx-auto h-auto w-full max-w-2xl rounded opacity-50"
                      />
                    </div>
                  )}

                  <h2 className="mb-4 text-balance break-words font-display text-2xl font-bold sm:mb-6 md:text-4xl">
                    {currentQuestion.question}
                  </h2>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                    {currentQuestion.options.map((option, index) => {
                      const isCorrect = index === currentQuestion.correctAnswer;
                      const answerCount = questionStats.optionCounts?.[index] || 0;
                      const percentage = questionStats.totalAnswers > 0
                        ? Math.round((answerCount / questionStats.totalAnswers) * 100)
                        : 0;

                      return (
                        <div
                          key={index}
                          className={`flex items-start gap-3 rounded-lg border-2 bg-stage-2 p-4 sm:gap-4 sm:p-6 ${
                            isCorrect ? "border-success" : "border-stage-rule"
                          }`}
                        >
                          <span className={`${letterChipClass} ${optionColors[index]}`} aria-hidden="true">
                            {optionLetters[index]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 break-words text-base font-semibold sm:mb-2 sm:text-xl">
                              {option}
                            </div>
                            <div className="text-xs text-stage-muted sm:text-base">
                              <span className="font-outlier tabular-nums">{answerCount}</span> cevap (<span className="font-outlier tabular-nums">{percentage}</span>%)
                            </div>
                          </div>
                          {isCorrect && (
                            <span className="inline-flex shrink-0 items-center gap-1 text-success">
                              <Check className="h-6 w-6" aria-hidden="true" />
                              <span className="sr-only">Doğru</span>
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-4 text-sm sm:mt-6 sm:text-lg">
                    <Check className="mr-1.5 inline h-4 w-4 align-[-2px] text-success sm:h-5 sm:w-5" aria-hidden="true" />
                    Doğru: <span className="font-outlier tabular-nums">{questionStats.correctCount} / {questionStats.totalAnswers}</span>
                  </div>
                </div>

                {/* Next Button */}
                <Button
                  onClick={handleNextQuestion}
                  size="lg"
                  className="w-full"
                >
                  {game.currentQuestion + 1 >= game.totalQuestions
                    ? "Oyunu Bitir"
                    : "Sonraki Soru →"}
                </Button>
              </div>
            )}

            {/* Finished State */}
            {game.status === "finished" && (
              <div className="border-y border-stage-rule py-8 sm:py-12">
                <h2 className="mb-3 font-display text-3xl font-bold sm:mb-4 sm:text-5xl">Oyun Bitti!</h2>
                <p className="mb-6 text-base text-stage-muted sm:mb-8 sm:text-xl">
                  {game.gameMode === "kahoot"
                    ? "Her soru için kazananlar gösterildi!"
                    : "Kazananları görmek için yan paneli kontrol edin"}
                </p>
                <Button
                  size="lg"
                  onClick={handleDeleteAndExit}
                >
                  Quiz Yönetimine Dön
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-6 sm:space-y-8">
            {/* Leaderboard (Classic Mode Only) */}
            {game.gameMode !== "kahoot" && (
              <div className="border-t-2 border-stage-ink pt-3">
                <h3 className="mb-3 font-display text-xl font-bold sm:mb-4 sm:text-2xl">Sıralama</h3>
                {leaderboard.length > 0 ? (
                  <ol>
                    {leaderboard.slice(0, 10).map((player, index) => (
                      <li
                        key={player.userId}
                        className={`flex items-center justify-between gap-3 border-b border-stage-rule px-2 py-2 sm:py-3 ${
                          index === 0 ? "bg-warning text-ink" : ""
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                          {index === 0 && <Trophy className="h-5 w-5 shrink-0" aria-hidden="true" />}
                          <span className="w-6 shrink-0 font-outlier text-lg font-bold tabular-nums sm:text-2xl">
                            {index + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold sm:text-base">
                              {player.name}
                            </div>
                            <div className={`text-xs ${index === 0 ? "text-ink-2" : "text-stage-muted"}`}>
                              <span className="font-outlier tabular-nums">{player.correctAnswers}</span> doğru
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 font-outlier text-lg font-bold tabular-nums sm:text-xl">
                          {player.score}
                        </div>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-stage-muted sm:text-base">Henüz sıralama yok</p>
                )}
              </div>
            )}

            {/* Players */}
            <div className="border-t-2 border-stage-ink pt-3">
              <h3 className="mb-3 font-display text-lg font-bold sm:mb-4 sm:text-xl">
                Oyuncular (<span className="font-outlier tabular-nums">{connectedPlayerCount}</span>)
              </h3>
              <ul className="max-h-48 overflow-y-auto sm:max-h-64">
                {Object.values(players).map((player) => (
                  <li
                    key={player.userId}
                    className="flex items-center justify-between gap-3 border-b border-stage-rule px-2 py-2"
                  >
                    <span className="min-w-0 truncate text-xs sm:text-sm">{player.name}</span>
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        player.isConnected ? "bg-success" : "bg-error"
                      }`}
                    />
                  </li>
                ))}
              </ul>
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
        theme="light"
      />
    </div>
  );
}
