import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { applyMatchScore, recomputeMatchPoints } from "@/lib/results";

const STAGES = ["GROUP", "R32", "R16", "QF", "SF", "THIRD", "FINAL"] as const;

const editSchema = z.object({
  teamA: z.string().trim().min(1).optional(),
  teamB: z.string().trim().min(1).optional(),
  flagA: z.string().trim().optional(),
  flagB: z.string().trim().optional(),
  kickoff: z.string().datetime().optional(),
  stage: z.enum(STAGES).optional(),
  group: z.string().trim().nullable().optional(),
  // score: objet => saisie manuelle (verrouille contre le cron) ; null => effacer le résultat.
  score: z
    .object({
      a: z.number().int().min(0).max(99),
      b: z.number().int().min(0).max(99),
    })
    .nullable()
    .optional(),
});

async function requireAdmin() {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès réservé à l'admin" }, { status: 403 });
  }

  const match = await prisma.match.findUnique({ where: { id: params.id } });
  if (!match) {
    return NextResponse.json({ error: "Match introuvable" }, { status: 404 });
  }

  const parsed = editSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // 1) Mise à jour des champs d'affichage (hors score).
  const fields: Record<string, unknown> = {};
  if (d.teamA !== undefined) fields.teamA = d.teamA;
  if (d.teamB !== undefined) fields.teamB = d.teamB;
  if (d.flagA !== undefined) fields.flagA = d.flagA;
  if (d.flagB !== undefined) fields.flagB = d.flagB;
  if (d.kickoff !== undefined) fields.kickoff = new Date(d.kickoff);
  if (d.stage !== undefined) fields.stage = d.stage;
  if (d.group !== undefined) fields.group = d.group;

  if (Object.keys(fields).length > 0) {
    await prisma.match.update({ where: { id: params.id }, data: fields });
  }

  // 2) Gestion du score (si la clé est présente dans la requête).
  if (d.score !== undefined) {
    if (d.score === null) {
      // Effacer le résultat : on lève aussi l'override manuel (le cron pourra reprendre la main).
      await prisma.match.update({
        where: { id: params.id },
        data: {
          scoreA: null,
          scoreB: null,
          finished: false,
          manualOverride: false,
        },
      });
      await recomputeMatchPoints(params.id);
    } else {
      // Saisie manuelle => manualOverride = true, puis recalcul des points.
      await applyMatchScore(params.id, d.score.a, d.score.b, { manual: true });
    }
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès réservé à l'admin" }, { status: 403 });
  }

  await prisma.match.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
