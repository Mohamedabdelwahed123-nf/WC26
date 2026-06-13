import type { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Note sur les départages : un pronostic ne rapporte de points que si le résultat
// (1/X/2) est correct (la différence ou le score exact impliquent le bon résultat).
// Donc, à partir des points stockés :
//   - score exact  <=> points === 3
//   - bon résultat <=> points >= 1
// ce qui permet de calculer les départages sans recalculer le détail.

export interface StandingRow {
  rank: number;
  userId: string;
  username: string;
  total: number;
  exactScores: number; // départage 1
  correctOutcomes: number; // départage 2
  played: number;
}

/** Classement global (ou filtré par phase) avec départages. */
export async function getStandings(stage?: Stage): Promise<StandingRow[]> {
  const users = await prisma.user.findMany({
    // Les admins n'apparaissent pas dans le classement (ils organisent, ils ne jouent pas).
    where: { role: "PLAYER" },
    select: {
      id: true,
      username: true,
      pointsAdjustment: true,
      predictions: {
        where: { match: { finished: true, ...(stage ? { stage } : {}) } },
        select: { points: true },
      },
    },
  });

  const rows = users.map((u) => {
    const matchPoints = u.predictions.reduce((s, p) => s + p.points, 0);
    // L'ajustement admin est global : on ne l'applique qu'au classement général,
    // pas aux classements par phase (sinon il fausserait chaque phase).
    const total = matchPoints + (stage ? 0 : u.pointsAdjustment);
    const exactScores = u.predictions.filter((p) => p.points === 3).length;
    const correctOutcomes = u.predictions.filter((p) => p.points >= 1).length;
    return {
      userId: u.id,
      username: u.username,
      total,
      exactScores,
      correctOutcomes,
      played: u.predictions.length,
    };
  });

  rows.sort(
    (a, b) =>
      b.total - a.total ||
      b.exactScores - a.exactScores ||
      b.correctOutcomes - a.correctOutcomes ||
      a.username.localeCompare(b.username),
  );

  // Rang avec égalités (même rang si total + départages identiques).
  let lastRank = 0;
  let lastKey = "";
  return rows.map((r, i) => {
    const key = `${r.total}-${r.exactScores}-${r.correctOutcomes}`;
    const rank = key === lastKey ? lastRank : i + 1;
    lastRank = rank;
    lastKey = key;
    return { rank, ...r };
  });
}

export interface BreakdownEntry {
  matchId: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  kickoff: Date;
  stage: Stage;
  group: string | null;
  scoreA: number | null;
  scoreB: number | null;
  finished: boolean;
  predA: number;
  predB: number;
  points: number;
}

/** Détail match par match des pronostics d'un joueur (pour la page profil). */
export async function getUserBreakdown(userId: string): Promise<{
  username: string | null;
  entries: BreakdownEntry[];
  totals: {
    total: number;
    matchPoints: number;
    adjustment: number;
    exactScores: number;
    correctOutcomes: number;
    played: number;
  };
} | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, pointsAdjustment: true },
  });
  if (!user) return null;

  const preds = await prisma.prediction.findMany({
    where: { userId },
    include: { match: true },
    orderBy: { match: { kickoff: "asc" } },
  });

  const entries: BreakdownEntry[] = preds.map((p) => ({
    matchId: p.matchId,
    teamA: p.match.teamA,
    teamB: p.match.teamB,
    flagA: p.match.flagA,
    flagB: p.match.flagB,
    kickoff: p.match.kickoff,
    stage: p.match.stage,
    group: p.match.group,
    scoreA: p.match.scoreA,
    scoreB: p.match.scoreB,
    finished: p.match.finished,
    predA: p.predA,
    predB: p.predB,
    points: p.points,
  }));

  const finished = entries.filter((e) => e.finished);
  const matchPoints = finished.reduce((s, e) => s + e.points, 0);
  const totals = {
    matchPoints,
    adjustment: user.pointsAdjustment,
    total: matchPoints + user.pointsAdjustment,
    exactScores: finished.filter((e) => e.points === 3).length,
    correctOutcomes: finished.filter((e) => e.points >= 1).length,
    played: finished.length,
  };

  return { username: user.username, entries, totals };
}
