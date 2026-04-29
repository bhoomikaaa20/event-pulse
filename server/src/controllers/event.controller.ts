import { Request, Response } from "express";
import Event from "../models/event.model";

// ✅ GET ALL EVENTS
export const getEvents = async (req: Request, res: Response) => {
    const events = await Event.find().sort({ updatedAt: -1 });

    const formatted = events.map((event: any) => ({
        ...event._doc,
        id: event._id, // ✅ THIS IS THE FIX
    }));

    res.json(formatted);
};
// ✅ GET SINGLE EVENT
export const getEventById = async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        return res.status(404).json({ message: "Event not found" });
    }

    res.json({
        ...event._doc,
        id: event._id, // ✅ IMPORTANT
    });
};
export const getTrendingEvents = async (req, res) => {
    try {
        const events = await Event.find();

        const now = new Date();

        const ranked = events.map((e) => {
            const updated = e.updatedAt || e.updated_at || new Date();

            const hours =
                (now.getTime() - new Date(updated).getTime()) /
                (1000 * 60 * 60);

            const views = e.views_count || 0;
            const likes = e.likes_count || 0;

            const score =
                views * 0.6 +
                likes * 0.4 -
                hours * 0.5;

            let trend_label = "💀 Fading";
            if (score > 80) trend_label = "🔥 Trending";
            else if (score > 40) trend_label = "🚀 Rising";

            return {
                ...e._doc,
                id: e._id,
                score,
                trend_label,
            };
        });

        ranked.sort((a, b) => b.score - a.score);

        res.json(ranked);
    } catch (err) {
        console.log("TRENDING ERROR:", err); // 🔥 VERY IMPORTANT
        res.status(500).json({ message: "Failed to fetch trending" });
    }
};
// ✅ CREATE EVENT (ADD THIS — YOU ARE MISSING THIS)
export const createEvent = async (req: Request, res: Response) => {
    const { title, description, category, image_url } = req.body;

    const event = await Event.create({
        title,
        description,
        category,
        image_url,
    });

    res.json(event);
};

// ✅ INCREMENT VIEW
export const incrementView = async (req: Request, res: Response) => {
    const event = await Event.findByIdAndUpdate(
        req.params.id,
        { $inc: { views_count: 1 } },
        { new: true }
    );
    res.json(event);
};

// ✅ TOGGLE LIKE
export const toggleLike = async (req: any, res: Response) => {
    const userId = req.user.id;

    const event = await Event.findById(req.params.id);

    const liked = event.likedBy.includes(userId);

    if (liked) {
        event.likedBy = event.likedBy.filter((id: any) => id.toString() !== userId);
        event.likes_count -= 1;
    } else {
        event.likedBy.push(userId);
        event.likes_count += 1;
    }

    await event.save();

    res.json({ liked: !liked });
};

// ✅ UPDATE EVENT
export const updateEvent = async (req: Request, res: Response) => {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
};

// ✅ DELETE EVENT
export const deleteEvent = async (req: Request, res: Response) => {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
};