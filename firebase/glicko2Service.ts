import { Player } from "@/app/types";

// Glicko-2 constants
const TAU = 0.5; // System constant that constrains the change in volatility over time
const EPSILON = 0.000001; // Convergence tolerance
const Q = 0.0057565; // Constant used in the Glicko-2 algorithm

interface Glicko2Rating {
  rating: number; // Player's rating
  rd: number; // Rating deviation
  volatility: number; // Rating volatility
}

interface Glicko2Match {
  opponentRating: number;
  opponentRd: number;
  score: number; // 1 for win, 0 for loss, 0.5 for draw
}

// Convert Glicko-2 rating to Glicko-1 rating
function g2ToG1(rating: number, rd: number): number {
  return rating * 173.7178 + 1500;
}

// Convert Glicko-1 rating to Glicko-2 rating
function g1ToG2(rating: number): number {
  return (rating - 1500) / 173.7178;
}

// Convert Glicko-1 RD to Glicko-2 RD
function rdToG2(rd: number): number {
  return rd / 173.7178;
}

// Convert Glicko-2 RD to Glicko-1 RD
function g2ToRd(rd: number): number {
  return rd * 173.7178;
}

// Calculate the expected outcome of a match
function expectedOutcome(
  rating: number,
  opponentRating: number,
  opponentRd: number
): number {
  const g =
    1 / Math.sqrt(1 + (3 * Math.pow(opponentRd, 2)) / Math.pow(Math.PI, 2));
  return 1 / (1 + Math.exp(-g * (rating - opponentRating)));
}

// Calculate the new rating, RD, and volatility
function calculateNewRating(
  currentRating: Glicko2Rating,
  matches: Glicko2Match[]
): Glicko2Rating {
  if (matches.length === 0) {
    return {
      ...currentRating,
      rd: Math.min(
        Math.sqrt(
          Math.pow(currentRating.rd, 2) + Math.pow(currentRating.volatility, 2)
        ),
        350 / 173.7178
      ),
    };
  }

  // Step 1: Determine a rating and RD for each player at the onset of the rating period
  let v = 0;
  let delta = 0;

  for (const match of matches) {
    const E = expectedOutcome(
      currentRating.rating,
      match.opponentRating,
      match.opponentRd
    );
    const g =
      1 /
      Math.sqrt(1 + (3 * Math.pow(match.opponentRd, 2)) / Math.pow(Math.PI, 2));

    v += Math.pow(g, 2) * E * (1 - E);
    delta += g * (match.score - E);
  }

  v = 1 / v;
  delta = delta * v;

  // Step 2: Update the rating and RD
  const a = Math.log(Math.pow(currentRating.volatility, 2));
  const f = (x: number) => {
    const ex = Math.exp(x);
    const newRd = Math.sqrt(Math.pow(currentRating.rd, 2) + ex);
    const newV = 1 / (Math.pow(newRd, 2) + v);
    const newDelta = delta * newV;
    return (
      (ex * (Math.pow(newDelta, 2) - Math.pow(newRd, 2) - v - ex)) /
        (2 * Math.pow(Math.pow(newRd, 2) + v + ex, 2)) -
      (x - a) / Math.pow(TAU, 2)
    );
  };

  // Find the volatility using the Illinois algorithm
  let A = a;
  let B = Math.log(
    Math.pow(
      Math.max(
        Math.pow(delta, 2) - Math.pow(currentRating.rd, 2) - v,
        0.000001
      ),
      2
    )
  );
  let fA = f(A);
  let fB = f(B);

  while (Math.abs(B - A) > EPSILON) {
    const C = A + ((A - B) * fA) / (fB - fA);
    const fC = f(C);

    if (fC * fB < 0) {
      A = B;
      fA = fB;
    } else {
      fA = fA / 2;
    }

    B = C;
    fB = fC;
  }

  const newVolatility = Math.exp(A / 2);
  const newRd = Math.sqrt(
    Math.pow(currentRating.rd, 2) + Math.pow(newVolatility, 2)
  );
  const newRating = currentRating.rating + Math.pow(newRd, 2) * delta;

  return {
    rating: newRating,
    rd: Math.min(newRd, 350 / 173.7178),
    volatility: newVolatility,
  };
}

// Convert player's current rating to Glicko-2 format
export function playerToGlicko2(player: Player): Glicko2Rating {
  const matchesPlayed = player.stats?.matchesPlayed || 0;

  // Calculate RD based on number of matches
  // Use k ≈ 2.04 so that RD = 50 after 5 games
  // Formula: RD = max(350 * e^(-matches/2.04), 50)
  const k = 2.04;
  const rd = Math.max(350 * Math.exp(-matchesPlayed / k), 50);

  return {
    rating: g1ToG2(player.stats?.mmr || player.mmr),
    rd: rdToG2(rd),
    volatility: 0.06, // Initial volatility
  };
}

// Convert Glicko-2 rating back to MMR
export function glicko2ToMMR(glicko2: Glicko2Rating): number {
  return Math.round(g2ToG1(glicko2.rating, glicko2.rd));
}

// Calculate new rating after a match
export function calculateNewRatingAfterMatch(
  player: Player,
  opponent: Player,
  playerWon: boolean
): number {
  const playerGlicko2 = playerToGlicko2(player);
  const opponentGlicko2 = playerToGlicko2(opponent);

  const match: Glicko2Match = {
    opponentRating: opponentGlicko2.rating,
    opponentRd: opponentGlicko2.rd,
    score: playerWon ? 1 : 0,
  };

  const newRating = calculateNewRating(playerGlicko2, [match]);
  return glicko2ToMMR(newRating);
}

// Calculate rating reliability (confidence) based on RD
export const calculateRatingReliability = (rd: number): number => {
  // Convert Glicko-2 RD to Glicko-1 RD
  const glicko1Rd = rd * 173.7178;

  // Calculate reliability based on RD
  // RD of 50 is considered very reliable (after 7 matches)
  // RD of 100 is considered reliable
  // RD of 350 is considered unreliable (new player)
  const reliability = 1 - (glicko1Rd - 50) / (350 - 50);
  return Math.max(0, Math.min(1, reliability));
};

// Get the number of matches needed for a reliable rating
export const getMatchesForReliableRating = (rd: number): number => {
  // Convert Glicko-2 RD to Glicko-1 RD
  const glicko1Rd = rd * 173.7178;

  // If already reliable, no matches needed
  if (glicko1Rd <= 100) return 0;

  // Total matches needed for calibration
  const TOTAL_CALIBRATION_MATCHES = 7;

  // Calculate matches already played using the RD formula
  // RD = 350 * e^(-matches/2.04)
  // Solving for matches: matches = -2.04 * ln(RD/350)
  const k = 2.04;
  const matchesPlayed = Math.ceil(-k * Math.log(glicko1Rd / 350));

  // Return remaining matches needed
  return Math.max(0, TOTAL_CALIBRATION_MATCHES - matchesPlayed);
};
