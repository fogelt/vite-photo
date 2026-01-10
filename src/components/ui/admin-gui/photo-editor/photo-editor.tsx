import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClerkSupabaseClient, fetchPhotosByTag } from "@/services";
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
import { ImageContainer, Modal } from "@/components/ui";


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
        <img src={photo.url} className="w-full h-full object-cover pointer-events-none" alt="" />
      </div>
      <button
        onClick={() => onDelete(photo.id)}
        className="absolute top-2 right-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-stone-900 hover:text-white"
      >
        TA BORT
      </button>
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900 font-bold">
        {index + 1}
      </div>
    </div>
  );
}

function SortablePreviewItem({ photo, index, sizingClass }: { photo: any; index: number; sizingClass: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`${sizingClass} relative group cursor-grab active:cursor-grabbing ${isDragging ? 'shadow-2xl z-50 scale-[1.02]' : ''}`}>
      <img src={photo.url} className="w-full h-full object-cover pointer-events-none" alt="" />
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900 font-bold">
        {index + 1}
      </div>
    </div>
  );
}

export function PhotoEditor({ tag }: { tag: string }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isRearrangeMode, setIsRearrangeMode] = useState(true);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean; title: string; message: string; type?: 'info' | 'danger'; onConfirm?: () => void;
  }>({ isOpen: false, title: "", message: "" });

  const { data: photos, isLoading } = useQuery({
    queryKey: ["photos", tag],
    queryFn: () => fetchPhotosByTag(tag),
  });

  useEffect(() => {
    setItems(photos || []);
  }, [photos]);

  const handleUpload = () => {
    if (!window.cloudinary) return;

    const currentTag = String(tag).trim();

    window.cloudinary.createUploadWidget(
      {
        cloudName: "dtscgoycp",
        uploadPreset: "myelie_preset",
        tags: [currentTag],
        clientAllowedFormats: ["png", "jpeg", "jpg", "webp"],
      },
      (error: any, result: any) => {
        if (!error && result.event === "success") {
          console.log("Cloudinary success for tag:", currentTag);
          queryClient.invalidateQueries({ queryKey: ["photos", currentTag] });
        }
      }
    ).open();
  };

  const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

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
      message: "Är du säker? Bilden kommer tas bort från alla gallerier.",
      type: 'danger',
      onConfirm: async () => {
        try {
          const adminClient = createClerkSupabaseClient();

          // Kör båda operationerna samtidigt
          await Promise.all([
            // Ta bort från ordningen
            adminClient.from("photo_order").delete().eq("id", photoId),
            // Lägg till i blacklistan så den inte hämtas via Cloudinary-fallbacken
            adminClient.from("photo_blacklist").insert([{ photo_id: photoId }])
          ]);

          // Uppdatera UI
          setItems(prev => prev.filter(item => item.id !== photoId));
          queryClient.invalidateQueries({ queryKey: ["photos", tag] });

        } catch (err: any) {
          setModalConfig({
            isOpen: true,
            title: "Fel vid radering",
            message: err.message
          });
        }
      }
    });
  };

  const saveOrder = async () => {
    setIsSaving(true);
    const updates = items.map((item, index) => ({
      id: item.id,
      tag: tag,
      position: index,
      url: item.url
    }));

    try {
      const adminClient = createClerkSupabaseClient();
      const { error } = await adminClient.from("photo_order").upsert(updates);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["photos", tag] });
      setModalConfig({ isOpen: true, title: "Sparat", message: "Den nya ordningen är nu live." });
    } catch (err: any) {
      setModalConfig({ isOpen: true, title: "Fel", message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-[10px] uppercase tracking-widest text-stone-400 animate-pulse pt-12">Hämtar bilder...</div>;

  return (
    <div className="border-t border-stone-100 pt-12 mt-12 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-12">
        <div className="flex items-center gap-8">
          <div className="flex bg-stone-100 p-1 rounded-full">
            <button
              onClick={() => setIsRearrangeMode(true)}
              className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all ${isRearrangeMode ? 'bg-white shadow-sm font-bold' : 'text-stone-400 font-medium'}`}
            >
              Sortera
            </button>
            <button
              onClick={() => setIsRearrangeMode(false)}
              className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest transition-all ${!isRearrangeMode ? 'bg-white shadow-sm font-bold' : 'text-stone-400 font-medium'}`}
            >
              Förhandsvisa
            </button>
          </div>

          <button
            onClick={handleUpload}
            className="text-[10px] uppercase tracking-[0.2em] text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-400 hover:border-stone-400 transition-all font-bold"
          >
            + Ladda upp till {tag}
          </button>
        </div>

        <button
          onClick={saveOrder}
          disabled={isSaving || items.length === 0}
          className="bg-stone-900 text-white text-[10px] uppercase tracking-widest px-8 py-4 hover:bg-stone-700 disabled:opacity-50 transition-all font-bold"
        >
          {isSaving ? "Sparar..." : "Spara ny ordning"}
        </button>
      </div>

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
              variant={tag === 'weddings' ? 'weddings' : 'default'}
              renderItem={(photo, index, sizingClass) => (
                <SortablePreviewItem key={photo.id} photo={photo} index={index} sizingClass={sizingClass} />
              )}
            />
          )}
        </SortableContext>
      </DndContext>

      <Modal {...modalConfig} onClose={closeModal} />
    </div>
  );
}