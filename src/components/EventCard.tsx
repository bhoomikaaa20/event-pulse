import { Link } from "@tanstack/react-router";
import { Eye, Heart } from "lucide-react";
import { trendingScore, trendingLabel, type TrendTone } from "@/lib/trending";
import { cn } from "@/lib/utils";

interface EventCardProps {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  views_count: number;
  likes_count: number;
  updated_at: string;
  rank?: number;
  featured?: boolean;
  showScore?: boolean;
}

const toneStyles: Record<TrendTone, string> = {
  hot: "text-trending border-trending/40 bg-trending/10",
  rising: "text-primary border-primary/40 bg-primary/10",
  new: "text-accent-foreground border-accent/40 bg-accent/20",
  fading: "text-muted-foreground border-border bg-background/60",
};

export function EventCard(e: EventCardProps) {
  const score = trendingScore(e.views_count, e.likes_count, e.updated_at);
  const trend = trendingLabel(score);
  const featured = e.featured;
  return (
    <Link
      to="/event/$eventId"
      params={{ eventId: e.id }}
      className={cn(
        "group relative block overflow-hidden rounded-2xl border bg-card shadow-card transition-smooth hover:-translate-y-1 hover:shadow-glow",
        featured ? "border-primary/60 shadow-glow ring-1 ring-primary/30" : "border-border/40",
      )}
    >
      {e.rank !== undefined && e.rank <= 3 && (
        <span className="absolute top-3 right-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-hero font-display text-lg font-bold text-primary-foreground shadow-glow">
          {e.rank}
        </span>
      )}
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
        <span className={cn(
          "absolute top-3 left-3 rounded-full backdrop-blur px-3 py-1 text-xs font-semibold border",
          toneStyles[trend.tone],
        )}>
          {trend.label}
        </span>
        {e.showScore && (
          <span className="absolute bottom-3 right-3 rounded-full bg-background/80 backdrop-blur px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/30">
            {Math.round(score * 10) / 10}
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
