"use client";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/firebase";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-white">Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <p className="text-lg text-red-500">Giriş yapmalısınız!</p>
      </div>
    );
  }

  const connectedPlayerCount = Object.values(players).filter(p => p.isConnected).length;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white">{poll.datasetName}</h1>
              <p className="text-gray-400 text-sm sm:text-base">
                Host Paneli - Round {poll.currentRound}/{poll.totalRounds}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-gray-400 text-sm sm:text-base">
                👥 {connectedPlayerCount} oyuncu
              </div>
              <button
                onClick={() => router.push("/admin/poll")}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm sm:text-base"
              >
                Admin Panel
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Waiting State */}
            {poll.status === "waiting" && (
              <div className="bg-gray-800 rounded-xl p-6 sm:p-8 border border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-6">
                  Oyuncular Bekleniyor...
                </h2>

                <div className="space-y-4">
                  <div className="bg-gray-700/50 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Poll Kodu:</div>
                    <div className="text-4xl sm:text-5xl font-bold text-white tracking-widest">
                      {pollCode}
                    </div>
                  </div>

                  <button
                    onClick={handleStartPoll}
                    disabled={connectedPlayerCount === 0}
                    className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold disabled:opacity-50 disabled:cursor-not-allowed text-base sm:text-lg"
                  >
                    Poll'u Başlat
                  </button>

                  {connectedPlayerCount === 0 && (
                    <p className="text-sm text-gray-400 text-center">
                      En az 1 oyuncu bekleniyor
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Playing State */}
            {poll.status === "playing" && currentMatch && (
              <div className="space-y-6">
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl sm:text-2xl font-bold text-white">
                      Eşleşme #{currentMatch.matchNumber + 1}
                    </h2>
                    <div className="text-gray-400 text-sm sm:text-base">
                      Round {poll.currentRound}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:gap-6">
                    <div className="bg-blue-500/20 border-2 border-blue-500 rounded-lg p-4">
                      <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
                        <img
                          src={currentMatch.item1.imageUrl}
                          alt={currentMatch.item1.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white mb-2 text-sm sm:text-base">
                          {currentMatch.item1.name}
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                          {currentMatch.votes.item1}
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/20 border-2 border-red-500 rounded-lg p-4">
                      <div className="aspect-square relative rounded-lg overflow-hidden mb-3">
                        <img
                          src={currentMatch.item2.imageUrl}
                          alt={currentMatch.item2.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-white mb-2 text-sm sm:text-base">
                          {currentMatch.item2.name}
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-red-400">
                          {currentMatch.votes.item2}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-400 text-sm sm:text-base">Oy Durumu</span>
                      <span className="text-white text-sm sm:text-base">
                        {currentMatch.votes.item1 + currentMatch.votes.item2} / {connectedPlayerCount}
                      </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-pink-600 h-3 rounded-full transition-all"
                        style={{
                          width: `${((currentMatch.votes.item1 + currentMatch.votes.item2) / Math.max(connectedPlayerCount, 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleShowResults}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-bold text-base sm:text-lg"
                >
                  Sonuçları Göster
                </button>
              </div>
            )}

            {/* Round Review State */}
            {poll.status === "round_review" && currentMatch && (
              <div className="space-y-6">
                <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-xl p-6 sm:p-8">
                  <div className="text-center mb-6">
                    <div className="text-4xl sm:text-6xl mb-4">
                      {currentMatch.winner?.id === currentMatch.item1.id ? "🔵" : "🔴"}
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Kazanan!</h2>
                    <div className="text-xl sm:text-2xl text-yellow-400 font-bold">
                      {currentMatch.winner?.name}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-gray-400 text-xs sm:text-sm">{currentMatch.item1.name}</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {currentMatch.votes.item1}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs sm:text-sm">{currentMatch.item2.name}</div>
                      <div className="text-xl sm:text-2xl font-bold text-white">
                        {currentMatch.votes.item2}
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNextMatch}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-bold text-base sm:text-lg"
                >
                  {poll.currentRound >= poll.totalRounds &&
                  poll.currentMatchIndex >= poll.allMatchups.filter(m => m.roundNumber === poll.currentRound).length - 1
                    ? "Poll'u Bitir"
                    : "Sonraki Eşleşme"}
                </button>
              </div>
            )}

            {/* Finished State */}
            {poll.status === "finished" && poll.winner && (
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500 rounded-xl p-8 sm:p-12">
                <div className="text-center">
                  <div className="text-6xl sm:text-8xl mb-6">🏆</div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                    Kazanan!
                  </h2>
                  <div className="max-w-sm mx-auto">
                    <div className="aspect-square relative rounded-2xl overflow-hidden mb-6">
                      <img
                        src={poll.winner.imageUrl}
                        alt={poll.winner.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-2xl sm:text-3xl font-bold text-yellow-400">
                      {poll.winner.name}
                    </div>
                  </div>
                  <button
                    onClick={() => router.push("/admin/poll")}
                    className="mt-8 px-6 sm:px-8 py-3 sm:py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-base sm:text-lg"
                  >
                    Admin Paneline Dön
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* QR Code */}
            {poll.status !== "finished" && (
              <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                <div className="mt-4 text-center">
                  <div className="text-sm text-gray-400 mb-2">Poll Kodu:</div>
                  <div className="text-3xl font-bold text-white tracking-widest">
                    {pollCode}
                  </div>
                </div>
              </div>
            )}

            {/* Players List */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-bold text-white mb-4">
                Oyuncular ({connectedPlayerCount})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.values(players)
                  .filter(p => p.isConnected)
                  .map(player => (
                    <div
                      key={player.userId}
                      className="flex items-center gap-3 p-3 bg-gray-700/50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold text-sm truncate">
                          {player.name}
                        </div>
                        <div className="text-xs text-gray-400 truncate">
                          {player.email}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Danger Zone */}
            {poll.status !== "finished" && (
              <div className="bg-red-500/10 border border-red-500 rounded-xl p-6">
                <h3 className="text-lg font-bold text-red-500 mb-4">Tehlikeli Bölge</h3>
                <button
                  onClick={handleEndPoll}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold text-sm sm:text-base"
                >
                  Poll'u Sonlandır
                </button>
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
        theme="dark"
      />
    </div>
  );
}
