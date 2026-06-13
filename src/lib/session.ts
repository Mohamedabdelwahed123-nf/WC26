import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export interface SessionUser {
  id: string;
  name?: string | null;
  role: "ADMIN" | "PLAYER";
}

/** Utilisateur courant (ou null) côté Server Component / Route Handler. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    role: session.user.role,
  };
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === "ADMIN";
}
