"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const [selectedLang, setSelectedLang] = useState("FR");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setLangDropdownOpen(false);
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

        {/* Remplacer les anciens liens statiques par ceci */}
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
      </div>
    </nav>
  );
}
