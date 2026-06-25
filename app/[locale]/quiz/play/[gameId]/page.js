"use client";
import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Image from "next/image";
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
    answerReceivedTitle: "Cevabınız Alındı!",
    answerReceivedSubtitle: "Sonuçları görmek için diğer oyuncuları bekleyin",
    youWon: "Kazandınız!",
    winner: "Kazanan",
    fastestCorrect: (s) => `En hızlı doğru cevap: ${s} saniye`,
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
    answerReceivedTitle: "Answer Received!",
    answerReceivedSubtitle: "Wait for the other players to see the results",
    youWon: "You Won!",
    winner: "Winner",
    fastestCorrect: (s) => `Fastest correct answer: ${s} seconds`,
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">{copy.loading}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">{copy.loginRequired}</p>
      </div>
    );
  }

  const optionColors = [
    "from-red-500 to-pink-600",
    "from-blue-500 to-cyan-600",
    "from-yellow-500 to-orange-600",
    "from-green-500 to-emerald-600"
  ];

  const optionShapes = ["🔴", "🔷", "🟡", "🟢"];

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
    ? "border-green-500"
    : isAnswerCorrect === false
      ? "border-red-500"
      : "border-white/20";
  const resultIcon = isAnswerCorrect === true ? "🎉" : isAnswerCorrect === false ? "😔" : "ℹ️";
  const resultTitle = isAnswerCorrect === true
    ? copy.resultCorrect
    : isAnswerCorrect === false
      ? copy.resultWrong
      : copy.resultReceived;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm p-3 sm:p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="text-white font-bold text-sm sm:text-xl truncate max-w-[120px] sm:max-w-none">{game.quizTitle}</div>
            <div className="text-gray-400 text-xs sm:text-base">
              {game.currentQuestion + 1}/{game.totalQuestions}
            </div>
          </div>
          {/* Only show score/rank in classic mode */}
          {game.gameMode !== "kahoot" && (
            <div className="flex items-center gap-2 sm:gap-4">
              {playerRank && (
                <div className="text-yellow-400 font-bold text-sm sm:text-base">
                  #{playerRank}
                </div>
              )}
              <div className="text-white font-bold text-sm sm:text-xl">
                {playerScore} <span className="hidden sm:inline">{copy.pointsShort}</span><span className="sm:hidden">{copy.pointsShortMobile}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Waiting State */}
          {game.status === "waiting" && (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 text-center">
              <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">⏳</div>
              <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                {copy.waitingTitle}
              </h2>
              <p className="text-base sm:text-xl text-gray-300">
                {copy.waitingSubtitle}
              </p>
            </div>
          )}

          {/* Playing State */}
          {game.status === "playing" && currentQuestion && (
            <div className="space-y-4 sm:space-y-6">
              {/* Sync Status Indicator */}
              {showSyncWarning && (
                <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center gap-2 text-yellow-200">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-400 border-t-transparent"></div>
                    <span className="text-sm">{copy.syncing}</span>
                  </div>
                </div>
              )}

              {/* Timer & Question */}
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <div className="text-white/70 text-sm sm:text-base">{copy.timeLeft}</div>
                  <div className={`text-3xl sm:text-5xl font-bold ${
                    timeLeft <= 5 ? "text-red-500" : "text-white"
                  }`}>
                    {timeLeft}s
                  </div>
                </div>

                {/* Question Image */}
                {currentQuestion.imageUrl && (
                  <div className="mb-4 sm:mb-6">
                    <Image
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      width={800}
                      height={600}
                      priority
                      className="w-full max-w-xl mx-auto h-auto rounded-lg"
                    />
                  </div>
                )}

                <h2 className="text-xl sm:text-3xl font-bold text-white text-center">
                  {currentQuestion.question}
                </h2>
              </div>

              {/* Answer Status */}
              {hasAnswered ? (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/20 text-center">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">✓</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    {copy.answerReceivedTitle}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300">
                    {copy.answerReceivedSubtitle}
                  </p>
                </div>
              ) : (
                /* Options */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {currentQuestion.options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={hasAnswered || isSubmitting || (timeLeft <= 0 && !showSyncWarning)}
                      className={`
                        bg-gradient-to-r ${optionColors[index]}
                        p-4 sm:p-8 rounded-xl sm:rounded-2xl text-white font-bold text-base sm:text-xl
                        hover:scale-105 active:scale-95 transition-all
                        disabled:opacity-50 disabled:cursor-not-allowed
                        flex items-center justify-center gap-2 sm:gap-4
                        ${selectedAnswer === index ? "ring-4 ring-white" : ""}
                      `}
                    >
                      <span className="text-2xl sm:text-4xl">{optionShapes[index]}</span>
                      <span className="text-sm sm:text-xl">{option}</span>
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
                <div className="bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl sm:rounded-3xl p-6 sm:p-12 border-4 border-yellow-300 text-center">
                  <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">🏆</div>
                  <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2">
                    {questionWinners[game.currentQuestion].userId === user.uid ? copy.youWon : copy.winner}
                  </h2>
                  <div className="text-xl sm:text-3xl font-bold text-white mb-2">
                    {questionWinners[game.currentQuestion].name}
                  </div>
                  <div className="text-base sm:text-xl text-white/90">
                    ⚡ {copy.fastestCorrect(questionWinners[game.currentQuestion].timeSpent.toFixed(2))}
                  </div>
                </div>
              )}

              {/* Result */}
              <div className={`bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border text-center ${resultBorderClass}`}>
                <div className="text-4xl sm:text-6xl mb-3 sm:mb-4">
                  {resultIcon}
                </div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                  {resultTitle}
                </h2>
                <p className="text-base sm:text-xl text-gray-300">
                  {correctAnswerText
                    ? copy.correctAnswerIs(correctAnswerText)
                    : copy.correctAnswerHidden}
                </p>
              </div>

              {/* Leaderboard Preview (Classic Mode Only) */}
              {game.gameMode !== "kahoot" && leaderboard.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-center">
                    🏆 {copy.top5}
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.slice(0, 5).map((player, index) => {
                      const isCurrentPlayer = player.userId === user.uid;
                      return (
                        <div
                          key={player.userId}
                          className={`flex items-center justify-between p-2 sm:p-3 rounded-lg ${
                            isCurrentPlayer
                              ? "bg-purple-500/30 border border-purple-500"
                              : "bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-3">
                            <span className="text-xl sm:text-2xl font-bold text-white">
                              {index + 1}
                            </span>
                            <span className="text-sm sm:text-base text-white font-semibold truncate max-w-[150px] sm:max-w-none">
                              {player.name}
                            </span>
                          </div>
                          <span className="text-lg sm:text-xl font-bold text-white">
                            {player.score}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="text-center text-sm sm:text-base text-gray-300">
                {copy.waitNextQuestion}
              </div>
            </div>
          )}

          {/* Finished State */}
          {game.status === "finished" && (
            <div className="space-y-4 sm:space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-6 sm:p-12 border border-white/20 text-center">
                <div className="text-4xl sm:text-6xl mb-4 sm:mb-6">🎊</div>
                <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3 sm:mb-4">
                  {copy.gameOver}
                </h2>
                {/* Only show score in classic mode */}
                {game.gameMode !== "kahoot" && (
                  <>
                    <div className="text-2xl sm:text-3xl font-bold text-purple-400 mb-2">
                      {playerScore} {copy.pointsLabel}
                    </div>
                    {playerRank && (
                      <div className="text-lg sm:text-xl text-gray-300">
                        {copy.yourRank(playerRank)}
                      </div>
                    )}
                  </>
                )}
                {/* Kahoot mode - different message */}
                {game.gameMode === "kahoot" && (
                  <div className="text-base sm:text-lg text-gray-300 mt-4">
                    {copy.kahootThanks}
                  </div>
                )}
              </div>

              {/* Final Leaderboard (Classic Mode Only) */}
              {game.gameMode !== "kahoot" && leaderboard.length > 0 && (
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-white/20">
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6 text-center">
                    🏆 {copy.finalRanking}
                  </h3>
                  <div className="space-y-2 sm:space-y-3">
                    {leaderboard.map((player, index) => {
                      const isCurrentPlayer = player.userId === user.uid;
                      return (
                        <div
                          key={player.userId}
                          className={`flex items-center justify-between p-3 sm:p-4 rounded-lg ${
                            index === 0
                              ? "bg-yellow-500/20 border-2 border-yellow-500"
                              : index === 1
                              ? "bg-gray-400/20 border-2 border-gray-400"
                              : index === 2
                              ? "bg-orange-500/20 border-2 border-orange-500"
                              : isCurrentPlayer
                              ? "bg-purple-500/30 border border-purple-500"
                              : "bg-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2 sm:gap-4">
                            <span className="text-2xl sm:text-3xl font-bold text-white w-8 sm:w-12">
                              {index + 1}
                            </span>
                            <div>
                              <div className="text-sm sm:text-lg text-white font-bold truncate max-w-[150px] sm:max-w-none">
                                {player.name}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-400">
                                ✅ {player.correctAnswers}/{game.totalQuestions} {copy.correctSuffix}
                              </div>
                            </div>
                          </div>
                          <div className="text-xl sm:text-2xl font-bold text-white">
                            {player.score}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button
                onClick={() => router.push("/quiz/join")}
                className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-colors font-bold text-lg sm:text-xl"
              >
                {copy.joinNewGame}
              </button>
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
        theme="dark"
      />
    </div>
  );
}
