import { supabase } from "@/services";

export async function fetchArticles() {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('position', { ascending: true });

  if (error) {
    console.error("Error fetching articles:", error);
    return [];
  }
  return data;
}