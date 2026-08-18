"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface AuthUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: "admin" | "client";
}

interface AdminNavbarProps {
  user: AuthUser;
  onLogout: () => void;
  pageTitle?: string;
}

// Exemple de structure de notifications — à remplacer plus tard par un vrai
// endpoint (ex: GET /api/admin/notifications) quand tu voudras les rendre dynamiques.
const sampleNotifications = [
  { id: 1, text: "Nouvelle réservation de Sana Bouazizi", time: "Il y a 12 min" },
  { id: 2, text: "Réservation #24 annulée par le client", time: "Il y a 1h" },
  { id: 3, text: "Nouvel utilisateur inscrit", time: "Il y a 3h" },
];

export default function AdminNavbar({ user, onLogout, pageTitle }: AdminNavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (u: AuthUser) =>
    `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();

  return (
    <header
      style={{
        height: "68px",
        background: "#fff",
        borderBottom: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 1.8rem",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1a1a2e", margin: 0 }}>
        {pageTitle || ""}
      </h2>

      <div style={{ display: "flex", alignItems: "center", gap: "1.2rem" }}>
        {/* Notifications */}
        <div style={{ position: "relative" }} ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            style={{
              position: "relative",
              background: "#f5f6fa",
              border: "none",
              borderRadius: "10px",
              width: "40px",
              height: "40px",
              cursor: "pointer",
              fontSize: "1.1rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            title="Notifications"
          >
            🔔
            {sampleNotifications.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#e91e8c",
                }}
              />
            )}
          </button>

          {notifOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "50px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "1px solid #eee",
                width: "300px",
                overflow: "hidden",
                zIndex: 200,
              }}
            >
              <div
                style={{
                  padding: "0.8rem 1rem",
                  borderBottom: "1px solid #f0f0f0",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  color: "#1a1a2e",
                }}
              >
                Notifications
              </div>
              {sampleNotifications.length === 0 ? (
                <div style={{ padding: "1.2rem", textAlign: "center", color: "#999", fontSize: "0.85rem" }}>
                  Aucune notification
                </div>
              ) : (
                sampleNotifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "0.8rem 1rem",
                      borderBottom: "1px solid #f5f5f5",
                      fontSize: "0.8rem",
                      color: "#333",
                    }}
                  >
                    <div>{n.text}</div>
                    <div style={{ color: "#aaa", fontSize: "0.72rem", marginTop: "2px" }}>
                      {n.time}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Profil */}
        <div style={{ position: "relative" }} ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.6rem",
              background: "transparent",
              border: "1px solid #eee",
              borderRadius: "999px",
              padding: "0.3rem 0.9rem 0.3rem 0.3rem",
              cursor: "pointer",
            }}
          >
            <span
              style={{
                width: "34px",
                height: "34px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #e91e8c, #c2185b)",
                color: "#fff",
                fontWeight: 700,
                fontSize: "0.8rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {getInitials(user)}
            </span>
            <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#1a1a2e" }}>
              {user.prenom}
            </span>
            <span style={{ fontSize: "0.7rem", color: "#999" }}>▾</span>
          </button>

          {profileOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "50px",
                background: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                border: "1px solid #eee",
                width: "220px",
                overflow: "hidden",
                zIndex: 200,
              }}
            >
              <div style={{ padding: "0.9rem 1rem", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1a1a2e" }}>
                  {user.prenom} {user.nom}
                </div>
                <div style={{ fontSize: "0.75rem", color: "#999" }}>{user.email}</div>
              </div>

              <Link
                href="/admin/profil"
                onClick={() => setProfileOpen(false)}
                style={{
                  display: "block",
                  padding: "0.7rem 1rem",
                  fontSize: "0.85rem",
                  color: "#333",
                  textDecoration: "none",
                }}
              >
                👤 Profil
              </Link>

              <div style={{ borderTop: "1px solid #f0f0f0" }} />

              <button
                onClick={() => {
                  setProfileOpen(false);
                  onLogout();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.7rem 1rem",
                  fontSize: "0.85rem",
                  color: "#e53935",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                🚪 Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}