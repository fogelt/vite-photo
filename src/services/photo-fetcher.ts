import { supabase } from "@/services";
import { cloudinaryImage } from "@/utils/cloudinary";

const CLOUD_NAME = "dtscgoycp";

/** Human-friendly alt text per photo tag, for image SEO and accessibility. */
const TAG_LABELS: Record<string, string> = {
  weddings_main: "Bröllopsfotografi i Skåne",
  engagement: "Förlovningsfotografi i Skåne",
};

function photoAlt(tag: string) {
  if (tag === "about") return "Myelie Lendelund, bröllopsfotograf i Skåne";
  return `${TAG_LABELS[tag] ?? "Fotografi i Skåne"} av Myelie Lendelund`;
}

interface CloudinaryResource {
  public_id: string;
  format: string;
  [key: string]: any;
}

export async function fetchPhotosByTag(tag: string | null) {
  if (!tag) return [];

  try {
    // Bucket the cache buster so repeated visits within a few minutes reuse the
    // cached Cloudinary list instead of forcing a fresh round trip every time.
    const cacheBuster = Math.floor(Date.now() / (5 * 60 * 1000));

    // All three requests are independent — run them in parallel so the gallery
    // is ready after one round trip instead of three.
    const [blacklistResult, response, dbResult] = await Promise.all([
      supabase.from("photo_blacklist").select("photo_id"),
      fetch(`https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json?cb=${cacheBuster}`),
      supabase
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
        .order("position", { ascending: true }),
    ]);

    const blacklistedIds = new Set(
      blacklistResult.data?.map((b) => b.photo_id) || []
    );

    let cloudResources: CloudinaryResource[] = [];
    if (response.ok) {
      const data = await response.json();
      cloudResources = data.resources.filter(
        (r: CloudinaryResource) => !blacklistedIds.has(r.public_id)
      );
    }

    const { data: dbOrder, error } = dbResult;

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
          url: cloudinaryImage(item.url),
          alt: photoAlt(tag),
          description: descriptionText,
          mobileHero: Boolean(item.mobile_hero),
          photo_variants: item.photo_variants?.sort((a: any, b: any) => a.position - b.position) || []
        };
      }),
      ...cloudResources
        .filter((r: CloudinaryResource) => !sortedIds.has(r.public_id))
        .map((r: CloudinaryResource) => ({
          id: r.public_id,
          url: cloudinaryImage(
            `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${r.public_id}.${r.format}`
          ),
          alt: photoAlt(tag),
          description: "",
          mobileHero: false,
          photo_variants: []
        }))
    ];

    return finalItems;
  } catch (err) {
    console.error("Fetch error:", err);
    return [];
  }
}
