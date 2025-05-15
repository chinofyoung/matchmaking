"use client";

import { useState, useEffect } from "react";
import {
  addPlayerToFirestore,
  getPlayersFromFirestore,
  deletePlayerFromFirestore,
  updatePlayerInFirestore,
} from "@/firebase/playerService";
import { Player, Role } from "@/app/types";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerCategory, setNewPlayerCategory] = useState<
    "Expert" | "Intermediate" | "Beginner"
  >("Expert");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Available roles
  const availableRoles: Role[] = ["Roam", "Mid", "Gold", "Jungle", "Exp"];

  // Load players from Firestore on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load players
        const fetchedPlayers = await getPlayersFromFirestore();
        setPlayers(fetchedPlayers);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Add a new player with name, category and roles, and save to Firestore
  const addPlayer = async () => {
    if (newPlayerName.trim() && selectedRoles.length > 0) {
      try {
        // Create new player object
        const newPlayer: Player = {
          name: newPlayerName.trim(),
          category: newPlayerCategory,
          roles: [...selectedRoles],
        };

        // Disable button and show loading state
        setIsLoading(true);

        // Add to Firestore
        const playerId = await addPlayerToFirestore(newPlayer);

        // Update local state with the new player including the Firestore ID
        setPlayers([...players, { ...newPlayer, id: playerId }]);

        // Reset form fields
        setNewPlayerName("");
        setSelectedRoles([]);
        setError(null);
      } catch (error) {
        console.error("Error adding player:", error);
        setError("Failed to add player. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Remove a player by ID from Firestore and local state
  const removePlayer = async (index: number) => {
    const playerToRemove = players[index];

    if (playerToRemove.id) {
      try {
        setIsLoading(true);

        // Remove from Firestore
        await deletePlayerFromFirestore(playerToRemove.id);

        // Update local state
        setPlayers(players.filter((_, i) => i !== index));
        setError(null);
      } catch (error) {
        console.error("Error removing player:", error);
        setError("Failed to remove player. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // If there's no ID (shouldn't happen in normal operation), just remove from local state
      setPlayers(players.filter((_, i) => i !== index));
    }
  };

  // Start editing a player
  const startEditingPlayer = (player: Player) => {
    setEditingPlayer(player);
    setNewPlayerName(player.name);
    setNewPlayerCategory(player.category);
    setSelectedRoles(player.roles);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPlayer(null);
    setNewPlayerName("");
    setNewPlayerCategory("Expert");
    setSelectedRoles([]);
    setIsEditing(false);
  };

  // Update an existing player
  const updatePlayer = async () => {
    if (
      !editingPlayer?.id ||
      !newPlayerName.trim() ||
      selectedRoles.length === 0
    ) {
      return;
    }

    try {
      setIsLoading(true);

      const updatedPlayer: Partial<Player> = {
        name: newPlayerName.trim(),
        category: newPlayerCategory,
        roles: [...selectedRoles],
      };

      // Update in Firestore
      await updatePlayerInFirestore(editingPlayer.id, updatedPlayer);

      // Update local state
      setPlayers(
        players.map((player) =>
          player.id === editingPlayer.id
            ? { ...player, ...updatedPlayer }
            : player
        )
      );

      // Reset form
      setNewPlayerName("");
      setNewPlayerCategory("Expert");
      setSelectedRoles([]);
      setEditingPlayer(null);
      setIsEditing(false);
      setError(null);
    } catch (error) {
      console.error("Error updating player:", error);
      setError("Failed to update player. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle role selection for a new player
  const toggleRole = (role: Role) => {
    if (selectedRoles.includes(role)) {
      setSelectedRoles(selectedRoles.filter((r) => r !== role));
    } else if (selectedRoles.length < 3) {
      setSelectedRoles([...selectedRoles, role]);
    }
  };

  // Function to get role colors
  const getRoleColor = (role: Role): string => {
    switch (role) {
      case "Roam":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200";
      case "Mid":
        return "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200";
      case "Gold":
        return "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200";
      case "Jungle":
        return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-200";
      case "Exp":
        return "bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-200";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200";
    }
  };

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-700 dark:text-blue-400">
          Player Management
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Add, edit, and remove players with their skill level and preferred
          roles.
        </p>
      </section>

      {/* Add/Edit Player Form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
          {isEditing ? "Edit Player" : "Add Player"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label
              htmlFor="player-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Player Name
            </label>
            <input
              id="player-name"
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (isEditing ? updatePlayer() : addPlayer())
              }
              placeholder="Enter player name"
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="player-category"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Skill Level
            </label>
            <select
              id="player-category"
              value={newPlayerCategory}
              onChange={(e) =>
                setNewPlayerCategory(
                  e.target.value as "Expert" | "Intermediate" | "Beginner"
                )
              }
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="Expert">Expert</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Beginner">Beginner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Roles (select up to 3)
            </label>
            <div className="flex flex-wrap gap-2">
              {availableRoles.map((role) => (
                <button
                  key={role}
                  onClick={() => toggleRole(role)}
                  className={`text-xs px-2 py-1 rounded-full transition-colors ${
                    selectedRoles.includes(role)
                      ? "bg-purple-600 text-white"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
            {selectedRoles.length === 0 && (
              <p className="text-xs text-red-500 mt-1">
                Please select at least one role
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {isEditing && (
            <button
              onClick={cancelEditing}
              className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            onClick={isEditing ? updatePlayer : addPlayer}
            disabled={
              !newPlayerName.trim() || selectedRoles.length === 0 || isLoading
            }
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {isEditing ? "Updating..." : "Adding..."}
              </>
            ) : isEditing ? (
              "Update Player"
            ) : (
              "Add Player"
            )}
          </button>
        </div>
      </div>

      {/* Player List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
          Player Roster ({players.length})
        </h2>

        {isLoading && !players.length ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">
              Loading players...
            </span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-center">
            {error}{" "}
            <button
              onClick={() => window.location.reload()}
              className="underline ml-2"
            >
              Retry
            </button>
          </div>
        ) : players.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 my-8">
            No players added yet. Add players using the form above.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Skill</th>
                  <th className="text-left py-2 px-4">Roles</th>
                  <th className="text-left py-2 px-4">Stats</th>
                  <th className="text-right py-2 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
                  <tr
                    key={player.id || index}
                    className="border-b dark:border-gray-700"
                  >
                    <td className="py-2 px-4">{player.name}</td>
                    <td className="py-2 px-4">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          player.category === "Expert"
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                            : player.category === "Intermediate"
                            ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200"
                            : "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                        }`}
                      >
                        {player.category}
                      </span>
                    </td>
                    <td className="py-2 px-4">
                      <div className="flex flex-wrap gap-1">
                        {player.roles.map((role) => (
                          <span
                            key={role}
                            className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(
                              role
                            )}`}
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-2 px-4">
                      {player.stats ? (
                        <div className="text-xs">
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            {player.stats.wins}W
                          </span>
                          {" - "}
                          <span className="text-red-600 dark:text-red-400 font-medium">
                            {player.stats.losses}L
                          </span>
                          {" | "}
                          <span className="font-medium">
                            {player.stats.winRate?.toFixed(1)}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">
                          No matches
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEditingPlayer(player)}
                          className="text-blue-500 hover:text-blue-700"
                          title="Edit player"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => removePlayer(index)}
                          className="text-red-500 hover:text-red-700"
                          title="Remove player"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
