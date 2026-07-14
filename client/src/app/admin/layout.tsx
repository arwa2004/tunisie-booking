"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import AdminNavbar from "./AdminNavbar";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "admin" | "client";
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
        return;
      }

      try {
        // On revérifie toujours côté serveur (source de vérité),
        // le localStorage seul peut être trafiqué par l'utilisateur.
        const res = await fetch(`${API_URL}/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        });

        if (res.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          router.replace("/login");
          return;
        }

        if (!res.ok) throw new Error("Erreur de vérification");

        const currentUser: AuthUser = await res.json();
        localStorage.setItem("user", JSON.stringify(currentUser));
        window.dispatchEvent(new Event("auth-change"));

        if (currentUser.role !== "admin") {
          router.replace("/"); // renvoie un client normal vers le site public
          return;
        }

        setUser(currentUser);
      } catch (err) {
        router.replace("/login");
      } finally {
        setChecking(false);
      }
    };

    verifyAccess();
  }, [router]);

  const handleLogout = async () => {
    const token = localStorage.getItem("token");
    try {
      await fetch(`${API_URL}/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      // même si l'appel échoue, on nettoie le localStorage
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.replace("/login");
  };

  if (checking) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          color: "#1a1a2e",
        }}
      >
        Vérification des accès...
      </div>
    );
  }

  if (!user) return null; // redirection déjà en cours

  const isSuperAdmin = user.email === "admin@gmail.com";

  const menuItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/hotels", label: "Hôtels", icon: "🏨" },
    { href: "/admin/destinations", label: "Destinations", icon: "📍" },
    { href: "/admin/voyages", label: "Voyages", icon: "✈️" },
    { href: "/admin/reservations", label: "Réservations", icon: "📋" },
    ...(isSuperAdmin ? [{ href: "/admin/users", label: "Utilisateurs", icon: "👥" }] : []),
  ];

  // Titre de page dérivé de l'item de menu actif, pour l'afficher dans AdminNavbar
  const currentPageTitle =
    menuItems.find((item) => pathname === item.href)?.label || "Administration";

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: "230px",
          background: "#1a1a2e",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "1.5rem 0",
        }}
      >
        <div>
          <div style={{ padding: "0 1.2rem", marginBottom: "2rem" }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem" }}>
              TunisieBooking
            </div>
            <div style={{ fontSize: "0.75rem", opacity: 0.6 }}>
              Administration
            </div>
          </div>

          <nav>
            {menuItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.6rem",
                    padding: "0.7rem 1.2rem",
                    margin: "0.2rem 0.8rem",
                    borderRadius: "8px",
                    color: "#fff",
                    textDecoration: "none",
                    background: active ? "#e91e8c" : "transparent",
                    fontSize: "0.9rem",
                  }}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div style={{ padding: "0 1.2rem" }}>
          <div style={{ fontSize: "0.85rem", marginBottom: "0.8rem" }}>
            👤 {user.prenom} {user.nom}
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff",
              borderRadius: "6px",
              padding: "0.4rem 0.8rem",
              cursor: "pointer",
              fontSize: "0.8rem",
              width: "100%",
            }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <AdminNavbar user={user} onLogout={handleLogout} pageTitle={currentPageTitle} />
        <main style={{ flex: 1, background: "#f5f6fa", padding: "2.5rem" }}>
          {children}
        </main>
      </div>
    </div>
  );
}