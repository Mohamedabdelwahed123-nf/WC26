import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Le pseudo doit faire au moins 3 caractères")
    .max(20, "Le pseudo doit faire au plus 20 caractères")
    .regex(/^[a-zA-Z0-9_]+$/, "Lettres, chiffres et _ uniquement"),
  password: z
    .string()
    .min(6, "Le mot de passe doit faire au moins 6 caractères")
    .max(100),
  inviteCode: z.string().min(1, "Code d'invitation requis"),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Données invalides" },
      { status: 400 },
    );
  }

  const { username, password, inviteCode } = parsed.data;

  const expectedCode = process.env.INVITE_CODE;
  if (!expectedCode) {
    return NextResponse.json(
      { error: "Inscription désactivée (INVITE_CODE manquant côté serveur)" },
      { status: 500 },
    );
  }
  if (inviteCode !== expectedCode) {
    return NextResponse.json(
      { error: "Code d'invitation incorrect" },
      { status: 403 },
    );
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "Ce pseudo est déjà pris" },
      { status: 409 },
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { username, passwordHash, role: "PLAYER" },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
