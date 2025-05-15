// app/types.ts
// Define player role types
export type Role = "Roam" | "Mid" | "Gold" | "Jungle" | "Exp";

// Define player type with name, roles, and MMR
export interface Player {
  id?: string;
  name: string;
  roles: Role[];
  isSelected?: boolean;
  stats?: PlayerStats;
  mmr: number; // ELO rating (required)
}

// Player statistics tracking
export interface PlayerStats {
  wins: number;
  losses: number;
  matchesPlayed: number;
  winRate?: number; // Calculated field (wins / matchesPlayed)
  mmr: number; // ELO rating (MMR)
  mmrChange?: number; // Last MMR change amount (for displaying +/- after matches)
}

// Define team composition type
export interface TeamComposition {
  id?: string;
  date: string;
  team1: Player[];
  team2: Player[];
  matchResult?: MatchResult;
  team1AvgMmr?: number; // Average team MMR
  team2AvgMmr?: number; // Average team MMR
}

// Match result type
export interface MatchResult {
  id?: string;
  matchDate: string;
  teamCompositionId: string;
  winningTeam: "team1" | "team2";
  scoreSummary?: string; // Optional field to store the score or summary
  notes?: string; // Optional field for match notes
  mmrChanges?: {
    team1: number;
    team2: number;
  }; // Optional field to store MMR changes
}
