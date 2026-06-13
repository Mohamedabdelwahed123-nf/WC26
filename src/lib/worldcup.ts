// Récupération + analyse du calendrier officieux openfootball (Coupe du Monde 2026).
// Source : https://github.com/openfootball/worldcup.json
//
// Format d'un match source :
//   {
//     "round": "Matchday 1" | "Round of 32" | "Quarter-final" | "Final" | ...,
//     "num": 73,                     // présent surtout en phase finale
//     "date": "2026-06-11",
//     "time": "13:00 UTC-6",         // heure locale + décalage UTC
//     "team1": "Mexico" | "2A" | "W101",
//     "team2": "South Africa",
//     "group": "Group A",            // phase de groupes uniquement
//     "ground": "Mexico City",
//     "score": { "ft": [2, 1], "ht": [1, 0] }  // ajouté quand le match est terminé
//   }

import type { Stage } from "@prisma/client";

export const WORLDCUP_JSON_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";

export interface SourceMatch {
  round: string;
  num?: number;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
  score?: { ft?: [number, number]; ht?: [number, number] };
}

export interface WorldCupFeed {
  name: string;
  matches: SourceMatch[];
}

/** Télécharge et valide le flux. Lève une erreur en cas de réseau / JSON / structure invalide. */
export async function fetchWorldCupFeed(
  url: string = WORLDCUP_JSON_URL,
): Promise<WorldCupFeed> {
  const res = await fetch(url, {
    // Toujours frais côté cron / seed.
    cache: "no-store",
    headers: { "User-Agent": "mondial26-pronos" },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status} en récupérant le calendrier`);
  }

  const data = (await res.json()) as unknown;

  if (
    !data ||
    typeof data !== "object" ||
    !Array.isArray((data as WorldCupFeed).matches)
  ) {
    throw new Error("Structure JSON invalide : champ 'matches' manquant");
  }

  return data as WorldCupFeed;
}

/** Mappe le libellé de round de la source vers notre enum Stage. */
export function stageFromRound(round: string): Stage {
  const r = round.trim().toLowerCase();
  if (r.startsWith("matchday")) return "GROUP";
  if (r === "round of 32") return "R32";
  if (r === "round of 16") return "R16";
  if (r === "quarter-final" || r === "quarterfinal") return "QF";
  if (r === "semi-final" || r === "semifinal") return "SF";
  if (r === "match for third place" || r.includes("third")) return "THIRD";
  if (r === "final") return "FINAL";
  // Repli prudent : tout libellé inconnu est traité comme phase de groupes.
  return "GROUP";
}

/**
 * Convertit une date "YYYY-MM-DD" + une heure "HH:MM UTC±H" en instant UTC (Date).
 * Retourne null si le format est inattendu (le match sera ignoré / journalisé).
 *
 * Ex : "2026-06-11" + "13:00 UTC-6" -> 13:00 à UTC-6 = 19:00 UTC.
 */
export function parseKickoffUTC(date: string, time: string): Date | null {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})\s*UTC\s*([+-]\d{1,2})$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;

  const [, y, mo, d] = dateMatch;
  const [, hh, mm, off] = timeMatch;
  const offsetHours = parseInt(off, 10);

  // Date.UTC interprète hh:mm comme de l'UTC ; on retranche le décalage local
  // pour obtenir l'instant UTC réel : UTC = heureLocale - offset.
  const ms =
    Date.UTC(
      parseInt(y, 10),
      parseInt(mo, 10) - 1,
      parseInt(d, 10),
      parseInt(hh, 10),
      parseInt(mm, 10),
    ) -
    offsetHours * 3600 * 1000;

  const result = new Date(ms);
  return Number.isNaN(result.getTime()) ? null : result;
}

/** Extrait le score final [A, B] d'un match source, ou null s'il n'est pas terminé. */
export function extractFinalScore(m: SourceMatch): [number, number] | null {
  const ft = m.score?.ft;
  if (
    Array.isArray(ft) &&
    ft.length === 2 &&
    Number.isInteger(ft[0]) &&
    Number.isInteger(ft[1])
  ) {
    return [ft[0], ft[1]];
  }
  return null;
}
