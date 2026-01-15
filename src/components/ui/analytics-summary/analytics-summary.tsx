import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/services";
import { Users, MousePointer2, BarChart3 } from "lucide-react";

export function AnalyticsSummary() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["site_analytics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_visits")
        .select("*")
        .order("visited_at", { ascending: false });

      if (error) throw error;

      const totalVisits = data?.length || 0;
      const uniqueUsers = new Set(data?.map((v) => v.visitor_hash)).size;

      // Calculate most popular pages
      const pageCounts = data?.reduce((acc: Record<string, number>, curr) => {
        acc[curr.page_path] = (acc[curr.page_path] || 0) + 1;
        return acc;
      }, {});

      const popularPages = Object.entries(pageCounts || {})
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      return { totalVisits, uniqueUsers, popularPages };
    },
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) return <div className="h-32 w-full bg-stone-50 animate-pulse mb-12" />;

  return (
    <div className="mb-16 space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Visits */}
        <div className="bg-white border border-stone-100 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Totala Besök</p>
            <MousePointer2 size={14} className="text-stone-300" />
          </div>
          <p className="text-2xl font-light text-stone-900">{stats?.totalVisits}</p>
        </div>

        {/* Unique Visitors */}
        <div className="bg-white border border-stone-100 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Unika Besökare</p>
            <Users size={14} className="text-stone-300" />
          </div>
          <p className="text-2xl font-light text-stone-900">{stats?.uniqueUsers}</p>
        </div>

        {/* Top Pages List */}
        <div className="bg-white border border-stone-100 p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <p className="text-[10px] uppercase tracking-widest text-stone-400 font-bold">Populära Sidor</p>
            <BarChart3 size={14} className="text-stone-300" />
          </div>
          <div className="space-y-2">
            {stats?.popularPages.map((page) => (
              <div key={page.path} className="flex justify-between text-[10px] uppercase tracking-tighter">
                <span className="text-stone-500 truncate max-w-[120px]">{page.path === '/' ? '/hem' : page.path}</span>
                <span className="text-stone-900 font-bold">{page.count} besök</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}