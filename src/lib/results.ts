// Moteur de résultats : application d'un score + recalcul (idempotent) des points,
// et synchronisation depuis le flux openfootball (utilisé par le cron et l'admin).

import { prisma } from "@/lib/prisma";
import { computePoints } from "@/lib/scoring";
import {
  extractFinalScore,
  fetchWorldCupFeed,
  type SourceMatch,
} from "@/lib/worldcup";

/**
 * Recalcule les points de TOUS les pronostics d'un match.
 * Idempotent : peut être appelée autant de fois que nécessaire.
 * - Si le match n'a pas de score, tous les pronostics repassent à 0.
 */
export async function recomputeMatchPoints(matchId: string): Promise<void> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { predictions: true },
  });
  if (!match) return;

  const hasResult = match.scoreA !== null && match.scoreB !== null;

  await prisma.$transaction(
    match.predictions.map((p) => {
      const points = hasResult
        ? computePoints(p.predA, p.predB, match.scoreA!, match.scoreB!)
        : 0;
      return prisma.prediction.update({
        where: { id: p.id },
        data: { points },
      });
    }),
  );
}

export interface ApplyScoreOptions {
  /** true = saisie/override admin : verrouille le match contre le cron. */
  manual?: boolean;
}

/**
 * Définit le score d'un match puis recalcule les points.
 * - manual=true => manualOverride=true (le cron ne réécrira plus ce match).
 * - scoreA/scoreB null => efface le résultat (match remis "non terminé").
 */
export async function applyMatchScore(
  matchId: string,
  scoreA: number | null,
  scoreB: number | null,
  options: ApplyScoreOptions = {},
): Promise<void> {
  const finished = scoreA !== null && scoreB !== null;

  await prisma.match.update({
    where: { id: matchId },
    data: {
      scoreA,
      scoreB,
      finished,
      ...(options.manual ? { manualOverride: true } : {}),
    },
  });

  await recomputeMatchPoints(matchId);
}

export interface SyncSummary {
  fetched: number;
  updated: number;
  unchanged: number;
  skippedManual: number;
  skippedNoScore: number;
  skippedUnmatched: number;
  errors: string[];
}

/**
 * Synchronise les scores depuis le flux openfootball.
 * Jointure stable par `sourceIndex` (insensible aux renommages d'équipes côté source).
 * Ne lève jamais d'exception « fatale » : chaque problème est journalisé et le match ignoré.
 */
export async function syncResultsFromFeed(): Promise<SyncSummary> {
  const summary: SyncSummary = {
    fetched: 0,
    updated: 0,
    unchanged: 0,
    skippedManual: 0,
    skippedNoScore: 0,
    skippedUnmatched: 0,
    errors: [],
  };

  const feed = await fetchWorldCupFeed();
  summary.fetched = feed.matches.length;

  // Charge tous les matchs en mémoire, indexés par sourceIndex.
  const dbMatches = await prisma.match.findMany();
  const byIndex = new Map(dbMatches.map((m) => [m.sourceIndex, m]));

  for (let i = 0; i < feed.matches.length; i++) {
    const sm: SourceMatch = feed.matches[i];
    try {
      const dbMatch = byIndex.get(i);
      if (!dbMatch) {
        summary.skippedUnmatched++;
        summary.errors.push(`index ${i} (${sm.team1} vs ${sm.team2}) introuvable en base`);
        continue;
      }

      const finalScore = extractFinalScore(sm);
      if (!finalScore) {
        summary.skippedNoScore++;
        continue;
      }

      if (dbMatch.manualOverride) {
        summary.skippedManual++;
        continue;
      }

      const [a, b] = finalScore;
      const changed =
        dbMatch.scoreA !== a || dbMatch.scoreB !== b || !dbMatch.finished;

      if (!changed) {
        summary.unchanged++;
        continue;
      }

      await applyMatchScore(dbMatch.id, a, b, { manual: false });
      summary.updated++;
    } catch (err) {
      // On n'interrompt jamais la boucle : un match défaillant n'empêche pas les autres.
      const msg = err instanceof Error ? err.message : String(err);
      summary.errors.push(`index ${i}: ${msg}`);
    }
  }

  return summary;
}
