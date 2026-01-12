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
    const cacheBuster = new Date().getTime();

    const { data: blacklist } = await supabase
      .from("photo_blacklist")
      .select("photo_id");

    const blacklistedIds = new Set(blacklist?.map((b) => b.photo_id) || []);

    const response = await fetch(
      `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json?cb=${cacheBuster}`
    );

    let cloudResources: CloudinaryResource[] = [];
    if (response.ok) {
      const data = await response.json();
      cloudResources = data.resources.filter(
        (r: CloudinaryResource) => !blacklistedIds.has(r.public_id)
      );
    }

    const { data: dbOrder, error } = await supabase
      .from("photo_order")
      .select(`
        *,
        photo_variants (
          id,
          url,
          position
        ),
        photo_descriptions (
          description
        )
      `)
      .eq("tag", tag)
      .order("position", { ascending: true });

    if (error) throw error;

    const validDbOrder = (dbOrder || []).filter((item) => !blacklistedIds.has(item.id));
    const sortedIds = new Set(validDbOrder.map((item) => item.id));

    const finalItems = [
      ...validDbOrder.map((item) => {
        const rawDescription = item.photo_descriptions;
        let descriptionText = "";

        if (Array.isArray(rawDescription) && rawDescription.length > 0) {
          descriptionText = rawDescription[0].description;
        } else if (rawDescription && typeof rawDescription === 'object') {
          descriptionText = (rawDescription as any).description || "";
        }

        return {
          id: item.id,
          url: item.url,
          alt: `${tag} av Myelie Lendelund`,
          description: descriptionText,
          photo_variants: item.photo_variants?.sort((a: any, b: any) => a.position - b.position) || []
        };
      }),
      ...cloudResources
        .filter((r: CloudinaryResource) => !sortedIds.has(r.public_id))
        .map((r: CloudinaryResource) => ({
          id: r.public_id,
          url: `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/f_auto,q_auto,c_fill,g_faces/${r.public_id}.${r.format}`,
          alt: `${tag} av Myelie Lendelund`,
          description: "",
          photo_variants: []
        }))
    ];

    if (finalItems.length > 0) {
      console.log(`Fetch success [${tag}]:`, finalItems[0]);
    }

    return finalItems;
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}