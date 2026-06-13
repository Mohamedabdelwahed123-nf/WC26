import { formatInTimeZone } from "date-fns-tz";
import { fr } from "date-fns/locale";
import type { Stage } from "@prisma/client";

// Fuseau d'affichage par défaut (Tunisie, UTC+1). Les dates sont stockées en UTC.
export const DISPLAY_TIMEZONE = "Africa/Tunis";

/** "jeu. 11 juin · 19:00" */
export function formatKickoff(date: Date | string): string {
  return formatInTimeZone(new Date(date), DISPLAY_TIMEZONE, "EEE d MMM · HH:mm", {
    locale: fr,
  });
}

/** "11 juin 2026" — en-tête de journée */
export function formatDay(date: Date | string): string {
  return formatInTimeZone(new Date(date), DISPLAY_TIMEZONE, "EEEE d MMMM yyyy", {
    locale: fr,
  });
}

/** "11/06" — clé courte de regroupement par jour (dans le fuseau d'affichage) */
export function dayKey(date: Date | string): string {
  return formatInTimeZone(new Date(date), DISPLAY_TIMEZONE, "yyyy-MM-dd");
}

/** "19:00" */
export function formatTime(date: Date | string): string {
  return formatInTimeZone(new Date(date), DISPLAY_TIMEZONE, "HH:mm");
}

export const STAGE_LABEL: Record<Stage, string> = {
  GROUP: "Phase de groupes",
  R32: "16es de finale",
  R16: "8es de finale",
  QF: "Quarts de finale",
  SF: "Demi-finales",
  THIRD: "Petite finale",
  FINAL: "Finale",
};

export const STAGE_SHORT: Record<Stage, string> = {
  GROUP: "Groupes",
  R32: "16es",
  R16: "8es",
  QF: "Quarts",
  SF: "Demies",
  THIRD: "3e place",
  FINAL: "Finale",
};

// Pastilles de phase — couleurs pleines lisibles sur cartes blanches.
export const STAGE_COLOR: Record<Stage, string> = {
  GROUP: "bg-secondary text-secondary-foreground border-transparent",
  R32: "bg-violet text-white border-transparent",
  R16: "bg-magenta text-white border-transparent",
  QF: "bg-orange text-white border-transparent",
  SF: "bg-lime text-white border-transparent",
  FINAL: "bg-gold-gradient text-white border-transparent font-bold",
  THIRD: "bg-secondary text-muted-foreground border-transparent",
};

export const STAGE_ORDER: Stage[] = [
  "GROUP",
  "R32",
  "R16",
  "QF",
  "SF",
  "THIRD",
  "FINAL",
];
