"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import DatePicker, { registerLocale } from "react-datepicker";
import { fr } from "date-fns/locale/fr";
import "react-datepicker/dist/react-datepicker.css";

registerLocale("fr", fr);

const API = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";
const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? process.env.NEXT_PUBLIC_API_URL.replace("/api", "")
  : "http://127.0.0.1:8000";

// ── Types ──────────────────────────────────────────────────────────────────

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
  destination: { id: number; nom: string; adresse?: string } | null;
  chambres: Chambre[];
  services: ServiceHotel[];
  photos: Photo[];
}
interface Room {
  adults: number;
  childrenAges: number[];
}
interface AvisUser {
  id: number;
  nom: string;
  prenom: string;
}
interface AvisItem {
  id: number;
  user_id: number;
  note_globale: number;
  note_qualite_prix: number | null;
  note_chambres: number | null;
  note_emplacement: number | null;
  note_proprete: number | null;
  note_services: number | null;
  note_equipements: number | null;
  commentaire: string | null;
  created_at: string;
  user: AvisUser;
}
interface AvisData {
  count: number;
  pct_recommande: number;
  moyennes: {
    globale: number;
    qualite_prix: number;
    chambres: number;
    emplacement: number;
    proprete: number;
    services: number;
    equipements: number;
  } | null;
  avis: AvisItem[];
}

// ── Composant principal ────────────────────────────────────────────────────

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
  const initDepartStr  = searchParams.get("depart");
  const initArrivee    = initArriveeStr ? new Date(initArriveeStr) : new Date();
  const initDepart     = initDepartStr  ? new Date(initDepartStr)  : getNextDate(2);
  const initAdultes    = parseInt(searchParams.get("adultes")  || "2", 10) || 2;
  const initEnfants    = parseInt(searchParams.get("enfants")  || "0", 10) || 0;
  const initChambres   = parseInt(searchParams.get("chambres") || "1", 10) || 1;

  // ── State ───────────────────────────────────────────────────────────────
  const [hotel,      setHotel]      = useState<Hotel | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  const [currentPhoto,   setCurrentPhoto]   = useState(0);
  const [activeTab,      setActiveTab]      = useState<"photos"|"presentation"|"equipements"|"avis">("photos");
  const [selectedPensions, setSelectedPensions] = useState<Record<string, number>>({});

  // Avis
  const [avisData,       setAvisData]       = useState<AvisData | null>(null);
  const [avisLoading,    setAvisLoading]    = useState(false);
  const [showAvisForm,   setShowAvisForm]   = useState(false);
  const [avisForm,       setAvisForm]       = useState({
    note_globale:      7,
    note_qualite_prix: 7,
    note_chambres:     7,
    note_emplacement:  7,
    note_proprete:     7,
    commentaire:       "",
  });
  const [avisSubmitting, setAvisSubmitting] = useState(false);
  const [avisError,      setAvisError]      = useState<string | null>(null);

  // Search bar
  const [searchArrivee,    setSearchArrivee]    = useState<Date | null>(initArrivee);
  const [searchDepart,     setSearchDepart]     = useState<Date | null>(initDepart);
  const [showGuestPicker,  setShowGuestPicker]  = useState(false);
  const [showDatePicker,   setShowDatePicker]   = useState(false);
  const [rooms, setRooms] = useState<Room[]>(() =>
    buildRoomsFromTotals(initChambres, initAdultes, initEnfants)
  );
  const [selectedChambres, setSelectedChambres] = useState<Record<number, string>>({});

  const voyRef  = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  // Section refs for scroll-to-tab
  const photosRef       = useRef<HTMLDivElement>(null);
  const presRef         = useRef<HTMLDivElement>(null);
  const equipRef        = useRef<HTMLDivElement>(null);
  const avisRef         = useRef<HTMLDivElement>(null);
  const chambresRef     = useRef<HTMLDivElement>(null);

  // ── Helpers ─────────────────────────────────────────────────────────────

  function buildRoomsFromTotals(totalRooms: number, totalAdults: number, totalEnfants: number): Room[] {
    const list: Room[] = [];
    for (let i = 0; i < totalRooms; i++) list.push({ adults: 1, childrenAges: [] });
    let rem = totalAdults - totalRooms, idx = 0;
    while (rem > 0 && list.length) {
      list[idx].adults = Math.min(4, list[idx].adults + 1);
      rem--;
      idx = (idx + 1) % list.length;
    }
    let remE = totalEnfants; idx = 0;
    while (remE > 0 && list.length) {
      if (list[idx].childrenAges.length < 3) { list[idx].childrenAges.push(8); remE--; }
      idx = (idx + 1) % list.length;
    }
    return list.length > 0 ? list : [{ adults: 2, childrenAges: [] }];
  }

  const searchAdultes  = rooms.reduce((s, r) => s + r.adults, 0);
  const searchEnfants  = rooms.reduce((s, r) => s + r.childrenAges.length, 0);
  const searchChambresCount = rooms.length;

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return `${String(date.getDate()).padStart(2,"0")}/${String(date.getMonth()+1).padStart(2,"0")}/${date.getFullYear()}`;
  };
  const toYMD = (date: Date | null) => date ? date.toISOString().split("T")[0] : "";

  const nbNuits = () => {
    if (!searchArrivee || !searchDepart) return 0;
    return Math.max(0, Math.floor((searchDepart.getTime() - searchArrivee.getTime()) / 86400000));
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";
    if (image.startsWith("http")) return image;
    return `${BASE_URL}${image}`;
  };

  const noteColor = (n: number) => n >= 8 ? "bg-green-500" : n >= 6 ? "bg-[#14b8a6]" : "bg-orange-400";
  const noteLabel = (n: number) => n >= 8 ? "Excellent" : n >= 7 ? "Très bien" : n >= 6 ? "Bien" : "Correct";

  // ── Close pickers on outside click ──────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (voyRef.current  && !voyRef.current.contains(e.target as Node))  setShowGuestPicker(false);
      if (dateRef.current && !dateRef.current.contains(e.target as Node)) setShowDatePicker(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Room management ──────────────────────────────────────────────────────
  const addRoom        = () => rooms.length < 5 && setRooms([...rooms, { adults: 2, childrenAges: [] }]);
  const removeRoom     = (i: number) => rooms.length > 1 && setRooms(rooms.filter((_, idx) => idx !== i));
  const updateAdults   = (idx: number, d: number) =>
    setRooms(rooms.map((r, i) => i === idx ? { ...r, adults: Math.max(1, Math.min(4, r.adults + d)) } : r));
  const addChild       = (idx: number) =>
    setRooms(rooms.map((r, i) => i === idx && r.childrenAges.length < 3 ? { ...r, childrenAges: [...r.childrenAges, 8] } : r));
  const removeChild    = (idx: number) =>
    setRooms(rooms.map((r, i) => i === idx && r.childrenAges.length > 0 ? { ...r, childrenAges: r.childrenAges.slice(0,-1) } : r));
  const setChildAge    = (rIdx: number, cIdx: number, age: number) =>
    setRooms(rooms.map((r, i) => { if (i !== rIdx) return r; const a=[...r.childrenAges]; a[cIdx]=age; return {...r,childrenAges:a}; }));

  // ── Fetch hotel ──────────────────────────────────────────────────────────
  const fetchHotel = () => {
    return fetch(`${API}/hotels/${id}`)
      .then(r => r.json())
      .then(data => { setHotel(data); setLoading(false); });
  };
  useEffect(() => { fetchHotel(); }, [id]);

  // ── Fetch avis ───────────────────────────────────────────────────────────
  const fetchAvis = () => {
    setAvisLoading(true);
    fetch(`${API}/hotels/${id}/avis`)
      .then(r => r.json())
      .then(data => { setAvisData(data); setAvisLoading(false); });
  };
  useEffect(() => { fetchAvis(); }, [id]);

  // ── Room <-> chambre selection sync ─────────────────────────────────────
  const getChambresForRoom = (room: Room): Chambre[] => {
    if (!hotel?.chambres) return [];
    return hotel.chambres.filter(c =>
      c.capacite_adultes === room.adults && c.capacite_enfants >= room.childrenAges.length
    );
  };

  useEffect(() => {
    if (!hotel) return;
    setSelectedChambres(prev => {
      const next: Record<number, string> = {};
      rooms.forEach((room, idx) => {
        const opts = getChambresForRoom(room);
        const prev_choice = prev[idx];
        next[idx] = (prev_choice && opts.some(c => String(c.id) === prev_choice))
          ? prev_choice
          : (opts[0] ? String(opts[0].id) : "");
      });
      return next;
    });
  }, [hotel, rooms]);

  // ── Pricing ──────────────────────────────────────────────────────────────
  const calculateChambreTotal = (chambre: Chambre, room: Room) => {
    const pensionId = selectedPensions[`${chambre.id}`] || chambre.pensions?.[0]?.id;
    const supPension = chambre.pensions?.find(p => p.id === pensionId)?.pivot.supplement_prix ?? 0;
    const supEnfants = room.childrenAges.reduce((s, age) =>
      s + (age < 2 ? 0 : age < 12 ? 30 : 50), 0);
    return (chambre.prix_base_nuit + supPension + supEnfants) * Math.max(1, nbNuits());
  };

  const grandTotal = useMemo(() => {
    if (!hotel) return 0;
    return rooms.reduce((sum, room, idx) => {
      const ch = hotel.chambres.find(c => String(c.id) === selectedChambres[idx]);
      return ch ? sum + calculateChambreTotal(ch, room) : sum;
    }, 0);
  }, [hotel, rooms, selectedChambres, selectedPensions, searchArrivee, searchDepart]);

  const allRoomsHaveSelection = rooms.every((_, idx) => {
    const chambreId = selectedChambres[idx];
    if (!chambreId) return false;
    const chambre = hotel?.chambres.find(c => String(c.id) === chambreId);
    return chambre ? chambre.quantite > 0 : false;
  });
  const originalTotal = Math.round(grandTotal * 1.25);
  const discountTotal = originalTotal - grandTotal;
  const depositAmount = Math.round(grandTotal * 0.15);

  // ── Submit reservation ────────────────────────────────────────────────────
  const handleReservationClick = async (paymentType: "agence" | "deposit") => {
    setError(null);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    if (!hotel || !allRoomsHaveSelection) {
      setError("Veuillez sélectionner un type de chambre pour chaque chambre demandée."); return;
    }
    setSubmitting(true);
    try {
      const requests = rooms.map((room, idx) => {
        const chambreId = selectedChambres[idx];
        const chambre   = hotel.chambres.find(c => String(c.id) === chambreId);
        const pensionId = selectedPensions[chambreId] || chambre?.pensions?.[0]?.id || null;
        return fetch(`${API}/reservations`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            hotel_id: id, chambre_id: chambreId, pension_id: pensionId,
            date_arrivee: toYMD(searchArrivee), date_depart: toYMD(searchDepart),
            nb_chambres: 1, nb_adultes: room.adults,
            nb_enfants: room.childrenAges.length, ages_enfants: room.childrenAges,
            type_paiement: paymentType,
          }),
        });
      });
      const responses = await Promise.all(requests);
      if (responses.some(r => r.status === 401)) {
        localStorage.removeItem("token"); localStorage.removeItem("user");
        window.dispatchEvent(new Event("auth-change")); router.push("/login"); return;
      }
      const results = await Promise.all(responses.map(r => r.json().catch(() => ({}))));
      if (responses.some(r => !r.ok)) {
        setError(results.find((r: any) => r?.message)?.message || "Erreur lors de la réservation."); return;
      }
      setSuccess(true);
      // Rafraîchir les données de l'hôtel pour mettre à jour les quantités en temps réel
      await fetchHotel();
    } catch { setError("Erreur de connexion au serveur."); }
    finally { setSubmitting(false); }
  };

  // ── Submit avis ───────────────────────────────────────────────────────────
  const handleAvisSubmit = async () => {
    setAvisError(null);
    const token = localStorage.getItem("token");
    if (!token) { router.push("/login"); return; }
    setAvisSubmitting(true);
    try {
      const res = await fetch(`${API}/hotels/${id}/avis`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(avisForm),
      });
      if (!res.ok) {
        const data = await res.json();
        setAvisError(data?.message || "Erreur lors de l'envoi de l'avis.");
        return;
      }
      setShowAvisForm(false);
      fetchAvis(); // refresh avis data
    } catch { setAvisError("Erreur de connexion."); }
    finally { setAvisSubmitting(false); }
  };

  // ── Tab scroll ────────────────────────────────────────────────────────────
  const scrollToTab = (tab: "photos"|"presentation"|"equipements"|"avis") => {
    setActiveTab(tab);
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      photos: photosRef, presentation: presRef, equipements: equipRef, avis: avisRef,
    };
    refs[tab]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ── Loading / Not found ───────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin w-10 h-10 border-4 border-[#e91e8c] border-t-transparent rounded-full"/>
    </div>
  );
  if (!hotel) return (
    <div className="min-h-screen flex items-center justify-center text-gray-400">Hôtel introuvable.</div>
  );

  // ── DatePicker styles ─────────────────────────────────────────────────────
  const dpStyles = `
    .react-datepicker{border:none!important;box-shadow:0 20px 60px -10px rgba(0,0,0,.15)!important;border-radius:16px!important;font-family:inherit!important;overflow:hidden}
    .react-datepicker__header{background:white!important;border-bottom:1px solid #f3f4f6!important;padding:16px!important}
    .react-datepicker__current-month{font-weight:700!important;color:#1a1a2e!important;font-size:15px!important}
    .react-datepicker__day-name{color:#9ca3af!important;font-weight:600!important;font-size:12px!important}
    .react-datepicker__day--selected,.react-datepicker__day--in-range{background-color:#e91e8c!important;color:white!important;border-radius:8px!important;font-weight:700!important}
    .react-datepicker__day--in-selecting-range{background-color:#fce7f3!important;color:#e91e8c!important;border-radius:8px!important}
    .react-datepicker__day--range-start,.react-datepicker__day--range-end{background-color:#e91e8c!important;color:white!important;border-radius:8px!important}
    .react-datepicker__day:hover{background-color:#fce7f3!important;color:#e91e8c!important;border-radius:8px!important}
    .react-datepicker__day--outside-month{color:#d1d5db!important}
    .react-datepicker__navigation-icon::before{border-color:#9ca3af!important}
  `;

  const m = avisData?.moyennes;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <style>{dpStyles}</style>

      {/* ── HEADER avec ONGLETS ─────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 pt-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[#1a1a2e] flex items-center gap-3 flex-wrap">
                {hotel.nom}
                <span className="text-yellow-400 text-lg">{"★".repeat(hotel.etoiles)}{"☆".repeat(5-hotel.etoiles)}</span>
              </h1>
              {hotel.destination && (
                <p className="text-gray-500 text-sm mt-1 flex items-center gap-1">
                  📍 {hotel.destination.adresse || hotel.destination.nom}
                </p>
              )}
            </div>
            <Link
              href={hotel.destination ? `/destinations/${hotel.destination.id}` : "/destinations"}
              className="text-sm text-[#e91e8c] hover:underline font-medium whitespace-nowrap hidden md:block"
            >
              ← Retour
            </Link>
          </div>

          {/* Onglets */}
          <div className="flex gap-0 mt-6 overflow-x-auto border-b border-gray-100 -mb-px">
            {(["photos","presentation","equipements","avis"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => scrollToTab(tab)}
                className={`px-5 py-3 text-sm font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-[#e91e8c] text-[#e91e8c]"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab === "photos" ? "Photos" : tab === "presentation" ? "Présentation" : tab === "equipements" ? "Équipements" : `Avis${avisData?.count ? ` (${avisData.count})` : ""}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── CORPS DE PAGE ──────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── COLONNE PRINCIPALE ──────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-8">

            {/* CARROUSEL */}
            <div ref={photosRef} className="relative w-full h-[320px] md:h-[420px] rounded-2xl overflow-hidden shadow-sm scroll-mt-24">
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
                        onClick={() => setCurrentPhoto(p => p === 0 ? hotel.photos.length-1 : p-1)}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition"
                      >◀</button>
                      <button
                        onClick={() => setCurrentPhoto(p => p === hotel.photos.length-1 ? 0 : p+1)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 w-10 h-10 rounded-full flex items-center justify-center shadow-md transition"
                      >▶</button>
                      <div className="absolute bottom-3 right-4 bg-black/50 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                        {currentPhoto+1}/{hotel.photos.length}
                      </div>
                    </>
                  )}
                  {/* Miniatures */}
                  {hotel.photos.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex gap-1.5">
                      {hotel.photos.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentPhoto(i)}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${i === currentPhoto ? "bg-white scale-125" : "bg-white/50"}`}
                        />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <img src={getImageUrl(hotel.image)} alt={hotel.nom} className="w-full h-full object-cover"/>
              )}
            </div>

            {/* SERVICES RAPIDES */}
            {hotel.services && hotel.services.length > 0 && (
              <div ref={equipRef} className="scroll-mt-24">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Principaux Services</p>
                <div className="flex flex-wrap gap-4">
                  {hotel.services.map((s) => (
                    <div key={s.id} className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-100 rounded-lg px-3 py-2 shadow-sm">
                      <span>{s.icone}</span> <span className="font-medium">{s.nom}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PRÉSENTATION */}
            <div ref={presRef} className="scroll-mt-24 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">Présentation</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {hotel.description ?? "Aucune description disponible."}
              </p>
            </div>
          </div>

          {/* ── SIDEBAR AVIS ─────────────────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100 sticky top-24">
              {avisLoading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="animate-spin w-8 h-8 border-3 border-[#e91e8c] border-t-transparent rounded-full"/>
                </div>
              ) : avisData && avisData.count > 0 && m ? (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <div className={`w-14 h-14 ${noteColor(m.globale)} rounded-xl flex items-center justify-center text-white text-2xl font-extrabold shadow`}>
                      {m.globale}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-[#1a1a2e]">{noteLabel(m.globale)}</p>
                      <p className="text-xs text-gray-400">{avisData.count} avis TunisieBooking</p>
                    </div>
                  </div>

                  {/* Dernier commentaire */}
                  {avisData.avis[0]?.commentaire && (
                    <div className="bg-gray-50 p-4 rounded-xl text-sm italic text-gray-600 mb-5 relative border border-gray-100">
                      <span className="text-3xl text-gray-200 absolute -top-2 left-2 font-serif leading-none">"</span>
                      <p className="mt-2 line-clamp-3">{avisData.avis[0].commentaire}</p>
                      <span className="block text-xs text-gray-400 not-italic mt-2 font-semibold">
                        — {avisData.avis[0].user.prenom} {avisData.avis[0].user.nom[0]}.
                      </span>
                    </div>
                  )}

                  {/* Barres de score */}
                  <div className="space-y-3">
                    {[
                      { label: "Qualité/prix",  val: m.qualite_prix },
                      { label: "Chambres",       val: m.chambres },
                      { label: "Emplacement",    val: m.emplacement },
                      { label: "Propreté",       val: m.proprete },
                    ].filter(x => x.val > 0).map(({ label, val }) => (
                      <div key={label}>
                        <div className="flex justify-between mb-1">
                          <span className="text-xs text-gray-600 font-medium">{label}</span>
                          <span className="text-xs font-bold text-[#1a1a2e]">{val}</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                          <div className={`${noteColor(val)} h-1.5 rounded-full transition-all`} style={{ width: `${val * 10}%` }}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-500 font-medium flex items-center gap-2">
                    <span className="text-green-500 text-base">👍</span>
                    Recommandé par {avisData.pct_recommande}% de nos clients
                  </div>

                  <button
                    onClick={() => setShowAvisForm(v => !v)}
                    className="mt-4 w-full py-2.5 text-sm font-bold text-[#e91e8c] border border-[#e91e8c] rounded-xl hover:bg-pink-50 transition"
                  >
                    {showAvisForm ? "Annuler" : "✍️ Laisser mon avis"}
                  </button>
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-[#1a1a2e] mb-2">Avis Voyageurs</h3>
                  <p className="text-sm text-gray-400 mb-4">Aucun avis pour cet hôtel pour le moment. Soyez le premier !</p>
                  <button
                    onClick={() => setShowAvisForm(v => !v)}
                    className="w-full py-2.5 text-sm font-bold text-white bg-[#e91e8c] rounded-xl hover:bg-[#d11a7e] transition shadow"
                  >
                    ✍️ Laisser le premier avis
                  </button>
                </>
              )}

              {/* Formulaire d'avis */}
              {showAvisForm && (
                <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">
                  <p className="font-bold text-sm text-[#1a1a2e]">Votre évaluation</p>

                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Note globale : <strong className="text-[#e91e8c]">{avisForm.note_globale}/10</strong></label>
                    <input type="range" min={1} max={10} value={avisForm.note_globale}
                      onChange={e => setAvisForm(f => ({...f, note_globale: +e.target.value}))}
                      className="w-full accent-[#e91e8c]"/>
                  </div>

                  {[
                    { key: "note_qualite_prix", label: "Qualité/prix" },
                    { key: "note_chambres",     label: "Chambres" },
                    { key: "note_emplacement",  label: "Emplacement" },
                    { key: "note_proprete",     label: "Propreté" },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500 font-semibold block mb-1">
                        {label} : <strong className="text-[#e91e8c]">{(avisForm as any)[key]}/10</strong>
                      </label>
                      <input type="range" min={1} max={10} value={(avisForm as any)[key]}
                        onChange={e => setAvisForm(f => ({...f, [key]: +e.target.value}))}
                        className="w-full accent-[#e91e8c]"/>
                    </div>
                  ))}

                  <div>
                    <label className="text-xs text-gray-500 font-semibold block mb-1">Commentaire (facultatif)</label>
                    <textarea
                      value={avisForm.commentaire}
                      onChange={e => setAvisForm(f => ({...f, commentaire: e.target.value}))}
                      rows={3}
                      placeholder="Partagez votre expérience..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#e91e8c]"
                    />
                  </div>

                  {avisError && <p className="text-red-500 text-xs">{avisError}</p>}

                  <button
                    onClick={handleAvisSubmit}
                    disabled={avisSubmitting}
                    className="w-full py-2.5 text-sm font-bold text-white bg-[#e91e8c] rounded-xl hover:bg-[#d11a7e] transition disabled:opacity-50 shadow"
                  >
                    {avisSubmitting ? "Envoi..." : "Publier mon avis"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── SECTION AVIS (liste complète) ──────────────────────────────── */}
        {avisData && avisData.count > 0 && (
          <div ref={avisRef} className="mt-10 scroll-mt-24 bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-[#1a1a2e] mb-5">
              Avis des voyageurs ({avisData.count})
            </h2>
            <div className="space-y-5">
              {avisData.avis.map((avis) => (
                <div key={avis.id} className="border-b border-gray-100 pb-5 last:border-none last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-full bg-[#e91e8c]/10 flex items-center justify-center font-bold text-[#e91e8c] text-sm">
                      {avis.user.prenom[0]}{avis.user.nom[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#1a1a2e]">{avis.user.prenom} {avis.user.nom}</p>
                      <p className="text-xs text-gray-400">{new Date(avis.created_at).toLocaleDateString("fr-FR", { day:"numeric", month:"long", year:"numeric" })}</p>
                    </div>
                    <div className={`ml-auto w-10 h-10 ${noteColor(avis.note_globale)} rounded-xl flex items-center justify-center text-white text-sm font-extrabold`}>
                      {avis.note_globale}
                    </div>
                  </div>
                  {avis.commentaire && (
                    <p className="text-sm text-gray-600 leading-relaxed">{avis.commentaire}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── SECTION CHAMBRES DISPONIBLES ───────────────────────────────── */}
        <div id="chambres-section" ref={chambresRef} className="mt-10 space-y-5">
          <h2 className="text-2xl font-bold text-[#1a1a2e]">Chambres disponibles</h2>

          {/* Barre de filtre avec DatePicker intégré */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-visible" ref={dateRef}>
            <div className="flex flex-col md:flex-row">

              {/* Dates */}
              <div
                className="flex flex-1 border-b md:border-b-0 cursor-pointer"
                onClick={() => setShowDatePicker(v => !v)}
              >
                <div className="flex-1 flex flex-col justify-center px-4 py-3 border-r border-gray-200 hover:bg-gray-50 transition">
                  <span className="text-[10px] uppercase font-bold text-gray-400">📅 Arrivée</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5">{formatDate(searchArrivee) || "Sélectionnez"}</span>
                </div>
                <div className="flex-1 flex flex-col justify-center px-4 py-3 border-r border-gray-200 hover:bg-gray-50 transition">
                  <span className="text-[10px] uppercase font-bold text-gray-400">📅 Départ</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5">{formatDate(searchDepart) || "Sélectionnez"}</span>
                </div>
              </div>

              {/* Voyageurs */}
              <div className="flex-1 relative border-b md:border-b-0" ref={voyRef}>
                <div
                  className="flex flex-col justify-center px-4 py-3 border-r border-gray-200 cursor-pointer hover:bg-gray-50 transition h-full"
                  onClick={() => setShowGuestPicker(v => !v)}
                >
                  <span className="text-[10px] uppercase font-bold text-gray-400">🧑‍🤝‍🧑 Voyageurs</span>
                  <span className="text-sm font-bold text-gray-900 mt-0.5">
                    {searchChambresCount} Ch. · {searchAdultes} Ad. · {searchEnfants} Enf.
                    <span className="text-gray-400 text-xs ml-1">{showGuestPicker ? "▲" : "▼"}</span>
                  </span>
                </div>

                {showGuestPicker && (
                  <div className="absolute top-[calc(100%+8px)] left-0 bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 z-50">
                    <div className="max-h-[360px] overflow-y-auto p-4 space-y-5">
                      {rooms.map((room, rIdx) => (
                        <div key={rIdx} className="border-b border-gray-100 pb-4 last:border-none last:pb-0">
                          <div className="flex justify-between items-center mb-3">
                            <span className="font-bold text-sm text-[#1a1a2e]">Chambre {rIdx+1}</span>
                            {rooms.length > 1 && (
                              <button onClick={() => removeRoom(rIdx)} className="text-xs text-[#e91e8c] hover:bg-pink-50 px-2 py-1 rounded transition">
                                Supprimer
                              </button>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-sm mb-3">
                            <span className="text-gray-700 font-medium">Adulte(s)</span>
                            <div className="flex items-center gap-3">
                              <button onClick={() => updateAdults(rIdx,-1)} className="w-8 h-8 rounded-full border border-gray-200 hover:border-[#e91e8c] hover:text-[#e91e8c] flex items-center justify-center font-bold transition">−</button>
                              <span className="font-bold w-5 text-center">{room.adults}</span>
                              <button onClick={() => updateAdults(rIdx,1)} className="w-8 h-8 rounded-full border border-gray-200 hover:border-[#e91e8c] hover:text-[#e91e8c] flex items-center justify-center font-bold transition">+</button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <div><span className="text-gray-700 font-medium">Enfant(s)</span><span className="text-gray-400 text-xs block">0 à 11 ans</span></div>
                            <div className="flex items-center gap-3">
                              <button onClick={() => removeChild(rIdx)} className="w-8 h-8 rounded-full border border-gray-200 hover:border-[#e91e8c] hover:text-[#e91e8c] flex items-center justify-center font-bold transition">−</button>
                              <span className="font-bold w-5 text-center">{room.childrenAges.length}</span>
                              <button onClick={() => addChild(rIdx)} className="w-8 h-8 rounded-full border border-gray-200 hover:border-[#e91e8c] hover:text-[#e91e8c] flex items-center justify-center font-bold transition">+</button>
                            </div>
                          </div>
                          {room.childrenAges.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                              {room.childrenAges.map((age, cIdx) => (
                                <div key={cIdx} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500">Âge enfant {cIdx+1}</span>
                                  <select value={age} onChange={e => setChildAge(rIdx, cIdx, +e.target.value)}
                                    className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-semibold bg-white focus:outline-none focus:border-[#e91e8c]">
                                    {Array.from({length:12},(_,k) => <option key={k} value={k}>{k === 0 ? "< 1 an" : `${k} an${k>1?"s":""}`}</option>)}
                                  </select>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {rooms.length < 5 && (
                      <button onClick={addRoom} className="w-full py-2.5 text-xs font-bold text-[#e91e8c] border-t border-gray-100 hover:bg-gray-50 transition">
                        + Ajouter une chambre
                      </button>
                    )}
                    <div className="p-3 border-t border-gray-100">
                      <button onClick={() => setShowGuestPicker(false)}
                        className="w-full py-2.5 text-sm font-bold text-white bg-[#e91e8c] rounded-xl hover:bg-[#d11a7e] transition shadow">
                        Valider
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bouton Modifier */}
              <div className="flex items-center px-3 py-2">
                <button
                  onClick={() => setShowDatePicker(v => !v)}
                  className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 font-semibold px-5 py-2.5 rounded-lg text-sm transition whitespace-nowrap"
                >
                  ✏️ Modifier
                </button>
              </div>
            </div>

            {/* Popup DatePicker (2 mois) */}
            {showDatePicker && (
              <div className="border-t border-gray-100 p-4 bg-white rounded-b-xl">
                <div className="flex justify-center overflow-x-auto">
                  <DatePicker
                    selected={searchArrivee}
                    onChange={(dates) => {
                      const [start, end] = dates;
                      setSearchArrivee(start);
                      setSearchDepart(end);
                      if (start && end) setShowDatePicker(false);
                    }}
                    startDate={searchArrivee}
                    endDate={searchDepart}
                    selectsRange
                    monthsShown={2}
                    inline
                    minDate={new Date()}
                    locale="fr"
                  />
                </div>
              </div>
            )}
          </div>

          {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-semibold">{error}</div>}

          {/* Liste des chambres */}
          <div className="space-y-4">
              {rooms.map((room, roomIdx) => {
                const options    = getChambresForRoom(room);
                const selectedId = selectedChambres[roomIdx];
                return (
                  <div key={roomIdx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-gray-50 px-5 py-3 border-b border-gray-200 flex items-center gap-2">
                      <span className="text-lg">🛏️</span>
                      <span className="font-bold text-[#1a1a2e] text-sm">
                        Chambre {roomIdx+1} :{" "}
                        <span className="font-medium text-gray-500">
                          {room.adults} Adulte{room.adults>1?"s":""}
                          {room.childrenAges.length > 0 ? `, ${room.childrenAges.length} Enfant${room.childrenAges.length>1?"s":""}` : ""}
                        </span>
                      </span>
                    </div>

                    {options.length === 0 ? (
                      <div className="p-6 text-center text-gray-400 text-sm">
                        <p>Aucune chambre disponible pour {room.adults} adulte{room.adults>1?"s":""}.</p>
                        <p className="text-xs mt-1 text-gray-300">Modifiez le nombre de voyageurs ci-dessus.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {options.map((chambre) => {
                          const isSelected   = selectedId === String(chambre.id);
                          const isDisponible = chambre.quantite > 0;
                          const isLowStock   = chambre.quantite > 0 && chambre.quantite <= 3;
                          const totalPrix    = calculateChambreTotal(chambre, room);

                          const availabilityLabel = !isDisponible
                            ? "Complet"
                            : isLowStock
                              ? `⚡ Il reste ${chambre.quantite} chambre${chambre.quantite > 1 ? "s" : ""} !`
                              : "Disponible";

                          const availabilityClass = !isDisponible
                            ? "text-red-600 bg-red-50 border border-red-200"
                            : isLowStock
                              ? "text-orange-600 bg-orange-50 border border-orange-200 animate-pulse"
                              : "text-green-600 bg-green-50";

                          return (
                            <div
                              key={chambre.id}
                              onClick={() => isDisponible && setSelectedChambres(prev => ({...prev,[roomIdx]:String(chambre.id)}))}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 transition
                                ${isDisponible ? "cursor-pointer" : "cursor-not-allowed"}
                                ${isSelected ? "bg-pink-50 ring-1 ring-[#e91e8c]/20" : isDisponible ? "hover:bg-gray-50" : "opacity-60"}`}
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <input
                                  type="radio"
                                  checked={isSelected}
                                  readOnly
                                  disabled={!isDisponible}
                                  className="w-4 h-4 accent-[#e91e8c] cursor-pointer shrink-0"
                                />
                                <div className="min-w-0">
                                  <span className="font-semibold text-gray-800 text-sm block truncate">{chambre.nom}</span>
                                  <span className="text-xs text-gray-400">👥 {chambre.capacite_adultes} ad. max</span>
                                </div>
                              </div>

                              <select
                                value={selectedPensions[chambre.id] || chambre.pensions?.[0]?.id || ""}
                                onChange={e => { e.stopPropagation(); setSelectedPensions(prev => ({...prev,[chambre.id]:+e.target.value})); }}
                                onClick={e => e.stopPropagation()}
                                disabled={!isDisponible}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:border-[#e91e8c] w-full sm:w-48 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {chambre.pensions?.map(p => (
                                  <option key={p.id} value={p.id}>
                                    {p.nom}
                                  </option>
                                ))}
                              </select>

                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap ${availabilityClass}`}>
                                {availabilityLabel}
                              </span>

                              <div className="text-right shrink-0 min-w-[90px]">
                                {isDisponible ? (
                                  <>
                                    <span className="text-xl font-extrabold text-[#1a1a2e]">{totalPrix}</span>
                                    <span className="text-[11px] text-gray-400 font-bold ml-0.5 align-top">TND</span>
                                  </>
                                ) : (
                                  <span className="text-sm text-red-400 font-semibold">Indisponible</span>
                                )}
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

          {/* Récapitulatif total & bouton de réservation */}
          {allRoomsHaveSelection && grandTotal > 0 && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-gray-400 line-through text-lg">{originalTotal} TND</span>
                    <span className="text-3xl font-extrabold text-[#e91e8c]">{grandTotal} TND</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Pour {nbNuits()} nuit{nbNuits()>1?"s":""} · {searchChambresCount} chambre{searchChambresCount>1?"s":""}
                    <span className="ml-2 bg-pink-100 text-[#e91e8c] text-[10px] font-bold px-2 py-0.5 rounded">-{discountTotal} TND</span>
                  </p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                  <button
                    onClick={() => handleReservationClick("agence")}
                    disabled={submitting}
                    className="flex-1 md:flex-none border border-[#e91e8c] text-[#e91e8c] hover:bg-pink-50 font-bold text-sm px-6 py-3 rounded-xl transition disabled:opacity-50"
                  >
                    🏪 Passer à l'agence
                  </button>
                  <button
                    onClick={() => handleReservationClick("deposit")}
                    disabled={submitting}
                    className="flex-1 md:flex-none bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md disabled:opacity-50"
                  >
                    {submitting ? "Traitement..." : `💳 Payer ${depositAmount} TND maintenant`}
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 flex items-center gap-1 justify-center">🔒 Paiement 100% sécurisé</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Succès */}
      {success && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl text-center space-y-4 relative border border-gray-100 animate-in fade-in zoom-in duration-200">
            <button
              onClick={() => setSuccess(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>
            <p className="text-5xl">🎉</p>
            <h3 className="text-2xl font-extrabold text-gray-900">Réservation envoyée !</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              Votre réservation a été enregistrée avec succès. Vous pouvez la suivre depuis votre profil.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/reservations"
                className="w-full bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-bold py-3 rounded-xl transition shadow-md block text-center"
              >
                Voir mes réservations
              </Link>
              <button
                onClick={() => setSuccess(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 rounded-xl transition"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}