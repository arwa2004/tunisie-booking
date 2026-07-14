"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

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

  const todayStr = new Date().toISOString().split("T")[0];
  const getNextDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
  };

  const initArrivee = searchParams.get("arrivee") || todayStr;
  const initDepart = searchParams.get("depart") || getNextDate(2);
  const initAdultes = parseInt(searchParams.get("adultes") || "2", 10) || 2;
  const initEnfants = parseInt(searchParams.get("enfants") || "0", 10) || 0;
  const initChambres = parseInt(searchParams.get("chambres") || "1", 10) || 1;

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Carrousel photos
  const [currentPhoto, setCurrentPhoto] = useState(0);

  // Pension sélectionnée par chambre (chambre_id -> pension_id)
  const [selectedPensions, setSelectedPensions] = useState<Record<string, number>>({});

  // Helper function to build rooms array from initial totals
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
  const [searchArrivee, setSearchArrivee] = useState(initArrivee);
  const [searchDepart, setSearchDepart] = useState(initDepart);
  const [showGuestPicker, setShowGuestPicker] = useState(false);
  const [rooms, setRooms] = useState<Room[]>(() =>
    buildRoomsFromTotals(initChambres, initAdultes, initEnfants)
  );

  const searchAdultes    = rooms.reduce((s, r) => s + r.adults, 0);
  const searchEnfants    = rooms.reduce((s, r) => s + r.childrenAges.length, 0);
  const searchChambres   = rooms.length;

  // ⬇️ NOUVEAU : sélection INDÉPENDANTE par room du picker
  // clé = index de la room (0, 1, 2...), valeur = id de la chambre choisie pour CETTE room
  const [selectedChambres, setSelectedChambres] = useState<Record<number, string>>({});

  const voyRef = useRef<HTMLDivElement>(null);

  // Close guest picker popup on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (voyRef.current && !voyRef.current.contains(e.target as Node)) {
        setShowGuestPicker(false);
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
    const diff = new Date(searchDepart).getTime() - new Date(searchArrivee).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  // Helper date formatter: DD/MM/YYYY
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
  };

  const getImageUrl = (image: string | null) => {
    if (!image) return "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200";
    if (image.startsWith("http")) return image;
    return `${BASE_URL}${image}`;
  };

  // ⬇️ NOUVEAU : filtrage INDÉPENDANT par room (au lieu du total agrégé)
  // Chaque chambre du picker ne voit que les types de chambres hôtel
  // dont la capacité correspond EXACTEMENT à SES propres adultes.
  const getChambresForRoom = (room: Room): Chambre[] => {
    if (!hotel?.chambres) return [];
    return hotel.chambres.filter(
      c => c.capacite_adultes === room.adults && c.capacite_enfants >= room.childrenAges.length
    );
  };

  // Initialiser / resynchroniser la sélection pour CHAQUE room dès que
  // les rooms changent (ajout/suppression/adultes) ou que l'hôtel se charge.
  useEffect(() => {
    if (!hotel) return;
    setSelectedChambres(prev => {
      const next: Record<number, string> = {};
      rooms.forEach((room, idx) => {
        const options = getChambresForRoom(room);
        const previousChoice = prev[idx];
        // Garde le choix précédent s'il est toujours valide pour cette room,
        // sinon retombe sur la première option disponible.
        if (previousChoice && options.some(c => String(c.id) === previousChoice)) {
          next[idx] = previousChoice;
        } else {
          next[idx] = options[0] ? String(options[0].id) : "";
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotel, rooms]);

  // Calcul du prix pour UNE chambre donnée, pour UNE room donnée
  // (ne multiplie plus par searchChambres : chaque room est comptée une fois)
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

  // Total général = somme du prix de la chambre choisie pour CHAQUE room
  const grandTotal = useMemo(() => {
    if (!hotel) return 0;
    return rooms.reduce((sum, room, idx) => {
      const chambreId = selectedChambres[idx];
      const chambre = hotel.chambres.find(c => String(c.id) === chambreId);
      if (!chambre) return sum;
      return sum + calculateChambreTotal(chambre, room);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // ⬇️ Le backend Laravel ne gère qu'UNE chambre par réservation
      // (validation: 'chambre_id' => 'required|exists:chambres,id', singulier).
      // On envoie donc UNE requête POST distincte par chambre du picker,
      // en parallèle, plutôt qu'un seul payload groupé.
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
            date_arrivee: searchArrivee,
            date_depart: searchDepart,
            nb_chambres: 1, // 1 chambre de ce type précis (chaque room = 1 réservation)
            nb_adultes: room.adults,
            nb_enfants: room.childrenAges.length,
            ages_enfants: room.childrenAges,
            type_paiement: paymentType, // champ ignoré par le validate() Laravel, sans danger
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

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-start justify-between gap-4">
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
            <Link
              href={hotel.destination ? `/destinations/${hotel.destination.id}` : "/destinations"}
              className="text-sm text-[#e91e8c] hover:underline font-medium whitespace-nowrap"
            >
              ← Retour
            </Link>
          </div>
        </div>
      </div>

      {/* ── CARROUSEL ── */}
      <div className="relative w-full h-[420px] md:h-[500px]">
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
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition"
                >
                  ◀
                </button>
                <button
                  onClick={() => setCurrentPhoto(prev => prev === hotel.photos.length - 1 ? 0 : prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-sm transition"
                >
                  ▶
                </button>
                <div className="absolute bottom-4 right-6 bg-black/50 text-white text-xs font-semibold px-3 py-1 rounded-full backdrop-blur-sm">
                  {currentPhoto + 1} / {hotel.photos.length}
                </div>
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"/>
      </div>

      {/* ── BARRE DE RECHERCHE ── */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[68px] z-30">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                📅 Arrivée
              </label>
              <input
                type="date"
                min={today}
                value={searchArrivee}
                onChange={(e) => setSearchArrivee(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e91e8c] bg-gray-50"
              />
            </div>

            <div className="flex-1 min-w-[140px]">
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                📅 Départ
              </label>
              <input
                type="date"
                min={searchArrivee || today}
                value={searchDepart}
                onChange={(e) => setSearchDepart(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#e91e8c] bg-gray-50"
              />
            </div>

            <div className="flex-1 min-w-[220px] relative" ref={voyRef}>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                👤 Voyageurs
              </label>
              <button
                type="button"
                onClick={() => setShowGuestPicker(!showGuestPicker)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-left bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between font-bold text-[#1a1a2e]"
              >
                <span className="flex items-center gap-2">
                  <span>🧑‍🤝‍🧑</span>
                  <span>{searchChambres} Ch. / {searchAdultes} Ad. / {searchEnfants} Enf.</span>
                </span>
                <span className="text-gray-400 text-xs">{showGuestPicker ? "▲" : "▼"}</span>
              </button>

              {showGuestPicker && (
                <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-2xl shadow-2xl border border-gray-100 w-[300px] z-[200] overflow-hidden text-left">
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
                          <span className="text-gray-700 font-medium">Adulte(s) <span className="text-gray-400 text-xs">max 4</span></span>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateAdults(rIdx, -1)}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="font-bold w-4 text-center text-sm">{room.adults}</span>
                            <button
                              type="button"
                              onClick={() => updateAdults(rIdx, 1)}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children */}
                        <div className="flex justify-between items-center text-sm mb-2">
                          <div>
                            <span className="text-gray-700 font-medium">Enfant(s)</span>
                            <span className="text-gray-400 text-xs block">max 3 / de 0 à 11 ans</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => removeChild(rIdx)}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors"
                            >
                              −
                            </button>
                            <span className="font-bold w-4 text-center text-sm">{room.childrenAges.length}</span>
                            <button
                              type="button"
                              onClick={() => addChild(rIdx)}
                              className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Children Ages */}
                        {room.childrenAges.length > 0 && (
                          <div className="mt-2 space-y-2 pl-1 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Âge(s) de l'enfant(s)</p>
                            {room.childrenAges.map((age, cIdx) => (
                              <div key={cIdx} className="flex items-center justify-between">
                                <label className="text-xs text-gray-500">Enfant {cIdx + 1}</label>
                                <select
                                  value={age}
                                  onChange={(e) => setChildAge(rIdx, cIdx, Number(e.target.value))}
                                  className="text-xs font-semibold text-[#1a1a2e] border border-gray-200 rounded-lg px-2 py-0.5 outline-none focus:border-[#e91e8c] bg-white cursor-pointer"
                                >
                                  {Array.from({ length: 12 }, (_, k) => (
                                    <option key={k} value={k}>
                                      {k === 0 ? "< 1 an" : `${k} an${k > 1 ? "s" : ""}`}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {rooms.length < 5 && (
                    <button
                      type="button"
                      onClick={addRoom}
                      className="w-full text-center py-2.5 text-xs font-semibold text-[#e91e8c] border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      + Ajouter une chambre
                    </button>
                  )}

                  <div className="p-3 border-t border-gray-100 bg-gray-50/20">
                    <button
                      type="button"
                      onClick={() => setShowGuestPicker(false)}
                      className="w-full py-2 text-sm font-bold text-white bg-gradient-to-r from-[#e91e8c] to-[#c2185b] rounded-xl shadow hover:shadow-lg transition-all"
                    >
                      Valider
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setShowGuestPicker(false);
                document.getElementById("chambres-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              disabled={!searchArrivee || !searchDepart}
              className="bg-[#e91e8c] hover:bg-[#d11a7e] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm px-8 py-2.5 rounded-lg transition-all shadow-sm whitespace-nowrap"
            >
              Tarifs & Dispos
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENU ── */}
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">

        {/* Services */}
        {hotel.services && hotel.services.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">
              Principaux Services
            </h2>
            <div className="flex flex-wrap gap-6">
              {hotel.services.map((service) => (
                <div key={service.id} className="flex items-center gap-2 text-gray-700">
                  <span className="text-xl">{service.icone}</span>
                  <span className="text-sm font-medium">{service.nom}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-[#1a1a2e] mb-4">Présentation</h2>
          <p className="text-gray-600 leading-relaxed text-base">
            {hotel.description ?? "Aucune description disponible."}
          </p>
        </div>

        {/* Infos clés */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-3xl font-extrabold text-[#e91e8c]">
              {hotel.chambres && hotel.chambres.length > 0
                ? Math.min(...hotel.chambres.map(c => c.prix_base_nuit))
                : hotel.prix_par_nuit} DT
            </p>
            <p className="text-sm text-gray-500 mt-1">prix minimum / nuit</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-3xl">{renderStars(hotel.etoiles)}</p>
            <p className="text-sm text-gray-500 mt-1">{hotel.etoiles} étoiles</p>
          </div>
          <div className="bg-white rounded-2xl shadow-sm p-6 text-center">
            <p className="text-2xl font-bold text-[#1a1a2e]">{hotel.destination?.nom}</p>
            <p className="text-sm text-gray-500 mt-1">destination</p>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            🛏️ CHAMBRES DISPONIBLES — UN BLOC PAR CHAMBRE DU PICKER
            ══════════════════════════════════════════════════════════════ */}
        <div id="chambres-section" className="bg-white rounded-2xl shadow-sm p-8 space-y-6">
          <h2 className="text-xl font-bold text-[#1a1a2e]">Chambres disponibles</h2>

          {/* Résumé des critères avec bouton Modifier */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-gray-200 rounded-xl">
            <div className="flex flex-wrap items-center gap-3 flex-grow">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50/50">
                <span className="text-gray-400 text-sm">📅</span>
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-400">Arrivée</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(searchArrivee)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50/50">
                <span className="text-gray-400 text-sm">📅</span>
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-400">Départ</p>
                  <p className="text-sm font-semibold text-gray-700">{formatDate(searchDepart)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-gray-50/50 flex-grow max-w-sm">
                <span className="text-gray-400 text-sm">👤</span>
                <div>
                  <p className="text-[9px] uppercase font-bold text-gray-400">Voyageurs</p>
                  <p className="text-sm font-semibold text-gray-700">
                    {searchChambres} Chambre{searchChambres > 1 ? "s" : ""}, {searchAdultes} Adulte{searchAdultes > 1 ? "s" : ""}, {searchEnfants} Enfant{searchEnfants > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                document.querySelector(".sticky")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-4 py-2 rounded-lg text-xs border border-gray-200 transition"
            >
              ✏️ Modifier
            </button>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-8 text-center space-y-4">
              <div className="text-5xl">🎉</div>
              <h3 className="text-2xl font-bold text-green-800">Réservation envoyée !</h3>
              <p className="text-green-600 max-w-md mx-auto">Votre réservation a été enregistrée avec succès. Notre équipe vous contactera dans les plus brefs délais.</p>
              <div className="flex gap-3 justify-center pt-2">
                <Link
                  href="/reservations"
                  className="bg-[#e91e8c] text-white font-semibold px-6 py-3 rounded-xl hover:bg-[#d11a7e] transition-all"
                >
                  Voir mes réservations
                </Link>
                <button
                  onClick={() => setSuccess(false)}
                  className="bg-white border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:bg-gray-50 transition-all"
                >
                  Nouvelle réservation
                </button>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              {/* ⬇️ Un bloc "Chambre N" indépendant pour CHAQUE room du picker */}
              <div className="space-y-6">
                {rooms.map((room, roomIdx) => {
                  const options = getChambresForRoom(room);
                  const selectedId = selectedChambres[roomIdx];

                  return (
                    <div key={roomIdx} className="border border-gray-300 rounded-xl p-5 pt-7 relative bg-white">
                      <div className="absolute -top-3 left-4 bg-white px-2 flex items-center gap-1.5 text-xs font-bold text-gray-700">
                        <span>🛏️</span>
                        <span>
                          Chambre{roomIdx + 1}: {room.adults} Adulte{room.adults > 1 ? "s" : ""}
                          {room.childrenAges.length > 0 ? `, ${room.childrenAges.length} Enfant${room.childrenAges.length > 1 ? "s" : ""}` : ""}
                        </span>
                      </div>

                      {options.length === 0 ? (
                        <div className="text-center py-6 text-gray-400">
                          <p className="text-sm font-semibold">Aucune chambre disponible pour ces critères</p>
                          <p className="text-xs mt-1">({room.adults} adulte{room.adults > 1 ? "s" : ""}, {room.childrenAges.length} enfant{room.childrenAges.length > 1 ? "s" : ""})</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {options.map((chambre: Chambre) => {
                            const totalPrix = calculateChambreTotal(chambre, room);
                            const isSelected = selectedId === String(chambre.id);
                            const isDisponible = chambre.quantite > 0;

                            return (
                              <div
                                key={chambre.id}
                                className={`flex flex-wrap sm:flex-nowrap items-center justify-between gap-4 py-4 first:pt-0 last:pb-0 ${
                                  !isDisponible ? "opacity-50" : ""
                                }`}
                              >
                                {/* Sélection + Titre */}
                                <div className="flex items-center gap-3 min-w-[200px]">
                                  <button
                                    type="button"
                                    disabled={!isDisponible}
                                    onClick={() =>
                                      setSelectedChambres(prev => ({ ...prev, [roomIdx]: String(chambre.id) }))
                                    }
                                    className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
                                      isSelected
                                        ? "bg-[#e91e8c] border-[#e91e8c] text-white"
                                        : "border-gray-300 hover:border-[#e91e8c] bg-white"
                                    }`}
                                  >
                                    {isSelected && <span className="text-[10px] font-bold">✓</span>}
                                  </button>
                                  <div>
                                    <span className="font-semibold text-gray-800 text-sm">{chambre.nom}</span>
                                    <span className="text-gray-400 text-xs block mt-0.5">👥 {chambre.capacite_adultes} adultes</span>
                                  </div>
                                </div>

                                {/* Dropdown Pension */}
                                <div className="w-48">
                                  <select
                                    value={selectedPensions[chambre.id] || (chambre.pensions && chambre.pensions[0]?.id) || ""}
                                    onChange={(e) => {
                                      setSelectedPensions(prev => ({
                                        ...prev,
                                        [chambre.id]: Number(e.target.value)
                                      }));
                                    }}
                                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:ring-1 focus:ring-[#e91e8c] focus:outline-none"
                                  >
                                    {chambre.pensions?.map((p) => (
                                      <option key={p.id} value={p.id}>
                                        {p.nom} {p.pivot.supplement_prix > 0 ? `(+${p.pivot.supplement_prix} DT)` : ""}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                {/* Disponibilité */}
                                <div>
                                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                    isDisponible ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"
                                  }`}>
                                    {isDisponible ? "Disponible" : "Complet"}
                                  </span>
                                </div>

                                {/* Prix total de la ligne */}
                                <div className="text-right min-w-[100px]">
                                  <span className="text-gray-800 font-extrabold text-base">{totalPrix}</span>
                                  <span className="text-[10px] text-gray-400 font-bold align-super ml-0.5">TND</span>
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

              {/* Résumé prix total et actions en bas — basé sur TOUTES les chambres sélectionnées */}
              {allRoomsHaveSelection && grandTotal > 0 && (
                <div className="flex flex-col items-end pt-4 space-y-4">
                  <div className="text-right space-y-1">
                    <span className="inline-block bg-pink-100 border border-pink-200 text-[#e91e8c] text-[10px] font-bold px-2 py-0.5 rounded">
                      -{discountTotal} TND
                    </span>

                    <div className="flex items-baseline justify-end gap-2">
                      <span className="text-sm font-semibold text-gray-500">Prix Total:</span>
                      <span className="text-sm text-gray-400 line-through font-semibold">{originalTotal} TND</span>
                      <span className="text-2xl font-extrabold text-[#e91e8c]">{grandTotal} TND</span>
                    </div>

                    <p className="text-[10px] text-gray-400">Des frais peuvent s'appliquer</p>
                    <p className="text-[11px] text-red-500 font-semibold flex items-center justify-end gap-1">
                      🚫 Non modifiable, non remboursable
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 w-full">
                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReservationClick("agence")}
                      className="flex items-center justify-center gap-2 border border-[#e91e8c] text-[#e91e8c] hover:bg-pink-50 font-bold text-sm px-6 py-3 rounded-xl transition flex-1 sm:flex-none"
                    >
                      🏪 Je passe à l'agence
                    </button>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={() => handleReservationClick("deposit")}
                      className="flex items-center justify-center gap-2 bg-[#e91e8c] hover:bg-[#d11a7e] text-white font-bold text-sm px-6 py-3 rounded-xl transition shadow-md flex-grow sm:flex-grow-0"
                    >
                      💳 Je paye {depositAmount} TND et le reste à l'hôtel
                    </button>
                  </div>

                  <div className="w-full text-center text-xs text-gray-400 font-semibold flex items-center justify-center gap-1">
                    <span>🔒</span> Paiement 100% sécurisé
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}