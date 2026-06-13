import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { AppNav } from "@/components/app-nav";
import { WebGLShader } from "@/components/ui/web-gl-shader";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="relative min-h-[100dvh]">
      {/* Fond WebGL animé partagé par toute l'app (une seule instance, persiste à la navigation) */}
      <WebGLShader className="fixed inset-0 h-full w-full opacity-70" />

      <div className="relative z-10">
        <AppNav />
        <main className="container max-w-2xl px-4 pb-24 pt-5 md:pb-12">
          {children}
        </main>
      </div>
    </div>
  );
}
