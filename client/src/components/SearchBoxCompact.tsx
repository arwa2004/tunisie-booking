"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ─────────────── Types ─────────────── */
interface Destination {
  id: number;
  nom: string;
  region: string;
}

interface Room {
  adults: number;
  childrenAges: number[];
}

interface SearchBoxCompactProps {
  destinations: Destination[];
  currentDestinationId: number;
  initialArrivee?: string;
  initialDepart?: string;
  initialAdultes?: number;
  initialEnfants?: number;
  initialChambres?: number;
}

/* ─────────────── Calendar helpers ─────────────── */
const MONTHS_FR = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const DAYS_FR   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return (d + 6) % 7;
}
function toDateString(d: Date) {
  return d.toISOString().split("T")[0];
}
function parseDate(s: string) {
  if (!s) return null;
  const [y, m, day] = s.split("-").map(Number);
  return new Date(y, m - 1, day);
}
function isSameDay(a: Date, b: Date) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}
function isBetween(d: Date, start: Date, end: Date) {
  return d > start && d < end;
}
function formatDisplayDate(s: string) {
  if (!s) return "—";
  const d = parseDate(s);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

/* ─────────────── Mini calendar compact ─────────────── */
function MonthCalendarCompact({
  year, month, startDate, endDate, hoverDate,
  onDayClick, onDayHover, today
}: {
  year: number; month: number;
  startDate: Date|null; endDate: Date|null; hoverDate: Date|null;
  onDayClick:(d:Date)=>void; onDayHover:(d:Date|null)=>void;
  today: Date;
}) {
  const daysCount = getDaysInMonth(year, month);
  const firstWeekDay = getFirstDayOfWeek(year, month);
  const cells: (Date|null)[] = Array(firstWeekDay).fill(null);
  for (let i = 1; i <= daysCount; i++) cells.push(new Date(year, month, i));

  const rangeEnd = endDate ?? hoverDate;

  return (
    <div className="w-[220px]">
      <p className="text-center font-bold text-xs text-[#1a1a2e] mb-2">
        {MONTHS_FR[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map(d => (
          <span key={d} className="text-[0.55rem] text-gray-400 font-semibold text-center">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-[1px]">
        {cells.map((date, i) => {
          if (!date) return <span key={`e-${i}`} />;

          const isPast    = date < today && !isSameDay(date, today);
          const isStart   = startDate && isSameDay(date, startDate);
          const isEnd     = rangeEnd && startDate && isSameDay(date, rangeEnd);
          const inRange   = startDate && rangeEnd && startDate < rangeEnd && isBetween(date, startDate, rangeEnd);
          const isToday   = isSameDay(date, today);

          let cls = "relative h-7 flex items-center justify-center text-[0.65rem] cursor-pointer select-none transition-all ";

          if (isPast) {
            cls += "text-gray-300 cursor-not-allowed ";
          } else if (isStart || isEnd) {
            cls += "bg-[#e91e8c] text-white font-bold rounded-full z-10 ";
          } else if (inRange) {
            cls += "bg-[#e91e8c]/15 text-[#1a1a2e] ";
          } else if (isToday) {
            cls += "border border-[#e91e8c] text-[#e91e8c] font-bold rounded-full hover:bg-[#e91e8c]/10 ";
          } else {
            cls += "hover:bg-[#e91e8c]/10 text-gray-700 rounded-full ";
          }

          return (
            <div
              key={i}
              className={cls}
              onClick={() => !isPast && onDayClick(date)}
              onMouseEnter={() => !isPast && onDayHover(date)}
              onMouseLeave={() => onDayHover(null)}
            >
              {date.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────── Main compact component ─────────────── */
export default function SearchBoxCompact({
  destinations,
  currentDestinationId,
  initialArrivee = "",
  initialDepart = "",
  initialAdultes = 2,
  initialEnfants = 0,
  initialChambres = 1,
}: SearchBoxCompactProps) {
  const router = useRouter();
  const today  = new Date(); today.setHours(0,0,0,0);

  const [destinationId, setDestinationId] = useState(String(currentDestinationId));
  const [startDate, setStartDate]         = useState<Date|null>(parseDate(initialArrivee));
  const [endDate, setEndDate]             = useState<Date|null>(parseDate(initialDepart));
  const [hoverDate, setHoverDate]         = useState<Date|null>(null);
  const [calOpen, setCalOpen]             = useState(false);
  const [selectingEnd, setSelectingEnd]   = useState(false);
  const [voyOpen, setVoyOpen]             = useState(false);

  // Helper to build rooms array from total counts
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

  const [rooms, setRooms] = useState<Room[]>(() =>
    buildRoomsFromTotals(initialChambres, initialAdultes, initialEnfants)
  );

  // Calendar view
  const [viewYear,  setViewYear]  = useState(startDate?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(startDate?.getMonth() ?? today.getMonth());

  const calRef = useRef<HTMLDivElement>(null);
  const voyRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
      if (voyRef.current && !voyRef.current.contains(e.target as Node)) setVoyOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ⚡ SYNC FIX: When the user navigates via SearchBoxCompact (router.push),
     Next.js keeps this component mounted and just updates props.
     useState keeps the old values, so we must manually re-sync from props. */
  useEffect(() => {
    setDestinationId(String(currentDestinationId));
  }, [currentDestinationId]);

  useEffect(() => {
    const d = parseDate(initialArrivee);
    setStartDate(d);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [initialArrivee]);

  useEffect(() => {
    setEndDate(parseDate(initialDepart));
  }, [initialDepart]);

  useEffect(() => {
    setRooms(buildRoomsFromTotals(initialChambres, initialAdultes, initialEnfants));
  }, [initialChambres, initialAdultes, initialEnfants]);

  const addRoom = () => { if (rooms.length < 5) setRooms([...rooms, { adults: 2, childrenAges: [] }]); };
  const removeRoom = (i: number) => { if (rooms.length > 1) setRooms(rooms.filter((_,idx)=>idx!==i)); };

  const updateAdults = (idx: number, delta: number) =>
    setRooms(rooms.map((r,i) => i===idx ? { ...r, adults: Math.max(1, Math.min(4, r.adults+delta)) } : r));

  const addChild = (idx: number) =>
    setRooms(rooms.map((r,i) => i===idx && r.childrenAges.length<3 ? { ...r, childrenAges:[...r.childrenAges, 8] } : r));

  const removeChild = (idx: number) =>
    setRooms(rooms.map((r,i) => i===idx && r.childrenAges.length>0
      ? { ...r, childrenAges: r.childrenAges.slice(0,-1) } : r));

  const setChildAge = (roomIdx: number, childIdx: number, age: number) =>
    setRooms(rooms.map((r,i) => {
      if (i!==roomIdx) return r;
      const ages = [...r.childrenAges];
      ages[childIdx] = age;
      return { ...r, childrenAges: ages };
    }));

  const totalAdults   = rooms.reduce((s,r) => s+r.adults, 0);
  const totalChildren = rooms.reduce((s,r) => s+r.childrenAges.length, 0);
  const totalRooms    = rooms.length;


  /* right month = left + 1 */
  const rightMonth = viewMonth === 11 ? 0 : viewMonth + 1;
  const rightYear  = viewMonth === 11 ? viewYear + 1 : viewYear;

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  /* day click logic */
  const handleDayClick = (date: Date) => {
    if (!startDate || !selectingEnd) {
      setStartDate(date);
      setEndDate(null);
      setSelectingEnd(true);
      return;
    }
    if (date < startDate || isSameDay(date, startDate)) {
      setStartDate(date);
      setEndDate(null);
    } else {
      setEndDate(date);
      setSelectingEnd(false);
      setCalOpen(false);
    }
  };

  /* submit */
  const handleSearch = () => {
    if (!destinationId || !startDate || !endDate) return;
    const params = new URLSearchParams({
      arrivee: toDateString(startDate),
      depart:  toDateString(endDate),
      adultes: String(totalAdults),
      enfants: String(totalChildren),
      chambres: String(totalRooms),
    });
    router.push(`/destinations/${destinationId}?${params.toString()}`);
  };

  const nbNuits = startDate && endDate
    ? Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / (1000*60*60*24)))
    : 0;

  const isReady = !!destinationId && !!startDate && !!endDate;

  return (
    <div className="bg-white border border-gray-100 shadow-lg rounded-2xl px-4 py-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0 w-full">

      {/* Destination */}
      <div className="flex items-center gap-2 flex-1 md:px-3 md:border-r border-gray-200">
        <span className="text-base shrink-0">📍</span>
        <div className="flex flex-col w-full">
          <span className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider">Destination</span>
          <select
            value={destinationId}
            onChange={e => setDestinationId(e.target.value)}
            className="text-sm font-semibold text-[#1a1a2e] bg-transparent border-none outline-none cursor-pointer w-full truncate"
          >
            {destinations.map(d => (
              <option key={d.id} value={d.id}>{d.nom}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar trigger */}
      <div className="relative flex-[1.4]" ref={calRef}>
        <div
          className="flex items-center gap-0 cursor-pointer"
          onClick={() => { setCalOpen(v => !v); if (!startDate) setSelectingEnd(false); }}
        >
          {/* Arrivée */}
          <div className="flex items-center gap-2 flex-1 px-3 md:border-r border-gray-200 py-1">
            <span className="text-base shrink-0">🗓️</span>
            <div>
              <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider">Arrivée</p>
              <p className={`text-sm font-semibold ${startDate ? "text-[#1a1a2e]" : "text-gray-300"}`}>
                {startDate ? formatDisplayDate(toDateString(startDate)) : "jj/mm/aaaa"}
              </p>
            </div>
          </div>
          {/* Départ */}
          <div className="flex items-center gap-2 flex-1 px-3 md:border-r border-gray-200 py-1">
            <span className="text-base shrink-0">🗓️</span>
            <div>
              <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider">Départ</p>
              <p className={`text-sm font-semibold ${endDate ? "text-[#1a1a2e]" : "text-gray-300"}`}>
                {endDate ? formatDisplayDate(toDateString(endDate)) : "jj/mm/aaaa"}
              </p>
            </div>
          </div>
        </div>

        {/* Calendar popup */}
        {calOpen && (
          <div className="absolute left-0 top-[calc(100%+8px)] z-[300] bg-white rounded-2xl shadow-2xl border border-gray-100 p-4">
            <p className="text-xs text-center text-gray-400 mb-3">
              {!startDate || !selectingEnd ? "Sélectionnez l'arrivée" : "Sélectionnez le départ"}
            </p>
            <div className="flex gap-6">
              <div className="flex flex-col">
                <button type="button" onClick={prevMonth} className="self-start text-gray-400 hover:text-[#e91e8c] text-lg px-1 mb-1">‹</button>
                <MonthCalendarCompact
                  year={viewYear} month={viewMonth}
                  startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                  onDayClick={handleDayClick} onDayHover={setHoverDate} today={today}
                />
              </div>
              <div className="flex flex-col">
                <button type="button" onClick={nextMonth} className="self-end text-gray-400 hover:text-[#e91e8c] text-lg px-1 mb-1">›</button>
                <MonthCalendarCompact
                  year={rightYear} month={rightMonth}
                  startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                  onDayClick={handleDayClick} onDayHover={setHoverDate} today={today}
                />
              </div>
            </div>
            {nbNuits > 0 && (
              <p className="text-center text-xs text-[#e91e8c] font-semibold mt-2">
                {nbNuits} nuit{nbNuits > 1 ? "s" : ""}
              </p>
            )}
            {(startDate || endDate) && (
              <button type="button"
                onClick={() => { setStartDate(null); setEndDate(null); setSelectingEnd(false); }}
                className="mt-2 w-full text-xs text-gray-400 hover:text-[#e91e8c] transition-colors"
              >
                Effacer les dates
              </button>
            )}
          </div>
        )}
      </div>

      {/* Voyageurs */}
      <div className="relative flex-1" ref={voyRef}>
        <div
          onClick={() => setVoyOpen(!voyOpen)}
          className="flex items-center gap-2 px-3 py-1 cursor-pointer"
        >
          <span className="text-base shrink-0">🧑‍🤝‍🧑</span>
          <div>
            <p className="text-[0.6rem] font-bold text-gray-400 uppercase tracking-wider">Voyageurs</p>
            <p className="text-sm font-semibold text-[#1a1a2e]">
              {totalRooms} Ch. / {totalAdults} Ad. / {totalChildren} Enf.
            </p>
          </div>
        </div>

        {voyOpen && (
          <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-2xl shadow-2xl border border-gray-100 w-[300px] z-[200] overflow-hidden">
            <div className="max-h-[360px] overflow-y-auto p-4 space-y-4">
              {rooms.map((room, rIdx) => (
                <div key={rIdx} className="border-b border-gray-100 pb-4 last:border-none last:pb-0">
                  <div className="flex justify-between items-center mb-3">
                    <span className="font-bold text-sm text-[#1a1a2e]">Chambre {rIdx + 1}</span>
                    {rooms.length > 1 && (
                      <button type="button" onClick={() => removeRoom(rIdx)}
                        className="text-[#e91e8c] hover:bg-[#e91e8c]/10 text-xs px-2 py-1 rounded transition-colors">
                        Supprimer
                      </button>
                    )}
                  </div>

                  {/* Adults */}
                  <div className="flex justify-between items-center text-sm mb-3">
                    <span className="text-gray-700 font-medium">Adulte(s) <span className="text-gray-400 text-xs">max 4</span></span>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateAdults(rIdx, -1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors">−</button>
                      <span className="font-bold w-4 text-center text-sm">{room.adults}</span>
                      <button type="button" onClick={() => updateAdults(rIdx, 1)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors">+</button>
                    </div>
                  </div>

                  {/* Children counter */}
                  <div className="flex justify-between items-center text-sm mb-2">
                    <div>
                      <span className="text-gray-700 font-medium">Enfant(s)</span>
                      <span className="text-gray-400 text-xs block">max 3 / de 0 à 11 ans</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => removeChild(rIdx)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors">−</button>
                      <span className="font-bold w-4 text-center text-sm">{room.childrenAges.length}</span>
                      <button type="button" onClick={() => addChild(rIdx)}
                        className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] text-sm font-bold transition-colors">+</button>
                    </div>
                  </div>

                  {/* Age pickers per child */}
                  {room.childrenAges.length > 0 && (
                    <div className="mt-2 space-y-2 pl-1 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Âge(s) de l'enfant(s)</p>
                      {room.childrenAges.map((age, cIdx) => (
                        <div key={cIdx} className="flex items-center justify-between">
                          <label className="text-xs text-gray-500">Enfant {cIdx + 1}</label>
                          <select
                            value={age}
                            onChange={e => setChildAge(rIdx, cIdx, Number(e.target.value))}
                            className="text-xs font-semibold text-[#1a1a2e] border border-gray-200 rounded-lg px-2 py-0.5 outline-none focus:border-[#e91e8c] bg-white cursor-pointer"
                          >
                            {Array.from({ length: 12 }, (_, k) => (
                              <option key={k} value={k}>{k === 0 ? "< 1 an" : `${k} an${k > 1 ? "s" : ""}`}</option>
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
              <button type="button" onClick={addRoom}
                className="w-full text-center py-2.5 text-xs font-semibold text-[#e91e8c] border-t border-gray-100 hover:bg-gray-50 transition-colors">
                + Ajouter une chambre
              </button>
            )}

            <div className="p-3 border-t border-gray-100 bg-gray-50/20">
              <button
                type="button"
                onClick={() => setVoyOpen(false)}
                className="w-full py-2 text-sm font-bold text-white bg-gradient-to-r from-[#e91e8c] to-[#c2185b] rounded-xl shadow hover:shadow-lg transition-all"
              >
                Valider
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bouton Rechercher */}
      <button
        type="button"
        onClick={handleSearch}
        disabled={!isReady}
        className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] disabled:opacity-40 hover:shadow-lg hover:shadow-[#e91e8c]/35 text-white px-6 py-2.5 rounded-xl font-bold text-sm tracking-wide transition-all transform hover:-translate-y-[1px] whitespace-nowrap md:ml-3 shrink-0"
      >
        🔍 Rechercher
      </button>
    </div>
  );
}
