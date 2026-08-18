"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = "http://127.0.0.1:8000";

export default function EditDestinationPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const [form, setForm] = useState({ nom: "", region: "" });
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    fetch(`${API}/destinations/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setForm({ nom: data.nom ?? "", region: data.region ?? "" });
        if (data.image) {
          setImagePreview(data.image.startsWith("http") ? data.image : `${BASE_URL}${data.image}`);
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
    formData.append("_method", "PUT");
    formData.append("nom", form.nom);
    formData.append("region", form.region);
    if (imageFile) formData.append("image", imageFile);

    try {
      const res = await fetch(`${API}/destinations/${id}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.errors) setErrors(data.errors);
        throw new Error(data.message || "Erreur lors de la modification");
      }

      router.push("/admin/destinations");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Chargement...</div>;
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/destinations" className="text-sm text-gray-500 hover:text-[#e91e8c]">
          ← Retour aux destinations
        </Link>
        <h1 className="text-3xl font-extrabold text-[#1a1a2e] mt-2">Modifier la destination</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-8 space-y-6">

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

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nom de la destination</label>
          <input
            type="text"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
          />
          {errors.nom && <p className="text-red-500 text-xs mt-1">{errors.nom[0]}</p>}
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Région</label>
          <input
            type="text"
            value={form.region}
            onChange={(e) => setForm({ ...form, region: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
          />
          {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region[0]}</p>}
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-semibold px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50"
          >
            {submitting ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
          <Link
            href="/admin/destinations"
            className="px-6 py-3 rounded-xl font-semibold text-gray-600 hover:bg-gray-100 transition-all"
          >
            Annuler
          </Link>
        </div>
      </form>
    </div>
  );
}