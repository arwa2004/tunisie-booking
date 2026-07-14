import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import ConditionalMain from "@/components/ConditionalMain";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";


const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "TunisieBooking - Réservation d'hôtels",
  description: "Réservez vos meilleurs hôtels et voyages en Tunisie",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-[#f8f9fa] text-[#1a1a2e]">
        <SessionProviderWrapper>
          <ConditionalMain>{children}</ConditionalMain>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}