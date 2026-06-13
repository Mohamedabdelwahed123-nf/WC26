"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PredictionFormProps {
  matchId: string;
  teamA: string;
  teamB: string;
  initialPredA: number | null;
  initialPredB: number | null;
}

function clampScore(v: string): string {
  const digits = v.replace(/[^0-9]/g, "").slice(0, 2);
  return digits;
}

export function PredictionForm({
  matchId,
  teamA,
  teamB,
  initialPredA,
  initialPredB,
}: PredictionFormProps) {
  const router = useRouter();
  const [a, setA] = useState(initialPredA?.toString() ?? "");
  const [b, setB] = useState(initialPredB?.toString() ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (a === "" || b === "") {
      setError("Saisis les deux scores");
      setStatus("error");
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const res = await fetch("/api/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchId,
          predA: parseInt(a, 10),
          predB: parseInt(b, 10),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur");
        setStatus("error");
        router.refresh(); // le match s'est peut-être verrouillé
        return;
      }
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 2500);
    } catch {
      setError("Réseau indisponible");
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-center gap-2">
        <input
          inputMode="numeric"
          aria-label={`Score ${teamA}`}
          value={a}
          onChange={(e) => setA(clampScore(e.target.value))}
          placeholder="0"
          className="h-12 w-14 rounded-lg border border-input bg-background/60 text-center text-2xl font-display tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="text-muted-foreground font-display text-xl">–</span>
        <input
          inputMode="numeric"
          aria-label={`Score ${teamB}`}
          value={b}
          onChange={(e) => setB(clampScore(e.target.value))}
          placeholder="0"
          className="h-12 w-14 rounded-lg border border-input bg-background/60 text-center text-2xl font-display tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          variant={status === "saved" ? "secondary" : "gold"}
          size="sm"
          onClick={submit}
          disabled={status === "saving"}
          className="ml-1 h-12"
        >
          {status === "saving" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : status === "saved" ? (
            <>
              <Check className="h-4 w-4" /> OK
            </>
          ) : (
            "Valider"
          )}
        </Button>
      </div>
      {status === "error" && error && (
        <p className="text-center text-xs text-destructive">{error}</p>
      )}
      {status === "saved" && (
        <p className={cn("text-center text-xs font-medium text-lime")}>
          Pronostic enregistré
        </p>
      )}
    </div>
  );
}
