"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

function diffParts(target: number, now: number) {
  const total = Math.max(0, target - now);
  const s = Math.floor(total / 1000);
  return {
    total,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}

/** Compte à rebours live jusqu'à `target` (ISO string ou Date). */
export function Countdown({
  target,
  className,
  compact = false,
}: {
  target: string | Date;
  className?: string;
  compact?: boolean;
}) {
  const targetMs = new Date(target).getTime();
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // Évite le mismatch d'hydratation : rien tant que le client n'a pas démarré.
  if (now === null) {
    return <span className={cn("tabular-nums", className)}>—</span>;
  }

  const p = diffParts(targetMs, now);
  if (p.total === 0) {
    return (
      <span className={cn("text-muted-foreground", className)}>
        Coup d&apos;envoi
      </span>
    );
  }

  if (compact) {
    const label =
      p.days > 0
        ? `${p.days}j ${p.hours}h`
        : p.hours > 0
          ? `${p.hours}h ${p.minutes}min`
          : `${p.minutes}min ${p.seconds}s`;
    return <span className={cn("tabular-nums", className)}>{label}</span>;
  }

  return (
    <span className={cn("tabular-nums font-display tracking-wider", className)}>
      {p.days > 0 && `${p.days}j `}
      {String(p.hours).padStart(2, "0")}:{String(p.minutes).padStart(2, "0")}:
      {String(p.seconds).padStart(2, "0")}
    </span>
  );
}
