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
}

// Define team composition type
export interface TeamComposition {
  id?: string;
  date: string;
  team1: Player[];
  team2: Player[];
}
