import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, Heart, Pencil, Plus, Trash2, Upload, X } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type EventRow = {
  id: string;
  title: string;
  category: string;
  description: string;
  image_url: string | null;
  views_count: number;
  likes_count: number;
};

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const loadEvents = async () => {
    const { data } = await supabase.from("events").select("*").order("created_at", { ascending: false });
    setEvents(data || []);
  };

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate({ to: "/auth" }); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const isAdmin = !!roles?.some((r) => r.role === "admin");
      setAllowed(isAdmin);
      setChecking(false);
      if (isAdmin) await loadEvents();
    })();
  }, [navigate]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    loadEvents();
  };

  if (checking) return <div className="container mx-auto py-20 text-center text-muted-foreground">Checking access…</div>;

  if (!allowed) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <h1 className="font-display text-4xl text-gradient mb-4">Access denied</h1>
        <p className="text-muted-foreground mb-6">You need admin privileges. Run this in the Cloud SQL editor to grant your account admin:</p>
        <pre className="text-left text-xs bg-card border border-border rounded-lg p-4 overflow-x-auto">
{`INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users
WHERE email = 'your@email.com';`}
        </pre>
        <Link to="/" className="inline-block mt-6 text-primary hover:underline">← Back home</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage events and monitor performance</p>
        </div>
        <Button onClick={() => { setEditing(null); setShowForm(true); }} className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90 gap-2">
          <Plus className="h-4 w-4" /> New Event
        </Button>
      </div>

      {showForm && (
        <EventForm
          initial={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={() => { setShowForm(false); setEditing(null); loadEvents(); }}
        />
      )}

      <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Views</th>
              <th className="px-4 py-3">Likes</th>
              <th className="px-4 py-3 w-32"></th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-border/40 hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {e.image_url && <img src={e.image_url} alt="" className="h-12 w-9 object-cover rounded" />}
                    <span className="font-semibold">{e.title}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{e.category}</td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-sm"><Eye className="h-3.5 w-3.5" />{e.views_count}</span></td>
                <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-sm"><Heart className="h-3.5 w-3.5" />{e.likes_count}</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setShowForm(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No events yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EventForm({ initial, onClose, onSaved }: { initial: EventRow | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState(initial?.category || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("event-images").upload(path, file);
    if (error) { toast.error(error.message); setUploading(false); return; }
    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    setImageUrl(data.publicUrl);
    setUploading(false);
    toast.success("Image uploaded");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const payload = { title, category, description, image_url: imageUrl || null, updated_at: new Date().toISOString() };
    const { error } = initial
      ? await supabase.from("events").update(payload).eq("id", initial.id)
      : await supabase.from("events").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(initial ? "Event updated" : "Event created");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur p-4 overflow-y-auto">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-card border border-border rounded-2xl p-6 shadow-glow my-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl">{initial ? "Edit Event" : "New Event"}</h2>
          <Button type="button" size="icon" variant="ghost" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input required value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1.5" />
          </div>
          <div>
            <Label>Category</Label>
            <Input required value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1.5" placeholder="Sci-Fi, Drama, Action…" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="mt-1.5 min-h-32" />
          </div>
          <div>
            <Label>Poster image</Label>
            <div className="mt-1.5 flex items-center gap-3">
              <label className="flex-1 flex items-center justify-center gap-2 rounded-md border border-dashed border-border bg-input px-4 py-3 text-sm cursor-pointer hover:bg-muted/30 transition-smooth">
                <Upload className="h-4 w-4" />
                {uploading ? "Uploading…" : imageUrl ? "Replace image" : "Upload image"}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])} />
              </label>
              {imageUrl && <img src={imageUrl} alt="" className="h-14 w-10 object-cover rounded" />}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={saving} className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90">
            {saving ? "Saving…" : initial ? "Save changes" : "Create event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
