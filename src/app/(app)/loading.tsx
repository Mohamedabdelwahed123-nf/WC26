import { Logo26 } from "@/components/logo";

// Affiché instantanément pendant le chargement des données d'une page (App Router).
// => le clic sur un lien répond tout de suite, sans impression de blocage.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
      <Logo26 className="animate-pulse text-5xl" />
      <span className="text-sm text-muted-foreground">Chargement…</span>
      <div className="mt-4 w-full max-w-md space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl border border-border/60 bg-card/60"
          />
        ))}
      </div>
    </div>
  );
}
