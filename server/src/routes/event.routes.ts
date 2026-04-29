import express from "express";
import {
    getEvents,
    getEventById,
    createEvent,
    incrementView,
    toggleLike,
    updateEvent,
    deleteEvent, getTrendingEvents
} from "../controllers/event.controller";
import { protect } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/admin.middleware";


const router = express.Router();

router.get("/", getEvents);
router.get("/trending", getTrendingEvents); // ✅ Must be BEFORE /:id

router.get("/:id", getEventById);

router.post("/", createEvent);

// NEW ROUTES (IMPORTANT)
router.post("/:id/view", incrementView);
router.post("/:id/like", protect, toggleLike);

router.post("/", protect, isAdmin, createEvent);
router.put("/:id", protect, isAdmin, updateEvent);
router.delete("/:id", protect, isAdmin, deleteEvent);

export default router;