"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth-shell";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const darkInput =
  "bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/40";
const darkLabel = "text-white/80";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, inviteCode }),
    });
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(data.error ?? "Inscription impossible");
      setLoading(false);
      return;
    }

    // Connexion automatique après inscription.
    const login = await signIn("credentials", {
      redirect: false,
      username,
      password,
    });
    if (login?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthShell
      title="Créer un compte"
      subtitle="Un code d'invitation est requis (demande-le à l'organisateur)."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-gold-light hover:underline">
            Connecte-toi
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
            placeholder="3 à 20 caractères"
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6 caractères minimum"
            className={darkInput}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="invite" className={darkLabel}>
            Code d&apos;invitation
          </Label>
          <Input
            id="invite"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rejoindre"}
        </LiquidButton>
      </form>
    </AuthShell>
  );
}
