import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Send, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";
import axios from "axios";

const API = "http://localhost:5000/api";

interface Comment {
    id: string;
    text: string;
    createdAt: string;
    updatedAt: string;
    user: { id: string; name: string };
}

interface Props {
    eventId: string;
    authed: boolean;
    currentUserId?: string;
    isAdmin?: boolean;
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    // deterministic hue from name
    const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
    return (
        <div
            className="flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: `oklch(0.55 0.2 ${hue})` }}
        >
            {initials}
        </div>
    );
}

export function CommentSection({ eventId, authed, currentUserId, isAdmin }: Props) {
    const qc = useQueryClient();
    const token = () => localStorage.getItem("token");
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [draft, setDraft] = useState("");
    const [editId, setEditId] = useState<string | null>(null);
    const [editText, setEditText] = useState("");

    // ── Fetch comments ──────────────────────────────────────────────────────────
    const { data: comments = [], isLoading } = useQuery<Comment[]>({
        queryKey: ["comments", eventId],
        queryFn: async () => {
            const res = await axios.get(`${API}/events/${eventId}/comments`);
            return res.data;
        },
        refetchInterval: 15000,
    });

    // ── Post comment ────────────────────────────────────────────────────────────
    const postMutation = useMutation({
        mutationFn: async (text: string) => {
            const res = await axios.post(
                `${API}/events/${eventId}/comments`,
                { text },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            return res.data as Comment;
        },
        onMutate: async (text) => {
            await qc.cancelQueries({ queryKey: ["comments", eventId] });
            const prev = qc.getQueryData<Comment[]>(["comments", eventId]);
            // optimistic insert
            qc.setQueryData<Comment[]>(["comments", eventId], (old = []) => [
                {
                    id: "__optimistic__",
                    text,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    user: { id: currentUserId ?? "", name: "You" },
                },
                ...old,
            ]);
            setDraft("");
            return { prev };
        },
        onError: (_err, _text, ctx) => {
            qc.setQueryData(["comments", eventId], ctx?.prev);
            toast.error("Failed to post comment");
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["comments", eventId] });
            toast.success("Comment posted!");
        },
    });

    // ── Edit comment ────────────────────────────────────────────────────────────
    const editMutation = useMutation({
        mutationFn: async ({ id, text }: { id: string; text: string }) => {
            const res = await axios.put(
                `${API}/events/${eventId}/comments/${id}`,
                { text },
                { headers: { Authorization: `Bearer ${token()}` } }
            );
            return res.data;
        },
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ["comments", eventId] });
            setEditId(null);
            toast.success("Comment updated");
        },
        onError: () => toast.error("Failed to update comment"),
    });

    // ── Delete comment ──────────────────────────────────────────────────────────
    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await axios.delete(`${API}/events/${eventId}/comments/${id}`, {
                headers: { Authorization: `Bearer ${token()}` },
            });
        },
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: ["comments", eventId] });
            const prev = qc.getQueryData<Comment[]>(["comments", eventId]);
            qc.setQueryData<Comment[]>(["comments", eventId], (old = []) =>
                old.filter((c) => c.id !== id)
            );
            return { prev };
        },
        onError: (_err, _id, ctx) => {
            qc.setQueryData(["comments", eventId], ctx?.prev);
            toast.error("Failed to delete comment");
        },
        onSuccess: () => toast.success("Comment deleted"),
    });

    const handlePost = () => {
        const text = draft.trim();
        if (!text) return;
        postMutation.mutate(text);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
            handlePost();
        }
    };

    return (
        <section className="mt-12">
            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
                <MessageCircle className="h-6 w-6 text-primary" />
                <h2 className="font-display text-3xl tracking-wide">
                    Comments
                    {comments.length > 0 && (
                        <span className="ml-3 text-base font-sans font-normal text-muted-foreground">
                            {comments.length}
                        </span>
                    )}
                </h2>
            </div>

            {/* Compose box */}
            {authed ? (
                <div className="rounded-2xl border border-border bg-card p-4 mb-8 shadow-card">
                    <textarea
                        ref={textareaRef}
                        id="comment-input"
                        rows={3}
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Share your thoughts… (Ctrl+Enter to post)"
                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                    />
                    <div className="flex justify-end mt-3">
                        <Button
                            id="post-comment-btn"
                            size="sm"
                            disabled={!draft.trim() || postMutation.isPending}
                            onClick={handlePost}
                            className="bg-gradient-hero text-primary-foreground border-0 hover:opacity-90 gap-2"
                        >
                            <Send className="h-4 w-4" />
                            {postMutation.isPending ? "Posting…" : "Post"}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-border/60 bg-card/50 p-5 mb-8 text-center text-sm text-muted-foreground">
                    <Link to="/auth" className="text-primary hover:underline font-medium">
                        Sign in
                    </Link>{" "}
                    to join the conversation.
                </div>
            )}

            {/* Comment list */}
            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-3 animate-pulse">
                            <div className="h-9 w-9 rounded-full bg-muted flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3 w-24 rounded bg-muted" />
                                <div className="h-3 w-full rounded bg-muted" />
                                <div className="h-3 w-3/4 rounded bg-muted" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-10">
                    No comments yet — be the first!
                </p>
            ) : (
                <ul className="space-y-4">
                    {comments.map((comment) => {
                        const canEdit = authed && comment.user.id === currentUserId && comment.id !== "__optimistic__";
                        const canDelete = (authed && comment.user.id === currentUserId || isAdmin) && comment.id !== "__optimistic__";
                        const isEditing = editId === comment.id;

                        return (
                            <li
                                key={comment.id}
                                className="group flex gap-3 rounded-2xl border border-border/50 bg-card/60 p-4 transition-all hover:border-border hover:bg-card"
                            >
                                <Avatar name={comment.user.name} />

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-semibold text-foreground">
                                            {comment.user.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {timeAgo(comment.createdAt)}
                                        </span>
                                        {comment.createdAt !== comment.updatedAt && (
                                            <span className="text-xs text-muted-foreground italic">(edited)</span>
                                        )}
                                    </div>

                                    {isEditing ? (
                                        <div className="mt-2">
                                            <textarea
                                                rows={2}
                                                value={editText}
                                                onChange={(e) => setEditText(e.target.value)}
                                                className="w-full resize-none rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-foreground outline-none focus:border-primary transition-colors"
                                            />
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 gap-1 text-xs text-primary hover:text-primary"
                                                    onClick={() =>
                                                        editMutation.mutate({ id: comment.id, text: editText })
                                                    }
                                                    disabled={editMutation.isPending}
                                                >
                                                    <Check className="h-3 w-3" /> Save
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 gap-1 text-xs text-muted-foreground"
                                                    onClick={() => setEditId(null)}
                                                >
                                                    <X className="h-3 w-3" /> Cancel
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <p className="mt-1 text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap break-words">
                                            {comment.text}
                                        </p>
                                    )}
                                </div>

                                {/* Action buttons */}
                                {!isEditing && (canEdit || canDelete) && (
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                        {canEdit && (
                                            <button
                                                title="Edit"
                                                onClick={() => {
                                                    setEditId(comment.id);
                                                    setEditText(comment.text);
                                                }}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {canDelete && (
                                            <button
                                                title="Delete"
                                                onClick={() => deleteMutation.mutate(comment.id)}
                                                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}
        </section>
    );
}
