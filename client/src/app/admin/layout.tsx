"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import AdminNavbar from "./AdminNavbar";

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
  const { data: session, status } = useSession();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const verifyAccess = async () => {
      // ── Authentification via NextAuth / Keycloak SSO ─────────────────────
      if (status === "loading") return; // attendre la fin du chargement

      if (status !== "authenticated" || !session?.user) {
        router.replace("/login");
        return;
      }

      const sessionUser = session.user as any;
      const email = sessionUser.email || "";

      // Rôle : soit exposé par le callback NextAuth (session.user.role),
      // soit inféré par l'email admin (fallback).
      const role = sessionUser.role || (email === "admin@gmail.com" ? "admin" : "client");

      if (role !== "admin") {
        router.replace("/");
        return;
      }

      // Construit un objet utilisateur compatible avec l'AdminNavbar
      const fullName: string = sessionUser.name || email.split("@")[0] || "";
      const parts = fullName.trim().split(" ");
      const prenom = parts.slice(0, -1).join(" ") || fullName;
      const nom = parts.length > 1 ? parts[parts.length - 1] : "";

      setUser({
        id: sessionUser.id ? Number(sessionUser.id) : 0,
        nom,
        prenom,
        email,
        role: "admin",
      });
      setChecking(false);
    };

    verifyAccess();
  }, [status, session, router]);

  const handleLogout = () => {
    // Déconnexion SSO Keycloak (comme dans la Navbar) puis retour au login
    const keycloakIssuer =
      process.env.KEYCLOAK_ISSUER || "http://localhost:8080/realms/tunisie-booking";
    const clientId = process.env.KEYCLOAK_CLIENT_ID || "nextjs-frontend";
    const postLogoutRedirectUri =
      (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/login";

    const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    logoutUrl.searchParams.set("client_id", clientId);

    signOut({ redirect: false }).then(() => {
      window.location.href = logoutUrl.toString();
    });
  };

  if (checking || status === "loading") {
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
