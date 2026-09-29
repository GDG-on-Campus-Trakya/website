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
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageContainer, Skeleton } from "@/components/ui/page";

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
    backHome: "Ana Sayfaya Dön",
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
    backHome: "Back to Home",
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
      <PageContainer className="max-w-md">
        <div className="space-y-5">
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="mt-8 h-4 w-24" />
          <Skeleton className="h-16" />
          <Skeleton className="h-12" />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">{copy.loading}</p>
      </PageContainer>
    );
  }

  return (
    <PageContainer className="max-w-md md:py-16">
      <header className="mb-8">
        <h1 className="font-display text-display-s font-extrabold">{copy.title}</h1>
        <p className="mt-3 text-md text-ink-2">{copy.subtitle}</p>
      </header>

      <form onSubmit={handleJoinGame} className="space-y-5 border-t-2 border-ink pt-6">
        <Field id="game-code" label={copy.codeLabel}>
          <Input
            type="text"
            value={gameCode}
            onChange={handleCodeInput}
            className="h-16 text-center font-outlier text-3xl font-medium tracking-widest"
            placeholder="000000"
            maxLength="6"
            required
            disabled={joining}
          />
        </Field>

        {!user && (
          <p className="rounded border border-ink bg-warning px-3 py-2 text-sm text-ink">
            {copy.loginHint}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!user || gameCode.length !== 6 || joining}
          loading={joining}
        >
          {joining ? copy.joining : copy.join}
        </Button>

        {!user && (
          <div className="text-center">
            <Button type="button" variant="link" onClick={() => router.push("/")}>
              {copy.signIn}
            </Button>
          </div>
        )}
      </form>

      <div className="mt-8">
        <Button variant="link" onClick={() => router.push("/")}>
          <ArrowLeft aria-hidden="true" />
          {copy.backHome}
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
    </PageContainer>
  );
}
