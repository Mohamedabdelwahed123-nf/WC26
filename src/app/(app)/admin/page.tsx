import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { AdminMatches, type AdminMatch } from "@/components/admin/admin-matches";
import { AdminPlayers, type AdminPlayer } from "@/components/admin/admin-players";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "ADMIN") redirect("/");

  const [matches, users] = await Promise.all([
    prisma.match.findMany({ orderBy: { kickoff: "asc" } }),
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        role: true,
        pointsAdjustment: true,
        predictions: {
          where: { match: { finished: true } },
          select: { points: true },
        },
      },
    }),
  ]);

  const matchData: AdminMatch[] = matches.map((m) => ({
    id: m.id,
    sourceIndex: m.sourceIndex,
    teamA: m.teamA,
    teamB: m.teamB,
    flagA: m.flagA,
    flagB: m.flagB,
    kickoffISO: m.kickoff.toISOString(),
    stage: m.stage,
    group: m.group,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    finished: m.finished,
    manualOverride: m.manualOverride,
  }));

  const playerData: AdminPlayer[] = users
    .map((u) => {
      const matchPoints = u.predictions.reduce((s, p) => s + p.points, 0);
      return {
        id: u.id,
        username: u.username,
        role: u.role,
        adjustment: u.pointsAdjustment,
        matchPoints,
        total: matchPoints + u.pointsAdjustment,
      };
    })
    .sort((a, b) => b.total - a.total || a.username.localeCompare(b.username));

  return (
    <div>
      <h1 className="mb-1 font-display text-2xl tracking-wide text-white">
        Administration
      </h1>
      <p className="mb-5 text-sm text-white/70">
        Gère les matchs, les scores et les joueurs.
      </p>

      <Tabs defaultValue="matches">
        <TabsList>
          <TabsTrigger value="matches">Matchs</TabsTrigger>
          <TabsTrigger value="players">Joueurs</TabsTrigger>
        </TabsList>
        <TabsContent value="matches">
          <AdminMatches matches={matchData} />
        </TabsContent>
        <TabsContent value="players">
          <AdminPlayers players={playerData} meId={me.id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
