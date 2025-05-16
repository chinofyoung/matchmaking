"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlayersFromFirestore } from "../firebase/playerService";
import { getRecentTeamCompositions } from "../firebase/playerService";
import {
  getRecentMatchResults,
  getTopPlayersByWinRate,
} from "../firebase/matchService";
import { Player, TeamComposition, MatchResult } from "./types";
import { playerToGlicko2 } from "../firebase/glicko2Service";

export default function HomePage() {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [recentMatches, setRecentMatches] = useState<MatchResult[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);

        // Load player count and all players
        const allPlayers = await getPlayersFromFirestore();
        setPlayers(allPlayers);
        setPlayerCount(allPlayers.length);

        // Load recent matches
        const matches = await getRecentMatchResults(5);
        setRecentMatches(matches);
        setMatchCount(matches.length);

        // Load top players
        const topPlayersList = await getTopPlayersByWinRate(5);
        setTopPlayers(topPlayersList);
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div>
      <section className="mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-4 text-blue-700 dark:text-blue-400">
          GAPLaban
        </h1>
        <p className="text-center text-gray-700 dark:text-gray-300 mb-8">
          Manage your players, create balanced teams, and track match statistics
        </p>
      </section>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Players
              </h2>
              <div className="text-4xl font-bold mb-2">{playerCount}</div>
              <div className="mt-auto">
                <Link
                  href="/players"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white text-sm font-medium transition-colors"
                >
                  Manage Players
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
                Teams
              </h2>
              <div className="text-sm text-center text-gray-700 dark:text-gray-300 mb-2">
                Create balanced teams based on skill level and roles
              </div>
              <div className="mt-auto">
                <Link
                  href="/teams"
                  className="inline-block mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md text-white text-sm font-medium transition-colors"
                >
                  Create Teams
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 flex flex-col items-center">
              <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Top MMR Players
              </h2>
              <div className="w-full mt-4">
                <div className="space-y-2">
                  {players
                    .filter((player) => (player.stats?.mmr || player.mmr) > 0)
                    .sort(
                      (a, b) =>
                        (b.stats?.mmr || b.mmr) - (a.stats?.mmr || a.mmr)
                    )
                    .slice(0, 3)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between text-sm"
                      >
                        <div className="flex items-center">
                          {index === 0 ? (
                            <span className="text-yellow-500 mr-2">🥇</span>
                          ) : index === 1 ? (
                            <span className="text-gray-400 mr-2">🥈</span>
                          ) : (
                            <span className="text-amber-700 mr-2">🥉</span>
                          )}
                          <span className="font-medium">{player.name}</span>
                        </div>
                        <span className="text-green-600 dark:text-green-400 font-medium">
                          {player.stats?.mmr || player.mmr}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="mt-auto">
                <Link
                  href="/matches"
                  className="inline-block mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-white text-sm font-medium transition-colors"
                >
                  Record Matches
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
                Recent Matches
              </h2>

              {recentMatches.length === 0 ? (
                <p className="text-center text-gray-700 dark:text-gray-300 my-8">
                  No matches recorded yet. Start by creating teams and recording
                  match results.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2 px-4">Date</th>
                        <th className="text-left py-2 px-4">Winner</th>
                        <th className="text-left py-2 px-4">Summary</th>
                        <th className="text-right py-2 px-4">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentMatches.map((match) => (
                        <tr
                          key={match.id}
                          className="border-b dark:border-gray-700"
                        >
                          <td className="py-2 px-4">
                            {new Date(match.matchDate).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                match.winningTeam === "team1"
                                  ? "bg-red-100 dark:bg-red-900/40 text-red-900 dark:text-red-100"
                                  : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-100"
                              }`}
                            >
                              Team {match.winningTeam === "team1" ? "1" : "2"}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            {match.scoreSummary || "No summary"}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Link
                              href={`/matches/${match.teamCompositionId}`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              Details
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 text-center">
                <Link
                  href="/matches"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View All Matches →
                </Link>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">
                Top Players
              </h2>

              {topPlayers.length === 0 ? (
                <p className="text-center text-gray-700 dark:text-gray-300 my-8">
                  No player rankings yet. Record some match results to see
                  rankings.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b dark:border-gray-700">
                        <th className="text-left py-2 px-4">Rank</th>
                        <th className="text-left py-2 px-4">Player</th>
                        <th className="text-center py-2 px-4">Status</th>
                        <th className="text-center py-2 px-4">W/L</th>
                        <th className="text-center py-2 px-4">Win Rate</th>
                        <th className="text-center py-2 px-4">MMR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {topPlayers
                        .sort((a, b) => {
                          // First, sort by reliability status
                          const aMatches = a.stats?.matchesPlayed || 0;
                          const bMatches = b.stats?.matchesPlayed || 0;
                          const aIsReliable = aMatches >= 7;
                          const bIsReliable = bMatches >= 7;

                          // If one player is reliable and the other isn't, prioritize the reliable player
                          if (aIsReliable && !bIsReliable) return -1;
                          if (!aIsReliable && bIsReliable) return 1;

                          // If both are in the same reliability category, use the weighted score
                          const getWeightedScore = (player: Player) => {
                            const matchesPlayed =
                              player.stats?.matchesPlayed || 0;
                            const mmr = player.stats?.mmr || player.mmr;
                            const winRate = player.stats?.winRate || 0;

                            // For reliable players (7+ matches), prioritize win rate
                            if (matchesPlayed >= 7) {
                              // Win rate is the primary factor (multiplied by 100 to make it more significant)
                              let score = winRate * 100;
                              // Add MMR as a secondary factor (divided by 10 to make it less significant)
                              score += mmr / 10;
                              return score;
                            }

                            // For calibrating players, use MMR as primary factor
                            return mmr;
                          };

                          const aScore = getWeightedScore(a);
                          const bScore = getWeightedScore(b);
                          return bScore - aScore;
                        })
                        .map((player, index) => {
                          const matchesPlayed =
                            player.stats?.matchesPlayed || 0;
                          const reliabilityStatus =
                            matchesPlayed >= 7
                              ? "Reliable"
                              : matchesPlayed >= 4
                              ? "Moderate"
                              : "Calibrating";
                          const reliabilityColor =
                            matchesPlayed >= 7
                              ? "text-green-600"
                              : matchesPlayed >= 4
                              ? "text-yellow-600"
                              : "text-blue-600";

                          return (
                            <tr
                              key={player.id}
                              className={`border-b dark:border-gray-700 ${
                                index === 0
                                  ? "bg-yellow-50 dark:bg-yellow-900/10"
                                  : ""
                              }`}
                            >
                              <td className="py-2 px-4">
                                {index === 0 ? (
                                  <span className="text-yellow-500 mr-1">
                                    🏆
                                  </span>
                                ) : (
                                  index + 1
                                )}
                              </td>
                              <td className="py-2 px-4 font-medium">
                                {player.name}
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span
                                  className={`${reliabilityColor} font-medium`}
                                >
                                  {reliabilityStatus}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {player.stats?.wins || 0}
                                </span>
                                {" / "}
                                <span className="text-red-600 dark:text-red-400 font-medium">
                                  {player.stats?.losses || 0}
                                </span>
                              </td>
                              <td className="py-2 px-4 text-center font-bold">
                                {(player.stats?.winRate || 0).toFixed(1)}%
                              </td>
                              <td className="py-2 px-4 text-center">
                                {player.stats?.mmr || player.mmr}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-4 text-center">
                <Link
                  href="/stats"
                  className="text-purple-600 hover:text-purple-800 text-sm font-medium"
                >
                  View Full Rankings →
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
