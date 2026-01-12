import { useState, useEffect } from "react";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";

export function WeddingAdmin({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, title: "", message: "" });

  useEffect(() => {
    async function fetchPackages() {
      const { data } = await supabase.from("wedding_packages").select("*").order("sort_order", { ascending: true });
      if (data) setPackages(data);
      setLoading(false);
    }
    fetchPackages();
  }, []);

  const handleUpdateField = (id: string, field: string, value: any) => {
    setPackages(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = await getToken({ template: "supabase" });
      const adminClient = createClerkSupabaseClient(token!);

      const { error } = await adminClient.from("wedding_packages").upsert(packages);
      if (error) throw error;

      setModalConfig({ isOpen: true, title: "Uppdaterad", message: "Bröllopspaketen har sparats." });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center text-[10px] uppercase tracking-widest text-stone-400">Hämtar paket...</div>;

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Bröllopspaket</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium font-bold">Ändra priser och innehåll</p>
          </div>
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.2em] border-b border-stone-900 pb-1 font-bold">Tillbaka</button>
        </div>

        <form onSubmit={handleSave} className="space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {packages.map((pkg) => (
              <div key={pkg.id} className={`p-8 border ${pkg.highlight ? 'border-stone-900 bg-stone-50/50' : 'border-stone-100'} space-y-6`}>
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">Paket: {pkg.name}</h3>
                  <label className="flex items-center gap-2 text-[10px] uppercase font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pkg.highlight}
                      onChange={(e) => handleUpdateField(pkg.id, 'highlight', e.target.checked)}
                    /> Highlight
                  </label>
                </div>

                <div className="space-y-4">
                  <EditInput label="Paketnamn" value={pkg.name} onChange={(v) => handleUpdateField(pkg.id, 'name', v)} />
                  <EditInput label="Tid" value={pkg.time} onChange={(v) => handleUpdateField(pkg.id, 'time', v)} />
                  <EditTextArea label="Vad ingår" value={pkg.includes} onChange={(v) => handleUpdateField(pkg.id, 'includes', v)} />
                  <EditInput label="Leverans/Bilder" value={pkg.images} onChange={(v) => handleUpdateField(pkg.id, 'images', v)} />
                  <EditInput label="Pris" value={pkg.price} onChange={(v) => handleUpdateField(pkg.id, 'price', v)} />
                </div>
              </div>
            ))}
          </div>

          <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-6 font-bold hover:bg-stone-800 transition-all shadow-xl">
            {saving ? "Sparar..." : "Spara alla ändringar"}
          </button>
        </form>
      </div>
      <Modal {...modalConfig} onClose={() => setModalConfig({ ...modalConfig, isOpen: false })} />
    </div>
  );
}

function EditInput({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{label}</label>
      <input className="w-full border-b border-stone-200 py-1 text-sm outline-none focus:border-stone-900 bg-transparent" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}

function EditTextArea({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] uppercase tracking-widest text-stone-400 font-bold">{label}</label>
      <textarea rows={2} className="w-full border border-stone-100 p-2 text-xs outline-none focus:border-stone-900 bg-white resize-none" value={value} onChange={e => onChange(e.target.value)} />
    </div>
  );
}