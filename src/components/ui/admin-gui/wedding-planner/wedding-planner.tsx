import { useMemo, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import {
  BellRing,
  CalendarDays,
  Camera,
  ChevronLeft,
  ChevronRight,
  Clock,
  HeartHandshake,
  ImagePlus,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { createClerkSupabaseClient } from "@/services";
import { Modal } from "@/components/ui";
import { uploadToCloudinary } from "../photo-editor/api/photo-actions";

type ClientStatus = "lead" | "contacted" | "meeting" | "booked" | "completed" | "declined";

interface WeddingClient {
  id: string;
  couple_names: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  wedding_date: string | null;
  wedding_time: string | null;
  venue: string | null;
  package: string | null;
  status: ClientStatus;
  notes: string | null;
  couple_photo_url: string | null;
  couple_photo_public_id: string | null;
  follow_up_date: string | null;
  created_at: string;
  updated_at: string;
}

interface ClientDraft {
  couple_names: string;
  contact_person: string;
  email: string;
  phone: string;
  wedding_date: string;
  wedding_time: string;
  venue: string;
  package: string;
  status: ClientStatus;
  notes: string;
  couple_photo_url: string;
  couple_photo_public_id: string;
  follow_up_date: string;
}

const STATUSES: ClientStatus[] = ["lead", "contacted", "meeting", "booked", "completed", "declined"];

const STATUS_META: Record<ClientStatus, { label: string; badge: string; dot: string }> = {
  lead: { label: "Ny förfrågan", badge: "border-stone-200 bg-stone-100 text-stone-600", dot: "bg-stone-400" },
  contacted: { label: "Kontaktad", badge: "border-sky-200 bg-sky-50 text-sky-700", dot: "bg-sky-500" },
  meeting: { label: "Möte bokat", badge: "border-amber-200 bg-amber-50 text-amber-700", dot: "bg-amber-500" },
  booked: { label: "Bokad", badge: "border-emerald-200 bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
  completed: { label: "Genomförd", badge: "border-violet-200 bg-violet-50 text-violet-700", dot: "bg-violet-500" },
  declined: { label: "Avböjd", badge: "border-rose-200 bg-rose-50 text-rose-700", dot: "bg-rose-400" },
};

const WEEKDAYS = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

const monthFormatter = new Intl.DateTimeFormat("sv-SE", { month: "long", year: "numeric" });
const longDateFormatter = new Intl.DateTimeFormat("sv-SE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});
const fullDateFormatter = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short", year: "numeric" });
const shortDateFormatter = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" });
const monthShortFormatter = new Intl.DateTimeFormat("sv-SE", { month: "short" });

const pad = (value: number) => String(value).padStart(2, "0");

const ymd = (date: Date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseYmd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const todayYmd = () => ymd(new Date());

const addDaysYmd = (value: string, days: number) => {
  const date = parseYmd(value);
  date.setDate(date.getDate() + days);
  return ymd(date);
};

const startOfWeekMonday = (date: Date) => {
  const result = new Date(date);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  result.setHours(0, 0, 0, 0);
  return result;
};

const formatLongDate = (value: string | null) => (value ? longDateFormatter.format(parseYmd(value)) : "Datum ej satt");

const formatFullDate = (value: string | null) => (value ? fullDateFormatter.format(parseYmd(value)) : "Datum ej satt");

const formatShortDate = (value: string | null) => (value ? shortDateFormatter.format(parseYmd(value)) : "");

const formatTime = (value: string | null) => (value ? value.slice(0, 5) : "");

const dateParts = (value: string) => {
  const date = parseYmd(value);
  return { day: date.getDate(), month: monthShortFormatter.format(date).replace(".", "").toUpperCase() };
};

const emptyToNull = (value: string) => {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toDraft = (client: WeddingClient | null, fallbackDate?: string): ClientDraft => ({
  couple_names: client?.couple_names ?? "",
  contact_person: client?.contact_person ?? "",
  email: client?.email ?? "",
  phone: client?.phone ?? "",
  wedding_date: client?.wedding_date ?? fallbackDate ?? "",
  wedding_time: formatTime(client?.wedding_time ?? null),
  venue: client?.venue ?? "",
  package: client?.package ?? "",
  status: client?.status ?? "lead",
  notes: client?.notes ?? "",
  couple_photo_url: client?.couple_photo_url ?? "",
  couple_photo_public_id: client?.couple_photo_public_id ?? "",
  follow_up_date: client?.follow_up_date ?? "",
});

export function WeddingPlanner({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayYmd);
  const [editing, setEditing] = useState<{ client: WeddingClient | null; date: string } | null>(null);
  const [removeTarget, setRemoveTarget] = useState<WeddingClient | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ClientStatus>("all");
  const [actionError, setActionError] = useState<string | null>(null);

  const getAuth = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Verifiering misslyckades. Logga in igen.");
    return { token, client: createClerkSupabaseClient(token) };
  };

  const {
    data: clients = [],
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ["wedding-clients"],
    queryFn: async () => {
      const { client } = await getAuth();
      const { data, error } = await client
        .from("wedding_clients")
        .select("*")
        .order("wedding_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as WeddingClient[];
    },
  });

  const saveClient = async (draft: ClientDraft, id?: string) => {
    const { client } = await getAuth();
    const payload = {
      couple_names: draft.couple_names.trim(),
      contact_person: emptyToNull(draft.contact_person),
      email: emptyToNull(draft.email),
      phone: emptyToNull(draft.phone),
      wedding_date: draft.wedding_date || null,
      wedding_time: draft.wedding_time || null,
      venue: emptyToNull(draft.venue),
      package: emptyToNull(draft.package),
      status: draft.status,
      notes: emptyToNull(draft.notes),
      couple_photo_url: emptyToNull(draft.couple_photo_url),
      couple_photo_public_id: emptyToNull(draft.couple_photo_public_id),
      follow_up_date: draft.follow_up_date || null,
    };

    if (id) {
      const { error } = await client.from("wedding_clients").update(payload).eq("id", id);
      if (error) throw error;
    } else {
      const { error } = await client.from("wedding_clients").insert([payload]);
      if (error) throw error;
    }

    await queryClient.invalidateQueries({ queryKey: ["wedding-clients"] });
  };

  const deleteClient = async (id: string) => {
    const { client } = await getAuth();
    const { error } = await client.from("wedding_clients").delete().eq("id", id);
    if (error) throw error;
    await queryClient.invalidateQueries({ queryKey: ["wedding-clients"] });
  };

  const uploadCouplePhoto = async (file: File) => {
    const { token } = await getAuth();
    const uploaded = await uploadToCloudinary(token, file, "wedding_clients", false);
    return { url: uploaded.secure_url, id: uploaded.public_id };
  };

  const today = todayYmd();

  const byDate = useMemo(() => {
    const map = new Map<string, WeddingClient[]>();
    for (const client of clients) {
      if (!client.wedding_date) continue;
      const existing = map.get(client.wedding_date);
      if (existing) existing.push(client);
      else map.set(client.wedding_date, [client]);
    }
    for (const list of map.values()) {
      list.sort((a, b) => (a.wedding_time ?? "").localeCompare(b.wedding_time ?? ""));
    }
    return map;
  }, [clients]);

  const upcoming = useMemo(
    () =>
      clients
        .filter((client) => client.wedding_date && client.wedding_date >= today && client.status !== "declined")
        .sort((a, b) => (a.wedding_date ?? "").localeCompare(b.wedding_date ?? ""))
        .slice(0, 6),
    [clients, today]
  );

  const followUps = useMemo(
    () =>
      clients
        .filter(
          (client) =>
            client.follow_up_date &&
            client.follow_up_date <= addDaysYmd(today, 14) &&
            client.status !== "completed" &&
            client.status !== "declined"
        )
        .sort((a, b) => (a.follow_up_date ?? "").localeCompare(b.follow_up_date ?? "")),
    [clients, today]
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clients.filter((client) => {
      if (statusFilter !== "all" && client.status !== statusFilter) return false;
      if (!query) return true;
      return [client.couple_names, client.contact_person, client.venue, client.email, client.phone, client.notes, client.package]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [clients, search, statusFilter]);

  const cells = useMemo(() => {
    const monthStart = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const gridStart = startOfWeekMonday(monthStart);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStart);
      date.setDate(gridStart.getDate() + index);
      return date;
    });
  }, [cursor]);

  const monthKey = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
  const bookedCount = clients.filter((client) => client.status === "booked").length;
  const monthWeddings = clients.filter(
    (client) => client.wedding_date?.startsWith(monthKey) && client.status !== "declined"
  ).length;

  const selectedClients = byDate.get(selectedDate) ?? [];

  const selectDay = (date: Date) => {
    const key = ymd(date);
    setSelectedDate(key);
    if (date.getMonth() !== cursor.getMonth() || date.getFullYear() !== cursor.getFullYear()) {
      setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const shiftMonth = (delta: number) => {
    setCursor((previous) => new Date(previous.getFullYear(), previous.getMonth() + delta, 1));
  };

  const goToday = () => {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(ymd(now));
  };

  const handleQuickDelete = async (id: string) => {
    try {
      await deleteClient(id);
      setRemoveTarget(null);
    } catch (error: any) {
      setActionError(error?.message ?? "Kunde inte ta bort kunden.");
      setRemoveTarget(null);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-50">
        <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-stone-400">
          <Loader2 size={16} className="animate-spin" />
          Hämtar bröllopskunder...
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-stone-50 animate-in fade-in duration-500">
      <div className="mx-auto max-w-7xl px-4 py-10 md:px-8 md:py-14">
        <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center bg-stone-900 text-white shadow-sm">
              <HeartHandshake size={22} />
            </div>
            <div>
              <h2 className="text-xl font-light uppercase tracking-[0.3em] text-stone-900">Bröllopsplanering</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Kunder, samtal och vigslar — bara för dig
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setEditing({ client: null, date: selectedDate })}
              className="inline-flex items-center gap-2 bg-stone-900 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-md transition-colors hover:bg-stone-700"
            >
              <Plus size={14} />
              Ny kund
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border-b border-stone-900 pb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900 transition-colors hover:text-stone-500"
            >
              Stäng
            </button>
          </div>
        </header>

        <div className="mb-10 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <StatCard
            label="Bokade kunder"
            value={bookedCount}
            icon={<HeartHandshake size={16} className="text-emerald-600" />}
          />
          <StatCard
            label="Vigslar denna månad"
            value={monthWeddings}
            icon={<CalendarDays size={16} className="text-sky-600" />}
          />
          <StatCard
            label="Att följa upp"
            value={followUps.length}
            icon={<BellRing size={16} className="text-amber-600" />}
          />
          <StatCard label="Totalt antal" value={clients.length} icon={<Users size={16} className="text-stone-500" />} />
        </div>

        {actionError && (
          <div className="mb-6 flex items-start justify-between gap-4 border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] text-rose-700">
            <span>{actionError}</span>
            <button type="button" onClick={() => setActionError(null)} aria-label="Stäng felmeddelande">
              <X size={14} />
            </button>
          </div>
        )}

        {queryError && (
          <div className="mb-6 border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] text-rose-700">
            {(queryError as Error).message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Calendar */}
          <section className="overflow-hidden border border-stone-100 bg-white shadow-sm lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-100 p-4 md:p-5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => shiftMonth(-1)}
                  aria-label="Föregående månad"
                  className="flex h-8 w-8 items-center justify-center border border-stone-100 text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-900"
                >
                  <ChevronLeft size={16} />
                </button>
                <h3 className="min-w-[170px] text-center text-xs font-bold uppercase tracking-[0.2em] text-stone-900 md:min-w-[210px] md:text-sm">
                  {monthFormatter.format(cursor)}
                </h3>
                <button
                  type="button"
                  onClick={() => shiftMonth(1)}
                  aria-label="Nästa månad"
                  className="flex h-8 w-8 items-center justify-center border border-stone-100 text-stone-500 transition-colors hover:border-stone-400 hover:text-stone-900"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
              <button
                type="button"
                onClick={goToday}
                className="border border-stone-200 px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:border-stone-900 hover:text-stone-900"
              >
                Idag
              </button>
            </div>

            <div className="grid grid-cols-7 border-b border-stone-100 bg-stone-50/70">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="px-1 py-2 text-center text-[8px] font-bold uppercase tracking-widest text-stone-400 md:text-[9px]"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {cells.map((date) => {
                const key = ymd(date);
                const events = byDate.get(key) ?? [];
                const inMonth = date.getMonth() === cursor.getMonth();
                const isToday = key === today;
                const isSelected = key === selectedDate;
                const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                return (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectDay(date)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectDay(date);
                      }
                    }}
                    className={`relative min-h-[84px] cursor-pointer border-b border-r border-stone-100 p-1.5 transition-colors md:min-h-[104px] md:p-2 ${
                      inMonth ? (isWeekend ? "bg-stone-50/40" : "bg-white") : "bg-stone-50/70 text-stone-300"
                    } ${isSelected ? "ring-1 ring-inset ring-stone-900" : "hover:bg-stone-50"}`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={`flex h-5 w-5 items-center justify-center text-[10px] font-mono md:text-[11px] ${
                          isToday ? "rounded-full bg-stone-900 font-bold text-white" : inMonth ? "text-stone-600" : "text-stone-300"
                        }`}
                      >
                        {date.getDate()}
                      </span>
                      {events.length > 0 && (
                        <span className="text-[8px] font-bold text-stone-400">{events.length}</span>
                      )}
                    </div>

                    <div className="mt-1 space-y-1">
                      {events.slice(0, 2).map((client) => (
                        <div
                          key={client.id}
                          className="flex items-center gap-1 overflow-hidden rounded-sm border border-stone-100 bg-stone-50 px-1 py-0.5"
                        >
                          {client.couple_photo_url ? (
                            <img
                              src={client.couple_photo_url}
                              alt=""
                              className="h-3 w-3 shrink-0 rounded-full object-cover"
                            />
                          ) : (
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[client.status].dot}`} />
                          )}
                          <span className="truncate text-[8px] leading-tight text-stone-700 md:text-[9px]">
                            {client.couple_names}
                          </span>
                        </div>
                      ))}
                      {events.length > 2 && (
                        <div className="pl-1 text-[8px] font-bold text-stone-400">+{events.length - 2} fler</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
              {STATUSES.map((status) => (
                <span
                  key={status}
                  className="flex items-center gap-1.5 text-[8px] uppercase tracking-wide text-stone-400"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[status].dot}`} />
                  {STATUS_META[status].label}
                </span>
              ))}
            </div>
          </section>

          {/* Right column */}
          <div className="space-y-6 lg:col-span-4">
            <section className="border border-stone-100 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-widest text-stone-400">Valt datum</p>
                  <h3 className="mt-1 text-sm font-light capitalize text-stone-900">{formatLongDate(selectedDate)}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditing({ client: null, date: selectedDate })}
                  aria-label="Lägg till kund på valt datum"
                  className="flex h-8 w-8 shrink-0 items-center justify-center border border-stone-200 text-stone-500 transition-colors hover:border-stone-900 hover:bg-stone-900 hover:text-white"
                >
                  <Plus size={14} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {selectedClients.length === 0 ? (
                  <p className="border border-dashed border-stone-100 px-3 py-5 text-center text-[9px] uppercase tracking-wide text-stone-300">
                    Inga kunder den här dagen
                  </p>
                ) : (
                  selectedClients.map((client) => (
                    <MiniClient key={client.id} client={client} onOpen={() => setEditing({ client, date: selectedDate })} />
                  ))
                )}
              </div>
            </section>

            <section className="border border-stone-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-stone-900">
                  <CalendarDays size={13} className="text-stone-400" />
                  Kommande vigslar
                </h3>
                <span className="text-[9px] font-bold text-stone-300">{upcoming.length}</span>
              </div>

              <div className="space-y-2">
                {upcoming.length === 0 ? (
                  <p className="border border-dashed border-stone-100 px-3 py-5 text-center text-[9px] uppercase tracking-wide text-stone-300">
                    Inga kommande vigslar
                  </p>
                ) : (
                  upcoming.map((client) => {
                    const parts = dateParts(client.wedding_date!);
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setEditing({ client, date: selectedDate })}
                        className="flex w-full items-center gap-3 border border-stone-100 p-2 text-left transition-colors hover:border-stone-300"
                      >
                        <div className="flex h-11 w-10 shrink-0 flex-col items-center justify-center bg-stone-900 text-white">
                          <span className="text-sm font-light leading-none">{parts.day}</span>
                          <span className="mt-0.5 text-[6px] uppercase tracking-wider text-stone-300">{parts.month}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-stone-800">
                            {client.couple_names}
                          </p>
                          <p className="mt-0.5 flex items-center gap-1 truncate text-[8px] uppercase tracking-wide text-stone-400">
                            {client.venue ? <MapPin size={8} className="shrink-0" /> : null}
                            <span className="truncate">{client.venue || "Plats ej satt"}</span>
                          </p>
                        </div>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[client.status].dot}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </section>

            <section className="border border-stone-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-stone-900">
                  <BellRing size={13} className="text-stone-400" />
                  Att följa upp
                </h3>
                <span className="text-[9px] font-bold text-stone-300">{followUps.length}</span>
              </div>

              <div className="space-y-2">
                {followUps.length === 0 ? (
                  <p className="border border-dashed border-stone-100 px-3 py-5 text-center text-[9px] uppercase tracking-wide text-stone-300">
                    Inga uppföljningar inom 14 dagar
                  </p>
                ) : (
                  followUps.slice(0, 5).map((client) => {
                    const overdue = (client.follow_up_date ?? "") < today;
                    return (
                      <button
                        key={client.id}
                        type="button"
                        onClick={() => setEditing({ client, date: selectedDate })}
                        className="flex w-full items-center gap-3 border border-stone-100 p-2.5 text-left transition-colors hover:border-stone-300"
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center ${
                            overdue ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          <BellRing size={13} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[10px] font-bold uppercase tracking-wide text-stone-800">
                            {client.couple_names}
                          </p>
                          <p className="mt-0.5 text-[8px] uppercase tracking-wide text-stone-400">
                            {overdue ? "Försenad · " : ""}
                            {formatShortDate(client.follow_up_date)}
                          </p>
                        </div>
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[client.status].dot}`} />
                      </button>
                    );
                  })
                )}
              </div>
            </section>
          </div>
        </div>

        {/* Client directory */}
        <section className="mt-12">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-900">Alla kunder</h3>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-stone-400">
                {filtered.length} av {clients.length} kunder
              </p>
            </div>
            <div className="relative w-full md:w-80">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-300" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Sök namn, plats eller anteckning..."
                className="w-full border border-stone-200 bg-white py-2.5 pl-9 pr-3 text-xs font-light outline-none transition-colors focus:border-stone-900"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <FilterPill active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
              Alla <span className="ml-1 text-[8px] opacity-60">{clients.length}</span>
            </FilterPill>
            {STATUSES.map((status) => {
              const count = clients.filter((client) => client.status === status).length;
              return (
                <FilterPill key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
                  <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${STATUS_META[status].dot}`} />
                  {STATUS_META[status].label}
                  <span className="ml-1 text-[8px] opacity-60">{count}</span>
                </FilterPill>
              );
            })}
          </div>

          {filtered.length === 0 ? (
            <div className="mt-6 border border-dashed border-stone-200 bg-white px-6 py-16 text-center">
              <HeartHandshake size={26} className="mx-auto text-stone-200" />
              <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                {clients.length === 0 ? "Inga kunder ännu" : "Inga kunder matchar filtret"}
              </p>
              <p className="mt-2 text-xs font-light text-stone-400">
                {clients.length === 0
                  ? "Lägg till den första kunden och börja bygga din bröllopskalender."
                  : "Prova ett annat filter eller en annan sökning."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((client) => (
                <ClientCard
                  key={client.id}
                  client={client}
                  today={today}
                  onEdit={() => setEditing({ client, date: selectedDate })}
                  onDelete={() => setRemoveTarget(client)}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {editing && (
        <ClientEditor
          key={editing.client?.id ?? `new-${editing.date}`}
          initial={toDraft(editing.client, editing.date)}
          clientId={editing.client?.id}
          isNew={!editing.client}
          onClose={() => setEditing(null)}
          onSave={saveClient}
          onDelete={deleteClient}
          onUpload={uploadCouplePhoto}
        />
      )}

      <Modal
        isOpen={!!removeTarget}
        title="Ta bort kund"
        message={`Är du säker på att du vill ta bort ${removeTarget?.couple_names ?? "kunden"}? Det går inte att ångra.`}
        type="danger"
        onConfirm={() => {
          const target = removeTarget;
          if (target) void handleQuickDelete(target.id);
        }}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  );
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
    <div className="border border-stone-100 bg-white p-4 shadow-sm md:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-bold uppercase tracking-widest text-stone-400 md:text-[9px]">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-light text-stone-900">{value}</p>
    </div>
  );
}

function MiniClient({ client, onOpen }: { client: WeddingClient; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 border border-stone-100 p-2 text-left transition-colors hover:border-stone-300"
    >
      <div className="h-10 w-10 shrink-0 overflow-hidden bg-stone-100">
        {client.couple_photo_url ? (
          <img src={client.couple_photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-stone-300">
            <Camera size={14} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] font-bold uppercase tracking-wide text-stone-800">{client.couple_names}</p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-[8px] uppercase tracking-wide text-stone-400">
          {client.wedding_time && (
            <>
              <Clock size={8} className="shrink-0" />
              {formatTime(client.wedding_time)}
            </>
          )}
          {client.venue && <span className="truncate">{client.venue}</span>}
        </p>
      </div>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_META[client.status].dot}`} />
    </button>
  );
}

function ClientCard({
  client,
  today,
  onEdit,
  onDelete,
}: {
  client: WeddingClient;
  today: string;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const meta = STATUS_META[client.status];
  const overdue = client.follow_up_date ? client.follow_up_date < today : false;

  return (
    <article className="group flex gap-4 border border-stone-100 bg-white p-4 shadow-sm transition-all hover:border-stone-300 hover:shadow-md">
      <div className="h-28 w-20 shrink-0 overflow-hidden bg-stone-100">
        {client.couple_photo_url ? (
          <img src={client.couple_photo_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-stone-300">
            <Camera size={20} />
          </span>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="truncate text-[11px] font-bold uppercase tracking-wider text-stone-900">
              {client.couple_names}
            </h4>
            {client.contact_person && (
              <p className="mt-0.5 truncate text-[9px] uppercase tracking-wide text-stone-400">
                {client.contact_person}
              </p>
            )}
          </div>
          <span
            className={`inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-wide ${meta.badge}`}
          >
            <span className={`h-1 w-1 rounded-full ${meta.dot}`} />
            {meta.label}
          </span>
        </div>

        <div className="mt-2 space-y-1 text-[9px] text-stone-500">
          <p className="flex items-center gap-1">
            <CalendarDays size={9} className="shrink-0 text-stone-300" />
            {formatFullDate(client.wedding_date)}
            {client.wedding_time && ` · ${formatTime(client.wedding_time)}`}
          </p>
          {client.venue && (
            <p className="flex items-center gap-1">
              <MapPin size={9} className="shrink-0 text-stone-300" />
              <span className="truncate">{client.venue}</span>
            </p>
          )}
          {client.follow_up_date && (
            <p className={`flex items-center gap-1 ${overdue ? "text-rose-500" : ""}`}>
              <BellRing size={9} className="shrink-0" />
              Följ upp {formatShortDate(client.follow_up_date)}
              {overdue ? " · försenad" : ""}
            </p>
          )}
        </div>

        {client.notes && (
          <p className="mt-2 line-clamp-2 text-[10px] font-light leading-relaxed text-stone-400">{client.notes}</p>
        )}

        <div className="mt-auto flex gap-4 pt-3">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-stone-500 transition-colors hover:text-stone-900"
          >
            <Pencil size={9} />
            Redigera
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest text-stone-300 transition-colors hover:text-rose-600"
          >
            <Trash2 size={9} />
            Ta bort
          </button>
        </div>
      </div>
    </article>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center border px-3 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "border-stone-900 bg-stone-900 text-white"
          : "border-stone-200 bg-white text-stone-400 hover:border-stone-400 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function ClientEditor({
  initial,
  clientId,
  isNew,
  onClose,
  onSave,
  onDelete,
  onUpload,
}: {
  initial: ClientDraft;
  clientId?: string;
  isNew: boolean;
  onClose: () => void;
  onSave: (draft: ClientDraft, id?: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpload: (file: File) => Promise<{ url: string; id: string }>;
}) {
  const [draft, setDraft] = useState<ClientDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const update = (patch: Partial<ClientDraft>) => setDraft((previous) => ({ ...previous, ...patch }));

  const handleUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Välj en bildfil (jpg, png eller liknande).");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const result = await onUpload(file);
      update({ couple_photo_url: result.url, couple_photo_public_id: result.id });
    } catch (uploadError: any) {
      setError(uploadError?.message ?? "Uppladdningen misslyckades.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!draft.couple_names.trim()) {
      setError("Ange parets namn.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onSave(draft, isNew ? undefined : clientId);
      onClose();
    } catch (saveError: any) {
      setError(saveError?.message ?? "Kunde inte spara kunden.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!clientId) return;
    setSaving(true);
    setError(null);
    try {
      await onDelete(clientId);
      setConfirmDelete(false);
      onClose();
    } catch (deleteError: any) {
      setConfirmDelete(false);
      setError(deleteError?.message ?? "Kunde inte ta bort kunden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-stone-900/40 p-3 backdrop-blur-sm md:p-8">
      <div className="w-full max-w-4xl animate-in fade-in slide-in-from-bottom-2 border border-stone-100 bg-white shadow-2xl duration-300">
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-stone-100 bg-white px-5 py-4 md:px-8">
          <div>
            <h3 className="text-sm font-light uppercase tracking-[0.25em] text-stone-900">
              {isNew ? "Ny kund" : "Redigera kund"}
            </h3>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-stone-400">
              {isNew ? "Lägg till i din bröllopskalender" : "Uppdatera anteckningar och detaljer"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Stäng"
            className="flex h-8 w-8 items-center justify-center border border-stone-100 text-stone-400 transition-colors hover:border-stone-900 hover:text-stone-900"
          >
            <X size={15} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7 p-5 md:p-8">
          {error && <div className="border border-rose-100 bg-rose-50 px-4 py-3 text-[11px] text-rose-700">{error}</div>}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-5">
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400">Bild på paret</p>
                <label
                  className={`group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden border-2 border-dashed transition-colors ${
                    draft.couple_photo_url
                      ? "border-transparent"
                      : "border-stone-200 bg-stone-50 hover:border-stone-400"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  {draft.couple_photo_url ? (
                    <>
                      <img src={draft.couple_photo_url} alt="Paret" className="h-full w-full object-cover" />
                      <span className="absolute inset-0 flex items-center justify-center gap-2 bg-stone-900/55 text-[9px] font-bold uppercase tracking-widest text-white opacity-0 transition-opacity group-hover:opacity-100">
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
                        {uploading ? "Laddar upp..." : "Byt bild"}
                      </span>
                    </>
                  ) : (
                    <span className="flex h-full flex-col items-center justify-center gap-3 px-4 text-center text-stone-400">
                      {uploading ? <Loader2 size={22} className="animate-spin" /> : <Camera size={26} />}
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {uploading ? "Laddar upp..." : "Ladda upp bild"}
                      </span>
                      <span className="text-[10px] font-light normal-case text-stone-400">
                        Ett foto hjälper dig minnas paret
                      </span>
                    </span>
                  )}
                </label>

                {draft.couple_photo_url && (
                  <button
                    type="button"
                    onClick={() => update({ couple_photo_url: "", couple_photo_public_id: "" })}
                    className="mt-2 text-[8px] font-bold uppercase tracking-widest text-stone-300 transition-colors hover:text-rose-600"
                  >
                    Ta bort bild
                  </button>
                )}
              </div>

              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-stone-400">Status</p>
                <div className="grid grid-cols-2 gap-2">
                  {STATUSES.map((status) => {
                    const meta = STATUS_META[status];
                    const active = draft.status === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => update({ status })}
                        className={`flex items-center gap-2 border px-2.5 py-2 text-left text-[8px] font-bold uppercase tracking-wide transition-all ${
                          active
                            ? `${meta.badge} ring-1 ring-stone-900/20`
                            : "border-stone-100 text-stone-400 hover:border-stone-300"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="space-y-7 lg:col-span-2">
              <div className="space-y-4">
                <p className="border-l-2 border-stone-900 pl-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
                  Paret
                </p>
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400">
                    Parets namn *
                  </label>
                  <input
                    autoFocus
                    required
                    value={draft.couple_names}
                    onChange={(event) => update({ couple_names: event.target.value })}
                    placeholder="t.ex. Anna & Erik"
                    className="w-full border-b-2 border-stone-200 bg-transparent pb-2 text-xl font-light text-stone-900 outline-none transition-colors focus:border-stone-900"
                  />
                </div>
                <TextField
                  label="Kontaktperson"
                  value={draft.contact_person}
                  onChange={(value) => update({ contact_person: value })}
                  placeholder="Vem pratade du med?"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="E-post"
                    type="email"
                    value={draft.email}
                    onChange={(value) => update({ email: value })}
                    placeholder="namn@exempel.se"
                  />
                  <TextField
                    label="Telefon"
                    type="tel"
                    value={draft.phone}
                    onChange={(value) => update({ phone: value })}
                    placeholder="070-123 45 67"
                  />
                </div>
              </div>

              <div className="space-y-4 border-t border-stone-100 pt-6">
                <p className="border-l-2 border-stone-900 pl-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
                  Bröllopet
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Bröllopsdatum"
                    type="date"
                    value={draft.wedding_date}
                    onChange={(value) => update({ wedding_date: value })}
                  />
                  <TextField
                    label="Tid"
                    type="time"
                    value={draft.wedding_time}
                    onChange={(value) => update({ wedding_time: value })}
                  />
                </div>
                <TextField
                  label="Plats / lokal"
                  value={draft.venue}
                  onChange={(value) => update({ venue: value })}
                  placeholder="t.ex. Högbo Bruk"
                />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <TextField
                    label="Paket"
                    value={draft.package}
                    onChange={(value) => update({ package: value })}
                    placeholder="t.ex. Hela dagen"
                  />
                  <TextField
                    label="Följ upp datum"
                    type="date"
                    value={draft.follow_up_date}
                    onChange={(value) => update({ follow_up_date: value })}
                  />
                </div>
              </div>

              <div className="space-y-3 border-t border-stone-100 pt-6">
                <p className="border-l-2 border-stone-900 pl-3 text-[10px] font-bold uppercase tracking-[0.2em] text-stone-900">
                  Anteckningar
                </p>
                <textarea
                  rows={5}
                  value={draft.notes}
                  onChange={(event) => update({ notes: event.target.value })}
                  placeholder="Vad pratade ni om? Önskemål, budget, stämning, platser att föreslå..."
                  className="w-full resize-y border border-stone-200 p-3 text-sm font-light leading-relaxed outline-none transition-colors focus:border-stone-900"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center">
            {!isNew && clientId && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-stone-300 transition-colors hover:text-rose-600"
              >
                <Trash2 size={11} />
                Ta bort kund
              </button>
            )}
            <div className="flex-1" />
            <button
              type="button"
              onClick={onClose}
              className="border border-stone-200 px-5 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-400 transition-colors hover:border-stone-900 hover:text-stone-900"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="bg-stone-900 px-6 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-md transition-colors hover:bg-stone-700 disabled:opacity-40"
            >
              {saving ? "Sparar..." : isNew ? "Spara kund" : "Spara ändringar"}
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={confirmDelete}
        title="Ta bort kund"
        message={`Är du säker på att du vill ta bort ${draft.couple_names || "kunden"}? Det går inte att ångra.`}
        type="danger"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[9px] font-bold uppercase tracking-widest text-stone-400">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full border border-stone-200 bg-white px-3 py-2.5 text-sm font-light text-stone-800 outline-none transition-colors focus:border-stone-900"
      />
    </div>
  );
}
