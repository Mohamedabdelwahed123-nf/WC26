import type { Stage } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { StageBadge } from "@/components/stage-badge";
import { Countdown } from "@/components/countdown";
import { PredictionForm } from "@/components/prediction-form";
import { formatKickoff } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Lock, Clock } from "lucide-react";

export interface MatchCardMatch {
  id: string;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  kickoff: Date;
  stage: Stage;
  group: string | null;
  scoreA: number | null;
  scoreB: number | null;
  finished: boolean;
}

export interface RevealPrediction {
  userId: string;
  username: string;
  predA: number;
  predB: number;
  points: number;
}

function pointsColor(points: number): string {
  if (points >= 3) return "text-lime";
  if (points === 2) return "text-teal";
  if (points === 1) return "text-orange";
  return "text-muted-foreground";
}

function TeamSide({
  flag,
  name,
  align,
}: {
  flag: string;
  name: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2",
        align === "right" && "flex-row-reverse text-right",
      )}
    >
      <span className="text-2xl leading-none" aria-hidden>
        {flag}
      </span>
      <span className="truncate font-display text-base tracking-wide">
        {name}
      </span>
    </div>
  );
}

export function MatchCard({
  match,
  myPrediction,
  reveal,
  meId,
}: {
  match: MatchCardMatch;
  myPrediction: { predA: number; predB: number; points: number } | null;
  reveal?: RevealPrediction[];
  meId: string;
}) {
  const locked = match.kickoff.getTime() <= Date.now();

  return (
    <Card className="overflow-hidden animate-fade-in">
      <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
        <StageBadge stage={match.stage} group={match.group} />
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatKickoff(match.kickoff)}
        </span>
      </div>

      <div className="flex items-center gap-2 px-4 py-3">
        <TeamSide flag={match.flagA} name={match.teamA} align="left" />

        <div className="flex flex-col items-center px-1">
          {match.finished ? (
            <div className="font-display text-2xl tabular-nums text-gold-light">
              {match.scoreA}
              <span className="px-1 text-muted-foreground">-</span>
              {match.scoreB}
            </div>
          ) : locked ? (
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
              En cours
            </span>
          ) : (
            <span className="font-display text-lg text-muted-foreground">
              VS
            </span>
          )}
        </div>

        <TeamSide flag={match.flagB} name={match.teamB} align="right" />
      </div>

      <div className="border-t border-border/60 px-4 py-3">
        {!locked ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" />
              Verrouillage dans{" "}
              <Countdown target={match.kickoff} compact className="text-foreground" />
            </div>
            <PredictionForm
              matchId={match.id}
              teamA={match.teamA}
              teamB={match.teamB}
              initialPredA={myPrediction?.predA ?? null}
              initialPredB={myPrediction?.predB ?? null}
            />
          </div>
        ) : (
          <LockedReveal
            myPrediction={myPrediction}
            reveal={reveal}
            finished={match.finished}
            meId={meId}
          />
        )}
      </div>
    </Card>
  );
}

function LockedReveal({
  myPrediction,
  reveal,
  finished,
  meId,
}: {
  myPrediction: { predA: number; predB: number; points: number } | null;
  reveal?: RevealPrediction[];
  finished: boolean;
  meId: string;
}) {
  const sorted = (reveal ?? [])
    .slice()
    .sort((x, y) => y.points - x.points || x.username.localeCompare(y.username));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Ton pronostic</span>
        {myPrediction ? (
          <span className="flex items-center gap-2 font-display tabular-nums">
            {myPrediction.predA}-{myPrediction.predB}
            {finished && (
              <span className={cn("text-xs", pointsColor(myPrediction.points))}>
                +{myPrediction.points}
              </span>
            )}
          </span>
        ) : (
          <span className="text-xs italic text-muted-foreground">
            Aucun pronostic
          </span>
        )}
      </div>

      {sorted.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] uppercase tracking-widest text-muted-foreground">
            Pronostics de tous les joueurs
          </p>
          <ul className="space-y-1">
            {sorted.map((r) => (
              <li
                key={r.userId}
                className={cn(
                  "flex items-center justify-between rounded-md px-2 py-1 text-sm",
                  r.userId === meId ? "bg-secondary" : "",
                )}
              >
                <span className="truncate text-muted-foreground">
                  @{r.username}
                </span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="font-medium">
                    {r.predA}-{r.predB}
                  </span>
                  {finished && (
                    <span className={cn("text-xs", pointsColor(r.points))}>
                      +{r.points}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
