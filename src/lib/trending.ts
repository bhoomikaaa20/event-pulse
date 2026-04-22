/**
 * Trending score: combines absolute popularity with recency decay.
 * Recent activity boosts the score; older events decay.
 */
export function trendingScore(views: number, likes: number, updatedAt: string): number {
  const ageHours = (Date.now() - new Date(updatedAt).getTime()) / 36e5;
  const recency = Math.exp(-ageHours / 48); // half-life ~33h
  return (views + likes * 5) * (0.4 + 0.6 * recency);
}

export function trendingLabel(score: number): { label: string; tone: "hot" | "rising" | "steady" } | null {
  if (score >= 500) return { label: "🔥 Trending Now", tone: "hot" };
  if (score >= 100) return { label: "📈 Rising Fast", tone: "rising" };
  if (score >= 25) return { label: "✨ Gaining Buzz", tone: "steady" };
  return null;
}
