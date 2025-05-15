"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getPlayersFromFirestore,
  updatePlayerInFirestore,
  saveTeamComposition,
} from "@/firebase/playerService";
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

  // Save current team composition to Firestore and redirect to match recording
  const saveCurrentTeams = async () => {
    if (!teams) return;

    try {
      setIsSavingTeam(true);

      // Save teams to Firestore
      const teamId = await saveTeamComposition(teams.team1, teams.team2);

      // Redirect to match recording page with the team ID
      router.push(`/matches/record?teamId=${teamId}`);
    } catch (error) {
      console.error("Error saving team composition:", error);
      setError("Failed to save team composition. Please try again.");
      setIsSavingTeam(false);
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

  // Randomize teams with role optimization
  const randomizeTeams = () => {
    // Filter to only use selected players, and ensure we have at least 2
    const selectedPlayers = players.filter((p) => p.isSelected);
    if (selectedPlayers.length < 2) {
      setError("Please select at least 2 players to randomize teams");
      return;
    }

    // Separate players by category
    const experts = selectedPlayers.filter((p) => p.category === "Expert");
    const intermediates = selectedPlayers.filter(
      (p) => p.category === "Intermediate"
    );
    const beginners = selectedPlayers.filter((p) => p.category === "Beginner");

    // Shuffle all arrays
    const shuffledExperts = [...experts].sort(() => Math.random() - 0.5);
    const shuffledIntermediates = [...intermediates].sort(
      () => Math.random() - 0.5
    );
    const shuffledBeginners = [...beginners].sort(() => Math.random() - 0.5);

    // Initial distribution based on skill level
    const team1: Player[] = [];
    const team2: Player[] = [];

    // First distribute experts evenly
    shuffledExperts.forEach((player, index) => {
      if (index % 2 === 0) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    // Then distribute intermediates evenly
    shuffledIntermediates.forEach((player, index) => {
      if (index % 2 === 0) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    // Then distribute beginners evenly
    shuffledBeginners.forEach((player, index) => {
      if (index % 2 === 0) {
        team1.push(player);
      } else {
        team2.push(player);
      }
    });

    // Balance team sizes if needed
    if (selectedPlayers.length % 2 === 0 && team1.length !== team2.length) {
      // Move players to balance teams while maintaining skill distribution
      if (team1.length > team2.length) {
        const playerToMove = team1[team1.length - 1];
        team1.pop();
        team2.push(playerToMove);
      } else {
        const playerToMove = team2[team2.length - 1];
        team2.pop();
        team1.push(playerToMove);
      }
    }

    // Try to optimize role distribution - simple monte carlo approach
    // Try multiple random swaps and keep the best arrangement
    let bestTeam1 = [...team1];
    let bestTeam2 = [...team2];
    let bestScore =
      calculateTeamRoleScore(team1) + calculateTeamRoleScore(team2);

    // Try a few random player swaps to improve role balance
    for (let attempt = 0; attempt < 100; attempt++) {
      // Keep team sizes equal (or as equal as possible for odd total)
      const team1Temp = [...team1];
      const team2Temp = [...team2];

      // Randomly select players to swap (within same category if possible)
      const team1ExpertIndices = team1Temp
        .map((player, index) => (player.category === "Expert" ? index : -1))
        .filter((index) => index !== -1);

      const team1IntermediateIndices = team1Temp
        .map((player, index) =>
          player.category === "Intermediate" ? index : -1
        )
        .filter((index) => index !== -1);

      const team1BeginnerIndices = team1Temp
        .map((player, index) => (player.category === "Beginner" ? index : -1))
        .filter((index) => index !== -1);

      const team2ExpertIndices = team2Temp
        .map((player, index) => (player.category === "Expert" ? index : -1))
        .filter((index) => index !== -1);

      const team2IntermediateIndices = team2Temp
        .map((player, index) =>
          player.category === "Intermediate" ? index : -1
        )
        .filter((index) => index !== -1);

      const team2BeginnerIndices = team2Temp
        .map((player, index) => (player.category === "Beginner" ? index : -1))
        .filter((index) => index !== -1);

      // Try to swap within same category
      if (team1ExpertIndices.length > 0 && team2ExpertIndices.length > 0) {
        const index1 =
          team1ExpertIndices[
            Math.floor(Math.random() * team1ExpertIndices.length)
          ];
        const index2 =
          team2ExpertIndices[
            Math.floor(Math.random() * team2ExpertIndices.length)
          ];

        // Swap players
        [team1Temp[index1], team2Temp[index2]] = [
          team2Temp[index2],
          team1Temp[index1],
        ];
      } else if (
        team1IntermediateIndices.length > 0 &&
        team2IntermediateIndices.length > 0
      ) {
        const index1 =
          team1IntermediateIndices[
            Math.floor(Math.random() * team1IntermediateIndices.length)
          ];
        const index2 =
          team2IntermediateIndices[
            Math.floor(Math.random() * team2IntermediateIndices.length)
          ];

        // Swap players
        [team1Temp[index1], team2Temp[index2]] = [
          team2Temp[index2],
          team1Temp[index1],
        ];
      } else if (
        team1BeginnerIndices.length > 0 &&
        team2BeginnerIndices.length > 0
      ) {
        const index1 =
          team1BeginnerIndices[
            Math.floor(Math.random() * team1BeginnerIndices.length)
          ];
        const index2 =
          team2BeginnerIndices[
            Math.floor(Math.random() * team2BeginnerIndices.length)
          ];

        // Swap players
        [team1Temp[index1], team2Temp[index2]] = [
          team2Temp[index2],
          team1Temp[index1],
        ];
      }

      // Calculate score for this arrangement
      const score =
        calculateTeamRoleScore(team1Temp) + calculateTeamRoleScore(team2Temp);

      // Keep this arrangement if it's better
      if (score > bestScore) {
        bestTeam1 = [...team1Temp];
        bestTeam2 = [...team2Temp];
        bestScore = score;
      }
    }

    setTeams({ team1: bestTeam1, team2: bestTeam2 });
  };

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-700 dark:text-blue-400">
          Team Creator
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Select players and create balanced teams for matches
        </p>
      </section>

      {/* Player Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-blue-600 dark:text-blue-400">
            Player Pool ({players.length})
          </h2>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <span
              className={selectedCount === 10 ? "text-green-500 font-bold" : ""}
            >
              {selectedCount}/10 players selected
            </span>
          </div>
        </div>

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
            No players added yet.{" "}
            <a href="/players" className="text-blue-500 hover:underline">
              Add players
            </a>{" "}
            before creating teams.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="text-left py-2 px-4">Select</th>
                  <th className="text-left py-2 px-4">Name</th>
                  <th className="text-left py-2 px-4">Skill</th>
                  <th className="text-left py-2 px-4">Roles</th>
                  <th className="text-left py-2 px-4">Stats</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player, index) => (
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
                  </tr>
                ))}
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
            <button
              onClick={saveCurrentTeams}
              disabled={isSavingTeam}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white py-2 px-6 rounded-lg text-sm font-medium shadow-md transition-colors mx-auto flex items-center"
            >
              {isSavingTeam ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                "Save & Record Match Results"
              )}
            </button>
          )}
        </div>
      </div>

      {/* Teams Display */}
      {teams && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Team 1{" "}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                ({teams.team1.length} players)
              </span>
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                {teams.team1.filter((p) => p.category === "Expert").length}{" "}
                experts
              </span>
              <span className="text-xs bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full">
                {
                  teams.team1.filter((p) => p.category === "Intermediate")
                    .length
                }{" "}
                intermediates
              </span>
              <span className="text-xs bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                {teams.team1.filter((p) => p.category === "Beginner").length}{" "}
                beginners
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
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
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
              {teams.team1.map((player, index) => (
                <li
                  key={index}
                  className={`p-3 rounded flex flex-col ${
                    player.category === "Expert"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : player.category === "Intermediate"
                      ? "bg-orange-50 dark:bg-orange-900/30"
                      : "bg-green-50 dark:bg-green-900/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          player.category === "Expert"
                            ? "bg-blue-500"
                            : player.category === "Intermediate"
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                      ></span>
                      <span className="font-medium">{player.name}</span>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          player.category === "Expert"
                            ? "bg-blue-200 dark:bg-blue-800"
                            : player.category === "Intermediate"
                            ? "bg-orange-200 dark:bg-orange-800"
                            : "bg-green-200 dark:bg-green-800"
                        }`}
                      >
                        {player.category}
                      </span>
                    </div>
                  </div>
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
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-indigo-600 dark:text-indigo-400">
              Team 2{" "}
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                ({teams.team2.length} players)
              </span>
            </h2>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded-full">
                {teams.team2.filter((p) => p.category === "Expert").length}{" "}
                experts
              </span>
              <span className="text-xs bg-orange-100 dark:bg-orange-900/50 px-2 py-1 rounded-full">
                {
                  teams.team2.filter((p) => p.category === "Intermediate")
                    .length
                }{" "}
                intermediates
              </span>
              <span className="text-xs bg-green-100 dark:bg-green-900/50 px-2 py-1 rounded-full">
                {teams.team2.filter((p) => p.category === "Beginner").length}{" "}
                beginners
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
                            : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
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
              {teams.team2.map((player, index) => (
                <li
                  key={index}
                  className={`p-3 rounded flex flex-col ${
                    player.category === "Expert"
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : player.category === "Intermediate"
                      ? "bg-orange-50 dark:bg-orange-900/30"
                      : "bg-green-50 dark:bg-green-900/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <span
                        className={`w-2 h-2 rounded-full mr-2 ${
                          player.category === "Expert"
                            ? "bg-blue-500"
                            : player.category === "Intermediate"
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                      ></span>
                      <span className="font-medium">{player.name}</span>
                      <span
                        className={`ml-2 text-xs px-2 py-0.5 rounded ${
                          player.category === "Expert"
                            ? "bg-blue-200 dark:bg-blue-800"
                            : player.category === "Intermediate"
                            ? "bg-orange-200 dark:bg-orange-800"
                            : "bg-green-200 dark:bg-green-800"
                        }`}
                      >
                        {player.category}
                      </span>
                    </div>
                  </div>
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
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
