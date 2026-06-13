import { cn } from "@/lib/utils";

/** Logo typographique « 2 » empilé sur « 6 » (motif identité Mondial 26). */
export function Logo26({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "logo-26 flex flex-col items-center justify-center text-2xl select-none",
        className,
      )}
      aria-hidden
    >
      <span className="block">2</span>
      <span className="block">6</span>
    </div>
  );
}

/** Verrou de marque horizontal : logo + nom. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Logo26 className="text-xl leading-[0.78]" />
      <div className="leading-none">
        <span className="block font-display text-lg tracking-wider text-white">
          MONDIAL
        </span>
        <span className="block font-display text-lg tracking-[0.3em] text-gold-metal">
          26
        </span>
      </div>
    </div>
  );
}
