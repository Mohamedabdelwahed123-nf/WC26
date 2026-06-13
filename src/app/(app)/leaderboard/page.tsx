import type { Stage } from "@prisma/client";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getStandings, type StandingRow } from "@/lib/standings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { STAGE_SHORT, STAGE_ORDER } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StandingsTable({
  rows,
  meId,
}: {
  rows: StandingRow[];
  meId: string;
}) {
  if (rows.every((r) => r.played === 0)) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Pas encore de résultats pour ce classement.
      </p>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-border/60 px-3 py-2 text-[10px] uppercase tracking-widest text-muted-foreground">
        <span>#</span>
        <span>Joueur</span>
        <span className="text-right">Pts</span>
      </div>
      <div className="divide-y divide-border/60">
        {rows.map((r) => (
          <Link
            key={r.userId}
            href={`/profile/${r.userId}`}
            className={cn(
              "grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/50",
              r.userId === meId && "bg-secondary/40",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-full font-display text-xs",
                r.rank === 1
                  ? "bg-gold-gradient text-white"
                  : r.rank <= 3
                    ? "bg-secondary text-gold-light"
                    : "text-muted-foreground",
              )}
            >
              {r.rank}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">@{r.username}</p>
              <p className="text-[11px] text-muted-foreground">
                {r.exactScores} exacts · {r.correctOutcomes} bons résultats ·{" "}
                {r.played} joués
              </p>
            </div>
            <span className="text-right font-display text-lg tabular-nums">
              {r.total}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}

export default async function LeaderboardPage() {
  const me = await getCurrentUser();
  if (!me) return null;

  const finishedStages = await prisma.match.findMany({
    where: { finished: true },
    select: { stage: true },
    distinct: ["stage"],
  });
  const presentStages = STAGE_ORDER.filter((s) =>
    finishedStages.some((m) => m.stage === s),
  );

  const global = await getStandings();
  const perStage = await Promise.all(
    presentStages.map((s) => getStandings(s as Stage)),
  );

  return (
    <div>
      <h1 className="mb-4 flex items-center gap-2 font-display text-2xl tracking-wide text-white">
        <Trophy className="h-6 w-6 text-gold-light" /> Classement
      </h1>

      <Tabs defaultValue="global">
        <TabsList>
          <TabsTrigger value="global">Général</TabsTrigger>
          {presentStages.map((s) => (
            <TabsTrigger key={s} value={s}>
              {STAGE_SHORT[s as Stage]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="global">
          <StandingsTable rows={global} meId={me.id} />
        </TabsContent>
        {presentStages.map((s, i) => (
          <TabsContent key={s} value={s}>
            <StandingsTable rows={perStage[i]} meId={me.id} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
