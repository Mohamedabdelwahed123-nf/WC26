"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Trash2, Loader2, Check, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export interface AdminPlayer {
  id: string;
  username: string;
  role: "ADMIN" | "PLAYER";
  adjustment: number;
  matchPoints: number;
  total: number;
}

export function AdminPlayers({
  players,
  meId,
}: {
  players: AdminPlayer[];
  meId: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/70">
        Total = points gagnés sur les matchs + ajustement manuel.
      </p>
      {players.map((p) => (
        <PlayerRow key={p.id} player={p} isMe={p.id === meId} />
      ))}
    </div>
  );
}

function PlayerRow({ player, isMe }: { player: AdminPlayer; isMe: boolean }) {
  const router = useRouter();
  const [adj, setAdj] = useState(player.adjustment.toString());
  const [busy, setBusy] = useState<null | "adj" | "role">(null);
  const [saved, setSaved] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedAdj = parseInt(adj === "" || adj === "-" ? "0" : adj, 10) || 0;
  const liveTotal = player.matchPoints + parsedAdj;
  const dirty = parsedAdj !== player.adjustment;

  async function patch(body: unknown, kind: "adj" | "role") {
    setBusy(kind);
    setError(null);
    const res = await fetch(`/api/admin/users/${player.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    if (kind === "adj") {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Supprimer le compte @${player.username} et tous ses pronostics ?`))
      return;
    const res = await fetch(`/api/admin/users/${player.id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Erreur");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="p-3">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary font-display text-sm">
          {player.username.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2 truncate text-sm font-medium">
            @{player.username}
            {player.role === "ADMIN" && (
              <Badge className="border-transparent bg-gold text-white">
                <ShieldCheck className="mr-0.5 h-3 w-3" /> admin
              </Badge>
            )}
            {isMe && <span className="text-[11px] text-muted-foreground">(toi)</span>}
          </p>
          <p className="text-[11px] text-muted-foreground">
            {player.matchPoints} pts matchs · {player.total} total
          </p>
        </div>
      </div>

      {/* Ajustement */}
      <div className="mt-3 flex items-end gap-2">
        <div className="space-y-1">
          <Label className="text-[11px]">Ajustement (+/-)</Label>
          <Input
            value={adj}
            inputMode="numeric"
            onChange={(e) => setAdj(e.target.value.replace(/[^0-9-]/g, ""))}
            className="h-9 w-24 text-center tabular-nums"
          />
        </div>
        <div className="pb-1.5 text-sm text-muted-foreground">
          = <span className="font-display text-base text-gold-light">{liveTotal}</span> total
        </div>
        <Button
          size="sm"
          variant={saved ? "secondary" : "gold"}
          className="ml-auto h-9"
          disabled={busy === "adj" || (!dirty && !saved)}
          onClick={() => patch({ pointsAdjustment: parsedAdj }, "adj")}
        >
          {busy === "adj" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : saved ? (
            <>
              <Check className="h-4 w-4" /> OK
            </>
          ) : (
            "Enregistrer"
          )}
        </Button>
      </div>

      {/* Actions compte */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <select
          value={player.role}
          disabled={isMe || busy === "role"}
          onChange={(e) => patch({ role: e.target.value }, "role")}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
          aria-label="Rôle"
        >
          <option value="PLAYER">Joueur</option>
          <option value="ADMIN">Admin</option>
        </select>

        <Button
          size="sm"
          variant="outline"
          className="h-8"
          onClick={() => setPwdOpen(true)}
        >
          <KeyRound className="h-3.5 w-3.5" /> Mot de passe
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="ml-auto h-8 text-destructive"
          disabled={isMe}
          onClick={remove}
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </Button>
      </div>

      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}

      {pwdOpen && (
        <ResetPasswordDialog
          username={player.username}
          onClose={() => setPwdOpen(false)}
          onSubmit={async (password) => {
            const res = await fetch(`/api/admin/users/${player.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ password }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) return data.error ?? "Erreur";
            setPwdOpen(false);
            return null;
          }}
        />
      )}
    </Card>
  );
}

function ResetPasswordDialog({
  username,
  onClose,
  onSubmit,
}: {
  username: string;
  onClose: () => void;
  onSubmit: (password: string) => Promise<string | null>;
}) {
  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle>Nouveau mot de passe</DialogTitle>
          <DialogDescription>
            Définir un nouveau mot de passe pour @{username}.
          </DialogDescription>
        </DialogHeader>
        <Input
          type="text"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          placeholder="6 caractères minimum"
          autoFocus
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button
            variant="gold"
            disabled={busy || pwd.length < 6}
            onClick={async () => {
              setBusy(true);
              setError(null);
              const err = await onSubmit(pwd);
              setBusy(false);
              if (err) setError(err);
            }}
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Définir"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
