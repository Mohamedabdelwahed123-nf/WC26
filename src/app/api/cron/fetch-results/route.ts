import { NextResponse } from "next/server";
import { syncResultsFromFeed } from "@/lib/results";
import { getCurrentUser } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Fenêtre du tournoi (UTC). En dehors, le cron ne fait rien (économie + sécurité).
const WINDOW_START = Date.UTC(2026, 5, 11, 0, 0, 0); // 11 juin 2026
const WINDOW_END = Date.UTC(2026, 6, 19, 23, 59, 59); // 19 juillet 2026

/**
 * Endpoint appelé par le Cron Vercel (toutes les 30 min pendant le tournoi).
 * Sécurisé par CRON_SECRET (Vercel envoie « Authorization: Bearer <CRON_SECRET> »).
 * Un admin connecté peut aussi le déclencher manuellement.
 *
 * Ne « crash » jamais : toute erreur (source injoignable, JSON invalide, etc.)
 * est capturée et renvoyée dans la réponse.
 */
export async function GET(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const authorizedByCron =
    !!cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!authorizedByCron) {
    // Repli : autoriser un admin connecté (déclenchement manuel depuis le panel).
    const user = await getCurrentUser();
    if (user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  const now = Date.now();
  if (now < WINDOW_START || now > WINDOW_END) {
    return NextResponse.json({
      ok: true,
      skipped: "hors période du tournoi (11 juin – 19 juillet 2026)",
    });
  }

  try {
    const summary = await syncResultsFromFeed();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    // On renvoie 200 pour ne pas accumuler d'échecs côté Vercel ; l'erreur est tracée.
    const message = err instanceof Error ? err.message : String(err);
    console.error("[cron/fetch-results] échec :", message);
    return NextResponse.json({ ok: false, error: message });
  }
}
