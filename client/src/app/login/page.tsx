"use client";

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const { status, data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      // Rediriger les administrateurs vers le dashboard admin,
      // les autres utilisateurs vers l'accueil.
      const user = session?.user as any;
      const role = user?.role || (user?.email === "admin@gmail.com" ? "admin" : "client");
      router.replace(role === "admin" ? "/admin" : "/");
    }
  }, [status, session, router]);

  // Auto-redirect to Keycloak login after short delay
  useEffect(() => {
    if (status === "unauthenticated") {
      const t = setTimeout(() => {
        signIn("keycloak", { callbackUrl: "/" });
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [status]);

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="animate-spin w-10 h-10 border-4 border-[#e91e8c] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] relative overflow-hidden px-4">

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white border border-gray-100 rounded-3xl p-10 shadow-xl text-center">

        {/* Logo Image */}
        <Link href="/" className="inline-block mb-6">
          <img
            src="/logo.png"
            alt="Tunisie Booking"
            className="h-16 w-auto mx-auto object-contain"
          />
        </Link>

        <h1 className="text-2xl font-extrabold text-[#1a1a2e] mb-2">Connexion</h1>
        <p className="text-gray-500 text-sm mb-6">
          Redirection vers la connexion…
        </p>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-8">
          <div
            className="h-full bg-[#e91e8c] rounded-full"
            style={{ animation: "progress 1.5s ease-out forwards" }}
          />
        </div>
        <style>{`
          @keyframes progress {
            from { width: 0% }
            to   { width: 100% }
          }
        `}</style>

        {/* Bouton manuel */}
        <button
          onClick={() => signIn("keycloak", { callbackUrl: "/" })}
          className="w-full flex items-center justify-center gap-2 bg-[#e91e8c] hover:bg-[#c2185b] text-white font-bold py-4 rounded-2xl transition-all duration-300 hover:shadow-lg hover:shadow-[#e91e8c]/25 hover:-translate-y-0.5 mb-4 cursor-pointer"
        >
          Se connecter avec Keycloak
        </button>

        <p className="text-gray-500 text-xs">
          Pas encore de compte ?{" "}
          <Link href="/register" className="text-[#e91e8c] hover:underline font-semibold">
            S'inscrire
          </Link>
        </p>

        {/* Back link */}
        <Link href="/" className="block mt-6 text-gray-400 hover:text-gray-600 text-xs transition-colors">
          ← Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
