import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Voyages à l'Étranger - TunisieBooking",
  description: "Partez à l'aventure au-delà des frontières avec TunisieBooking.",
};

interface Voyage {
  id: number;
  nom: string;
  pays: string;
  prix: number;
  image: string;
  description: string;
  duree: number;
}

async function getVoyages() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${apiUrl}/voyages`, { next: { revalidate: 60 } });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch voyages:", error);
  }
  return [];
}

export default async function VoyagesPage() {
  const voyages: Voyage[] = await getVoyages();

  // Group voyages by country
  const groupedVoyages = voyages.reduce((acc, voyage) => {
    const country = voyage.pays;
    if (!acc[country]) {
      acc[country] = [];
    }
    acc[country].push(voyage);
    return acc;
  }, {} as Record<string, Voyage[]>);

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f9fa]">
      <Navbar />
      <main className="flex-grow">
        
        {/* Hero */}
        <section
          className="relative min-h-[320px] flex flex-col items-center justify-center text-center px-4 py-16 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(10,10,30,0.8), rgba(233,30,140,0.45)), url('https://images.unsplash.com/photo-1488085061387-422e29b40080?w=1400')",
          }}
        >
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-3 drop-shadow-md">
            Voyages <span className="text-[#f48fb1]">à l'Étranger</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium tracking-wide">
            Partez à l'aventure au-delà des frontières avec TunisieBooking
          </p>
        </section>

        {/* Section Voyages List (Dark premium style) */}
        <section className="bg-[#0f0f1a] rounded-[30px] mx-4 sm:mx-8 my-12 px-6 md:px-12 py-12 text-white max-w-7xl md:mx-auto">
          <h2 className="text-3xl font-bold mb-2">
            Nos <span className="text-[#e91e8c]">Destinations Mondiales</span>
          </h2>
          <p className="text-white/60 text-sm mb-10">
            {voyages.length} destination(s) disponible(s)
          </p>

          {Object.keys(groupedVoyages).length > 0 ? (
            Object.entries(groupedVoyages).map(([country, countryVoyages]) => (
              <div key={country} className="mb-14 last:mb-0">
                
                {/* Country title */}
                <h3 className="text-2xl font-bold text-white border-b border-[#e91e8c]/30 pb-3 mb-8 flex items-center justify-between">
                  <span>🌍 {country}</span>
                  <span className="text-sm font-normal text-white/50">
                    {countryVoyages.length} voyage(s)
                  </span>
                </h3>

                {/* Country Voyages list */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {countryVoyages.map((voyage) => (
                    <div
                      key={voyage.id}
                      className="group bg-[#1a1a2e] border border-white/5 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-full hover:shadow-pink-900/10 transition-all duration-300 transform hover:-translate-y-1"
                    >
                      <div className="relative h-[220px] overflow-hidden">
                        <img
                          src={voyage.image || "https://images.unsplash.com/photo-1488085061387-422e29b40080?w=400"}
                          alt={voyage.nom}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>

                      <div className="p-6 flex flex-col flex-grow">
                        <h4 className="text-xl font-bold text-white mb-2 group-hover:text-[#e91e8c] transition-colors">
                          {voyage.nom}
                        </h4>
                        <p className="text-white/60 text-xs leading-relaxed line-clamp-3 mb-6">
                          {voyage.description}
                        </p>

                        <div className="text-xs text-white/50 flex items-center gap-1.5 mb-6">
                          <span>🗓️</span> {voyage.duree} jours
                        </div>

                        <hr className="border-white/5 mb-6" />

                        <div className="flex items-center justify-between mt-auto">
                          <div className="text-xl font-extrabold text-[#e91e8c]">
                            {voyage.prix} DT <span className="text-white/50 text-xs font-normal">/ pers</span>
                          </div>
                          
                          <Link
                            href={`/voyages/${voyage.id}`}
                            className="bg-[#e91e8c] hover:bg-[#c2185b] text-white px-5 py-2 rounded-full text-xs font-bold transition-colors"
                          >
                            Détails
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))
          ) : (
            <div className="text-center py-16 text-white/50">
              <p className="text-lg">Aucun voyage disponible pour le moment.</p>
            </div>
          )}

        </section>

      </main>
      <Footer />
    </div>
  );
}
