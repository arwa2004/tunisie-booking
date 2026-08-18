"use client";

import { useEffect, useState } from "react";
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

export default function HotelsPage() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchHotels = () => {
    setLoading(true);
    fetch(`${API}/hotels`)
      .then((r) => r.json())
      .then((data) => setHotels(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer l'hôtel "${nom}" ?`)) return;

    const token = localStorage.getItem("token");
    setDeletingId(id);

    try {
      const res = await fetch(`${API}/hotels/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Échec de la suppression");

      setHotels((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200";
    if (image.startsWith("http")) return image;
    return `${BASE_URL}${image}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-1">Hôtels</h1>
          <p className="text-gray-500">{hotels.length} hôtel(s) au total</p>
        </div>
        <Link
          href="/admin/hotels/new"
          className="bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all"
        >
          + Ajouter un hôtel
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Chargement...</div>
        ) : hotels.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Aucun hôtel pour le moment.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Destination</th>
                <th className="px-6 py-4">Prix/nuit</th>
                <th className="px-6 py-4">Étoiles</th>
                <th className="px-6 py-4">Disponible</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {hotels.map((hotel) => (
                <tr key={hotel.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img
                      src={getImageUrl(hotel.image)}
                      alt={hotel.nom}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#1a1a2e]">{hotel.nom}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {hotel.destination?.nom ?? "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-600">{hotel.prix_par_nuit} DT</td>
                  <td className="px-6 py-4">{"⭐".repeat(hotel.etoiles)}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        hotel.disponible
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {hotel.disponible ? "Disponible" : "Indisponible"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/admin/hotels/${hotel.id}/edit`}
                      className="inline-block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(hotel.id, hotel.nom)}
                      disabled={deletingId === hotel.id}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === hotel.id ? "..." : "Supprimer"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}