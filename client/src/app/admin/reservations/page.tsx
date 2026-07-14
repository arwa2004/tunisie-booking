"use client";

import { useEffect, useState } from "react";

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
  user: { id: number; nom: string; prenom: string; email: string } | null;
  hotel: { id: number; nom: string } | null;
  chambre: { id: number; nom: string } | null;
  pension: { id: number; nom: string } | null;
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

export default function ReservationsAdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<string>("tous");
  const [updatingId, setUpdatingId]     = useState<number | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  const token = () => localStorage.getItem("token");

  const fetchReservations = () => {
    setLoading(true);
    fetch(`${API}/reservations`, {
      headers: { Authorization: `Bearer ${token()}` },
    })
      .then((r) => r.json())
      .then((data) => setReservations(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleStatut = async (id: number, statut: "confirmee" | "annulee") => {
    setUpdatingId(id);
    try {
      const res = await fetch(`${API}/reservations/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ statut }),
      });
      if (!res.ok) throw new Error();
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, statut } : r))
      );
    } catch {
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API}/reservations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setReservations((prev) => prev.filter((r) => r.id !== id));
    } catch {
      alert("Erreur lors de la suppression");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = filter === "tous"
    ? reservations
    : reservations.filter((r) => r.statut === filter);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-1">Réservations</h1>
          <p className="text-gray-500">{reservations.length} réservation(s) au total</p>
        </div>

        {/* Filtre statut */}
        <div className="flex gap-2">
          {["tous", "en_attente", "confirmee", "annulee"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === s
                  ? "bg-[#e91e8c] text-white shadow"
                  : "bg-white text-gray-500 hover:bg-gray-100"
              }`}
            >
              {s === "tous" ? "Tous" : STATUT_LABELS[s as keyof typeof STATUT_LABELS]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400">Chargement...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400">Aucune réservation.</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-5 py-4">Client</th>
                <th className="px-5 py-4">Hôtel</th>
                <th className="px-5 py-4">Dates</th>
                <th className="px-5 py-4">Détails</th>
                <th className="px-5 py-4">Prix</th>
                <th className="px-5 py-4">Statut</th>
                <th className="px-5 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">

                  {/* Client */}
                  <td className="px-5 py-4">
                    <p className="font-semibold text-[#1a1a2e]">
                      {r.user ? `${r.user.prenom} ${r.user.nom}` : "—"}
                    </p>
                    <p className="text-xs text-gray-400">{r.user?.email}</p>
                  </td>

                  {/* Hôtel */}
                  <td className="px-5 py-4 text-gray-700">{r.hotel?.nom ?? "—"}</td>

                  {/* Dates */}
                  <td className="px-5 py-4 text-gray-600">
                    <p>{r.date_arrivee}</p>
                    <p className="text-xs text-gray-400">→ {r.date_depart}</p>
                  </td>

                  {/* Détails */}
                  <td className="px-5 py-4 text-gray-600 text-xs">
                    <p className="font-semibold text-gray-800">{r.chambre?.nom ?? "Chambre Standard"}</p>
                    <p className="text-[#e91e8c] font-medium">{r.pension?.nom ?? "Petit Déjeuner"}</p>
                    <p className="text-gray-400 mt-1">
                      {r.nb_chambres} chambre(s) | {r.nb_adultes} A · {r.nb_enfants} E
                    </p>
                  </td>

                  {/* Prix */}
                  <td className="px-5 py-4 font-semibold text-[#1a1a2e]">
                    {r.prix_total} DT
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUT_STYLES[r.statut]}`}>
                      {STATUT_LABELS[r.statut]}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 flex-wrap">
                      {r.statut !== "confirmee" && (
                        <button
                          onClick={() => handleStatut(r.id, "confirmee")}
                          disabled={updatingId === r.id}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ✓ Confirmer
                        </button>
                      )}
                      {r.statut !== "annulee" && (
                        <button
                          onClick={() => handleStatut(r.id, "annulee")}
                          disabled={updatingId === r.id}
                          className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ✕ Annuler
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        disabled={deletingId === r.id}
                        className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === r.id ? "..." : "Supprimer"}
                      </button>
                    </div>
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