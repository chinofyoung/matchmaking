// firebase/playerService.ts
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  limit,
  where,
} from "firebase/firestore";
import { db } from "./config";
import { Player, TeamComposition } from "@/app/types";
import { calculateTeamAverageMmr } from "./mmrService";

// Reference to players collection
const playersCollection = collection(db, "players");

// Reference to team compositions collection
const teamCompositionsCollection = collection(db, "teamCompositions");

// Add a new player to Firestore
export const addPlayerToFirestore = async (player: Player): Promise<string> => {
  try {
    // Initialize stats for new players
    const playerWithStats = {
      ...player,
      stats: {
        wins: 0,
        losses: 0,
        matchesPlayed: 0,
        winRate: 0,
        mmr: player.mmr, // Use the provided MMR value
      },
    };

    const docRef = await addDoc(playersCollection, playerWithStats);
    return docRef.id;
  } catch (error) {
    console.error("Error adding player to Firestore:", error);
    throw error;
  }
};

// Get all players from Firestore
export const getPlayersFromFirestore = async (): Promise<Player[]> => {
  try {
    const snapshot = await getDocs(playersCollection);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Player)
    );
  } catch (error) {
    console.error("Error getting players from Firestore:", error);
    throw error;
  }
};

// Get a team composition by ID
export const getTeamCompositionById = async (
  id: string
): Promise<TeamComposition | null> => {
  try {
    const docRef = doc(teamCompositionsCollection, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as TeamComposition;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting team composition by ID:", error);
    throw error;
  }
};

// Delete a player from Firestore
export const deletePlayerFromFirestore = async (
  playerId: string
): Promise<void> => {
  try {
    await deleteDoc(doc(db, "players", playerId));
  } catch (error) {
    console.error("Error deleting player from Firestore:", error);
    throw error;
  }
};

// Update an existing player in Firestore
export const updatePlayerInFirestore = async (
  playerId: string,
  updatedPlayer: Partial<Player>
): Promise<void> => {
  try {
    const playerRef = doc(db, "players", playerId);

    // Check if we need to update MMR in the stats as well
    if (updatedPlayer.mmr !== undefined && updatedPlayer.stats) {
      // Only update if MMR hasn't been set by matches already
      if (updatedPlayer.stats.matchesPlayed === 0) {
        updatedPlayer.stats.mmr = updatedPlayer.mmr;
      }
    }

    await updateDoc(playerRef, updatedPlayer);
  } catch (error) {
    console.error("Error updating player in Firestore:", error);
    throw error;
  }
};

// Toggle player selection status
export const togglePlayerSelection = async (
  playerId: string,
  isSelected: boolean
): Promise<void> => {
  return updatePlayerInFirestore(playerId, { isSelected });
};

// Save team composition to Firestore
export const saveTeamComposition = async (
  team1: Player[],
  team2: Player[]
): Promise<string> => {
  try {
    // Remove the isSelected field before saving
    const cleanTeam1 = team1.map(({ isSelected, ...player }) => player);
    const cleanTeam2 = team2.map(({ isSelected, ...player }) => player);

    // Calculate average MMR for each team
    const team1AvgMmr = calculateTeamAverageMmr(cleanTeam1);
    const team2AvgMmr = calculateTeamAverageMmr(cleanTeam2);

    const teamComp: TeamComposition = {
      date: new Date().toISOString(),
      team1: cleanTeam1,
      team2: cleanTeam2,
      team1AvgMmr,
      team2AvgMmr,
    };

    const docRef = await addDoc(teamCompositionsCollection, teamComp);
    return docRef.id;
  } catch (error) {
    console.error("Error saving team composition to Firestore:", error);
    throw error;
  }
};

// Get recent team compositions from Firestore
export const getRecentTeamCompositions = async (
  count: number = 5
): Promise<TeamComposition[]> => {
  try {
    const q = query(
      teamCompositionsCollection,
      orderBy("date", "desc"),
      limit(count)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as TeamComposition)
    );
  } catch (error) {
    console.error("Error getting team compositions from Firestore:", error);
    throw error;
  }
};
