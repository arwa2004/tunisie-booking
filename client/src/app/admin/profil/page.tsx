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
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export default function AdminProfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", email: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoErrors, setInfoErrors] = useState<Record<string, string[]>>({});
  const [infoSuccess, setInfoSuccess] = useState(false);

  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<Record<string, string[]>>({});
  const [pwdSuccess, setPwdSuccess] = useState(false);

  const getToken = () =>
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    const fetchMe = async () => {
      const token = getToken();
      if (!token) {
        router.push("/login");
        return;
      }
      try {
        const res = await fetch(`${API_URL}/me`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        const data: User = await res.json();
        setUser(data);
        setForm({
          nom: data.nom,
          prenom: data.prenom,
          telephone: data.telephone,
          email: data.email,
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [router]);

  const handleInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoErrors({});
    setInfoSuccess(false);
    try {
      const res = await fetch(`${API_URL}/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setInfoErrors(data.errors || {});
        return;
      }
      setUser(data.user);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("auth-change"));
      setInfoSuccess(true);
      setTimeout(() => setInfoSuccess(false), 3000);
    } catch {
      setInfoErrors({ general: ["Erreur de connexion."] });
    } finally {
      setSavingInfo(false);
    }
  };

  const handlePwdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPwd(true);
    setPwdErrors({});
    setPwdSuccess(false);
    try {
      const res = await fetch(`${API_URL}/me/password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(pwdForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setPwdErrors(data.errors || {});
        return;
      }
      setPwdForm({ current_password: "", new_password: "", new_password_confirmation: "" });
      setPwdSuccess(true);
      setTimeout(() => setPwdSuccess(false), 3000);
    } catch {
      setPwdErrors({ general: ["Erreur de connexion."] });
    } finally {
      setSavingPwd(false);
    }
  };

  const getInitials = (u: User) =>
    `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-[#e91e8c]/15 border-t-[#e91e8c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#e91e8c] to-[#c2185b] text-white font-bold text-xl flex items-center justify-center shadow-md">
          {getInitials(user)}
        </div>
        <div>
          <h1 className="text-2xl font-black text-[#1a1a2e]">
            {user.prenom} {user.nom}
          </h1>
          <p className="text-gray-400 text-sm">{user.email}</p>
          {user.role === "admin" && (
            <span className="inline-block mt-1 bg-emerald-50 text-emerald-700 border border-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
              Administrateur
            </span>
          )}
        </div>
      </div>

      {/* Infos personnelles */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">
          Informations personnelles
        </h2>

        {infoSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            ✓ Profil mis à jour avec succès
          </div>
        )}
        {infoErrors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
            {infoErrors.general[0]}
          </div>
        )}

        <form onSubmit={handleInfoSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Prénom
              </label>
              <input
                type="text"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
              />
              {infoErrors.prenom && (
                <p className="text-red-500 text-xs mt-1">{infoErrors.prenom[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Nom
              </label>
              <input
                type="text"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
              />
              {infoErrors.nom && (
                <p className="text-red-500 text-xs mt-1">{infoErrors.nom[0]}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
            />
            {infoErrors.email && (
              <p className="text-red-500 text-xs mt-1">{infoErrors.email[0]}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Téléphone
            </label>
            <input
              type="text"
              value={form.telephone}
              onChange={(e) => setForm({ ...form, telephone: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
            />
            {infoErrors.telephone && (
              <p className="text-red-500 text-xs mt-1">{infoErrors.telephone[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={savingInfo}
            className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all hover:shadow-lg hover:shadow-[#e91e8c]/30 disabled:opacity-50"
          >
            {savingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </form>
      </div>

      {/* Mot de passe */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-bold text-[#1a1a2e] mb-4">
          Changer le mot de passe
        </h2>

        {pwdSuccess && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-2.5 rounded-xl mb-4">
            ✓ Mot de passe modifié avec succès
          </div>
        )}
        {pwdErrors.general && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-2.5 rounded-xl mb-4">
            {pwdErrors.general[0]}
          </div>
        )}

        <form onSubmit={handlePwdSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Mot de passe actuel
            </label>
            <input
              type="password"
              value={pwdForm.current_password}
              onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
            />
            {pwdErrors.current_password && (
              <p className="text-red-500 text-xs mt-1">{pwdErrors.current_password[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Nouveau mot de passe
              </label>
              <input
                type="password"
                value={pwdForm.new_password}
                onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
              />
              {pwdErrors.new_password && (
                <p className="text-red-500 text-xs mt-1">{pwdErrors.new_password[0]}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">
                Confirmer le mot de passe
              </label>
              <input
                type="password"
                value={pwdForm.new_password_confirmation}
                onChange={(e) =>
                  setPwdForm({ ...pwdForm, new_password_confirmation: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPwd}
            className="bg-[#1a1a2e] hover:bg-black text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all disabled:opacity-50"
          >
            {savingPwd ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}