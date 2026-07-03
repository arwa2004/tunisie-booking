"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Voyage {
  id: number;
  nom: string;
  pays: string;
  prix: number;
  duree: number;
  image: string;
}

export default function AdminVoyagesPage() {
  const [voyages, setVoyages] = useState<Voyage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVoyages = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/voyages`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setVoyages(data);
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce voyage ?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/voyages/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    setVoyages(voyages.filter((v) => v.id !== id));
  };

  useEffect(() => { fetchVoyages(); }, []);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e]">Voyages</h1>
          <p className="text-gray-500 mt-1">{voyages.length} voyage(s) au total</p>
        </div>
        <Link
          href="/admin/voyages/new"
          className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg transition-all"
        >
          + Ajouter un voyage
        </Link>
      </div>

      {/* Table */}
      {loading ? (
        <p className="text-gray-400">Chargement...</p>
      ) : (
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Voyage</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Pays</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Durée</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Prix</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {voyages.map((voyage) => (
                <tr key={voyage.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={
                            !voyage.image
                            ? "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=60"
                            : voyage.image.startsWith("http")
                            ? voyage.image
                            : `http://127.0.0.1:8000${voyage.image}`
                        }
                        alt={voyage.nom}
                        className="w-12 h-12 rounded-xl object-cover"
                        />
                      <span className="font-semibold text-[#1a1a2e]">{voyage.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">🌍 {voyage.pays}</td>
                  <td className="px-6 py-4 text-gray-600">🕐 {voyage.duree} jours</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-[#e91e8c]">{voyage.prix} DT</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/voyages/${voyage.id}/edit`}
                        className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors"
                      >
                        ✏️ Modifier
                      </Link>
                      <button
                        onClick={() => handleDelete(voyage.id)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                      >
                        🗑️ Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {voyages.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <p className="text-4xl mb-3">✈️</p>
              <p>Aucun voyage pour l'instant</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}