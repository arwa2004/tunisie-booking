"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = "http://127.0.0.1:8000";

interface Destination {
  id: number;
  nom: string;
}

interface Chambre {
  id: number;
  type: string;
  nom: string;
  prix_base_nuit: number;
  capacite_adultes: number;
  capacite_enfants: number;
  quantite: number;
}

export default function EditHotelPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [chambres, setChambres] = useState<Chambre[]>([]);
  const [savingChambreId, setSavingChambreId] = useState<number | null>(null);

  const [form, setForm] = useState({
    destination_id: "",
    nom: "",
    prix_par_nuit: "",
    etoiles: "3",
    description: "",
    disponible: true,
    // ⬇️ NOUVEAU : tarification enfants
    age_max_bebe: "2",
    age_max_enfant: "12",
    supplement_enfant: "30",
    supplement_grand_enfant: "50",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API}/destinations`).then((r) => r.json()),
      fetch(`${API}/hotels/${id}`).then((r) => r.json()),
      fetch(`${API}/hotels/${id}/chambres`).then((r) => r.json()),
    ]).then(([destData, hotelData, chambresData]) => {
      setDestinations(destData);
      setChambres(chambresData);
      setForm({
        destination_id: String(hotelData.destination_id ?? ""),
        nom: hotelData.nom ?? "",
        prix_par_nuit: String(hotelData.prix_par_nuit ?? ""),
        etoiles: String(hotelData.etoiles ?? "3"),
        description: hotelData.description ?? "",
        disponible: !!hotelData.disponible,
        // ⬇️ NOUVEAU : on retombe sur des valeurs par défaut si l'hôtel a été
        // créé avant l'ajout de ces colonnes (colonnes nullable en base)
        age_max_bebe: String(hotelData.age_max_bebe ?? "2"),
        age_max_enfant: String(hotelData.age_max_enfant ?? "12"),
        supplement_enfant: String(hotelData.supplement_enfant ?? "30"),
        supplement_grand_enfant: String(hotelData.supplement_grand_enfant ?? "50"),
      });
      if (hotelData.image) {
        setImagePreview(
          hotelData.image.startsWith("http") ? hotelData.image : `${BASE_URL}${hotelData.image}`
        );
      }
      setLoading(false);
    });
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("_method", "PUT"); // ⚠️ Laravel a besoin de ça pour FormData + PUT
    formData.append("destination_id", form.destination_id);
    formData.append("nom", form.nom);
    formData.append("prix_par_nuit", form.prix_par_nuit);
    formData.append("etoiles", form.etoiles);
    formData.append("description", form.description);
    formData.append("disponible", form.disponible ? "1" : "0");
    // ⬇️ NOUVEAU : envoi des champs de tarification enfants
    formData.append("age_max_bebe", form.age_max_bebe);
    formData.append("age_max_enfant", form.age_max_enfant);
    formData.append("supplement_enfant", form.supplement_enfant);
    formData.append("supplement_grand_enfant", form.supplement_grand_enfant);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(`${API}/hotels/${id}`, {
        method: "POST", // POST + _method=PUT (override Laravel)
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.message || "Erreur lors de la modification");
      }

      router.push("/admin/hotels");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChambreChange = (chambreId: number, field: keyof Chambre, value: string | number) => {
    setChambres((prev) =>
      prev.map((ch) => (ch.id === chambreId ? { ...ch, [field]: value } : ch))
    );
  };

  const handleSaveChambre = async (chambre: Chambre) => {
    setSavingChambreId(chambre.id);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/chambres/${chambre.id}`, {
        method: "POST", // Method spoofing for PUT
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prix_base_nuit: chambre.prix_base_nuit,
          quantite: chambre.quantite,
          nom: chambre.nom,
        }),
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Erreur serveur: ${res.status} - ${errText}`);
      }
      alert(`Chambre "${chambre.nom}" mise à jour avec succès.`);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Erreur réseau ou serveur.");
    } finally {
      setSavingChambreId(null);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/hotels" className="text-sm text-gray-500 hover:text-[#e91e8c]">
          ← Retour aux hôtels
        </Link>
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] mt-2">Modifier l'hôtel</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-6">

        {/* Image */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Image</label>
          <div className="flex items-center gap-4">
            {imagePreview && (
              <img src={imagePreview} alt="preview" className="w-20 h-20 rounded-lg object-cover" />
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageChange}
              className="block w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#e91e8c]/10 file:text-[#e91e8c] file:font-semibold hover:file:bg-[#e91e8c]/20"
            />
          </div>
          {errors.image && <p className="text-red-500 text-xs mt-1">{errors.image[0]}</p>}
        </div>

        {/* Destination */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Destination</label>
          <select
            value={form.destination_id}
            onChange={(e) => setForm({ ...form, destination_id: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
          >
            <option value="">Sélectionner...</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
          {errors.destination_id && <p className="text-red-500 text-xs mt-1">{errors.destination_id[0]}</p>}
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de l'hôtel</label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
          />
          {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom[0]}</p>}
        </div>

        {/* Prix + Étoiles */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Prix / nuit (DT)</label>
            <input
              type="number"
              min="0"
              value={form.prix_par_nuit}
              onChange={(e) => setForm({ ...form, prix_par_nuit: e.target.value })}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
            />
            {errors.prix_par_nuit && <p className="text-red-500 text-xs mt-1">{errors.prix_par_nuit[0]}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Étoiles</label>
            <select
              value={form.etoiles}
              onChange={(e) => setForm({ ...form, etoiles: e.target.value })}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{"⭐".repeat(n)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
          />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ⬇️ NOUVEAU : TARIFICATION ENFANTS
            ══════════════════════════════════════════════════════════════ */}
        <div className="border border-gray-200 rounded-xl p-5 space-y-4 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
            👶 Tarification enfants
          </h3>
          <p className="text-xs text-gray-500 -mt-2">
            Ces réglages définissent comment les suppléments enfants sont calculés
            sur la page de réservation de cet hôtel.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Âge max "bébé" (gratuit)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={form.age_max_bebe}
                  onChange={(e) => setForm({ ...form, age_max_bebe: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">ans</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Ex: 2 → 0 et 1 an gratuits</p>
              {errors.age_max_bebe && <p className="text-red-500 text-xs mt-1">{errors.age_max_bebe[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Âge max "enfant"
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="17"
                  value={form.age_max_enfant}
                  onChange={(e) => setForm({ ...form, age_max_enfant: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-14 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">ans</span>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Au-delà = tarif "grand enfant"</p>
              {errors.age_max_enfant && <p className="text-red-500 text-xs mt-1">{errors.age_max_enfant[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Supplément "enfant" / nuit
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.supplement_enfant}
                  onChange={(e) => setForm({ ...form, supplement_enfant: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">DT</span>
              </div>
              {errors.supplement_enfant && <p className="text-red-500 text-xs mt-1">{errors.supplement_enfant[0]}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Supplément "grand enfant" / nuit
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={form.supplement_grand_enfant}
                  onChange={(e) => setForm({ ...form, supplement_grand_enfant: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">DT</span>
              </div>
              {errors.supplement_grand_enfant && <p className="text-red-500 text-xs mt-1">{errors.supplement_grand_enfant[0]}</p>}
            </div>
          </div>
        </div>

        {/* Disponible */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="disponible"
            checked={form.disponible}
            onChange={(e) => setForm({ ...form, disponible: e.target.checked })}
            className="w-5 h-5 accent-[#e91e8c]"
          />
          <label htmlFor="disponible" className="text-sm font-medium text-gray-700">
            Hôtel disponible
          </label>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <Link
            href="/admin/hotels"
            className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Annuler
          </Link>
        </div>
      </form>

      {/* ══════════════════════════════════════════════════════════════
          ⬇️ GESTION DES CHAMBRES
          ══════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-2xl shadow-md p-8 mt-8">
        <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">Gestion des Chambres (Prix & Quantité)</h2>
        <p className="text-sm text-gray-500 mb-6">
          Modifiez ici manuellement les prix de base pour chaque chambre. Ces prix sont désormais indépendants du prix de l'hôtel.
        </p>
        
        {chambres.length === 0 ? (
          <p className="text-gray-400">Aucune chambre trouvée pour cet hôtel.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600">Type / Nom</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 w-32">Prix de base (DT)</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 w-24">Quantité</th>
                  <th className="py-3 px-4 text-sm font-semibold text-gray-600 w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {chambres.map((chambre) => (
                  <tr key={chambre.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-gray-800">{chambre.nom}</div>
                      <div className="text-xs text-gray-500 mt-1 capitalize">{chambre.type} • {chambre.capacite_adultes} Ad. / {chambre.capacite_enfants} Enf.</div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        value={chambre.prix_base_nuit}
                        onChange={(e) => handleChambreChange(chambre.id, "prix_base_nuit", parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        value={chambre.quantite}
                        onChange={(e) => handleChambreChange(chambre.id, "quantite", parseInt(e.target.value) || 0)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => handleSaveChambre(chambre)}
                        disabled={savingChambreId === chambre.id}
                        className="bg-[#1a1a2e] hover:bg-[#2a2a4e] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                      >
                        {savingChambreId === chambre.id ? "..." : "Enregistrer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}