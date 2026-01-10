import { supabase } from "@/services";
const CLOUD_NAME = "dtscgoycp";

export async function fetchPhotosByTag(tag: string | null) {
  if (!tag) return [];

  try {
    // Fetch Cloudinary data first (Source of Truth for what images exist)
    const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`);
    if (!response.ok) return [];
    const cloudData = await response.json();
    const cloudMap = new Map(cloudData.resources.map((r: any) => [r.public_id, r]));

    // Try to get the sorted order from Supabase if it exists
    if (supabase) {
      const { data: dbOrder, error } = await supabase
        .from("photo_order")
        .select("*")
        .eq("tag", tag)
        .order("position", { ascending: true });

      if (!error && dbOrder && dbOrder.length > 0) {
        // Return Supabase order, but only for images that still exist in Cloudinary
        return dbOrder
          .filter(item => cloudMap.has(item.id))
          .map(item => ({
            id: item.id,
            url: item.url,
            alt: `${tag.charAt(0).toUpperCase() + tag.slice(1)} av Myelie Lendelund`
          }));
      }
    }

    // Fallback: Return Cloudinary data directly (alphabetical)
    return cloudData.resources.map((r: any) => ({
      id: r.public_id,
      url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_fill,g_faces/${r.public_id}.${r.format}`,
      alt: `${tag.charAt(0).toUpperCase() + tag.slice(1)} av Myelie Lendelund`
    }));

  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}