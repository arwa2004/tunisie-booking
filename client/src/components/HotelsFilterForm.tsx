"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Destination {
  id: number;
  nom: string;
}

interface HotelsFilterFormProps {
  destinations: Destination[];
}

export default function HotelsFilterForm({ destinations }: HotelsFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [destinationId, setDestinationId] = useState(searchParams.get("destination_id") || "");
  const [stars, setStars] = useState(searchParams.get("etoiles") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("prix_max") || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destinationId) params.set("destination_id", destinationId);
    if (stars) params.set("etoiles", stars);
    if (maxPrice) params.set("prix_max", maxPrice);

    router.push(`/hotels?${params.toString()}`);
  };

  const handleReset = () => {
    setDestinationId("");
    setStars("");
    setMaxPrice("");
    router.push("/hotels");
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-[90px]">
      <h3 className="font-bold text-lg text-[#1a1a2e] mb-6">Filtrez votre recherche</h3>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Destination Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">📍 Destination</label>
          <select
            value={destinationId}
            onChange={(e) => setDestinationId(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-transparent outline-none focus:border-[#e91e8c]"
          >
            <option value="">Toutes les destinations</option>
            {destinations.map((dest) => (
              <option key={dest.id} value={dest.id}>
                {dest.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Stars Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">⭐ Étoiles</label>
          <select
            value={stars}
            onChange={(e) => setStars(e.target.value)}
            className="w-full p-3 border border-gray-200 rounded-xl text-sm bg-transparent outline-none focus:border-[#e91e8c]"
          >
            <option value="">Tous</option>
            <option value="5">5 Étoiles</option>
            <option value="4">4 Étoiles</option>
            <option value="3">3 Étoiles</option>
          </select>
        </div>

        {/* Price Filter */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">💰 Prix max (DT)</label>
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Ex: 300"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#e91e8c]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all"
        >
          Filtrer
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="w-full text-center text-gray-400 hover:text-[#e91e8c] text-sm font-semibold transition-colors mt-2"
        >
          Réinitialiser
        </button>
      </form>
    </div>
  );
}
