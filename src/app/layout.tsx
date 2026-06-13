import type { Metadata, Viewport } from "next";
import { Anton, Noto_Sans } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const notoSans = Noto_Sans({
  subsets: ["latin"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mondial 26 · Pronostics",
  description:
    "Jeu privé de pronostics — Coupe du Monde 2026. Entre amis, prédis les scores et grimpe au classement.",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${anton.variable} ${notoSans.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
