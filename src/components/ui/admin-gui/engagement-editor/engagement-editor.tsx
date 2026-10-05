import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, createClerkSupabaseClient } from "@/services";
import { fetchPhotosByTag } from "@/services/photo-fetcher";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";
import { uploadAndSavePhoto, deletePhoto } from "../photo-editor/api/photo-actions";

const TAG = "engagement";

export function EngagementAdmin({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [rowId, setRowId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type?: 'info' | 'danger'; onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const { data: photos = [] } = useQuery({
    queryKey: ["photos", TAG],
    queryFn: () => fetchPhotosByTag(TAG),
  });

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase.from("engagement_content").select("*").maybeSingle();
      if (data) {
        setRowId(data.id);
        setTitle(data.title || "");
        setText(data.text || "");
      }
      setLoading(false);
    }
    fetchContent();
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Kunde inte verifiera din identitet (Clerk token saknas)");
      await uploadAndSavePhoto(token, file, TAG);
      await queryClient.invalidateQueries({ queryKey: ["photos", TAG] });
      setModalConfig({ isOpen: true, title: "Klar!", message: "Bilden har laddats upp. Den första bilden visas på sajten." });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: err.message });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = (photoId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Radera bild",
      message: "Vill du verkligen ta bort bilden?",
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = await getToken({ template: "supabase" });
          if (!token) throw new Error("Kunde inte verifiera din identitet (Clerk token saknas)");
          await deletePhoto(token, photoId);
          queryClient.invalidateQueries({ queryKey: ["photos", TAG] });
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Fel vid radering", message: err.message });
        }
      }
    });
  };

  const closeModal = () => setModalConfig({ isOpen: false, title: "", message: "" });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken({ template: "supabase" });
      const adminClient = createClerkSupabaseClient(token!);

      if (rowId !== null) {
        const { error } = await adminClient.from("engagement_content").update({ title, text }).eq("id", rowId);
        if (error) throw error;
      } else {
        const { data, error } = await adminClient.from("engagement_content").insert({ title, text }).select("id").single();
        if (error) throw error;
        if (data) setRowId(data.id);
      }

      setModalConfig({ isOpen: true, title: "Uppdaterad", message: "Förlovningstexten har sparats." });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center text-[10px] uppercase tracking-widest text-stone-400">Hämtar text...</div>;

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Förlovning</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium font-bold">Visas på bröllopssajten</p>
          </div>
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.2em] border-b border-stone-900 pb-1 font-bold">Tillbaka</button>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Rubrik</label>
            <input
              className="w-full border-b border-stone-200 py-2 text-lg font-light outline-none focus:border-stone-900 bg-transparent"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Förlovning"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Text</label>
            <textarea
              rows={6}
              className="w-full border border-stone-100 p-3 text-sm font-light leading-relaxed outline-none focus:border-stone-900 bg-white resize-y"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Skriv förlovningstexten här..."
            />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-6 font-bold hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50">
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
        </form>

        {/* Image Section */}
        <div className="mt-16 pt-10 border-t border-stone-200 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-[11px] uppercase tracking-[0.4em] text-stone-400 font-bold">Bild</h3>
              <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2">Första bilden visas på sajten</p>
            </div>
            <label className="cursor-pointer">
              <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={isUploading} />
              <span className={`text-sm font-bold border-b transition-all ${isUploading ? 'text-stone-300 border-stone-300' : 'text-stone-900 border-stone-900 hover:text-stone-600 hover:border-stone-600'}`}>
                {isUploading ? "Laddar upp..." : "+ LADDA UPP"}
              </span>
            </label>
          </div>

          {photos.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {photos.map((photo: any, index: number) => (
                <div key={photo.id} className="relative aspect-square bg-stone-50 overflow-hidden group border border-stone-100">
                  <img src={photo.url} className="w-full h-full object-cover" alt="" />
                  {index === 0 && (
                    <div className="absolute top-1.5 left-1.5 bg-white/90 px-1.5 py-0.5 text-[8px] font-mono text-stone-900 font-bold rounded-sm shadow-sm">
                      Visas
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(photo.id)}
                    className="absolute top-1.5 right-1.5 bg-white/95 px-2 py-0.5 text-[7px] font-mono text-red-700 hover:bg-red-700 hover:text-white transition-colors shadow-sm rounded-sm uppercase tracking-wider opacity-0 group-hover:opacity-100"
                  >
                    Radera
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-stone-400 text-xs italic">Ingen bild uppladdad än.</p>
          )}
        </div>
      </div>
      {modalConfig.isOpen && modalConfig.title && <Modal {...modalConfig} onClose={closeModal} />}
    </div>
  );
}
