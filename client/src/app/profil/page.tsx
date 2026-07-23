"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  role: "admin" | "client";
  photo: string | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";
const BASE_URL = "http://localhost:8000";

export default function ProfilPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulaire infos
  const [form, setForm] = useState({ nom: "", prenom: "", telephone: "", email: "" });
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoErrors, setInfoErrors] = useState<Record<string, string[]>>({});
  const [infoSuccess, setInfoSuccess] = useState(false);

  // Formulaire mot de passe
  const [pwdForm, setPwdForm] = useState({
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState<Record<string, string[]>>({});
  const [pwdSuccess, setPwdSuccess] = useState(false);

  // Upload photo state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

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

  // Upload photo
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("photo", file);

    setUploadingPhoto(true);
    try {
      const res = await fetch(`${API_URL}/me/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        window.dispatchEvent(new Event("auth-change"));
      } else {
        alert(data.message || "Erreur lors de l'envoi de la photo.");
      }
    } catch {
      alert("Erreur de connexion.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const getInitials = (u: User) =>
    `${u.prenom.charAt(0)}${u.nom.charAt(0)}`.toUpperCase();

  const getAvatarUrl = (photo: string | null) => {
    if (!photo) return null;
    if (photo.startsWith("http")) return photo;
    return `${BASE_URL}${photo}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#e91e8c]/15 border-t-[#e91e8c] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto w-full px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
        {/* 1. CARTE PROFIL LATÉRALE */}
        <div className="bg-white border border-gray-100 rounded-3xl p-10 shadow-sm flex flex-col items-center text-center">
          <div className="relative group cursor-pointer mb-6" onClick={() => fileInputRef.current?.click()}>
            {getAvatarUrl(user.photo) ? (
              <img
                src={getAvatarUrl(user.photo)!}
                alt={user.prenom}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg group-hover:opacity-75 transition-all"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#e91e8c] to-[#c2185b] text-white font-extrabold text-3xl flex items-center justify-center shadow-lg group-hover:opacity-75 transition-all">
                {getInitials(user)}
              </div>
            )}

            <div className="absolute inset-0 bg-black/45 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-white text-xs font-bold">📷 Modifier</span>
            </div>

            {uploadingPhoto && (
              <div className="absolute inset-0 bg-white/80 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#e91e8c]/25 border-t-[#e91e8c] rounded-full animate-spin" />
              </div>
            )}
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            accept="image/*"
            className="hidden"
          />

          <h2 className="text-2xl font-bold text-[#1a1a2e] flex items-center gap-2 justify-center">
            {user.prenom} {user.nom}
            <span className="text-emerald-500 text-base" title="Vérifié">✓</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1 mb-6">{user.email}</p>

          <span className={`inline-block text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-8 ${
            user.role === "admin" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-purple-50 text-purple-700 border border-purple-100"
          }`}>
            {user.role === "admin" ? "🛡️ Administrateur" : "👤 Client"}
          </span>

          <div className="w-full border-t border-gray-100 pt-8 space-y-3">
            <Link
              href="/reservations"
              className="w-full justify-center inline-flex items-center gap-2 bg-[#1a1a2e] text-white font-bold text-sm py-3.5 rounded-2xl hover:bg-black transition-all active:scale-[0.98]"
            >
              📋 Voir mes réservations
            </Link>
            <Link
              href="/favoris"
              className="w-full justify-center inline-flex items-center gap-2 bg-[#e91e8c]/10 text-[#e91e8c] font-bold text-sm py-3.5 rounded-2xl hover:bg-[#e91e8c]/20 transition-all active:scale-[0.98]"
            >
              ❤️ Mes favoris
            </Link>
          </div>
        </div>

        {/* 2. FORMULAIRES */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-8 pb-4 border-b border-gray-100">
              Informations personnelles
            </h3>

            {infoSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-6">
                ✓ Votre profil a été mis à jour avec succès.
              </div>
            )}
            {infoErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
                {infoErrors.general[0]}
              </div>
            )}

            <form onSubmit={handleInfoSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Prénom</label>
                  <input
                    type="text"
                    value={form.prenom}
                    onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                  />
                  {infoErrors.prenom && (
                    <p className="text-red-500 text-xs mt-1.5">{infoErrors.prenom[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Nom</label>
                  <input
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                  />
                  {infoErrors.nom && (
                    <p className="text-red-500 text-xs mt-1.5">{infoErrors.nom[0]}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                />
                {infoErrors.email && (
                  <p className="text-red-500 text-xs mt-1.5">{infoErrors.email[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Téléphone</label>
                <input
                  type="text"
                  value={form.telephone}
                  onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                />
                {infoErrors.telephone && (
                  <p className="text-red-500 text-xs mt-1.5">{infoErrors.telephone[0]}</p>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingInfo}
                  className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-lg hover:shadow-[#e91e8c]/35 text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {savingInfo ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 md:p-10">
            <h3 className="text-xl font-bold text-[#1a1a2e] mb-8 pb-4 border-b border-gray-100">
              Sécurité du compte
            </h3>

            {pwdSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-xl mb-6">
                ✓ Votre mot de passe a été modifié avec succès.
              </div>
            )}
            {pwdErrors.general && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-6">
                {pwdErrors.general[0]}
              </div>
            )}

            <form onSubmit={handlePwdSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-2">Mot de passe actuel</label>
                <input
                  type="password"
                  value={pwdForm.current_password}
                  onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                />
                {pwdErrors.current_password && (
                  <p className="text-red-500 text-xs mt-1.5">{pwdErrors.current_password[0]}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={pwdForm.new_password}
                    onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                  />
                  {pwdErrors.new_password && (
                    <p className="text-red-500 text-xs mt-1.5">{pwdErrors.new_password[0]}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-2">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={pwdForm.new_password_confirmation}
                    onChange={(e) => setPwdForm({ ...pwdForm, new_password_confirmation: e.target.value })}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-[#e91e8c] focus:bg-white text-sm transition-all"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingPwd}
                  className="bg-[#1a1a2e] hover:bg-black text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {savingPwd ? "Mise à jour..." : "Modifier le mot de passe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}