import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchPhotosByTag } from "@/services";
import { useAuth } from "@clerk/clerk-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Modal } from "@/components/ui";
import { AboutLayout } from "@/components/layouts/about-layout";
import { PortfolioLayout } from "@/components/layouts/portfolio-layout";
import { PortraitsLayout } from "@/components/layouts/portraits-layout";
import { WeddingsLayout } from "@/components/layouts/weddings-layout";
import {
  uploadAndSavePhoto,
  uploadAndSaveVariant,
  deletePhoto,
  deletePhotoVariant,
  updatePhotoOrder,
  updateVariantOrder,
  updatePhotoDescription
} from "./api/photo-actions";

// --- Variant Sortable Item ---
function SortableVariant({ id, variant, onDelete }: { id: string; variant: any; onDelete: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="relative w-7 h-7 group/variant shrink-0"
      {...attributes}
      {...listeners}
    >
      <img src={variant.url} className="cursor-grab active:cursor-grabbing w-full h-full object-cover rounded-sm border border-stone-200 shadow-sm" />
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(variant.id); }}
        className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 text-white opacity-0 group-hover/variant:opacity-100 flex items-center justify-center text-[7px] font-bold transition-opacity rounded-full shadow-sm z-30"
      >
        &times;
      </button>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function SortablePhoto({ photo, index, onDelete, onAddVariant, onDeleteVariant, onUpdateDescription, onReorderVariants }: {
  photo: any;
  index: number;
  onDelete: (id: string) => void;
  onAddVariant: (id: string) => void;
  onDeleteVariant: (variantId: string) => void;
  onUpdateDescription: (id: string, text: string) => void;
  onReorderVariants: (photoId: string, oldIndex: number, newIndex: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: photo.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      // Outer wrapper is flex-col, it will grow naturally but the image stays square
      className="relative flex flex-col bg-white border border-stone-100 rounded-sm shadow-sm overflow-hidden group"
    >
      {/* 1. Square Image Container */}
      <div className="relative aspect-square w-full bg-stone-50 overflow-hidden">
        <div {...attributes} {...listeners} className="w-full h-full cursor-grab active:cursor-grabbing">
          <img src={photo.url} className="w-full h-full object-cover pointer-events-none" alt="" />
        </div>

        {/* Index Badge */}
        <div className="absolute top-1.5 left-1.5 bg-white/90 px-1.5 py-0.5 text-[8px] font-mono text-stone-900 font-bold z-10 rounded-sm shadow-sm">
          {index + 1}
        </div>

        {/* Buttons (Top Right) */}
        <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={() => onAddVariant(photo.id)}
            className="bg-white/95 px-2 py-0.5 text-[7px] font-mono text-stone-900 hover:bg-stone-900 hover:text-white transition-colors shadow-sm rounded-sm uppercase tracking-wider"
          >
            + Variant
          </button>
          <button
            onClick={() => onDelete(photo.id)}
            className="bg-white/95 px-2 py-0.5 text-[7px] font-mono text-red-700 hover:bg-red-700 hover:text-white transition-colors shadow-sm rounded-sm uppercase tracking-wider"
          >
            Radera
          </button>
        </div>

        {photo.photo_variants && photo.photo_variants.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 p-1 flex flex-wrap gap-1 bg-white/60 backdrop-blur-sm border-t border-stone-100/50 z-10">
            <DndContext
              sensors={useSensors(
                useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
                useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
              )}
              collisionDetection={closestCenter}
              onDragEnd={(event) => {
                const { active, over } = event as DragEndEvent;
                if (over && active.id !== over.id) {
                  const variantKeys = (photo.photo_variants || []).map((v: any) => `${photo.id}::${v.id}`);
                  const oldIndex = variantKeys.findIndex((k: string) => k === String(active.id));
                  const newIndex = variantKeys.findIndex((k: string) => k === String(over.id));
                  if (oldIndex > -1 && newIndex > -1) onReorderVariants(photo.id, oldIndex, newIndex);
                }
              }}
            >
              <SortableContext items={(photo.photo_variants || []).map((v: any) => `${photo.id}::${v.id}`)} strategy={rectSortingStrategy}>
                {(photo.photo_variants || []).map((variant: any) => (
                  <SortableVariant key={variant.id} id={`${photo.id}::${variant.id}`} variant={variant} onDelete={onDeleteVariant} />
                ))}
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      <div className="p-1.5 bg-white border-t border-stone-50">
        <textarea
          placeholder="Beskrivning..."
          className="w-full text-[8px] bg-stone-50/50 border border-stone-100 focus:border-stone-200 focus:ring-0 outline-none p-1 resize-none font-sans text-stone-600 leading-tight h-7 rounded-sm transition-colors placeholder:text-stone-300"
          value={photo.description || ""}
          onChange={(e) => onUpdateDescription(photo.id, e.target.value)}
        />
      </div>
    </div>
  );
}

function LayoutPreview({ tag, items }: { tag: string; items: any[] }) {
  const profileImage = items?.[0];

  return (
    <div className="sticky top-6 flex flex-col h-[calc(100vh-100px)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Förhandsvisning</h3>
      </div>

      <div className="border border-stone-200 rounded-lg overflow-hidden bg-stone-100 relative flex-1 shadow-inner">
        <div className="absolute left-1/2 top-0 w-[222.2%] h-[222.2%] origin-top -translate-x-1/2 scale-[0.45] bg-white">

          <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            <div
              className="pointer-events-none min-h-screen">
              {tag === 'about' && (
                <AboutLayout image={profileImage} isLoading={false} />
              )}
              {tag === 'portfolio' && (
                <PortfolioLayout photos={items} variant="default" />
              )}
              {tag === 'portraits' && (
                <PortraitsLayout photos={items} variant="default" />
              )}
              {tag === 'weddings' && (
                <WeddingsLayout photos={items} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- MAIN COMPONENT ---

export function PhotoEditor({ tag }: { tag: string }) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type?: 'info' | 'danger'; onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const { data: photos, isLoading } = useQuery({
    queryKey: ["photos", tag],
    queryFn: () => fetchPhotosByTag(tag),
  });

  useEffect(() => {
    if (photos) setItems(photos);
  }, [photos]);

  const getAuthToken = async (): Promise<string> => {
    const token = await getToken({ template: "supabase" });
    if (!token) throw new Error("Kunde inte verifiera din identitet (Clerk token saknas)");
    return token;
  };

  const handleVariantUpload = async (parentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      try {
        const token = await getAuthToken();
        await uploadAndSaveVariant(token, file, tag, parentId);
        await queryClient.invalidateQueries({ queryKey: ["photos", tag] });
        setModalConfig({ isOpen: true, title: "Variant tillagd", message: "Bilden har länkats som en variant." });
      } catch (err: any) {
        setModalConfig({ isOpen: true, title: "Fel", message: err.message });
      } finally {
        setIsUploading(false);
      }
    };
    input.click();
  };

  const handleDeleteVariant = (variantId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Radera variant",
      message: "Vill du ta bort denna variant?",
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = await getAuthToken();
          await deletePhotoVariant(token, variantId);
          await queryClient.invalidateQueries({ queryKey: ["photos", tag] });
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Fel", message: err.message });
        }
      }
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const token = await getAuthToken();
      await uploadAndSavePhoto(token, file, tag);
      await queryClient.invalidateQueries({ queryKey: ["photos", tag] });
      setModalConfig({ isOpen: true, title: "Klar!", message: "Bilden har laddats upp och sparats säkert." });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: err.message });
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleDelete = (photoId: string) => {
    setModalConfig({
      isOpen: true,
      title: "Radera bild",
      message: "Vill du verkligen ta bort bilden?",
      type: 'danger',
      onConfirm: async () => {
        try {
          const token = await getAuthToken();
          await deletePhoto(token, photoId);
          setItems(prev => prev.filter(item => item.id !== photoId));
          queryClient.invalidateQueries({ queryKey: ["photos", tag] });
        } catch (err: any) {
          setModalConfig({ isOpen: true, title: "Fel vid radering", message: err.message });
        }
      }
    });
  };

  const handleReorderVariants = (photoId: string, oldIndex: number, newIndex: number) => {
    setItems(prev => prev.map(p => p.id === photoId ? { ...p, photo_variants: arrayMove(p.photo_variants || [], oldIndex, newIndex) } : p));
  };

  const handleDescriptionChange = (id: string, text: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, description: text } : item));
  };

  const saveOrder = async () => {
    setIsSaving(true);
    try {
      const token = await getAuthToken();

      const orderUpdates = items.map((item, index) => ({
        id: item.id,
        tag: tag,
        position: index,
        url: item.url
      }));
      await updatePhotoOrder(token, orderUpdates);

      // Persist variant ordering as well
      const variantUpdates = items.flatMap(item => (item.photo_variants || []).map((v: any, idx: number) => ({
        id: v.id,
        parent_id: item.id,
        position: idx,
        url: v.url
      })));

      if (variantUpdates.length > 0) {
        await updateVariantOrder(token, variantUpdates);
      }

      const descriptionPromises = items.map(item =>
        updatePhotoDescription(token, item.id, item.description || "")
      );

      await Promise.all(descriptionPromises);

      await queryClient.invalidateQueries({ queryKey: ["photos", tag] });
      setModalConfig({ isOpen: true, title: "Sparat", message: "Ändringarna har sparats!" });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel vid sparande", message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  const closeModal = () => setModalConfig({ isOpen: false, title: "", message: "" });

  if (isLoading) return <div className="text-[10px] uppercase tracking-widest text-stone-400 animate-pulse pt-12">Hämtar bilder...</div>;

  return (
    <div className="border-t border-stone-100 pt-8 mt-8 animate-in fade-in duration-500">

      {/* --- HEADER ACTIONS --- */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 sticky top-0 z-40 bg-white/95 backdrop-blur-sm py-4 border-b border-stone-50">
        <div className="flex items-center gap-6">
          <label className="cursor-pointer group flex flex-col">
            <input type="file" className="hidden" accept="image/*" onChange={handleFileSelect} disabled={isUploading} />
            <span className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Ny Bild</span>
            <span className={`text-sm font-bold border-b transition-all ${isUploading ? 'text-stone-300 border-stone-300' : 'text-stone-900 border-stone-900 hover:text-stone-600 hover:border-stone-600'}`}>
              {isUploading ? "Laddar upp..." : `+ LADDA UPP`}
            </span>
          </label>
          <div className="h-8 w-px bg-stone-200"></div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 mb-1">Antal</span>
            <span className="text-sm font-bold text-stone-900">{items.length} st</span>
          </div>
        </div>

        <button
          onClick={saveOrder}
          disabled={isSaving || items.length === 0}
          className="bg-stone-900 text-white text-[10px] uppercase tracking-[0.2em] px-8 py-3 hover:bg-stone-800 disabled:opacity-50 transition-all font-bold shadow-md hover:shadow-lg active:scale-95"
        >
          {isSaving ? "Sparar..." : "Spara layout"}
        </button>
      </div>

      {/* --- SPLIT VIEW LAYOUT --- */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-12">

        {/* LEFT COL: Editor */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Redigeringsyta</h3>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {items.map((photo, index) => (
                  <SortablePhoto
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onDelete={handleDelete}
                    onAddVariant={handleVariantUpload}
                    onDeleteVariant={handleDeleteVariant}
                    onUpdateDescription={handleDescriptionChange}
                    onReorderVariants={handleReorderVariants}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>

        <div className="hidden xl:block">
          <LayoutPreview tag={tag} items={items} />
        </div>
      </div>

      {modalConfig.isOpen && modalConfig.title && <Modal {...modalConfig} onClose={closeModal} />}
    </div>
  );
}