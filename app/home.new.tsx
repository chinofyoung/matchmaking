"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPlayersFromFirestore } from "../firebase/playerService";
import {
  getRecentMatchResults,
  getTopPlayersByWinRate,
} from "../firebase/matchService";
import { Player, MatchResult } from "./types";

export default function HomePage() {
  const [playerCount, setPlayerCount] = useState<number>(0);
  const [matchCount, setMatchCount] = useState<number>(0);
  const [recentMatches, setRecentMatches] = useState<MatchResult[]>([]);
  const [topPlayers, setTopPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const allPlayers = await getPlayersFromFirestore();
        setPlayerCount(allPlayers.length);

        const matches = await getRecentMatchResults(5);
        setRecentMatches(matches);
        setMatchCount(matches.length);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#0F1923]">
        <div className="w-16 h-16 relative">
          <div className="absolute inset-0 border-t-2 border-r-2 border-[#FF4655] rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1923] text-[#ECE8E1]">
      {/* Hero Section */}
      <section className="relative h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent z-10"></div>
        <div className="absolute right-0 w-2/3 h-full bg-[#FF4655]/5 transform -skew-x-12 translate-x-32"></div>

        <div className="container mx-auto px-4 relative z-20">
          <div className="max-w-3xl">
            <h1 className="text-7xl font-bold uppercase mb-6 leading-tight">
              GAPLaban
              <span className="block text-[#FF4655]">Gaming League</span>
            </h1>
            <p className="text-xl text-[#768079] mb-8 max-w-lg">
              Join the elite gaming community. Compete, rank up, and dominate
              the leaderboards.
            </p>
            <div className="flex gap-6">
              <Link
                href="/custom-team"
                className="inline-flex items-center px-8 py-4 bg-[#FF4655] hover:bg-[#FF4655]/90 transform hover:-translate-y-1 transition-all duration-200 uppercase tracking-wider font-medium"
              >
                Create Team
              </Link>
              <Link
                href="/players"
                className="inline-flex items-center px-8 py-4 border border-[#FF4655] hover:bg-[#FF4655]/10 transform hover:-translate-y-1 transition-all duration-200 uppercase tracking-wider font-medium"
              >
                Browse Players
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Overview */}
      <section className="py-20 bg-[#0F1923]">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-black/30 backdrop-blur p-8 border border-[#768079]/20 hover:border-[#FF4655]/50 transition-all duration-300">
              <h3 className="text-[#768079] uppercase tracking-wider text-sm mb-2">
                Total Players
              </h3>
              <p className="text-4xl font-bold">{playerCount}</p>
            </div>
            <div className="bg-black/30 backdrop-blur p-8 border border-[#768079]/20 hover:border-[#FF4655]/50 transition-all duration-300">
              <h3 className="text-[#768079] uppercase tracking-wider text-sm mb-2">
                Matches Played
              </h3>
              <p className="text-4xl font-bold">{matchCount}</p>
            </div>
            <div className="bg-black/30 backdrop-blur p-8 border border-[#768079]/20 hover:border-[#FF4655]/50 transition-all duration-300">
              <h3 className="text-[#768079] uppercase tracking-wider text-sm mb-2">
                Active Teams
              </h3>
              <p className="text-4xl font-bold">{Math.ceil(playerCount / 5)}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Matches */}
      <section className="py-20 bg-gradient-to-b from-[#0F1923] to-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold uppercase">Recent Matches</h2>
            <Link
              href="/matches"
              className="text-[#768079] hover:text-[#FF4655] uppercase tracking-wider text-sm transition-colors duration-200"
            >
              View All Matches →
            </Link>
          </div>

          <div className="grid gap-6">
            {recentMatches.length === 0 ? (
              <div className="bg-black/30 backdrop-blur p-8 border border-[#768079]/20">
                <p className="text-center text-[#768079]">
                  No matches recorded yet.
                </p>
              </div>
            ) : (
              recentMatches.map((match) => (
                <div
                  key={match.id}
                  className="bg-black/30 backdrop-blur p-6 border border-[#768079]/20 hover:border-[#FF4655]/50 transition-all duration-300"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[#768079] text-sm uppercase tracking-wider mb-2">
                        {new Date(match.matchDate).toLocaleDateString()}
                      </p>
                      <h3 className="text-xl font-bold mb-1">
                        Team {match.winningTeam === "team1" ? "1" : "2"} Victory
                      </h3>
                      {match.scoreSummary && (
                        <p className="text-[#768079]">{match.scoreSummary}</p>
                      )}
                    </div>
                    <Link
                      href={`/matches/${match.teamCompositionId}`}
                      className="inline-flex items-center px-6 py-2 border border-[#FF4655] hover:bg-[#FF4655]/10 transition-all duration-200 uppercase tracking-wider text-sm"
                    >
                      Match Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Top Players */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold uppercase">Top Players</h2>
            <Link
              href="/stats"
              className="text-[#768079] hover:text-[#FF4655] uppercase tracking-wider text-sm transition-colors duration-200"
            >
              View Full Rankings →
            </Link>
          </div>

          <div className="grid gap-6">
            {topPlayers.length === 0 ? (
              <div className="bg-black/30 backdrop-blur p-8 border border-[#768079]/20">
                <p className="text-center text-[#768079]">
                  No player rankings yet.
                </p>
              </div>
            ) : (
              topPlayers.slice(0, 5).map((player, index) => (
                <div
                  key={player.id}
                  className="bg-black/30 backdrop-blur p-6 border border-[#768079]/20 hover:border-[#FF4655]/50 transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-12 h-12 bg-[#FF4655] flex items-center justify-center text-xl font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-1">
                          {player.name}
                        </h3>
                        <p className="text-[#768079] text-sm">
                          Matches: {player.stats?.matchesPlayed || 0}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[#768079] text-sm uppercase tracking-wider mb-1">
                        Win Rate
                      </p>
                      <p className="text-2xl font-bold text-[#FF4655]">
                        {((player.stats?.winRate || 0) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
