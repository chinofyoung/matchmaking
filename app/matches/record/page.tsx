"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { recordMatchResult } from "@/firebase/matchService";
import { getRecentTeamCompositions } from "@/firebase/playerService";
import { TeamComposition, Player } from "@/app/types";
import { getMmrTierColor } from "@/firebase/mmrService";

// This client component safely uses useSearchParams inside Suspense
function MatchRecordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const teamId = searchParams.get("teamId");

  const [teamComposition, setTeamComposition] =
    useState<TeamComposition | null>(null);
  const [winningTeam, setWinningTeam] = useState<"team1" | "team2">("team1");
  const [scoreSummary, setScoreSummary] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTeamComposition = async () => {
      if (!teamId) {
        setError("No team composition ID provided");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);

        // Get all recent compositions and find the matching one
        const compositions = await getRecentTeamCompositions(50);
        const matchingComposition = compositions.find(
          (comp) => comp.id === teamId
        );

        if (!matchingComposition) {
          setError("Team composition not found");
        } else {
          setTeamComposition(matchingComposition);
        }
      } catch (error) {
        console.error("Error loading team composition:", error);
        setError("Failed to load team composition data");
      } finally {
        setIsLoading(false);
      }
    };

    loadTeamComposition();
  }, [teamId]);

  const handleRecordResult = async () => {
    if (!teamComposition?.id) {
      setError("No team composition found to record result");
      return;
    }

    try {
      setIsSaving(true);

      // Record the match result
      await recordMatchResult(
        teamComposition.id,
        winningTeam,
        scoreSummary,
        notes
      );

      // Redirect to matches page
      router.push("/matches");
    } catch (error) {
      console.error("Error recording match result:", error);
      setError("Failed to record match result. Please try again.");
      setIsSaving(false);
    }
  };

  // Function to get role colors
  const getRoleColor = (role: string): string => {
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
          Record Match Result
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400">
          Enter the outcome of this match to update player statistics
        </p>
      </section>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-md text-center mb-4">
          {error}
          <div className="mt-4">
            <button
              onClick={() => router.push("/matches")}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md transition-colors"
            >
              Back to Matches
            </button>
          </div>
        </div>
      ) : teamComposition ? (
        <div>
          {/* Match Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">
              Match Details
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Match date: {new Date(teamComposition.date).toLocaleDateString()}{" "}
              {new Date(teamComposition.date).toLocaleTimeString()}
            </div>

            {/* Teams Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div
                className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-4 ${
                  winningTeam === "team1"
                    ? "border-green-500 dark:border-green-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">
                    Team 1
                  </h3>
                  <span className="ml-auto">
                    <input
                      type="radio"
                      id="team1-winner"
                      name="winning-team"
                      value="team1"
                      checked={winningTeam === "team1"}
                      onChange={() => setWinningTeam("team1")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="team1-winner"
                      className="text-sm font-medium text-green-600 dark:text-green-400"
                    >
                      Winner
                    </label>
                  </span>
                </div>
                <ul className="space-y-1">
                  {teamComposition.team1.map(
                    (player: Player, index: number) => (
                      <li key={index} className="text-sm flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${getMmrTierColor(
                            player.stats?.mmr || player.mmr
                          ).replace("text-", "bg-")}`}
                        ></span>
                        <span>{player.name}</span>
                        <div className="ml-2 flex flex-wrap gap-1">
                          {player.roles.map((role) => (
                            <span
                              key={role}
                              className={`text-xs px-1 py-0.5 rounded-full ${getRoleColor(
                                role
                              )}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div
                className={`bg-white dark:bg-gray-800 border-2 rounded-lg p-4 ${
                  winningTeam === "team2"
                    ? "border-green-500 dark:border-green-600"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center mb-2">
                  <h3 className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                    Team 2
                  </h3>
                  <span className="ml-auto">
                    <input
                      type="radio"
                      id="team2-winner"
                      name="winning-team"
                      value="team2"
                      checked={winningTeam === "team2"}
                      onChange={() => setWinningTeam("team2")}
                      className="mr-2"
                    />
                    <label
                      htmlFor="team2-winner"
                      className="text-sm font-medium text-green-600 dark:text-green-400"
                    >
                      Winner
                    </label>
                  </span>
                </div>
                <ul className="space-y-1">
                  {teamComposition.team2.map(
                    (player: Player, index: number) => (
                      <li key={index} className="text-sm flex items-center">
                        <span
                          className={`w-2 h-2 rounded-full mr-2 ${getMmrTierColor(
                            player.stats?.mmr || player.mmr
                          ).replace("text-", "bg-")}`}
                        ></span>
                        <span>{player.name}</span>
                        <div className="ml-2 flex flex-wrap gap-1">
                          {player.roles.map((role) => (
                            <span
                              key={role}
                              className={`text-xs px-1 py-0.5 rounded-full ${getRoleColor(
                                role
                              )}`}
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>

            {/* Result Info */}
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="score-summary"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Score Summary (optional)
                </label>
                <input
                  id="score-summary"
                  type="text"
                  value={scoreSummary}
                  onChange={(e) => setScoreSummary(e.target.value)}
                  placeholder="e.g., 25-18"
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label
                  htmlFor="notes"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Match Notes (optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any noteworthy events or comments about the match"
                  rows={3}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div className="flex justify-center gap-4 pt-4">
                <button
                  onClick={() => router.push("/matches")}
                  className="bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-6 py-2 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRecordResult}
                  disabled={isSaving}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md transition-colors flex items-center justify-center"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Match Result"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-600 dark:text-gray-400">
          No team composition found
        </div>
      )}
    </div>
  );
}

// The main page component that wraps the form with Suspense
export default function RecordMatchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      }
    >
      <MatchRecordForm />
    </Suspense>
  );
}
