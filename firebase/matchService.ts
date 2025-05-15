// firebase/matchService.ts
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
  runTransaction,
} from "firebase/firestore";
import { db } from "./config";
import { MatchResult, PlayerStats, Player, TeamComposition } from "@/app/types";
import { calculateMatchMmrChanges } from "./mmrService";

// Reference to collections
const matchResultsCollection = collection(db, "matchResults");
const playersCollection = collection(db, "players");
const teamCompositionsCollection = collection(db, "teamCompositions");

// Helper function to calculate win rate with consistent rounding
const calculateWinRate = (wins: number, totalMatches: number): number => {
  if (totalMatches === 0) return 0;
  return Math.round((wins / totalMatches) * 100 * 10) / 10;
};

// Record a new match result and update player statistics
export const recordMatchResult = async (
  teamCompositionId: string,
  winningTeam: "team1" | "team2",
  scoreSummary?: string,
  notes?: string
): Promise<string> => {
  try {
    // Create match result
    const matchResult: MatchResult = {
      matchDate: new Date().toISOString(),
      teamCompositionId,
      winningTeam,
      scoreSummary,
      notes,
    };

    // First, get the team composition to identify participating players
    const teamCompRef = doc(teamCompositionsCollection, teamCompositionId);
    const teamCompSnap = await getDoc(teamCompRef);

    if (!teamCompSnap.exists()) {
      throw new Error("Team composition not found");
    }

    const teamComposition = teamCompSnap.data() as TeamComposition;

    // Calculate MMR changes for all players
    const { updatedTeam1, updatedTeam2, team1MmrChange, team2MmrChange } =
      calculateMatchMmrChanges(
        teamComposition.team1,
        teamComposition.team2,
        winningTeam
      );

    // Update matchResult with MMR changes
    matchResult.mmrChanges = {
      team1: team1MmrChange,
      team2: team2MmrChange,
    };

    // For transactional consistency, use a transaction to update all player stats
    await runTransaction(db, async (transaction) => {
      // Collect all player references and snapshots first (all reads)
      const playerRefsAndSnaps = [];

      // Add reads for team1 players
      for (const updatedPlayer of updatedTeam1) {
        if (updatedPlayer.id) {
          const playerRef = doc(playersCollection, updatedPlayer.id);
          const playerSnap = await transaction.get(playerRef);
          playerRefsAndSnaps.push({
            ref: playerRef,
            snap: playerSnap,
            updatedPlayer,
            isWinner: winningTeam === "team1",
          });
        }
      }

      // Add reads for team2 players
      for (const updatedPlayer of updatedTeam2) {
        if (updatedPlayer.id) {
          const playerRef = doc(playersCollection, updatedPlayer.id);
          const playerSnap = await transaction.get(playerRef);
          playerRefsAndSnaps.push({
            ref: playerRef,
            snap: playerSnap,
            updatedPlayer,
            isWinner: winningTeam === "team2",
          });
        }
      }

      // Now do the team composition read
      const teamCompTransactionSnap = await transaction.get(teamCompRef);

      // Now perform all writes after completing all reads
      for (const { ref, snap, updatedPlayer, isWinner } of playerRefsAndSnaps) {
        if (snap.exists()) {
          const currentPlayer = snap.data() as Player;
          const currentStats = currentPlayer.stats || {
            wins: 0,
            losses: 0,
            matchesPlayed: 0,
            mmr: updatedPlayer.stats?.mmr || 1000,
          };

          const updatedStats: PlayerStats = {
            wins: isWinner ? currentStats.wins + 1 : currentStats.wins,
            losses: isWinner ? currentStats.losses : currentStats.losses + 1,
            matchesPlayed: currentStats.matchesPlayed + 1,
            winRate: calculateWinRate(
              isWinner ? currentStats.wins + 1 : currentStats.wins,
              currentStats.matchesPlayed + 1
            ),
            mmr: updatedPlayer.stats?.mmr || currentStats.mmr,
            mmrChange: updatedPlayer.stats?.mmrChange || 0,
          };

          transaction.update(ref, { stats: updatedStats });
        }
      }

      // Update team composition with match result and MMR changes
      if (teamCompTransactionSnap.exists()) {
        transaction.update(teamCompRef, {
          matchResult: {
            winningTeam,
            scoreSummary,
            notes,
            mmrChanges: {
              team1: team1MmrChange,
              team2: team2MmrChange,
            },
          },
        });
      }
    });

    // Add match result to the matchResults collection
    const matchResultRef = await addDoc(matchResultsCollection, matchResult);

    return matchResultRef.id;
  } catch (error) {
    console.error("Error recording match result:", error);
    throw error;
  }
};

// Get recent match results
export const getRecentMatchResults = async (
  limitCount = 10
): Promise<MatchResult[]> => {
  try {
    const q = query(
      matchResultsCollection,
      orderBy("matchDate", "desc"),
      limit(limitCount)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as MatchResult)
    );
  } catch (error) {
    console.error("Error getting match results:", error);
    throw error;
  }
};

// Get match results for a specific team composition
export const getMatchResultForTeamComposition = async (
  teamCompositionId: string
): Promise<MatchResult | null> => {
  try {
    const q = query(
      matchResultsCollection,
      where("teamCompositionId", "==", teamCompositionId),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return null;
    }

    return {
      id: snapshot.docs[0].id,
      ...snapshot.docs[0].data(),
    } as MatchResult;
  } catch (error) {
    console.error("Error getting match result:", error);
    throw error;
  }
};

// Get player statistics (top players by win rate)
export const getTopPlayersByWinRate = async (
  topCount = 10
): Promise<Player[]> => {
  try {
    const snapshot = await getDocs(playersCollection);

    // Get all players and calculate win rates
    const players = snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as Player)
    );

    // Sort by win rate
    const sortedPlayers = players
      .filter((player) => player.stats && player.stats.matchesPlayed > 0)
      .sort((a, b) => {
        const aWinRate = a.stats?.winRate || 0;
        const bWinRate = b.stats?.winRate || 0;
        return bWinRate - aWinRate;
      });

    return sortedPlayers.slice(0, topCount);
  } catch (error) {
    console.error("Error getting top players:", error);
    throw error;
  }
};

// Get match statistics for a specific time period (defaults to all time)
export const getMatchStatistics = async (
  startDate?: string,
  endDate?: string
): Promise<{ total: number; team1Wins: number; team2Wins: number }> => {
  try {
    let q = query(matchResultsCollection, orderBy("matchDate", "desc"));

    // Apply date filters if provided
    if (startDate) {
      q = query(q, where("matchDate", ">=", startDate));
    }

    if (endDate) {
      q = query(q, where("matchDate", "<=", endDate));
    }

    const snapshot = await getDocs(q);
    const matches = snapshot.docs.map((doc) => doc.data() as MatchResult);

    const total = matches.length;
    const team1Wins = matches.filter(
      (match) => match.winningTeam === "team1"
    ).length;
    const team2Wins = matches.filter(
      (match) => match.winningTeam === "team2"
    ).length;

    return { total, team1Wins, team2Wins };
  } catch (error) {
    console.error("Error getting match statistics:", error);
    throw error;
  }
};
