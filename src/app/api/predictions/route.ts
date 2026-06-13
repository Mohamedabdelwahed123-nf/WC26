import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const predictionSchema = z.object({
  matchId: z.string().min(1),
  predA: z.number().int().min(0).max(99),
  predB: z.number().int().min(0).max(99),
});

/**
 * Crée ou met à jour le pronostic de l'utilisateur courant pour un match.
 * VERROU SERVEUR : tout pronostic créé/modifié après le coup d'envoi est rejeté.
 * On ne fait jamais confiance au client pour l'heure.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = predictionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { matchId, predA, predB } = parsed.data;

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  // Verrou au coup d'envoi (heure serveur, en UTC).
  if (Date.now() >= match.kickoff.getTime()) {
    return NextResponse.json(
      { error: "Les pronostics sont fermés pour ce match (coup d'envoi passé)" },
      { status: 403 },
    );
  }

  // Upsert respectant la contrainte unique (userId, matchId).
  const prediction = await prisma.prediction.upsert({
    where: { userId_matchId: { userId: user.id, matchId } },
    update: { predA, predB },
    create: { userId: user.id, matchId, predA, predB },
  });

  return NextResponse.json({
    ok: true,
    prediction: {
      id: prediction.id,
      matchId: prediction.matchId,
      predA: prediction.predA,
      predB: prediction.predB,
    },
  });
}
