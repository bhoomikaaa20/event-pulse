import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Eye, Heart, Pencil, Plus, Trash2, X, Users, BarChart3,
  TrendingUp, Calendar, Filter, Trophy, Activity, Share2
} from "lucide-react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type EventRow = {
  id?: string;
  _id?: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  views_count: number;
  likes_count: number;
};

type AnalyticsData = {
  stats: { totalViews: number; totalLikes: number; uniqueViews: number };
  timeSeries: { date: string; views: number; likes: number }[];
  topPerformingEvents: { eventId: string; title: string; views: number; likes: number }[];
};

const DATE_RANGES = [
  { label: "Today", value: 1 },
  { label: "Last 7 Days", value: 7 },
  { label: "Last 30 Days", value: 30 },
];

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);
  const [activeTab, setActiveTab] = useState<"events" | "analytics">("events");

  // Analytics state
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState("all");
  const [dateRange, setDateRange] = useState(30);

  const loadEvents = async () => {
    const res = await axios.get("http://localhost:5000/api/events");
    setEvents(res.data);
  };

  const loadAnalytics = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setAnalyticsLoading(true);
    try {
      const params: any = { dateRange };
      if (selectedEventId !== "all") params.eventId = selectedEventId;
      const res = await axios.get("http://localhost:5000/api/analytics", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setAnalytics(res.data);
    } catch (err) {
      toast.error("Failed to load analytics");
    } finally {
      setAnalyticsLoading(false);
    }
  }, [dateRange, selectedEventId]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) { navigate({ to: "/auth" }); return; }
    axios.get("http://localhost:5000/api/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    }).then((res) => {
      if (res.data.role !== "admin") {
        setAllowed(false);
      } else {
        setAllowed(true);
        loadEvents();
      }
    }).catch(() => navigate({ to: "/auth" }))
      .finally(() => setChecking(false));
  }, [navigate]);

  useEffect(() => {
    if (allowed && activeTab === "analytics") loadAnalytics();
  }, [allowed, activeTab, loadAnalytics]);

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");
    await axios.delete(`http://localhost:5000/api/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    toast.success("Deleted");
    loadEvents();
  };

  if (checking) return <div className="text-center py-20 text-muted-foreground">Checking access…</div>;
  if (!allowed) return (
    <div className="text-center py-20">
      <h1>Access denied</h1>
      <Link to="/">← Back</Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-10 max-w-7xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Admin Panel</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage events & analytics</p>
        </div>
        <Button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="bg-gradient-hero text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-8 p-1 bg-muted/40 rounded-xl w-fit border border-border/40">
        {(["events", "analytics"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-lg text-sm font-medium capitalize transition-all duration-200 flex items-center gap-2 ${
              activeTab === tab
                ? "bg-card text-foreground shadow-sm border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === "events" ? <BarChart3 className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {tab}
          </button>
        ))}
      </div>

      {/* FORM */}
      {showForm && (
        <EventForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadEvents(); }}
        />
      )}

      {/* ======== EVENTS TAB ======== */}
      {activeTab === "events" && (
        <div className="rounded-2xl border border-border/50 bg-card shadow-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-6 py-4">Event</th>
                <th className="px-6 py-4">Views</th>
                <th className="px-6 py-4">Likes</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => {
                const id = e.id || e._id!;
                return (
                  <tr key={id} className="border-t border-border/40 hover:bg-muted/20 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        {e.image_url ? (
                          <img src={e.image_url} className="h-14 w-10 object-cover rounded-md" />
                        ) : (
                          <div className="h-14 w-10 bg-muted rounded-md flex items-center justify-center text-xs">N/A</div>
                        )}
                        <div>
                          <p className="font-semibold">{e.title}</p>
                          <p className="text-xs text-muted-foreground">{e.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {e.views_count}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        {e.likes_count}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedEventId(id);
                            setActiveTab("analytics");
                          }}
                          title="View Analytics"
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="secondary"
                          onClick={() => { setEditing(e); setShowForm(true); }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="destructive" onClick={() => handleDelete(id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {events.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-muted-foreground">No events yet 🚀</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======== ANALYTICS TAB ======== */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* FILTERS */}
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl border border-border/40 bg-card/60">
            <Filter className="h-4 w-4 text-muted-foreground" />

            {/* Date Range */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {DATE_RANGES.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setDateRange(r.value)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      dateRange === r.value
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Event Selector */}
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="bg-muted text-foreground text-sm rounded-lg px-3 py-1.5 border border-border/40 outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="all">All Events</option>
              {events.map((ev) => (
                <option key={ev.id || ev._id} value={ev.id || ev._id}>
                  {ev.title}
                </option>
              ))}
            </select>

            <Button
              size="sm"
              onClick={loadAnalytics}
              disabled={analyticsLoading}
              className="bg-gradient-hero text-primary-foreground ml-auto"
            >
              {analyticsLoading ? "Loading…" : "Apply Filters"}
            </Button>
          </div>

          {/* METRIC CARDS */}
          {analytics && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  icon={<Eye className="h-5 w-5" />}
                  label="Total Views"
                  value={analytics.stats.totalViews}
                  color="text-blue-400"
                  bg="bg-blue-500/10"
                />
                <MetricCard
                  icon={<Users className="h-5 w-5" />}
                  label="Unique Views"
                  value={analytics.stats.uniqueViews}
                  color="text-purple-400"
                  bg="bg-purple-500/10"
                />
                <MetricCard
                  icon={<Heart className="h-5 w-5" />}
                  label="Total Likes"
                  value={analytics.stats.totalLikes}
                  color="text-rose-400"
                  bg="bg-rose-500/10"
                />
                <MetricCard
                  icon={<Share2 className="h-5 w-5" />}
                  label="Engagement Rate"
                  value={
                    analytics.stats.totalViews > 0
                      ? `${((analytics.stats.totalLikes / analytics.stats.totalViews) * 100).toFixed(1)}%`
                      : "0%"
                  }
                  color="text-amber-400"
                  bg="bg-amber-500/10"
                  isText
                />
              </div>

              {/* CHARTS */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Views Over Time */}
                <div className="rounded-2xl border border-border/40 bg-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                    <Eye className="h-4 w-4" /> Views Over Time
                  </h3>
                  {analytics.timeSeries.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data for this range</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={analytics.timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 30)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "oklch(0.65 0.02 60)" }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 60)" }} />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(0.18 0.025 30)",
                            border: "1px solid oklch(0.28 0.03 30)",
                            borderRadius: "0.75rem",
                            color: "oklch(0.97 0.01 80)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="views"
                          stroke="#60a5fa"
                          strokeWidth={2}
                          dot={{ fill: "#60a5fa", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Likes Over Time */}
                <div className="rounded-2xl border border-border/40 bg-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                    <Heart className="h-4 w-4" /> Likes Over Time
                  </h3>
                  {analytics.timeSeries.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data for this range</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={analytics.timeSeries}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.03 30)" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 11, fill: "oklch(0.65 0.02 60)" }}
                          tickFormatter={(d) => d.slice(5)}
                        />
                        <YAxis tick={{ fontSize: 11, fill: "oklch(0.65 0.02 60)" }} />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(0.18 0.025 30)",
                            border: "1px solid oklch(0.28 0.03 30)",
                            borderRadius: "0.75rem",
                            color: "oklch(0.97 0.01 80)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="likes"
                          stroke="#fb7185"
                          strokeWidth={2}
                          dot={{ fill: "#fb7185", r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* TOP PERFORMING EVENTS */}
              {analytics.topPerformingEvents.length > 0 && (
                <div className="rounded-2xl border border-border/40 bg-card p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                    <Trophy className="h-4 w-4 text-amber-400" /> Top Performing Events
                  </h3>
                  <div className="space-y-3">
                    {analytics.topPerformingEvents.map((ev, idx) => (
                      <div
                        key={ev.eventId}
                        className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/30 hover:bg-muted/50 transition"
                      >
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold font-display w-8 text-center ${
                            idx === 0 ? "text-amber-400" : idx === 1 ? "text-slate-400" : idx === 2 ? "text-amber-700" : "text-muted-foreground"
                          }`}>
                            #{idx + 1}
                          </span>
                          <p className="font-medium text-sm">{ev.title}</p>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Eye className="h-3.5 w-3.5 text-blue-400" /> {ev.views}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart className="h-3.5 w-3.5 text-rose-400" /> {ev.likes}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {!analytics && !analyticsLoading && (
            <div className="text-center py-20 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Set filters above and click <strong>Apply Filters</strong> to load analytics</p>
            </div>
          )}

          {analyticsLoading && (
            <div className="text-center py-20 text-muted-foreground animate-pulse">
              Loading analytics data…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ========= METRIC CARD ========= */
function MetricCard({
  icon, label, value, color, bg, isText = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  bg: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border/40 bg-card p-5 flex flex-col gap-3 hover:border-border/80 transition">
      <div className={`w-9 h-9 rounded-xl ${bg} ${color} flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold tabular-nums">
          {isText ? value : Number(value).toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </div>
    </div>
  );
}

/* ========= EVENT FORM ========= */
function EventForm({ initial, onClose, onSaved }: any) {
  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem("token");
    const payload = { title, category, description, image_url: imageUrl };
    if (initial) {
      await axios.put(
        `http://localhost:5000/api/events/${initial.id || initial._id}`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } else {
      await axios.post(
        "http://localhost:5000/api/events",
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
    }
    toast.success(initial ? "Updated" : "Created");
    setSaving(false);
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-xl"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{initial ? "Edit Event" : "New Event"}</h2>
          <button type="button" onClick={onClose}><X /></button>
        </div>
        <div className="space-y-4">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Category</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} /></div>
          <div><Label>Description</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>Image URL</Label><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : initial ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}