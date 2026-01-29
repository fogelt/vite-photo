import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { createClerkSupabaseClient } from "@/services";
import { Users, MousePointer2, Activity } from "lucide-react";

export function AnalyticsSummary() {
  const { getToken } = useAuth();

  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["site_analytics"],
    queryFn: async () => {
      const token = await getToken({ template: "supabase" });
      if (!token) throw new Error("Obehörig");

      const adminClient = createClerkSupabaseClient(token);
      const { data, error } = await adminClient
        .from("site_visits")
        .select("*")
        .order("visited_at", { ascending: false });

      if (error) throw error;

      const totalVisits = data?.length || 0;
      const uniqueUsers = new Set(data?.map((v) => v.visitor_hash)).size;
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentVisits = data?.filter(v => new Date(v.visited_at) > oneDayAgo).length || 0;

      return { totalVisits, uniqueUsers, recentVisits };
    },
    refetchInterval: 60000,
  });

  if (isLoading) return <div className="h-4 w-32 bg-stone-50 animate-pulse rounded" />;
  if (error) return null; // Hide completely on error to save space

  return (
    <div className="relative p-5 pt-10 border h-[85px] border-stone-200 shadow-lg flex items-center gap-6 animate-in fade-in slide-in-from-right-4 duration-1000">

      {/* Total */}
      <p className="absolute top-2 text-[10px] text-stone-400 uppercase tracking-widest mt-2 font-bold">
        Statistik
      </p>
      <div className="flex items-center gap-2">
        <MousePointer2 size={15} className="text-stone-400" />
        <div className="flex flex-col">
          <span className="text-[14px] font-medium leading-none text-stone-900">{stats?.totalVisits ?? 0}</span>
          <span className="text-[8px] uppercase tracking-tighter text-stone-400">Händelser</span>
        </div>
      </div>

      {/* Unique */}
      <div className="flex items-center gap-2">
        <Users size={15} className="text-stone-400" />
        <div className="flex flex-col">
          <span className="text-[14px] font-medium leading-none text-stone-900">{stats?.uniqueUsers ?? 0}</span>
          <span className="text-[8px] uppercase tracking-tighter text-stone-400">Unika besökare</span>
        </div>
      </div>

      {/* 24h */}
      <div className="flex items-center gap-2">
        <Activity size={15} className="text-stone-400" />
        <div className="flex flex-col">
          <span className="text-[14px] font-medium leading-none text-stone-900">{stats?.recentVisits ?? 0}</span>
          <span className="text-[8px] uppercase tracking-tighter text-stone-400">24h</span>
        </div>
      </div>

    </div>
  );
}