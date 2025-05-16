import { Player, TeamComposition } from "@/app/types";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "./config";

// Constants for MMR calculation
const K_FACTOR = 32; // How much MMR can change in a single match

// Default MMR values for each tier
export type MmrTier =
  | "Budlot"
  | "Budlotay"
  | "Maaramay"
  | "Maaram"
  | "Makaritay"
  | "Makarit"
  | "MakaritKaritan"
  | "Gikakariti";

export const DEFAULT_MMR_VALUES: Record<MmrTier, number> = {
  Budlot: 900,
  Budlotay: 1000,
  Maaramay: 1200,
  Maaram: 1400,
  Makaritay: 1600,
  Makarit: 1800,
  MakaritKaritan: 2000,
  Gikakariti: 2200,
};

// Get default MMR value for a new player
export const getMmrDefaultValue = (tier: MmrTier = "Budlotay"): number => {
  return DEFAULT_MMR_VALUES[tier];
};

// Initialize MMR for a new player based on their selected tier
export const getInitialMmr = (tier: MmrTier = "Budlotay"): number => {
  return getMmrDefaultValue(tier);
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

  // Sum up all player MMRs
  const totalMmr = players.reduce((sum, player) => {
    const playerMmr = player.stats?.mmr || player.mmr;
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
    const currentMmr = player.stats?.mmr || player.mmr;
    const newMmr = calculateNewMmr(currentMmr, team2AvgMmr, team1Won);
    const mmrChange = newMmr - currentMmr;

    totalTeam1MmrChange += mmrChange;

    // Ensure all required stats properties are present
    const currentStats = player.stats || {
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      mmr: player.mmr,
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
    const currentMmr = player.stats?.mmr || player.mmr;
    const newMmr = calculateNewMmr(currentMmr, team1AvgMmr, team2Won);
    const mmrChange = newMmr - currentMmr;

    totalTeam2MmrChange += mmrChange;

    // Ensure all required stats properties are present
    const currentStats = player.stats || {
      wins: 0,
      losses: 0,
      matchesPlayed: 0,
      mmr: player.mmr,
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
  if (mmr >= 2200) return "Gikakariti";
  if (mmr >= 2000) return "MakaritKaritan";
  if (mmr >= 1800) return "Makarit";
  if (mmr >= 1600) return "Makaritay";
  if (mmr >= 1400) return "Maaram";
  if (mmr >= 1200) return "Maaramay";
  if (mmr >= 1000) return "Budlotay";
  return "Budlot";
};

// Get color class for MMR tier
export function getMmrTierColor(mmr: number): string {
  const tier = getMmrTierName(mmr);
  switch (tier) {
    case "Budlot":
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700";
    case "Budlotay":
      return "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border border-blue-300 dark:border-blue-700";
    case "Maaramay":
      return "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border border-green-300 dark:border-green-700";
    case "Maaram":
      return "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700";
    case "Makaritay":
      return "bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700";
    case "Makarit":
      return "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-200 border border-orange-300 dark:border-orange-700";
    case "MakaritKaritan":
      return "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-700";
    case "Gikakariti":
      return "bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/40 dark:to-pink-900/40 text-purple-800 dark:text-purple-200 border border-purple-300 dark:border-purple-700";
    default:
      return "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-300 dark:border-gray-700";
  }
}
