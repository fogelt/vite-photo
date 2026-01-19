import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";
import { uploadArticleImage } from "../photo-editor/api/photo-actions";
import { Trash2, Plus, Type, Image as ImageIcon, X } from "lucide-react";

type ArticleType = 'external' | 'internal';

interface ContentBlock {
  id: string;
  type: 'text' | 'image';
  value: string;
}

export function ArticleAdmin({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    publisher: "",
    description: "",
    image_url: "",
    link_url: "",
    published_date: "",
    type: 'external' as ArticleType,
    slug: "",
    content_blocks: [] as ContentBlock[], // Dynamic images/text
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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, targetBlockId?: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const token = await getAuthToken();
      const result = await uploadArticleImage(token, file);

      if (targetBlockId) {
        // Adding image to the dynamic blocks
        setFormData(prev => ({
          ...prev,
          content_blocks: prev.content_blocks.map(b =>
            b.id === targetBlockId ? { ...b, value: result.url } : b
          )
        }));
      } else {
        // Adding main hero image
        setFormData(prev => ({ ...prev, image_url: result.url }));
      }
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel vid uppladdning", message: err.message });
    } finally {
      setIsUploading(false);
    }
  };

  const addBlock = (type: 'text' | 'image') => {
    const newBlock: ContentBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
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
        // Make sure it's valid JSON
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

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Artiklar & Reportage</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium">Administrationsläge</p>
          </div>
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.2em] border-b border-stone-900 pb-1 font-bold">
            Stäng
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
          <section className="lg:col-span-7 space-y-12">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Skapa Innehåll</h3>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Type Toggle */}
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

                {/* Image Upload (Hero) */}
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
                  <div className="space-y-8 pt-8 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <h4 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold">Reportage-block</h4>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => addBlock('text')} className="p-2 hover:bg-stone-100 rounded-md transition-colors text-stone-600"><Type size={18} /></button>
                        <button type="button" onClick={() => addBlock('image')} className="p-2 hover:bg-stone-100 rounded-md transition-colors text-stone-600"><ImageIcon size={18} /></button>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {formData.content_blocks.map((block) => (
                        <div key={block.id} className="relative bg-stone-50 p-6 border border-stone-200 rounded-sm group">
                          <button
                            type="button"
                            onClick={() => removeBlock(block.id)}
                            className="absolute -top-3 -right-3 bg-stone-900 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>

                          {block.type === 'text' ? (
                            <textarea
                              placeholder="Skriv reportagetext..."
                              className="w-full bg-transparent border-none outline-none text-sm font-light h-32 resize-none"
                              value={block.value}
                              onChange={(e) => {
                                const newBlocks = formData.content_blocks.map(b =>
                                  b.id === block.id ? { ...b, value: e.target.value } : b
                                );
                                setFormData({ ...formData, content_blocks: newBlocks });
                              }}
                            />
                          ) : (
                            <div className="space-y-4">
                              {block.value ? (
                                <img src={block.value} className="w-full h-40 object-cover" alt="" />
                              ) : (
                                <label className="flex flex-col items-center justify-center h-40 border border-dashed border-stone-300 cursor-pointer">
                                  <input type="file" className="hidden" onChange={(e) => handleFileSelect(e, block.id)} />
                                  <span className="text-[10px] uppercase font-bold text-stone-400">Ladda upp bild</span>
                                </label>
                              )}
                            </div>
                          )}
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
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-bold">Arkiv</h3>
            <div className="space-y-4">
              {isLoading ? (
                <p className="animate-pulse text-[10px] uppercase font-bold text-stone-300">Hämtar...</p>
              ) : articles?.map((art) => (
                <div key={art.id} className="flex gap-4 p-4 border border-stone-100 bg-white shadow-sm">
                  <img src={art.image_url} className="w-16 h-16 object-cover" alt="" />
                  <div className="flex-grow">
                    <div className="flex items-center gap-2">
                      <h4 className="text-[11px] uppercase tracking-wider text-stone-800 font-bold truncate max-w-[150px]">{art.title}</h4>
                      <span className="text-[7px] px-1 bg-stone-900 text-white uppercase font-bold">{art.type === 'internal' ? 'Lokal' : 'Extern'}</span>
                    </div>
                    <p className="text-[9px] text-stone-400 uppercase mt-1">{art.published_date}</p>
                    <button onClick={() => handleDelete(art.id)} className="text-[9px] text-red-400 hover:text-red-600 uppercase mt-2 font-bold transition-colors">
                      Ta bort
                    </button>
                  </div>
                </div>
              ))}
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