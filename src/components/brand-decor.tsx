import { cn } from "@/lib/utils";

/** Barres diagonales tri-couleur (motif identité WC26). */
export function BrandBars({ className }: { className?: string }) {
  return (
    <div
      className={cn("flex flex-col gap-1.5", className)}
      aria-hidden
    >
      <span className="block h-2.5 w-28 -skew-x-[24deg] bg-orange" />
      <span className="block h-2.5 w-20 -skew-x-[24deg] bg-lime" />
      <span className="block h-2.5 w-12 -skew-x-[24deg] bg-violet" />
    </div>
  );
}

/** Chiffres « 2026 » détourés empilés verticalement (décor).
 *  tone="light" (contour blanc, sur fond bleu) ou "dark" (contour navy, sur carte blanche). */
export function NumeralStrip({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div
      className={cn(
        "num-outline flex flex-col items-center leading-[0.78]",
        tone === "dark" && "num-outline-dark",
        className,
      )}
      aria-hidden
    >
      <span>2</span>
      <span>0</span>
      <span>2</span>
      <span>6</span>
    </div>
  );
}
