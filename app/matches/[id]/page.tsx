"use client";

import React, { useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { getTeamCompositionById } from "@/firebase/playerService";
import { getMatchResultForTeamComposition } from "@/firebase/matchService";
import { TeamComposition, MatchResult, Role } from "@/app/types";
import {
  getMmrTierName,
  getMmrTierColor,
  DEFAULT_MMR_VALUES,
  MmrTier,
} from "@/firebase/mmrService";
import Link from "next/link";
import { TierIcon } from "@/app/components/TierIcon";

type PageParams = {
  id: string;
};

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

export default function MatchDetailPage({ params }: { params: PageParams }) {
  const router = useRouter();
  // Unwrap params with React.use() as recommended by Next.js
  const unwrappedParams = React.use(params as unknown as Promise<PageParams>);
  const matchId = unwrappedParams.id;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teamComposition, setTeamComposition] =
    useState<TeamComposition | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);

  // Add state for dropdown
  const [isTierDropdownOpen, setIsTierDropdownOpen] = useState(false);
  const [selectedTier, setSelectedTier] = useState<MmrTier | null>(null);

  useEffect(() => {
    const loadMatchDetails = async () => {
      if (!matchId) {
        setError("Match ID is required");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Fetch team composition details
        const composition = await getTeamCompositionById(matchId);
        if (!composition) {
          setError("Match not found");
          setIsLoading(false);
          return;
        }
        setTeamComposition(composition);

        // Fetch match result
        const result = await getMatchResultForTeamComposition(matchId);
        if (result) {
          setMatchResult(result);
        }
      } catch (error) {
        console.error("Error loading match details:", error);
        setError("Failed to load match details");
      } finally {
        setIsLoading(false);
      }
    };

    loadMatchDetails();
  }, [matchId]);

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

  // Helper function to get average MMR for a team
  const getTeamAverageMmr = (players: any[]) => {
    if (!players || players.length === 0) return 0;
    const totalMmr = players.reduce((sum, player) => {
      const playerMmr = player.stats?.mmr || player.mmr;
      return sum + playerMmr;
    }, 0);
    return Math.round(totalMmr / players.length);
  };

  // Helper function to group players by tier
  const getPlayersByTier = (players: any[]) => {
    const tiers: Record<string, number> = {};
    players.forEach((player) => {
      const playerMmr = player.stats?.mmr || player.mmr;
      const tier = getMmrTierName(playerMmr);
      tiers[tier] = (tiers[tier] || 0) + 1;
    });
    return Object.entries(tiers);
  };

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-700 dark:text-blue-400">
          Match Details
        </h1>
        <div className="flex justify-center">
          <Link
            href="/matches"
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            ← Back to Matches
          </Link>
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300 rounded-md text-center">
          {error}{" "}
          <Link href="/matches" className="underline ml-2">
            Back to Matches
          </Link>
        </div>
      ) : (
        <>
          {teamComposition && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
              <div className="mb-4 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-purple-600 dark:text-purple-400">
                    Match on{" "}
                    {new Date(teamComposition.date).toLocaleDateString()}
                  </h2>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {new Date(teamComposition.date).toLocaleTimeString()}
                  </p>
                </div>

                {matchResult ? (
                  <div className="flex items-center">
                    <span className="mr-2 text-sm text-gray-700 dark:text-gray-300">
                      Winner:
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        matchResult.winningTeam === "team1"
                          ? "bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100"
                          : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100"
                      }`}
                    >
                      Team {matchResult.winningTeam === "team1" ? "1" : "2"}
                    </span>
                  </div>
                ) : (
                  <Link
                    href={`/matches/record?teamId=${matchId}`}
                    className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
                  >
                    Record Result
                  </Link>
                )}
              </div>

              {matchResult && (
                <div className="mb-6 bg-slate-700 dark:bg-gray-850 p-4 rounded-md">
                  {matchResult.scoreSummary && (
                    <div className="mb-2">
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        Score:
                      </span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {matchResult.scoreSummary}
                      </span>
                    </div>
                  )}
                  {matchResult.notes && (
                    <div>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        Notes:
                      </span>{" "}
                      <span className="text-gray-700 dark:text-gray-300">
                        {matchResult.notes}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Teams Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-4 ${
                    matchResult?.winningTeam === "team1"
                      ? "border-green-500 dark:border-green-600"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                    Team 1
                    {matchResult?.winningTeam === "team1" && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100">
                        Winner
                      </span>
                    )}
                  </h3>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {getPlayersByTier(teamComposition.team1).map(
                      ([tier, count]) => (
                        <span
                          key={tier}
                          className={`text-xs px-2 py-1 rounded-full ${getMmrTierColor(
                            DEFAULT_MMR_VALUES[tier as MmrTier]
                          )}`}
                        >
                          <TierIcon tier={tier as MmrTier} />
                          {count} {tier}
                        </span>
                      )
                    )}
                  </div>

                  <ul className="space-y-2">
                    {teamComposition.team1.map((player, index) => {
                      const playerMmr = player.stats?.mmr || player.mmr;
                      return (
                        <li
                          key={index}
                          className="p-3 rounded flex flex-col bg-slate-700 dark:bg-gray-850"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${getMmrTierColor(
                                  playerMmr
                                ).replace("text-", "bg-")}`}
                              ></span>
                              <span className="font-medium">{player.name}</span>
                              <span
                                className={`ml-2 text-xs px-2 py-0.5 rounded ${getMmrTierColor(
                                  playerMmr
                                )}`}
                              >
                                <TierIcon
                                  tier={getMmrTierName(playerMmr) as MmrTier}
                                />
                                {playerMmr} MMR - {getMmrTierName(playerMmr)}
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
                      );
                    })}
                  </ul>
                </div>

                <div
                  className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-4 ${
                    matchResult?.winningTeam === "team2"
                      ? "border-green-500 dark:border-green-600"
                      : "border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-3">
                    Team 2
                    {matchResult?.winningTeam === "team2" && (
                      <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100">
                        Winner
                      </span>
                    )}
                  </h3>

                  <div className="mb-3 flex flex-wrap gap-2">
                    {getPlayersByTier(teamComposition.team2).map(
                      ([tier, count]) => (
                        <span
                          key={tier}
                          className={`text-xs px-2 py-1 rounded-full ${getMmrTierColor(
                            DEFAULT_MMR_VALUES[tier as MmrTier]
                          )}`}
                        >
                          <TierIcon tier={tier as MmrTier} />
                          {count} {tier}
                        </span>
                      )
                    )}
                  </div>

                  <ul className="space-y-2">
                    {teamComposition.team2.map((player, index) => {
                      const playerMmr = player.stats?.mmr || player.mmr;
                      return (
                        <li
                          key={index}
                          className="p-3 rounded flex flex-col bg-slate-700 dark:bg-gray-850"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <span
                                className={`w-2 h-2 rounded-full mr-2 ${getMmrTierColor(
                                  playerMmr
                                ).replace("text-", "bg-")}`}
                              ></span>
                              <span className="font-medium">{player.name}</span>
                              <span
                                className={`ml-2 text-xs px-2 py-0.5 rounded ${getMmrTierColor(
                                  playerMmr
                                )}`}
                              >
                                <TierIcon
                                  tier={getMmrTierName(playerMmr) as MmrTier}
                                />
                                {playerMmr} MMR - {getMmrTierName(playerMmr)}
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
                      );
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <div className="relative">
        <button
          onClick={() => setIsTierDropdownOpen(!isTierDropdownOpen)}
          className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white flex items-center justify-between ${
            selectedTier
              ? getMmrTierColor(DEFAULT_MMR_VALUES[selectedTier])
              : ""
          }`}
        >
          <span>
            {selectedTier ? (
              <>
                <TierIcon tier={selectedTier} />
                {selectedTier}
              </>
            ) : (
              "Select Tier"
            )}
          </span>
          <svg
            className={`w-4 h-4 transition-transform ${
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
            <div
              className="py-1"
              role="menu"
              aria-orientation="vertical"
              aria-labelledby="tier-menu"
            >
              <button
                onClick={() => {
                  setSelectedTier(null);
                  setIsTierDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white"
                role="menuitem"
              >
                All Tiers
              </button>
              {availableTiers.map((tier) => (
                <button
                  key={tier}
                  onClick={() => {
                    setSelectedTier(tier);
                    setIsTierDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-900 dark:text-white flex items-center"
                  role="menuitem"
                >
                  <TierIcon tier={tier} />
                  <span className="ml-2">{tier}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
