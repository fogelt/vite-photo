import { useState } from "react";
import { ArticleAdmin, PhotoEditor, AboutAdmin, WeddingAdmin } from "@/components/ui";

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
  const [isAboutTextEditorOpen, setIsAboutTextEditorOpen] = useState(false);
  const [isWeddingEditorOpen, setIsWeddingEditorOpen] = useState(false); // New state

  // Helper to close all full-screen editors
  const closeAllEditors = () => {
    setIsArticleEditorOpen(false);
    setIsAboutTextEditorOpen(false);
    setIsWeddingEditorOpen(false);
    setActiveTab(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 animate-in fade-in duration-700">

      <div className="mb-16">
        <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-stone-900">Kontrollpanel</h1>
        <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-bold">Välkommen tillbaka, Myelie</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {/* Gallerier */}
        <AdminCard
          title="Bildgallerier"
          description="Hantera foton i alla sektioner"
          isActive={!!activeTab}
          onClick={() => {
            closeAllEditors();
            setActiveTab('portfolio');
          }}
        />

        {/* New Wedding Pricing Card */}
        <AdminCard
          title="Bröllopspaket"
          description="Ändra priser och innehåll i korten"
          isActive={isWeddingEditorOpen}
          onClick={() => {
            closeAllEditors();
            setIsWeddingEditorOpen(true);
          }}
        />

        <AdminCard
          title="Artiklar"
          description="Hantera press & reportage"
          isActive={isArticleEditorOpen}
          onClick={() => {
            closeAllEditors();
            setIsArticleEditorOpen(true);
          }}
        />

        <AdminCard
          title="Om Mig"
          description="Redigera biografi och kontakt"
          isActive={isAboutTextEditorOpen}
          onClick={() => {
            closeAllEditors();
            setIsAboutTextEditorOpen(true);
          }}
        />
      </div>

      {/* Full-screen Overlay Editors */}
      {isArticleEditorOpen && <ArticleAdmin onClose={() => setIsArticleEditorOpen(false)} />}
      {isAboutTextEditorOpen && <AboutAdmin onClose={() => setIsAboutTextEditorOpen(false)} />}
      {isWeddingEditorOpen && <WeddingAdmin onClose={() => setIsWeddingEditorOpen(false)} />}

      {/* Inline Photo Editor */}
      {activeTab && (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex gap-8 mb-8 border-b border-stone-100 pb-4">
            {["portfolio", "weddings", "portraits", "about"].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`text-[10px] uppercase tracking-widest transition-all ${activeTab === t
                  ? 'font-bold border-b border-stone-900 text-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                {t === 'portfolio' ? 'Portfölj' : t === 'weddings' ? 'Bröllop' : t === 'portraits' ? 'Porträtt' : 'Om mig'}
              </button>
            ))}
          </div>
          <PhotoEditor tag={activeTab} />
        </div>
      )}
    </div>
  );
}