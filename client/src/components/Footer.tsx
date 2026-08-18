import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1a1a2e] text-white/70 py-10 text-sm mt-auto border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Tunisie Booking"
            className="h-10 w-auto object-contain bg-white/90 p-1.5 rounded-lg shadow-sm"
          />
          <p className="text-xs text-white/50">
            N°1 de la réservation d'hôtels & séjours en Tunisie
          </p>
        </div>

        <div className="flex items-center gap-6 text-xs font-medium text-white/60">
          <Link href="/" className="hover:text-[#85b919] transition-colors">Accueil</Link>
          <Link href="/destinations" className="hover:text-[#85b919] transition-colors">Destinations</Link>
          <Link href="/voyages" className="hover:text-[#85b919] transition-colors">Voyages</Link>
          <Link href="/reservations" className="hover:text-[#85b919] transition-colors">Mes Réservations</Link>
        </div>

        <p className="text-xs text-white/40 text-center md:text-right">
          &copy; 2026 <strong className="text-[#85b919]">Tunisie</strong><strong className="text-[#ec008c]">Booking</strong> — Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
