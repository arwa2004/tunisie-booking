"use client";

import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    hotels:       0,
    destinations: 0,
    voyages:      0,
    reservations: 0,
    users:        0,
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    Promise.all([
      fetch(`${API}/hotels`,        { headers }).then(r => r.json()),
      fetch(`${API}/destinations`,  { headers }).then(r => r.json()),
      fetch(`${API}/voyages`,       { headers }).then(r => r.json()),
      fetch(`${API}/reservations`,  { headers }).then(r => r.json()),
      fetch(`${API}/users`,         { headers }).then(r => r.json()),
    ]).then(([hotels, destinations, voyages, reservations, users]) => {
      setStats({
        hotels:       hotels.length,
        destinations: destinations.length,
        voyages:      voyages.length,
        reservations: reservations.length,
        users:        users.length,
      });
    });
  }, []);

  const cards = [
    { label: "Hôtels",        value: stats.hotels,       icon: "🏨", color: "from-blue-500 to-blue-600"   },
    { label: "Destinations",  value: stats.destinations, icon: "📍", color: "from-green-500 to-green-600" },
    { label: "Voyages",       value: stats.voyages,      icon: "✈️",  color: "from-purple-500 to-purple-600"},
    { label: "Réservations",  value: stats.reservations, icon: "📋", color: "from-pink-500 to-pink-600"   },
    { label: "Utilisateurs",  value: stats.users,        icon: "👥", color: "from-orange-500 to-orange-600"},
  ];

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2">Dashboard</h1>
      <p className="text-gray-500 mb-8">Bienvenue dans l'administration TunisieBooking</p>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {cards.map((card) => (
          <div
            key={card.label}
            className={`bg-gradient-to-br ${card.color} rounded-2xl p-6 text-white shadow-lg`}
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <div className="text-4xl font-extrabold mb-1">{card.value}</div>
            <div className="text-sm opacity-80">{card.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}