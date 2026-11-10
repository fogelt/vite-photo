import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";
import { uploadArticleImage } from "../photo-editor/api/photo-actions";
import { Image as ImageIcon, X, RefreshCw, Check, Search } from "lucide-react";

type ArticleType = 'external' | 'internal';

interface ContentBlock {
  id: string;
  type: 'image';
  value: string;
}

const archiveFilters = [
  { id: "all", label: "Alla" },
  { id: "internal", label: "Lokala" },
  { id: "external", label: "Externa" },
] as const;

type ArchiveType = (typeof archiveFilters)[number]["id"];

export function ArticleAdmin({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLabel, setScanLabel] = useState("");
  const [archiveSearch, setArchiveSearch] = useState("");
  const [archiveType, setArchiveType] = useState<ArchiveType>("all");
  const [archiveLimit, setArchiveLimit] = useState(10);

  // Keep the bar moving even if a proxy buffers the streamed progress events.
  useEffect(() => {
    if (!isScanning) return;

    const interval = window.setInterval(() => {
      setScanProgress((current) =>
        current >= 90
          ? current
          : current + Math.max(1, Math.round((90 - current) * 0.06))
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isScanning]);
  const [formData, setFormData] = useState({
    title: "",
    publisher: "",
    description: "",
    image_url: "",
    link_url: "",
    published_date: "",
    type: 'external' as ArticleType,
    slug: "",
    content_blocks: [] as ContentBlock[],
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type?: 'info' | 'danger'; onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const getAuthToken = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Verifiering misslyckades. Logga in igen.");
    return token;
  };

  const { data: articles, isLoading } = useQuery({
    queryKey: ["articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const draftArticles = (articles ?? []).filter((article) => article.is_published === false);
  const publishedArticles = (articles ?? []).filter((article) => article.is_published !== false);

  const filteredArchive = publishedArticles.filter((article) => {
    if (archiveType !== "all" && article.type !== archiveType) return false;

    const query = archiveSearch.trim().toLowerCase();
    if (!query) return true;

    return `${article.title} ${article.publisher} ${article.description}`
      .toLowerCase()
      .includes(query);
  });

  const visibleArchive = filteredArchive.slice(0, archiveLimit);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, targetBlockId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const token = await getAuthToken();
      const result = await uploadArticleImage(token, file);

      if (targetBlockId) {
        setFormData(prev => ({
          ...prev,
          content_blocks: prev.content_blocks.map(b =>
            b.id === targetBlockId ? { ...b, value: result.url } : b
          )
        }));
      } else {
        setFormData(prev => ({ ...prev, image_url: result.url }));
      }
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel vid uppladdning", message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const addImageBlock = () => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      value: ""
    };
    setFormData(prev => ({
      ...prev,
      content_blocks: [...prev.content_blocks, newBlock]
    }));
  };

  const removeBlock = (id: string) => {
    setFormData(prev => ({
      ...prev,
      content_blocks: prev.content_blocks.filter(b => b.id !== id)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.image_url) return;
    setIsSaving(true);

    try {
      const token = await getAuthToken();
      const authClient = createClerkSupabaseClient(token);

      const payload = {
        ...formData,
        link_url: formData.type === 'external' ? formData.link_url : null,
        slug: formData.type === 'internal' ? (formData.slug || formData.title.toLowerCase().replace(/\s+/g, '-')) : null,
        content_blocks: formData.type === 'internal' ? formData.content_blocks : [],
      };

      const { error } = await authClient.from("articles").insert([payload]);
      if (error) throw error;

      setFormData({
        title: "", publisher: "", description: "", image_url: "",
        link_url: "", published_date: "", type: 'external', slug: "",
        content_blocks: []
      });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      setModalConfig({ isOpen: true, title: "Publicerad", message: "Innehållet har sparats." });

    } catch (error: any) {
      setModalConfig({ isOpen: true, title: "Ett fel uppstod", message: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    setModalConfig({
      isOpen: true, title: "Radera", message: "Är du säker?", type: 'danger',
      onConfirm: async () => {
        try {
          const token = await getAuthToken();
          const authClient = createClerkSupabaseClient(token);
          const { error } = await authClient.from("articles").delete().eq("id", id);
          if (error) throw error;
          queryClient.invalidateQueries({ queryKey: ["articles"] });
        } catch (error: any) {
          setModalConfig({ isOpen: true, title: "Fel", message: error.message });
        }
      }
    });
  };

  const handleScan = async () => {
    setIsScanning(true);
    setScanMessage(null);
    setScanProgress(0);
    setScanLabel("Förbereder sökning…");

    try {
      const token = await getAuthToken();
      let data: any = null;
      let streamStarted = false;

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey =
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          import.meta.env.VITE_SUPABASE_ANON_KEY;

        const response = await fetch(
          `${supabaseUrl}/functions/v1/article-importer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
              apikey: supabaseKey,
            },
            body: JSON.stringify({ action: "scan", stream: true }),
          },
        );

        if (!response.ok) {
          let message = "Kunde inte starta sökningen.";
          try {
            const payload = await response.json();
            if (payload?.error) {
              message = payload.detail
                ? `${payload.error} ${payload.detail}`
                : payload.error;
            }
          } catch {
            // Use the generic message.
          }
          throw new Error(message);
        }

        if (!response.body) {
          throw new Error("Importfunktionen svarade utan innehåll.");
        }

        streamStarted = true;

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const handleLine = (line: string) => {
          const trimmed = line.trim();
          if (!trimmed) return;

          const event = JSON.parse(trimmed);

          if (event.type === "progress") {
            if (typeof event.progress === "number") {
              setScanProgress((current) => Math.max(current, event.progress));
            }
            if (typeof event.message === "string") {
              setScanLabel(event.message);
            }
          } else if (event.type === "done") {
            data = event;
          } else if (event.type === "error") {
            throw new Error(
              event.detail ? `${event.message} ${event.detail}` : event.message,
            );
          }
        };

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) handleLine(line);
        }

        if (buffer) handleLine(buffer);
        if (!data) throw new Error("Sökningen returnerade inget resultat.");
      } catch (streamError) {
        // Only retry through invoke when the stream never started. If the
        // function itself reported an error, surface that instead.
        if (streamStarted) throw streamError;

        console.warn("Streaming scan unavailable, falling back", streamError);
        setScanLabel("Söker igenom nyhetskällor…");

        const { data: fallbackData, error } = await supabase.functions.invoke(
          "article-importer",
          {
            headers: { Authorization: `Bearer ${token}` },
            body: { action: "scan" },
          },
        );

        if (error) throw error;
        if (fallbackData?.error) throw new Error(fallbackData.error);
        data = fallbackData;
      }

      queryClient.invalidateQueries({ queryKey: ["articles"] });

      const inserted = Number(data?.inserted ?? 0);
      const updated = Number(data?.updated ?? 0);
      const cleaned = Number(data?.cleaned ?? 0);
      const failed = Number(data?.failed ?? 0);
      const feedErrors = Number(data?.feedErrors ?? 0);
      const message = [
        inserted > 0
          ? `${inserted} nya artiklar hittades och sparades som utkast.`
          : "",
        updated > 0 ? `${updated} utkast uppdaterades.` : "",
        cleaned > 0 ? `${cleaned} felaktiga utkast togs bort.` : "",
        failed > 0 ? `${failed} artiklar kunde inte importeras.` : "",
        feedErrors > 0 && inserted === 0 && updated === 0
          ? "Google News svarade tillfälligt 503. Försök igen om en stund."
          : feedErrors > 0
            ? "Vissa sökningar mot Google News misslyckades (503)."
            : "",
      ].filter(Boolean).join(" ");

      setScanProgress(100);
      setScanMessage(message || "Inga nya artiklar hittades.");
    } catch (error: any) {
      let message = error?.message ?? "Kunde inte söka efter artiklar.";

      // Supabase wraps non-2xx function responses; surface our JSON details.
      if (error?.context && typeof error.context.json === "function") {
        try {
          const payload = await error.context.json();
          if (payload?.error) {
            message = payload.detail
              ? `${payload.error} ${payload.detail}`
              : payload.error;
          }
        } catch {
          // Keep the original message.
        }
      }

      setScanMessage(message);
    } finally {
      setIsScanning(false);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      const token = await getAuthToken();
      const authClient = createClerkSupabaseClient(token);
      const { error } = await authClient
        .from("articles")
        .update({ is_published: true })
        .eq("id", id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch (error: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: error.message });
    }
  };

  const handlePublishAll = async () => {
    try {
      const token = await getAuthToken();
      const authClient = createClerkSupabaseClient(token);
      const { error } = await authClient
        .from("articles")
        .update({ is_published: true })
        .eq("is_published", false);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch (error: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: error.message });
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Artiklar & Reportage</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium">Administrationsläge</p>
          </div>
          <button onClick={onClose} className="inline-flex items-center gap-2 bg-stone-900 px-5 py-3 text-[9px] font-bold uppercase tracking-[0.2em] text-white shadow-md transition-colors hover:bg-stone-700"
          >
            <X size={14} />
            Stäng
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <section className="lg:col-span-7 space-y-12">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Skapa Innehåll</h3>

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="flex gap-4 p-1 bg-stone-100 rounded-sm">
                {(['external', 'internal'] as ArticleType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setFormData({ ...formData, type: t })}
                    className={`flex-1 py-2 text-[9px] uppercase tracking-widest font-bold transition-all ${formData.type === t ? "bg-white text-stone-900 shadow-sm" : "text-stone-400"
                      }`}
                  >
                    {t === 'external' ? 'Extern Artikel' : 'Lokalt Reportage'}
                  </button>
                ))}
              </div>

              <div className="space-y-6">
                <InputField label="Huvudtitel" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} />

                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Omslagsbild</label>
                  <label className="block border-2 border-dashed border-stone-300 p-8 text-center cursor-pointer hover:border-stone-900 transition-colors bg-stone-50">
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e)} />
                    {formData.image_url ? (
                      <div className="space-y-4">
                        <img src={formData.image_url} className="h-48 mx-auto object-cover rounded-sm" alt="Preview" />
                        <p className="text-[9px] uppercase text-stone-400 font-bold">Byt omslagsbild</p>
                      </div>
                    ) : (
                      <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">
                        {isUploading ? "Laddar upp..." : "+ Ladda upp huvudbild"}
                      </p>
                    )}
                  </label>
                </div>

                <InputField label="Publicist / Sammanhang" value={formData.publisher} placeholder="t.ex. Vi Lärare" onChange={(v) => setFormData({ ...formData, publisher: v })} />

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Ingress / Sammanfattning</label>
                  <textarea
                    required
                    className="w-full border border-stone-300 bg-stone-50/30 p-4 focus:border-stone-900 outline-none text-sm font-light h-24 resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                {formData.type === 'external' ? (
                  <InputField label="Länk till artikel" value={formData.link_url} placeholder="https://..." onChange={(v) => setFormData({ ...formData, link_url: v })} />
                ) : (
                  <div className="space-y-6 pt-8 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold">Innehållsbilder</h4>
                      <button
                        type="button"
                        onClick={addImageBlock}
                        className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 rounded-sm transition-colors text-stone-900 text-[9px] uppercase tracking-widest font-bold"
                      >
                        <ImageIcon size={14} /> Lägg till bild
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {formData.content_blocks.map((block) => (
                        <div key={block.id} className="relative aspect-square bg-stone-50 border border-stone-200 rounded-sm group overflow-hidden">
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="absolute top-2 right-2 z-10 bg-stone-900/80 text-white p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={10} />
                          </button>

                          <div className="h-full w-full">
                            {block.value ? (
                              <img src={block.value} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <label className="flex flex-col items-center justify-center h-full w-full cursor-pointer hover:bg-stone-100 transition-colors">
                                <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, block.id)} />
                                <ImageIcon size={16} className="text-stone-300 mb-2" />
                                <span className="text-[8px] uppercase font-bold text-stone-400">Välj bild</span>
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <InputField label="Datum" value={formData.published_date} placeholder="Januari 2026" onChange={(v) => setFormData({ ...formData, published_date: v })} />
              </div>

              <button
                type="submit"
                disabled={isSaving || isUploading || !formData.image_url}
                className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-5 disabled:opacity-30 font-bold transition-all"
              >
                {isSaving ? "Sparar..." : "Publicera innehåll"}
              </button>
            </form>
          </section>

          <section className="lg:col-span-5 space-y-12">
            <div className="space-y-4 border border-stone-100 bg-white p-5 shadow-sm">
              <div>
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold">Automatisk import</h3>
                <p className="mt-2 text-[10px] font-light leading-relaxed text-stone-500">
                  Söker efter nya artiklar som nämner Myelie Lendelund. Nya träffar sparas som utkast innan de publiceras.
                </p>
              </div>
              <button
                type="button"
                onClick={handleScan}
                disabled={isScanning}
                className="inline-flex items-center gap-2 bg-stone-100 px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-stone-900 transition-colors hover:bg-stone-200 disabled:cursor-wait disabled:opacity-60"
              >
                <RefreshCw size={13} className={isScanning ? "animate-spin" : ""} />
                {isScanning ? "Söker..." : "Sök nya artiklar"}
              </button>
              {isScanning && (
                <div className="space-y-2">
                  <div className="h-1 w-full overflow-hidden bg-stone-100">
                    <div
                      className="h-full bg-stone-900 transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.max(5, Math.min(100, scanProgress))}%`,
                      }}
                    />
                  </div>
                  <p className="text-[9px] uppercase tracking-widest text-stone-400">
                    {scanLabel || "Förbereder sökning…"}
                  </p>
                </div>
              )}
              {!isScanning && scanMessage && (
                <p className="text-[9px] uppercase tracking-widest text-stone-400">{scanMessage}</p>
              )}
            </div>

            {draftArticles.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold">
                    Utkast ({draftArticles.length})
                  </h3>
                  <button
                    type="button"
                    onClick={handlePublishAll}
                    className="text-[9px] uppercase tracking-widest font-bold text-stone-500 transition-colors hover:text-stone-900"
                  >
                    Publicera alla
                  </button>
                </div>

                <div className="force-scrollbar-show-y max-h-[45vh] space-y-4 overflow-y-auto pr-1">
                  {draftArticles.map((art) => (
                  <div key={art.id} className="flex gap-4 border border-stone-200 bg-stone-50/40 p-4">
                    <img src={art.image_url} className="w-16 h-16 object-cover" alt="" />
                    <div className="min-w-0 flex-grow">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate text-[11px] uppercase tracking-wider text-stone-800 font-bold">{art.title}</h4>
                        <span className="shrink-0 bg-amber-100 px-1 text-[7px] uppercase font-bold text-amber-900">Utkast</span>
                      </div>
                      <p className="mt-1 text-[9px] uppercase text-stone-400">{art.publisher} · {art.published_date}</p>
                      <p className="mt-1 line-clamp-2 text-[10px] font-light leading-relaxed text-stone-500">
                        {art.description}
                      </p>
                      <div className="mt-2 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => handlePublish(art.id)}
                          className="inline-flex items-center gap-1 text-[9px] font-bold uppercase text-stone-800 transition-colors hover:text-stone-950"
                        >
                          <Check size={11} />
                          Publicera
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(art.id)}
                          className="text-[9px] font-bold uppercase text-red-400 transition-colors hover:text-red-600"
                        >
                          Ta bort
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-bold">Arkiv</h3>
                <span className="text-[9px] uppercase tracking-widest text-stone-400">
                  {filteredArchive.length} av {publishedArticles.length}
                </span>
              </div>

              <div className="relative">
                <Search
                  size={13}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-stone-400"
                  aria-hidden="true"
                />
                <input
                  type="text"
                  value={archiveSearch}
                  onChange={(event) => {
                    setArchiveSearch(event.target.value);
                    setArchiveLimit(10);
                  }}
                  placeholder="Sök i arkivet"
                  aria-label="Sök i arkivet"
                  className="h-9 w-full border border-stone-200 bg-white pl-8 pr-8 text-[11px] font-light text-stone-800 outline-none transition-colors placeholder:text-stone-300 focus:border-stone-900"
                />
                {archiveSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setArchiveSearch("");
                      setArchiveLimit(10);
                    }}
                    aria-label="Rensa sökning"
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-stone-400 transition-colors hover:text-stone-900"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              <div className="flex border border-stone-100 bg-stone-50 p-1">
                {archiveFilters.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      setArchiveType(option.id);
                      setArchiveLimit(10);
                    }}
                    aria-pressed={archiveType === option.id}
                    className={`flex-1 px-2 py-1.5 text-[8px] font-bold uppercase tracking-widest transition-colors ${
                      archiveType === option.id
                        ? "bg-stone-900 text-white"
                        : "text-stone-500 hover:text-stone-900"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {isLoading ? (
                <p className="animate-pulse text-[10px] uppercase font-bold text-stone-300">Hämtar...</p>
              ) : filteredArchive.length === 0 ? (
                <div className="border border-dashed border-stone-200 bg-white px-4 py-8 text-center">
                  <p className="text-[9px] uppercase tracking-widest text-stone-400">
                    Inga artiklar matchar
                  </p>
                  {(archiveSearch || archiveType !== "all") && (
                    <button
                      type="button"
                      onClick={() => {
                        setArchiveSearch("");
                        setArchiveType("all");
                        setArchiveLimit(10);
                      }}
                      className="mt-2 text-[9px] font-bold uppercase tracking-widest text-stone-600 underline underline-offset-4 transition-colors hover:text-stone-900"
                    >
                      Rensa filter
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="force-scrollbar-show-y max-h-[55vh] space-y-4 overflow-y-auto pr-1 lg:max-h-[65vh]">
                    {visibleArchive.map((art) => (
                      <div key={art.id} className="flex gap-4 border border-stone-100 bg-white p-4 shadow-sm">
                        <img
                          src={art.image_url}
                          className="h-16 w-16 shrink-0 object-cover"
                          alt=""
                        />
                        <div className="min-w-0 flex-grow">
                          <div className="flex items-center gap-2">
                            <h4 className="truncate text-[11px] font-bold uppercase tracking-wider text-stone-800">
                              {art.title}
                            </h4>
                            <span className="shrink-0 bg-stone-900 px-1 text-[7px] font-bold uppercase text-white">
                              {art.type === "internal" ? "Lokal" : "Extern"}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-[9px] uppercase text-stone-400">
                            {art.publisher} · {art.published_date}
                          </p>
                          <button
                            onClick={() => handleDelete(art.id)}
                            className="mt-2 text-[9px] font-bold uppercase text-red-400 transition-colors hover:text-red-600"
                          >
                            Ta bort
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredArchive.length > archiveLimit && (
                    <button
                      type="button"
                      onClick={() => setArchiveLimit((limit) => limit + 10)}
                      className="w-full border border-stone-200 px-4 py-3 text-[9px] font-bold uppercase tracking-widest text-stone-600 transition-colors hover:border-stone-900 hover:text-stone-900"
                    >
                      Visa fler ({filteredArchive.length - archiveLimit} kvar)
                    </button>
                  )}
                </>
              )}
            </div>
          </section>
        </div>
      </div>
      <Modal {...modalConfig} onClose={() => setModalConfig(p => ({ ...p, isOpen: false }))} />
    </div>
  );
}

function InputField({ label, value, onChange, placeholder = "" }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string }) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">{label}</label>
      <input
        required
        type="text"
        placeholder={placeholder}
        className="w-full border border-stone-300 bg-stone-50/30 p-4 focus:border-stone-900 outline-none text-sm font-light transition-all"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}