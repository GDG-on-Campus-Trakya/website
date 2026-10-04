"use client";

import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useAccount } from "@/app/AuthProvider";
import { Link, useRouter } from "@/i18n/navigation";
import { logger } from "@/utils/logger";
import { findGameByCode, addPlayerToGame } from "@/utils/quizUtils";
import { findPollByCode, addPlayerToPoll } from "@/utils/pollUtils";
import { withTimeout, isSafari } from "@/utils/debounce";
import { loginHref } from "@/utils/redirect";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageContainer, Skeleton } from "@/components/ui/page";

const COPY = {
  tr: {
    codeLength: "Kod 6 haneli. Ekrandaki rakamların hepsini gir.",
    timeout: "Bağlantı çok yavaş. Biraz bekleyip tekrar dene.",
    gameFinished: "Bu oyun bitti. Ekranda yeni bir kod varsa onu gir.",
    gameNotFound: "Bu kodla açık bir oyun yok. Ekrandaki kodu kontrol et.",
    joinError: "Oyuna katılamadın. Bağlantını kontrol edip tekrar dene.",
    loading: "Yükleniyor…",
    title: "Oyuna katıl",
    subtitle: "Etkinlikte ekranda görünen 6 haneli kodu gir.",
    codeLabel: "Oyun kodu",
    loginHint: "Katılmak için giriş yap; sonra kodunla birlikte bu sayfaya dönersin.",
    join: "Katıl",
    signIn: "Giriş yap ve katıl",
    anonymous: "Anonim",
  },
  en: {
    codeLength: "The code has 6 digits. Enter all of the digits on screen.",
    timeout: "The connection is too slow. Wait a moment and try again.",
    gameFinished: "This game has ended. If there is a new code on screen, enter that.",
    gameNotFound: "No open game uses this code. Check the code on screen.",
    joinError: "You could not join. Check your connection and try again.",
    loading: "Loading…",
    title: "Join a game",
    subtitle: "Enter the 6-digit code shown on screen at the event.",
    codeLabel: "Game code",
    loginHint: "Sign in to join; you will come back to this page with your code.",
    join: "Join",
    signIn: "Sign in and join",
    anonymous: "Anonymous",
  },
};

export default function GameJoinPage() {
  const locale = useLocale() === "en" ? "en" : "tr";
  const copy = COPY[locale];
  const { user, loading, profile } = useAccount();
  const [gameCode, setGameCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const returnPath = gameCode ? `/game?code=${gameCode}` : "/game";

  // /game?code=123456 (e.g. after signing in) arrives with the code filled in
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) setGameCode(code.replace(/\D/g, "").slice(0, 6));
  }, []);

  const handleJoinGame = useCallback(
    async (event) => {
      event.preventDefault();

      if (!user) {
        router.push(loginHref(returnPath));
        return;
      }

      if (gameCode.length !== 6) {
        setError(copy.codeLength);
        return;
      }

      setError("");
      setJoining(true);

      // Errors stay under the code field; success just opens the game.
      const fail = (message) => {
        setError(message);
        setJoining(false);
      };

      try {
        const timeoutDuration = isSafari() ? 8000 : 10000;
        const [game, poll] = await withTimeout(
          Promise.all([findGameByCode(gameCode), findPollByCode(gameCode)]),
          timeoutDuration,
          copy.timeout
        );

        // The profile is already loaded for the navbar; joining does not wait on it.
        const playerData = {
          userId: user.uid,
          name: profile?.name || user.displayName || copy.anonymous,
          email: user.email,
          avatar: user.photoURL || "",
          faculty: profile?.faculty || "",
          department: profile?.department || "",
        };
        const playerId = `player_${user.uid}`;
        const room = game || poll;

        if (!room) {
          fail(copy.gameNotFound);
          return;
        }

        if (room.status === "finished") {
          fail(copy.gameFinished);
          return;
        }

        const path = game ? `/quiz/play/${game.id}` : `/poll/room/${poll.id}`;

        if (!room.players?.[playerId]) {
          await withTimeout(
            game ? addPlayerToGame(game.id, playerData) : addPlayerToPoll(poll.id, playerData),
            5000,
            copy.timeout
          );
        }

        router.push(path);
      } catch (joinError) {
        logger.error("Error joining game:", joinError);
        fail(joinError.message === copy.timeout ? copy.timeout : copy.joinError);
      }
    },
    [user, profile, gameCode, returnPath, router, copy]
  );

  const handleCodeInput = useCallback((event) => {
    const value = event.target.value.replace(/\D/g, "").slice(0, 6);
    setGameCode(value);
    setError("");
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
        <Field id="game-code" label={copy.codeLabel} error={error}>
          {/* Digits only: phones open the number pad, and iOS can fill a code it was sent */}
          <Input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            enterKeyHint="go"
            autoFocus
            value={gameCode}
            onChange={handleCodeInput}
            className="h-16 text-center font-outlier text-3xl font-medium tracking-widest"
            placeholder="000000"
            maxLength={6}
            required
            disabled={joining}
          />
        </Field>

        {user ? (
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={gameCode.length !== 6 || joining}
            loading={joining}
          >
            {copy.join}
          </Button>
        ) : (
          <>
            <Button asChild size="lg" className="w-full">
              <Link href={loginHref(returnPath)}>{copy.signIn}</Link>
            </Button>
            <p className="text-sm text-muted-foreground">{copy.loginHint}</p>
          </>
        )}
      </form>
    </PageContainer>
  );
}
