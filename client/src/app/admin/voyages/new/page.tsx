"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

export default function NewVoyagePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "", pays: "", prix: "", duree: "", description: "",
  });
  const [image, setImage]   = useState<File | null>(null);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const token   = localStorage.getItem("token");
    const formData = new FormData();

    Object.entries(form).forEach(([k, v]) => formData.append(k, v));
    if (image) formData.append("image", image);

    const res = await fetch(`${API}/voyages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.message || "Erreur lors de l'ajout.");
      setLoading(false);
      return;
    }

    router.push("/admin/voyages");
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/voyages" className="text-gray-400 hover:text-gray-600 transition-colors">
          ← Retour
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e]">Nouveau voyage</h1>
          <p className="text-gray-500 mt-1">Ajouter un voyage organisé</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl shadow p-8 space-y-5">

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Nom du voyage</label>
            <input
              type="text"
              value={form.nom}
              onChange={(e) => updateField("nom", e.target.value)}
              placeholder="Circuit Sahara"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Pays</label>
            <input
              type="text"
              value={form.pays}
              onChange={(e) => updateField("pays", e.target.value)}
              placeholder="Tunisie"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Prix (DT)</label>
            <input
              type="number"
              value={form.prix}
              onChange={(e) => updateField("prix", e.target.value)}
              placeholder="1200"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-2">Durée (jours)</label>
            <input
              type="number"
              value={form.duree}
              onChange={(e) => updateField("duree", e.target.value)}
              placeholder="7"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Description du voyage..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-600 mb-2">Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files?.[0] || null)}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-500"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white py-3 rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50"
        >
          {loading ? "Ajout en cours..." : "Ajouter le voyage"}
        </button>
      </div>
    </div>
  );
}