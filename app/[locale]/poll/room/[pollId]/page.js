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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-sm p-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <div className="text-white font-bold text-xl sm:text-2xl">{poll.datasetName}</div>
            <div className="text-gray-400 text-sm sm:text-base">
              Round {poll.currentRound}/{poll.totalRounds}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-gray-400 text-sm sm:text-base">
              👥 {connectedPlayerCount} oyuncu
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Waiting State */}
          {poll.status === "waiting" && (
            <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/20 text-center">
              <div className="text-4xl sm:text-6xl mb-6">⏳</div>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                Oylama Başlamayı Bekliyor...
              </h2>
              <p className="text-lg sm:text-xl text-gray-300">
                Host oylamayı başlattığında eşleşmeler görünecek
              </p>
            </div>
          )}

          {/* Playing State */}
          {poll.status === "playing" && currentMatch && (
            <div className="space-y-6">
              {/* Match Info */}
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-4 sm:p-6 border border-white/20 text-center">
                <div className="text-white/70 text-sm sm:text-base mb-2">
                  Rounds of {poll.bracketSize} - Match {currentMatch.matchNumber + 1}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white">
                  Round {poll.currentRound}
                </h2>
              </div>

              {/* VS Matchup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
                {/* Item 1 */}
                <button
                  onClick={() => handleVote("item1")}
                  disabled={hasVoted}
                  className={`
                    group relative bg-white/10 backdrop-blur-lg rounded-3xl border-2 overflow-hidden
                    transition-all duration-300
                    ${hasVoted && selectedChoice === "item1"
                      ? "border-blue-500 ring-4 ring-blue-500/50 scale-105"
                      : hasVoted
                      ? "border-white/20 opacity-60"
                      : "border-white/20 hover:border-blue-500 hover:scale-105 cursor-pointer"}
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="aspect-square relative">
                    <img
                      src={currentMatch.item1.imageUrl}
                      alt={currentMatch.item1.name}
                      className="w-full h-full object-cover"
                    />
                    {hasVoted && selectedChoice === "item1" && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="text-6xl">✓</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 bg-gradient-to-t from-blue-600/90 to-blue-500/90">
                    <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {currentMatch.item1.name}
                    </div>
                    {currentMatch.item1.description && (
                      <div className="text-xs sm:text-sm text-white/80">
                        {currentMatch.item1.description}
                      </div>
                    )}
                    {hasVoted && (
                      <div className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                        {currentMatch.votes.item1} oy
                      </div>
                    )}
                  </div>
                </button>

                {/* VS Divider */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white font-bold text-3xl sm:text-4xl px-6 sm:px-8 py-3 sm:py-4 rounded-full shadow-lg border-4 border-white/20">
                    VS
                  </div>
                </div>

                {/* VS Divider Mobile */}
                <div className="md:hidden flex items-center justify-center -my-2">
                  <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-red-500 text-white font-bold text-2xl px-6 py-2 rounded-full shadow-lg border-4 border-white/20">
                    VS
                  </div>
                </div>

                {/* Item 2 */}
                <button
                  onClick={() => handleVote("item2")}
                  disabled={hasVoted}
                  className={`
                    group relative bg-white/10 backdrop-blur-lg rounded-3xl border-2 overflow-hidden
                    transition-all duration-300
                    ${hasVoted && selectedChoice === "item2"
                      ? "border-red-500 ring-4 ring-red-500/50 scale-105"
                      : hasVoted
                      ? "border-white/20 opacity-60"
                      : "border-white/20 hover:border-red-500 hover:scale-105 cursor-pointer"}
                    disabled:cursor-not-allowed
                  `}
                >
                  <div className="aspect-square relative">
                    <img
                      src={currentMatch.item2.imageUrl}
                      alt={currentMatch.item2.name}
                      className="w-full h-full object-cover"
                    />
                    {hasVoted && selectedChoice === "item2" && (
                      <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                        <div className="text-6xl">✓</div>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-6 bg-gradient-to-t from-red-600/90 to-red-500/90">
                    <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                      {currentMatch.item2.name}
                    </div>
                    {currentMatch.item2.description && (
                      <div className="text-xs sm:text-sm text-white/80">
                        {currentMatch.item2.description}
                      </div>
                    )}
                    {hasVoted && (
                      <div className="mt-3 text-2xl sm:text-3xl font-bold text-white">
                        {currentMatch.votes.item2} oy
                      </div>
                    )}
                  </div>
                </button>
              </div>

              {/* Voting Status */}
              {hasVoted && (
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 sm:p-8 border border-white/20 text-center">
                  <div className="text-4xl sm:text-6xl mb-4">✓</div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                    Oyunuz Kaydedildi!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-300">
                    Diğer oyuncuları bekleyin
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Round Review State */}
          {poll.status === "round_review" && currentMatch && (
            <div className="space-y-6">
              <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border border-white/20 text-center">
                <div className="text-4xl sm:text-6xl mb-6">
                  {currentMatch.winner?.id === currentMatch.item1.id ? "🔵" : "🔴"}
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
                  Kazanan: {currentMatch.winner?.name}
                </h2>
                <div className="flex items-center justify-center gap-4 sm:gap-8 text-lg sm:text-2xl text-white">
                  <div>
                    {currentMatch.item1.name}: {currentMatch.votes.item1} oy
                  </div>
                  <div className="text-white/50">vs</div>
                  <div>
                    {currentMatch.item2.name}: {currentMatch.votes.item2} oy
                  </div>
                </div>
              </div>

              <div className="text-center text-gray-300 text-sm sm:text-base">
                Sonraki eşleşmeyi bekleyin...
              </div>
            </div>
          )}

          {/* Finished State */}
          {poll.status === "finished" && poll.winner && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-lg rounded-3xl p-8 sm:p-12 border-2 border-yellow-500 text-center">
                <div className="text-6xl sm:text-8xl mb-6">🏆</div>
                <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
                  Kazanan!
                </h2>
                <div className="max-w-md mx-auto">
                  <div className="aspect-square relative rounded-2xl overflow-hidden mb-6">
                    <img
                      src={poll.winner.imageUrl}
                      alt={poll.winner.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-3xl sm:text-4xl font-bold text-yellow-400 mb-2">
                    {poll.winner.name}
                  </div>
                  {poll.winner.description && (
                    <div className="text-lg sm:text-xl text-white/80">
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
        theme="dark"
      />
    </div>
  );
}
