"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("FR");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isClient, setIsClient] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    window.location.href = "/";
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

  const getInitials = (u: any) =>
    `${u?.prenom?.charAt(0) ?? ""}${u?.nom?.charAt(0) ?? ""}`.toUpperCase();

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between h-[68px] px-6 md:px-12 bg-white/97 backdrop-blur-md shadow-sm border-b border-gray-100">
      {/* Logo */}
      <div className="text-2xl font-extrabold tracking-tight">
        <Link href="/" className="no-underline">
          <span className="text-[#1a1a2e]">Tunisie</span>
          <span className="text-[#e91e8c]">Booking</span>
        </Link>
      </div>

      {/* Nav Links */}
      <ul className="hidden md:flex items-center gap-1 list-none font-medium text-[0.95rem]">
        <li>
          <Link
            href="/"
            className={`px-[18px] py-2 rounded-lg transition-all duration-300 ${
              pathname === "/"
                ? "text-[#e91e8c] bg-[#e91e8c]/10 font-semibold"
                : "text-gray-600 hover:text-[#e91e8c] hover:bg-[#e91e8c]/7"
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
                ? "text-[#e91e8c] bg-[#e91e8c]/10 font-semibold"
                : "text-gray-600 hover:text-[#e91e8c] hover:bg-[#e91e8c]/7"
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
                ? "text-[#e91e8c] bg-[#e91e8c]/10 font-semibold"
                : "text-gray-600 hover:text-[#e91e8c] hover:bg-[#e91e8c]/7"
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
            className="flex items-center gap-1 bg-transparent border border-gray-200 px-[14px] py-[7px] rounded-lg cursor-pointer text-xs font-medium text-gray-600 transition-all duration-300 hover:border-[#e91e8c] hover:text-[#e91e8c]"
          >
            🌐 {selectedLang} ▾
          </button>
          {langDropdownOpen && (
            <div className="absolute right-0 top-[42px] bg-white rounded-xl shadow-xl border border-gray-100 min-width-[160px] overflow-hidden z-[200]">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setSelectedLang(lang.code);
                    setLangDropdownOpen(false);
                  }}
                  className={`w-full text-left block px-4 py-[10px] text-sm transition-colors duration-200 hover:bg-gray-50 ${
                    selectedLang === lang.code
                      ? "text-[#e91e8c] font-semibold bg-[#e91e8c]/5"
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

        {isClient && user ? (
          <div className="flex items-center gap-3">
            {user.role === "admin" && (
              <Link
                href="/admin"
                className="text-sm font-semibold text-[#e91e8c] hover:bg-[#e91e8c]/7 px-4 py-2 rounded-lg transition-all"
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
                <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e91e8c] to-[#c2185b] text-white text-xs font-bold flex items-center justify-center">
                  {getInitials(user)}
                </span>
                <span className="hidden sm:inline text-sm font-semibold text-gray-700">
                  {user.prenom}
                </span>
                <span className="text-gray-400 text-xs">▾</span>
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 top-[52px] bg-white rounded-xl shadow-xl border border-gray-100 min-w-[200px] overflow-hidden z-[200]">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-bold text-[#1a1a2e] truncate">
                      {user.prenom} {user.nom}
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
          <>
            <Link
              href="/login"
              className="text-sm font-semibold text-[#1a1a2e] hover:text-[#e91e8c] hover:bg-[#e91e8c]/7 px-4 py-2 rounded-lg transition-all"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-lg hover:shadow-[#e91e8c]/35 text-white px-5 py-[10px] rounded-xl font-bold text-sm tracking-wide transition-all transform hover:-translate-y-[2px]"
            >
              S'inscrire
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}