"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const nextAuthUser = session?.user as any;
  const nextAuthLoading = status === "loading";

  const [localUser, setLocalUser] = useState<any>(null);
  const [localLoading, setLocalLoading] = useState(true);

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("FR");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  // Charger l'utilisateur depuis localStorage (pour le login email/mot de passe)
  const loadLocalUser = () => {
    const stored = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (stored && token) {
      try {
        setLocalUser(JSON.parse(stored));
      } catch {
        setLocalUser(null);
      }
    } else {
      setLocalUser(null);
    }
    setLocalLoading(false);
  };

  useEffect(() => {
    loadLocalUser();

    const handleAuthChange = () => loadLocalUser();
    window.addEventListener("auth-change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

// L'utilisateur final = localStorage OU NextAuth (priorité au localStorage)
  const user = localUser || nextAuthUser || null;
  const loading = localLoading || nextAuthLoading;

  // Détection du rôle admin :
  // - NextAuth (Keycloak) → session.user.role exposé par le callback JWT
  // - Appartenance à l'email admin (fallback)
  const isAdmin =
    (user as any)?.role === "admin" ||
    localUser?.role === "admin" ||
    (user as any)?.email === "admin@gmail.com";

  const handleLogout = () => {
    // Nettoyage défensif du localStorage (ancien login email/mot de passe)
    const token = localStorage.getItem("token");
    if (token) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setLocalUser(null);
      window.dispatchEvent(new Event("auth-change"));
    }

    // Déconnexion Keycloak SSO (seul mode d'authentification)
    // 1. Nettoie le cookie de session NextAuth (sans redirection automatique)
    // 2. Redirige vers l'endpoint end-session de Keycloak (post_logout_redirect_uri → /login)
    // 3. Keycloak termine la session SSO puis nous redirige vers /login
    const sessionIdToken = nextAuthUser?.idToken || session?.idToken || null;
    const keycloakIssuer =
      process.env.KEYCLOAK_ISSUER || "http://localhost:8080/realms/tunisie-booking";
    const clientId =
      process.env.KEYCLOAK_CLIENT_ID || "nextjs-frontend";
    const postLogoutRedirectUri =
      (process.env.NEXTAUTH_URL || "http://localhost:3000") + "/login";

    const logoutUrl = new URL(`${keycloakIssuer}/protocol/openid-connect/logout`);
    logoutUrl.searchParams.set("post_logout_redirect_uri", postLogoutRedirectUri);
    logoutUrl.searchParams.set("client_id", clientId);
    if (sessionIdToken) {
      logoutUrl.searchParams.set("id_token_hint", sessionIdToken);
    }

    signOut({ redirect: false }).then(() => {
      // Après nettoyage de la session locale NextAuth, on redirige vers Keycloak pour tuer la session SSO
      window.location.href = logoutUrl.toString();
    });
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
      }
      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(event.target as Node)
      ) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const languages = [
    { code: "FR", label: "Français", flag: "🇫🇷" },
    { code: "EN", label: "English", flag: "🇬🇧" },
    { code: "AR", label: "العربية", flag: "🇹🇳" },
  ];

  const getInitials = (u: any) => {
    if (!u) return "?";
    // NextAuth Keycloak → user.name (format "Prénom Nom")
    if (u.name && !u.nom && !u.prenom) {
      const parts = u.name.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      return parts[0][0]?.toUpperCase() || "?";
    }
    // Local auth → user.nom / user.prenom
    return `${u?.prenom?.charAt(0) ?? ""}${u?.nom?.charAt(0) ?? ""}`.toUpperCase() || "?";
  };

  const getDisplayName = (u: any) => {
    if (!u) return "";
    if (u.name && !u.prenom) return u.name.split(" ")[0];
    return u.prenom || u.name || u.email?.split("@")[0] || "";
  };

  const getFullName = (u: any) => {
    if (!u) return "";
    if (u.name && !u.nom) return u.name;
    return `${u.prenom ?? ""} ${u.nom ?? ""}`.trim();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between h-[72px] px-6 md:px-12 bg-white/97 backdrop-blur-md shadow-sm border-b border-gray-100">
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/" className="no-underline flex items-center gap-2">
          <img
            src="/logo.png"
            alt="Tunisie Booking"
            className="h-12 w-auto object-contain transition-transform hover:scale-105"
          />
        </Link>
      </div>

      {/* Nav Links */}
      <ul className="hidden md:flex items-center gap-1 list-none font-medium text-[0.95rem]">
        <li>
          <Link
            href="/"
            className={`px-[18px] py-2 rounded-lg transition-all duration-300 ${
              pathname === "/"
                ? "text-[#ec008c] bg-[#ec008c]/10 font-semibold"
                : "text-gray-600 hover:text-[#85b919] hover:bg-[#85b919]/10"
            }`}
          >
            Accueil
          </Link>
        </li>
        <li>
          <Link
            href="/destinations"
            className={`px-[18px] py-2 rounded-lg transition-all duration-300 ${
              pathname.startsWith("/destinations")
                ? "text-[#ec008c] bg-[#ec008c]/10 font-semibold"
                : "text-gray-600 hover:text-[#85b919] hover:bg-[#85b919]/10"
            }`}
          >
            Destinations en Tunisie
          </Link>
        </li>
        <li>
          <Link
            href="/voyages"
            className={`px-[18px] py-2 rounded-lg transition-all duration-300 ${
              pathname.startsWith("/voyages")
                ? "text-[#ec008c] bg-[#ec008c]/10 font-semibold"
                : "text-gray-600 hover:text-[#85b919] hover:bg-[#85b919]/10"
            }`}
          >
            Voyages à l'étranger
          </Link>
        </li>
      </ul>

      {/* Nav Actions */}
      <div className="flex items-center gap-4">
        <span className="hidden sm:inline font-semibold text-gray-700 text-sm">
          📞 71 124 124
        </span>

        {/* Language Selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setLangDropdownOpen(!langDropdownOpen)}
            className="flex items-center gap-1 bg-transparent border border-gray-200 px-[14px] py-[7px] rounded-lg cursor-pointer text-xs font-medium text-gray-600 transition-all duration-300 hover:border-[#85b919] hover:text-[#85b919]"
          >
            🌐 {selectedLang} ▾
          </button>
          {langDropdownOpen && (
            <div className="absolute right-0 top-[42px] bg-white rounded-xl shadow-xl border border-gray-100 min-w-[160px] overflow-hidden z-[200]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left block px-4 py-[10px] text-sm transition-colors duration-200 hover:bg-gray-50 ${
                    selectedLang === lang.code
                      ? "text-[#ec008c] font-semibold bg-[#ec008c]/5"
                      : "text-gray-700"
                  }`}
                >
                  <span className="mr-2">{lang.flag}</span>
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {!loading && user ? (
          <div className="flex items-center gap-3">
{isAdmin && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-[#85b919] hover:bg-[#85b919]/10 px-4 py-2 rounded-lg transition-all"
              >
                Admin
              </Link>
            )}

            {/* Profile dropdown */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-[6px] rounded-full border border-gray-200 hover:border-[#e91e8c] transition-all duration-300"
              >
                <span className="w-8 h-8 rounded-full bg-[#e91e8c] text-white text-xs font-bold flex items-center justify-center shadow-sm">
                  {getInitials(user)}
                </span>
                <span className="hidden sm:inline text-sm font-semibold text-gray-700">
                  {getDisplayName(user)}
                </span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-[52px] bg-white rounded-xl shadow-xl border border-gray-100 min-w-[200px] overflow-hidden z-[200]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-[#1a1a2e] truncate">
                      {getFullName(user)}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>

                  <Link
                    href="/profil"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-[10px] text-sm text-gray-700 hover:bg-gray-50 hover:text-[#e91e8c] transition-colors"
                  >
                    👤 Profil
                  </Link>
                  <Link
                    href="/reservations"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-[10px] text-sm text-gray-700 hover:bg-gray-50 hover:text-[#e91e8c] transition-colors"
                  >
                    📋 Mes réservations
                  </Link>
                  <Link
                    href="/favoris"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-[10px] text-sm text-gray-700 hover:bg-gray-50 hover:text-[#e91e8c] transition-colors"
                  >
                    ❤️ Mes favoris
                  </Link>

                  <div className="border-t border-gray-100" />

                  <button
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-[10px] text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                  >
                    🚪 Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          !loading && (
            <>
              <Link
                href="/login"
                className="text-sm font-semibold text-[#1a1a2e] hover:text-[#e91e8c] hover:bg-[#e91e8c]/10 px-4 py-2 rounded-lg transition-all"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-[#e91e8c] hover:bg-[#c2185b] hover:shadow-lg hover:shadow-[#e91e8c]/25 text-white px-5 py-[10px] rounded-xl font-bold text-sm tracking-wide transition-all transform hover:-translate-y-[2px]"
              >
                S'inscrire
              </Link>
            </>
          )
        )}
      </div>
    </nav>
  );
}