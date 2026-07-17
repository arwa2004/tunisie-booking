import type { Metadata } from "next";
import "./globals.css";
import ConditionalMain from "@/components/ConditionalMain";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "TunisieBooking - Réservation d'hôtels",
  description: "Réservez vos meilleurs hôtels et voyages en Tunisie",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans bg-[#f8f9fa] text-[#1a1a2e]">
        <SessionProviderWrapper>
          <ConditionalMain>{children}</ConditionalMain>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}