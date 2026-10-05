import { useState } from "react";
import { ArticleAdmin, PhotoEditor, AboutAdmin, WeddingAdmin, WelcomeAdmin, EngagementAdmin, AnalyticsSummary, UpdatesSummary } from "@/components/ui";

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
  type Site = 'portfolio' | 'wedding';
  const [site, setSite] = useState<Site>('portfolio');
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isArticleEditorOpen, setIsArticleEditorOpen] = useState(false);
  const [isAboutTextEditorOpen, setIsAboutTextEditorOpen] = useState(false);
  const [isWeddingEditorOpen, setIsWeddingEditorOpen] = useState(false); // New state
  const [isWelcomeEditorOpen, setIsWelcomeEditorOpen] = useState(false);
  const [isEngagementEditorOpen, setIsEngagementEditorOpen] = useState(false);

  const GALLERY_TABS: Record<Site, string[]> = {
    portfolio: ["portfolio", "weddings", "portraits", "about"],
    wedding: ["weddings_main"],
  };

  const TAB_LABELS: Record<string, string> = {
    portfolio: 'Portfölj',
    weddings: 'Bröllop',
    portraits: 'Porträtt',
    about: 'Om mig',
    weddings_main: 'Bröllopsbilder',
  };

  // Helper to close all full-screen editors
  const closeAllEditors = () => {
    setIsArticleEditorOpen(false);
    setIsAboutTextEditorOpen(false);
    setIsWeddingEditorOpen(false);
    setIsWelcomeEditorOpen(false);
    setIsEngagementEditorOpen(false);
    setActiveTab(null);
  };

  const switchSite = (next: Site) => {
    setSite(next);
    closeAllEditors();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 animate-in fade-in duration-700">

      <div className="flex justify-between items-start mb-16 mr-48">
        <div>
          <h1 className="text-2xl font-light uppercase tracking-[0.4em] text-stone-900">Kontrollpanel</h1>
          <p className="text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-bold">Välkommen tillbaka, Myelie</p>
        </div>
        <UpdatesSummary />
        <AnalyticsSummary />
      </div>


      {/* Site switcher: which site are we editing? */}
      <div className="flex gap-2 mb-12">
        {(
          [
            { id: 'portfolio', title: 'Portföljsajt', hint: 'myeliefoto.se' },
            { id: 'wedding', title: 'Bröllopssajt', hint: 'bröllopssidan' },
          ] as const
        ).map((s) => (
          <button
            key={s.id}
            onClick={() => switchSite(s.id)}
            className={`flex-1 border px-6 py-4 text-left transition-all ${site === s.id
              ? 'border-stone-900 bg-stone-900 text-white shadow-md'
              : 'border-stone-100 bg-white text-stone-400 hover:border-stone-400 hover:text-stone-900'
              }`}
          >
            <span className="block text-xs uppercase tracking-widest font-bold">{s.title}</span>
            <span className={`block text-[10px] uppercase tracking-tighter mt-1 ${site === s.id ? 'text-stone-300' : 'text-stone-300'}`}>{s.hint}</span>
          </button>
        ))}
      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {/* Gallerier */}
        <AdminCard
          title="Bildgallerier"
          description={site === 'wedding' ? "Hantera bröllopssidans foton" : "Hantera foton i alla sektioner"}
          isActive={!!activeTab}
          onClick={() => {
            closeAllEditors();
            setActiveTab(GALLERY_TABS[site][0]);
          }}
        />

        {/* New Wedding Pricing Card (shared table, shown for both sites) */}
        <AdminCard
          title="Bröllopspaket"
          description="Ändra priser och innehåll i korten"
          isActive={isWeddingEditorOpen}
          onClick={() => {
            closeAllEditors();
            setIsWeddingEditorOpen(true);
          }}
        />

        {site === 'wedding' && (
          <AdminCard
            title="Välkomsttext"
            description="Ändra rubrik och text på bröllopssajten"
            isActive={isWelcomeEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsWelcomeEditorOpen(true);
            }}
          />
        )}

        {site === 'wedding' && (
          <AdminCard
            title="Förlovning"
            description="Ändra rubrik och text om förlovning"
            isActive={isEngagementEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsEngagementEditorOpen(true);
            }}
          />
        )}

        {site === 'portfolio' && (
          <AdminCard
            title="Artiklar"
            description="Hantera press & reportage"
            isActive={isArticleEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsArticleEditorOpen(true);
            }}
          />
        )}

        {site === 'portfolio' && (
          <AdminCard
            title="Om Mig"
            description="Redigera biografi och kontakt"
            isActive={isAboutTextEditorOpen}
            onClick={() => {
              closeAllEditors();
              setIsAboutTextEditorOpen(true);
            }}
          />
        )}
      </div>

      {/* Full-screen Overlay Editors */}
      {isArticleEditorOpen && <ArticleAdmin onClose={() => setIsArticleEditorOpen(false)} />}
      {isAboutTextEditorOpen && <AboutAdmin onClose={() => setIsAboutTextEditorOpen(false)} />}
      {isWeddingEditorOpen && <WeddingAdmin onClose={() => setIsWeddingEditorOpen(false)} />}
      {isWelcomeEditorOpen && <WelcomeAdmin onClose={() => setIsWelcomeEditorOpen(false)} />}
      {isEngagementEditorOpen && <EngagementAdmin onClose={() => setIsEngagementEditorOpen(false)} />}

      {/* Inline Photo Editor */}
      {activeTab && (
        <div className="animate-in slide-in-from-bottom-4 duration-700">
          <div className="flex gap-8 mb-8 border-b border-stone-100 pb-4">
            {GALLERY_TABS[site].map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`text-[10px] uppercase tracking-widest transition-all ${activeTab === t
                  ? 'font-bold border-b border-stone-900 text-stone-900'
                  : 'text-stone-400 hover:text-stone-600'
                  }`}
              >
                {TAB_LABELS[t] ?? t}
              </button>
            ))}
          </div>
          <PhotoEditor tag={activeTab} />
        </div>
      )}
    </div>
  );
}