import { Link } from "@tanstack/react-router";
import { Eye, Heart } from "lucide-react";
import { trendingScore, trendingLabel } from "@/lib/trending";

interface EventCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  views_count: number;
  likes_count: number;
  updated_at: string;
}

export function EventCard(e: EventCardProps) {
  const trend = trendingLabel(trendingScore(e.views_count, e.likes_count, e.updated_at));
  return (
    <Link
      to="/event/$eventId"
      params={{ eventId: e.id }}
      className="group relative block overflow-hidden rounded-2xl border border-border/40 bg-card shadow-card hover:shadow-glow transition-smooth hover:-translate-y-1"
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {e.image_url ? (
          <img
            src={e.image_url}
            alt={e.title}
            loading="lazy"
            className="h-full w-full object-cover transition-smooth group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">No image</div>
        )}
        <div className="absolute inset-0 bg-gradient-card opacity-80" />
        {trend && (
          <span className="absolute top-3 left-3 rounded-full bg-background/80 backdrop-blur px-3 py-1 text-xs font-semibold text-trending border border-trending/30">
            {trend.label}
          </span>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <span className="inline-block text-[10px] uppercase tracking-widest text-primary font-bold mb-1">
            {e.category}
          </span>
          <h3 className="font-display text-2xl leading-tight text-foreground line-clamp-2">{e.title}</h3>
        </div>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5"><Eye className="h-4 w-4" />{e.views_count.toLocaleString()}</span>
          <span className="flex items-center gap-1.5"><Heart className="h-4 w-4" />{e.likes_count.toLocaleString()}</span>
        </div>
        <span className="text-xs text-primary font-semibold opacity-0 group-hover:opacity-100 transition-smooth">
          View →
        </span>
      </div>
    </Link>
  );
}
