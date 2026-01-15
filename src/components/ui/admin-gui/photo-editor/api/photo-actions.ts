import { supabase, createClerkSupabaseClient } from "@/services";

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

// --- Cloudinary API (Updated for Security) ---
export const uploadToCloudinary = async (
  token: string,
  file: File,
  tag: string,
  isVariant: boolean = false
): Promise<CloudinaryUploadResponse> => {

  const activeTag = isVariant ? `${tag}_variant` : tag;
  const { data: sigData, error: sigError } = await supabase.functions.invoke('cloudinary-uploader', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      tag: activeTag
    },
  });

  if (sigError || !sigData) {
    throw new Error(`Failed to get signature: ${sigError?.message || 'Unknown error'}`);
  }

  const formData = new FormData();
  formData.append("file", file);

  formData.append("api_key", sigData.api_key);
  formData.append("timestamp", sigData.timestamp.toString());
  formData.append("signature", sigData.signature);

  // Settings
  formData.append("upload_preset", "myelie_preset");
  formData.append("tags", activeTag);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/dtscgoycp/image/upload`,
    { method: "POST", body: formData }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || "Cloudinary upload failed");
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
  token: string, // Accept token from component
  file: File,
  tag: string
): Promise<void> => {
  // Pass token to the secured Cloudinary function
  const uploadedImage = await uploadToCloudinary(token, file, tag, false);

  await insertPhoto(token, {
    id: uploadedImage.public_id,
    url: uploadedImage.secure_url,
    tag: tag,
    position: -1
  });
};

export const uploadAndSaveVariant = async (
  token: string, // Accept token from component
  file: File,
  tag: string,
  parentId: string
): Promise<void> => {
  // Pass token to the secured Cloudinary function
  const uploadedImage = await uploadToCloudinary(token, file, tag, true);

  await insertPhotoVariant(token, {
    id: uploadedImage.public_id,
    parent_id: parentId,
    url: uploadedImage.secure_url,
    position: 99
  });
};

// --- Article Specific ---
export const uploadArticleImage = async (
  token: string,
  file: File
): Promise<{ url: string; id: string }> => {
  const uploadedImage = await uploadToCloudinary(token, file, "articles", false);

  return {
    url: uploadedImage.secure_url,
    id: uploadedImage.public_id
  };
};

export const updatePhotoDescription = async (token: string, photoId: string, description: string) => {
  const client = createClerkSupabaseClient(token);
  const { error } = await client
    .from("photo_descriptions")
    .upsert({ photo_id: photoId, description: description }, { onConflict: 'photo_id' });

  if (error) throw error;
};