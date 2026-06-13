import type { ReactNode } from "react";
import Link from "next/link";

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-3 mt-7 flex items-end justify-between first:mt-0">
      <h2 className="font-display text-xl tracking-wide text-white">{children}</h2>
      {action && (
        <Link
          href={action.href}
          className="text-xs font-medium text-white/80 hover:text-white hover:underline"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
