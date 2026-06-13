// Barème de points — cumulatif, maximum 3 points par match.
//   +1 si le résultat (1 / X / 2) est correct
//   +1 si la différence de buts est correcte
//   +1 si le score exact est correct
//
// Exemples (score réel 2-1) :
//   pronostic 3-2 -> 1 (résultat) + 1 (différence) = 2 pts
//   pronostic 2-1 -> 1 + 1 + 1 = 3 pts
//   pronostic 0-1 -> 0 pt
//
// Cas particulier du match nul : tout nul pronostiqué pour un nul réel
// obtient le point de "différence de buts" (différence 0 = 0) ET le point de
// "résultat" (signe 0 = 0). Ex : réel 1-1, pronostic 0-0 -> 2 pts.

/** Signe d'une différence de buts : 1 (équipe A gagne), -1 (équipe B gagne), 0 (nul). */
function outcome(a: number, b: number): number {
  return Math.sign(a - b);
}

export interface ScoreBreakdown {
  total: number;
  correctOutcome: boolean;
  correctDifference: boolean;
  exactScore: boolean;
}

/**
 * Calcule le détail des points d'un pronostic face à un résultat réel.
 * Fonction pure et idempotente.
 */
export function scoreBreakdown(
  predA: number,
  predB: number,
  realA: number,
  realB: number,
): ScoreBreakdown {
  const correctOutcome = outcome(predA, predB) === outcome(realA, realB);
  const correctDifference = predA - predB === realA - realB;
  const exactScore = predA === realA && predB === realB;

  let total = 0;
  if (correctOutcome) total += 1;
  if (correctDifference) total += 1;
  if (exactScore) total += 1;

  return { total, correctOutcome, correctDifference, exactScore };
}

/** Raccourci : nombre de points (0 à 3) d'un pronostic. */
export function computePoints(
  predA: number,
  predB: number,
  realA: number,
  realB: number,
): number {
  return scoreBreakdown(predA, predB, realA, realB).total;
}
