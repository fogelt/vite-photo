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
import { ImageContainer } from "@/components/ui";

// --- Sorterbar bildkomponent ---
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
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900">
        {index + 1}
      </div>
    </div>
  );
}

// --- Förhandsvisnings-komponent ---
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
      <img src={photo.url} className="w-full h-full object-cover pointer-events-none" alt="" />
      <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 text-[9px] font-mono text-stone-900">
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

  const { data: photos, isLoading } = useQuery({
    queryKey: ["photos", tag],
    queryFn: () => fetchPhotosByTag(tag),
  });

  useEffect(() => {
    setItems(photos || []);
  }, [photos]);

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

  const handleDelete = async (photoId: string) => {
    if (!confirm("Vill du ta bort bilden från layouten?")) return;

    try {
      const adminClient = createClerkSupabaseClient();
      const { error } = await adminClient.from("photo_order").delete().eq("id", photoId);
      if (error) throw error;
      setItems(items.filter(item => item.id !== photoId));
    } catch (err: any) {
      alert("Fel vid radering: " + err.message);
    }
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
      alert("Ny ordning sparad säkert!");
    } catch (err: any) {
      alert("Kunde inte spara: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="text-[10px] uppercase tracking-widest text-stone-400 animate-pulse pt-12">Hämtar bilder...</div>;

  return (
    <div className="border-t border-stone-100 pt-12 mt-12 animate-in fade-in duration-500">
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
    </div>
  );
}