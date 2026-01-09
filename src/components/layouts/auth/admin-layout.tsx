import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, fetchPhotosByTag } from "@/services/photo-fetcher";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ImageContainer } from "@/components/ui";

declare global {
  interface Window { cloudinary: any; }
}

// --- Sorterbar bildkomponent (Används i Sortera-läget) ---
function SortablePhoto({ photo, index, onDelete }: { photo: any; index: number; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative aspect-square bg-stone-50 group transition-shadow ${isDragging ? 'shadow-2xl scale-105 z-50' : ''}`}>
      <div {...attributes} {...listeners} className="w-full h-full cursor-grab active:cursor-grabbing">
        <img src={photo.url} className="w-full h-full object-cover pointer-events-none" />
      </div>

      <button
        onClick={() => onDelete(photo.id)}
        className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-900 hover:text-white"
      >
        TA BORT
      </button>

      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900">
        {index + 1}
      </div>
    </div>
  );
}

// --- Förhandsvisnings-komponent (Används i Förhandsgranska-läget) ---
function SortablePreviewItem({ photo, index, sizingClass }: { photo: any; index: number; sizingClass: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`${sizingClass} relative group cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl z-50 scale-[1.02]' : ''}`}
    >
      <img src={photo.url} className="w-full h-full object-cover pointer-events-none" />
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900">
        {index + 1}
      </div>
    </div>
  );
}

function AdminCard({ title, description, onClick }: { title: string; description: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="group border border-stone-100 p-8 text-left hover:border-stone-400 transition-all bg-white">
      <h3 className="text-xs uppercase tracking-widest mb-2">{title}</h3>
      <p className="text-[10px] text-stone-400 uppercase tracking-tighter">{description}</p>
      <div className="mt-6 text-[9px] uppercase tracking-widest text-stone-300 group-hover:text-stone-900">+ Ladda upp</div>
    </button>
  );
}

export function AdminLayout() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [items, setItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRearrangeMode, setIsRearrangeMode] = useState(true);

  const { data: photos, isLoading } = useQuery({
    queryKey: ["photos", activeTab],
    queryFn: () => fetchPhotosByTag(activeTab!),
    enabled: !!activeTab,
  });

  useEffect(() => {
    setItems(photos || []);
  }, [photos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!supabase || !confirm("Vill du ta bort bilden från layouten?")) return;
    const { error } = await supabase.from("photo_order").delete().eq("id", photoId);
    if (!error) setItems(items.filter(item => item.id !== photoId));
  };

  const saveOrder = async () => {
    if (!items.length || !activeTab || !supabase) return;
    setIsSaving(true);

    const updates = items.map((item, index) => ({
      id: item.id,
      tag: activeTab,
      position: index,
      url: item.url
    }));

    const { error } = await supabase.from("photo_order").upsert(updates);

    if (!error) {
      // Denna rad rensar cachen och tvingar useQuery att hämta den NYA ordningen direkt
      await queryClient.invalidateQueries({ queryKey: ["photos", activeTab] });
      alert("Ny ordning har sparats!");
    } else {
      console.error("Supabase error:", error);
      alert("Kunde inte spara: " + error.message);
    }

    setIsSaving(false);
  };

  const handleUpload = (tag: string) => {
    if (!window.cloudinary) return;
    window.cloudinary.createUploadWidget(
      { cloudName: "dtscgoycp", uploadPreset: "myelie_preset", tags: [tag] },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          queryClient.invalidateQueries({ queryKey: ["photos", tag] });
        }
      }
    ).open();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-20 animate-in fade-in duration-700">
      <header className="mb-12 flex justify-between items-end">
        <div>
          <h2 className="text-lg font-light uppercase tracking-[0.3em]">Kontrollpanel</h2>
          <p className="text-xs text-stone-400 mt-2 uppercase tracking-widest">Inloggad som Myelie</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
        {["portfolio", "weddings", "portraits", "about"].map((tag) => (
          <div key={tag} className="flex flex-col gap-2">
            <AdminCard
              title={tag === 'weddings' ? 'Bröllop' : tag === 'portraits' ? 'Porträtt' : tag === 'about' ? 'Om mig' : 'Portfolio'}
              description={`Hantera bilder för ${tag}`}
              onClick={() => handleUpload(tag)}
            />
            <button
              onClick={() => { setItems([]); setActiveTab(tag); }}
              className={`text-[9px] uppercase tracking-widest py-2 border transition-colors ${activeTab === tag ? "bg-stone-900 text-white border-stone-900" : "text-stone-400 border-stone-100 hover:border-stone-200"
                }`}
            >
              Ändra ordning
            </button>
          </div>
        ))}
      </div>

      {activeTab && (
        <div className="border-t border-stone-100 pt-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
            <div className="flex bg-stone-100 p-1 rounded-full">
              <button
                onClick={() => setIsRearrangeMode(true)}
                className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all ${isRearrangeMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}
              >
                Sortera
              </button>
              <button
                onClick={() => setIsRearrangeMode(false)}
                className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all ${!isRearrangeMode ? 'bg-white shadow-sm' : 'text-stone-400'}`}
              >
                Förhandsvisa
              </button>
            </div>

            <button
              onClick={saveOrder}
              disabled={isSaving || items.length === 0}
              className="bg-stone-900 text-white text-[10px] uppercase tracking-widest px-8 py-4 hover:bg-stone-700 disabled:opacity-50 transition-all"
            >
              {isSaving ? "Sparar..." : "Spara ny ordning"}
            </button>
          </div>

          {isLoading ? (
            <div className="text-[10px] uppercase tracking-widest text-stone-400 animate-pulse">Hämtar bilder...</div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                {isRearrangeMode ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {items.map((photo, index) => (
                      <SortablePhoto key={photo.id} photo={photo} index={index} onDelete={handleDelete} />
                    ))}
                  </div>
                ) : (
                  <ImageContainer
                    photos={items}
                    variant={activeTab === 'weddings' ? 'weddings' : 'default'}
                    renderItem={(photo, index, sizingClass) => (
                      <SortablePreviewItem key={photo.id} photo={photo} index={index} sizingClass={sizingClass} />
                    )}
                  />
                )}
              </SortableContext>
            </DndContext>
          )}
        </div>
      )}
    </div>
  );
}