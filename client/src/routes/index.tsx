import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { EventCard } from "@/components/EventCard";
import type { RankedEvent } from "@/lib/trending";
import {
  Sparkles,
  Activity,
  Eye,
  Heart,
  Flame,
  Zap,
  ShieldCheck,
  Cloud,
  BarChart3,
  Quote,
  Trophy,
  TrendingUp,
} from "lucide-react";
import axios from "axios";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["trending-events"],
    queryFn: async () => {
      const res = await axios.get("http://localhost:5000/api/events/trending");
      return res.data;
    },
    refetchInterval: 15000,
  });

  const top3 = events.slice(0, 3);
  const rest = events.slice(3);

  return (
    <div>
      {/* HERO */}
      <section className="text-center py-20 border-b border-border/50">
        <h1 className="text-5xl font-bold">
          What the world is <span className="text-gradient">watching</span> right now
        </h1>
        <p className="text-muted-foreground mt-4">
          Real-time entertainment analytics powered by engagement
        </p>
      </section>

      {/* 🔥 TOP 3 TRENDING */}
      {top3.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-2">
            🔥 Trending Now
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {top3.map((e, i) => (
              <EventCard
                key={e.id}
                {...e}
                rank={i + 1}
                featured
                showScore
              />
            ))}
          </div>
        </section>
      )}

      {/* 📈 REST */}
      <section className="container mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <TrendingUp /> More on the radar
        </h2>

        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {rest.map((e, i) => (
              <EventCard key={e.id} {...e} rank={i + 4} showScore />
            ))}
          </div>
        )}
      </section>

      {/* 📊 LIVE STATS */}
      <section className="bg-card/30 py-12 border-y border-border/50">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">

          <div>
            <Eye className="mx-auto mb-2" />
            <h3 className="text-2xl font-bold">
              {events.reduce((s, e) => s + (e.views_count || 0), 0)}
            </h3>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </div>

          <div>
            <Heart className="mx-auto mb-2" />
            <h3 className="text-2xl font-bold">
              {events.reduce((s, e) => s + (e.likes_count || 0), 0)}
            </h3>
            <p className="text-sm text-muted-foreground">Total Likes</p>
          </div>

          <div>
            <Flame className="mx-auto mb-2" />
            <h3 className="text-2xl font-bold">{events.length}</h3>
            <p className="text-sm text-muted-foreground">Active Events</p>
          </div>

          <div>
            <Activity className="mx-auto mb-2" />
            <h3 className="text-2xl font-bold">15s</h3>
            <p className="text-sm text-muted-foreground">Refresh Rate</p>
          </div>

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-10">
          How PulseReel Works
        </h2>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-xl">
            <Eye className="mb-2" />
            <h3 className="font-bold">Capture</h3>
            <p>Every view & like is recorded instantly</p>
          </div>

          <div className="p-6 border rounded-xl">
            <BarChart3 className="mb-2" />
            <h3 className="font-bold">Analyze</h3>
            <p>Engagement + recency decides ranking</p>
          </div>

          <div className="p-6 border rounded-xl">
            <Flame className="mb-2" />
            <h3 className="font-bold">Trend</h3>
            <p>Top events rise automatically</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center py-20 border-t border-border/50">
        <h2 className="text-4xl font-bold">
          Ready to feel the <span className="text-gradient">pulse</span>?
        </h2>

        <Link
          to="/auth"
          className="mt-6 inline-block bg-primary px-6 py-3 rounded-full text-white"
        >
          Join Now
        </Link>
      </section>
    </div>
  );
}