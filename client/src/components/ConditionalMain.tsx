"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const isAdminRoute = pathname?.startsWith("/admin");

  useEffect(() => {
    // Sur les routes /admin, admin/layout.tsx gère déjà sa propre vérification.
    if (isAdminRoute) {
      setChecked(true);
      return;
    }

    // Sur toute autre route (site client), on bloque l'accès à un admin connecté.
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
      try {
        const user = JSON.parse(storedUser);
        if (user.role === "admin") {
          router.replace("/admin");
          return; // la redirection est en cours
        }
      } catch {
        // JSON invalide
      }
    } else if (storedUser && !token) {
      // Nettoyage en cas d'incohérence
      localStorage.removeItem("user");
    }

    setChecked(true);
  }, [pathname, isAdminRoute, router]);

  if (isAdminRoute) {
    return <>{children}</>;
  }

  // Tant qu'on n'a pas confirmé que ce n'est pas un admin, on n'affiche rien
  // pour éviter un flash du site client avant la redirection.
  if (!checked) {
    return null;
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 pt-[68px]">{children}</main>
    </>
  );
}