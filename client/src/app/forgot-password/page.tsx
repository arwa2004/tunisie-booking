"use client";

import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${apiUrl}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      // On affiche le message de succès même si res.ok est false pour 422
      // sauf si c'est une vraie erreur serveur
      if (res.status >= 500) {
        setError("Erreur serveur. Réessayez plus tard.");
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (res.status === 422) {
        setError(data.errors?.email?.[0] || "Email invalide.");
        setLoading(false);
        return;
      }

      // Toujours afficher le même message de succès
      // (le backend répond pareil que l'email existe ou non)
      setSent(true);
      setLoading(false);
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-[460px]">
          {!sent ? (
            <>
              <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2 text-center">
                Mot de passe oublié
              </h1>
              <p className="text-gray-400 text-sm text-center mb-8">
                Entrez votre email, on vous envoie un lien de réinitialisation
              </p>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white py-3 rounded-xl font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-[#e91e8c]/35 disabled:opacity-50"
                >
                  {loading ? "Envoi..." : "Envoyer le lien"}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-3">
                Email envoyé
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Si un compte existe avec l'adresse <strong>{email}</strong>,
                vous recevrez un lien pour réinitialiser votre mot de passe.
                Vérifiez aussi vos spams.
              </p>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-8">
            <Link href="/login" className="text-[#e91e8c] font-semibold hover:underline">
              ← Retour à la connexion
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}