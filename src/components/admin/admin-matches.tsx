"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Stage } from "@prisma/client";
import {
  Pencil,
  Trophy,
  Trash2,
  RefreshCw,
  Plus,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { StageBadge } from "@/components/stage-badge";
import { formatKickoff, STAGE_LABEL, STAGE_ORDER } from "@/lib/format";

export interface AdminMatch {
  id: string;
  sourceIndex: number;
  teamA: string;
  teamB: string;
  flagA: string;
  flagB: string;
  kickoffISO: string;
  stage: Stage;
  group: string | null;
  scoreA: number | null;
  scoreB: number | null;
  finished: boolean;
  manualOverride: boolean;
}

const STAGES = STAGE_ORDER;

function isoToLocalInput(iso: string): string {
  // On édite en UTC (champ étiqueté « UTC ») : on tronque l'ISO.
  return iso.slice(0, 16);
}

export function AdminMatches({ matches }: { matches: AdminMatch[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [editing, setEditing] = useState<AdminMatch | null>(null);
  const [scoring, setScoring] = useState<AdminMatch | null>(null);
  const [creating, setCreating] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return matches.filter((m) => {
      if (stageFilter !== "ALL" && m.stage !== stageFilter) return false;
      if (!q) return true;
      return (
        m.teamA.toLowerCase().includes(q) || m.teamB.toLowerCase().includes(q)
      );
    });
  }, [matches, search, stageFilter]);

  async function runSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const res = await fetch("/api/cron/fetch-results");
      const data = await res.json();
      if (data.skipped) {
        setSyncMsg(`Ignoré : ${data.skipped}`);
      } else if (data.summary) {
        const s = data.summary;
        setSyncMsg(
          `Mis à jour : ${s.updated} · inchangés : ${s.unchanged} · sans score : ${s.skippedNoScore} · override manuel : ${s.skippedManual}` +
            (s.errors?.length ? ` · ${s.errors.length} erreur(s)` : ""),
        );
      } else {
        setSyncMsg(data.error ? `Erreur : ${data.error}` : "Terminé");
      }
      router.refresh();
    } catch {
      setSyncMsg("Échec de la synchronisation");
    } finally {
      setSyncing(false);
    }
  }

  async function remove(m: AdminMatch) {
    if (!confirm(`Supprimer ${m.teamA} vs ${m.teamB} ?`)) return;
    await fetch(`/api/admin/matches/${m.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Input
          placeholder="Rechercher une équipe…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 max-w-[200px]"
        />
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="ALL">Toutes phases</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>
              {STAGE_LABEL[s]}
            </option>
          ))}
        </select>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm" onClick={runSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Synchroniser
          </Button>
          <Button variant="gold" size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" />
            Nouveau
          </Button>
        </div>
      </div>

      {syncMsg && (
        <p className="mb-4 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-xs text-white">
          {syncMsg}
        </p>
      )}

      <p className="mb-2 text-xs text-white/70">{filtered.length} match(s)</p>

      <div className="space-y-2">
        {filtered.map((m) => (
          <Card key={m.id} className="flex items-center gap-2 p-3">
            <StageBadge stage={m.stage} group={m.group} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm">
                {m.flagA} {m.teamA}{" "}
                {m.finished ? (
                  <span className="font-display tabular-nums text-gold-light">
                    {m.scoreA}-{m.scoreB}
                  </span>
                ) : (
                  <span className="text-muted-foreground">vs</span>
                )}{" "}
                {m.teamB} {m.flagB}
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                {formatKickoff(m.kickoffISO)}
                {m.manualOverride && (
                  <span className="flex items-center gap-0.5 text-orange">
                    <Lock className="h-3 w-3" /> manuel
                  </span>
                )}
              </p>
            </div>
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setScoring(m)}
                aria-label="Saisir le score"
              >
                <Trophy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditing(m)}
                aria-label="Éditer"
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive"
                onClick={() => remove(m)}
                aria-label="Supprimer"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {editing && (
        <MatchDialog
          mode="edit"
          match={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            router.refresh();
          }}
        />
      )}
      {creating && (
        <MatchDialog
          mode="create"
          onClose={() => setCreating(false)}
          onDone={() => {
            setCreating(false);
            router.refresh();
          }}
        />
      )}
      {scoring && (
        <ScoreDialog
          match={scoring}
          onClose={() => setScoring(null)}
          onDone={() => {
            setScoring(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

/* ---------- Dialog : édition / création d'un match ---------- */

function MatchDialog({
  mode,
  match,
  onClose,
  onDone,
}: {
  mode: "edit" | "create";
  match?: AdminMatch;
  onClose: () => void;
  onDone: () => void;
}) {
  const [teamA, setTeamA] = useState(match?.teamA ?? "");
  const [teamB, setTeamB] = useState(match?.teamB ?? "");
  const [flagA, setFlagA] = useState(match?.flagA ?? "");
  const [flagB, setFlagB] = useState(match?.flagB ?? "");
  const [kickoff, setKickoff] = useState(
    match ? isoToLocalInput(match.kickoffISO) : "",
  );
  const [stage, setStage] = useState<Stage>(match?.stage ?? "GROUP");
  const [group, setGroup] = useState(match?.group ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    if (!teamA || !teamB || !kickoff) {
      setError("Équipes et coup d'envoi requis");
      setSaving(false);
      return;
    }
    const kickoffISO = new Date(`${kickoff}:00.000Z`).toISOString();
    const payload = {
      teamA,
      teamB,
      flagA: flagA || undefined,
      flagB: flagB || undefined,
      kickoff: kickoffISO,
      stage,
      group: group.trim() === "" ? null : group.trim(),
    };
    const res =
      mode === "edit" && match
        ? await fetch(`/api/admin/matches/${match.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch(`/api/admin/matches`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    onDone();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {mode === "edit" ? "Éditer le match" : "Nouveau match"}
          </DialogTitle>
          <DialogDescription>
            Utile pour renommer un placeholder de phase finale (ex : « W101 »).
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Équipe A</Label>
            <Input value={teamA} onChange={(e) => setTeamA(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Équipe B</Label>
            <Input value={teamB} onChange={(e) => setTeamB(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Drapeau A (emoji)</Label>
            <Input
              value={flagA}
              onChange={(e) => setFlagA(e.target.value)}
              placeholder="🇫🇷"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Drapeau B (emoji)</Label>
            <Input
              value={flagB}
              onChange={(e) => setFlagB(e.target.value)}
              placeholder="🇧🇷"
            />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label>Coup d&apos;envoi (UTC)</Label>
            <Input
              type="datetime-local"
              value={kickoff}
              onChange={(e) => setKickoff(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Phase</Label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value as Stage)}
              className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
            >
              {STAGES.map((s) => (
                <option key={s} value={s}>
                  {STAGE_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Groupe (option.)</Label>
            <Input
              value={group}
              onChange={(e) => setGroup(e.target.value)}
              placeholder="Group A"
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="gold" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enregistrer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Dialog : saisie / effacement du score ---------- */

function ScoreDialog({
  match,
  onClose,
  onDone,
}: {
  match: AdminMatch;
  onClose: () => void;
  onDone: () => void;
}) {
  const [a, setA] = useState(match.scoreA?.toString() ?? "");
  const [b, setB] = useState(match.scoreB?.toString() ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: unknown) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/matches/${match.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    onDone();
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Score final</DialogTitle>
          <DialogDescription>
            {match.teamA} vs {match.teamB} — la saisie manuelle verrouille le match
            contre le cron.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-center gap-3 py-2">
          <input
            inputMode="numeric"
            value={a}
            onChange={(e) => setA(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
            className="h-14 w-16 rounded-lg border border-input bg-background text-center text-3xl font-display tabular-nums"
          />
          <span className="font-display text-2xl text-muted-foreground">–</span>
          <input
            inputMode="numeric"
            value={b}
            onChange={(e) => setB(e.target.value.replace(/[^0-9]/g, "").slice(0, 2))}
            className="h-14 w-16 rounded-lg border border-input bg-background text-center text-3xl font-display tabular-nums"
          />
        </div>

        {error && <p className="text-center text-sm text-destructive">{error}</p>}

        <div className="flex flex-col gap-2">
          <Button
            variant="gold"
            disabled={busy || a === "" || b === ""}
            onClick={() =>
              patch({ score: { a: parseInt(a, 10), b: parseInt(b, 10) } })
            }
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Valider le score"}
          </Button>
          {match.finished && (
            <Button
              variant="ghost"
              className="text-destructive"
              disabled={busy}
              onClick={() => patch({ score: null })}
            >
              Effacer le résultat
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
