"use client";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
import { Check, Info, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";
import {
  subscribeToGame,
  subscribeToLeaderboard,
  subscribeToQuestionWinners,
  updatePlayerConnection
} from "@/utils/quizUtils";

const COPY = {
  tr: {
    gameNotFound: "Oyun bulunamadı!",
    correctToast: (pts) => `Doğru! +${pts} puan`,
    wrongToast: "Yanlış cevap!",
    submitError: "Cevap gönderilirken hata oluştu!",
    loading: "Yükleniyor...",
    loginRequired: "Giriş yapmalısınız!",
    resultCorrect: "Doğru Cevap!",
    resultWrong: "Yanlış Cevap",
    resultReceived: "Cevabınız alındı",
    pointsShort: "puan",
    pointsShortMobile: "p",
    waitingTitle: "Oyun Başlamayı Bekliyor...",
    waitingSubtitle: "Host oyunu başlattığında sorular görünecek",
    syncing: "Sunucu ile senkronize ediliyor...",
    timeLeft: "Kalan Süre",
    questionAlt: "Soru",
    answerReceivedTitle: "Cevabınız Alındı!",
    answerReceivedSubtitle: "Sonuçları görmek için diğer oyuncuları bekleyin",
    youWon: "Kazandınız!",
    winner: "Kazanan",
    fastestLabel: "En hızlı doğru cevap:",
    secondsUnit: "saniye",
    correctAnswerIs: (ans) => `Doğru cevap: ${ans}`,
    correctAnswerHidden: "Doğru cevap oyun sırasında gizli tutuluyor.",
    top5: "İlk 5",
    waitNextQuestion: "Sonraki soruyu bekleyin...",
    gameOver: "Oyun Bitti!",
    pointsLabel: "Puan",
    yourRank: (rank) => `Sıralamanız: #${rank}`,
    kahootThanks: "Teşekkürler! Her soru için kazananlar gösterildi.",
    finalRanking: "Final Sıralaması",
    correctSuffix: "doğru",
    joinNewGame: "Yeni Oyuna Katıl",
  },
  en: {
    gameNotFound: "Game not found!",
    correctToast: (pts) => `Correct! +${pts} points`,
    wrongToast: "Wrong answer!",
    submitError: "An error occurred while submitting your answer!",
    loading: "Loading...",
    loginRequired: "You need to sign in!",
    resultCorrect: "Correct Answer!",
    resultWrong: "Wrong Answer",
    resultReceived: "Answer received",
    pointsShort: "points",
    pointsShortMobile: "p",
    waitingTitle: "Waiting for the game to start...",
    waitingSubtitle: "Questions will appear once the host starts the game",
    syncing: "Syncing with the server...",
    timeLeft: "Time Left",
    questionAlt: "Question",
    answerReceivedTitle: "Answer Received!",
    answerReceivedSubtitle: "Wait for the other players to see the results",
    youWon: "You Won!",
    winner: "Winner",
    fastestLabel: "Fastest correct answer:",
    secondsUnit: "seconds",
    correctAnswerIs: (ans) => `Correct answer: ${ans}`,
    correctAnswerHidden: "The correct answer is kept hidden during the game.",
    top5: "Top 5",
    waitNextQuestion: "Wait for the next question...",
    gameOver: "Game Over!",
    pointsLabel: "Points",
    yourRank: (rank) => `Your rank: #${rank}`,
    kahootThanks: "Thanks! Winners were shown for each question.",
    finalRanking: "Final Ranking",
    correctSuffix: "correct",
    joinNewGame: "Join a New Game",
  },
};

export default function PlayGamePage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const params = useParams();
  const gameId = params.gameId;

  const [game, setGame] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [questionWinners, setQuestionWinners] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [playerRank, setPlayerRank] = useState(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [showSyncWarning, setShowSyncWarning] = useState(false);
  const [localQuestionStartTime, setLocalQuestionStartTime] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [answerResult, setAnswerResult] = useState(null);

  const playerId = user ? `player_${user.uid}` : null;
  const lastQuestionIdRef = useRef(null);

  // Subscribe to game updates
  useEffect(() => {
    if (!gameId) return;

    const unsubscribeGame = subscribeToGame(gameId, (gameData) => {
      if (!gameData) {
        toast.error(copy.gameNotFound);
        router.push("/game");
        return;
      }

      setGame(gameData);

      // Update current question
      if (gameData.currentQuestion >= 0 && gameData.questions) {
        const newQuestion = gameData.questions[gameData.currentQuestion];

        // Reset answer state when question changes (guard against re-subscribe loops)
        if (lastQuestionIdRef.current !== newQuestion.id) {
          lastQuestionIdRef.current = newQuestion.id;
          setCurrentQuestion(newQuestion);
          setSelectedAnswer(null);
          setHasAnswered(false);
          setAnswerResult(null);
          // Reset timer state to prevent Safari from using stale timestamps
          setLocalQuestionStartTime(null);
        }
      }

      // Update player score
      if (playerId && gameData.players?.[playerId]) {
        setPlayerScore(gameData.players[playerId].score || 0);

        // Check if already answered current question
        const questionIndex = gameData.currentQuestion;
        if (gameData.players[playerId].answers?.[questionIndex]) {
          setHasAnswered(true);
          setSelectedAnswer(gameData.players[playerId].answers[questionIndex].answer);
        }
      }
    });

    const unsubscribeLeaderboard = subscribeToLeaderboard(gameId, (leaderboardData) => {
      setLeaderboard(leaderboardData);

      // Find player rank
      if (user) {
        const rank = leaderboardData.findIndex((p) => p.userId === user.uid);
        setPlayerRank(rank >= 0 ? rank + 1 : null);
      }
    });

    const unsubscribeWinners = subscribeToQuestionWinners(gameId, (winnersData) => {
      setQuestionWinners(winnersData);
    });

    return () => {
      unsubscribeGame();
      unsubscribeLeaderboard();
      unsubscribeWinners();
    };
  }, [gameId, router, user, playerId]);

  // Update player connection status
  useEffect(() => {
    if (!gameId || !playerId || !user) return;

    updatePlayerConnection(gameId, playerId, true);

    const handleBeforeUnload = () => {
      updatePlayerConnection(gameId, playerId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      updatePlayerConnection(gameId, playerId, false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [gameId, playerId, user]);

  // Timer with iOS Safari fallback
  useEffect(() => {
    if (!game || game.status !== "playing" || !currentQuestion || hasAnswered) return;

    const questionStartTime = game.questionStartedAt;
    const timeLimit = currentQuestion.timeLimit;

    // Detect Safari for specific optimizations
    const isSafari = typeof navigator !== 'undefined' &&
                     /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

    // Initialize local fallback timestamp if server time not available
    let effectiveStartTime = questionStartTime;
    let isSyncPending = false;
    let isMounted = true;

    // Validate server timestamp is not stale (from previous question)
    const isStaleTimestamp = questionStartTime &&
                            !isNaN(questionStartTime) &&
                            ((Date.now() - questionStartTime) / 1000) > timeLimit;

    if (!questionStartTime || isNaN(questionStartTime) || isStaleTimestamp) {
      // Server timestamp not ready or stale - use local fallback
      if (!localQuestionStartTime || isStaleTimestamp) {
        const now = Date.now();
        setLocalQuestionStartTime(now);
        effectiveStartTime = now;
      } else {
        effectiveStartTime = localQuestionStartTime;
      }
      isSyncPending = true;
      setShowSyncWarning(true);

      if (process.env.NODE_ENV === 'development') {
        logger.warn('questionStartedAt invalid, using local fallback', {
          gameId,
          currentQuestion: game.currentQuestion,
          isSafari,
          isStale: isStaleTimestamp,
          serverTimestamp: questionStartTime
        });
      }
    } else {
      // Server timestamp available and fresh
      setShowSyncWarning(false);
      if (localQuestionStartTime !== questionStartTime) {
        setLocalQuestionStartTime(questionStartTime);
      }
    }

    // Safari: Use slower update interval to combat background throttling
    const updateInterval = isSafari ? 200 : 100;

    const interval = setInterval(() => {
      if (!isMounted) return;

      const elapsed = (Date.now() - effectiveStartTime) / 1000;
      const remaining = Math.max(0, timeLimit - elapsed);

      // Safety check for NaN
      if (isNaN(remaining)) {
        logger.error('Timer calculation resulted in NaN', {
          elapsed,
          effectiveStartTime,
          timeLimit,
          questionStartTime
        });
        setTimeLeft(timeLimit); // Fallback to full time
        return;
      }

      setTimeLeft(Math.ceil(remaining));

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, updateInterval);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [game, currentQuestion, hasAnswered, localQuestionStartTime]);

  const handleAnswerSelect = async (answerIndex) => {
    if (hasAnswered || !currentQuestion || !game || isSubmitting) return;

    setIsSubmitting(true);
    setSelectedAnswer(answerIndex);
    setHasAnswered(true);
    setAnswerResult(null);

    // Safe timestamp calculation with fallback
    // Use localQuestionStartTime first as it's validated to be non-stale by the timer effect
    const questionStartTime = localQuestionStartTime || game.questionStartedAt || Date.now();
    const timeSpent = Math.max(0, (Date.now() - questionStartTime) / 1000);

    // Validate timeSpent to prevent NaN and ensure within limits
    const safeTimeSpent = isNaN(timeSpent)
      ? currentQuestion.timeLimit
      : Math.min(timeSpent, currentQuestion.timeLimit);

    try {
      const token = await user.getIdToken();

      const response = await fetch("/api/quiz/submitAnswer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          gameId,
          playerId,
          questionIndex: game.currentQuestion,
          answerIndex,
          timeSpent: safeTimeSpent
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to submit answer");
      }

      setAnswerResult({
        isCorrect: !!result.isCorrect,
        pointsEarned: result.pointsEarned || 0
      });

      if (result.isCorrect) {
        toast.success(copy.correctToast(result.pointsEarned));
      } else {
        toast.error(copy.wrongToast);
      }
    } catch (error) {
      logger.error("Error submitting answer:", error);
      toast.error(copy.submitError);
      setHasAnswered(false);
      setSelectedAnswer(null);
      setAnswerResult(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading || !game) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-stage px-4 text-stage-ink">
        <p className="text-lg">{copy.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-stage px-4 text-stage-ink">
        <p className="text-lg font-semibold">{copy.loginRequired}</p>
      </div>
    );
  }

  // Answer tile hues keep their order: red, blue, yellow, green. Letters carry the shape cue.
  const optionColors = [
    "bg-mark-red",
    "bg-mark-blue",
    "bg-mark-yellow",
    "bg-mark-green"
  ];

  const optionLetters = ["A", "B", "C", "D"];

  const panelClass = "rounded-lg border border-stage-rule bg-stage-2";

  const hasCorrectAnswer = typeof currentQuestion?.correctAnswer === "number";
  const correctAnswerText = hasCorrectAnswer && currentQuestion?.options
    ? currentQuestion.options[currentQuestion.correctAnswer]
    : null;
  const derivedResult = hasCorrectAnswer && selectedAnswer !== null
    ? { isCorrect: selectedAnswer === currentQuestion.correctAnswer }
    : null;
  const submissionOutcome = answerResult ?? derivedResult;
  const isAnswerCorrect = submissionOutcome?.isCorrect ?? null;
  const resultBorderClass = isAnswerCorrect === true
    ? "border-success"
    : isAnswerCorrect === false
      ? "border-error"
      : "border-stage-rule";
  const ResultIcon = isAnswerCorrect === true ? Check : isAnswerCorrect === false ? X : Info;
  const resultIconClass = isAnswerCorrect === true
    ? "text-success"
    : isAnswerCorrect === false
      ? "text-error"
      : "text-stage-muted";
  const resultTitle = isAnswerCorrect === true
    ? copy.resultCorrect
    : isAnswerCorrect === false
      ? copy.resultWrong
      : copy.resultReceived;

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-stage text-stage-ink">
      {/* Header */}
      <div className="border-b border-stage-rule px-3 py-3 sm:px-6 sm:py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-3 sm:gap-4">
            <div className="min-w-0 truncate font-display text-sm font-bold sm:text-xl">{game.quizTitle}</div>
            <div className="shrink-0 font-outlier text-xs tabular-nums text-stage-muted sm:text-base">
              {game.currentQuestion + 1}/{game.totalQuestions}
            </div>
          </div>
          {/* Only show score/rank in classic mode */}
          {game.gameMode !== "kahoot" && (
            <div className="flex shrink-0 items-baseline gap-3 sm:gap-4">
              {playerRank && (
                <div className="font-outlier text-sm font-bold tabular-nums text-warning sm:text-base">
                  #{playerRank}
                </div>
              )}
              <div className="text-sm font-bold sm:text-xl">
                <span className="font-outlier tabular-nums">{playerScore}</span> <span className="hidden sm:inline">{copy.pointsShort}</span><span className="sm:hidden">{copy.pointsShortMobile}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="px-3 py-4 sm:px-6 sm:py-8">
        <div className="mx-auto max-w-4xl">
          {/* Waiting State */}
          {game.status === "waiting" && (
            <div className="border-y border-stage-rule py-10 sm:py-16">
              <h2 className="font-display text-3xl font-bold sm:text-5xl">
                {copy.waitingTitle}
              </h2>
              <p className="mt-3 text-base text-stage-muted sm:mt-4 sm:text-xl">
                {copy.waitingSubtitle}
              </p>
            </div>
          )}

          {/* Playing State */}
          {game.status === "playing" && currentQuestion && (
            <div className="space-y-4 sm:space-y-6">
              {/* Sync Status Indicator */}
              {showSyncWarning && (
                <div className="rounded bg-warning p-3 text-center text-ink">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent"></div>
                    <span className="text-sm font-medium">{copy.syncing}</span>
                  </div>
                </div>
              )}

              {/* Timer & Question */}
              <div className="border-b border-stage-rule pb-4 sm:pb-6">
                <div className="mb-4 flex items-baseline justify-between sm:mb-6">
                  <div className="text-sm text-stage-muted sm:text-base">{copy.timeLeft}</div>
                  <div className={`font-outlier text-5xl font-bold tabular-nums ${
                    timeLeft <= 5 ? "text-error" : "text-stage-ink"
                  }`}>
                    {timeLeft}s
                  </div>
                </div>

                {/* Question Image */}
                {currentQuestion.imageUrl && (
                  <div className="mb-4 sm:mb-6">
                    <Image
                      src={currentQuestion.imageUrl}
                      alt={copy.questionAlt}
                      width={800}
                      height={600}
                      priority
                      className="mx-auto h-auto w-full max-w-xl rounded"
                    />
                  </div>
                )}

                <h2 className="text-balance break-words font-display text-3xl font-bold md:text-5xl">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Status */}
              {hasAnswered ? (
                <div className={`${panelClass} p-6 sm:p-8`}>
                  <Check className="mb-3 h-10 w-10 text-success sm:mb-4 sm:h-12 sm:w-12" aria-hidden="true" />
                  <h3 className="mb-2 font-display text-xl font-bold sm:text-2xl">
                    {copy.answerReceivedTitle}
                  </h3>
                  <p className="text-sm text-stage-muted sm:text-base">
                    {copy.answerReceivedSubtitle}
                  </p>
                </div>
              ) : (
                /* Options */
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered || isSubmitting || (timeLeft <= 0 && !showSyncWarning)}
                      className={`
                        ${optionColors[index]}
                        flex min-h-20 items-center gap-3 rounded-lg p-4 text-left text-lg font-bold text-ink sm:min-h-32 sm:gap-4 sm:p-6 sm:text-2xl
                        transition-opacity duration-micro hover:opacity-90
                        disabled:cursor-not-allowed disabled:opacity-50
                        ${selectedAnswer === index ? "outline outline-4 -outline-offset-4 outline-ink" : ""}
                      `}
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded border-2 border-ink font-display text-lg font-extrabold sm:h-11 sm:w-11 sm:text-2xl"
                        aria-hidden="true"
                      >
                        {optionLetters[index]}
                      </span>
                      <span className="min-w-0 break-words">{option}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Question Review State */}
          {game.status === "question_review" && currentQuestion && (
            <div className="space-y-4 sm:space-y-6">
              {/* Question Winner (Kahoot Mode) */}
              {game.gameMode === "kahoot" && questionWinners[game.currentQuestion] && (
                <div className="rounded-lg bg-warning p-6 text-ink sm:p-10">
                  <Trophy className="mb-3 h-10 w-10 sm:mb-4 sm:h-14 sm:w-14" aria-hidden="true" />
                  <h2 className="mb-2 font-display text-3xl font-bold sm:text-5xl">
                    {questionWinners[game.currentQuestion].userId === user.uid ? copy.youWon : copy.winner}
                  </h2>
                  <div className="mb-2 break-words font-display text-xl font-bold sm:text-3xl">
                    {questionWinners[game.currentQuestion].name}
                  </div>
                  <div className="text-base sm:text-xl">
                    {copy.fastestLabel} <span className="font-outlier tabular-nums">{questionWinners[game.currentQuestion].timeSpent.toFixed(2)}</span> {copy.secondsUnit}
                  </div>
                </div>
              )}

              {/* Result */}
              <div className={`${panelClass} border-2 p-6 sm:p-10 ${resultBorderClass}`}>
                <ResultIcon className={`mb-3 h-10 w-10 sm:mb-4 sm:h-14 sm:w-14 ${resultIconClass}`} aria-hidden="true" />
                <h2 className="mb-3 font-display text-3xl font-bold sm:mb-4 sm:text-5xl">
                  {resultTitle}
                </h2>
                <p className="break-words text-base text-stage-muted sm:text-xl">
                  {correctAnswerText
                    ? copy.correctAnswerIs(correctAnswerText)
                    : copy.correctAnswerHidden}
                </p>
              </div>

              {/* Leaderboard Preview (Classic Mode Only) */}
              {game.gameMode !== "kahoot" && leaderboard.length > 0 && (
                <div className="border-t-2 border-stage-ink pt-3">
                  <h3 className="mb-3 font-display text-xl font-bold sm:mb-4 sm:text-2xl">
                    {copy.top5}
                  </h3>
                  <ol>
                    {leaderboard.slice(0, 5).map((player, index) => {
                      const isCurrentPlayer = player.userId === user.uid;
                      return (
                        <li
                          key={player.userId}
                          className={`flex items-center justify-between gap-3 border-b border-stage-rule px-2 py-2 sm:py-3 ${
                            isCurrentPlayer ? "bg-stage-2" : ""
                          }`}
                        >
                          <div className="flex min-w-0 items-baseline gap-3 sm:gap-4">
                            <span className="w-6 shrink-0 font-outlier text-xl font-bold tabular-nums sm:text-2xl">
                              {index + 1}
                            </span>
                            <span className="min-w-0 truncate text-sm font-semibold sm:text-base">
                              {player.name}
                            </span>
                          </div>
                          <span className="shrink-0 font-outlier text-lg font-bold tabular-nums sm:text-xl">
                            {player.score}
                          </span>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              <div className="text-sm text-stage-muted sm:text-base">
                {copy.waitNextQuestion}
              </div>
            </div>
          )}

          {/* Finished State */}
          {game.status === "finished" && (
            <div className="space-y-6 sm:space-y-8">
              <div className="border-y border-stage-rule py-8 sm:py-12">
                <h2 className="mb-3 font-display text-3xl font-bold sm:mb-4 sm:text-5xl">
                  {copy.gameOver}
                </h2>
                {/* Only show score in classic mode */}
                {game.gameMode !== "kahoot" && (
                  <>
                    <div className="mb-2 font-display text-2xl font-bold sm:text-3xl">
                      <span className="font-outlier tabular-nums">{playerScore}</span> {copy.pointsLabel}
                    </div>
                    {playerRank && (
                      <div className="text-lg text-stage-muted sm:text-xl">
                        {copy.yourRank(playerRank)}
                      </div>
                    )}
                  </>
                )}
                {/* Kahoot mode - different message */}
                {game.gameMode === "kahoot" && (
                  <div className="mt-4 text-base text-stage-muted sm:text-lg">
                    {copy.kahootThanks}
                  </div>
                )}
              </div>

              {/* Final Leaderboard (Classic Mode Only) */}
              {game.gameMode !== "kahoot" && leaderboard.length > 0 && (
                <div className="border-t-2 border-stage-ink pt-3">
                  <h3 className="mb-4 font-display text-2xl font-bold sm:mb-6 sm:text-3xl">
                    {copy.finalRanking}
                  </h3>
                  <ol>
                    {leaderboard.map((player, index) => {
                      const isCurrentPlayer = player.userId === user.uid;
                      return (
                        <li
                          key={player.userId}
                          className={`flex items-center justify-between gap-3 border-b border-stage-rule px-2 py-3 sm:py-4 ${
                            index === 0
                              ? "bg-warning text-ink"
                              : isCurrentPlayer
                              ? "bg-stage-2"
                              : ""
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
                            {index === 0 && <Trophy className="h-5 w-5 shrink-0 sm:h-6 sm:w-6" aria-hidden="true" />}
                            <span className="w-8 shrink-0 font-outlier text-2xl font-bold tabular-nums sm:w-12 sm:text-3xl">
                              {index + 1}
                            </span>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-bold sm:text-lg">
                                {player.name}
                              </div>
                              <div className={`text-xs sm:text-sm ${index === 0 ? "text-ink-2" : "text-stage-muted"}`}>
                                <span className="font-outlier tabular-nums">{player.correctAnswers}/{game.totalQuestions}</span> {copy.correctSuffix}
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0 font-outlier text-xl font-bold tabular-nums sm:text-2xl">
                            {player.score}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              )}

              <Button asChild size="lg" className="w-full">
                <Link href="/game">{copy.joinNewGame}</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar
        newestOnTop
        closeOnClick
        theme="light"
      />
    </div>
  );
}
