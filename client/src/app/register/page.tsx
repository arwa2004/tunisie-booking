"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    telephone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const updateField = (field: string, value: string) => {
    setForm({ ...form, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${apiUrl}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        // Laravel renvoie les erreurs de validation dans data.errors
        if (data.errors) {
          const firstError = Object.values(data.errors)[0];
          setError(Array.isArray(firstError) ? firstError[0] as string : String(firstError));
        } else {
          setError(data.message || "Erreur lors de l'inscription.");
        }
        setLoading(false);
        return;
      }

      // Stocker le token et rediriger
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/");
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-[520px]">
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2 text-center">
            Inscription
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8">
            Créez votre compte TunisieBooking
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Nom</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={(e) => updateField("nom", e.target.value)}
                  placeholder="Ben Ali"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Prénom</label>
                <input
                  type="text"
                  value={form.prenom}
                  onChange={(e) => updateField("prenom", e.target.value)}
                  placeholder="Ahmed"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Téléphone</label>
              <input
                type="tel"
                value={form.telephone}
                onChange={(e) => updateField("telephone", e.target.value)}
                placeholder="+216 XX XXX XXX"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="votre@email.com"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">Mot de passe</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={form.password_confirmation}
                onChange={(e) => updateField("password_confirmation", e.target.value)}
                placeholder="Retapez votre mot de passe"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white py-3 rounded-xl font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-[#e91e8c]/35 disabled:opacity-50"
            >
              {loading ? "Inscription..." : "Créer mon compte"}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-8">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-[#e91e8c] font-semibold hover:underline">
              Se connecter
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}