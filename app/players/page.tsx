"use client";

import React, { useState, useEffect } from "react";
import {
  addPlayerToFirestore,
  getPlayersFromFirestore,
  deletePlayerFromFirestore,
  updatePlayerInFirestore,
} from "@/firebase/playerService";
import { Player, Role } from "@/app/types";
import {
  DEFAULT_MMR_VALUES,
  MmrTier,
  getMmrTierName,
  getMmrTierColor,
} from "@/firebase/mmrService";
import { TierIcon } from "@/app/components/TierIcon";

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [newPlayerMmrTier, setNewPlayerMmrTier] = useState<MmrTier>("Budlotay");
  const [selectedRoles, setSelectedRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);

  // Available roles
  const availableRoles: Role[] = ["Roam", "Mid", "Gold", "Jungle", "Exp"];

  // Available MMR tiers
  const availableTiers: MmrTier[] = [
    "Budlot",
    "Budlotay",
    "Maaramay",
    "Maaram",
    "Makaritay",
    "Makarit",
    "MakaritKaritan",
    "Gikakariti",
  ];

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

  // Add a new player with name, MMR tier and roles, and save to Firestore
  const addPlayer = async () => {
    if (newPlayerName.trim() && selectedRoles.length > 0) {
      try {
        // Create new player object
        const newPlayer: Player = {
          name: newPlayerName.trim(),
          mmr: DEFAULT_MMR_VALUES[newPlayerMmrTier],
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
    // Set MMR tier based on player's MMR
    setNewPlayerMmrTier(getMmrTierName(player.mmr) as MmrTier);
    setSelectedRoles(player.roles);
    setIsEditing(true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingPlayer(null);
    setNewPlayerName("");
    setNewPlayerMmrTier("Budlotay");
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
        mmr: DEFAULT_MMR_VALUES[newPlayerMmrTier],
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
      setNewPlayerMmrTier("Budlotay");
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
        return "bg-purple-100 dark:bg-purple-900/40 text-purple-900 dark:text-purple-100";
      case "Mid":
        return "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-900 dark:text-yellow-100";
      case "Gold":
        return "bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-100";
      case "Jungle":
        return "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-100";
      case "Exp":
        return "bg-cyan-100 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-100";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100";
    }
  };

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-700 dark:text-blue-400">
          Player Management
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300">
          Add, edit, and remove players with their MMR rating and preferred
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
              htmlFor="player-mmr-tier"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              MMR Tier
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsTierDropdownOpen(!isTierDropdownOpen)}
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white flex items-center justify-between"
              >
                <div className="flex items-center">
                  <TierIcon tier={newPlayerMmrTier} />
                  <span>
                    {newPlayerMmrTier} ({DEFAULT_MMR_VALUES[newPlayerMmrTier]}{" "}
                    MMR)
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 transition-transform ${
                    isTierDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {isTierDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                  {availableTiers.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => {
                        setNewPlayerMmrTier(tier);
                        setIsTierDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center ${getMmrTierColor(
                        DEFAULT_MMR_VALUES[tier]
                      )}`}
                    >
                      <TierIcon tier={tier} />
                      <span className="ml-2">
                        {tier} ({DEFAULT_MMR_VALUES[tier]} MMR)
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
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
                  <th className="text-left py-2 px-4">MMR</th>
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
                      <div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${getMmrTierColor(
                            player.stats?.mmr || player.mmr
                          )}`}
                        >
                          <TierIcon
                            tier={
                              getMmrTierName(
                                player.stats?.mmr || player.mmr
                              ) as MmrTier
                            }
                          />
                          {getMmrTierName(player.stats?.mmr || player.mmr)}
                        </span>
                        <span className="ml-2 text-gray-600 dark:text-gray-400">
                          {player.stats?.mmr || player.mmr} MMR
                        </span>
                      </div>
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
                          className="text-blue-500 hover:text-blue-700 transition-colors"
                          title="Edit player"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => removePlayer(index)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Remove player"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
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
