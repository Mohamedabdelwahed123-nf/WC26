import type { Stage } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import {
  MatchCard,
  type MatchCardMatch,
  type RevealPrediction,
} from "@/components/match-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STAGE_SHORT, STAGE_ORDER, formatDay, dayKey } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function MatchesPage() {
  const me = await getCurrentUser();
  if (!me) return null;

  const now = Date.now();

  const matches = await prisma.match.findMany({
    orderBy: { kickoff: "asc" },
  });

  const lockedIds = matches
    .filter((m) => m.kickoff.getTime() <= now)
    .map((m) => m.id);

  const [myPreds, revealPreds] = await Promise.all([
    prisma.prediction.findMany({ where: { userId: me.id } }),
    prisma.prediction.findMany({
      where: { matchId: { in: lockedIds } },
      include: { user: { select: { username: true } } },
    }),
  ]);

  const myPredMap = new Map(myPreds.map((p) => [p.matchId, p]));
  const revealMap = new Map<string, RevealPrediction[]>();
  for (const p of revealPreds) {
    const arr = revealMap.get(p.matchId) ?? [];
    arr.push({
      userId: p.userId,
      username: p.user.username,
      predA: p.predA,
      predB: p.predB,
      points: p.points,
    });
    revealMap.set(p.matchId, arr);
  }

  const renderList = (list: typeof matches) => {
    if (list.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-white/70">
          Aucun match dans cette catégorie.
        </p>
      );
    }
    // Regroupement par jour (fuseau d'affichage).
    const groups: { key: string; label: string; items: typeof matches }[] = [];
    for (const m of list) {
      const k = dayKey(m.kickoff);
      let g = groups.find((x) => x.key === k);
      if (!g) {
        g = { key: k, label: formatDay(m.kickoff), items: [] };
        groups.push(g);
      }
      g.items.push(m);
    }

    return (
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.key}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/70">
              {g.label}
            </h3>
            <div className="space-y-3">
              {g.items.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m as MatchCardMatch}
                  myPrediction={
                    myPredMap.has(m.id)
                      ? {
                          predA: myPredMap.get(m.id)!.predA,
                          predB: myPredMap.get(m.id)!.predB,
                          points: myPredMap.get(m.id)!.points,
                        }
                      : null
                  }
                  reveal={revealMap.get(m.id)}
                  meId={me.id}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const presentStages = STAGE_ORDER.filter((s) =>
    matches.some((m) => m.stage === s),
  );

  // Onglet par défaut : la phase du prochain match à venir, sinon "all".
  const next = matches.find((m) => m.kickoff.getTime() > now);
  const defaultTab: string = next ? next.stage : "all";

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl tracking-wide text-white">
        Les matchs
      </h1>

      <Tabs defaultValue={defaultTab}>
        <TabsList>
          <TabsTrigger value="all">Tous</TabsTrigger>
          {presentStages.map((s) => (
            <TabsTrigger key={s} value={s}>
              {STAGE_SHORT[s as Stage]}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="all">{renderList(matches)}</TabsContent>
        {presentStages.map((s) => (
          <TabsContent key={s} value={s}>
            {renderList(matches.filter((m) => m.stage === s))}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
