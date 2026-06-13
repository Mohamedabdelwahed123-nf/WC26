"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const darkInput =
  "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40";
const darkLabel = "text-white/80";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError("Pseudo ou mot de passe incorrect");
      setLoading(false);
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Entre tes identifiants pour rejoindre la partie."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-gold-light hover:underline">
            Crée-en un
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="username" className={darkLabel}>
            Pseudo
          </Label>
          <Input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={darkInput}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className={darkLabel}>
            Mot de passe
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={darkInput}
            required
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <LiquidButton
          type="submit"
          size="xl"
          disabled={loading}
          className="w-full rounded-full border border-white/30 text-white"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Se connecter"}
        </LiquidButton>
      </form>
    </AuthShell>
  );
}
