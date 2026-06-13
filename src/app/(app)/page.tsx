import Link from "next/link";
import { ArrowRight, Flame, Trophy, CheckCircle2, Circle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getStandings } from "@/lib/standings";
import { MatchCard } from "@/components/match-card";
import { SectionTitle } from "@/components/section-title";
import { Card } from "@/components/ui/card";
import { Countdown } from "@/components/countdown";
import { StageBadge } from "@/components/stage-badge";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const me = await getCurrentUser();
  if (!me) return null;

  const now = new Date();

  const [upcoming, recent, standings] = await Promise.all([
    prisma.match.findMany({
      where: { kickoff: { gt: now } },
      orderBy: { kickoff: "asc" },
      take: 6,
    }),
    prisma.match.findMany({
      where: { finished: true },
      orderBy: { kickoff: "desc" },
      take: 5,
    }),
    getStandings(),
  ]);

  const relevantIds = [...upcoming, ...recent].map((m) => m.id);
  const myPreds = await prisma.prediction.findMany({
    where: { userId: me.id, matchId: { in: relevantIds } },
  });
  const predByMatch = new Map(myPreds.map((p) => [p.matchId, p]));

  const myStanding = standings.find((s) => s.userId === me.id);
  const top5 = standings.slice(0, 5);
  const [featured, ...restUpcoming] = upcoming;

  return (
    <div>
      {/* Hero — carte « glass » (le shader global transparaît au travers) */}
      <Card className="relative overflow-hidden border-white/10 p-5 text-white">
        <div className="relative z-10">
          <p className="text-sm text-white/70">Salut @{me.name} 👋</p>
          <div className="mt-3 flex flex-wrap items-center gap-x-8 gap-y-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">
                Mon rang
              </p>
              <p className="font-display text-3xl text-gold-metal">
                {myStanding ? `#${myStanding.rank}` : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">
                Mes points
              </p>
              <p className="font-display text-3xl">{myStanding?.total ?? 0}</p>
            </div>
            {featured && (
              <div>
                <p className="flex items-center gap-1 text-xs uppercase tracking-widest text-white/60">
                  <Flame className="h-3 w-3 text-orange" /> Prochain match
                </p>
                <p className="font-display text-2xl">
                  <Countdown target={featured.kickoff} />
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Match à pronostiquer (vedette) */}
      {featured && (
        <>
          <SectionTitle action={{ href: "/matches", label: "Tous les matchs" }}>
            À pronostiquer
          </SectionTitle>
          <MatchCard
            match={featured}
            myPrediction={
              predByMatch.has(featured.id)
                ? {
                    predA: predByMatch.get(featured.id)!.predA,
                    predB: predByMatch.get(featured.id)!.predB,
                    points: predByMatch.get(featured.id)!.points,
                  }
                : null
            }
            meId={me.id}
          />
        </>
      )}

      {/* Prochains matchs (compact) */}
      {restUpcoming.length > 0 && (
        <div className="mt-4 space-y-2">
          {restUpcoming.map((m) => {
            const p = predByMatch.get(m.id);
            return (
              <Link key={m.id} href="/matches" className="block">
                <Card className="flex items-center justify-between gap-3 p-3 transition-colors hover:border-gold-soft">
                  <div className="flex items-center gap-2 min-w-0">
                    <StageBadge stage={m.stage} group={m.group} />
                    <span className="truncate text-sm">
                      {m.flagA} {m.teamA}{" "}
                      <span className="text-muted-foreground">vs</span> {m.teamB}{" "}
                      {m.flagB}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    {p ? (
                      <span className="flex items-center gap-1 text-gold-light">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {p.predA}-{p.predB}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Circle className="h-3.5 w-3.5" />à faire
                      </span>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {/* Derniers résultats */}
      {recent.length > 0 && (
        <>
          <SectionTitle>Derniers résultats</SectionTitle>
          <div className="space-y-2">
            {recent.map((m) => {
              const p = predByMatch.get(m.id);
              return (
                <Card
                  key={m.id}
                  className="flex items-center justify-between gap-3 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      {m.flagA} {m.teamA}{" "}
                      <span className="font-display tabular-nums text-gold-light">
                        {m.scoreA}-{m.scoreB}
                      </span>{" "}
                      {m.teamB} {m.flagB}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatKickoff(m.kickoff)}
                    </p>
                  </div>
                  {p ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-md px-2 py-1 text-xs font-semibold tabular-nums",
                        p.points >= 3
                          ? "bg-gold-gradient text-white"
                          : p.points > 0
                            ? "bg-secondary text-gold-light"
                            : "bg-secondary text-muted-foreground",
                      )}
                    >
                      {p.predA}-{p.predB} · +{p.points}
                    </span>
                  ) : (
                    <span className="shrink-0 text-xs italic text-muted-foreground">
                      non joué
                    </span>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Mini-classement */}
      <SectionTitle action={{ href: "/leaderboard", label: "Classement complet" }}>
        <span className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-gold" /> Top 5
        </span>
      </SectionTitle>
      <Card className="divide-y divide-border/60">
        {top5.length === 0 && (
          <p className="p-4 text-sm text-muted-foreground">
            Aucun point marqué pour l&apos;instant. À toi de jouer !
          </p>
        )}
        {top5.map((s) => (
          <Link
            key={s.userId}
            href={`/profile/${s.userId}`}
            className={cn(
              "flex items-center justify-between gap-3 p-3 transition-colors hover:bg-secondary/50",
              s.userId === me.id && "bg-secondary/40",
            )}
          >
            <div className="flex items-center gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full font-display text-sm",
                  s.rank === 1
                    ? "bg-gold-gradient text-white"
                    : "bg-secondary text-muted-foreground",
                )}
              >
                {s.rank}
              </span>
              <span className="text-sm font-medium">@{s.username}</span>
            </div>
            <span className="font-display tabular-nums">{s.total} pts</span>
          </Link>
        ))}
      </Card>

      <div className="mt-6 flex justify-center">
        <Link
          href="/matches"
          className="flex items-center gap-1 text-sm text-gold-light hover:underline"
        >
          Voir tous les matchs <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
