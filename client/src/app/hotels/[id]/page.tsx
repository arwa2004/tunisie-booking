"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = "http://127.0.0.1:8000";

interface Hotel {
  id: number;
  nom: string;
  prix_par_nuit: number;
  etoiles: number;
  description: string | null;
  image: string | null;
  disponible: boolean;
  destination: { id: number; nom: string } | null;
}

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [hotel, setHotel]             = useState<Hotel | null>(null);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [success, setSuccess]         = useState(false);
  const [error, setError]             = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const [form, setForm] = useState({
    date_arrivee: "",
    date_depart:  "",
    nb_chambres:  1,
    nb_adultes:   1,
    nb_enfants:   0,
  });

  useEffect(() => {
    fetch(`${API}/hotels/${id}`)
      .then((r) => r.json())
      .then((data) => { setHotel(data); setLoading(false); });
  }, [id]);

  const nbNuits = () => {
    if (!form.date_arrivee || !form.date_depart) return 0;
    const diff = new Date(form.date_depart).getTime() - new Date(form.date_arrivee).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const prixEstime = () => hotel ? nbNuits() * hotel.prix_par_nuit * form.nb_chambres : 0;

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";
    if (image.startsWith("http")) return image;
    return `${BASE_URL}${image}`;
  };

  const handleReserverClick = () => {
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setShowForm(true);
    setTimeout(() => {
      document.getElementById("reservation-form")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (nbNuits() <= 0) {
      setError("La date de départ doit être après la date d'arrivée.");
      return;
    }

    const token = localStorage.getItem("token");
    setSubmitting(true);

    try {
      const res = await fetch(`${API}/reservations`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ hotel_id: id, ...form }),
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message || "Erreur lors de la réservation."); return; }
      setSuccess(true);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>
  );
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Hôtel introuvable.</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HERO ── */}
      <div className="relative w-full h-[500px]">
        <img
          src={getImageUrl(hotel.image)}
          alt={hotel.nom}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"/>

        <Link href="/hotels" className="absolute top-6 left-6 flex items-center gap-2 text-white/90 hover:text-white text-sm font-medium bg-black/30 px-4 py-2 rounded-full backdrop-blur-sm transition">
          ← Retour
        </Link>

        {/* Infos dans le hero */}
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-5xl mx-auto">
            <p className="text-white/70 text-sm mb-2">
              📍 {hotel.destination?.nom} &nbsp;·&nbsp; {"⭐".repeat(hotel.etoiles)}
            </p>
            <h1 className="text-4xl font-extrabold text-white mb-4">{hotel.nom}</h1>
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                hotel.disponible ? "bg-green-400/90 text-white" : "bg-red-400/90 text-white"
              }`}>
                {hotel.disponible ? "Disponible" : "Indisponible"}
              </span>
              <span className="text-white/80 text-sm">
                À partir de <span className="text-[#e91e8c] font-extrabold text-xl">{hotel.prix_par_nuit} DT</span> / nuit
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-5xl mx-auto px-6 py-10 space-y-8">

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">À propos de l'hôtel</h2>
          <p className="text-gray-600 leading-relaxed text-base">
            {hotel.description ?? "Aucune description disponible."}
          </p>
        </div>

        {/* Infos clés */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-3xl font-extrabold text-[#e91e8c]">{hotel.prix_par_nuit} DT</p>
            <p className="text-sm text-gray-500 mt-1">par nuit</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-3xl">{"⭐".repeat(hotel.etoiles)}</p>
            <p className="text-sm text-gray-500 mt-1">{hotel.etoiles} étoiles</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-2xl font-bold text-[#1a1a2e]">{hotel.destination?.nom}</p>
            <p className="text-sm text-gray-500 mt-1">destination</p>
          </div>
        </div>

        {/* Bouton réserver */}
        {!showForm && !success && (
          <div className="text-center">
            <button
              onClick={handleReserverClick}
              disabled={!hotel.disponible}
              className="bg-[#e91e8c] hover:bg-[#d11a7e] disabled:opacity-50 text-white font-bold text-lg px-12 py-4 rounded-2xl shadow-lg shadow-[#e91e8c]/30 transition-all hover:scale-105"
            >
              {hotel.disponible ? "🗓️ Réserver maintenant" : "Hôtel indisponible"}
            </button>
            {!hotel.disponible && (
              <p className="text-gray-400 text-sm mt-2">Cet hôtel n'est pas disponible pour le moment.</p>
            )}
          </div>
        )}

        {/* ── FORMULAIRE (apparaît au clic) ── */}
        {showForm && !success && (
          <div id="reservation-form" className="bg-white rounded-2xl shadow-sm p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1a1a2e]">🗓️ Votre réservation</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕ Annuler
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date d'arrivée</label>
                  <input
                    type="date" min={today} value={form.date_arrivee} required
                    onChange={(e) => setForm({ ...form, date_arrivee: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Date de départ</label>
                  <input
                    type="date" min={form.date_arrivee || today} value={form.date_depart} required
                    onChange={(e) => setForm({ ...form, date_depart: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                  />
                </div>
              </div>

              {/* Chambres / Adultes / Enfants */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Chambres</label>
                  <input
                    type="number" min="1" value={form.nb_chambres}
                    onChange={(e) => setForm({ ...form, nb_chambres: +e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Adultes</label>
                  <input
                    type="number" min="1" value={form.nb_adultes}
                    onChange={(e) => setForm({ ...form, nb_adultes: +e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Enfants</label>
                  <input
                    type="number" min="0" value={form.nb_enfants}
                    onChange={(e) => setForm({ ...form, nb_enfants: +e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                  />
                </div>
              </div>

              {/* Résumé prix */}
              {nbNuits() > 0 && (
                <div className="bg-gray-50 rounded-xl p-5">
                  <div className="flex justify-between text-sm text-gray-500 mb-2">
                    <span>{hotel.prix_par_nuit} DT × {nbNuits()} nuit(s) × {form.nb_chambres} chambre(s)</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-gray-200 pt-3">
                    <span className="font-bold text-[#1a1a2e]">Total estimé</span>
                    <span className="text-2xl font-extrabold text-[#e91e8c]">{prixEstime()} DT</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-bold py-4 rounded-2xl shadow-lg transition-all disabled:opacity-50"
              >
                {submitting ? "Envoi en cours..." : "Confirmer la réservation"}
              </button>
            </form>
          </div>
        )}

        {/* ── SUCCÈS ── */}
        {success && (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-[#1a1a2e]">Réservation envoyée !</h3>
            <p className="text-gray-500">Votre réservation est en attente de confirmation par notre équipe.</p>
            <div className="flex gap-3 justify-center pt-2">
              <Link
                href="/reservations"
                className="bg-[#e91e8c] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#d11a7e] transition-all"
              >
                Voir mes réservations
              </Link>
              <Link
                href="/hotels"
                className="bg-gray-100 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-200 transition-all"
              >
                Continuer à explorer
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}