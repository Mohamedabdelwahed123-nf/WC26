"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  CalendarDays,
  Trophy,
  User,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { Wordmark } from "@/components/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

export function AppNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role;
  const myId = session?.user?.id;

  const items: NavItem[] = [
    { href: "/", label: "Accueil", icon: LayoutDashboard },
    { href: "/matches", label: "Matchs", icon: CalendarDays },
    { href: "/leaderboard", label: "Classement", icon: Trophy },
    { href: myId ? `/profile/${myId}` : "/", label: "Profil", icon: User },
    { href: "/admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
  ];

  const visible = items.filter((i) => !i.adminOnly || role === "ADMIN");

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("/")[1] ? `/${href.split("/")[1]}` : href);

  return (
    <>
      {/* Barre supérieure (bandeau navy comme l'en-tête de la photo) */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-royal-dark/70 text-white backdrop-blur-xl">
        <div className="container flex h-14 items-center justify-between">
          <Link href="/" aria-label="Accueil">
            <Wordmark />
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {visible.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-white/15 text-white"
                    : "text-white/65 hover:text-white hover:bg-white/10",
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {session?.user?.name && (
              <span className="hidden sm:inline text-sm text-white/60">
                @{session.user.name}
              </span>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-white/70 hover:text-orange transition-colors"
              aria-label="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Quitter</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barre inférieure (mobile) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-white/10 bg-royal-dark/80 text-white backdrop-blur-xl">
        <div className="grid grid-flow-col auto-cols-fr">
          {visible.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
                isActive(item.href) ? "text-orange" : "text-white/65",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
