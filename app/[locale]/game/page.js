"use client";

import { useCallback, useState } from "react";
import { useLocale } from "next-intl";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { logger } from "@/utils/logger";
import { findGameByCode, addPlayerToGame } from "@/utils/quizUtils";
import { findPollByCode, addPlayerToPoll } from "@/utils/pollUtils";
import { withTimeout, isSafari } from "@/utils/debounce";

const COPY = {
  tr: {
    loginRequired: "Oyuna katılmak için giriş yapmalısınız!",
    codeLength: "Oyun kodu 6 haneli olmalıdır!",
    timeout: "İşlem çok uzun sürdü. Lütfen tekrar deneyin.",
    profileMissing:
      "Profil bilgileriniz bulunamadı. Lütfen profil sayfanızı doldurun.",
    gameFinished: "Bu oyun sona ermiş!",
    alreadyJoined: "Bu oyuna zaten katıldınız!",
    joined: "Oyuna katıldınız!",
    gameNotFound: "Oyun bulunamadı! Kodu kontrol edin.",
    joinError: "Oyuna katılırken hata oluştu!",
    loading: "Yükleniyor...",
    title: "Oyun!",
    subtitle: "Oyuna katılmak için kodu girin",
    codeLabel: "Oyun Kodu",
    loginHint: "Oyuna katılmak için önce giriş yapmalısınız",
    joining: "Katılınıyor...",
    join: "Oyuna Katıl",
    signIn: "Giriş Yap",
    backHome: "← Ana Sayfaya Dön",
    anonymous: "Anonim",
  },
  en: {
    loginRequired: "You need to sign in before joining the game!",
    codeLength: "The game code must be 6 digits long!",
    timeout: "The operation took too long. Please try again.",
    profileMissing:
      "Your profile information could not be found. Please complete your profile page.",
    gameFinished: "This game has already ended!",
    alreadyJoined: "You have already joined this game!",
    joined: "You joined the game!",
    gameNotFound: "Game not found. Please check the code.",
    joinError: "An error occurred while joining the game!",
    loading: "Loading...",
    title: "Game!",
    subtitle: "Enter the code to join the game",
    codeLabel: "Game Code",
    loginHint: "You need to sign in before joining the game",
    joining: "Joining...",
    join: "Join Game",
    signIn: "Sign In",
    backHome: "← Back to Home",
    anonymous: "Anonymous",
  },
};

export default function GameJoinPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const [user, loading] = useAuthState(auth);
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  const handleJoinGame = useCallback(
    async (event) => {
      event.preventDefault();

      if (!user) {
        toast.error(copy.loginRequired);
        router.push("/");
        return;
      }

      if (gameCode.length !== 6) {
        toast.error(copy.codeLength);
        return;
      }

      setJoining(true);

      try {
        const timeoutDuration = isSafari() ? 8000 : 10000;

        const [userDoc, game, poll] = await withTimeout(
          Promise.all([
            getDoc(doc(db, "users", user.uid)),
            findGameByCode(gameCode),
            findPollByCode(gameCode),
          ]),
          timeoutDuration,
          copy.timeout
        );

        if (!userDoc.exists()) {
          toast.error(copy.profileMissing);
          router.push("/profile");
          setJoining(false);
          return;
        }

        const userData = userDoc.data();
        const playerData = {
          userId: user.uid,
          name: userData.name || user.displayName || copy.anonymous,
          email: user.email,
          avatar: user.photoURL || "",
          faculty: userData.faculty || "",
          department: userData.department || "",
        };
        const playerId = `player_${user.uid}`;

        if (game) {
          if (game.status === "finished") {
            toast.error(copy.gameFinished);
            setJoining(false);
            return;
          }

          if (game.players && game.players[playerId]) {
            toast.info(copy.alreadyJoined);
            router.push(`/quiz/play/${game.id}`);
            return;
          }

          await withTimeout(
            addPlayerToGame(game.id, playerData),
            5000,
            copy.timeout
          );
          toast.success(copy.joined);
          router.push(`/quiz/play/${game.id}`);
          return;
        }

        if (poll) {
          if (poll.status === "finished") {
            toast.error(copy.gameFinished);
            setJoining(false);
            return;
          }

          if (poll.players && poll.players[playerId]) {
            toast.info(copy.alreadyJoined);
            router.push(`/poll/room/${poll.id}`);
            return;
          }

          await withTimeout(
            addPlayerToPoll(poll.id, playerData),
            5000,
            copy.timeout
          );
          toast.success(copy.joined);
          router.push(`/poll/room/${poll.id}`);
          return;
        }

        toast.error(copy.gameNotFound);
        setJoining(false);
      } catch (joinError) {
        logger.error("Error joining game:", joinError);
        toast.error(joinError.message === copy.timeout ? joinError.message : copy.joinError);
        setJoining(false);
      }
    },
    [user, gameCode, router, copy]
  );

  const handleCodeInput = useCallback((event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setGameCode(value);
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900">
        <div className="w-full max-w-md px-4 sm:px-6">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg animate-pulse sm:rounded-3xl sm:p-8">
            <div className="space-y-5 sm:space-y-6">
              <div className="mx-auto h-6 w-3/4 rounded-xl bg-white/20 sm:h-8" />
              <div className="mx-auto h-5 w-1/2 rounded-xl bg-white/20 sm:h-6" />
              <div className="mt-6 space-y-2 sm:mt-8 sm:space-y-3">
                <div className="h-4 w-20 rounded bg-white/20 sm:h-5 sm:w-24" />
                <div className="h-12 rounded-xl bg-white/20 sm:h-16" />
              </div>
              <div className="mt-5 h-12 rounded-xl bg-white/20 sm:mt-6 sm:h-14" />
            </div>
          </div>
          <p className="mt-5 text-center text-sm text-white/80 sm:mt-6 sm:text-base">
            {copy.loading}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-900 p-4 sm:p-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center sm:mb-12">
          <h1 className="mb-3 text-4xl font-bold text-white sm:mb-4 sm:text-6xl">
            {copy.title}
          </h1>
          <p className="text-base text-white/80 sm:text-xl">{copy.subtitle}</p>
        </div>

        <div className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg sm:rounded-3xl sm:p-8">
          <form onSubmit={handleJoinGame} className="space-y-5 sm:space-y-6">
            <div>
              <label className="mb-2 block text-base font-semibold text-white sm:mb-3 sm:text-lg">
                {copy.codeLabel}
              </label>
              <input
                type="text"
                value={gameCode}
                onChange={handleCodeInput}
                className="w-full rounded-xl border-2 border-white/30 bg-white/20 px-4 py-3 text-center text-2xl font-bold tracking-widest text-white placeholder-white/50 focus:border-white focus:outline-none sm:px-6 sm:py-4 sm:text-4xl"
                placeholder="000000"
                maxLength="6"
                required
                disabled={joining}
              />
            </div>

            {!user && (
              <div className="rounded-xl border border-yellow-500/50 bg-yellow-500/20 p-3 sm:p-4">
                <p className="text-center text-xs text-yellow-200 sm:text-sm">
                  {copy.loginHint}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!user || gameCode.length !== 6 || joining}
              className="relative w-full rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-base font-bold text-white transition-colors hover:from-purple-700 hover:to-pink-700 disabled:cursor-not-allowed disabled:opacity-50 sm:py-4 sm:text-xl"
            >
              {joining ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="h-5 w-5 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  {copy.joining}
                </span>
              ) : (
                copy.join
              )}
            </button>
          </form>

          {!user && (
            <div className="mt-5 text-center sm:mt-6">
              <button
                onClick={() => router.push("/")}
                className="text-sm text-white underline hover:text-white/80 sm:text-base"
              >
                {copy.signIn}
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center sm:mt-8">
          <button
            onClick={() => router.push("/")}
            className="text-sm text-white/70 transition-colors hover:text-white sm:text-base"
          >
            {copy.backHome}
          </button>
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
