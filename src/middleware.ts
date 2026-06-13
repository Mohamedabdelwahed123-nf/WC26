import { withAuth } from "next-auth/middleware";

// Redirige les visiteurs non authentifiés vers notre page /login (avec callbackUrl).
export default withAuth({
  pages: { signIn: "/login" },
});

// Protège toute l'application sauf : page de connexion / inscription, routes d'auth,
// et fichiers statiques. La protection ADMIN fine se fait dans les pages/handlers /admin.
export const config = {
  matcher: [
    /*
     * Tout sauf :
     *  - /login, /register
     *  - /api/auth (NextAuth), /api/register
     *  - /api/cron (protégé par CRON_SECRET)
     *  - _next, fichiers statiques, favicon
     */
    "/((?!login|register|api/auth|api/register|api/cron|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
