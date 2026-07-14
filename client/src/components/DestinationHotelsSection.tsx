"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

/* ============ Types (calqués sur votre JSON réel) ============ */
interface PensionPivot {
  supplement_prix: number;
}
interface Pension {
  id: number;
  nom: string;
  pivot: PensionPivot;
}
interface Chambre {
  id: number;
  hotel_id: number;
  type: string;
  nom: string;
  prix_base_nuit: number;
  capacite_adultes: number;
  capacite_enfants: number;
  quantite: number;
  pensions: Pension[];
}
interface Hotel {
  id: number;
  destination_id: number;
  nom: string;
  prix_par_nuit: number;
  etoiles: number;
  description: string;
  image: string;
  disponible: number;
  chambres: Chambre[];
}

interface Props {
  hotels: Hotel[];
  nbNuits: number;
  chambresDemandees: number;
  destinationNom: string;
  arrivee?: string;
  depart?: string;
  adultes?: number;
  enfants?: number;
}

/* ============ Carte hôtel détaillée (chambres + pensions) ============ */
function HotelCardDetailed({
  hotel,
  nbNuits,
  chambresDemandees,
  arrivee,
  depart,
  adultes,
  enfants,
}: {
  hotel: Hotel;
  nbNuits: number;
  chambresDemandees: number;
  arrivee?: string;
  depart?: string;
  adultes?: number;
  enfants?: number;
}) {
  const queryParams = new URLSearchParams();
  if (arrivee) queryParams.set("arrivee", arrivee);
  if (depart) queryParams.set("depart", depart);
  if (adultes !== undefined) queryParams.set("adultes", String(adultes));
  if (enfants !== undefined) queryParams.set("enfants", String(enfants));
  if (chambresDemandees !== undefined) queryParams.set("chambres", String(chambresDemandees));

  const detailLink = `/hotels/${hotel.id}?${queryParams.toString()}`;
  // Liste unique des pensions offertes par cet hôtel (union sur toutes les chambres)
  const pensionsDisponibles = useMemo(() => {
    const map = new Map<number, string>();
    hotel.chambres.forEach((ch) =>
      ch.pensions.forEach((p) => map.set(p.id, p.nom))
    );
    return Array.from(map.entries())
      .map(([id, nom]) => ({ id, nom }))
      .sort((a, b) => a.id - b.id);
  }, [hotel]);

  // Smart room selection: find best match for the requested number of adults
  const bestMatchingChambre = useMemo(() => {
    const demandAdultes = adultes ?? 1;
    const roomsOfExactCapacity = hotel.chambres.filter(c => c.capacite_adultes === demandAdultes);
    const dispos = roomsOfExactCapacity.filter(c => c.quantite > 0);
    return dispos[0] ?? roomsOfExactCapacity[0] ?? hotel.chambres[0];
  }, [hotel, adultes]);

  const [selectedChambreId, setSelectedChambreId] = useState<number | null>(
    bestMatchingChambre?.id ?? null
  );
  const [activePensionId, setActivePensionId] = useState<number | null>(
    pensionsDisponibles[0]?.id ?? null
  );

  // ⚡ SYNC FIX: when adultes/enfants change (client-side navigation),
  // React keeps the component mounted so useState keeps the old value.
  // This useEffect ensures selectedChambreId re-syncs with the new best match.
  useEffect(() => {
    if (bestMatchingChambre?.id !== undefined) {
      setSelectedChambreId(bestMatchingChambre.id);
    }
  }, [bestMatchingChambre?.id]);

  const selectedChambre = hotel.chambres.find((c) => c.id === selectedChambreId);

  // Si la chambre change et ne propose pas la pension active, on bascule sur la 1ère dispo pour cette chambre
  useEffect(() => {
    if (!selectedChambre) return;
    const dispoIds = selectedChambre.pensions.map((p) => p.id);
    if (activePensionId && !dispoIds.includes(activePensionId)) {
      setActivePensionId(selectedChambre.pensions[0]?.id ?? null);
    }
  }, [selectedChambreId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pensionActivePourChambre = selectedChambre?.pensions.find(
    (p) => p.id === activePensionId
  );

  const supplement = pensionActivePourChambre?.pivot.supplement_prix ?? 0;
  const prixNuit = (selectedChambre?.prix_base_nuit ?? hotel.prix_par_nuit) + supplement;
  const total = prixNuit * nbNuits * chambresDemandees;

  const renderStars = (nb: number) => (
    <span className="text-yellow-400 text-sm">
      {"⭐".repeat(nb)}
    </span>
  );

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-shadow border border-gray-100">
      <div className="flex flex-col md:flex-row">
        {/* Image */}
        <div className="relative w-full md:w-64 h-52 md:h-auto flex-shrink-0 overflow-hidden">
          <img
            src={hotel.image}
            alt={hotel.nom}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Contenu */}
        <div className="flex-grow p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <Link
                href={detailLink}
                className="font-bold text-lg text-[#1a1a2e] underline decoration-1 underline-offset-2 hover:text-[#e91e8c] transition-colors"
              >
                {hotel.nom}
              </Link>
              <div className="mt-1">{renderStars(hotel.etoiles)}</div>
              <p className="text-gray-500 text-xs mt-2 line-clamp-2 max-w-md">
                {hotel.description}
              </p>
            </div>

            {/* Prix */}
            <div className="text-right whitespace-nowrap">
              <p className="text-gray-400 text-[10px]">à partir de*</p>
              <p className="text-[#e91e8c] font-extrabold text-2xl leading-none">
                {total} <span className="text-sm">TND</span>
              </p>
              <p className="text-gray-400 text-[10px] mt-1">
                {nbNuits} nuit{nbNuits > 1 ? "s" : ""} · {chambresDemandees} ch.
              </p>
            </div>
          </div>

          {/* Onglets Pension */}
          {pensionsDisponibles.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-4 border-b border-gray-100">
              {pensionsDisponibles.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePensionId(p.id)}
                  className={`px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                    activePensionId === p.id
                      ? "border-[#e91e8c] text-[#e91e8c]"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {p.nom}
                </button>
              ))}
            </div>
          )}

          {/* Tableau des chambres */}
          <div className="mt-3 space-y-2">
            {hotel.chambres
              .filter((chambre) => {
                const reqAdultes = adultes ?? 1;
                return chambre.capacite_adultes === reqAdultes;
              })
              .map((chambre) => {
                const pensionPourCetteChambre = chambre.pensions.find(
                  (p) => p.id === activePensionId
                );
                const prixCetteChambre =
                  chambre.prix_base_nuit + (pensionPourCetteChambre?.pivot.supplement_prix ?? 0);
                const estDisponible = chambre.quantite > 0;

              return (
                <label
                  key={chambre.id}
                  className={`flex items-center justify-between gap-3 px-3 py-2 rounded-xl border text-sm transition-colors ${
                    !estDisponible
                      ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      : selectedChambreId === chambre.id
                      ? "border-[#e91e8c] bg-[#e91e8c]/5 cursor-pointer"
                      : "border-gray-200 hover:border-gray-300 cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name={`room-${hotel.id}`}
                      disabled={!estDisponible}
                      checked={selectedChambreId === chambre.id}
                      onChange={() => setSelectedChambreId(chambre.id)}
                      className="accent-[#e91e8c]"
                    />
                    <div>
                      <p className="font-semibold text-[#1a1a2e]">{chambre.nom}</p>
                      <p className="text-gray-400 text-[11px]">
                        👤 {chambre.capacite_adultes} adulte{chambre.capacite_adultes > 1 ? "s" : ""}
                        {(enfants ?? 0) > 0 && chambre.capacite_enfants > 0 &&
                          ` · 🧒 ${chambre.capacite_enfants} enfant${chambre.capacite_enfants > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>

                  <div className="text-right flex items-center gap-3">
                    <span
                      className={`text-[10px] font-semibold ${
                        estDisponible ? "text-green-600" : "text-gray-400"
                      }`}
                    >
                      {estDisponible ? "Disponible" : "Complet"}
                    </span>
                    <span className="font-bold text-[#1a1a2e] text-sm whitespace-nowrap">
                      {prixCetteChambre} DT<span className="text-gray-400 font-normal">/nuit</span>
                    </span>
                  </div>
                </label>
              );
            })}
          </div>

          <div className="flex justify-end mt-4">
            <Link
              href={detailLink}
              className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-md hover:shadow-[#e91e8c]/35 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all"
            >
              Voir détails →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============ Section complète : sidebar filtres + liste ============ */
export default function DestinationHotelsSection({
  hotels,
  nbNuits,
  chambresDemandees,
  destinationNom,
  arrivee,
  depart,
  adultes,
  enfants,
}: Props) {
  const [searchNom, setSearchNom] = useState("");
  const [selectedEtoiles, setSelectedEtoiles] = useState<Set<number>>(new Set());
  const [selectedPensions, setSelectedPensions] = useState<Set<number>>(new Set());

  // Compteurs "Catégories" (étoiles)
  const etoilesOptions = useMemo(() => {
    const counts = new Map<number, number>();
    hotels.forEach((h) => counts.set(h.etoiles, (counts.get(h.etoiles) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([etoiles, count]) => ({ etoiles, count }))
      .sort((a, b) => b.etoiles - a.etoiles);
  }, [hotels]);

  // Compteurs "Formule" (pensions)
  const pensionsOptions = useMemo(() => {
    const map = new Map<number, { nom: string; count: number }>();
    hotels.forEach((h) => {
      const pensionsDeCetHotel = new Set<number>();
      h.chambres.forEach((c) => c.pensions.forEach((p) => pensionsDeCetHotel.add(p.id)));
      const nomsMap = new Map<number, string>();
      h.chambres.forEach((c) => c.pensions.forEach((p) => nomsMap.set(p.id, p.nom)));

      pensionsDeCetHotel.forEach((id) => {
        const existant = map.get(id);
        map.set(id, {
          nom: nomsMap.get(id) ?? "",
          count: (existant?.count ?? 0) + 1,
        });
      });
    });
    return Array.from(map.entries())
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => a.id - b.id);
  }, [hotels]);

  const toggleEtoile = (val: number) => {
    setSelectedEtoiles((prev) => {
      const next = new Set(prev);
      next.has(val) ? next.delete(val) : next.add(val);
      return next;
    });
  };

  const togglePension = (id: number) => {
    setSelectedPensions((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hotelsFiltres = useMemo(() => {
    return hotels.filter((h) => {
      if (searchNom && !h.nom.toLowerCase().includes(searchNom.toLowerCase())) {
        return false;
      }
      if (selectedEtoiles.size > 0 && !selectedEtoiles.has(h.etoiles)) {
        return false;
      }
      if (selectedPensions.size > 0) {
        const offrePensionSelectionnee = h.chambres.some((c) =>
          c.pensions.some((p) => selectedPensions.has(p.id))
        );
        if (!offrePensionSelectionnee) return false;
      }
      // Hide hotel if it doesn't have any room matching the requested adults capacity
      const hasCompatibleRoom = h.chambres.some((c) => {
        const reqAdultes = adultes ?? 1;
        return c.capacite_adultes === reqAdultes;
      });
      if (!hasCompatibleRoom) return false;

      return true;
    });
  }, [hotels, searchNom, selectedEtoiles, selectedPensions, adultes, enfants]);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar */}
      <aside className="w-full md:w-[280px] flex-shrink-0 space-y-6">
        <div>
          <p className="font-bold text-sm text-[#1a1a2e] mb-2">Nom d'hôtel</p>
          <input
            type="text"
            value={searchNom}
            onChange={(e) => setSearchNom(e.target.value)}
            placeholder="Veuillez saisir le nom d'hôtel"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-[#e91e8c]"
          />
        </div>

        {etoilesOptions.length > 0 && (
          <div>
            <p className="font-bold text-sm text-[#1a1a2e] mb-2">Catégories</p>
            <div className="space-y-1.5">
              {etoilesOptions.map(({ etoiles, count }) => (
                <label
                  key={etoiles}
                  className="flex items-center justify-between text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedEtoiles.has(etoiles)}
                      onChange={() => toggleEtoile(etoiles)}
                      className="accent-[#e91e8c]"
                    />
                    <span className="text-yellow-400 text-xs">
                      {"★".repeat(etoiles)}
                      <span className="text-gray-300">{"★".repeat(5 - etoiles)}</span>
                    </span>
                  </span>
                  <span className="text-gray-400 text-xs">({count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {pensionsOptions.length > 0 && (
          <div>
            <p className="font-bold text-sm text-[#1a1a2e] mb-2">Formule</p>
            <div className="space-y-1.5">
              {pensionsOptions.map(({ id, nom, count }) => (
                <label
                  key={id}
                  className="flex items-center justify-between text-sm cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedPensions.has(id)}
                      onChange={() => togglePension(id)}
                      className="accent-[#e91e8c]"
                    />
                    <span className="text-gray-700">{nom}</span>
                  </span>
                  <span className="text-gray-400 text-xs">({count})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {(searchNom || selectedEtoiles.size > 0 || selectedPensions.size > 0) && (
          <button
            onClick={() => {
              setSearchNom("");
              setSelectedEtoiles(new Set());
              setSelectedPensions(new Set());
            }}
            className="text-xs text-[#e91e8c] font-semibold hover:underline"
          >
            ✕ Réinitialiser les filtres
          </button>
        )}
      </aside>

      {/* Liste des hôtels */}
      <div className="flex-grow">
        <p className="text-gray-400 text-sm mb-4">
          {hotelsFiltres.length} hôtel{hotelsFiltres.length > 1 ? "s" : ""} trouvé
          {hotelsFiltres.length > 1 ? "s" : ""} à {destinationNom}
        </p>

        <div className="space-y-6">
          {hotelsFiltres.length > 0 ? (
            hotelsFiltres.map((hotel) => (
              <HotelCardDetailed
                key={hotel.id}
                hotel={hotel}
                nbNuits={nbNuits}
                chambresDemandees={chambresDemandees}
                arrivee={arrivee}
                depart={depart}
                adultes={adultes}
                enfants={enfants}
              />
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-lg text-[#1a1a2e] mb-2">Aucun hôtel trouvé</h3>
              <p className="text-gray-500 text-sm">Essayez de modifier vos filtres.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}