"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

const menuItems = [
  { href: "/admin",              icon: "📊", label: "Dashboard"     },
  { href: "/admin/hotels",       icon: "🏨", label: "Hôtels"        },
  { href: "/admin/destinations", icon: "📍", label: "Destinations"  },
  { href: "/admin/voyages",      icon: "✈️",  label: "Voyages"       },
  { href: "/admin/reservations", icon: "📋", label: "Réservations"  },
  { href: "/admin/users",        icon: "👥", label: "Utilisateurs"  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<{ nom: string; prenom: string } | null>(null);

  useEffect(() => {
    const token     = localStorage.getItem("token");
    const userData  = localStorage.getItem("user");

    if (!token) {
      router.push("/login");
      return;
    }

    if (userData) setUser(JSON.parse(userData));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* SIDEBAR */}
      <aside className="w-64 bg-[#1a1a2e] text-white flex flex-col fixed h-full z-10">

        {/* Logo */}
        <div className="px-6 py-5 border-b border-white/10">
          <span className="text-xl font-extrabold">
            Tunisie<span className="text-[#e91e8c]">Booking</span>
          </span>
          <p className="text-xs text-gray-400 mt-1">Administration</p>
        </div>

        {/* Menu */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-[#e91e8c] text-white"
                    : "text-gray-400 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-4 py-4 border-t border-white/10">
          {user && (
            <p className="text-sm text-gray-400 mb-3 px-2">
              👤 {user.prenom} {user.nom}
            </p>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-all"
          >
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="ml-64 flex-1 p-8">
        {children}
      </main>

    </div>
  );
}