"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Reservation {
  id: number;
  statut: "en_attente" | "confirmee" | "annulee";
  date_arrivee: string;
  date_depart: string;
  nb_chambres: number;
  nb_adultes: number;
  nb_enfants: number;
  prix_total: number;
  hotel: {
    id: number;
    nom: string;
    image: string | null;
    destination: { nom: string } | null;
  } | null;
}

const STATUT_STYLES = {
  en_attente: "bg-amber-100 text-amber-800",
  confirmee:  "bg-green-100 text-green-700",
  annulee:    "bg-red-100 text-red-700",
};

const STATUT_LABELS = {
  en_attente: "En attente",
  confirmee:  "Confirmée",
  annulee:    "Annulée",
};

export default function MesReservationsPage() {
  const router = useRouter();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }

    fetch(`${API}/mes-reservations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => setReservations(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  const nbNuits = (arrivee: string, depart: string) => {
    const diff = new Date(depart).getTime() - new Date(arrivee).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400";
    if (image.startsWith("http")) return image;
    return `http://127.0.0.1:8000${image}`;
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">
      Chargement...
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-6">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-[#1a1a2e]">Mes réservations</h1>
          <p className="text-gray-500 mt-1">{reservations.length} réservation(s)</p>
        </div>

        {reservations.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">🏨</p>
            <p className="text-gray-500 mb-6">Vous n'avez aucune réservation pour le moment.</p>
            <Link
              href="/hotels"
              className="bg-[#e91e8c] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#d11a7e] transition-all"
            >
              Découvrir les hôtels
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col sm:flex-row">

                {/* Image hôtel */}
                <img
                  src={getImageUrl(r.hotel?.image ?? null)}
                  alt={r.hotel?.nom}
                  className="w-full sm:w-48 h-40 sm:h-auto object-cover"
                />

                {/* Contenu */}
                <div className="flex-1 p-6 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold text-[#1a1a2e]">{r.hotel?.nom ?? "—"}</h2>
                        <p className="text-sm text-gray-500">{r.hotel?.destination?.nom}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUT_STYLES[r.statut]}`}>
                        {STATUT_LABELS[r.statut]}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Arrivée</p>
                        <p className="font-medium text-[#1a1a2e]">{r.date_arrivee}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Départ</p>
                        <p className="font-medium text-[#1a1a2e]">{r.date_depart}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Durée</p>
                        <p className="font-medium text-[#1a1a2e]">{nbNuits(r.date_arrivee, r.date_depart)} nuit(s)</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Voyageurs</p>
                        <p className="font-medium text-[#1a1a2e]">{r.nb_adultes} adulte(s) · {r.nb_enfants} enfant(s)</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-sm text-gray-500">{r.nb_chambres} chambre(s)</p>
                    <p className="text-xl font-extrabold text-[#e91e8c]">{r.prix_total} DT</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}