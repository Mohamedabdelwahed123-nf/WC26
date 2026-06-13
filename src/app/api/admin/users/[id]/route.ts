import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";

const patchSchema = z.object({
  pointsAdjustment: z.number().int().min(-9999).max(9999).optional(),
  role: z.enum(["ADMIN", "PLAYER"]).optional(),
  password: z.string().min(6, "6 caractères minimum").max(100).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé à l'admin" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return NextResponse.json({ error: "Joueur introuvable" }, { status: 404 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }
  const d = parsed.data;

  // Garde-fou : l'admin ne peut pas se rétrograder lui-même (risque de blocage total).
  if (d.role && params.id === me.id && d.role !== "ADMIN") {
    return NextResponse.json(
      { error: "Tu ne peux pas retirer ton propre rôle admin" },
      { status: 400 },
    );
  }

  const data: Record<string, unknown> = {};
  if (d.pointsAdjustment !== undefined) data.pointsAdjustment = d.pointsAdjustment;
  if (d.role !== undefined) data.role = d.role;
  if (d.password !== undefined) {
    data.passwordHash = await bcrypt.hash(d.password, 10);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Rien à mettre à jour" }, { status: 400 });
  }

  await prisma.user.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const me = await getCurrentUser();
  if (me?.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès réservé à l'admin" }, { status: 403 });
  }

  // Garde-fou : pas d'auto-suppression.
  if (params.id === me.id) {
    return NextResponse.json(
      { error: "Tu ne peux pas supprimer ton propre compte" },
      { status: 400 },
    );
  }

  await prisma.user.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
