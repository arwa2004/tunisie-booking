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

/* ── Modal config par type d'action ── */
type ModalAction = "confirmer" | "annuler" | "supprimer" | null;

const MODAL_CONFIG: Record<string, { icon: string; title: string; message: (r: Reservation) => string; confirmLabel: string; confirmColor: string; confirmHover: string }> = {
  confirmer: {
    icon: "✓",
    title: "Confirmer cette réservation ?",
    message: (r) =>
      `Vous allez confirmer la réservation de ${r.user ? `${r.user.prenom} ${r.user.nom}` : "ce client"} à l'hôtel ${r.hotel?.nom ?? "—"} du ${r.date_arrivee} au ${r.date_depart} pour un montant de ${r.prix_total} DT.`,
    confirmLabel: "Oui, confirmer",
    confirmColor: "bg-green-600",
    confirmHover: "hover:bg-green-700",
  },
  annuler: {
    icon: "✕",
    title: "Annuler cette réservation ?",
    message: (r) =>
      `Vous allez annuler la réservation de ${r.user ? `${r.user.prenom} ${r.user.nom}` : "ce client"} à l'hôtel ${r.hotel?.nom ?? "—"}. Le client sera notifié de cette annulation.`,
    confirmLabel: "Oui, annuler",
    confirmColor: "bg-amber-600",
    confirmHover: "hover:bg-amber-700",
  },
  supprimer: {
    icon: "🗑",
    title: "Supprimer cette réservation ?",
    message: (r) =>
      `Vous allez supprimer définitivement la réservation #${r.id} de ${r.user ? `${r.user.prenom} ${r.user.nom}` : "ce client"}. Cette action est irréversible.`,
    confirmLabel: "Oui, supprimer",
    confirmColor: "bg-red-600",
    confirmHover: "hover:bg-red-700",
  },
};

export default function ReservationsAdminPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading]           = useState(true);
  const [filter, setFilter]             = useState<string>("tous");
  const [updatingId, setUpdatingId]     = useState<number | null>(null);
  const [deletingId, setDeletingId]     = useState<number | null>(null);

  /* ── State pour le modal de confirmation ── */
  const [modalAction, setModalAction]         = useState<ModalAction>(null);
  const [modalReservation, setModalReservation] = useState<Reservation | null>(null);

  /* ── State pour le toast de succès ── */
  const [toast, setToast]   = useState<string | null>(null);
  const [toastType, setToastType] = useState<"green" | "amber" | "red">("green");

  const showToast = (message: string, type: "green" | "amber" | "red") => {
    setToast(message);
    setToastType(type);
    setTimeout(() => setToast(null), 3000);
  };

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

  /* ── Ouvrir le modal au lieu d'agir directement ── */
  const openModal = (action: ModalAction, reservation: Reservation) => {
    setModalAction(action);
    setModalReservation(reservation);
  };

  const closeModal = () => {
    setModalAction(null);
    setModalReservation(null);
  };

  /* ── Actions réelles (appelées uniquement après confirmation du modal) ── */
  const handleStatut = async (id: number, statut: "confirmee" | "annulee") => {
    setUpdatingId(id);
    closeModal();
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
      showToast(
        statut === "confirmee" ? "Réservation confirmée avec succès !" : "Réservation annulée avec succès !",
        statut === "confirmee" ? "green" : "amber"
      );
    } catch {
      showToast("Erreur lors de la mise à jour du statut", "red");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(id);
    closeModal();
    try {
      const res = await fetch(`${API}/reservations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token()}` },
      });
      if (!res.ok) throw new Error();
      setReservations((prev) => prev.filter((r) => r.id !== id));
      showToast("Réservation supprimée avec succès !", "red");
    } catch {
      showToast("Erreur lors de la suppression", "red");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Exécuter l'action confirmée depuis le modal ── */
  const handleModalConfirm = () => {
    if (!modalReservation) return;
    if (modalAction === "confirmer") handleStatut(modalReservation.id, "confirmee");
    else if (modalAction === "annuler") handleStatut(modalReservation.id, "annulee");
    else if (modalAction === "supprimer") handleDelete(modalReservation.id);
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
                          onClick={() => openModal("confirmer", r)}
                          disabled={updatingId === r.id}
                          className="px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ✓ Confirmer
                        </button>
                      )}
                      {r.statut !== "annulee" && (
                        <button
                          onClick={() => openModal("annuler", r)}
                          disabled={updatingId === r.id}
                          className="px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          ✕ Annuler
                        </button>
                      )}
                      <button
                        onClick={() => openModal("supprimer", r)}
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

      {/* ── Modal de confirmation ── */}
      {modalAction && modalReservation && MODAL_CONFIG[modalAction] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={closeModal}
          style={{ animation: "fadeIn 0.2s ease-out" }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: "slideUp 0.3s ease-out" }}
          >
            {/* Icône et titre */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white text-xl ${MODAL_CONFIG[modalAction].confirmColor}`}>
                {MODAL_CONFIG[modalAction].icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {MODAL_CONFIG[modalAction].title}
              </h3>
            </div>

            {/* Message descriptif */}
            <p className="text-gray-600 text-sm leading-relaxed mb-6">
              {MODAL_CONFIG[modalAction].message(modalReservation)}
            </p>

            {/* Boutons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Non, annuler
              </button>
              <button
                onClick={handleModalConfirm}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${MODAL_CONFIG[modalAction].confirmColor} ${MODAL_CONFIG[modalAction].confirmHover}`}
              >
                {MODAL_CONFIG[modalAction].confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast de succès ── */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-2 ${
            toastType === "green" ? "bg-green-600" : toastType === "amber" ? "bg-amber-600" : "bg-red-600"
          }`}
          style={{ animation: "slideUp 0.3s ease-out" }}
        >
          <span>{toastType === "green" ? "✓" : toastType === "amber" ? "⚠" : "🗑"}</span>
          {toast}
        </div>
      )}

      {/* ── Animations CSS ── */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}