"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "admin" | "client";
  reservations_count?: number;
  created_at?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const SUPER_ADMIN_EMAIL = "admin@gmail.com";

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState<any>(null);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      if (res.status === 401) { router.push("/login"); return; }
      if (res.status === 403) { router.push("/admin"); return; }
      if (!res.ok) throw new Error("Erreur lors du chargement");
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || []);
      setUsers(list);
      setFilteredUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    if (typeof window !== "undefined") {
      const s = localStorage.getItem("user");
      if (s) try { setCurrentUser(JSON.parse(s)); } catch {}
    }
  }, []);

  useEffect(() => {
    let r = users;
    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase();
      r = r.filter(u =>
        u.nom.toLowerCase().includes(t) || u.prenom.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) || u.telephone.includes(t)
      );
    }
    if (roleFilter !== "all") r = r.filter(u => u.role === roleFilter);
    setFilteredUsers(r);
  }, [searchTerm, roleFilter, users]);

  const handleToggleRole = async (user: User) => {
    const newRole = user.role === "admin" ? "client" : "admin";
    const action = newRole === "admin" ? "promouvoir en Administrateur" : "rétrograder en Client";
    if (!confirm(`Voulez-vous ${action} : ${user.prenom} ${user.nom} ?`)) return;
    setTogglingId(user.id);
    try {
      const res = await fetch(`${API_URL}/users/${user.id}/role`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${getToken()}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Erreur."); return; }
      const d = await res.json();
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...d.user } : u));
    } catch { alert("Erreur de connexion."); } finally { setTogglingId(null); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer cet utilisateur ? Action irréversible.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}`, Accept: "application/json" },
      });
      if (!res.ok) { const d = await res.json(); alert(d.message || "Échec."); return; }
      setUsers(prev => prev.filter(u => u.id !== id));
    } catch { alert("Erreur de connexion."); } finally { setDeletingId(null); }
  };

  const getInitials = (u: User) => `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();

  const avatarColors = [
    "from-[#a78bfa] to-[#8b5cf6]", // purple
    "from-[#38bdf8] to-[#0284c7]", // sky
    "from-[#34d399] to-[#059669]", // emerald
    "from-[#f472b6] to-[#db2777]", // pink
    "from-[#fbbf24] to-[#d97706]", // amber
    "from-[#6366f1] to-[#4f46e5]", // indigo
  ];

  const getAvatarGradient = (id: number) => avatarColors[id % avatarColors.length];

  return (
    <div className="space-y-7 p-1">
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-[#1a1a2e] tracking-tight">
            Utilisateurs <span className="text-[#e91e8c]">({filteredUsers.length})</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez et promouvez les utilisateurs de la plateforme.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-5 py-3 rounded-xl font-medium">
          ⚠️ {error}
        </div>
      )}

      {/* ── CONTROLS (SEARCH & FILTERS) ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          {["all", "admin", "client"].map(r => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`flex-1 md:flex-none px-5 py-3 rounded-xl text-sm font-bold transition-all border ${
                roleFilter === r
                  ? "bg-[#1a1a2e] text-white border-[#1a1a2e]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
              }`}
            >
              {r === "all" ? "Tous" : r === "admin" ? "Admins" : "Clients"}
            </button>
          ))}
        </div>
      </div>

      {/* ── GRID OF VERTICAL CARDS ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <div className="w-12 h-12 border-4 border-[#e91e8c]/15 border-t-[#e91e8c] rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Chargement...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm p-20 text-center border border-gray-100">
          <p className="text-5xl mb-4">🔍</p>
          <h3 className="text-lg font-bold text-[#1a1a2e] mb-1">Aucun utilisateur</h3>
          <p className="text-gray-400 text-sm">Ajustez vos critères de recherche.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredUsers.map(user => {
            const isSuperAdmin = user.email === SUPER_ADMIN_EMAIL;
            const isSelf = currentUser && currentUser.id === user.id;

            return (
              <div
                key={user.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {/* ── TOP: header band + centered avatar ── */}
                <div className="relative bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] pt-6 pb-10 flex flex-col items-center">
                  {/* role badge, top-right */}
                  <div className="absolute top-3 right-3">
                    {isSuperAdmin ? (
                      <span className="bg-amber-400 text-amber-950 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        Super Admin
                      </span>
                    ) : user.role === "admin" ? (
                      <span className="bg-emerald-400 text-emerald-950 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        Admin
                      </span>
                    ) : (
                      <span className="bg-sky-300 text-sky-950 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
                        Client
                      </span>
                    )}
                  </div>

                  {/* id, top-left */}
                  <div className="absolute top-3 left-3 text-[10px] font-bold text-white/40">
                    #{user.id}
                  </div>

                  <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${getAvatarGradient(user.id)} text-white font-bold text-lg flex items-center justify-center shadow-lg ring-4 ring-white/10`}>
                    {getInitials(user)}
                  </div>
                </div>

                {/* ── MIDDLE: info lines, overlapping the band slightly ── */}
                <div className="flex-1 flex flex-col px-4 pt-3 pb-4 -mt-4">
                  <div className="bg-white rounded-xl">
                    <h3 className="text-base font-bold text-[#1a1a2e] text-center flex items-center justify-center gap-1 truncate">
                      {user.prenom} {user.nom}
                      <span className="text-emerald-500 text-sm" title="Vérifié">✓</span>
                    </h3>
                    <p className="text-xs text-gray-400 text-center truncate mt-0.5">
                      {user.email}
                    </p>
                    {isSelf && !isSuperAdmin && (
                      <div className="flex justify-center mt-1.5">
                        <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-md">
                          C'est vous
                        </span>
                      </div>
                    )}
                  </div>

                  {/* divider */}
                  <div className="border-t border-gray-100 my-3" />

                  {/* info lines */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Téléphone</span>
                      <span className="text-gray-700 font-medium">{user.telephone || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Réservations</span>
                      <span className="text-gray-700 font-medium">{user.reservations_count ?? 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Inscrit le</span>
                      <span className="text-gray-700 font-medium">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  {/* ── BOTTOM: actions ── */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center gap-2">
                    {isSuperAdmin ? (
                      <span className="text-[11px] text-amber-600 font-semibold text-center w-full">
                        🔒 Compte protégé
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleToggleRole(user)}
                          disabled={togglingId === user.id}
                          className="flex-1 bg-[#e91e8c] hover:bg-[#d11a7d] text-white py-2 rounded-lg text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-50 shadow-sm"
                        >
                          {togglingId === user.id
                            ? "..."
                            : user.role === "admin"
                            ? "Rétrograder"
                            : "Promouvoir"}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={deletingId === user.id}
                          className="text-white bg-red-500 hover:bg-red-600 rounded-lg px-3 py-2 text-xs font-bold transition-colors disabled:opacity-50 shadow-sm"
                          title="Supprimer"
                        >
                          {deletingId === user.id ? "..." : "🗑️"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}