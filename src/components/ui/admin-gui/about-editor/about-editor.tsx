import { useState, useEffect } from "react";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";

export function AboutAdmin({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState({
    name: "",
    bio_p1: "",
    bio_p2: "",
    email: "",
    phone: ""
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'danger';
  }>({ isOpen: false, title: "", message: "" });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  // Helper to get the authenticated client (same as ArticleAdmin)
  const getAuthenticatedClient = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Verifiering misslyckades. Logga in igen.");
    return createClerkSupabaseClient(token);
  };

  useEffect(() => {
    async function fetchAbout() {
      try {
        const { data, error } = await supabase.from("about_content").select("*").single();
        if (error) throw error;
        if (data) setContent(data);
      } catch (err) {
        console.error("Error fetching about content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchAbout();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const adminClient = await getAuthenticatedClient();
      const { error } = await adminClient
        .from("about_content")
        .upsert({ id: 1, ...content });

      if (error) throw error;

      setModalConfig({
        isOpen: true,
        title: "Uppdaterad",
        message: "Din profilinformation har sparats."
      });
    } catch (err: any) {
      console.error("Error saving:", err);
      setModalConfig({
        isOpen: true,
        title: "Ett fel uppstod",
        message: err.message || "Kunde inte spara ändringarna."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center">
      <div className="text-[10px] uppercase tracking-widest text-stone-400 animate-pulse">Hämtar innehåll...</div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header with Tillbaka button */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Om mig</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium">Redigera profil & kontakt</p>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-[0.2em] border-b border-stone-900 pb-1 hover:text-stone-400 hover:border-stone-400 transition-all font-bold"
          >
            Tillbaka
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-12">
          <section className="space-y-8">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Biografi</h3>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Ditt Namn</label>
                <input
                  required
                  className="w-full border border-stone-300 bg-stone-50/30 p-3 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light shadow-sm"
                  value={content.name}
                  onChange={e => setContent({ ...content, name: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Första stycket</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-stone-300 bg-stone-50/30 p-4 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light leading-relaxed resize-none shadow-sm"
                  value={content.bio_p1}
                  onChange={e => setContent({ ...content, bio_p1: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Andra stycket</label>
                <textarea
                  required
                  rows={4}
                  className="w-full border border-stone-300 bg-stone-50/30 p-4 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light leading-relaxed resize-none shadow-sm"
                  value={content.bio_p2}
                  onChange={e => setContent({ ...content, bio_p2: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section className="space-y-8">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Kontaktuppgifter</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">E-post</label>
                <input
                  required
                  type="email"
                  className="w-full border border-stone-300 bg-stone-50/30 p-3 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light shadow-sm"
                  value={content.email}
                  onChange={e => setContent({ ...content, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Telefon</label>
                <input
                  required
                  className="w-full border border-stone-300 bg-stone-50/30 p-3 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light shadow-sm"
                  value={content.phone}
                  onChange={e => setContent({ ...content, phone: e.target.value })}
                />
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-6 hover:bg-stone-800 transition-all disabled:opacity-30 shadow-lg shadow-stone-200 font-bold"
          >
            {saving ? "Sparar..." : "Publicera uppdatering"}
          </button>
        </form>
      </div>

      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}