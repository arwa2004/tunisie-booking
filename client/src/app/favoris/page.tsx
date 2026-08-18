"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import HeartButton from "@/components/HeartButton";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Hotel {
  id: number;
  nom: string;
  prix_par_nuit: number;
  etoiles: number;
  image: string | null;
  destination?: { nom: string; region: string };
}

export default function FavorisPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      window.location.href = "/login";
      return;
    }

    fetch(`${API}/favoris`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        setHotels(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const removeFromList = (hotelId: number) => {
    // Remove from local state when user un-favorites from this page
    setHotels((prev) => prev.filter((h) => h.id !== hotelId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="max-w-5xl mx-auto px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <Link href="/profil" className="text-sm text-gray-400 hover:text-[#e91e8c] transition-colors">
            ← Retour au profil
          </Link>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] mt-3">
            Mes <span className="text-[#e91e8c]">Favoris</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {hotels.length > 0
              ? `${hotels.length} hôtel(s) sauvegardé(s)`
              : "Aucun favori pour le moment"}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-[#e91e8c] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : hotels.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-2">Aucun favori</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-xs">
              Cliquez sur le cœur ❤️ d'un hôtel pour l'ajouter à vos favoris.
            </p>
            <Link
              href="/hotels"
              className="bg-[#e91e8c] text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-[#d11a7e] transition-colors"
            >
              Explorer les hôtels
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={hotel.image || "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400"}
                    alt={hotel.nom}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3">
                    <HeartButton
                      hotelId={hotel.id}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="text-yellow-400 text-sm mb-1">
                    {"⭐".repeat(hotel.etoiles)}
                  </div>
                  <h3 className="font-bold text-[#1a1a2e] text-sm mb-1 line-clamp-1 group-hover:text-[#e91e8c] transition-colors">
                    {hotel.nom}
                  </h3>
                  {hotel.destination && (
                    <p className="text-gray-400 text-xs mb-3 flex items-center gap-1">
                      📍 {hotel.destination.nom}, {hotel.destination.region}
                    </p>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <span className="text-[#e91e8c] font-extrabold text-lg">
                        {hotel.prix_par_nuit} DT
                      </span>
                      <span className="text-gray-400 text-xs ml-1">/ nuit</span>
                    </div>
                    <Link
                      href={`/hotels/${hotel.id}`}
                      className="bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
                    >
                      Voir →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
