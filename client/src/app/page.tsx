import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBoxAdvanced from "@/components/SearchBoxAdvanced";
import Link from "next/link";

interface Destination {
  id: number;
  nom: string;
  region: string;
  image: string;
}

interface Voyage {
  id: number;
  nom: string;
  pays: string;
  prix: number;
  image: string;
}

async function getHomeData() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
  
  let destinations: Destination[] = [];
  let voyages: Voyage[] = [];

  try {
    const destRes = await fetch(`${apiUrl}/destinations`, { next: { revalidate: 60 } });
    if (destRes.ok) {
      destinations = await destRes.json();
    }
  } catch (error) {
    console.error("Failed to fetch destinations:", error);
  }

  try {
    const voyRes = await fetch(`${apiUrl}/voyages`, { next: { revalidate: 60 } });
    if (voyRes.ok) {
      const allVoyages: Voyage[] = await voyRes.json();
      voyages = allVoyages.slice(0, 4);
    }
  } catch (error) {
    console.error("Failed to fetch voyages:", error);
  }

  return { destinations, voyages };
}

export default async function Home() {
  const { destinations, voyages } = await getHomeData();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* Hero Section */}
        <section
          className="relative min-h-[460px] flex flex-col items-center justify-center text-center px-4 py-16 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage:
              "linear-gradient(135deg, rgba(26,26,46,0.8), rgba(233,30,140,0.45)), url('https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1400&auto=format&fit=crop&q=80')",
          }}
        >
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 drop-shadow-md animate-fade-in">
            Bienvenue sur <span className="text-[#f48fb1]">TunisieBooking</span>
          </h1>
          <p className="text-white/90 text-lg md:text-xl max-w-2xl mb-8 animate-fade-in delay-100">
            Retrouvez nos offres d'hôtels en Tunisie et Voyages à l'étranger
          </p>

          <SearchBoxAdvanced destinations={destinations} />
        </section>

        {/* Section Destinations */}
        <section className="px-6 md:px-12 py-16 max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-[#1a1a2e] mb-2">
            Nos <span className="text-[#e91e8c]">Destinations</span>
          </h2>
          <p className="text-gray-500 mb-10 text-base">
            Découvrez les plus belles régions de Tunisie
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {destinations.length > 0 ? (
              destinations.map((dest) => (
                <Link
                  key={dest.id}
                  href={`/destinations/${dest.id}`}
                  className="group relative h-[280px] rounded-3xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
                >
                  <img
                    src={dest.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400"}
                    alt={dest.nom}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-6">
                    <h3 className="text-white font-bold text-xl">{dest.nom}</h3>
                    <p className="text-white/80 text-xs mt-1">{dest.region}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-gray-500 col-span-full text-center py-10">
                Aucune destination disponible pour le moment.
              </p>
            )}
          </div>
        </section>

        {/* Section Voyages à l'étranger */}
        <section className="bg-[#0f0f1a] rounded-[30px] mx-4 sm:mx-8 px-6 md:px-12 py-16 text-white max-w-7xl md:mx-auto mb-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Voyages <span className="text-[#e91e8c]">dans le Monde</span>
              </h2>
              <p className="text-white/60 text-base">
                Partez à l'aventure au-delà des frontières
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {voyages.length > 0 ? (
              voyages.map((voyage) => (
                <Link
                  key={voyage.id}
                  href={`/voyages/${voyage.id}`}
                  className="group relative h-[400px] rounded-[24px] overflow-hidden shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block"
                >
                  <img
                    src={voyage.image || "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600"}
                    alt={voyage.nom}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-transparent to-transparent flex flex-col justify-end p-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[0.75rem] font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                          ✈️ {voyage.pays}
                        </span>
                        <h3 className="text-white font-bold text-xl drop-shadow-md">
                          {voyage.nom}
                        </h3>
                        <p className="text-[#e91e8c] font-bold text-lg mt-1">
                          {voyage.prix} DT
                        </p>
                      </div>

                      <div className="bg-white text-[#e91e8c] w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg opacity-0 transform -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-lg shadow-black/20">
                        ➔
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-white/60 col-span-full text-center py-10">
                Aucun voyage disponible pour le moment.
              </p>
            )}
          </div>

          <div className="text-center mt-12">
            <Link
              href="/voyages"
              className="inline-block bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-xl hover:shadow-[#e91e8c]/35 text-white px-8 py-3 rounded-xl font-bold tracking-wide transition-all transform hover:-translate-y-[2px]"
            >
              🌍 Voir tous nos voyages
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
