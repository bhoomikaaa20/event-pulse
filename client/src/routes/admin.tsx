import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Eye, Heart, Pencil, Plus, Trash2, X } from "lucide-react";
import axios from "axios";

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

function AdminPage() {
  const navigate = useNavigate();

  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [events, setEvents] = useState<EventRow[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<EventRow | null>(null);

  const loadEvents = async () => {
    const res = await axios.get("http://localhost:5000/api/events");
    setEvents(res.data);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate({ to: "/auth" });
      return;
    }

    axios
      .get("http://localhost:5000/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        if (res.data.role !== "admin") {
          setAllowed(false);
        } else {
          setAllowed(true);
          loadEvents();
        }
      })
      .catch(() => navigate({ to: "/auth" }))
      .finally(() => setChecking(false));
  }, [navigate]);

  const handleDelete = async (id: string) => {
    const token = localStorage.getItem("token");

    await axios.delete(`http://localhost:5000/api/events/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    toast.success("Deleted");
    loadEvents();
  };

  if (checking) return <div className="text-center py-20">Checking access…</div>;

  if (!allowed) {
    return (
      <div className="text-center py-20">
        <h1>Access denied</h1>
        <Link to="/">← Back</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10 max-w-6xl">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl md:text-5xl">
            Admin Panel
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your movie events
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="bg-gradient-hero text-primary-foreground gap-2"
        >
          <Plus className="h-4 w-4" />
          New Event
        </Button>
      </div>

      {/* FORM */}
      {showForm && (
        <EventForm
          initial={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditing(null);
            loadEvents();
          }}
        />
      )}

      {/* TABLE */}
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
                <tr
                  key={id}
                  className="border-t border-border/40 hover:bg-muted/20 transition"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">

                      {e.image_url ? (
                        <img
                          src={e.image_url}
                          className="h-14 w-10 object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-14 w-10 bg-muted rounded-md flex items-center justify-center text-xs">
                          N/A
                        </div>
                      )}

                      <div>
                        <p className="font-semibold">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.category}
                        </p>
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
                        size="icon"
                        variant="secondary"
                        onClick={() => {
                          setEditing(e);
                          setShowForm(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="destructive"
                        onClick={() => handleDelete(id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                    </div>
                  </td>
                </tr>
              );
            })}

            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-12 text-muted-foreground">
                  No events yet 🚀
                </td>
              </tr>
            )}
          </tbody>

        </table>
      </div>
    </div>
  );
}

/* ================= FORM ================= */

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

    const payload = {
      title,
      category,
      description,
      image_url: imageUrl,
    };

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
          <h2 className="text-xl font-bold">
            {initial ? "Edit Event" : "New Event"}
          </h2>
          <button type="button" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="space-y-4">

          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>

          <div>
            <Label>Category</Label>
            <Input value={category} onChange={(e) => setCategory(e.target.value)} />
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div>
            <Label>Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
          </div>

        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>

          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : initial ? "Update" : "Create"}
          </Button>
        </div>
      </form>
    </div>
  );
}