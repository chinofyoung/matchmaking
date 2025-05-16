"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getPlayersFromFirestore } from "@/firebase/playerService";
import { Player, Role } from "@/app/types";
import { TierIcon } from "@/app/components/TierIcon";
import {
  getMmrTierName,
  getMmrTierColor,
  MmrTier,
} from "@/firebase/mmrService";
import { saveTeamComposition } from "@/firebase/playerService";

export default function CustomTeamPage() {
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);
  const [team1, setTeam1] = useState<Player[]>([]);
  const [team2, setTeam2] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState<Role | "all">("all");

  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const allPlayers = await getPlayersFromFirestore();
        setPlayers(allPlayers);
      } catch (error) {
        console.error("Error loading players:", error);
        setError("Failed to load players. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const handlePlayerSelect = (player: Player, teamNumber: 1 | 2) => {
    if (
      team1.find((p) => p.id === player.id) ||
      team2.find((p) => p.id === player.id)
    ) {
      return;
    }

    if (teamNumber === 1) {
      if (team1.length < 5) {
        setTeam1([...team1, player]);
      }
    } else {
      if (team2.length < 5) {
        setTeam2([...team2, player]);
      }
    }
  };

  const handlePlayerRemove = (player: Player, teamNumber: 1 | 2) => {
    if (teamNumber === 1) {
      setTeam1(team1.filter((p) => p.id !== player.id));
    } else {
      setTeam2(team2.filter((p) => p.id !== player.id));
    }
  };

  const handleSaveTeams = async () => {
    if (team1.length === 0 || team2.length === 0) {
      setError("Both teams must have at least one player");
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      const teamId = await saveTeamComposition(team1, team2);
      router.push(`/matches/record?teamId=${teamId}`);
    } catch (error) {
      console.error("Error saving teams:", error);
      setError("Failed to save teams. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateTeamStats = (team: Player[]) => {
    const totalMmr = team.reduce((sum, player) => {
      const mmr = player.stats?.mmr || player.mmr;
      return sum + mmr;
    }, 0);
    const avgMmr = Math.round(totalMmr / team.length);

    return {
      avgMmr,
      tier: getMmrTierName(avgMmr),
    };
  };

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

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesRole =
      selectedRole === "all" || player.roles.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  const availablePlayers = filteredPlayers.filter(
    (player) =>
      !team1.find((p) => p.id === player.id) &&
      !team2.find((p) => p.id === player.id)
  );

  return (
    <div className="max-w-7xl mx-auto">
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-green-700 dark:text-green-400">
          Create Custom Teams
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300 mb-8">
          Manually select players for Team 1 and Team 2
        </p>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-center mb-6">
          {error}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team 1 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600 dark:text-red-400">
              Team 1 ({team1.length}/5)
            </h2>
            {team1.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg MMR: {calculateTeamStats(team1).avgMmr}
                </div>
                <div className="text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getMmrTierColor(
                      calculateTeamStats(team1).avgMmr
                    )}`}
                  >
                    <TierIcon
                      tier={calculateTeamStats(team1).tier as MmrTier}
                    />
                    {calculateTeamStats(team1).tier}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {team1.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="flex gap-1 mt-1">
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getMmrTierColor(
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
                    <button
                      onClick={() => handlePlayerRemove(player, 1)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Player Pool */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Available Players</h2>

            {/* Search and Filter */}
            <div className="mb-4 space-y-2">
              <input
                type="text"
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                  onClick={() => setSelectedRole("all")}
                  className={`px-3 py-1 rounded-full shrink-0 text-sm ${
                    selectedRole === "all"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  All Roles
                </button>
                {["Roam", "Mid", "Gold", "Jungle", "Exp"].map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role as Role)}
                    className={`px-3 py-1 rounded-full text-sm ${getRoleColor(
                      role as Role
                    )} ${
                      selectedRole === role
                        ? "ring-2 ring-offset-2 ring-blue-500"
                        : ""
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {availablePlayers.length === 0 ? (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No players found
                </div>
              ) : (
                availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="flex gap-1 mt-1">
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
                    </div>
                    <div className="flex gap-2">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handlePlayerSelect(player, 1)}
                          disabled={team1.length >= 5}
                          className="px-2 py-1 text-xs bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded"
                        >
                          Team 1
                        </button>
                        <button
                          onClick={() => handlePlayerSelect(player, 2)}
                          disabled={team2.length >= 5}
                          className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded"
                        >
                          Team 2
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Team 2 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
              Team 2 ({team2.length}/5)
            </h2>
            {team2.length > 0 && (
              <div className="mb-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Avg MMR: {calculateTeamStats(team2).avgMmr}
                </div>
                <div className="text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getMmrTierColor(
                      calculateTeamStats(team2).avgMmr
                    )}`}
                  >
                    <TierIcon
                      tier={calculateTeamStats(team2).tier as MmrTier}
                    />
                    {calculateTeamStats(team2).tier}
                  </span>
                </div>
              </div>
            )}
            <div className="space-y-2">
              {team2.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded-md"
                >
                  <div>
                    <div className="font-medium">{player.name}</div>
                    <div className="flex gap-1 mt-1">
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
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getMmrTierColor(
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
                    <button
                      onClick={() => handlePlayerRemove(player, 2)}
                      className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Save Button */}
      <div className="mt-8 text-center">
        <button
          onClick={handleSaveTeams}
          disabled={isSaving || team1.length === 0 || team2.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg text-lg font-medium shadow-md transition-colors"
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              Saving...
            </div>
          ) : (
            "Save Teams & Record Match"
          )}
        </button>
      </div>
    </div>
  );
}
