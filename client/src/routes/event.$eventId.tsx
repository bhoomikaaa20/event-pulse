import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Heart, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { trendingScore, trendingLabel } from "@/lib/trending";
import axios from "axios";

export const Route = createFileRoute("/event/$eventId")({
  component: EventDetail,
});

function EventDetail() {
  const { eventId } = Route.useParams();
  const qc = useQueryClient();
  const viewLogged = useRef(false);
  const [liked, setLiked] = useState(false);
  const [authed, setAuthed] = useState(false);

  const { data: event } = useQuery({
    queryKey: ["event", eventId],
    queryFn: async () => {
      const res = await axios.get(`http://localhost:5000/api/events/${eventId}`);
      return res.data;
    },
    refetchInterval: 10000,
  });

  // Log view once + check auth/like
  useEffect(() => {
    if (viewLogged.current) return;
    viewLogged.current = true;

    const token = localStorage.getItem("token");

    // 🔹 1. Increment view (no auth needed)
    axios.post(`http://localhost:5000/api/events/${eventId}/view`)
      .then(() => {
        qc.invalidateQueries({ queryKey: ["event", eventId] });
        qc.invalidateQueries({ queryKey: ["events"] });
      })
      .catch(() => { });

    // 🔹 2. Check auth + like status
    if (token) {
      setAuthed(true);

      axios.get(`http://localhost:5000/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          // backend should return liked events OR we check manually

          // OPTION 1 (recommended backend): return liked events
          const likedEvents = res.data.likedEvents || [];
          setLiked(likedEvents.includes(eventId));

          // OPTION 2 (if not implemented yet): skip like check
          // setLiked(false);
        })
        .catch(() => {
          setAuthed(false);
        });
    }

  }, [eventId, qc]);

  const handleLike = async () => {
    if (!authed) {
      toast.error("Sign in to like this event");
      return;
    }

    const token = localStorage.getItem("token");

    const res = await axios.post(
      `http://localhost:5000/api/events/${eventId}/like`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setLiked(res.data.liked);

    qc.invalidateQueries({ queryKey: ["event", eventId] });
    qc.invalidateQueries({ queryKey: ["events"] });
  };

  if (!event) {
    return <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading…</div>;
  }

  const trend = trendingLabel(trendingScore(event.views_count, event.likes_count, event.updated_at));

  return (
    <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
      <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-smooth">
        <ArrowLeft className="h-4 w-4" /> All events
      </Link>

      <div className="grid md:grid-cols-[2fr_3fr] gap-8 lg:gap-12">
        <div className="relative rounded-3xl overflow-hidden shadow-card aspect-[2/3] bg-muted">
          {event.image_url && (
            <img src={event.image_url} alt={event.title} className="h-full w-full object-cover" />
          )}
          {trend && (
            <span className="absolute top-4 left-4 rounded-full bg-background/80 backdrop-blur px-4 py-1.5 text-sm font-semibold text-trending border border-trending/30">
              {trend.label}
            </span>
          )}
        </div>

        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-widest text-primary font-bold">{event.category}</span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl mt-2 leading-none">{event.title}</h1>

          <div className="flex items-center gap-6 mt-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              <span className="text-2xl font-semibold text-foreground tabular-nums">{(event.views_count ?? 0).toLocaleString()}</span>
              <span className="text-xs">views</span>
            </div>
            <div className="flex items-center gap-2">
              <Heart className={`h-5 w-5 ${liked ? "fill-accent text-accent" : ""}`} />
              <span className="text-2xl font-semibold text-foreground tabular-nums">{(event.likes_count ?? 0).toLocaleString()}</span>
              <span className="text-xs">likes</span>
            </div>
          </div>

          <p className="mt-6 text-base md:text-lg text-foreground/80 leading-relaxed">{event.description}</p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              size="lg"
              onClick={handleLike}
              className={liked
                ? "bg-accent text-accent-foreground hover:bg-accent/90 gap-2"
                : "bg-gradient-hero text-primary-foreground border-0 hover:opacity-90 shadow-glow gap-2"}
            >
              <Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />
              {liked ? "Liked" : "Like this event"}
            </Button>
          </div>

          {!authed && (
            <p className="mt-4 text-sm text-muted-foreground">
              <Link to="/auth" className="text-primary hover:underline">Sign in</Link> to like and join the audience.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
