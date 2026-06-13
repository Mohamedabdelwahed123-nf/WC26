// Script de seed — Mondial 26 Pronostics
//   1. Crée le compte ADMIN (depuis ADMIN_USERNAME / ADMIN_PASSWORD).
//   2. Télécharge le calendrier complet de la Coupe du Monde 2026 (104 matchs)
//      depuis openfootball et insère / met à jour les matchs.
//      Les matchs à élimination directe avec équipes inconnues (ex: "W101 vs W102")
//      sont insérés tels quels comme placeholders, éditables ensuite par l'admin.
//
// Lancement : npm run db:seed

import { PrismaClient, type Stage } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  fetchWorldCupFeed,
  parseKickoffUTC,
  stageFromRound,
  extractFinalScore,
} from "../src/lib/worldcup";
import { flagFor } from "../src/lib/teams";

const prisma = new PrismaClient();

async function seedAdmin() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.warn(
      "⚠️  ADMIN_PASSWORD non défini — compte admin ignoré. Définis-le dans .env puis relance.",
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { username },
    update: { role: "ADMIN" },
    create: { username, passwordHash, role: "ADMIN" },
  });
  console.log(`✅ Compte admin prêt : « ${username} »`);
}

async function seedMatches() {
  console.log("⬇️  Téléchargement du calendrier openfootball…");
  const feed = await fetchWorldCupFeed();
  console.log(`   ${feed.matches.length} matchs reçus.`);

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < feed.matches.length; i++) {
    const sm = feed.matches[i];

    const kickoff = parseKickoffUTC(sm.date, sm.time);
    if (!kickoff) {
      console.warn(`   ⚠️  index ${i} : date/heure illisible (${sm.date} ${sm.time}) — ignoré`);
      skipped++;
      continue;
    }

    const stage: Stage = stageFromRound(sm.round);
    const finalScore = extractFinalScore(sm);

    const data = {
      sourceIndex: i,
      sourceTeam1: sm.team1,
      sourceTeam2: sm.team2,
      sourceDate: sm.date,
      teamA: sm.team1,
      teamB: sm.team2,
      flagA: flagFor(sm.team1),
      flagB: flagFor(sm.team2),
      kickoff,
      stage,
      group: sm.group ?? null,
      ...(finalScore
        ? { scoreA: finalScore[0], scoreB: finalScore[1], finished: true }
        : {}),
    };

    // upsert par sourceIndex (clé stable) — on ne réécrit PAS les champs éditables par l'admin
    // (teamA/teamB/flag/kickoff/stage/score) lors d'un re-seed : seuls les champs source.
    const existing = await prisma.match.findUnique({
      where: { sourceIndex: i },
    });

    if (existing) {
      await prisma.match.update({
        where: { sourceIndex: i },
        data: {
          sourceTeam1: sm.team1,
          sourceTeam2: sm.team2,
          sourceDate: sm.date,
        },
      });
      updated++;
    } else {
      await prisma.match.create({ data });
      created++;
    }
  }

  console.log(
    `✅ Matchs : ${created} créés, ${updated} mis à jour, ${skipped} ignorés.`,
  );
}

async function main() {
  await seedAdmin();
  await seedMatches();
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("🏆 Seed terminé.");
  })
  .catch(async (e) => {
    console.error("❌ Échec du seed :", e);
    await prisma.$disconnect();
    process.exit(1);
  });
