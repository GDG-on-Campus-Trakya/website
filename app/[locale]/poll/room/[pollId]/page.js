"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Check, Trophy, Users } from "lucide-react";
import { logger } from "@/utils/logger";
import {
  subscribeToPoll,
  subscribeToPlayers,
  submitVote,
  updatePlayerConnection,
  getCurrentMatch,
  getMatchesForRound
} from "@/utils/pollUtils";

export default function PollRoomPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const params = useParams();
  const pollId = params.pollId;

  const [poll, setPoll] = useState(null);
  const [players, setPlayers] = useState({});
  const [currentMatch, setCurrentMatch] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);

  const playerId = user ? `player_${user.uid}` : null;

  // Subscribe to poll updates
  useEffect(() => {
    if (!pollId) return;

    const unsubscribePoll = subscribeToPoll(pollId, (pollData) => {
      if (!pollData) {
        toast.error("Poll bulunamadı!");
        router.push("/game");
        return;
      }

      setPoll(pollData);

      // Update current match
      const match = getCurrentMatch(pollData);
      setCurrentMatch(match);

      // Check if player has voted for current match
      if (playerId && match && pollData.players?.[playerId]) {
        const playerVote = pollData.players[playerId].votedMatches?.[pollData.currentMatchIndex];
        if (playerVote) {
          setHasVoted(true);
          setSelectedChoice(playerVote);
        } else {
          setHasVoted(false);
          setSelectedChoice(null);
        }
      }
    });

    const unsubscribePlayers = subscribeToPlayers(pollId, setPlayers);

    return () => {
      unsubscribePoll();
      unsubscribePlayers();
    };
  }, [pollId, router, playerId]);

  // Update player connection status
  useEffect(() => {
    if (!pollId || !playerId || !user) return;

    updatePlayerConnection(pollId, playerId, true);

    const handleBeforeUnload = () => {
      updatePlayerConnection(pollId, playerId, false);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      updatePlayerConnection(pollId, playerId, false);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [pollId, playerId, user]);

  const handleVote = async (choice) => {
    if (hasVoted || !currentMatch || !poll) return;

    setSelectedChoice(choice);
    setHasVoted(true);

    try {
      await submitVote(pollId, playerId, poll.currentMatchIndex, choice);
      toast.success("Oyunuz kaydedildi!");
    } catch (error) {
      logger.error("Error submitting vote:", error);
      toast.error("Oy gönderilirken hata oluştu!");
      setHasVoted(false);
      setSelectedChoice(null);
    }
  };

  if (loading || !poll) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-stage px-4 text-stage-ink">
        <p className="text-lg">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[calc(100dvh-4rem)] items-center justify-center bg-stage px-4 text-stage-ink">
        <p className="text-lg font-semibold">Giriş yapmalısınız!</p>
      </div>
    );
  }

  const connectedPlayerCount = Object.values(players).filter(p => p.isConnected).length;

  const renderChoice = (choice, item, tone, letter) => {
    const selected = hasVoted && selectedChoice === choice;
    return (
      <button
        onClick={() => handleVote(choice)}
        disabled={hasVoted}
        aria-pressed={selected}
        className={`group flex min-w-0 flex-col overflow-hidden rounded-lg border-2 bg-stage-2 text-left transition-colors duration-micro ease-out disabled:cursor-not-allowed ${
          selected
            ? "border-stage-ink"
            : hasVoted
            ? "border-stage-rule opacity-60"
            : "cursor-pointer border-stage-rule hover:border-stage-ink"
        }`}
      >
        <div className="relative aspect-square w-full">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="h-full w-full object-cover"
          />
          {selected && (
            <div className="absolute left-3 top-3 flex h-12 w-12 items-center justify-center rounded border-2 border-stage-ink bg-stage text-stage-ink">
              <Check className="h-7 w-7" aria-hidden="true" />
            </div>
          )}
        </div>
        <div className={`p-4 text-ink sm:p-6 ${tone}`}>
          <div className="flex items-start gap-3">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-ink font-outlier text-base font-bold"
              aria-hidden="true"
            >
              {letter}
            </span>
            <div className="min-w-0">
              <div className="break-words font-display text-xl font-bold sm:text-2xl">
                {item.name}
              </div>
              {item.description && (
                <div className="mt-1 text-xs sm:text-sm">
                  {item.description}
                </div>
              )}
            </div>
          </div>
          {hasVoted && (
            <div className="mt-3 font-outlier text-2xl font-bold tabular-nums sm:text-3xl">
              {currentMatch.votes[choice]} oy
            </div>
          )}
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-stage text-stage-ink">
      {/* Header */}
      <div className="border-b border-stage-rule px-4 py-4">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
          <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:gap-4">
            <div className="font-display text-xl font-bold sm:text-2xl">{poll.datasetName}</div>
            <div className="font-outlier text-sm tabular-nums text-stage-muted sm:text-base">
              Round {poll.currentRound}/{poll.totalRounds}
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-stage-muted sm:text-base">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span>
              <span className="font-outlier tabular-nums">{connectedPlayerCount}</span> oyuncu
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="mx-auto max-w-6xl">
          {/* Waiting State */}
          {poll.status === "waiting" && (
            <div className="max-w-2xl border-t-2 border-stage-ink pt-6">
              <h2 className="mb-4 font-display text-3xl font-bold sm:text-5xl">
                Oylama Başlamayı Bekliyor...
              </h2>
              <p className="text-lg text-stage-muted sm:text-xl">
                Host oylamayı başlattığında eşleşmeler görünecek
              </p>
            </div>
          )}

          {/* Playing State */}
          {poll.status === "playing" && currentMatch && (
            <div className="space-y-6">
              {/* Match Info */}
              <div className="border-b border-stage-rule pb-4">
                <div className="mb-1 font-outlier text-sm tabular-nums text-stage-muted sm:text-base">
                  Rounds of {poll.bracketSize} - Match {currentMatch.matchNumber + 1}
                </div>
                <h2 className="font-display text-3xl font-bold md:text-5xl">
                  Round {poll.currentRound}
                </h2>
              </div>

              {/* VS Matchup */}
              <div className="relative grid grid-cols-1 items-stretch gap-4 sm:gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                {/* Item 1 */}
                {renderChoice("item1", currentMatch.item1, "bg-mark-blue", "A")}

                {/* VS Divider */}
                <div className="absolute left-1/2 top-1/2 z-raised hidden -translate-x-1/2 -translate-y-1/2 md:block">
                  <div className="rounded border-2 border-stage-ink bg-stage px-5 py-2 font-display text-3xl font-bold text-stage-ink">
                    VS
                  </div>
                </div>

                {/* VS Divider Mobile */}
                <div className="flex items-center justify-center md:hidden">
                  <div className="rounded border-2 border-stage-ink bg-stage px-5 py-1 font-display text-2xl font-bold text-stage-ink">
                    VS
                  </div>
                </div>

                {/* Item 2 */}
                {renderChoice("item2", currentMatch.item2, "bg-mark-red", "B")}
              </div>

              {/* Voting Status */}
              {hasVoted && (
                <div className="flex items-start gap-4 border-t-2 border-stage-ink pt-4">
                  <Check className="mt-1 h-8 w-8 shrink-0" aria-hidden="true" />
                  <div>
                    <h3 className="font-display text-xl font-bold sm:text-2xl">
                      Oyunuz Kaydedildi!
                    </h3>
                    <p className="text-sm text-stage-muted sm:text-base">
                      Diğer oyuncuları bekleyin
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Round Review State */}
          {poll.status === "round_review" && currentMatch && (
            <div className="space-y-6">
              <div className="rounded-lg bg-warning p-6 text-ink sm:p-10">
                <div className="mb-3 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-ink font-outlier text-lg font-bold"
                    aria-hidden="true"
                  >
                    {currentMatch.winner?.id === currentMatch.item1.id ? "A" : "B"}
                  </span>
                  <Trophy className="h-8 w-8" aria-hidden="true" />
                </div>
                <h2 className="mb-4 break-words font-display text-3xl font-bold md:text-5xl">
                  Kazanan: {currentMatch.winner?.name}
                </h2>
                <div className="flex flex-col gap-2 text-lg sm:flex-row sm:items-center sm:gap-8 sm:text-2xl">
                  <div>
                    {currentMatch.item1.name}: <span className="font-outlier font-bold tabular-nums">{currentMatch.votes.item1}</span> oy
                  </div>
                  <div className="text-base">vs</div>
                  <div>
                    {currentMatch.item2.name}: <span className="font-outlier font-bold tabular-nums">{currentMatch.votes.item2}</span> oy
                  </div>
                </div>
              </div>

              <div className="text-sm text-stage-muted sm:text-base">
                Sonraki eşleşmeyi bekleyin...
              </div>
            </div>
          )}

          {/* Finished State */}
          {poll.status === "finished" && poll.winner && (
            <div className="space-y-6">
              <div className="rounded-lg bg-warning p-6 text-ink sm:p-10">
                <div className="mb-4 flex items-center gap-3">
                  <Trophy className="h-10 w-10 sm:h-14 sm:w-14" aria-hidden="true" />
                  <h2 className="font-display text-4xl font-bold sm:text-5xl">
                    Kazanan!
                  </h2>
                </div>
                <div className="max-w-md">
                  <div className="relative mb-6 aspect-square overflow-hidden rounded-lg border-2 border-ink">
                    <img
                      src={poll.winner.imageUrl}
                      alt={poll.winner.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="mb-2 break-words font-display text-3xl font-bold sm:text-4xl">
                    {poll.winner.name}
                  </div>
                  {poll.winner.description && (
                    <div className="text-lg sm:text-xl">
                      {poll.winner.description}
                    </div>
                  )}
                </div>
              </div>
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
