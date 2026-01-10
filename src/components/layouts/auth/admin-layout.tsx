import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArticleAdmin, PhotoEditor } from "@/components/ui";

function AdminCard({ title, description, onClick, isAction = true }: { title: string; description: string; onClick: () => void, isAction?: boolean }) {
  return (
    <button onClick={onClick} className="group border border-stone-100 p-8 text-left hover:border-stone-400 transition-all bg-white shadow-sm hover:shadow-md">
      <h3 className="text-xs uppercase tracking-widest mb-2 font-bold">{title}</h3>
      <p className="text-[10px] text-stone-400 uppercase tracking-tighter">{description}</p>
      <div className="mt-6 text-[9px] uppercase tracking-widest text-stone-300 group-hover:text-stone-900 font-bold">
        {isAction ? "+ Ladda upp" : "→ Hantera"}
      </div>
    </button>
  );
}

export function AdminLayout() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);

  const handleUpload = (tag: string) => {
    if (!window.cloudinary) return;
    window.cloudinary.createUploadWidget(
      { cloudName: "dtscgoycp", uploadPreset: "myelie_preset", tags: [tag] },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          queryClient.invalidateQueries({ queryKey: ["photos", tag] });
          // Om man laddar upp till den flik man redan tittar på, trigga en omladdning
          if (activeTab === tag) setActiveTab(null);
          setTimeout(() => setActiveTab(tag), 10);
        }
      }
    ).open();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 animate-in fade-in duration-700">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-lg font-light uppercase tracking-[0.3em]">Kontrollpanel</h2>
          <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest font-medium">Inloggad som Myelie</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-20">
        {["portfolio", "weddings", "portraits", "about"].map((tag) => (
          <div key={tag} className="flex flex-col gap-2">
            <AdminCard
              title={tag === 'weddings' ? 'Bröllop' : tag === 'portraits' ? 'Porträtt' : tag === 'about' ? 'Om mig' : 'Portfolio'}
              description={`Bilder för ${tag}`}
              onClick={() => handleUpload(tag)}
            />
            <button
              onClick={() => setActiveTab(activeTab === tag ? null : tag)}
              className={`text-[9px] uppercase tracking-widest py-2 border transition-all font-bold ${activeTab === tag ? "bg-stone-900 text-white border-stone-900" : "text-stone-400 border-stone-100 hover:border-stone-200"}`}
            >
              {activeTab === tag ? "Stäng sortering" : "Ändra ordning"}
            </button>
          </div>
        ))}

        <div className="flex flex-col gap-2">
          <AdminCard
            title="Artiklar"
            description="Press & Reportage"
            isAction={false}
            onClick={() => setIsArticleEditorOpen(true)}
          />
        </div>
      </div>

      {isArticleEditorOpen && <ArticleAdmin onClose={() => setIsArticleEditorOpen(false)} />}

      {activeTab && !isArticleEditorOpen && <PhotoEditor tag={activeTab} />}
    </div>
  );
}