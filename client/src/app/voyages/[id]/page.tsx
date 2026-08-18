import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

interface Voyage {
  id: number;
  nom: string;
  pays: string;
  prix: number;
  image: string;
  description: string;
  duree: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getVoyage(id: string): Promise<Voyage | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${apiUrl}/voyages/${id}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch voyage:", error);
  }
  return null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const voyage = await getVoyage(resolvedParams.id);
  return {
    title: voyage ? `${voyage.nom} - TunisieBooking` : "Voyage - TunisieBooking",
    description: voyage
      ? `Partez pour ${voyage.nom} en ${voyage.pays} avec TunisieBooking. ${voyage.duree} jours inoubliables.`
      : "Détails du voyage",
  };
}

export default async function VoyageShowPage({ params }: PageProps) {
  const resolvedParams = await params;
  const voyage = await getVoyage(resolvedParams.id);

  if (!voyage) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Voyage introuvable</h2>
            <p className="text-gray-500 mb-6">Nous n'avons pas pu charger les détails de ce voyage.</p>
            <Link href="/voyages" className="bg-[#e91e8c] text-white px-6 py-2.5 rounded-xl font-bold">
              Retour aux voyages
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <main className="flex-grow">
        
        {/* Hero Section */}
        <section
          className="relative h-[480px] flex flex-col items-center justify-end pb-16 text-center px-4 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(10,10,30,0.65), rgba(233,30,140,0.4)), url('${voyage.image}')`,
          }}
        >
          {/* Country Badge */}
          <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[0.8rem] font-bold px-5 py-2 rounded-full mb-4 uppercase tracking-widest shadow-md">
            ✈️ {voyage.pays}
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-5 drop-shadow-lg max-w-4xl">
            {voyage.nom}
          </h1>

          {/* Quick Info Badges */}
          <div className="flex gap-4 flex-wrap justify-center text-sm">
            <span className="bg-white/15 backdrop-blur-md text-white px-5 py-2.5 rounded-full font-semibold">
              🗓️ {voyage.duree} jours
            </span>
            <span className="bg-[#e91e8c] text-white px-5 py-2.5 rounded-full font-bold shadow-lg shadow-[#e91e8c]/35">
              {voyage.prix} DT / personne
            </span>
          </div>
        </section>

        {/* Content Section */}
        <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          
          {/* Left Column: Details */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">
                À propos de ce voyage
              </h2>
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {voyage.description}
              </p>
            </section>

            <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-6">
                Ce voyage inclut
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-4 p-4 bg-pink-50/50 rounded-2xl border-l-4 border-[#e91e8c]">
                  <span className="text-2xl">✈️</span>
                  <span className="font-bold text-sm text-gray-700">Vol aller-retour</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pink-50/50 rounded-2xl border-l-4 border-[#e91e8c]">
                  <span className="text-2xl">🏨</span>
                  <span className="font-bold text-sm text-gray-700">Hébergement inclus</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pink-50/50 rounded-2xl border-l-4 border-[#e91e8c]">
                  <span className="text-2xl">🚌</span>
                  <span className="font-bold text-sm text-gray-700">Transferts aéroport</span>
                </div>
                <div className="flex items-center gap-4 p-4 bg-pink-50/50 rounded-2xl border-l-4 border-[#e91e8c]">
                  <span className="text-2xl">🗺️</span>
                  <span className="font-bold text-sm text-gray-700">Guide touristique</span>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Booking Card */}
          <aside className="sticky top-[90px]">
            <div className="bg-white rounded-[24px] p-8 shadow-md border border-gray-100 text-center">
              
              <div className="border-b border-gray-100 pb-6 mb-6">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                  Prix par personne
                </div>
                <div className="text-4xl font-extrabold text-[#e91e8c]">
                  {voyage.prix} <span className="text-base font-semibold text-gray-400">DT</span>
                </div>
              </div>

              <div className="space-y-4 mb-8 text-left text-sm">
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-400">Pays</span>
                  <span className="font-bold text-gray-800">{voyage.pays}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-50">
                  <span className="text-gray-400">Durée</span>
                  <span className="font-bold text-gray-800">{voyage.duree} jours</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-400">Destination</span>
                  <span className="font-bold text-gray-800">{voyage.nom}</span>
                </div>
              </div>

              <button className="w-full bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-xl hover:shadow-[#e91e8c]/35 text-white py-4 rounded-xl font-bold tracking-wide transition-all transform hover:-translate-y-[2px]">
                🎒 Réserver ce voyage
              </button>

              <p className="text-gray-400 text-[0.72rem] mt-3">
                🔒 Paiement sécurisé · Annulation flexible
              </p>
            </div>

            <Link
              href="/voyages"
              className="flex items-center justify-center gap-2 mt-6 text-sm font-semibold text-gray-500 hover:text-[#e91e8c] transition-colors"
            >
              ← Voir tous les voyages
            </Link>
          </aside>

        </div>

      </main>
      <Footer />
    </div>
  );
}
