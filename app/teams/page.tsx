"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import {
  getPlayersFromFirestore,
  updatePlayerInFirestore,
  saveTeamComposition,
} from "@/firebase/playerService";
import {
  calculateTeamAverageMmr,
  getInitialMmr,
  getMmrTierName,
  getMmrTierColor,
  MmrTier,
} from "@/firebase/mmrService";
import { Player, Role, TeamComposition } from "@/app/types";

export default function TeamsPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<{
    team1: Player[];
    team2: Player[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);
  const [isSavingTeam, setIsSavingTeam] = useState(false);

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

        // Count selected players
        const selectedPlayersCount = fetchedPlayers.filter(
          (p) => p.isSelected
        ).length;
        setSelectedCount(selectedPlayersCount);
      } catch (error) {
        console.error("Error loading data:", error);
        setError("Failed to load data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Toggle a player's selection status
  const togglePlayerSelection = async (player: Player) => {
    if (!player.id) return;

    // If player is already selected and we're deselecting, always allow
    // If player is not selected, only allow selection if we have fewer than 10 players already selected
    if (player.isSelected || (!player.isSelected && selectedCount < 10)) {
      try {
        setIsLoading(true);

        // New selection state is the opposite of current state
        const newIsSelected = !player.isSelected;

        // Update in Firestore
        await updatePlayerInFirestore(player.id, { isSelected: newIsSelected });

        // Update local state
        setPlayers(
          players.map((p) =>
            p.id === player.id ? { ...p, isSelected: newIsSelected } : p
          )
        );

        // Update selected count
        setSelectedCount((prev) => (newIsSelected ? prev + 1 : prev - 1));
      } catch (error) {
        console.error("Error toggling player selection:", error);
        setError("Failed to update player selection. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Save current team composition to Firestore
  const saveCurrentTeams = async () => {
    if (!teams) return;

    try {
      setIsSavingTeam(true);
      setError(null);
      setSuccessMessage(null);

      // Save teams to Firestore
      const teamId = await saveTeamComposition(teams.team1, teams.team2);

      // Update state and show success
      setSuccessMessage("Teams saved successfully!");
      setIsSavingTeam(false);
      return teamId;
    } catch (error) {
      console.error("Error saving team composition:", error);
      setError("Failed to save team composition. Please try again.");
      setSuccessMessage(null);
      setIsSavingTeam(false);
      return null;
    }
  };

  // Navigate to match recording with the selected team
  const goToMatchRecording = async () => {
    if (!teams) return;

    try {
      setIsSavingTeam(true);
      setError(null);
      setSuccessMessage(null);

      // First save the teams
      const teamId = await saveTeamComposition(teams.team1, teams.team2);

      if (teamId) {
        // Then redirect to match recording
        router.push(`/matches/record?teamId=${teamId}`);
      } else {
        setError("Failed to save team composition. Please try again.");
        setIsSavingTeam(false);
      }
    } catch (error) {
      console.error("Error navigating to match recording:", error);
      setError("Failed to navigate to match recording. Please try again.");
      setSuccessMessage(null);
      setIsSavingTeam(false);
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

  // Calculate a score for role coverage
  const calculateTeamRoleScore = (team: Player[]): number => {
    // Count unique roles in the team
    const rolesCovered = new Set<Role>();
    team.forEach((player) =>
      player.roles.forEach((role) => rolesCovered.add(role))
    );

    // Count players with each role
    const roleCounts: Record<Role, number> = {
      Roam: 0,
      Mid: 0,
      Gold: 0,
      Jungle: 0,
      Exp: 0,
    };

    team.forEach((player) => {
      player.roles.forEach((role) => {
        roleCounts[role]++;
      });
    });

    // Calculate score - higher is better
    // +10 points for each unique role covered
    // -2 points for each duplicate role after the first one
    let score = rolesCovered.size * 10;

    // Penalize for duplicate roles
    Object.values(roleCounts).forEach((count) => {
      if (count > 1) {
        score -= (count - 1) * 2;
      }
    });

    return score;
  };

  // Randomize teams with MMR balancing and role optimization
  const randomizeTeams = () => {
    // Clear any messages
    setError(null);
    setSuccessMessage(null);

    // Filter to only use selected players, and ensure we have at least 2
    const selectedPlayers = players.filter((p) => p.isSelected);
    if (selectedPlayers.length < 2) {
      setError("Please select at least 2 players to randomize teams");
      return;
    }

    // Sort players by MMR (descending)
    const sortedPlayers = [...selectedPlayers].sort((a, b) => {
      const aMmr = a.stats?.mmr || a.mmr;
      const bMmr = b.stats?.mmr || b.mmr;
      return bMmr - aMmr; // descending order
    });

    // Initial distribution based on MMR - alternating to make teams even
    const team1: Player[] = [];
    const team2: Player[] = [];

    // Distribute players with a "snake draft" pattern to ensure fairness
    // 1,4,5,8,9 go to team1, 2,3,6,7,10 go to team2
    sortedPlayers.forEach((player, index) => {
      // "Snake" pattern for balanced MMR distribution
      // In a 10-player game, distribution would be:
      // Team 1: 1st, 4th, 5th, 8th, 9th picks
      // Team 2: 2nd, 3rd, 6th, 7th, 10th picks
      if (index % 4 === 0 || index % 4 === 3) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    // Balance team sizes if needed
    if (selectedPlayers.length % 2 !== 0) {
      // If odd number of players, ensure teams differ by at most 1 player
      if (team1.length > team2.length + 1) {
        const playerToMove = team1[team1.length - 1];
        team1.pop();
        team2.push(playerToMove);
      } else if (team2.length > team1.length + 1) {
        const playerToMove = team2[team2.length - 1];
        team2.pop();
        team1.push(playerToMove);
      }
    }

    // Try to optimize role distribution while maintaining MMR balance - monte carlo approach
    // Try multiple random swaps and keep the best arrangement
    let bestTeam1 = [...team1];
    let bestTeam2 = [...team2];

    // Calculate initial MMR difference and role scores
    const initialMmrDiff = Math.abs(
      calculateTeamAverageMmr(team1) - calculateTeamAverageMmr(team2)
    );
    const initialRoleScore =
      calculateTeamRoleScore(team1) + calculateTeamRoleScore(team2);

    // Combined score: we want high role score and low MMR difference
    let bestScore = initialRoleScore - initialMmrDiff * 2;

    // Try random player swaps to improve role balance while keeping MMR balance
    for (let attempt = 0; attempt < 200; attempt++) {
      const team1Temp = [...team1];
      const team2Temp = [...team2];

      // Choose random players from each team to swap
      const team1Index = Math.floor(Math.random() * team1Temp.length);
      const team2Index = Math.floor(Math.random() * team2Temp.length);

      // Swap players
      [team1Temp[team1Index], team2Temp[team2Index]] = [
        team2Temp[team2Index],
        team1Temp[team1Index],
      ];

      // Calculate new scores after swap
      const roleScore =
        calculateTeamRoleScore(team1Temp) + calculateTeamRoleScore(team2Temp);
      const mmrDiff = Math.abs(
        calculateTeamAverageMmr(team1Temp) - calculateTeamAverageMmr(team2Temp)
      );

      // Combined score: prioritize role coverage but penalize MMR imbalance
      const score = roleScore - mmrDiff * 2;

      // Keep this arrangement if it's better
      if (score > bestScore) {
        bestTeam1 = [...team1Temp];
        bestTeam2 = [...team2Temp];
        bestScore = score;
      }
    }

    setTeams({ team1: bestTeam1, team2: bestTeam2 });
  };

  // Function to get tier icons
  const getTierIcon = (tier: MmrTier): ReactElement => {
    switch (tier) {
      case "Budlot":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
          </svg>
        );
      case "Budlotay":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
          </svg>
        );
      case "Maaramay":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12h20"
            />
          </svg>
        );
      case "Maaram":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12h20"
            />
            <circle cx="12" cy="12" r="2" strokeWidth={2} />
          </svg>
        );
      case "Makaritay":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12h20"
            />
            <circle cx="12" cy="12" r="2" strokeWidth={2} />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2l4 4-4 4-4-4 4-4z"
            />
          </svg>
        );
      case "Makarit":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12h20"
            />
            <circle cx="12" cy="12" r="2" strokeWidth={2} />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2l4 4-4 4-4-4 4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18l4-4-4-4-4 4 4 4z"
            />
          </svg>
        );
      case "MakaritKaritan":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12h20"
            />
            <circle cx="12" cy="12" r="2" strokeWidth={2} />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2l4 4-4 4-4-4 4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18l4-4-4-4-4 4 4 4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12l4-4 4 4-4 4-4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 12l4-4 4 4-4 4-4-4z"
            />
          </svg>
        );
      case "Gikakariti":
        return (
          <svg
            className="w-4 h-4 inline-block mr-1"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2v20"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12h20"
            />
            <circle cx="12" cy="12" r="2" strokeWidth={2} />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2l4 4-4 4-4-4 4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 18l4-4-4-4-4 4 4 4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M2 12l4-4 4 4-4 4-4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18 12l4-4 4 4-4 4-4-4z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 2l8 8-8 8-8-8 8-8z"
            />
          </svg>
        );
      default:
        return <></>;
    }
  };

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-800 dark:text-blue-300">
          MMR-Based Team Creator
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300">
          Create balanced teams based on MMR ratings and role preferences
        </p>
      </section>

      {/* Player Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-300">
            Player Pool ({players.length})
          </h2>
          <div className="text-sm text-gray-700 dark:text-gray-300">
            <span
              className={
                selectedCount === 10
                  ? "text-green-700 dark:text-green-300 font-bold"
                  : ""
              }
            >
              {selectedCount}/10 players selected
            </span>
          </div>
        </div>

        {isLoading && !players.length ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            <span className="ml-2 text-gray-700 dark:text-gray-300">
              Loading players...
            </span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md text-center font-medium">
            {error}{" "}
            <button
              onClick={() => window.location.reload()}
              className="underline ml-2 font-semibold"
            >
              Retry
            </button>
          </div>
        ) : players.length === 0 ? (
          <p className="text-center text-gray-700 dark:text-gray-300 my-8">
            No players added yet.{" "}
            <a
              href="/players"
              className="text-blue-700 dark:text-blue-300 hover:underline font-medium"
            >
              Add players
            </a>{" "}
            before creating teams.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4 text-gray-800 dark:text-gray-200">
                    Select
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800 dark:text-gray-200">
                    Name
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800 dark:text-gray-200">
                    MMR
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800 dark:text-gray-200">
                    Roles
                  </th>
                  <th className="text-left py-2 px-4 text-gray-800 dark:text-gray-200">
                    Stats
                  </th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => {
                  const playerMmr = player.stats?.mmr || player.mmr;
                  return (
                    <tr
                      key={player.id || index}
                      className={`border-b dark:border-gray-700 ${
                        player.isSelected
                          ? "bg-purple-50 dark:bg-purple-900/20"
                          : ""
                      }`}
                    >
                      <td className="py-2 px-4">
                        <input
                          type="checkbox"
                          checked={player.isSelected || false}
                          onChange={() => togglePlayerSelection(player)}
                          disabled={!player.isSelected && selectedCount >= 10}
                          className="h-5 w-5 text-purple-600 rounded focus:ring-purple-500"
                        />
                      </td>
                      <td className="py-2 px-4 text-gray-900 dark:text-white font-medium">
                        {player.name}
                      </td>
                      <td className="py-2 px-4">
                        <div>
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getMmrTierColor(
                              playerMmr
                            )}`}
                          >
                            {playerMmr}
                          </span>
                          <span className="text-xs ml-1 text-gray-700 dark:text-gray-300">
                            {getTierIcon(getMmrTierName(playerMmr) as MmrTier)}
                            {getMmrTierName(playerMmr)}
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
                            <span className="text-green-700 dark:text-green-300 font-medium">
                              {player.stats.wins}W
                            </span>
                            {" - "}
                            <span className="text-red-700 dark:text-red-300 font-medium">
                              {player.stats.losses}L
                            </span>
                            {" | "}
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              {player.stats.winRate?.toFixed(1)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            No matches
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Randomize Button */}
      <div className="text-center mb-8">
        <div className="flex flex-col gap-3">
          <button
            onClick={randomizeTeams}
            disabled={selectedCount < 2 || isLoading}
            className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white py-3 px-8 rounded-full text-lg font-medium shadow-md transition-colors mx-auto"
          >
            {selectedCount < 2
              ? `Select at least 2 players (${selectedCount}/10)`
              : "Randomize Teams"}
          </button>

          {teams && (
            <div className="flex flex-col gap-4 items-center mt-4">
              {successMessage && (
                <div className="p-3 bg-green-50 dark:bg-green-900/40 text-green-700 dark:text-green-300 rounded-md text-center w-full max-w-md mb-2 font-medium">
                  {successMessage}
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <button
                  onClick={saveCurrentTeams}
                  disabled={isSavingTeam}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-6 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center"
                >
                  {isSavingTeam ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Teams"
                  )}
                </button>

                <button
                  onClick={goToMatchRecording}
                  disabled={isSavingTeam}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 px-6 rounded-lg text-sm font-medium shadow-md transition-colors flex items-center"
                >
                  {isSavingTeam ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    "Save & Record Match"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Teams Display */}
      {teams && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-300">
              Team 1{" "}
              <span className="text-sm font-normal text-gray-700 dark:text-gray-300">
                ({teams.team1.length} players)
              </span>
            </h2>
            <div className="mb-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold">
                Avg MMR: {calculateTeamAverageMmr(teams.team1)}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {getTierIcon(
                  getMmrTierName(
                    calculateTeamAverageMmr(teams.team1)
                  ) as MmrTier
                )}
                {getMmrTierName(calculateTeamAverageMmr(teams.team1))}
              </span>
            </div>

            {/* Role coverage */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Coverage:
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => {
                  const count = teams.team1.filter((p) =>
                    p.roles.includes(role)
                  ).length;
                  return (
                    <div key={role} className="flex items-center text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          count > 0
                            ? getRoleColor(role)
                            : "bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100"
                        }`}
                      >
                        {role}: {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <ul className="space-y-2">
              {teams.team1.map((player, index) => {
                const playerMmr = player.stats?.mmr || player.mmr;
                return (
                  <li
                    key={index}
                    className="p-3 rounded flex flex-col bg-slate-700 dark:bg-gray-750"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </span>
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded ${getMmrTierColor(
                            playerMmr
                          )}`}
                        >
                          {playerMmr} MMR
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {getTierIcon(getMmrTierName(playerMmr) as MmrTier)}
                        {getMmrTierName(playerMmr)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-800 dark:text-indigo-300">
              Team 2{" "}
              <span className="text-sm font-normal text-gray-700 dark:text-gray-300">
                ({teams.team2.length} players)
              </span>
            </h2>
            <div className="mb-3 flex flex-wrap gap-2 items-center">
              <span className="text-sm font-semibold">
                Avg MMR: {calculateTeamAverageMmr(teams.team2)}
              </span>
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                {getTierIcon(
                  getMmrTierName(
                    calculateTeamAverageMmr(teams.team2)
                  ) as MmrTier
                )}
                {getMmrTierName(calculateTeamAverageMmr(teams.team2))}
              </span>
            </div>

            {/* Role coverage */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Role Coverage:
              </h3>
              <div className="flex flex-wrap gap-2">
                {availableRoles.map((role) => {
                  const count = teams.team2.filter((p) =>
                    p.roles.includes(role)
                  ).length;
                  return (
                    <div key={role} className="flex items-center text-xs">
                      <span
                        className={`px-2 py-1 rounded-full ${
                          count > 0
                            ? getRoleColor(role)
                            : "bg-red-100 dark:bg-red-800 text-red-900 dark:text-red-100"
                        }`}
                      >
                        {role}: {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <ul className="space-y-2">
              {teams.team2.map((player, index) => {
                const playerMmr = player.stats?.mmr || player.mmr;
                return (
                  <li
                    key={index}
                    className="p-3 rounded flex flex-col bg-slate-700 dark:bg-gray-750"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {player.name}
                        </span>
                        <span
                          className={`ml-2 text-xs px-2 py-0.5 rounded ${getMmrTierColor(
                            playerMmr
                          )}`}
                        >
                          {playerMmr} MMR
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
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
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        {getTierIcon(getMmrTierName(playerMmr) as MmrTier)}
                        {getMmrTierName(playerMmr)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
