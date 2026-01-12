import { createClerkSupabaseClient } from "@/services";

export interface PhotoVariant {
  id: string;
  parent_id: string;
  url: string;
  position: number;
}

export interface Photo {
  id: string;
  url: string;
  tag: string;
  position: number;
  photo_variants?: PhotoVariant[];
}

export interface CloudinaryUploadResponse {
  public_id: string;
  secure_url: string;
}

// --- Cloudinary API ---
export const uploadToCloudinary = async (
  file: File,
  tag: string,
  isVariant: boolean = false
): Promise<CloudinaryUploadResponse> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "myelie_preset");
  formData.append("tags", isVariant ? `${tag}_variant` : tag);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dtscgoycp/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    throw new Error("Cloudinary upload failed");
  }

  return response.json();
};

// --- Supabase Photo Operations ---
export const insertPhoto = async (
  token: string,
  photoData: {
    id: string;
    url: string;
    tag: string;
    position: number;
  }
) => {
  const client = createClerkSupabaseClient(token);
  const { error } = await client.from("photo_order").insert([photoData]);

  if (error) throw error;
};

export const deletePhoto = async (token: string, photoId: string) => {
  const client = createClerkSupabaseClient(token);

  await Promise.all([
    client.from("photo_order").delete().eq("id", photoId),
    client.from("photo_blacklist").insert([{ photo_id: photoId }])
  ]);
};

export const updatePhotoOrder = async (
  token: string,
  photos: Array<{ id: string; tag: string; position: number; url: string }>
) => {
  const client = createClerkSupabaseClient(token);
  const { error } = await client
    .from("photo_order")
    .upsert(photos, { onConflict: 'id' });

  if (error) throw error;
};

// --- Supabase Variant Operations ---
export const insertPhotoVariant = async (
  token: string,
  variantData: {
    id: string;
    parent_id: string;
    url: string;
    position: number;
  }
) => {
  const client = createClerkSupabaseClient(token);
  const { error } = await client
    .from("photo_variants")
    .insert([variantData]);

  if (error) throw error;
};

export const deletePhotoVariant = async (token: string, variantId: string) => {
  const client = createClerkSupabaseClient(token);
  const { error } = await client
    .from("photo_variants")
    .delete()
    .eq("id", variantId);

  if (error) throw error;
};

// --- Combined Operations ---
export const uploadAndSavePhoto = async (
  token: string,
  file: File,
  tag: string
): Promise<void> => {
  const uploadedImage = await uploadToCloudinary(file, tag, false);

  await insertPhoto(token, {
    id: uploadedImage.public_id,
    url: uploadedImage.secure_url,
    tag: tag,
    position: -1 // Hamnar först i kön för sortering
  });
};

export const uploadAndSaveVariant = async (
  token: string,
  file: File,
  tag: string,
  parentId: string
): Promise<void> => {
  const uploadedImage = await uploadToCloudinary(file, tag, true);

  await insertPhotoVariant(token, {
    id: uploadedImage.public_id,
    parent_id: parentId,
    url: uploadedImage.secure_url,
    position: 99
  });
};

export const updatePhotoDescription = async (token: string, photoId: string, description: string) => {
  const client = createClerkSupabaseClient(token);
  const { error } = await client
    .from("photo_descriptions")
    .upsert({ photo_id: photoId, description: description }, { onConflict: 'photo_id' });

  if (error) throw error;
};