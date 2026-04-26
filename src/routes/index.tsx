import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { EventCard } from "@/components/EventCard";
import { Sparkles, Activity, Eye, Heart, Flame, Zap, ShieldCheck, Cloud, BarChart3, Quote } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: events, isLoading } = useQuery({
    queryKey: ["events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    refetchInterval: 15000,
  });

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 bg-gradient-glow opacity-70" />
        <div className="container relative mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-6">
            <Sparkles className="h-3.5 w-3.5" /> Live event analytics
          </div>
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl leading-none">
            What the world is <span className="text-gradient">watching</span> right now
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-base md:text-lg text-muted-foreground">
            Real-time popularity scoring for movie events. Every view, every like — measured the moment it happens.
          </p>
        </div>
      </section>

      {/* Events grid */}
      <section className="container mx-auto px-4 py-12 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl">Now Showing</h2>
            <p className="text-sm text-muted-foreground mt-1">Tap a title to dive in</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : events && events.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {events.map((e) => <EventCard key={e.id} {...e} />)}
          </div>
        ) : (
          <div className="text-center py-20 text-muted-foreground">
            No events yet. An admin can add the first one.
          </div>
        )}
      </section>
    </div>
  );
}
