"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getRecentTeamCompositions } from "@/firebase/playerService";
import { getRecentMatchResults } from "@/firebase/matchService";
import { TeamComposition, MatchResult } from "@/app/types";

export default function MatchesPage() {
  const [teamCompositions, setTeamCompositions] = useState<TeamComposition[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // Load team compositions
        const compositions = await getRecentTeamCompositions(20);
        setTeamCompositions(compositions);

        // Load match results
        const matches = await getRecentMatchResults(20);
        setMatchResults(matches);
      } catch (error) {
        console.error("Error loading match data:", error);
        setError("Failed to load match data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Find match result for a team composition
  const findMatchResult = (teamCompositionId: string | undefined): MatchResult | undefined => {
    if (!teamCompositionId) return undefined;
    return matchResults.find(match => match.teamCompositionId === teamCompositionId);
  };

  // Group team compositions by completed/pending matches
  const completedMatches = teamCompositions.filter(comp => 
    comp.id && findMatchResult(comp.id)
  );
  
  const pendingMatches = teamCompositions.filter(comp => 
    comp.id && !findMatchResult(comp.id)
  );

  return (
    <div>
      <section className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4 text-blue-700 dark:text-blue-400">
          Match Management
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          View match history and record results for pending matches
        </p>
      </section>

      <div className="flex justify-center mb-6">
        <Link
          href="/teams"
          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full shadow-md transition-colors"
        >
          Create New Teams
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
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
      ) : (
        <>
          {/* Pending Matches */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
              Pending Matches ({pendingMatches.length})
            </h2>
            
            {pendingMatches.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 my-4">
                No pending matches. All match results have been recorded.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-4">Date</th>
                      <th className="text-left py-2 px-4">Teams</th>
                      <th className="text-right py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingMatches.map((match) => (
                      <tr key={match.id} className="border-b dark:border-gray-700">
                        <td className="py-2 px-4">
                          {new Date(match.date).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-4">
                          <div className="flex space-x-1 items-center">
                            <span className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 text-xs px-2 py-1 rounded-full">
                              Team 1: {match.team1.length} players
                            </span>
                            <span className="text-gray-500">vs</span>
                            <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs px-2 py-1 rounded-full">
                              Team 2: {match.team2.length} players
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Link 
                              href={`/matches/${match.id}`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              View
                            </Link>
                            <Link 
                              href={`/matches/record?teamId=${match.id}`}
                              className="bg-green-600 hover:bg-green-700 text-white text-sm px-3 py-1 rounded-md transition-colors"
                            >
                              Record Result
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Completed Matches */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">
              Match History ({completedMatches.length})
            </h2>
            
            {completedMatches.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 my-4">
                No match history yet. Record your first match result.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 px-4">Date</th>
                      <th className="text-left py-2 px-4">Winner</th>
                      <th className="text-left py-2 px-4">Score/Notes</th>
                      <th className="text-right py-2 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completedMatches.map((match) => {
                      const matchResult = findMatchResult(match.id);
                      return (
                        <tr key={match.id} className="border-b dark:border-gray-700">
                          <td className="py-2 px-4">
                            {new Date(match.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-4">
                            {matchResult && (
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                matchResult.winningTeam === 'team1'
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
                                  : "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200"
                              }`}>
                                Team {matchResult.winningTeam === 'team1' ? '1' : '2'}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-4">
                            {matchResult?.scoreSummary || "No summary"}
                          </td>
                          <td className="py-2 px-4 text-right">
                            <Link 
                              href={`/matches/${match.id}`}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              View Details
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
