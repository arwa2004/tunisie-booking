import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HotelsFilterForm from "@/components/HotelsFilterForm";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Résultats de la recherche - TunisieBooking",
  description: "Sélectionnez votre hôtel de rêve en Tunisie au meilleur prix.",
};

interface Destination {
  id: number;
  nom: string;
  region: string;
}

interface Hotel {
  id: number;
  nom: string;
  etoiles: number;
  description: string;
  prix_par_nuit: number;
  image: string;
  destination: Destination;
}

interface PageProps {
  searchParams: Promise<{
    destination_id?: string;
    etoiles?: string;
    prix_max?: string;
  }>;
}

async function getHotelsData(params: { destination_id?: string; etoiles?: string; prix_max?: string }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  
  const query = new URLSearchParams();
  if (params.destination_id) query.set("destination_id", params.destination_id);
  if (params.etoiles) query.set("etoiles", params.etoiles);
  if (params.prix_max) query.set("prix_max", params.prix_max);

  let hotels: Hotel[] = [];
  let destinations: Destination[] = [];

  try {
    const hotelsRes = await fetch(`${apiUrl}/hotels?${query.toString()}`, { cache: "no-store" });
    if (hotelsRes.ok) {
      hotels = await hotelsRes.json();
    }
  } catch (error) {
    console.error("Failed to fetch hotels:", error);
  }

  try {
    const destRes = await fetch(`${apiUrl}/destinations`, { cache: "no-store" });
    if (destRes.ok) {
      destinations = await destRes.json();
    }
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
  }

  return { hotels, destinations };
}

export default async function HotelsPage({ searchParams }: PageProps) {
  const resolvedSearchParams = await searchParams;
  const { hotels, destinations } = await getHotelsData(resolvedSearchParams);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto w-full px-6 md:px-12 py-12 flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Filters */}
        <aside className="w-full md:w-[300px] flex-shrink-0">
          <HotelsFilterForm destinations={destinations} />
        </aside>

        {/* Main Hotels Area */}
        <section className="flex-grow">
          <h2 className="text-3xl font-bold text-[#1a1a2e] mb-1">
            Hôtels <span className="text-[#e91e8c]">Disponibles</span>
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {hotels.length} hôtel(s) trouvé(s) selon vos critères.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
            {hotels.length > 0 ? (
              hotels.map((hotel) => (
                <div
                  key={hotel.id}
                  className="group bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col"
                >
                  <div className="relative h-[210px] overflow-hidden">
                    <img
                      src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"}
                      alt={hotel.nom}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6 flex flex-col flex-grow">
                    <div className="text-yellow-400 text-sm mb-2">
                      {Array.from({ length: hotel.etoiles }).map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                    <h3 className="text-lg font-bold text-[#1a1a2e] group-hover:text-[#e91e8c] transition-colors mb-1">
                      {hotel.nom}
                    </h3>
                    <p className="text-gray-400 text-xs font-semibold mb-3">
                      📍 {hotel.destination?.nom}, {hotel.destination?.region}
                    </p>
                    <p className="text-gray-500 text-xs leading-relaxed line-clamp-3 mb-6">
                      {hotel.description}
                    </p>

                    <div className="border-t border-gray-100 pt-5 mt-auto flex items-end justify-between">
                      <div>
                        <div className="text-2xl font-extrabold text-[#e91e8c]">
                          {hotel.prix_par_nuit} DT <span className="text-gray-400 text-xs font-normal">/ nuit</span>
                        </div>
                      </div>

                      <Link
                        href={`/hotels/${hotel.id}`}
                        className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-md hover:shadow-[#e91e8c]/35 text-white px-5 py-2 rounded-xl text-xs font-bold transition-all"
                      >
                        Voir détails
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg text-[#1a1a2e] mb-2">Aucun hôtel trouvé</h3>
                <p className="text-gray-500 text-sm">Essayez de modifier vos filtres de recherche.</p>
              </div>
            )}
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
