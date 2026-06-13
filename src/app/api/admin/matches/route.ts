import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { flagFor } from "@/lib/teams";

const STAGES = ["GROUP", "R32", "R16", "QF", "SF", "THIRD", "FINAL"] as const;

const createSchema = z.object({
  teamA: z.string().trim().min(1),
  teamB: z.string().trim().min(1),
  flagA: z.string().trim().optional(),
  flagB: z.string().trim().optional(),
  kickoff: z.string().datetime({ message: "Date ISO 8601 attendue" }),
  stage: z.enum(STAGES),
  group: z.string().trim().optional().nullable(),
});

/** Crée un match manuellement (admin). Utilise un sourceIndex négatif pour ne pas
 *  entrer en collision avec les matchs issus de la source (index >= 0). */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé à l'admin" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const d = parsed.data;

  // sourceIndex négatif unique pour les matchs créés à la main.
  const min = await prisma.match.aggregate({ _min: { sourceIndex: true } });
  const nextIndex = Math.min(-1, (min._min.sourceIndex ?? 0) - 1);

  const match = await prisma.match.create({
    data: {
      sourceIndex: nextIndex,
      sourceTeam1: d.teamA,
      sourceTeam2: d.teamB,
      sourceDate: d.kickoff.slice(0, 10),
      teamA: d.teamA,
      teamB: d.teamB,
      flagA: d.flagA || flagFor(d.teamA),
      flagB: d.flagB || flagFor(d.teamB),
      kickoff: new Date(d.kickoff),
      stage: d.stage,
      group: d.group ?? null,
    },
  });

  return NextResponse.json({ ok: true, id: match.id }, { status: 201 });
}
