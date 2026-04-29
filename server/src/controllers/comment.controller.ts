import { Response } from "express";
import mongoose from "mongoose";
import Comment from "../models/comment.model";

// Helper: get the eventId from merged params (parent uses /:id, child merges it)
const getEventId = (req: any): string => req.params.id || req.params.eventId || "";

// ✅ GET COMMENTS FOR AN EVENT (public)
export const getComments = async (req: any, res: Response) => {
    const eventId = getEventId(req);

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ message: "Invalid event ID" });
    }

    const comments = await Comment.find({ eventId })
        .populate("userId", "name")
        .sort({ createdAt: -1 });

    const formatted = comments.map((c: any) => ({
        id: c._id,
        text: c.text,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        user: {
            id: c.userId?._id,
            name: c.userId?.name || "Unknown",
        },
    }));

    res.json(formatted);
};

// ✅ ADD COMMENT (auth required)
export const addComment = async (req: any, res: Response) => {
    const eventId = getEventId(req);
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(eventId)) {
        return res.status(404).json({ message: "Invalid event ID" });
    }

    if (!text || !text.trim()) {
        return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.create({
        eventId,
        userId: req.user.id,
        text: text.trim(),
    });

    const populated = await comment.populate("userId", "name");
    const pop = populated as any;

    res.status(201).json({
        id: pop._id,
        text: pop.text,
        createdAt: pop.createdAt,
        updatedAt: pop.updatedAt,
        user: {
            id: pop.userId?._id,
            name: pop.userId?.name || "Unknown",
        },
    });
};

// ✅ EDIT COMMENT (only own comment)
export const editComment = async (req: any, res: Response) => {
    const { commentId } = req.params;
    const { text } = req.body;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(404).json({ message: "Invalid comment ID" });
    }

    if (!text || !text.trim()) {
        return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.findById(commentId) as any;

    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.userId.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorised to edit this comment" });
    }

    comment.text = text.trim();
    await comment.save();

    res.json({
        id: comment._id,
        text: comment.text,
        updatedAt: comment.updatedAt,
    });
};

// ✅ DELETE COMMENT (own comment or admin)
export const deleteComment = async (req: any, res: Response) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        return res.status(404).json({ message: "Invalid comment ID" });
    }

    const comment = await Comment.findById(commentId) as any;

    if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
    }

    const isOwner = comment.userId.toString() === req.user.id;
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return res.status(403).json({ message: "Not authorised to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);
    res.json({ message: "Comment deleted" });
};
