"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ─────────────── Types ─────────────── */
interface Destination { id: number; nom: string; region: string; }
interface SearchBoxAdvancedProps { destinations: Destination[]; }
interface Room { adults: number; childrenAges: number[]; }

/* ─────────────── Calendar helpers ─────────────── */
const MONTHS_FR = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const DAYS_FR   = ["Lu","Ma","Me","Je","Ve","Sa","Di"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  // Monday-based: 0=Mon … 6=Sun
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

/* ─────────────── Mini calendar ─────────────── */
function MonthCalendar({
  year, month, startDate, endDate, hoverDate,
  onDayClick, onDayHover, today
}: {
  year: number; month: number;
  startDate: Date|null; endDate: Date|null; hoverDate: Date|null;
  onDayClick:(d:Date)=>void; onDayHover:(d:Date|null)=>void;
  today: Date;
}) {
  const daysCount  = getDaysInMonth(year, month);
  const firstWeekDay = getFirstDayOfWeek(year, month);
  const cells: (Date|null)[] = Array(firstWeekDay).fill(null);
  for (let i = 1; i <= daysCount; i++) cells.push(new Date(year, month, i));

  const rangeEnd = endDate ?? hoverDate;

  return (
    <div className="w-[260px]">
      <p className="text-center font-bold text-sm text-[#1a1a2e] mb-3">
        {MONTHS_FR[month]} {year}
      </p>
      <div className="grid grid-cols-7 mb-1">
        {DAYS_FR.map(d => (
          <span key={d} className="text-[0.65rem] text-gray-400 font-semibold text-center">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-[2px]">
        {cells.map((date, i) => {
          if (!date) return <span key={`e-${i}`} />;

          const isPast    = date < today && !isSameDay(date, today);
          const isStart   = startDate && isSameDay(date, startDate);
          const isEnd     = rangeEnd && startDate && isSameDay(date, rangeEnd);
          const inRange   = startDate && rangeEnd && startDate < rangeEnd && isBetween(date, startDate, rangeEnd);
          const isToday   = isSameDay(date, today);

          let cls = "relative h-8 flex items-center justify-center text-xs cursor-pointer select-none transition-all ";

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

/* ─────────────── Main component ─────────────── */
export default function SearchBoxAdvanced({ destinations }: SearchBoxAdvancedProps) {
  const router = useRouter();
  const today  = new Date(); today.setHours(0,0,0,0);

  const [destinationId, setDestinationId]     = useState("");
  const [startDate,     setStartDate]         = useState<Date|null>(null);
  const [endDate,       setEndDate]           = useState<Date|null>(null);
  const [hoverDate,     setHoverDate]         = useState<Date|null>(null);
  const [calOpen,       setCalOpen]           = useState(false);
  const [selectingEnd,  setSelectingEnd]      = useState(false);

  // Calendar view: left month
  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [rooms, setRooms]           = useState<Room[]>([{ adults: 2, childrenAges: [] }]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const calRef      = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* close on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (calRef.current && !calRef.current.contains(e.target as Node)) setCalOpen(false);
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

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
    if (!startDate || selectingEnd === false && !startDate) {
      // first click
      setStartDate(date);
      setEndDate(null);
      setSelectingEnd(true);
      return;
    }
    if (selectingEnd) {
      if (date < startDate) {
        setStartDate(date);
        setEndDate(null);
      } else if (isSameDay(date, startDate)) {
        // same day – reset
        setStartDate(date);
        setEndDate(null);
      } else {
        setEndDate(date);
        setSelectingEnd(false);
        setCalOpen(false);
      }
      return;
    }
    // re-open selection
    setStartDate(date);
    setEndDate(null);
    setSelectingEnd(true);
  };

  const formatLabel = (d: Date|null) =>
    d ? `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}` : "jj/mm/aaaa";

  /* rooms helpers */
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

  /* submit */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationId || !startDate || !endDate) return;
    const params = new URLSearchParams({
      arrivee: toDateString(startDate),
      depart:  toDateString(endDate),
      adultes: totalAdults.toString(),
      enfants: totalChildren.toString(),
      chambres: totalRooms.toString(),
    });
    router.push(`/destinations/${destinationId}?${params.toString()}`);
  };

  const inputBase = "border-none text-base font-semibold text-gray-700 outline-none bg-transparent cursor-pointer p-0 w-full";
  const labelBase = "text-[0.7rem] font-bold text-gray-500 uppercase tracking-wider mb-1";
  const sectionBase = "flex items-center px-5 py-3 flex-1 hover:bg-[#e91e8c]/5 rounded-[20px] transition-all duration-200";
  const divider = <div className="hidden lg:block w-[1px] h-12 bg-gray-200" />;

  return (
    <div className="bg-white rounded-[30px] p-6 md:p-8 w-full max-w-[1100px] shadow-2xl mt-8 mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 lg:gap-0">

        {/* 1. Destination */}
        <div className={sectionBase}>
          <span className="text-2xl mr-4">📍</span>
          <div className="flex flex-col w-full">
            <label className={labelBase}>Où allez-vous ?</label>
            <select
              value={destinationId}
              onChange={e => setDestinationId(e.target.value)}
              className={inputBase}
              required
            >
              <option value="">Sélectionner une ville...</option>
              {destinations.map(dest => (
                <option key={dest.id} value={dest.id}>{dest.nom} ({dest.region})</option>
              ))}
            </select>
          </div>
        </div>

        {divider}

        {/* 2 & 3. Calendar trigger (Arrivée + Départ) */}
        <div className="relative flex-[2]" ref={calRef}>
          <div
            className="flex items-center gap-0 cursor-pointer"
            onClick={() => { setCalOpen(v => !v); if (!startDate) setSelectingEnd(false); }}
          >
            {/* Arrivée */}
            <div className={`${sectionBase} flex-1`}>
              <span className="text-2xl mr-4">📅</span>
              <div className="flex flex-col w-full">
                <label className={labelBase}>Arrivée</label>
                <span className={`${inputBase} ${startDate ? "" : "text-gray-400"}`}>
                  {formatLabel(startDate)}
                </span>
              </div>
            </div>
            <div className="hidden lg:block w-[1px] h-12 bg-gray-200" />
            {/* Départ */}
            <div className={`${sectionBase} flex-1`}>
              <span className="text-2xl mr-4">📅</span>
              <div className="flex flex-col w-full">
                <label className={labelBase}>Départ</label>
                <span className={`${inputBase} ${endDate ? "" : "text-gray-400"}`}>
                  {formatLabel(endDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Calendar popup */}
          {calOpen && (
            <div className="absolute left-0 top-[72px] z-[300] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
              {/* hint */}
              <p className="text-xs text-center text-gray-500 mb-4">
                {!startDate || !selectingEnd
                  ? "Sélectionnez la date d'arrivée"
                  : "Sélectionnez la date de départ"}
              </p>

              <div className="flex gap-8">
                {/* nav left */}
                <div className="flex flex-col">
                  <button type="button" onClick={prevMonth}
                    className="self-start text-gray-400 hover:text-[#e91e8c] text-xl px-1 mb-2">‹</button>
                  <MonthCalendar
                    year={viewYear} month={viewMonth}
                    startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                    onDayClick={handleDayClick} onDayHover={setHoverDate} today={today}
                  />
                </div>
                {/* nav right */}
                <div className="flex flex-col">
                  <button type="button" onClick={nextMonth}
                    className="self-end text-gray-400 hover:text-[#e91e8c] text-xl px-1 mb-2">›</button>
                  <MonthCalendar
                    year={rightYear} month={rightMonth}
                    startDate={startDate} endDate={endDate} hoverDate={hoverDate}
                    onDayClick={handleDayClick} onDayHover={setHoverDate} today={today}
                  />
                </div>
              </div>

              {/* Reset */}
              {(startDate || endDate) && (
                <button type="button"
                  onClick={() => { setStartDate(null); setEndDate(null); setSelectingEnd(false); }}
                  className="mt-3 w-full text-xs text-gray-400 hover:text-[#e91e8c] transition-colors"
                >
                  Effacer les dates
                </button>
              )}
            </div>
          )}
        </div>

        {divider}

        {/* 4. Voyageurs dropdown */}
        <div className="relative flex-1" ref={dropdownRef}>
          <div
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`${sectionBase} cursor-pointer`}
          >
            <span className="text-2xl mr-4">🧑‍🤝‍🧑</span>
            <div className="flex flex-col w-full">
              <label className={labelBase}>Voyageurs</label>
              <span className={inputBase}>
                {totalRooms} Ch. / {totalAdults} Ad. / {totalChildren} Enf.
              </span>
            </div>
          </div>

          {dropdownOpen && (
            <div className="absolute right-0 top-[80px] bg-white rounded-2xl shadow-2xl border border-gray-100 w-[340px] z-[200] overflow-hidden">
              <div className="max-h-[400px] overflow-y-auto p-4 space-y-4">
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
                      <span className="text-gray-700 font-medium">Adulte(s) <span className="text-gray-400 text-xs">18+</span></span>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => updateAdults(rIdx, -1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] font-bold">−</button>
                        <span className="font-bold w-4 text-center">{room.adults}</span>
                        <button type="button" onClick={() => updateAdults(rIdx, 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] font-bold">+</button>
                      </div>
                    </div>

                    {/* Children counter */}
                    <div className="flex justify-between items-center text-sm mb-2">
                      <div>
                        <span className="text-gray-700 font-medium">Enfant(s)</span>
                        <span className="text-gray-400 text-xs block">0 – 17 ans</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button type="button" onClick={() => removeChild(rIdx)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] font-bold">−</button>
                        <span className="font-bold w-4 text-center">{room.childrenAges.length}</span>
                        <button type="button" onClick={() => addChild(rIdx)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-[#e91e8c] hover:text-[#e91e8c] font-bold">+</button>
                      </div>
                    </div>

                    {/* Age pickers per child */}
                    {room.childrenAges.length > 0 && (
                      <div className="mt-2 space-y-2 pl-1">
                        {room.childrenAges.map((age, cIdx) => (
                          <div key={cIdx} className="flex items-center justify-between">
                            <label className="text-xs text-gray-500">Enfant {cIdx + 1} – âge</label>
                            <select
                              value={age}
                              onChange={e => setChildAge(rIdx, cIdx, Number(e.target.value))}
                              className="text-sm font-semibold text-[#1a1a2e] border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-[#e91e8c] cursor-pointer"
                            >
                              {Array.from({ length: 18 }, (_, k) => (
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
                  className="w-full text-center py-3 text-sm font-semibold text-[#e91e8c] border-t border-gray-100 hover:bg-gray-50 transition-colors">
                  + Ajouter une chambre
                </button>
              )}

              <button type="button" onClick={() => setDropdownOpen(false)}
                className="w-[calc(100%-24px)] mx-3 mb-3 py-2 text-center text-sm font-bold text-white bg-gradient-to-r from-[#e91e8c] to-[#c2185b] rounded-xl shadow-lg hover:shadow-[#e91e8c]/35 transition-all">
                Valider
              </button>
            </div>
          )}
        </div>

        {/* 5. Bouton Rechercher */}
        <button
          type="submit"
          className="bg-gradient-to-r from-[#e91e8c] to-[#c2185b] hover:shadow-xl hover:shadow-[#e91e8c]/35 text-white px-8 py-4 lg:py-5 rounded-[20px] font-bold text-base tracking-wide transition-all transform hover:-translate-y-[2px] ml-0 lg:ml-4 whitespace-nowrap"
        >
          Rechercher
        </button>
      </form>
    </div>
  );
}
