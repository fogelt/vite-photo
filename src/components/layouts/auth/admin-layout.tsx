import { useState } from "react";
import { ArticleAdmin, PhotoEditor } from "@/components/ui";

function AdminCard({ title, description, onClick, isActive }: { title: string; description: string; onClick: () => void, isActive: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`group border p-8 text-left transition-all bg-white shadow-sm hover:shadow-md ${isActive ? 'border-stone-900 ring-1 ring-stone-900' : 'border-stone-100 hover:border-stone-400'}`}
    >
      <h3 className="text-xs uppercase tracking-widest mb-2 font-bold">{title}</h3>
      <p className="text-[10px] text-stone-400 uppercase tracking-tighter">{description}</p>
      <div className={`mt-6 text-[9px] uppercase tracking-widest font-bold transition-colors ${isActive ? 'text-stone-900' : 'text-stone-300 group-hover:text-stone-900'}`}>
        {isActive ? "→ Visar nu" : "→ Hantera sektion"}
      </div>
    </button>
  );
}

export function AdminLayout() {
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);

  const handleTabClick = (tag: string) => {
    setIsArticleEditorOpen(false);
    setActiveTab(activeTab === tag ? null : tag);
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
          <AdminCard
            key={tag}
            title={tag === 'weddings' ? 'Bröllop' : tag === 'portraits' ? 'Porträtt' : tag === 'about' ? 'Om mig' : 'Portfölj'}
            description={`Hantera ${tag}`}
            isActive={activeTab === tag}
            onClick={() => handleTabClick(tag)}
          />
        ))}

        <AdminCard
          title="Artiklar"
          description="Press & Reportage"
          isActive={isArticleEditorOpen}
          onClick={() => {
            setActiveTab(null);
            setIsArticleEditorOpen(true);
          }}
        />
      </div>

      {/* Om en artikelredigerare är öppen visas den som en modal/overlay */}
      {isArticleEditorOpen && <ArticleAdmin onClose={() => setIsArticleEditorOpen(false)} />}

      {/* Om en bild-tagg är vald visas PhotoEditor under korten */}
      {activeTab && !isArticleEditorOpen && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-4 mb-4">
            <h2 className="text-[11px] uppercase tracking-[0.4em] font-bold text-stone-900">
              Redigerar: {activeTab}
            </h2>
          </div>
          <PhotoEditor tag={activeTab} />
        </div>
      )}
    </div>
  );
}