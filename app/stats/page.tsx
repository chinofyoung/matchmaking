"use client";

import { useState, useEffect } from "react";
import { getPlayersFromFirestore } from "@/firebase/playerService";
import { getTopPlayersByWinRate } from "@/firebase/matchService";
import { Player, Role } from "@/app/types";
import {
  getMmrTierName,
  getMmrTierColor,
  MmrTier,
  DEFAULT_MMR_VALUES,
} from "@/firebase/mmrService";

// Function to get tier icons
const getTierIcon = (tier: MmrTier): React.ReactElement => {
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

export default function StatsPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterMmrTier, setFilterMmrTier] = useState<string>("all");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("winRate");

  useEffect(() => {
    const loadPlayers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Get all players with stats
        const allPlayers = await getPlayersFromFirestore();

        // Filter players with match history
        const playersWithStats = allPlayers.filter(
          (player) => player.stats && player.stats.matchesPlayed > 0
        );

        setPlayers(playersWithStats);
        applyFilters(playersWithStats, filterMmrTier, filterRole, sortBy);
      } catch (error) {
        console.error("Error loading player statistics:", error);
        setError("Failed to load player statistics. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadPlayers();
  }, []);

  const applyFilters = (
    playersToFilter: Player[],
    mmrTier: string,
    role: string,
    sortField: string
  ) => {
    // Apply MMR tier filter
    let result = [...playersToFilter];

    if (mmrTier !== "all") {
      result = result.filter((player) => {
        const playerMmr = player.stats?.mmr || player.mmr;
        return getMmrTierName(playerMmr) === mmrTier;
      });
    }

    // Apply role filter
    if (role !== "all") {
      result = result.filter((player) => player.roles.includes(role as any));
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortField === "winRate") {
        return (b.stats?.winRate || 0) - (a.stats?.winRate || 0);
      } else if (sortField === "wins") {
        return (b.stats?.wins || 0) - (a.stats?.wins || 0);
      } else if (sortField === "matchesPlayed") {
        return (b.stats?.matchesPlayed || 0) - (a.stats?.matchesPlayed || 0);
      } else if (sortField === "mmr") {
        const bMmr = b.stats?.mmr || b.mmr;
        const aMmr = a.stats?.mmr || a.mmr;
        return bMmr - aMmr;
      } else {
        return (b.stats?.winRate || 0) - (a.stats?.winRate || 0);
      }
    });

    setFilteredPlayers(result);
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

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-green-700 dark:text-green-400">
          Player Statistics
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300 mb-8">
          View and analyze player performance and rankings
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
        <>
          {players.length === 0 ? (
            <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                No match statistics available yet. Start recording match results
                to see player stats.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  {/* MMR Tier filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Filter by MMR Tier
                    </label>
                    <select
                      value={filterMmrTier}
                      onChange={(e) => {
                        setFilterMmrTier(e.target.value);
                        applyFilters(
                          players,
                          e.target.value,
                          filterRole,
                          sortBy
                        );
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Tiers</option>
                      {availableTiers.map((tier) => (
                        <option key={tier} value={tier}>
                          {getTierIcon(tier as MmrTier)} {tier}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Role filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
                      Filter by Role
                    </label>
                    <select
                      value={filterRole}
                      onChange={(e) => {
                        setFilterRole(e.target.value);
                        applyFilters(
                          players,
                          filterMmrTier,
                          e.target.value,
                          sortBy
                        );
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="all">All Roles</option>
                      <option value="Roam">Roam</option>
                      <option value="Mid">Mid</option>
                      <option value="Gold">Gold</option>
                      <option value="Jungle">Jungle</option>
                      <option value="Exp">Exp</option>
                    </select>
                  </div>

                  {/* Sort by */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sort by
                    </label>
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        applyFilters(
                          players,
                          filterMmrTier,
                          filterRole,
                          e.target.value
                        );
                      }}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="winRate">Win Rate</option>
                      <option value="matchesPlayed">Matches Played</option>
                      <option value="wins">Total Wins</option>
                      <option value="mmr">MMR Rating</option>
                    </select>
                  </div>

                  {/* Statistics summary */}
                  <div className="bg-slate-700 dark:bg-gray-900/30 p-3 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Current Selection
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>Players: {filteredPlayers.length}</p>
                      <p>
                        Avg. Win Rate:{" "}
                        {(
                          filteredPlayers.reduce(
                            (acc, player) => acc + (player.stats?.winRate || 0),
                            0
                          ) / (filteredPlayers.length || 1)
                        ).toFixed(1)}
                        %
                      </p>
                      <p>
                        Avg. MMR:{" "}
                        {Math.round(
                          filteredPlayers.reduce((acc, player) => {
                            const mmr = player.stats?.mmr || player.mmr;
                            return acc + mmr;
                          }, 0) / (filteredPlayers.length || 1)
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-700 dark:bg-gray-700 border-b dark:border-gray-600">
                        <th className="py-3 px-4 text-left font-medium">
                          Rank
                        </th>
                        <th className="py-3 px-4 text-left font-medium">
                          Player
                        </th>
                        <th className="py-3 px-4 text-left font-medium">
                          MMR Tier
                        </th>
                        <th className="py-3 px-4 text-left font-medium">
                          Roles
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          MMR Rating
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Win Rate
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          W/L
                        </th>
                        <th className="py-3 px-4 text-center font-medium">
                          Matches
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredPlayers.map((player, index) => {
                        const playerMmr = player.stats?.mmr || player.mmr;
                        return (
                          <tr
                            key={player.id}
                            className={`hover:bg-slate-700 dark:hover:bg-gray-750 ${
                              index === 0 && filteredPlayers.length > 1
                                ? "bg-yellow-50 dark:bg-yellow-900/10"
                                : ""
                            }`}
                          >
                            <td className="py-3 px-4">
                              {index < 3 ? (
                                <span
                                  className={`
                                  inline-flex items-center justify-center w-6 h-6 rounded-full 
                                  ${
                                    index === 0
                                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                                      : ""
                                  }
                                  ${
                                    index === 1
                                      ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                      : ""
                                  }
                                  ${
                                    index === 2
                                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                                      : ""
                                  }
                                `}
                                >
                                  {index === 0
                                    ? "🥇"
                                    : index === 1
                                    ? "🥈"
                                    : "🥉"}
                                </span>
                              ) : (
                                <span className="px-2">{index + 1}</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-medium">
                              {player.name}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getMmrTierColor(
                                  playerMmr
                                )}`}
                              >
                                {getTierIcon(
                                  getMmrTierName(playerMmr) as MmrTier
                                )}
                                {getMmrTierName(playerMmr)}
                              </span>
                            </td>
                            <td className="py-3 px-4">
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
                            <td className="py-3 px-4 text-center">
                              <div>
                                <span className={getMmrTierColor(playerMmr)}>
                                  {playerMmr}
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`font-medium ${
                                  (player.stats?.winRate || 0) >= 60
                                    ? "text-green-600 dark:text-green-400"
                                    : (player.stats?.winRate || 0) >= 45
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-red-600 dark:text-red-400"
                                }`}
                              >
                                {player.stats?.winRate || 0}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="text-green-600 dark:text-green-400">
                                {player.stats?.wins || 0}
                              </span>
                              <span className="text-gray-500 dark:text-gray-400 mx-1">
                                /
                              </span>
                              <span className="text-red-600 dark:text-red-400">
                                {player.stats?.losses || 0}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {player.stats?.matchesPlayed || 0}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
