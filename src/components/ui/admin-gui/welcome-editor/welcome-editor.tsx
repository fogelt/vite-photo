import { useState, useEffect } from "react";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";

export function WelcomeAdmin({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rowId, setRowId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "" });

  useEffect(() => {
    async function fetchContent() {
      const { data } = await supabase.from("welcome_content").select("*").maybeSingle();
      if (data) {
        setRowId(data.id);
        setTitle(data.title || "");
        setText(data.text || "");
      }
      setLoading(false);
    }
    fetchContent();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken({ template: "supabase" });
      const adminClient = createClerkSupabaseClient(token!);

      if (rowId !== null) {
        const { error } = await adminClient.from("welcome_content").update({ title, text }).eq("id", rowId);
        if (error) throw error;
      } else {
        const { data, error } = await adminClient.from("welcome_content").insert({ title, text }).select("id").single();
        if (error) throw error;
        if (data) setRowId(data.id);
      }

      setModalConfig({ isOpen: true, title: "Uppdaterad", message: "Välkomsttexten har sparats." });
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
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Välkomsttext</h2>
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
              placeholder="Välkomna hit"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">Text</label>
            <textarea
              rows={6}
              className="w-full border border-stone-100 p-3 text-sm font-light leading-relaxed outline-none focus:border-stone-900 bg-white resize-y"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Skriv välkomsttexten här..."
            />
          </div>

          <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-6 font-bold hover:bg-stone-800 transition-all shadow-xl disabled:opacity-50">
            {saving ? "Sparar..." : "Spara ändringar"}
          </button>
        </form>
      </div>
      <Modal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
    </div>
  );
}
