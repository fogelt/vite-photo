import { useEffect, useMemo, useState } from "react";
import {
  AppWindowMac,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Clock,
  Download,
  FileSignature,
  HeartHandshake,
  Info,
  LoaderCircle,
} from "lucide-react";
import { useAuth, UserButton, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import { createClerkSupabaseClient, fetchPhotosByTag, supabase } from "@/services";
import { cloudinaryImage } from "@/utils";
import { ArticleAdmin } from "@/components/ui/admin-gui/article-editor";
import { PhotoEditor } from "@/components/ui/admin-gui/photo-editor";
import { AboutAdmin } from "@/components/ui/admin-gui/about-editor";
import { WeddingAdmin } from "@/components/ui/admin-gui/weddings-editor";
import { WelcomeAdmin } from "@/components/ui/admin-gui/welcome-editor";
import { EngagementAdmin } from "@/components/ui/admin-gui/engagement-editor";
import { WeddingPlanner } from "@/components/ui/admin-gui/wedding-planner";

const APP_RELEASES = [
  {
    id: "photo-resizer",
    name: "Photo Resizer",
    description:
      "Ändra storlek på en eller flera foton inför publicering. Välj bilder, ange målstorlek och exportera direkt.",
    repo: "fogelt/photo-resizer",
    icon: "/apps/photo-resizer.png",
  },
  {
    id: "collage-editor",
    name: "Collage Editor",
    description:
      "Sätt ihop flera foton till ett kollage. Dra och släpp bilderna, justera layouten och exportera resultatet.",
    repo: "fogelt/collage-editor",
    icon: "/apps/collage-editor.png",
  },
] as const;

type AppId = (typeof APP_RELEASES)[number]["id"];

/**
 * 0-based index of the gallery photo used as the site switcher thumbnail.
 * Easy to bump if the first photo doesn't represent the site well.
 */
const SITE_SWITCHER_PHOTO: Record<"portfolio" | "wedding", number> = {
  portfolio: 1,
  wedding: 0,
};

type AppDownload = { url: string; size: number; publishedAt: string | null };

type ReleaseCache = AppDownload & {
  timestamp: number;
  etag: string | null;
  /** Don't retry a failed lookup before this point. */
  retryAt?: number | null;
};

// Unauthenticated GitHub API calls are capped at 60 requests per hour per IP,
// and that budget is shared by every tab, reload and device behind the same
// address. Releases change rarely, so keep a long-lived cache in localStorage
// (shared across tabs, unlike sessionStorage) and let a normal admin session
// cost two requests at most.
const RELEASE_CACHE_PREFIX = "app-release-v4:";
const RELEASE_CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const RELEASE_ERROR_BACKOFF_MS = 15 * 60 * 1000;

// Collapse concurrent lookups (StrictMode remounts, repeated clicks) into one.
const inFlightRequests = new Map<string, Promise<AppDownload>>();

function toDownload(cache: ReleaseCache): AppDownload {
  return {
    url: cache.url,
    size: cache.size,
    publishedAt: cache.publishedAt ?? null,
  };
}

function readReleaseCache(cacheKey: string): ReleaseCache | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey) ?? "null") as ReleaseCache | null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    // Ignore malformed or unavailable storage.
    return null;
  }
}

function writeReleaseCache(cacheKey: string, value: ReleaseCache) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify(value));
  } catch {
    // Ignore storage failures (e.g. private browsing).
  }
}

// GitHub tells us exactly when the quota resets, so use that instead of
// retrying blindly.
function getRetryAt(response: Response): number {
  const reset = Number(response.headers.get("x-ratelimit-reset"));
  if (Number.isFinite(reset) && reset > 0) {
    return reset * 1000;
  }

  const retryAfter = Number(response.headers.get("retry-after"));
  if (Number.isFinite(retryAfter) && retryAfter > 0) {
    return Date.now() + retryAfter * 1000;
  }

  return Date.now() + RELEASE_ERROR_BACKOFF_MS;
}

async function fetchLatestDownload(
  repo: string,
  cacheKey: string,
  cached: ReleaseCache | null,
): Promise<AppDownload> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  // Conditional requests that return 304 don't count against GitHub's rate limit.
  if (cached?.etag) {
    headers["If-None-Match"] = cached.etag;
  }

  const response = await fetch(`https://api.github.com/repos/${repo}/releases/latest`, {
    headers,
    cache: "no-store",
  });

  if (response.status === 304 && cached) {
    const download = toDownload(cached);
    writeReleaseCache(cacheKey, {
      ...download,
      etag: cached.etag,
      timestamp: Date.now(),
      retryAt: null,
    });

    return download;
  }

  if (!response.ok) {
    // Remember the reset time so a rate-limited response isn't retried on
    // every mount and visibility change. Keep the previous URL, if any.
    writeReleaseCache(cacheKey, {
      ...(cached ?? {
        url: "",
        size: 0,
        publishedAt: null,
        etag: null,
        timestamp: Date.now(),
      }),
      retryAt: getRetryAt(response),
    });

    throw new Error(
      response.status === 403
        ? "GitHub begränsar antalet förfrågningar just nu. Försök igen senare."
        : "Kunde inte hämta senaste versionen från GitHub.",
    );
  }

  const release = (await response.json()) as {
    published_at?: string | null;
    assets?: Array<{ name?: string; browser_download_url?: string; size?: number }>;
  };

  const asset = release.assets?.find(
    (candidate) =>
      typeof candidate.name === "string" &&
      /(aarch64|arm64).*\.dmg$/i.test(candidate.name) &&
      typeof candidate.browser_download_url === "string",
  );

  if (!asset?.browser_download_url) {
    throw new Error("Hittade ingen Apple Silicon-version (DMG).");
  }

  const download: AppDownload = {
    url: asset.browser_download_url,
    size: typeof asset.size === "number" ? asset.size : 0,
    publishedAt: typeof release.published_at === "string" ? release.published_at : null,
  };

  writeReleaseCache(cacheKey, {
    ...download,
    etag: response.headers.get("etag"),
    timestamp: Date.now(),
    retryAt: null,
  });

  return download;
}

async function resolveAppleSiliconDownload(repo: string): Promise<AppDownload> {
  const cacheKey = `${RELEASE_CACHE_PREFIX}${repo}`;
  const cached = readReleaseCache(cacheKey);
  const now = Date.now();

  if (cached) {
    if (cached.url && now - cached.timestamp < RELEASE_CACHE_TTL_MS) {
      return toDownload(cached);
    }

    const isBackingOff = typeof cached.retryAt === "number" && now < cached.retryAt;
    if (isBackingOff) {
      if (cached.url) return toDownload(cached);
      throw new Error("GitHub begränsar antalet förfrågningar just nu. Försök igen senare.");
    }
  }

  const pending = inFlightRequests.get(cacheKey);
  if (pending) return pending;

  const request = fetchLatestDownload(repo, cacheKey, cached).finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, request);
  return request;
}

// The download itself happens in the browser, outside of our control, so use the
// file size to keep the loading state visible for a realistic amount of time.
function getDownloadVisualDuration(size: number): number {
  const estimatedMs = size > 0 ? (size / (2 * 1024 * 1024)) * 1000 : 1800;
  return Math.min(5000, Math.max(1400, Math.round(estimatedMs)));
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat("sv", { numeric: "auto" });

function formatReleaseAge(publishedAt: string | null): string | null {
  if (!publishedAt) return null;

  const timestamp = Date.parse(publishedAt);
  if (Number.isNaN(timestamp)) return null;

  const diffSeconds = Math.round((timestamp - Date.now()) / 1000);
  if (Math.abs(diffSeconds) < 60) return "nyss";

  const diffMinutes = Math.round(diffSeconds / 60);
  if (Math.abs(diffMinutes) < 60) {
    return relativeTimeFormatter.format(diffMinutes, "minute");
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (Math.abs(diffHours) < 24) {
    return relativeTimeFormatter.format(diffHours, "hour");
  }

  const diffDays = Math.round(diffHours / 24);
  if (Math.abs(diffDays) < 30) {
    return relativeTimeFormatter.format(diffDays, "day");
  }

  const diffMonths = Math.round(diffDays / 30);
  if (Math.abs(diffMonths) < 12) {
    return relativeTimeFormatter.format(diffMonths, "month");
  }

  return relativeTimeFormatter.format(Math.round(diffDays / 365), "year");
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** The fields the dashboard timeline needs from `wedding_clients`. */
type UpcomingClient = {
  id: string;
  couple_names: string;
  wedding_date: string | null;
  wedding_time: string | null;
  venue: string | null;
  status: string;
};

const STATUS_DOT: Record<string, string> = {
  lead: "bg-stone-400",
  contacted: "bg-sky-500",
  meeting: "bg-amber-500",
  booked: "bg-emerald-500",
  completed: "bg-violet-500",
  declined: "bg-rose-400",
};

const monthShortFormatter = new Intl.DateTimeFormat("sv-SE", { month: "short" });

const pad = (value: number) => String(value).padStart(2, "0");

const ymd = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const parseYmd = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const dateBadge = (value: string) => {
  const date = parseYmd(value);
  return {
    day: date.getDate(),
    month: monthShortFormatter.format(date).replace(".", "").toUpperCase(),
  };
};

const daysUntilLabel = (value: string) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.round((parseYmd(value).getTime() - today.getTime()) / 86_400_000);

  if (days <= 0) return "Idag";
  if (days === 1) return "Imorgon";
  if (days < 14) return `Om ${days} dagar`;

  if (days < 60) {
    const weeks = Math.round(days / 7);
    return `Om ${weeks} ${weeks === 1 ? "vecka" : "veckor"}`;
  }

  if (days < 365) {
    const months = Math.round(days / 30);
    return `Om ${months} ${months === 1 ? "månad" : "månader"}`;
  }

  return `Om ${Math.round(days / 365)} år`;
};

function UpcomingTimeline({
  clients,
  isLoading,
}: {
  clients: UpcomingClient[];
  isLoading: boolean;
}) {
  return (
    <div className="mt-6 border-t border-stone-100 pt-4">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-stone-400">
          <CalendarDays size={11} />
          Kommande uppdrag
        </p>
        {clients.length > 0 && (
          <span className="text-[8px] font-bold text-stone-300">{clients.length}</span>
        )}
      </div>

      {isLoading ? (
        <p className="mt-3 text-[8px] uppercase tracking-widest text-stone-300">Hämtar…</p>
      ) : clients.length === 0 ? (
        <p className="mt-3 border border-dashed border-stone-100 px-3 py-3 text-center text-[8px] uppercase tracking-wide text-stone-300">
          Inga kommande uppdrag
        </p>
      ) : (
        <ol className="mt-3">
          {clients.map((client, index) => {
            const badge = dateBadge(client.wedding_date!);
            const isLast = index === clients.length - 1;

            return (
              <li key={client.id} className="relative flex gap-3 pb-3 last:pb-0">
                {!isLast && (
                  <span
                    aria-hidden
                    className="absolute bottom-0 left-[15px] top-8 w-px bg-stone-200"
                  />
                )}
                <span className="relative z-10 flex h-8 w-8 shrink-0 flex-col items-center justify-center bg-stone-900 text-white">
                  <span className="text-[11px] font-light leading-none">{badge.day}</span>
                  <span className="mt-0.5 text-[6px] uppercase tracking-wider text-stone-400">
                    {badge.month}
                  </span>
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="flex items-center gap-1.5">
                    <span
                      className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[client.status] ?? "bg-stone-400"}`}
                    />
                    <span className="truncate text-[10px] font-bold uppercase tracking-wide text-stone-800">
                      {client.couple_names}
                    </span>
                  </p>
                  <p className="mt-0.5 flex items-center gap-1 truncate text-[8px] uppercase tracking-wide text-stone-400">
                    <Clock size={8} className="shrink-0" />
                    <span className="shrink-0">{daysUntilLabel(client.wedding_date!)}</span>
                    {client.wedding_time && (
                      <>
                        <span>·</span>
                        <span className="shrink-0">{client.wedding_time.slice(0, 5)}</span>
                      </>
                    )}
                    {client.venue && (
                      <>
                        <span>·</span>
                        <span className="truncate">{client.venue}</span>
                      </>
                    )}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function AdminCard({ title, description, onClick, isActive, note }: { title: string; description: string; onClick: () => void, isActive: boolean, note?: string }) {
  return (
    <button
      onClick={onClick}
      className={`group border p-8 text-left transition-all bg-white shadow-sm hover:shadow-md ${isActive ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-100 hover:border-stone-400'}`}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-xs uppercase tracking-widest font-bold">{title}</h3>
        {note && (
          <span className="group/note relative -mt-0.5 shrink-0" aria-label={note} role="img">
            <Info size={13} className="text-stone-300 transition-colors group-hover/note:text-stone-600" />
            <span className="pointer-events-none absolute right-0 top-5 z-20 w-56 border border-stone-800 bg-stone-900 px-3 py-2 text-[9px] font-light normal-case leading-relaxed tracking-wide text-stone-100 opacity-0 shadow-lg transition-opacity duration-150 group-hover/note:opacity-100">
              {note}
            </span>
          </span>
        )}
      </div>
      <p className="text-[10px] text-stone-400 uppercase tracking-tighter">{description}</p>
      <div className={`mt-6 text-[9px] uppercase tracking-widest font-bold transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300 group-hover:text-stone-900'}`}>
        {isActive ? "→ Visar nu" : "→ Hantera sektion"}
      </div>
    </button>
  );
}

export function AdminLayout() {
  type Site = 'portfolio' | 'wedding';
  const { getToken } = useAuth();
  const { user } = useUser();
  const displayName = user?.fullName || "Myelie Lendelund";
  const displayEmail = user?.primaryEmailAddress?.emailAddress;
  const [site, setSite] = useState<Site>('portfolio');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [isAboutTextEditorOpen, setIsAboutTextEditorOpen] = useState(false);
  const [isWeddingEditorOpen, setIsWeddingEditorOpen] = useState(false); // New state
  const [isWelcomeEditorOpen, setIsWelcomeEditorOpen] = useState(false);
  const [isEngagementEditorOpen, setIsEngagementEditorOpen] = useState(false);
  const [isWeddingPlannerOpen, setIsWeddingPlannerOpen] = useState(false);
  const [isOpeningContracts, setIsOpeningContracts] = useState(false);
  const [contractError, setContractError] = useState<string | null>(null);
  const [downloadingApp, setDownloadingApp] = useState<AppId | null>(null);
  const [openApp, setOpenApp] = useState<AppId | null>(null);
  const [downloadDuration, setDownloadDuration] = useState(1800);
  const [appDownloads, setAppDownloads] = useState<Partial<Record<AppId, AppDownload>>>({});
  const [appDownloadError, setAppDownloadError] = useState<{ repo: string; message: string } | null>(null);

  // Shared with the planner: same cache key, and `select("*")` keeps the
  // cached rows complete for the planner's editor even if the dashboard
  // fetched them first.
  const {
    data: planningClients = [],
    isLoading: isPlanningLoading,
  } = useQuery({
    queryKey: ["wedding-clients"],
    queryFn: async () => {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Verifiering misslyckades. Logga in igen.");
      const client = createClerkSupabaseClient(token);
      const { data, error } = await client
        .from("wedding_clients")
        .select("*")
        .order("wedding_date", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data ?? []) as UpcomingClient[];
    },
    // A failed lookup should only blank the timeline, not hammer Supabase.
    retry: false,
  });

  const upcomingBookings = useMemo(() => {
    const today = ymd(new Date());

    return planningClients
      .filter(
        (client) =>
          client.wedding_date &&
          client.wedding_date >= today &&
          client.status !== "declined",
      )
      .sort(
        (a, b) =>
          (a.wedding_date ?? "").localeCompare(b.wedding_date ?? "") ||
          (a.wedding_time ?? "").localeCompare(b.wedding_time ?? ""),
      )
      .slice(0, 4);
  }, [planningClients]);

  // First photo of each site's gallery, used as the diagonal accent on the
  // site switcher. Same cache keys as the photo editor, so reordering or
  // uploading a photo updates the switcher too.
  const { data: portfolioPhotos = [] } = useQuery({
    queryKey: ["photos", "portfolio"],
    queryFn: () => fetchPhotosByTag("portfolio"),
  });

  const { data: weddingPhotos = [] } = useQuery({
    queryKey: ["photos", "weddings_main"],
    queryFn: () => fetchPhotosByTag("weddings_main"),
  });

  // Resolve the latest DMG URLs up front so a normal click can start the
  // download immediately (Safari is strict about downloads from async code).
  // The download URL is cached for hours, so refreshing here is normally free.
  useEffect(() => {
    let cancelled = false;

    const refresh = () => {
      APP_RELEASES.forEach((app) => {
        resolveAppleSiliconDownload(app.repo)
          .then((download) => {
            if (!cancelled) {
              setAppDownloads((current) => ({ ...current, [app.id]: download }));
            }
          })
          .catch(() => {
            // Keep the last known release info if a refresh fails.
          });
      });
    };

    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };

    refresh();
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  const GALLERY_TABS: Record<Site, string[]> = {
    portfolio: ["portfolio", "weddings", "portraits", "about"],
    wedding: ["weddings_main"],
  };

  const TAB_LABELS: Record<string, string> = {
    portfolio: 'Portfölj',
    weddings: 'Bröllop',
    portraits: 'Porträtt',
    about: 'Om mig',
    weddings_main: 'Bröllopsbilder',
  };

  // Helper to close all full-screen editors
  const closeAllEditors = () => {
    setIsArticleEditorOpen(false);
    setIsAboutTextEditorOpen(false);
    setIsWeddingEditorOpen(false);
    setIsWelcomeEditorOpen(false);
    setIsEngagementEditorOpen(false);
    setIsWeddingPlannerOpen(false);
    setActiveTab(null);
  };

  const switchSite = (next: Site) => {
    setSite(next);
    closeAllEditors();
  };

  const triggerDownload = (url: string) => {
    // A real anchor click starts the download without navigating away from the panel.
    const link = document.createElement("a");
    link.href = url;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadApp = async (app: (typeof APP_RELEASES)[number]) => {
    setAppDownloadError(null);
    setDownloadingApp(app.id);

    const startedAt = Date.now();

    try {
      const download =
        appDownloads[app.id] ?? (await resolveAppleSiliconDownload(app.repo));

      if (!appDownloads[app.id]) {
        setAppDownloads((current) => ({ ...current, [app.id]: download }));
      }

      const duration = getDownloadVisualDuration(download.size);
      setDownloadDuration(duration);

      triggerDownload(download.url);

      // Keep the loading visuals up long enough to be noticeable.
      const remaining = duration - (Date.now() - startedAt);
      if (remaining > 0) {
        await wait(remaining);
      }
    } catch (error) {
      setAppDownloadError({
        repo: app.repo,
        message:
          error instanceof Error
            ? error.message
            : "Kunde inte starta nedladdningen.",
      });
    } finally {
      setDownloadingApp(null);
    }
  };

  const openContracts = async () => {
    setContractError(null);
    setIsOpeningContracts(true);

    // Open a real top-level tab instead of navigating inside a sandboxed
    // preview iframe. Opening it synchronously keeps popup blockers happy.
    const adminWindow = window.open("about:blank", "_blank");
    if (adminWindow) {
      adminWindow.opener = null;
    }

    try {
      const token = await getToken();
      if (!token) {
        throw new Error("Ingen Clerk-session hittades. Logga in igen.");
      }

      const { data, error } = await supabase.functions.invoke("contract-signer", {
        headers: { Authorization: `Bearer ${token}` },
        body: { action: "login" },
      });

      if (error) throw new Error(error.message);
      if (!data?.redirectUrl) throw new Error("Kunde inte skapa en admin-session.");

      if (adminWindow) {
        adminWindow.location.href = data.redirectUrl as string;
      } else {
        window.location.assign(data.redirectUrl as string);
      }
    } catch (error) {
      adminWindow?.close();
      setContractError(
        error instanceof Error ? error.message : "Kunde inte öppna kontrakten.",
      );
    } finally {
      setIsOpeningContracts(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 animate-in fade-in duration-700">

      <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-stone-900">Kontrollpanel</h1>

        {/* Signed-in admin */}
        <div className="inline-flex max-w-full shrink-0 items-center gap-3 border border-stone-100 bg-white px-3.5 py-2.5">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              variables: {
                borderRadius: "0px",
                fontFamily: "inherit",
                colorPrimary: "#1c1917",
                colorText: "#292524",
                colorTextSecondary: "#78716c",
              },
              elements: {
                userButtonAvatarBox: "!h-10 !w-10 !rounded-none border border-stone-200",
                userButtonPopoverCard: "!rounded-none border border-stone-200 shadow-xl",
                userButtonPopoverActionButton: "!rounded-none",
                userButtonPopoverFooter: "hidden",
              },
            }}
          />
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-stone-400">
              Inloggad som
            </p>
            <p className="mt-0.5 truncate text-[11px] font-light tracking-wide text-stone-800">
              {displayName}
            </p>
            {displayEmail && (
              <p className="mt-0.5 truncate text-[9px] text-stone-400">
                {displayEmail}
              </p>
            )}
          </div>
        </div>
      </div>


      {/* Wedding planning helper */}
      <div className="mb-12">
        <div className="mb-6">
          <h2 className="text-xs uppercase tracking-widest font-bold text-stone-900">Verktyg</h2>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-bold">
            Planering som inte syns på sajten
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button
            onClick={() => {
              closeAllEditors();
              setIsWeddingPlannerOpen(true);
            }}
            className="group w-full h-full md:col-start-1 md:row-span-2 border border-stone-100 bg-white p-6 md:p-8 text-left shadow-sm transition-all hover:border-stone-400 hover:shadow-md"
          >
            <div className="flex h-full flex-col gap-6">
              <div className="flex flex-1 flex-col gap-6 md:flex-row md:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-stone-900 text-white">
                  <HeartHandshake size={22} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xs uppercase tracking-widest font-bold">Kundplanering</h3>
                  <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1 font-bold">
                    Kunder, samtal, bilder och kalender
                  </p>
                  <p className="mt-3 max-w-2xl text-xs font-light leading-relaxed text-stone-500">
                    Skriv ner vad ni pratade om, spara ett foto på kunden och se bröllop, privata och företagsuppdrag i en visuell kalender.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-stone-900">
                  Öppna planering
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              <UpcomingTimeline clients={upcomingBookings} isLoading={isPlanningLoading} />
            </div>
          </button>

          <button
            type="button"
            onClick={openContracts}
            disabled={isOpeningContracts}
            className="group w-full h-full md:col-start-2 md:row-start-1 border border-stone-100 bg-white p-6 md:p-8 text-left shadow-sm transition-all hover:border-stone-400 hover:shadow-md disabled:cursor-wait disabled:opacity-60"
          >
            <div className="flex h-full flex-col md:flex-row md:items-center gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-stone-900 text-white">
                <FileSignature size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs uppercase tracking-widest font-bold">Kontrakt</h3>
                <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1 font-bold">
                  Skapa, signera och kontrasignera avtal
                </p>
                <p className="mt-3 max-w-2xl text-xs font-light leading-relaxed text-stone-500">
                  Skapa, redigera och signera kontrakt med kunden direkt från din webbläsare.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-stone-900">
                {isOpeningContracts ? "Öppnar…" : "Öppna kontrakt"}
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </button>
          <div className="w-full h-full md:col-start-2 md:row-start-2 border border-stone-100 bg-white p-6 md:p-8 text-left shadow-sm transition-colors hover:border-stone-400">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center bg-stone-900 text-white">
                <AppWindowMac size={22} />
              </div>
              <div className="flex-1">
                <h3 className="text-xs uppercase tracking-widest font-bold">Applikationer</h3>
                <p className="text-[9px] text-stone-400 uppercase tracking-widest mt-1 font-bold">
                  Ladda ner & installera skrivbords-Applikationer
                </p>
                <p className="mt-3 max-w-2xl text-xs font-light leading-relaxed text-stone-500">
                  Verktyg för att ändra storlek på foton och bygga kollage. Ladda ner den senaste versionen som passar din dator.
                </p>
              </div>
            </div>

            <div className="mt-6 grid items-start gap-3 sm:grid-cols-2">
              {APP_RELEASES.map((app) => {
                const isDownloading = downloadingApp === app.id;
                const isOpen = openApp === app.id;
                const download = appDownloads[app.id];
                const releaseAge = download ? formatReleaseAge(download.publishedAt) : null;

                return (
                  <div
                    key={app.id}
                    className={`border bg-white transition-colors ${isOpen ? "border-stone-400" : "border-stone-100 hover:border-stone-400"
                      }`}
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setOpenApp((current) => (current === app.id ? null : app.id))
                      }
                      aria-expanded={isOpen}
                      aria-controls={`app-panel-${app.id}`}
                      className="group/app flex w-full items-center gap-3 px-3 py-3 text-left"
                    >
                      <img
                        src={app.icon}
                        alt=""
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-900">
                          {app.name}
                        </span>
                        <span className="mt-0.5 block text-[9px] uppercase tracking-tighter text-stone-400">
                          {isDownloading
                            ? "Laddar ner…"
                            : releaseAge
                              ? `Släppt ${releaseAge}`
                              : "Apple Silicon"}
                        </span>
                      </span>
                      <ChevronDown
                        size={15}
                        className={`shrink-0 transition-transform duration-200 ${isOpen
                          ? "rotate-180 text-stone-900"
                          : "text-stone-300 group-hover/app:text-stone-900"
                          }`}
                      />
                    </button>

                    {isOpen && (
                      <div
                        id={`app-panel-${app.id}`}
                        className="animate-in fade-in slide-in-from-top-1 border-t border-stone-100 px-3 py-3 duration-200"
                      >
                        <p className="text-[10px] font-light leading-relaxed text-stone-500">
                          {app.description}
                        </p>

                        <a
                          href={
                            download?.url ??
                            `https://github.com/${app.repo}/releases/latest`
                          }
                          onClick={(event) => {
                            event.preventDefault();
                            if (downloadingApp === null) void downloadApp(app);
                          }}
                          aria-disabled={downloadingApp !== null}
                          aria-busy={isDownloading}
                          className={`group/download relative mt-3 flex items-center justify-center gap-3 overflow-hidden px-3 py-2.5 text-[9px] font-bold uppercase tracking-widest transition-colors ${downloadingApp !== null
                            ? "cursor-wait bg-stone-800 text-stone-300"
                            : "bg-stone-900 text-white hover:bg-stone-800"
                            }`}
                        >
                          <span className="flex items-center gap-2">
                            {isDownloading ? (
                              <LoaderCircle size={14} className="animate-spin" />
                            ) : (
                              <Download size={14} />
                            )}
                            {isDownloading ? "Laddar ner…" : "Ladda ner"}
                          </span>

                          {isDownloading && (
                            <span className="absolute inset-x-0 bottom-0 h-[2px] bg-stone-700">
                              <span
                                className="block h-full w-full origin-left animate-[download-progress_linear_forwards] bg-white"
                                style={{ animationDuration: `${downloadDuration}ms` }}
                              />
                            </span>
                          )}
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {contractError && (
          <p className="mt-3 text-[10px] uppercase tracking-widest text-red-800" role="alert">
            {contractError}
          </p>
        )}

        {appDownloadError && (
          <p className="mt-3 text-[10px] uppercase tracking-widest text-red-800" role="alert">
            {appDownloadError.message}{" "}
            <a
              href={`https://github.com/${appDownloadError.repo}/releases/latest`}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              Öppna GitHub
            </a>
          </p>
        )}
      </div>

      {/* Site switcher: which site are we editing? */}
      <div className="mb-6">
        <h2 className="text-xs uppercase tracking-widest font-bold text-stone-900">Planering</h2>
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-1 font-bold">
          Välj vilken sajt du redigerar
        </p>
      </div>
      <div className="flex gap-2 mb-12">
        {(
          [
            { id: 'portfolio', title: 'Portföljsajt', hint: 'myeliefoto.se' },
            { id: 'wedding', title: 'Bröllopssajt', hint: 'myeliebrollopsfoto.se' },
          ] as const
        ).map((s) => {
          const isSelected = site === s.id;
          const photos = s.id === 'portfolio' ? portfolioPhotos : weddingPhotos;
          const photo =
            photos[SITE_SWITCHER_PHOTO[s.id]]?.url ?? photos[0]?.url;

          return (
            <button
              key={s.id}
              onClick={() => switchSite(s.id)}
              className={`group relative flex-1 overflow-hidden border px-6 py-5 text-left transition-all ${isSelected
                ? 'border-stone-900 bg-stone-900 text-white shadow-md'
                : 'border-stone-100 bg-white text-stone-400 hover:border-stone-400 hover:text-stone-900'
                }`}
            >
              {photo && (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-y-0 right-0 w-[42%]"
                  style={{ clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0 100%)' }}
                >
                  <img
                    src={cloudinaryImage(photo, { width: 640 })}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className={`h-full w-full object-cover transition-all duration-500 ${isSelected
                      ? 'opacity-100'
                      : 'opacity-60 grayscale group-hover:opacity-90 group-hover:grayscale-0'
                      }`}
                  />
                </span>
              )}

              <span className="relative z-10 block max-w-[56%]">
                <span className="block text-xs uppercase tracking-widest font-bold">{s.title}</span>
                <span className={`block text-[10px] uppercase tracking-tighter mt-1 ${isSelected ? 'text-stone-300' : 'text-stone-300'}`}>{s.hint}</span>
              </span>
            </button>
          );
        })}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {/* Gallerier */}
        <AdminCard
          title="Bildgallerier"
          description={site === 'wedding' ? "Hantera bröllopssidans foton" : "Hantera foton i alla sektioner"}
          isActive={!!activeTab}
          onClick={() => {
            closeAllEditors();
            setActiveTab(GALLERY_TABS[site][0]);
          }}
        />

        {/* New Wedding Pricing Card (shared table, shown for both sites) */}
        <AdminCard
          title="Bröllopspaket"
          description="Ändra priser och innehåll i korten"
          note="Samma paket visas på båda sajterna – ändringar slår igenom överallt."
          isActive={isWeddingEditorOpen}
          onClick={() => {
            closeAllEditors();
            setIsWeddingEditorOpen(true);
          }}
        />

        {site === 'wedding' && (
          <AdminCard
            title="Välkomsttext & process"
            description="Ändra välkomsttext och stegen i Så funkar det"
            isActive={isWelcomeEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsWelcomeEditorOpen(true);
            }}
          />
        )}

        {site === 'wedding' && (
          <AdminCard
            title="Förlovning"
            description="Ändra rubrik och text om förlovning"
            isActive={isEngagementEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsEngagementEditorOpen(true);
            }}
          />
        )}

        {site === 'portfolio' && (
          <AdminCard
            title="Artiklar"
            description="Hantera press & reportage"
            isActive={isArticleEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsArticleEditorOpen(true);
            }}
          />
        )}

        {site === 'portfolio' && (
          <AdminCard
            title="Om Mig"
            description="Redigera biografi och kontakt"
            isActive={isAboutTextEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsAboutTextEditorOpen(true);
            }}
          />
        )}
      </div>

      {/* Full-screen Overlay Editors */}
      {isArticleEditorOpen && <ArticleAdmin onClose={() => setIsArticleEditorOpen(false)} />}
      {isAboutTextEditorOpen && <AboutAdmin onClose={() => setIsAboutTextEditorOpen(false)} />}
      {isWeddingEditorOpen && <WeddingAdmin onClose={() => setIsWeddingEditorOpen(false)} />}
      {isWelcomeEditorOpen && <WelcomeAdmin onClose={() => setIsWelcomeEditorOpen(false)} />}
      {isEngagementEditorOpen && <EngagementAdmin onClose={() => setIsEngagementEditorOpen(false)} />}
      {isWeddingPlannerOpen && <WeddingPlanner onClose={() => setIsWeddingPlannerOpen(false)} />}

      {/* Inline Photo Editor */}
      {
        activeTab && (
          <div className="animate-in slide-in-from-bottom-4 duration-700">
            <div className="flex gap-8 mb-8 border-b border-stone-100 pb-4">
              {GALLERY_TABS[site].map(t => (
                <button
                  key={t}
                  onClick={() => setActiveTab(t)}
                  className={`text-[10px] uppercase tracking-widest transition-all ${activeTab === t
                    ? 'font-bold border-b border-stone-900 text-stone-900'
                    : 'text-stone-400 hover:text-stone-600'
                    }`}
                >
                  {TAB_LABELS[t] ?? t}
                </button>
              ))}
            </div>
            <PhotoEditor tag={activeTab} />
          </div>
        )
      }
    </div >
  );
}