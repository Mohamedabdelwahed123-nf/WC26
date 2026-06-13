import type { ReactNode } from "react";
import { Logo26 } from "@/components/logo";
import { WebGLShader } from "@/components/ui/web-gl-shader";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-4 py-10">
      {/* Fond WebGL animé (faisceaux RVB) */}
      <WebGLShader />

      <div className="relative z-10 w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo26 className="text-5xl" />
          <h1 className="mt-4 font-display text-3xl tracking-wider text-white">
            Mondial <span className="text-gold-metal">26</span>
          </h1>
          <p className="mt-1 text-sm text-white/60">
            Pronostics entre amis · Coupe du Monde 2026
          </p>
        </div>

        {/* Panneau « glass » sombre par-dessus le shader */}
        <div className="rounded-2xl border border-white/15 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
          <h2 className="font-display text-xl tracking-wide text-white">{title}</h2>
          <p className="mb-5 mt-1 text-sm text-white/60">{subtitle}</p>
          {children}
        </div>

        {footer && (
          <div className="mt-5 text-center text-sm text-white/70">{footer}</div>
        )}
      </div>
    </main>
  );
}
