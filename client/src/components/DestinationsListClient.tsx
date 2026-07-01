"use client";

import { useState } from "react";
import Link from "next/link";

interface Destination {
  id: number;
  nom: string;
  region: string;
  image: string;
}

interface DestinationsListClientProps {
  initialDestinations: Destination[];
}

export default function DestinationsListClient({ initialDestinations }: DestinationsListClientProps) {
  const [search, setSearch] = useState("");

  const filteredDestinations = initialDestinations.filter(
    (dest) =>
      dest.nom.toLowerCase().includes(search.toLowerCase()) ||
      dest.region.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search Input Box */}
      <div
        className="relative min-h-[45vh] flex flex-col justify-center items-center text-center px-4 py-16 bg-cover bg-center bg-no-repeat rounded-b-[40px] mb-12 shadow-md"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(26,26,46,0.8), rgba(233,30,140,0.5)), url('https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1600')",
        }}
      >
        <h1 className="text-white text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">
          Explorez la <span className="text-[#f48fb1]">Tunisie</span>
        </h1>
        <p className="text-white/95 text-lg max-w-xl mb-8">
          Des plages de sable fin aux oasis du désert, trouvez votre prochaine destination de rêve.
        </p>

        {/* Search input field */}
        <div className="relative w-full max-w-[650px] shadow-2xl rounded-full overflow-hidden">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Où voulez-vous aller ? (ex: Djerba, Sousse...)"
            className="w-full py-4 md:py-5 pl-14 pr-6 border-none bg-white text-gray-700 placeholder-gray-400 font-semibold text-lg outline-none"
          />
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl">
            📍
          </span>
        </div>
      </div>

      <div className="px-6 md:px-12 pb-16 max-w-7xl mx-auto">
        {/* Count and Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
          <div>
            <h2 className="text-3xl font-bold text-[#1a1a2e] mb-1">
              Toutes nos <span className="text-[#e91e8c]">Destinations</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Sélectionnées avec soin pour un séjour inoubliable
            </p>
          </div>
          <div className="self-start sm:self-auto text-sm font-semibold text-gray-600 bg-white px-5 py-2.5 rounded-full shadow-sm border border-gray-100">
            <span className="text-[#e91e8c] text-lg font-bold mr-1">
              {filteredDestinations.length}
            </span>{" "}
            destinations trouvées
          </div>
        </div>

        {/* Destinations Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {filteredDestinations.length > 0 ? (
            filteredDestinations.map((dest) => (
              <Link
                key={dest.id}
                href={`/destinations/${dest.id}`}
                className="group relative h-[400px] rounded-[24px] overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 block"
              >
                <img
                  src={dest.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600"}
                  alt={dest.nom}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-6">
                  <div className="flex justify-between items-end">
                    <div>
                      <span className="inline-block bg-white/20 backdrop-blur-md text-white text-[0.75rem] font-semibold px-3 py-1 rounded-full mb-3 uppercase tracking-wider">
                        {dest.region}
                      </span>
                      <h3 className="text-white font-bold text-2xl drop-shadow-md">
                        {dest.nom}
                      </h3>
                    </div>

                    <div className="bg-white text-[#e91e8c] w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg opacity-0 transform -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 shadow-lg shadow-black/20">
                      ➔
                    </div>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
              <p className="text-lg text-gray-500 font-medium">Aucune destination trouvée.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
