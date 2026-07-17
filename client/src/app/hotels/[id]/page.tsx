"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = "http://127.0.0.1:8000";

interface Pension {
  id: number;
  nom: string;
  pivot: { supplement_prix: number };
}

interface Chambre {
  id: number;
  type: string;
  nom: string;
  prix_base_nuit: number;
  capacite_adultes: number;
  capacite_enfants: number;
  quantite: number;
  pensions: Pension[];
}

interface ServiceHotel {
  id: number;
  nom: string;
  icone: string;
}

interface Photo {
  id: number;
  url: string;
  alt_text: string | null;
  ordre: number;
}

interface Hotel {
  id: number;
  nom: string;
  prix_par_nuit: number;
  etoiles: number;
  description: string | null;
  image: string | null;
  disponible: boolean;
  destination: { id: number; nom: string } | null;
  chambres: Chambre[];
  services: ServiceHotel[];
  photos: Photo[];
}

interface Room {
  adults: number;
  childrenAges: number[];
}

export default function HotelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const getNextDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d;
  };

  const initArriveeStr = searchParams.get("arrivee");
  const initDepartStr = searchParams.get("depart");
  const initArrivee = initArriveeStr ? new Date(initArriveeStr) : new Date();
  const initDepart = initDepartStr ? new Date(initDepartStr) : getNextDate(2);
  const initAdultes = parseInt(searchParams.get("adultes") || "2", 10) || 2;
  const initEnfants = parseInt(searchParams.get("enfants") || "0", 10) || 0;
  const initChambres = parseInt(searchParams.get("chambres") || "1", 10) || 1;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carrousel photos
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Pension sélectionnée par chambre (chambre_id -> pension_id)
  const [selectedPensions, setSelectedPensions] = useState<Record<string, number>>({});

  const buildRoomsFromTotals = (totalRooms: number, totalAdults: number, totalEnfants: number): Room[] => {
    const list: Room[] = [];
    for (let i = 0; i < totalRooms; i++) {
      list.push({ adults: 1, childrenAges: [] });
    }
    let remainingAdults = totalAdults - totalRooms;
    let idx = 0;
    while (remainingAdults > 0 && list.length > 0) {
      list[idx].adults = Math.min(4, list[idx].adults + 1);
      remainingAdults--;
      idx = (idx + 1) % list.length;
    }
    let remainingEnfants = totalEnfants;
    idx = 0;
    while (remainingEnfants > 0 && list.length > 0) {
      if (list[idx].childrenAges.length < 3) {
        list[idx].childrenAges.push(8);
        remainingEnfants--;
      }
      idx = (idx + 1) % list.length;
    }
    return list.length > 0 ? list : [{ adults: 2, childrenAges: [] }];
  };

  // ── BARRE DE RECHERCHE ──────────────────────────────────────────
  const [searchArrivee, setSearchArrivee] = useState<Date | null>(initArrivee);
  const [searchDepart, setSearchDepart] = useState<Date | null>(initDepart);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(() =>
    buildRoomsFromTotals(initChambres, initAdultes, initEnfants)
  );

  const searchAdultes    = rooms.reduce((s, r) => s + r.adults, 0);
  const searchEnfants    = rooms.reduce((s, r) => s + r.childrenAges.length, 0);
  const searchChambres   = rooms.length;

  const [selectedChambres, setSelectedChambres] = useState<Record<number, string>>({});

  const voyRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (voyRef.current && !voyRef.current.contains(e.target as Node)) {
        setShowGuestPicker(false);
      }
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) {
        setShowDatePicker(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const addRoom = () => {
    if (rooms.length < 5) {
      setRooms([...rooms, { adults: 2, childrenAges: [] }]);
    }
  };

  const removeRoom = (i: number) => {
    if (rooms.length > 1) {
      setRooms(rooms.filter((_, idx) => idx !== i));
    }
  };

  const updateAdults = (idx: number, delta: number) => {
    setRooms(rooms.map((r, i) => i === idx ? { ...r, adults: Math.max(1, Math.min(4, r.adults + delta)) } : r));
  };

  const addChild = (idx: number) => {
    setRooms(rooms.map((r, i) => i === idx && r.childrenAges.length < 3 ? { ...r, childrenAges: [...r.childrenAges, 8] } : r));
  };

  const removeChild = (idx: number) => {
    setRooms(rooms.map((r, i) => i === idx && r.childrenAges.length > 0 ? { ...r, childrenAges: r.childrenAges.slice(0, -1) } : r));
  };

  const setChildAge = (roomIdx: number, childIdx: number, age: number) => {
    setRooms(rooms.map((r, i) => {
      if (i !== roomIdx) return r;
      const ages = [...r.childrenAges];
      ages[childIdx] = age;
      return { ...r, childrenAges: ages };
    }));
  };

  useEffect(() => {
    fetch(`${API}/hotels/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setHotel(data);
        setLoading(false);
      });
  }, [id]);

  const nbNuits = () => {
    if (!searchArrivee || !searchDepart) return 0;
    const diff = searchDepart.getTime() - searchArrivee.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const toYMD = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";
    if (image.startsWith("http")) return image;
    return `${BASE_URL}${image}`;
  };

  const getChambresForRoom = (room: Room): Chambre[] => {
    if (!hotel?.chambres) return [];
    return hotel.chambres.filter(
      c => c.capacite_adultes === room.adults && c.capacite_enfants >= room.childrenAges.length
    );
  };

  useEffect(() => {
    if (!hotel) return;
    setSelectedChambres(prev => {
      const next: Record<number, string> = {};
      rooms.forEach((room, idx) => {
        const options = getChambresForRoom(room);
        const previousChoice = prev[idx];
        if (previousChoice && options.some(c => String(c.id) === previousChoice)) {
          next[idx] = previousChoice;
        } else {
          next[idx] = options[0] ? String(options[0].id) : "";
        }
      });
      return next;
    });
  }, [hotel, rooms]);

  const calculateChambreTotal = (chambre: Chambre, room: Room) => {
    const pensionKey = `${chambre.id}`;
    const pensionId = selectedPensions[pensionKey] || (chambre.pensions && chambre.pensions[0]?.id);
    let supplementPension = 0;
    if (pensionId && chambre.pensions) {
      const pension = chambre.pensions.find(p => p.id === pensionId);
      if (pension) supplementPension = pension.pivot.supplement_prix;
    }

    let supplementEnfants = 0;
    room.childrenAges.forEach((age) => {
      if (age < 2) supplementEnfants += 0;
      else if (age < 12) supplementEnfants += 30;
      else supplementEnfants += 50;
    });

    const nights = Math.max(1, nbNuits());
    return (chambre.prix_base_nuit + supplementPension + supplementEnfants) * nights;
  };

  const grandTotal = useMemo(() => {
    if (!hotel) return 0;
    return rooms.reduce((sum, room, idx) => {
      const chambreId = selectedChambres[idx];
      const chambre = hotel.chambres.find(c => String(c.id) === chambreId);
      if (!chambre) return sum;
      return sum + calculateChambreTotal(chambre, room);
    }, 0);
  }, [hotel, rooms, selectedChambres, selectedPensions, searchArrivee, searchDepart]);

  const allRoomsHaveSelection = rooms.every((_, idx) => !!selectedChambres[idx]);

  const originalTotal = Math.round(grandTotal * 1.25);
  const discountTotal = originalTotal - grandTotal;
  const depositAmount = Math.round(grandTotal * 0.15);

  const handleReservationClick = async (paymentType: "agence" | "deposit") => {
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (!hotel || !allRoomsHaveSelection) {
      setError("Veuillez sélectionner un type de chambre pour chaque chambre demandée.");
      return;
    }

    setSubmitting(true);

    try {
      const requests = rooms.map((room, idx) => {
        const chambreId = selectedChambres[idx];
        const chambre = hotel.chambres.find(c => String(c.id) === chambreId);
        const pensionId = selectedPensions[chambreId] || (chambre?.pensions && chambre.pensions[0]?.id) || null;

        return fetch(`${API}/reservations`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            hotel_id: id,
            chambre_id: chambreId,
            pension_id: pensionId,
            date_arrivee: toYMD(searchArrivee),
            date_depart: toYMD(searchDepart),
            nb_chambres: 1,
            nb_adultes: room.adults,
            nb_enfants: room.childrenAges.length,
            ages_enfants: room.childrenAges,
            type_paiement: paymentType,
          }),
        });
      });

      const responses = await Promise.all(requests);

      if (responses.some(r => r.status === 401)) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-change"));
        router.push("/login");
        return;
      }

      const results = await Promise.all(responses.map(r => r.json().catch(() => ({}))));
      const hasFailure = responses.some(r => !r.ok);

      if (hasFailure) {
        const firstMessage = results.find((r: any) => r?.message)?.message
          || "Erreur lors de la réservation d'une ou plusieurs chambres.";
        setError(firstMessage);
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erreur de connexion au serveur.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Chargement...</div>
  );
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Hôtel introuvable.</div>
  );

  const renderStars = (count: number) => (
    <span className="text-yellow-400 text-sm tracking-wide">
      {"★".repeat(count)}{"☆".repeat(5 - count)}
    </span>
  );

  // Styles spécifiques pour le react-datepicker
  const datePickerCustomStyles = `
    .react-datepicker { border: none !important; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1) !important; border-radius: 12px !important; font-family: inherit !important; }
    .react-datepicker__header { background: white !important; border-bottom: none !important; padding-top: 15px !important; }
    .react-datepicker__current-month { font-weight: 700 !important; color: #1a1a2e !important; }
    .react-datepicker__day-name { color: #9ca3af !important; font-weight: 600 !important; }
    .react-datepicker__day--selected, .react-datepicker__day--in-selecting-range, .react-datepicker__day--in-range { background-color: #e91e8c !important; color: white !important; border-radius: 8px !important; }
    .react-datepicker__day--keyboard-selected { background-color: #fbcfe8 !important; color: #e91e8c !important; }
    .react-datepicker__day:hover { background-color: #fce7f3 !important; border-radius: 8px !important; }
  `;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style>{datePickerCustomStyles}</style>

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200 pt-5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a2e] flex items-center gap-3">
                {hotel.nom}
                <span className="text-yellow-400 text-lg">{"★".repeat(hotel.etoiles)}</span>
              </h1>
              {hotel.destination && (
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  📍 {hotel.destination.nom}
                </p>
              )}
            </div>
            
            {/* Bouton retour caché sur mobile pour faire place nette, ou juste un petit lien */}
            <Link
              href={hotel.destination ? `/destinations/${hotel.destination.id}` : "/destinations"}
              className="hidden md:inline-block text-sm text-[#e91e8c] hover:underline font-medium whitespace-nowrap"
            >
              ← Retour
            </Link>
          </div>

          {/* Onglets (Tabs) */}
          <div className="flex gap-6 mt-6 overflow-x-auto">
            <button className="pb-3 border-b-2 border-[#e91e8c] text-[#e91e8c] font-bold text-sm whitespace-nowrap">Photos</button>
            <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-semibold text-sm whitespace-nowrap">Présentation</button>
            <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-semibold text-sm whitespace-nowrap">Équipements</button>
            <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-semibold text-sm whitespace-nowrap">Avis</button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* ── GRILLE 2 COLONNES ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Colonne de gauche (Principale) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* ── CARROUSEL ── */}
            <div className="relative w-full h-[350px] md:h-[450px] rounded-2xl overflow-hidden shadow-sm">
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-green-600 z-10 flex items-center gap-2">
                <span>🧒</span> 1er enfant - 4 ans Gratuit
              </div>
              {hotel.photos && hotel.photos.length > 0 ? (
                <>
                  <img
                    src={hotel.photos[currentPhoto]?.url}
                    alt={hotel.photos[currentPhoto]?.alt_text || hotel.nom}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  {hotel.photos.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentPhoto(prev => prev === 0 ? hotel.photos.length - 1 : prev - 1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition"
                      >
                        ◀
                      </button>
                      <button
                        onClick={() => setCurrentPhoto(prev => prev === hotel.photos.length - 1 ? 0 : prev + 1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition"
                      >
                        ▶
                      </button>
                    </>
                  )}
                </>
              ) : (
                <img
                  src={getImageUrl(hotel.image)}
                  alt={hotel.nom}
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Services Rapides */}
            {hotel.services && hotel.services.length > 0 && (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-700 py-2">
                <span className="font-bold text-gray-900">Principaux Services :</span>
                {hotel.services.slice(0, 3).map((service) => (
                  <div key={service.id} className="flex items-center gap-1.5">
                    <span>{service.icone}</span>
                    <span>{service.nom}</span>
                  </div>
                ))}
                <span className="text-[#e91e8c] font-medium cursor-pointer hover:underline text-xs">Voir tous les services ›</span>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
               <h2 className="text-xl font-bold text-[#1a1a2e] mb-3">Présentation</h2>
               <p className="text-gray-600 leading-relaxed text-sm">
                 {hotel.description ?? "Aucune description disponible."}
               </p>
            </div>
          </div>

          {/* Colonne de droite (Sidebar Avis) */}
          <div className="lg:col-span-1 space-y-6">
             <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-[#1a1a2e] mb-4">Avis Voyageurs</h3>
                
                {/* Score global */}
                <div className="flex items-start gap-4 mb-6">
                   <div className="w-14 h-14 bg-[#14b8a6] rounded-xl flex items-center justify-center text-white text-xl font-extrabold shadow-sm">
                     7.9
                   </div>
                   <div>
                     <p className="text-lg font-bold text-[#1a1a2e]">Très bien</p>
                     <p className="text-xs text-gray-500">Avis clients TunisieBooking</p>
                   </div>
                </div>

                {/* Citation mockée */}
                <div className="bg-gray-50 p-4 rounded-xl text-sm italic text-gray-600 mb-6 relative">
                  <span className="text-2xl text-gray-300 absolute -top-1 left-2">"</span>
                  Accueil chaleureux, personnel très sympathique et très compétent, service excellent...
                  <a href="#" className="block text-[#e91e8c] text-xs font-semibold mt-2 not-italic hover:underline">Lire tous les avis ›</a>
                </div>

                {/* Progress bars mockées */}
                <div className="space-y-3 text-sm font-semibold text-gray-700">
                   <div>
                     <div className="flex justify-between mb-1"><span className="text-xs">Qualité/prix</span><span className="text-xs font-bold">7.1</span></div>
                     <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#14b8a6] h-1.5 rounded-full" style={{width: '71%'}}></div></div>
                   </div>
                   <div>
                     <div className="flex justify-between mb-1"><span className="text-xs">Chambres</span><span className="text-xs font-bold">7.5</span></div>
                     <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#14b8a6] h-1.5 rounded-full" style={{width: '75%'}}></div></div>
                   </div>
                   <div>
                     <div className="flex justify-between mb-1"><span className="text-xs">Emplacement</span><span className="text-xs font-bold">7.2</span></div>
                     <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#14b8a6] h-1.5 rounded-full" style={{width: '72%'}}></div></div>
                   </div>
                   <div>
                     <div className="flex justify-between mb-1"><span className="text-xs">Propreté</span><span className="text-xs font-bold">8.2</span></div>
                     <div className="w-full bg-gray-100 rounded-full h-1.5"><div className="bg-[#14b8a6] h-1.5 rounded-full" style={{width: '82%'}}></div></div>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-2 text-xs text-gray-600 font-medium">
                  <span className="text-green-500">👍</span> Recommandé par 79% de nos clients
                </div>
             </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            🛏️ CHAMBRES DISPONIBLES — NOUVEAU DESIGN
            ══════════════════════════════════════════════════════════════ */}
        <div id="chambres-section" className="mt-12 space-y-6">
          <h2 className="text-2xl font-bold text-[#1a1a2e]">Chambres disponibles</h2>

          {/* Barre de filtre compacte */}
          <div className="flex flex-col md:flex-row items-center gap-0 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden p-1 relative">
            
            {/* Dates */}
            <div 
              ref={dateRef}
              className="flex-1 flex w-full relative group cursor-pointer hover:bg-gray-50 rounded-l-lg transition"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <div className="flex-1 flex flex-col justify-center px-4 py-2 border-r border-gray-200 border-b md:border-b-0">
                <span className="text-[10px] uppercase font-bold text-gray-400">Arrivée</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  📅 {formatDate(searchArrivee) || "Sélectionnez"}
                </span>
              </div>
              <div className="flex-1 flex flex-col justify-center px-4 py-2 border-r border-gray-200">
                <span className="text-[10px] uppercase font-bold text-gray-400">Départ</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  📅 {formatDate(searchDepart) || "Sélectionnez"}
                </span>
              </div>

              {/* Popup Calendrier Double Mois */}
              {showDatePicker && (
                <div 
                  className="absolute top-[calc(100%+10px)] left-0 z-50 bg-white p-2 rounded-2xl shadow-2xl border border-gray-100"
                  onClick={e => e.stopPropagation()} // empêche de fermer au clic dedans
                >
                  <DatePicker
                    selected={searchArrivee}
                    onChange={(dates) => {
                      const [start, end] = dates;
                      setSearchArrivee(start);
                      setSearchDepart(end);
                    }}
                    startDate={searchArrivee}
                    endDate={searchDepart}
                    selectsRange
                    monthsShown={2}
                    inline
                    minDate={new Date()}
                  />
                  <div className="flex justify-end p-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowDatePicker(false); }}
                      className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-gray-200"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Voyageurs */}
            <div className="flex-1 w-full relative" ref={voyRef}>
              <div 
                className="flex flex-col justify-center px-4 py-2 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
              >
                <span className="text-[10px] uppercase font-bold text-gray-400">Voyageurs</span>
                <span className="text-sm font-semibold text-gray-900 flex items-center justify-between">
                  <span>🧑‍🤝‍🧑 {searchChambres} Chambre{searchChambres > 1 ? "s" : ""}, {searchAdultes} Ad., {searchEnfants} Enf.</span>
                  <span className="text-gray-400 text-xs ml-2">▼</span>
                </span>
              </div>

              {showGuestPicker && (
                <div className="absolute top-[calc(100%+10px)] left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 w-[320px] z-50 text-left">
                  <div className="max-h-[360px] overflow-y-auto p-4 space-y-4">
                    {rooms.map((room, rIdx) => (
                      <div key={rIdx} className="border-b border-gray-100 pb-4 last:border-none last:pb-0">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-sm text-[#1a1a2e]">Chambre {rIdx + 1}</span>
                          {rooms.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRoom(rIdx)}
                              className="text-[#e91e8c] hover:bg-[#e91e8c]/10 text-xs px-2 py-1 rounded transition-colors"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>

                        {/* Adults */}
                        <div className="flex justify-between items-center text-sm mb-3">
                          <span className="text-gray-700 font-medium">Adulte(s)</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => updateAdults(rIdx, -1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:text-[#e91e8c] hover:border-[#e91e8c]">−</button>
                            <span className="font-bold w-4 text-center">{room.adults}</span>
                            <button onClick={() => updateAdults(rIdx, 1)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:text-[#e91e8c] hover:border-[#e91e8c]">+</button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex justify-between items-center text-sm mb-2">
                          <span className="text-gray-700 font-medium">Enfant(s) <span className="block text-[10px] text-gray-400">0 à 11 ans</span></span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => removeChild(rIdx)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:text-[#e91e8c] hover:border-[#e91e8c]">−</button>
                            <span className="font-bold w-4 text-center">{room.childrenAges.length}</span>
                            <button onClick={() => addChild(rIdx)} className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:text-[#e91e8c] hover:border-[#e91e8c]">+</button>
                          </div>
                        </div>

                        {room.childrenAges.length > 0 && (
                          <div className="mt-2 space-y-2 p-2 bg-gray-50 rounded border border-gray-100">
                            {room.childrenAges.map((age, cIdx) => (
                              <div key={cIdx} className="flex justify-between items-center text-xs">
                                <span>Âge enfant {cIdx + 1}</span>
                                <select value={age} onChange={(e) => setChildAge(rIdx, cIdx, Number(e.target.value))} className="border p-1 rounded">
                                  {Array.from({length: 12}, (_, k) => <option key={k} value={k}>{k}</option>)}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {rooms.length < 5 && (
                    <button onClick={addRoom} className="w-full py-2 text-xs font-bold text-[#e91e8c] border-t border-gray-100 bg-gray-50">+ Ajouter chambre</button>
                  )}
                </div>
              )}
            </div>

            {/* Bouton Modifier (active le Datepicker) */}
            <div className="px-2 w-full md:w-auto mt-2 md:mt-0 pb-2 md:pb-0">
               <button 
                 onClick={() => setShowDatePicker(true)}
                 className="w-full md:w-auto bg-gray-50 hover:bg-gray-100 text-[#1a1a2e] border border-gray-200 font-semibold px-6 py-3 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
               >
                 ✏️ Modifier
               </button>
            </div>
          </div>

          {/* Messages Succès / Erreur */}
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center space-y-3">
              <h3 className="text-xl font-bold text-green-800">🎉 Réservation envoyée !</h3>
              <p className="text-green-600 text-sm">Votre réservation a été enregistrée avec succès.</p>
              <Link href="/reservations" className="inline-block mt-2 bg-[#e91e8c] text-white px-6 py-2 rounded-lg font-bold">Voir mes réservations</Link>
            </div>
          )}
          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-semibold">{error}</div>}

          {/* Liste des Chambres sélectionnables (Design Image 3) */}
          <div className="space-y-4">
            {rooms.map((room, roomIdx) => {
              const options = getChambresForRoom(room);
              const selectedId = selectedChambres[roomIdx];

              return (
                <div key={roomIdx} className="bg-white border border-gray-300 rounded-xl overflow-hidden shadow-sm">
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2">
                    <span className="text-gray-500 text-lg">🛏️</span>
                    <span className="font-bold text-[#1a1a2e] text-sm">
                      Chambre {roomIdx + 1} : <span className="font-medium text-gray-600">{room.adults} Adulte{room.adults > 1 ? "s" : ""}</span>
                    </span>
                  </div>

                  {options.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">Aucune chambre disponible.</div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {options.map((chambre: Chambre) => {
                        const totalPrix = calculateChambreTotal(chambre, room);
                        const isSelected = selectedId === String(chambre.id);
                        const isDisponible = chambre.quantite > 0;

                        return (
                          <div key={chambre.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isSelected ? "bg-pink-50/30" : "hover:bg-gray-50"} ${!isDisponible ? "opacity-50" : ""}`}>
                            
                            <div className="flex items-center gap-3 flex-1">
                              <input
                                type="radio"
                                name={`room-${roomIdx}`}
                                checked={isSelected}
                                disabled={!isDisponible}
                                onChange={() => setSelectedChambres(prev => ({ ...prev, [roomIdx]: String(chambre.id) }))}
                                className="w-5 h-5 text-[#e91e8c] focus:ring-[#e91e8c] cursor-pointer"
                              />
                              <label className="cursor-pointer" onClick={() => isDisponible && setSelectedChambres(prev => ({ ...prev, [roomIdx]: String(chambre.id) }))}>
                                <span className="font-semibold text-gray-800 block text-sm">{chambre.nom} <span className="text-gray-400 ml-1">👥</span></span>
                              </label>
                            </div>

                            <div className="w-full sm:w-48">
                              <select
                                value={selectedPensions[chambre.id] || (chambre.pensions && chambre.pensions[0]?.id) || ""}
                                onChange={(e) => setSelectedPensions(prev => ({ ...prev, [chambre.id]: Number(e.target.value) }))}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-[#e91e8c]"
                              >
                                {chambre.pensions?.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.nom} {p.pivot.supplement_prix > 0 ? `(+${p.pivot.supplement_prix} DT)` : ""}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="w-24 text-center">
                              <span className={`text-xs font-bold ${isDisponible ? "text-green-500" : "text-red-500"}`}>
                                {isDisponible ? "Disponible" : "Complet"}
                              </span>
                            </div>

                            <div className="w-28 text-right">
                              <span className="text-[#1a1a2e] font-extrabold text-xl">{totalPrix}</span>
                              <span className="text-[10px] text-gray-500 font-bold ml-1 align-top">TND</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Résumé prix total et actions en bas */}
          {allRoomsHaveSelection && grandTotal > 0 && !success && (
            <div className="flex flex-col items-end pt-6 border-t border-gray-200 mt-6 space-y-4">
              <div className="text-right">
                <p className="text-[11px] text-[#e91e8c] font-bold bg-pink-50 border border-pink-100 px-2 py-0.5 rounded inline-block mb-2">-{discountTotal} TND</p>
                <div className="flex items-end gap-3 justify-end">
                   <span className="text-gray-400 line-through font-semibold text-lg">{originalTotal} TND</span>
                   <span className="text-3xl font-extrabold text-[#e91e8c]">{grandTotal} <span className="text-sm">TND</span></span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 w-full max-w-md">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => handleReservationClick("deposit")}
                  className="bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-bold px-6 py-3.5 rounded-xl transition-all shadow-md flex-1 disabled:opacity-50"
                >
                  {submitting ? "Traitement..." : "Valider et Payer"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}