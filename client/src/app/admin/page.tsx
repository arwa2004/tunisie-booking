"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface Reservation {
  id: number;
  statut: "en_attente" | "confirmee" | "annulee";
  date_arrivee: string;
  prix_total: number;
  user: { nom: string; prenom: string } | null;
  hotel: { id: number; nom: string; destination?: { nom: string } } | null;
}

export default function AdminDashboard() {
  const [stats, setStats]                       = useState({ hotels: 0, destinations: 0, voyages: 0, reservations: 0, users: 0 });
  const [statusData, setStatusData]             = useState({ confirme: 0, attente: 0, annule: 0 });
  const [topHotels, setTopHotels]               = useState<{ name: string; count: number }[]>([]);
  const [topDestinations, setTopDestinations]   = useState<{ name: string; count: number }[]>([]);
  const [reservationsRecentes, setReservationsRecentes] = useState<Reservation[]>([]);
  const [loading, setLoading]                   = useState(true);

  useEffect(() => {
    const token   = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` } as HeadersInit;

    Promise.all([
      fetch(`${API}/hotels`,        { headers }).then(r => r.json()),
      fetch(`${API}/destinations`,  { headers }).then(r => r.json()),
      fetch(`${API}/voyages`,       { headers }).then(r => r.json()),
      fetch(`${API}/reservations`,  { headers }).then(r => r.json()),
      fetch(`${API}/users`,         { headers }).then(r => r.json()),
    ]).then(([hotels, destinations, voyages, reservations, users]) => {
      const count = (d: any) => Array.isArray(d) ? d.length : (d?.data?.length ?? 0);
      const arr   = (d: any) => Array.isArray(d) ? d : (d?.data ?? []);

      setStats({
        hotels:       count(hotels),
        destinations: count(destinations),
        voyages:      count(voyages),
        reservations: count(reservations),
        users:        count(users),
      });

      const allReservations: Reservation[] = arr(reservations);

      // Statuts
      const sc = allReservations.reduce(
        (acc, r) => {
          if (r.statut === "confirmee")       acc.confirme++;
          else if (r.statut === "en_attente") acc.attente++;
          else if (r.statut === "annulee")    acc.annule++;
          return acc;
        },
        { confirme: 0, attente: 0, annule: 0 }
      );
      setStatusData(sc);

      // Top hôtels
      const hotelMap: Record<string, number> = {};
      allReservations.forEach(r => {
        const name = r.hotel?.nom || "Inconnu";
        hotelMap[name] = (hotelMap[name] || 0) + 1;
      });
      setTopHotels(
        Object.entries(hotelMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      );

      // Top destinations
      const destMap: Record<string, number> = {};
      allReservations.forEach(r => {
        const name = r.hotel?.destination?.nom || "Autre";
        destMap[name] = (destMap[name] || 0) + 1;
      });
      setTopDestinations(
        Object.entries(destMap)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 4)
      );

      // Dernières réservations
      setReservationsRecentes(allReservations.slice(0, 5));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Chart.js — statuts uniquement
  useEffect(() => {
    if (loading) return;
    const script    = document.createElement("script");
    script.src      = "https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js";
    script.onload   = () => {
      const Chart   = (window as any).Chart;
      const isDark  = matchMedia("(prefers-color-scheme: dark)").matches;
      const total   = statusData.confirme + statusData.attente + statusData.annule;

      const existing = Chart.getChart("statusChart");
      if (existing) existing.destroy();

      if (total > 0) {
        new Chart(document.getElementById("statusChart"), {
          type: "doughnut",
          data: {
            labels: ["Confirmées", "En attente", "Annulées"],
            datasets: [{
              data: [statusData.confirme, statusData.attente, statusData.annule],
              backgroundColor: ["#1baf7a", "#eda100", "#e34948"],
              borderColor: isDark ? "#1a1a19" : "#ffffff",
              borderWidth: 3,
              hoverOffset: 6,
            }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx: any) =>
                    ctx.label + " : " + ctx.parsed + " (" + Math.round(ctx.parsed / total * 100) + "%)",
                },
              },
            },
          },
        });
      }
    };
    document.head.appendChild(script);
  }, [loading, statusData]);

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

  const maxHotel = Math.max(...topHotels.map(h => h.count), 1);
  const maxDest  = Math.max(...topDestinations.map(d => d.count), 1);

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bienvenue dans l'administration TunisieBooking</p>

      {/* ── 5 Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
        {cards.map(card => (
          <Link key={card.label} href={card.href}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-5 text-white shadow hover:scale-105 transition-transform`}>
            <div className="text-2xl mb-2">{card.icon}</div>
            <div className="text-3xl font-extrabold mb-1">{loading ? "…" : card.value}</div>
            <div className="text-xs opacity-80">{card.label}</div>
          </Link>
        ))}
      </div>

      {/* ── Statuts + Top Hôtels ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Statuts */}
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="font-bold text-[#1a1a2e] mb-1">Statuts des réservations</p>
          <p className="text-xs text-gray-400 mb-4">Répartition actuelle</p>
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block"></span>
              Confirmées ({statusData.confirme})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-400 inline-block"></span>
              En attente ({statusData.attente})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block"></span>
              Annulées ({statusData.annule})
            </span>
          </div>
          <div className="relative w-full h-44">
            <canvas id="statusChart" role="img" aria-label="Statuts des réservations">
              Chargement...
            </canvas>
          </div>
        </div>

        {/* Top Hôtels */}
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="font-bold text-[#1a1a2e] mb-1">Top hôtels</p>
          <p className="text-xs text-gray-400 mb-5">Par nombre de réservations</p>
          {loading ? <p className="text-gray-400 text-sm">Chargement...</p> : (
            <div className="space-y-4">
              {topHotels.map((h, i) => (
                <div key={h.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 truncate max-w-[160px]">{h.name}</span>
                    <span className="text-gray-400">{h.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                      style={{ width: `${Math.round((h.count / maxHotel) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
              {topHotels.length === 0 && <p className="text-gray-400 text-sm">Aucune réservation</p>}
            </div>
          )}
        </div>

        {/* Top Destinations */}
        <div className="bg-white rounded-2xl shadow p-6">
          <p className="font-bold text-[#1a1a2e] mb-1">Top destinations</p>
          <p className="text-xs text-gray-400 mb-5">Par nombre de réservations</p>
          {loading ? <p className="text-gray-400 text-sm">Chargement...</p> : (
            <div className="space-y-4">
              {topDestinations.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700 truncate max-w-[160px]">{d.name}</span>
                    <span className="text-gray-400">{d.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.round((d.count / maxDest) * 100)}%`,
                        background: "linear-gradient(to right, #e91e8c, #c2185b)",
                      }}
                    />
                  </div>
                </div>
              ))}
              {topDestinations.length === 0 && <p className="text-gray-400 text-sm">Aucune destination</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Dernières réservations ── */}
      <div className="bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-[#1a1a2e]">Dernières réservations</h2>
          <Link href="/admin/reservations" className="text-sm text-[#e91e8c] font-semibold hover:underline">
            Voir tout →
          </Link>
        </div>
        {loading ? (
          <p className="text-gray-400 text-sm">Chargement...</p>
        ) : reservationsRecentes.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">Aucune réservation</p>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {["Client", "Hôtel", "Date arrivée", "Prix total", "Statut"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservationsRecentes.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-[#1a1a2e]">
                    {r.user?.prenom} {r.user?.nom}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{r.hotel?.nom}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(r.date_arrivee).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-[#e91e8c]">
                    {Number(r.prix_total).toLocaleString("fr-FR")} DT
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${statutColor[r.statut]}`}>
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