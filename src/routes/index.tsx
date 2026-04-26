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

      {/* Live Stats Strip */}
      <section className="border-y border-border/50 bg-card/30">
        <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: Eye, label: "Total Views", value: events?.reduce((s, e) => s + (e.views_count || 0), 0).toLocaleString() ?? "0" },
            { icon: Heart, label: "Total Likes", value: events?.reduce((s, e) => s + (e.likes_count || 0), 0).toLocaleString() ?? "0" },
            { icon: Flame, label: "Active Events", value: events?.length ?? 0 },
            { icon: Activity, label: "Refresh Rate", value: "15s" },
          ].map((s, i) => (
            <div key={i} className="text-center">
              <s.icon className="h-6 w-6 mx-auto text-primary mb-2" />
              <div className="font-display text-3xl md:text-4xl text-gradient">{s.value}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary mb-4">
            <Zap className="h-3.5 w-3.5" /> The pulse engine
          </div>
          <h2 className="font-display text-4xl md:text-5xl">How <span className="text-gradient">PulseReel</span> measures the buzz</h2>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">A weighted decay algorithm that rewards recent activity over stale popularity.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: "01", title: "Capture", desc: "Every view and like is recorded the instant it happens via atomic Postgres functions.", icon: Eye },
            { step: "02", title: "Weight", desc: "Likes count 5x more than views. Recency boosts the score with exponential decay.", icon: BarChart3 },
            { step: "03", title: "Surface", desc: "Trending titles bubble to the top. The lobby refreshes every 15 seconds.", icon: Flame },
          ].map((s) => (
            <div key={s.step} className="relative rounded-2xl border border-border/50 bg-gradient-card p-6 shadow-card hover:border-primary/40 transition-smooth">
              <div className="absolute -top-3 -left-3 font-display text-5xl text-primary/20">{s.step}</div>
              <s.icon className="h-8 w-8 text-primary mb-4 relative" />
              <h3 className="font-display text-2xl mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="border-t border-border/50 bg-card/20">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-xs font-semibold text-accent-foreground mb-4">
                <ShieldCheck className="h-3.5 w-3.5" /> Built for scale
              </div>
              <h2 className="font-display text-4xl md:text-5xl leading-tight">A cinematic stack <span className="text-gradient">made for moments</span></h2>
              <p className="text-muted-foreground mt-4">From red-carpet premieres to surprise drops — PulseReel keeps a finger on the pulse without breaking a sweat.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Cloud, title: "Cloud-native", desc: "Edge-first runtime, globally distributed." },
                { icon: ShieldCheck, title: "Secure by default", desc: "Row-level security on every table." },
                { icon: Activity, title: "Near real-time", desc: "Polling + atomic counters keep data fresh." },
                { icon: Flame, title: "Trend-aware", desc: "Recency-weighted ranking out of the box." },
              ].map((f) => (
                <div key={f.title} className="rounded-xl border border-border/50 bg-background/40 p-5 hover:border-primary/40 transition-smooth">
                  <f.icon className="h-6 w-6 text-primary mb-3" />
                  <div className="font-semibold mb-1">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl md:text-5xl">Loved by <span className="text-gradient">cinephiles</span></h2>
          <p className="text-muted-foreground mt-3">What early viewers are saying about the pulse.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { quote: "Finally a way to see what the audience actually feels — minute by minute.", name: "Maya R.", role: "Film critic" },
            { quote: "The trending badge is addictive. I refresh it during every premiere weekend.", name: "Daniel K.", role: "Festival programmer" },
            { quote: "Clean, fast, and the dark theme is *chef's kiss*. Couldn't recommend it more.", name: "Sana P.", role: "Indie distributor" },
          ].map((t) => (
            <div key={t.name} className="rounded-2xl border border-border/50 bg-gradient-card p-6 shadow-card">
              <Quote className="h-6 w-6 text-primary mb-4" />
              <p className="text-sm leading-relaxed mb-6">{t.quote}</p>
              <div className="text-sm font-semibold">{t.name}</div>
              <div className="text-xs text-muted-foreground">{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-border/50">
        <div className="container mx-auto px-4 py-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-glow opacity-60" />
          <div className="relative">
            <h2 className="font-display text-4xl md:text-6xl">Ready to feel the <span className="text-gradient">pulse</span>?</h2>
            <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Sign in to like your favorites and influence what's trending tonight.</p>
            <Link to="/auth" className="inline-flex items-center gap-2 mt-8 rounded-full bg-gradient-hero px-8 py-3 text-sm font-bold text-primary-foreground shadow-glow hover:opacity-90 transition-smooth">
              Join PulseReel <Sparkles className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
