import express from "express";
import {
    getComments,
    addComment,
    editComment,
    deleteComment,
} from "../controllers/comment.controller";
import { protect } from "../middleware/auth.middleware";

const router = express.Router({ mergeParams: true }); // ✅ mergeParams so /:eventId is visible

// Nested under /api/events/:eventId/comments
router.get("/", getComments);
router.post("/", protect, addComment);

// Standalone comment mutations
router.put("/:commentId", protect, editComment);
router.delete("/:commentId", protect, deleteComment);

export default router;
