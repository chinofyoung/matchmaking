import { Player, TeamComposition } from "@/app/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./config";

// Constants for MMR calculation
const K_FACTOR = 32; // How much MMR can change in a single match
const DEFAULT_MMR = {
  Expert: 1500, // Starting MMR for Expert players
  Intermediate: 1200, // Starting MMR for Intermediate players
  Beginner: 1000, // Starting MMR for Beginner players
};

// Initialize MMR for a new player based on their category
export const getInitialMmr = (
  category: "Expert" | "Intermediate" | "Beginner"
): number => {
  return DEFAULT_MMR[category];
};

// Calculate probability of winning based on MMR difference
export const calculateWinProbability = (mmr1: number, mmr2: number): number => {
  return 1 / (1 + Math.pow(10, (mmr2 - mmr1) / 400));
};

// Calculate new MMR after a match
export const calculateNewMmr = (
  playerMmr: number,
  opponentMmr: number,
  didWin: boolean
): number => {
  const winProbability = calculateWinProbability(playerMmr, opponentMmr);
  const actualResult = didWin ? 1 : 0;

  // Apply K-factor to the difference between actual and expected results
  const mmrChange = Math.round(K_FACTOR * (actualResult - winProbability));

  return playerMmr + mmrChange;
};

// Calculate team average MMR
export const calculateTeamAverageMmr = (players: Player[]): number => {
  if (players.length === 0) return 0;

  // Sum up all player MMRs, using their stats.mmr if available, or default to initial value based on category
  const totalMmr = players.reduce((sum, player) => {
    const playerMmr = player.stats?.mmr || getInitialMmr(player.category);
    return sum + playerMmr;
  }, 0);

  return Math.round(totalMmr / players.length);
};

// Update team composition with average MMR values
export const updateTeamCompositionWithMmr = async (
  teamComposition: TeamComposition
): Promise<TeamComposition> => {
  const team1AvgMmr = calculateTeamAverageMmr(teamComposition.team1);
  const team2AvgMmr = calculateTeamAverageMmr(teamComposition.team2);

  const updatedTeamComp = {
    ...teamComposition,
    team1AvgMmr,
    team2AvgMmr,
  };

  // If the team composition has an ID, update it in Firestore
  if (updatedTeamComp.id) {
    const teamCompRef = doc(db, "teamCompositions", updatedTeamComp.id);
    await updateDoc(teamCompRef, { team1AvgMmr, team2AvgMmr });
  }

  return updatedTeamComp;
};

// Calculate MMR changes for all players in a match
export const calculateMatchMmrChanges = (
  team1: Player[],
  team2: Player[],
  winningTeam: "team1" | "team2"
): {
  updatedTeam1: Player[];
  updatedTeam2: Player[];
  team1MmrChange: number;
  team2MmrChange: number;
} => {
  const team1AvgMmr = calculateTeamAverageMmr(team1);
  const team2AvgMmr = calculateTeamAverageMmr(team2);

  const team1Won = winningTeam === "team1";
  const team2Won = winningTeam === "team2";

  let totalTeam1MmrChange = 0;
  let totalTeam2MmrChange = 0;

  // Update MMR for team 1 players
  const updatedTeam1 = team1.map((player) => {
    const currentMmr = player.stats?.mmr || getInitialMmr(player.category);
    const newMmr = calculateNewMmr(currentMmr, team2AvgMmr, team1Won);
    const mmrChange = newMmr - currentMmr;

    totalTeam1MmrChange += mmrChange;

    // Ensure all required stats properties are present
    const currentStats = player.stats || {
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      mmr: getInitialMmr(player.category),
      winRate: 0,
    };

    return {
      ...player,
      stats: {
        ...currentStats,
        mmr: newMmr,
        mmrChange,
      },
    } as Player;
  });

  // Update MMR for team 2 players
  const updatedTeam2 = team2.map((player) => {
    const currentMmr = player.stats?.mmr || getInitialMmr(player.category);
    const newMmr = calculateNewMmr(currentMmr, team1AvgMmr, team2Won);
    const mmrChange = newMmr - currentMmr;

    totalTeam2MmrChange += mmrChange;

    // Ensure all required stats properties are present
    const currentStats = player.stats || {
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      mmr: getInitialMmr(player.category),
      winRate: 0,
    };

    return {
      ...player,
      stats: {
        ...currentStats,
        mmr: newMmr,
        mmrChange,
      },
    } as Player;
  });

  return {
    updatedTeam1,
    updatedTeam2,
    team1MmrChange: Math.round(totalTeam1MmrChange / team1.length), // Average team MMR change
    team2MmrChange: Math.round(totalTeam2MmrChange / team2.length), // Average team MMR change
  };
};

// Helper function to get MMR tier name based on MMR value
export const getMmrTierName = (mmr: number): string => {
  if (mmr >= 2200) return "Mythical Glory";
  if (mmr >= 2000) return "Mythic";
  if (mmr >= 1800) return "Legend";
  if (mmr >= 1600) return "Epic";
  if (mmr >= 1400) return "Grandmaster";
  if (mmr >= 1200) return "Master";
  if (mmr >= 1000) return "Elite";
  return "Rookie";
};

// Get color class for MMR tier
export const getMmrTierColor = (mmr: number): string => {
  if (mmr >= 2200) return "text-purple-600 dark:text-purple-400";
  if (mmr >= 2000) return "text-pink-600 dark:text-pink-400";
  if (mmr >= 1800) return "text-yellow-600 dark:text-yellow-400";
  if (mmr >= 1600) return "text-orange-600 dark:text-orange-400";
  if (mmr >= 1400) return "text-teal-600 dark:text-teal-400";
  if (mmr >= 1200) return "text-blue-600 dark:text-blue-400";
  if (mmr >= 1000) return "text-green-600 dark:text-green-400";
  return "text-gray-600 dark:text-gray-400";
};
