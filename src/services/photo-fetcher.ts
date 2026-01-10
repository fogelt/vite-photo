import { supabase } from "@/services";
const CLOUD_NAME = "dtscgoycp";

interface CloudinaryResource {
  public_id: string;
  format: string;
  [key: string]: any;
}

export async function fetchPhotosByTag(tag: string | null) {
  if (!tag) return [];

  try {
    // Hämta blacklistade ID:n från Supabase
    const { data: blacklist } = await supabase
      .from("photo_blacklist")
      .select("photo_id");

    const blacklistedIds = new Set(blacklist?.map(b => b.photo_id) || []);

    // Hämta Cloudinary-datan
    const response = await fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`);
    let cloudResources: CloudinaryResource[] = [];
    if (response.ok) {
      const data = await response.json();
      // Filtrera bort blacklistade bilder direkt från Cloudinary-listan
      cloudResources = data.resources.filter((r: CloudinaryResource) => !blacklistedIds.has(r.public_id));
    }

    const cloudMap = new Map(cloudResources.map((r: CloudinaryResource) => [r.public_id, r]));

    // Hämta ordningen från Supabase
    const { data: dbOrder, error } = await supabase
      .from("photo_order")
      .select("*")
      .eq("tag", tag)
      .order("position", { ascending: true });

    if (error) throw error;

    // Filtrera även Supabase-ordningen mot blacklistan (för säkerhets skull)
    const validDbOrder = (dbOrder || []).filter(item => !blacklistedIds.has(item.id));
    const sortedIds = new Set(validDbOrder.map(item => item.id));

    const finalItems = [
      ...validDbOrder.map(item => ({
        id: item.id,
        url: item.url,
        alt: `${tag} av Myelie Lendelund`
      })),
      ...cloudResources
        .filter((r: CloudinaryResource) => !sortedIds.has(r.public_id))
        .map((r: CloudinaryResource) => ({
          id: r.public_id,
          url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_fill,g_faces/${r.public_id}.${r.format}`,
          alt: `${tag} av Myelie Lendelund`
        }))
    ];

    return finalItems;

  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}