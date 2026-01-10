import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, createClerkSupabaseClient } from "@/services"; // Importera båda

export function ArticleAdmin({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    publisher: "",
    description: "",
    image_url: "",
    link_url: "",
    published_date: "",
  });

  // 1. Hämta artiklar (Här räcker det med den vanliga publika klienten)
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

  const handleImageUpload = () => {
    if (!window.cloudinary) return;
    window.cloudinary.createUploadWidget(
      {
        cloudName: "dtscgoycp",
        uploadPreset: "myelie_preset",
        tags: ["articles"],
        multiple: false
      },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          setFormData(prev => ({ ...prev, image_url: result.info.secure_url }));
        }
      }
    ).open();
  };

  // 2. Spara artikel (Här MÅSTE vi ha admin-klienten)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // Skapa klienten som har din hemliga admin-header
      const adminClient = createClerkSupabaseClient();

      const { error } = await adminClient
        .from("articles")
        .insert([formData]);

      if (error) throw error;

      setFormData({ title: "", publisher: "", description: "", image_url: "", link_url: "", published_date: "" });
      queryClient.invalidateQueries({ queryKey: ["articles"] });
      alert("Artikeln sparad säkert!");

    } catch (error: any) {
      console.error("Supabase Error:", error);
      alert("Fel vid sparande: " + (error.message || "Kontrollera dina RLS-inställningar"));
    } finally {
      setIsSaving(false);
    }
  };

  // 3. Radera artikel (Här MÅSTE vi också ha admin-klienten)
  const handleDelete = async (id: string) => {
    if (!confirm("Är du säker på att du vill radera artikeln?")) return;

    try {
      const adminClient = createClerkSupabaseClient();

      const { error } = await adminClient
        .from("articles")
        .delete()
        .eq("id", id);

      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["articles"] });
    } catch (error: any) {
      alert("Kunde inte radera: " + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto animate-in fade-in duration-500">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="flex justify-between items-center mb-16">
          <div>
            <h2 className="text-xl font-light uppercase tracking-[0.3em]">Artiklar & Press</h2>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-medium">Administrationsläge</p>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-[0.2em] border-b border-stone-900 pb-1 hover:text-stone-400 hover:border-stone-400 transition-all font-bold"
          >
            Tillbaka
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Formulär */}
          <section className="space-y-12">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-900 font-bold border-l-2 border-stone-900 pl-4">Ny artikel</h3>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-6">
                {/* Bild-uppladdning */}
                <div className="space-y-3">
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Artikelbild</label>
                  <div
                    onClick={handleImageUpload}
                    className="border-2 border-dashed border-stone-300 p-8 text-center cursor-pointer hover:border-stone-900 transition-colors bg-stone-50 group"
                  >
                    {formData.image_url ? (
                      <div className="space-y-4">
                        <img src={formData.image_url} className="h-32 mx-auto object-cover shadow-md" alt="Preview" />
                        <p className="text-[9px] uppercase text-stone-400 group-hover:text-stone-900 font-bold">Klicka för att byta bild</p>
                      </div>
                    ) : (
                      <div className="py-4">
                        <p className="text-[10px] uppercase tracking-widest text-stone-400 group-hover:text-stone-900 font-bold">+ Ladda upp bild</p>
                      </div>
                    )}
                  </div>
                </div>

                <InputField label="Titel" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} />
                <InputField label="Publicist" value={formData.publisher} placeholder="t.ex. Vi Lärare" onChange={(v) => setFormData({ ...formData, publisher: v })} />

                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-stone-500 font-bold">Beskrivning</label>
                  <textarea
                    required
                    className="w-full border border-stone-300 bg-stone-50/30 p-3 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light h-24 resize-none shadow-sm"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <InputField label="Länk till artikel" value={formData.link_url} placeholder="https://..." onChange={(v) => setFormData({ ...formData, link_url: v })} />
                <InputField label="Datum" value={formData.published_date} placeholder="t.ex. Januari 2026" onChange={(v) => setFormData({ ...formData, published_date: v })} />
              </div>

              <button
                type="submit"
                disabled={isSaving || !formData.image_url}
                className="w-full bg-stone-900 text-white text-[10px] uppercase tracking-[0.3em] py-5 hover:bg-stone-800 transition-all disabled:opacity-30 shadow-lg shadow-stone-200 font-bold"
              >
                {isSaving ? "Sparar..." : "Publicera artikel"}
              </button>
            </form>
          </section>

          {/* Lista */}
          <section className="space-y-12">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-stone-400 font-bold">Publicerade artiklar</h3>
            <div className="space-y-4">
              {isLoading ? (
                <p className="text-[10px] uppercase tracking-widest text-stone-300 animate-pulse font-bold">Hämtar...</p>
              ) : articles?.map((art) => (
                <div key={art.id} className="flex gap-4 p-4 border border-stone-200 bg-white group hover:shadow-md transition-all">
                  <img src={art.image_url} className="w-20 h-20 object-cover bg-stone-50" alt="" />
                  <div className="flex-grow">
                    <h4 className="text-xs uppercase tracking-wider text-stone-800 font-bold">{art.title}</h4>
                    <p className="text-[10px] text-stone-400 uppercase mt-1">{art.publisher} — {art.published_date}</p>
                    <button
                      onClick={() => handleDelete(art.id)}
                      className="text-[9px] text-stone-400 hover:text-red-600 uppercase tracking-widest mt-4 transition-colors font-bold"
                    >
                      [ Radera ]
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
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
        className="w-full border border-stone-300 bg-stone-50/30 p-3 focus:border-stone-900 focus:bg-white outline-none transition-all text-sm font-light shadow-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}