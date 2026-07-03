"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    hotels: 0, destinations: 0, voyages: 0, reservations: 0, users: 0,
  });
  const [loading, setLoading] = useState(true);
  const [reservationsRecentes, setReservationsRecentes] = useState<any[]>([]);

  useEffect(() => {
    const token   = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` } as HeadersInit;

    Promise.all([
      fetch(`${API}/hotels`,       { headers }).then(r => r.json()),
      fetch(`${API}/destinations`, { headers }).then(r => r.json()),
      fetch(`${API}/voyages`,      { headers }).then(r => r.json()),
      fetch(`${API}/reservations`, { headers }).then(r => r.json()),
      fetch(`${API}/users`,        { headers }).then(r => r.json()),
    ]).then(([hotels, destinations, voyages, reservations, users]) => {

      // Gère les deux cas : tableau direct ou objet paginé { data: [...] }
      const count = (d: any) => Array.isArray(d) ? d.length : (d?.data?.length ?? 0);
      const arr   = (d: any) => Array.isArray(d) ? d : (d?.data ?? []);

      setStats({
        hotels:       count(hotels),
        destinations: count(destinations),
        voyages:      count(voyages),
        reservations: count(reservations),
        users:        count(users),
      });

      // 5 dernières réservations
      setReservationsRecentes(arr(reservations).slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Hôtels",       value: stats.hotels,       icon: "🏨", color: "from-blue-500 to-blue-600",    href: "/admin/hotels"       },
    { label: "Destinations", value: stats.destinations, icon: "📍", color: "from-green-500 to-green-600",  href: "/admin/destinations" },
    { label: "Voyages",      value: stats.voyages,      icon: "✈️",  color: "from-purple-500 to-purple-600",href: "/admin/voyages"      },
    { label: "Réservations", value: stats.reservations, icon: "📋", color: "from-pink-500 to-pink-600",    href: "/admin/reservations" },
    { label: "Utilisateurs", value: stats.users,        icon: "👥", color: "from-orange-500 to-orange-600",href: "/admin/users"        },
  ];

  const statutColor: Record<string, string> = {
    en_attente: "bg-yellow-100 text-yellow-700",
    confirmee:  "bg-green-100 text-green-700",
    annulee:    "bg-red-100 text-red-700",
  };

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bienvenue dans l'administration TunisieBooking</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-10">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg hover:scale-105 transition-transform`}
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="text-4xl font-extrabold mb-1">
              {loading ? "..." : card.value}
            </div>
            <div className="text-sm opacity-80">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* Dernières réservations */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[#1a1a2e]">
            Dernières réservations
          </h2>
          <Link
            href="/admin/reservations"
            className="text-sm text-[#e91e8c] font-semibold hover:underline"
          >
            Voir tout →
          </Link>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : reservationsRecentes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">
            Aucune réservation pour l'instant
          </p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 rounded-xl">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Client</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Hôtel</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Dates</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Prix</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservationsRecentes.map((r: any) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#1a1a2e]">
                    {r.user?.prenom} {r.user?.nom}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {r.hotel?.nom}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(r.date_arrivee).toLocaleDateString("fr-FR")} →{" "}
                    {new Date(r.date_depart).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[#e91e8c]">
                    {r.prix_total} DT
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statutColor[r.statut] || "bg-gray-100 text-gray-600"}`}>
                      {r.statut}
                    </span>
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