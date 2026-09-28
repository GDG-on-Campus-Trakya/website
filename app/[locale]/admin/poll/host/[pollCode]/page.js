"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logger } from "@/utils/logger";
import {
  findPollByCode,
  subscribeToPoll,
  subscribeToPlayers,
  startCurrentMatch,
  allPlayersVoted,
  determineMatchWinner,
  nextMatch,
  advanceToNextRound,
  getCurrentMatch,
  endPoll,
  updatePollStatus
} from "@/utils/pollUtils";

export default function PollHostPage() {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();
  const params = useParams();
  const pollCode = params.pollCode;

  const [poll, setPoll] = useState(null);
  const [pollId, setPollId] = useState(null);
  const [players, setPlayers] = useState({});
  const [currentMatch, setCurrentMatch] = useState(null);
  const [checkingVotes, setCheckingVotes] = useState(false);

  useEffect(() => {
    if (!pollCode) return;

    const loadPoll = async () => {
      const pollData = await findPollByCode(pollCode);
      if (!pollData) {
        toast.error("Poll bulunamadı!");
        router.push("/admin/poll");
        return;
      }

      setPollId(pollData.id);
    };

    loadPoll();
  }, [pollCode, router]);

  useEffect(() => {
    if (!pollId) return;

    const unsubscribePoll = subscribeToPoll(pollId, (pollData) => {
      if (!pollData) return;
      setPoll(pollData);

      const match = getCurrentMatch(pollData);
      setCurrentMatch(match);
    });

    const unsubscribePlayers = subscribeToPlayers(pollId, setPlayers);

    return () => {
      unsubscribePoll();
      unsubscribePlayers();
    };
  }, [pollId]);

  // Auto-check if all players voted
  useEffect(() => {
    if (!poll || !pollId || poll.status !== "playing" || checkingVotes) return;

    const interval = setInterval(async () => {
      const allVoted = await allPlayersVoted(pollId, poll.currentMatchIndex);
      if (allVoted) {
        await handleShowResults();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [poll, pollId, checkingVotes]);

  const handleStartPoll = async () => {
    try {
      await startCurrentMatch(pollId);
      toast.success("Poll başlatıldı!");
    } catch (error) {
      logger.error("Error starting poll:", error);
      toast.error("Poll başlatılırken hata oluştu!");
    }
  };

  const handleShowResults = async () => {
    setCheckingVotes(true);
    try {
      // Determine winner of current match
      await determineMatchWinner(pollId, poll.currentMatchIndex);

      // Show round review
      await updatePollStatus(pollId, "round_review");

      toast.success("Sonuçlar gösteriliyor!");
    } catch (error) {
      logger.error("Error showing results:", error);
      toast.error("Sonuçlar gösterilirken hata oluştu!");
    }
    setCheckingVotes(false);
  };

  const handleNextMatch = async () => {
    try {
      const result = await nextMatch(pollId);

      if (result.finished) {
        toast.success("Poll tamamlandı!");
        await endPoll(pollId);
      } else if (result.needsNextRound) {
        toast.info("Raund tamamlandı! Sonraki raunda geçiliyor...");
        await advanceToNextRound(pollId);
        toast.success("Sonraki raund başladı!");
      } else if (result.continues) {
        toast.success("Sonraki eşleşme!");
      }
    } catch (error) {
      logger.error("Error moving to next match:", error);
      toast.error("Sonraki eşleşmeye geçilirken hata oluştu!");
    }
  };

  const handleEndPoll = async () => {
    if (!confirm("Poll'u sonlandırmak istediğinizden emin misiniz?")) return;

    try {
      await endPoll(pollId);
      toast.success("Poll sonlandırıldı!");
    } catch (error) {
      logger.error("Error ending poll:", error);
      toast.error("Poll sonlandırılırken hata oluştu!");
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

  const stageButton =
    "border border-stage-rule bg-transparent text-stage-ink hover:bg-stage-2";

  const renderCandidate = (item, votes, tone, letter) => (
    <div className="min-w-0 overflow-hidden rounded-lg border-2 border-stage-rule bg-stage">
      <div className="relative aspect-square w-full">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </div>
      <div className={`flex items-center gap-3 p-4 text-ink ${tone}`}>
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded border-2 border-ink font-outlier text-base font-bold"
          aria-hidden="true"
        >
          {letter}
        </span>
        <div className="min-w-0 flex-1 break-words font-display text-sm font-bold sm:text-base">
          {item.name}
        </div>
        <div className="font-outlier text-3xl font-bold tabular-nums sm:text-5xl">
          {votes}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-[calc(100dvh-4rem)] bg-stage text-stage-ink">
      {/* Header */}
      <div className="border-b border-stage-rule px-4 py-4 sm:px-6 sm:py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="min-w-0">
              <h1 className="break-words font-display text-3xl font-bold md:text-5xl">{poll.datasetName}</h1>
              <p className="mt-1 text-sm text-stage-muted sm:text-base">
                Host Paneli - Round <span className="font-outlier tabular-nums">{poll.currentRound}/{poll.totalRounds}</span>
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-stage-muted sm:text-base">
                <Users className="h-4 w-4" aria-hidden="true" />
                <span>
                  <span className="font-outlier tabular-nums">{connectedPlayerCount}</span> oyuncu
                </span>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push("/admin/poll")}
                className={stageButton}
              >
                Admin Panel
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl p-4 sm:p-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          {/* Main Content */}
          <div className="min-w-0 space-y-6">
            {/* Waiting State */}
            {poll.status === "waiting" && (
              <div className="border-t-2 border-stage-ink pt-6">
                <h2 className="mb-6 font-display text-2xl font-bold sm:text-3xl">
                  Oyuncular Bekleniyor...
                </h2>

                <div className="space-y-6">
                  <div>
                    <div className="mb-2 text-sm text-stage-muted">Poll Kodu:</div>
                    <div className="break-all font-outlier text-5xl font-bold tracking-widest sm:text-7xl">
                      {pollCode}
                    </div>
                  </div>

                  <Button
                    size="lg"
                    onClick={handleStartPoll}
                    disabled={connectedPlayerCount === 0}
                    className="w-full sm:w-auto sm:min-w-64"
                  >
                    Poll'u Başlat
                  </Button>

                  {connectedPlayerCount === 0 && (
                    <p className="text-sm text-stage-muted">
                      En az 1 oyuncu bekleniyor
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Playing State */}
            {poll.status === "playing" && currentMatch && (
              <div className="space-y-6">
                <div className="border-t-2 border-stage-ink pt-6">
                  <div className="mb-6 flex items-baseline justify-between gap-4">
                    <h2 className="font-display text-2xl font-bold sm:text-3xl">
                      Eşleşme #{currentMatch.matchNumber + 1}
                    </h2>
                    <div className="font-outlier text-sm tabular-nums text-stage-muted sm:text-base">
                      Round {poll.currentRound}
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 sm:gap-6">
                    {renderCandidate(currentMatch.item1, currentMatch.votes.item1, "bg-mark-blue", "A")}
                    {renderCandidate(currentMatch.item2, currentMatch.votes.item2, "bg-mark-red", "B")}
                  </div>

                  <div className="mt-6">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm text-stage-muted sm:text-base">Oy Durumu</span>
                      <span className="font-outlier text-sm tabular-nums sm:text-base">
                        {currentMatch.votes.item1 + currentMatch.votes.item2} / {connectedPlayerCount}
                      </span>
                    </div>
                    <div className="h-3 w-full rounded-sm bg-stage-2">
                      <div
                        className="h-3 rounded-sm bg-brand transition-[width]"
                        style={{
                          width: `${((currentMatch.votes.item1 + currentMatch.votes.item2) / Math.max(connectedPlayerCount, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleShowResults}
                  className="w-full sm:w-auto sm:min-w-64"
                >
                  Sonuçları Göster
                </Button>
              </div>
            )}

            {/* Round Review State */}
            {poll.status === "round_review" && currentMatch && (
              <div className="space-y-6">
                <div className="rounded-lg bg-warning p-6 text-ink sm:p-8">
                  <div className="mb-6">
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded border-2 border-ink font-outlier text-lg font-bold"
                        aria-hidden="true"
                      >
                        {currentMatch.winner?.id === currentMatch.item1.id ? "A" : "B"}
                      </span>
                      <Trophy className="h-8 w-8" aria-hidden="true" />
                    </div>
                    <h2 className="mb-2 font-display text-2xl font-bold sm:text-4xl">Kazanan!</h2>
                    <div className="break-words font-display text-xl font-bold sm:text-2xl">
                      {currentMatch.winner?.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4 border-t-2 border-ink pt-4">
                    <div className="min-w-0">
                      <div className="break-words text-xs sm:text-sm">{currentMatch.item1.name}</div>
                      <div className="font-outlier text-3xl font-bold tabular-nums sm:text-5xl">
                        {currentMatch.votes.item1}
                      </div>
                    </div>
                    <div className="min-w-0">
                      <div className="break-words text-xs sm:text-sm">{currentMatch.item2.name}</div>
                      <div className="font-outlier text-3xl font-bold tabular-nums sm:text-5xl">
                        {currentMatch.votes.item2}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  size="lg"
                  onClick={handleNextMatch}
                  className="w-full sm:w-auto sm:min-w-64"
                >
                  {poll.currentRound >= poll.totalRounds &&
                  poll.currentMatchIndex >= poll.allMatchups.filter(m => m.roundNumber === poll.currentRound).length - 1
                    ? "Poll'u Bitir"
                    : "Sonraki Eşleşme"}
                </Button>
              </div>
            )}

            {/* Finished State */}
            {poll.status === "finished" && poll.winner && (
              <div className="rounded-lg bg-warning p-6 text-ink sm:p-10">
                <div className="mb-4 flex items-center gap-3">
                  <Trophy className="h-10 w-10 sm:h-14 sm:w-14" aria-hidden="true" />
                  <h2 className="font-display text-3xl font-bold sm:text-5xl">
                    Kazanan!
                  </h2>
                </div>
                <div className="max-w-sm">
                  <div className="relative mb-6 aspect-square overflow-hidden rounded-lg border-2 border-ink">
                    <img
                      src={poll.winner.imageUrl}
                      alt={poll.winner.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="break-words font-display text-2xl font-bold sm:text-4xl">
                    {poll.winner.name}
                  </div>
                </div>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => router.push("/admin/poll")}
                  className="mt-8 border-ink"
                >
                  Admin Paneline Dön
                </Button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="min-w-0 space-y-8">
            {/* QR Code */}
            {poll.status !== "finished" && (
              <div className="border-t-2 border-stage-ink pt-4">
                <div className="mb-2 text-sm text-stage-muted">Poll Kodu:</div>
                <div className="break-all font-outlier text-4xl font-bold tracking-widest">
                  {pollCode}
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="border-t border-stage-rule pt-4">
              <h3 className="mb-4 font-display text-lg font-bold">
                Oyuncular (<span className="font-outlier tabular-nums">{connectedPlayerCount}</span>)
              </h3>
              <div className="max-h-96 overflow-y-auto">
                {Object.values(players)
                  .filter(p => p.isConnected)
                  .map(player => (
                    <div
                      key={player.userId}
                      className="flex items-center gap-3 border-b border-stage-rule py-3"
                    >
                      <div className="h-2 w-2 shrink-0 rounded-full bg-success" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">
                          {player.name}
                        </div>
                        <div className="truncate text-xs text-stage-muted">
                          {player.email}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Danger Zone */}
            {poll.status !== "finished" && (
              <div className="border-t border-error pt-4">
                <h3 className="mb-4 font-display text-lg font-bold">Tehlikeli Bölge</h3>
                <Button
                  variant="destructive"
                  onClick={handleEndPoll}
                  className="w-full"
                >
                  Poll'u Sonlandır
                </Button>
              </div>
            )}
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
