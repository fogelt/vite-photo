import { useState, useEffect } from "react";
import { supabase, createClerkSupabaseClient } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import { Modal } from "@/components/ui";

// Define the type for credentials
interface Credential {
  id?: number;
  category: string;
  title: string;
  subtitle: string;
  sort_order: number;
}

export function AboutAdmin({ onClose }: { onClose: () => void }) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Existing bio state
  const [content, setContent] = useState({
    name: "",
    bio_p1: "",
    bio_p2: "",
    email: "",
    phone: ""
  });

  // NEW: Credentials state
  const [credentials, setCredentials] = useState<Credential[]>([]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'info' | 'danger';
  }>({ isOpen: false, title: "", message: "" });

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

  const getAuthenticatedClient = async () => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Verifiering misslyckades. Logga in igen.");
    return createClerkSupabaseClient(token);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch bio
        const { data: bioData } = await supabase.from("about_content").select("*").single();
        if (bioData) setContent(bioData);

        // Fetch credentials
        const { data: credData } = await supabase
          .from("about_credentials")
          .select("*")
          .order('sort_order', { ascending: true });
        if (credData) setCredentials(credData);

      } catch (err) {
        console.error("Error fetching content:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // NEW: Add a blank credential row
  const addCredential = () => {
    setCredentials([...credentials, { category: "Utbildningar", title: "", subtitle: "", sort_order: credentials.length }]);
  };

  // NEW: Remove a credential row
  const removeCredential = (index: number) => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const adminClient = await getAuthenticatedClient();

      const { error: bioError } = await adminClient
        .from("about_content")
        .upsert({ id: 1, ...content });
      if (bioError) throw bioError;

      await adminClient.from("about_credentials").delete().neq('id', 0);
      const { error: credError } = await adminClient
        .from("about_credentials")
        .insert(credentials.map(({ id, ...rest }) => rest));

      if (credError) throw credError;

      setModalConfig({
        isOpen: true,
        title: "Uppdaterad",
        message: "Din profil och dina meriter har sparats."
      });
    } catch (err: any) {
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

        {/* Header */}
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Inställningar</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium">Om mig & Meriter</p>
          </div>
          <button onClick={onClose} className="text-[10px] uppercase tracking-[0.2em] border-b border-stone-900 pb-1 font-bold">Tillbaka</button>
        </div>

        <form onSubmit={handleSave} className="space-y-20">

          {/* Bio Section (Same as your original code) */}
          <section className="space-y-8">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Biografi</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Namn</label>
                <input className="w-full border border-stone-300 p-3 text-sm font-light outline-none" value={content.name} onChange={e => setContent({ ...content, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Bio Stycke 1</label>
                <textarea rows={4} className="w-full border border-stone-300 p-4 text-sm font-light resize-none outline-none" value={content.bio_p1} onChange={e => setContent({ ...content, bio_p1: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Bio Stycke 2</label>
                <textarea rows={4} className="w-full border border-stone-300 p-4 text-sm font-light resize-none outline-none" value={content.bio_p2} onChange={e => setContent({ ...content, bio_p2: e.target.value })} />
              </div>
            </div>
          </section>

          {/* NEW: Credentials Section */}
          <section className="space-y-8">
            <div className="flex justify-between items-end">
              <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Meriter</h3>
              <button type="button" onClick={addCredential} className="text-[10px] uppercase tracking-widest text-stone-400 hover:text-stone-900 transition-colors">+ Lägg till rad</button>
            </div>

            <div className="space-y-4">
              {credentials.map((cred, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-start border-b border-stone-100 pb-6 group">
                  <div className="col-span-3 space-y-2">
                    <label className="text-[9px] uppercase text-stone-400 tracking-tighter">Kategori</label>
                    <select
                      className="w-full text-xs border border-stone-200 p-2 bg-white outline-none"
                      value={cred.category}
                      onChange={e => {
                        const newCreds = [...credentials];
                        newCreds[index].category = e.target.value;
                        setCredentials(newCreds);
                      }}
                    >
                      <option value="Utbildningar">Utbildningar</option>
                      <option value="Utställningar">Utställningar</option>
                      <option value="Meriter">Meriter</option>
                    </select>
                  </div>
                  <div className="col-span-4 space-y-2">
                    <label className="text-[9px] uppercase text-stone-400 tracking-tighter">Titel</label>
                    <input className="w-full text-xs border border-stone-200 p-2 outline-none" value={cred.title} onChange={e => {
                      const newCreds = [...credentials];
                      newCreds[index].title = e.target.value;
                      setCredentials(newCreds);
                    }} placeholder="t.ex. Nordens Fotoskola" />
                  </div>
                  <div className="col-span-4 space-y-2">
                    <label className="text-[9px] uppercase text-stone-400 tracking-tighter">Detalj / År</label>
                    <input className="w-full text-xs border border-stone-200 p-2 outline-none" value={cred.subtitle} onChange={e => {
                      const newCreds = [...credentials];
                      newCreds[index].subtitle = e.target.value;
                      setCredentials(newCreds);
                    }} placeholder="t.ex. 2023-2026" />
                  </div>
                  <div className="col-span-1 pt-7">
                    <button type="button" onClick={() => removeCredential(index)} className="text-stone-300 hover:text-red-400 transition-colors">✕</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Kontaktuppgifter (Same as your original code) */}
          <section className="space-y-8">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Kontakt</h3>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">E-post</label>
                <input className="w-full border border-stone-300 p-3 text-sm font-light outline-none" value={content.email} onChange={e => setContent({ ...content, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Telefon</label>
                <input className="w-full border border-stone-300 p-3 text-sm font-light outline-none" value={content.phone} onChange={e => setContent({ ...content, phone: e.target.value })} />
              </div>
            </div>
          </section>

          <button type="submit" disabled={saving} className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-6 font-bold hover:bg-stone-800 disabled:opacity-30 transition-all">
            {saving ? "Sparar..." : "Spara alla ändringar"}
          </button>
        </form>
      </div>
      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}