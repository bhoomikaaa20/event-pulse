/**
 * PulseReel Trending Engine
 * Formula: trendingScore = (views * 0.6) + (likes * 0.4) - timeDecay
 * timeDecay = hoursSinceLastUpdate * decayFactor
 */
const DECAY_FACTOR = 0.5;

export function trendingScore(views: number, likes: number, updatedAt: string): number {
  const hours = (Date.now() - new Date(updatedAt).getTime()) / 36e5;
  const decay = hours * DECAY_FACTOR;
  return Math.max(0, views * 0.6 + likes * 0.4 - decay);
}

export type TrendTone = "hot" | "rising" | "fading" | "new";
export interface TrendLabel { label: string; tone: TrendTone }

export function trendingLabel(score: number): TrendLabel {
  if (score >= 100) return { label: "🔥 Trending", tone: "hot" };
  if (score >= 30) return { label: "🚀 Rising", tone: "rising" };
  if (score > 0) return { label: "✨ Gaining Buzz", tone: "new" };
  return { label: "💀 Fading", tone: "fading" };
}

export interface RankedEvent {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  views_count: number;
  likes_count: number;
  updated_at: string;
  score: number;
  trend_label: string;
  trend_tone: TrendTone;
}

export function rankEvents<T extends {
  id: string; title: string; category: string; description: string;
  image_url: string | null; views_count: number; likes_count: number; updated_at: string;
}>(events: T[]): RankedEvent[] {
  return events
    .map((e) => {
      const score = trendingScore(e.views_count, e.likes_count, e.updated_at);
      const { label, tone } = trendingLabel(score);
      return { ...e, score: Math.round(score * 10) / 10, trend_label: label, trend_tone: tone };
    })
    .sort((a, b) => b.score - a.score);
}
