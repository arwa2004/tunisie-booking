import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Link from "next/link";
import type { Metadata } from "next";
import DestinationHotelsSection from "@/components/DestinationHotelsSection";
import SearchBoxCompact from "@/components/SearchBoxCompact";

interface Hotel {
  id: number;
  destination_id: number;
  nom: string;
  etoiles: number;
  description: string;
  prix_par_nuit: number;
  image: string;
  disponible: number;
  chambres: any[];
}

interface Destination {
  id: number;
  nom: string;
  region: string;
  image: string;
  hotels: Hotel[];
}

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    arrivee?: string;
    depart?: string;
    adultes?: string;
    enfants?: string;
    chambres?: string;
  }>;
}

async function getDestination(id: string): Promise<Destination | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${apiUrl}/destinations/${id}`, { cache: "no-store" });
    if (res.ok) {
      return await res.json();
    }
  } catch (error) {
    console.error("Failed to fetch destination details:", error);
  }
  return null;
}

async function getAllDestinations(): Promise<{ id: number; nom: string; region: string }[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  try {
    const res = await fetch(`${apiUrl}/destinations`, { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch {}
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const destination = await getDestination(resolvedParams.id);
  return {
    title: destination ? `${destination.nom} - TunisieBooking` : "Destination - TunisieBooking",
    description: destination
      ? `Découvrez nos meilleurs hôtels et offres de séjours à ${destination.nom}, région de ${destination.region}.`
      : "Détails de la destination",
  };
}

export default async function DestinationShowPage({ params, searchParams }: PageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  const [destination, allDestinations] = await Promise.all([
    getDestination(resolvedParams.id),
    getAllDestinations(),
  ]);

  if (!destination) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#1a1a2e] mb-2">Destination introuvable</h2>
            <p className="text-gray-500 mb-6">Nous n'avons pas pu charger les détails de cette destination.</p>
            <Link href="/destinations" className="bg-[#e91e8c] text-white px-6 py-2.5 rounded-xl font-bold">
              Retour aux destinations
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Extract parameters
  const arrivee = resolvedSearchParams.arrivee || "";
  const depart = resolvedSearchParams.depart || "";
  const adultes = parseInt(resolvedSearchParams.adultes || "2", 10);
  const enfants = parseInt(resolvedSearchParams.enfants || "0", 10);
  const chambres = parseInt(resolvedSearchParams.chambres || "1", 10);

  // Calculate nights
  let nbNuits = 1;
  if (arrivee && depart) {
    const d1 = new Date(arrivee);
    const d2 = new Date(depart);
    const timeDiff = d2.getTime() - d1.getTime();
    if (timeDiff > 0) {
      nbNuits = Math.max(1, Math.ceil(timeDiff / (1000 * 3600 * 24)));
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        {/* Banner */}
        <section
          className="relative min-h-[320px] flex flex-col items-center justify-center text-center px-4 py-12 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `linear-gradient(135deg, rgba(26,26,46,0.7), rgba(233,30,140,0.45)), url('${destination.image}')`,
          }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-2 drop-shadow-lg">
            {destination.nom}
          </h1>
          <p className="text-white/90 text-lg md:text-xl font-medium tracking-wide">
            📍 Région de {destination.region}
          </p>
        </section>

        {/* Barre de recherche compacte */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 md:px-12 py-4">
          <div className="max-w-7xl mx-auto">
            <SearchBoxCompact
              destinations={allDestinations}
              currentDestinationId={destination.id}
              initialArrivee={arrivee}
              initialDepart={depart}
              initialAdultes={adultes}
              initialEnfants={enfants}
              initialChambres={chambres}
            />
          </div>
        </div>

        <div className="px-6 md:px-12 py-12 max-w-7xl mx-auto space-y-16">
          {/* Section Hotels */}
          <section>
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-1">
              Hôtels disponibles à <span className="text-[#e91e8c]">{destination.nom}</span>
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Retrouvez nos meilleures offres d'hébergement
            </p>

            <DestinationHotelsSection
              hotels={destination.hotels}
              nbNuits={nbNuits}
              chambresDemandees={chambres}
              destinationNom={destination.nom}
              arrivee={arrivee}
              depart={depart}
              adultes={adultes}
              enfants={enfants}
            />
          </section>

          {/* Section Voyages & Circuits */}
          <section className="bg-pink-50/50 border border-pink-100 rounded-3xl p-8 md:p-12">
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-1">
              Voyages & Circuits à <span className="text-[#e91e8c]">{destination.nom}</span>
            </h2>
            <p className="text-gray-400 text-sm mb-8">
              Excursions et aventures recommandées
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8">
              {/* Excursion 1 */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row gap-6">
                <img
                  src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=400"
                  alt="Aventure & Découverte"
                  className="w-full md:w-36 h-36 object-cover rounded-2xl"
                />
                <div className="flex flex-col flex-grow">
                  <span className="self-start bg-[#e91e8c]/10 text-[#e91e8c] font-semibold text-[0.7rem] px-3 py-1 rounded-full mb-2">
                    ✨ Populaire
                  </span>
                  <h4 className="font-bold text-lg text-[#1a1a2e] mb-1">Aventure & Découverte Locale</h4>
                  <p className="text-gray-500 text-xs mb-4">
                    Une journée guidée pour explorer les trésors cachés de {destination.nom}.
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-lg font-extrabold text-[#1a1a2e]">
                      95 DT <span className="text-gray-400 text-xs font-normal">/ personne</span>
                    </div>
                    <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">
                      Réserver
                    </button>
                  </div>
                </div>
              </div>

              {/* Excursion 2 */}
              <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow p-6 flex flex-col md:flex-row gap-6">
                <img
                  src="https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=400"
                  alt="Croisière Snorkeling"
                  className="w-full md:w-36 h-36 object-cover rounded-2xl"
                />
                <div className="flex flex-col flex-grow">
                  <span className="self-start bg-blue-50 text-blue-700 font-semibold text-[0.7rem] px-3 py-1 rounded-full mb-2">
                    ☀️ Sortie d'été
                  </span>
                  <h4 className="font-bold text-lg text-[#1a1a2e] mb-1">Croisière Privée & Snorkeling</h4>
                  <p className="text-gray-500 text-xs mb-4">
                    Profitez du soleil et de la mer azur avec repas de poissons frais inclus.
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="text-lg font-extrabold text-[#1a1a2e]">
                      140 DT <span className="text-gray-400 text-xs font-normal">/ personne</span>
                    </div>
                    <button className="bg-gray-100 text-gray-400 px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">
                      Réserver
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
