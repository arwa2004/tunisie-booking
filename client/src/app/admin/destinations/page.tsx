"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = "http://127.0.0.1:8000";

interface Destination {
  id: number;
  nom: string;
  region: string;
  image: string | null;
}

export default function DestinationsPage() {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchDestinations = () => {
    setLoading(true);
    fetch(`${API}/destinations`)
      .then((r) => r.json())
      .then((data) => setDestinations(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDestinations();
  }, []);

  const handleDelete = async (id: number, nom: string) => {
    if (!confirm(`Supprimer "${nom}" ? Tous ses hôtels seront aussi supprimés.`)) return;

    const token = localStorage.getItem("token");
    setDeletingId(id);

    try {
      const res = await fetch(`${API}/destinations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Échec de la suppression");

      setDestinations((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=200";
    if (image.startsWith("http")) return image;
    return `${BASE_URL}${image}`;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-1">Destinations</h1>
          <p className="text-gray-500">{destinations.length} destination(s) au total</p>
        </div>
        <Link
          href="/admin/destinations/new"
          className="bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-semibold px-5 py-3 rounded-xl shadow-lg transition-all"
        >
          + Ajouter une destination
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Chargement...</div>
        ) : destinations.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Aucune destination pour le moment.</div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-sm uppercase">
              <tr>
                <th className="px-6 py-4">Image</th>
                <th className="px-6 py-4">Nom</th>
                <th className="px-6 py-4">Région</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {destinations.map((destination) => (
                <tr key={destination.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <img
                      src={getImageUrl(destination.image)}
                      alt={destination.nom}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  </td>
                  <td className="px-6 py-4 font-semibold text-[#1a1a2e]">{destination.nom}</td>
                  <td className="px-6 py-4 text-gray-600">{destination.region}</td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link
                      href={`/admin/destinations/${destination.id}/edit`}
                      className="inline-block px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handleDelete(destination.id, destination.nom)}
                      disabled={deletingId === destination.id}
                      className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingId === destination.id ? "..." : "Supprimer"}
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