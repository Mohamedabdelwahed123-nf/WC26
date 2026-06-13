import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { getUserBreakdown } from "@/lib/standings";
import { Card } from "@/components/ui/card";
import { StageBadge } from "@/components/stage-badge";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-3 text-center">
      <p className="font-display text-2xl text-gold-metal tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

export default async function ProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const me = await getCurrentUser();
  if (!me) return null;

  const data = await getUserBreakdown(params.id);
  if (!data) notFound();

  const { username, entries, totals } = data;
  const isMe = params.id === me.id;

  // On n'affiche le détail d'un pronostic d'un autre joueur que pour les matchs verrouillés.
  const now = Date.now();
  const visible = entries.filter(
    (e) => isMe || e.kickoff.getTime() <= now,
  );
  // Matchs joués (résultat connu) d'abord, puis à venir.
  const finished = visible.filter((e) => e.finished);
  const pending = visible.filter((e) => !e.finished);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-gradient font-display text-xl text-white">
          {(username ?? "?").charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="font-display text-2xl tracking-wide text-white">
            @{username}
          </h1>
          {isMe && <p className="text-xs text-white/70">C&apos;est toi</p>}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <StatBox label="Points" value={totals.total} />
        <StatBox label="Exacts" value={totals.exactScores} />
        <StatBox label="Bons rés." value={totals.correctOutcomes} />
        <StatBox label="Joués" value={totals.played} />
      </div>

      {totals.adjustment !== 0 && (
        <p className="mt-2 text-center text-xs text-white/80">
          {totals.matchPoints} pts sur les matchs ·{" "}
          <span
            className={cn(
              "font-medium",
              totals.adjustment > 0 ? "text-gold-light" : "text-destructive",
            )}
          >
            {totals.adjustment > 0 ? "+" : ""}
            {totals.adjustment}
          </span>{" "}
          d&apos;ajustement admin
        </p>
      )}

      <h2 className="mb-3 mt-7 font-display text-xl tracking-wide text-white">
        Détail des pronostics
      </h2>

      {finished.length === 0 && pending.length === 0 && (
        <p className="py-8 text-center text-sm text-white/70">
          {isMe
            ? "Tu n'as pas encore fait de pronostic."
            : "Aucun pronostic visible (les pronostics restent cachés avant le coup d'envoi)."}
        </p>
      )}

      <div className="space-y-2">
        {[...finished, ...pending].map((e) => (
          <Card
            key={e.matchId}
            className="flex items-center justify-between gap-3 p-3"
          >
            <div className="min-w-0">
              <div className="mb-0.5 flex items-center gap-2">
                <StageBadge stage={e.stage} group={e.group} />
                <span className="text-[11px] text-muted-foreground">
                  {formatKickoff(e.kickoff)}
                </span>
              </div>
              <p className="truncate text-sm">
                {e.flagA} {e.teamA}{" "}
                {e.finished ? (
                  <span className="font-display tabular-nums text-gold-light">
                    {e.scoreA}-{e.scoreB}
                  </span>
                ) : (
                  <span className="text-muted-foreground">vs</span>
                )}{" "}
                {e.teamB} {e.flagB}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="font-display tabular-nums">
                {e.predA}-{e.predB}
              </p>
              {e.finished && (
                <span
                  className={cn(
                    "text-xs font-semibold",
                    e.points >= 3
                      ? "text-lime"
                      : e.points > 0
                        ? "text-teal"
                        : "text-muted-foreground",
                  )}
                >
                  +{e.points}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
