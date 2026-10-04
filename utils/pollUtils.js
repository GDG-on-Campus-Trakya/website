import { ref, set, get, update, remove, onValue, off } from "firebase/database";
import { collection, addDoc, Timestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { realtimeDb } from "../lib/firebase/database";
import { logger } from "./logger";

/**
 * Generate a unique 6-digit poll code
 */
export const generatePollCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate tournament bracket from items
 * @param {Array} items - Array of poll items
 * @param {number} bracketSize - Tournament size (8, 16, 32, 64, 128)
 * @returns {Array} Tournament bracket matchups
 */
export const generateBracket = (items, bracketSize) => {
  // Shuffle and select items
  const shuffled = [...items].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, bracketSize);

  // Create initial matchups (Round 1)
  const matchups = [];
  for (let i = 0; i < selected.length; i += 2) {
    matchups.push({
      roundNumber: 1,
      matchNumber: matchups.length,
      item1: selected[i],
      item2: selected[i + 1],
      votes: {
        item1: 0,
        item2: 0
      },
      voters: {},
      winner: null
    });
  }

  return matchups;
};

/**
 * Calculate total number of rounds
 * @param {number} bracketSize - Tournament size
 * @returns {number} Number of rounds
 */
export const calculateTotalRounds = (bracketSize) => {
  return Math.log2(bracketSize);
};

/**
 * Create next round matchups from winners
 * @param {Array} currentRoundMatchups - Current round matchups with winners
 * @param {number} nextRoundNumber - Next round number
 * @param {number} startMatchNumber - Starting match number for this round
 * @returns {Array} Next round matchups
 */
export const createNextRound = (currentRoundMatchups, nextRoundNumber, startMatchNumber = 0) => {
  const winners = currentRoundMatchups.map(m => m.winner).filter(w => w !== null);

  const nextMatchups = [];
  for (let i = 0; i < winners.length; i += 2) {
    nextMatchups.push({
      roundNumber: nextRoundNumber,
      matchNumber: startMatchNumber + nextMatchups.length,
      item1: winners[i],
      item2: winners[i + 1],
      votes: {
        item1: 0,
        item2: 0
      },
      voters: {},
      winner: null
    });
  }

  return nextMatchups;
};

/**
 * Create a new poll session
 * @param {Object} pollData - Poll configuration
 * @returns {Promise<string>} Poll ID
 */
export const createPoll = async (pollData) => {
  const pollCode = generatePollCode();
  const pollId = `poll_${Date.now()}_${pollCode}`;
  const pollRef = ref(realtimeDb, `polls/${pollId}`);

  const totalRounds = calculateTotalRounds(pollData.bracketSize);
  const initialMatchups = generateBracket(pollData.items, pollData.bracketSize);

  const poll = {
    pollCode,
    datasetName: pollData.datasetName,
    datasetDescription: pollData.datasetDescription || "",
    bracketSize: pollData.bracketSize,
    hostId: pollData.hostId,
    hostName: pollData.hostName,

    // All matchups for all rounds
    allMatchups: initialMatchups,

    // Current state
    status: "waiting", // waiting, playing, round_review, finished
    currentRound: 1,
    currentMatchIndex: 0,
    totalRounds,
    matchStartedAt: null,

    // Metadata
    createdAt: Date.now(),
    players: {},

    // Final winner
    winner: null
  };

  await set(pollRef, poll);
  return pollId;
};

/**
 * @param {string} pollCode - 6-digit poll code
 * @returns {Promise<Object|null>} Poll data with ID
 */
export const findPollByCode = async (pollCode) => {
  try {
    const pollsRef = ref(realtimeDb, 'polls');
    const snapshot = await get(pollsRef);

    if (!snapshot.exists()) return null;

    const polls = snapshot.val();

    // Optimize: Early return if no polls
    if (!polls || typeof polls !== 'object') return null;

    // Optimize: Use for...of instead of find for better performance
    const entries = Object.entries(polls);
    for (const [id, poll] of entries) {
      if (poll && poll.pollCode === pollCode) {
        return {
          id,
          ...poll
        };
      }
    }

    return null;
  } catch (error) {
    logger.error('Error finding poll by code:', error);
    return null;
  }
};

/**
 * Add player to poll
 * @param {string} pollId - Poll ID
 * @param {Object} playerData - Player information
 * @returns {Promise<string>} Player ID
 */
export const addPlayerToPoll = async (pollId, playerData) => {
  const playerId = `player_${playerData.userId}`;
  const playerRef = ref(realtimeDb, `polls/${pollId}/players/${playerId}`);

  const player = {
    ...playerData,
    joinedAt: Date.now(),
    isConnected: true,
    votedMatches: {} // matchNumber -> choice
  };

  await set(playerRef, player);
  return playerId;
};

/**
 * Update poll status
 * @param {string} pollId - Poll ID
 * @param {string} status - New status
 */
export const updatePollStatus = async (pollId, status) => {
  const statusRef = ref(realtimeDb, `polls/${pollId}/status`);
  await set(statusRef, status);
};

/**
 * Start current match
 * @param {string} pollId - Poll ID
 */
export const startCurrentMatch = async (pollId) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);
  await update(pollRef, {
    status: "playing",
    matchStartedAt: Date.now()
  });
};

/**
 * Submit vote for current match
 * @param {string} pollId - Poll ID
 * @param {string} playerId - Player ID
 * @param {number} matchIndex - Match index in allMatchups
 * @param {string} choice - "item1" or "item2"
 */
export const submitVote = async (pollId, playerId, matchIndex, choice) => {
  const voteRef = ref(realtimeDb, `polls/${pollId}/allMatchups/${matchIndex}/voters/${playerId}`);
  await set(voteRef, choice);

  // Increment vote count
  const voteCountRef = ref(realtimeDb, `polls/${pollId}/allMatchups/${matchIndex}/votes/${choice}`);
  const snapshot = await get(voteCountRef);
  const currentVotes = snapshot.val() || 0;
  await set(voteCountRef, currentVotes + 1);

  // Update player's voted matches
  const playerVotedRef = ref(realtimeDb, `polls/${pollId}/players/${playerId}/votedMatches/${matchIndex}`);
  await set(playerVotedRef, choice);
};

/**
 * Check if all connected players have voted
 * @param {string} pollId - Poll ID
 * @param {number} matchIndex - Current match index
 * @returns {Promise<boolean>}
 */
export const allPlayersVoted = async (pollId, matchIndex) => {
  const playersRef = ref(realtimeDb, `polls/${pollId}/players`);
  const playersSnapshot = await get(playersRef);

  if (!playersSnapshot.exists()) return true;

  const players = playersSnapshot.val();
  const connectedPlayers = Object.values(players).filter(p => p.isConnected);

  if (connectedPlayers.length === 0) return true;

  const matchRef = ref(realtimeDb, `polls/${pollId}/allMatchups/${matchIndex}/voters`);
  const votersSnapshot = await get(matchRef);

  if (!votersSnapshot.exists()) return false;

  const voters = Object.keys(votersSnapshot.val());
  const connectedPlayerIds = Object.keys(players).filter(id => players[id].isConnected);

  return connectedPlayerIds.every(id => voters.includes(id));
};

/**
 * Determine winner of current match and update
 * @param {string} pollId - Poll ID
 * @param {number} matchIndex - Match index
 * @returns {Promise<Object>} Winner item
 */
export const determineMatchWinner = async (pollId, matchIndex) => {
  const matchRef = ref(realtimeDb, `polls/${pollId}/allMatchups/${matchIndex}`);
  const snapshot = await get(matchRef);

  if (!snapshot.exists()) return null;

  const match = snapshot.val();
  const winner = match.votes.item1 > match.votes.item2 ? match.item1 : match.item2;

  // Set winner
  await update(matchRef, { winner });

  return winner;
};

/**
 * Move to next match
 * @param {string} pollId - Poll ID
 * @returns {Promise<Object>} Status object
 */
export const nextMatch = async (pollId) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);
  const snapshot = await get(pollRef);

  if (!snapshot.exists()) return { ended: true };

  const poll = snapshot.val();
  const currentRoundMatchups = poll.allMatchups.filter(m => m.roundNumber === poll.currentRound);
  const nextMatchIndex = poll.currentMatchIndex + 1;

  // Check if current round is finished
  if (nextMatchIndex >= currentRoundMatchups[currentRoundMatchups.length - 1].matchNumber + 1) {
    // Round finished, check if tournament is finished
    if (poll.currentRound >= poll.totalRounds) {
      // Tournament finished
      const finalMatch = poll.allMatchups[poll.allMatchups.length - 1];
      await update(pollRef, {
        status: "finished",
        winner: finalMatch.winner
      });
      return { ended: true, finished: true };
    } else {
      // Move to next round
      return { needsNextRound: true };
    }
  }

  // Move to next match in same round
  await update(pollRef, {
    currentMatchIndex: nextMatchIndex,
    matchStartedAt: Date.now(),
    status: "playing"
  });

  return { continues: true };
};

/**
 * Advance to next round
 * @param {string} pollId - Poll ID
 */
export const advanceToNextRound = async (pollId) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);
  const snapshot = await get(pollRef);

  if (!snapshot.exists()) return;

  const poll = snapshot.val();
  const currentRoundMatchups = poll.allMatchups.filter(m => m.roundNumber === poll.currentRound);
  const nextRoundNumber = poll.currentRound + 1;

  // Calculate starting match number for next round (after all current matches)
  const startMatchNumber = poll.allMatchups.length;

  // Create next round matchups with correct match numbers
  const nextRoundMatchups = createNextRound(currentRoundMatchups, nextRoundNumber, startMatchNumber);

  // Add to all matchups
  const updatedAllMatchups = [...poll.allMatchups, ...nextRoundMatchups];

  await update(pollRef, {
    allMatchups: updatedAllMatchups,
    currentRound: nextRoundNumber,
    currentMatchIndex: nextRoundMatchups[0].matchNumber,
    matchStartedAt: Date.now(),
    status: "playing"
  });
};

/**
 * Get current match
 * @param {Object} poll - Poll data
 * @returns {Object|null} Current match
 */
export const getCurrentMatch = (poll) => {
  if (!poll || !poll.allMatchups) return null;
  return poll.allMatchups[poll.currentMatchIndex] || null;
};

/**
 * Get matches for a specific round
 * @param {Object} poll - Poll data
 * @param {number} roundNumber - Round number
 * @returns {Array} Matches in that round
 */
export const getMatchesForRound = (poll, roundNumber) => {
  if (!poll || !poll.allMatchups) return [];
  return poll.allMatchups.filter(m => m.roundNumber === roundNumber);
};

/**
 * Save poll results to Firestore
 * @param {string} pollId - Poll ID
 * @returns {Promise<string>} Result document ID
 */
export const savePollResults = async (pollId) => {
  try {
    const pollRef = ref(realtimeDb, `polls/${pollId}`);
    const snapshot = await get(pollRef);

    if (!snapshot.exists()) {
      throw new Error("Poll not found");
    }

    const poll = snapshot.val();
    const players = poll.players || {};

    // Calculate participation stats
    const playerStats = Object.entries(players).map(([id, player]) => ({
      userId: player.userId,
      name: player.name,
      email: player.email,
      faculty: player.faculty || "",
      department: player.department || "",
      totalVotes: Object.keys(player.votedMatches || {}).length,
      joinedAt: player.joinedAt
    }));

    // Get all matchups with results
    const allMatchResults = poll.allMatchups.map(match => ({
      roundNumber: match.roundNumber,
      matchNumber: match.matchNumber,
      item1: {
        name: match.item1.name,
        imageUrl: match.item1.imageUrl,
        votes: match.votes.item1
      },
      item2: {
        name: match.item2.name,
        imageUrl: match.item2.imageUrl,
        votes: match.votes.item2
      },
      winner: match.winner ? {
        name: match.winner.name,
        imageUrl: match.winner.imageUrl
      } : null,
      totalVotes: match.votes.item1 + match.votes.item2
    }));

    const resultData = {
      pollId,
      pollCode: poll.pollCode,
      datasetName: poll.datasetName,
      datasetDescription: poll.datasetDescription,
      hostId: poll.hostId,
      hostName: poll.hostName,

      // Tournament info
      bracketSize: poll.bracketSize,
      totalRounds: poll.totalRounds,
      createdAt: Timestamp.fromMillis(poll.createdAt),
      finishedAt: Timestamp.now(),
      duration: Date.now() - poll.createdAt,

      // Winner
      winner: poll.winner ? {
        name: poll.winner.name,
        imageUrl: poll.winner.imageUrl,
        description: poll.winner.description
      } : null,

      // All matches
      matches: allMatchResults,

      // Player stats
      players: playerStats,
      totalPlayers: playerStats.length,

      // Stats
      stats: {
        totalMatches: poll.allMatchups.length,
        averageVotesPerMatch: poll.allMatchups.reduce((sum, m) =>
          sum + m.votes.item1 + m.votes.item2, 0) / poll.allMatchups.length || 0
      }
    };

    const resultsRef = collection(db, "pollResults");
    const docRef = await addDoc(resultsRef, resultData);

    // logger.log("Poll results saved to Firestore:", docRef.id);
    return docRef.id;
  } catch (error) {
    logger.error("Error saving poll results:", error);
    throw error;
  }
};

/**
 * End poll and save results
 * @param {string} pollId - Poll ID
 */
export const endPoll = async (pollId) => {
  await updatePollStatus(pollId, "finished");

  try {
    await savePollResults(pollId);

    // Clean up Realtime DB after successful save to Firestore
    // Wait a bit to ensure clients can see final state
    setTimeout(async () => {
      try {
        await deletePoll(pollId);
        // logger.log(`Poll ${pollId} cleaned up from Realtime DB`);
      } catch (error) {
        logger.error("Failed to cleanup poll from Realtime DB:", error);
      }
    }, 30000); // Wait 30 seconds before cleanup
  } catch (error) {
    logger.error("Failed to save poll results:", error);
  }
};

/**
 * Delete poll (cleanup)
 * @param {string} pollId - Poll ID
 */
export const deletePoll = async (pollId) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);
  await remove(pollRef);
};

/**
 * Subscribe to poll updates
 * @param {string} pollId - Poll ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPoll = (pollId, callback) => {
  const pollRef = ref(realtimeDb, `polls/${pollId}`);

  onValue(pollRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: pollId, ...snapshot.val() });
    } else {
      callback(null);
    }
  });

  return () => off(pollRef);
};

/**
 * Subscribe to players updates
 * @param {string} pollId - Poll ID
 * @param {Function} callback - Callback function
 * @returns {Function} Unsubscribe function
 */
export const subscribeToPlayers = (pollId, callback) => {
  const playersRef = ref(realtimeDb, `polls/${pollId}/players`);

  onValue(playersRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    } else {
      callback({});
    }
  });

  return () => off(playersRef);
};

/**
 * Update player connection status
 * @param {string} pollId - Poll ID
 * @param {string} playerId - Player ID
 * @param {boolean} isConnected - Connection status
 */
export const updatePlayerConnection = async (pollId, playerId, isConnected) => {
  const connectionRef = ref(realtimeDb, `polls/${pollId}/players/${playerId}/isConnected`);
  await set(connectionRef, isConnected);
};

/**
 * Get poll results from Firestore
 * @param {number} limitCount - Number of results to fetch
 * @returns {Promise<Array>} Poll results
 */
export const getPollResults = async (limitCount = 20) => {
  try {
    const resultsRef = collection(db, "pollResults");
    const q = query(resultsRef, orderBy("finishedAt", "desc"), limit(limitCount));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    logger.error("Error fetching poll results:", error);
    return [];
  }
};
