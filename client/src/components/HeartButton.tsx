"use client";

import { useState, useEffect, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

interface HeartButtonProps {
  hotelId: number;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function HeartButton({ hotelId, className = "", size = "md" }: HeartButtonProps) {
  const [isFavori, setIsFavori]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [checked, setChecked]     = useState(false); // true after initial fetch
  const [bouncing, setBouncing]   = useState(false);

  // Sizes
  const sizeMap = { sm: "w-7 h-7 text-base", md: "w-9 h-9 text-xl", lg: "w-11 h-11 text-2xl" };

  // Load initial state from /api/favoris/ids
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { setChecked(true); return; }

    fetch(`${API}/favoris/ids`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((ids: number[]) => {
        setIsFavori(ids.includes(hotelId));
        setChecked(true);
      })
      .catch(() => setChecked(true));
  }, [hotelId]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault(); // prevent Link navigation
      e.stopPropagation();

      const token = localStorage.getItem("token");
      if (!token) {
        // Redirect to login if not authenticated
        window.location.href = "/login";
        return;
      }

      setLoading(true);
      setBouncing(true);
      setTimeout(() => setBouncing(false), 400);

      try {
        const res = await fetch(`${API}/favoris/${hotelId}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setIsFavori(data.favori);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [hotelId]
  );

  if (!checked) return null;

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
      title={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`
        flex items-center justify-center rounded-full backdrop-blur-sm transition-all duration-200
        ${isFavori
          ? "bg-pink-100/90 text-[#e91e8c] shadow-md shadow-pink-200"
          : "bg-white/80 text-gray-400 hover:text-[#e91e8c] shadow-sm"
        }
        ${sizeMap[size]}
        ${bouncing ? "scale-125" : "scale-100"}
        ${loading ? "opacity-60 cursor-not-allowed" : "hover:scale-110 active:scale-95"}
        ${className}
      `}
      aria-label={isFavori ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      {isFavori ? (
        // Filled heart
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-1/2 h-1/2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ) : (
        // Outlined heart
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-1/2 h-1/2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      )}
    </button>
  );
}
