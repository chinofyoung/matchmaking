// app/types.ts
// Define player role types
export type Role = "Roam" | "Mid" | "Gold" | "Jungle" | "Exp";

// Define player type with name, category, and roles
export interface Player {
  id?: string;
  name: string;
  category: "Expert" | "Intermediate" | "Beginner";
  roles: Role[];
  isSelected?: boolean;
  stats?: PlayerStats;
}

// Player statistics tracking
export interface PlayerStats {
  wins: number;
  losses: number;
  matchesPlayed: number;
  winRate?: number; // Calculated field (wins / matchesPlayed)
}

// Define team composition type
export interface TeamComposition {
  id?: string;
  date: string;
  team1: Player[];
  team2: Player[];
  matchResult?: MatchResult;
}

// Match result type
export interface MatchResult {
  id?: string;
  matchDate: string;
  teamCompositionId: string;
  winningTeam: "team1" | "team2";
  scoreSummary?: string; // Optional field to store the score or summary
  notes?: string; // Optional field for match notes
}
