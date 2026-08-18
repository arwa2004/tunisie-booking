"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const token = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== passwordConfirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (!token) {
      setError("Lien invalide. Redemandez une réinitialisation.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
      const res = await fetch(`${apiUrl}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          email,
          password,
          password_confirmation: passwordConfirmation,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(
          data.message ||
            data.errors?.password?.[0] ||
            "Une erreur est survenue. Le lien a peut-être expiré."
        );
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);

      // Redirige vers login après 2 secondes
      setTimeout(() => router.push("/login"), 2000);
    } catch {
      setError("Erreur de connexion au serveur.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 w-full max-w-[460px]">
      {!success ? (
        <>
          <h1 className="text-3xl font-extrabold text-[#1a1a2e] mb-2 text-center">
            Nouveau mot de passe
          </h1>
          <p className="text-gray-400 text-sm text-center mb-8">
            Choisissez un nouveau mot de passe pour votre compte
          </p>

          {!token && (
            <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm px-4 py-3 rounded-xl mb-6">
              Lien invalide ou incomplet. Redemandez un email de réinitialisation.
            </div>
          )}

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

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">
                Min. 8 caractères, avec majuscule, minuscule et chiffre
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                placeholder="••••••••"
                required
                minLength={8}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] transition-colors text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white py-3 rounded-xl font-bold tracking-wide transition-all hover:shadow-lg hover:shadow-[#e91e8c]/35 disabled:opacity-50"
            >
              {loading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
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
            Mot de passe réinitialisé
          </h1>
          <p className="text-gray-500 text-sm mb-4">
            Redirection vers la page de connexion...
          </p>
        </div>
      )}

      <p className="text-center text-sm text-gray-500 mt-8">
        <Link href="/login" className="text-[#e91e8c] font-semibold hover:underline">
          ← Retour à la connexion
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center px-4 py-16">
        <Suspense fallback={<div>Chargement...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}