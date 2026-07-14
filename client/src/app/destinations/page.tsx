import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import DestinationsListClient from "@/components/DestinationsListClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos Destinations en Tunisie - TunisieBooking",
  description: "Découvrez toutes nos destinations de rêve en Tunisie, de Djerba à Tabarka.",
};

interface Destination {
  id: number;
  nom: string;
  region: string;
  image: string;
}

async function getDestinations() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${apiUrl}/destinations`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
  }
  return [];
}

export default async function DestinationsPage() {
  const destinations = await getDestinations();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <DestinationsListClient initialDestinations={destinations} />
      </main>
      <Footer />
    </div>
  );
}
