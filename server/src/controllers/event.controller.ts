import { Request, Response } from "express";
import Event from "../models/event.model";
import EventLog from "../models/eventLog.model";
import mongoose from "mongoose";

// Helper to get aggregated events with views and likes
const getAggregatedEvents = async (matchStage: any = {}) => {
    const pipeline: any[] = [];
    
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    pipeline.push(
        {
            $lookup: {
                from: "eventlogs",
                localField: "_id",
                foreignField: "eventId",
                as: "logs"
            }
        },
        {
            $addFields: {
                views_count: {
                    $size: {
                        $filter: {
                            input: "$logs",
                            as: "log",
                            cond: { $eq: ["$$log.action", "VIEW"] }
                        }
                    }
                },
                likes_count: {
                    $size: {
                        $filter: {
                            input: "$logs",
                            as: "log",
                            cond: { $eq: ["$$log.action", "LIKE"] }
                        }
                    }
                }
            }
        },
        {
            $project: {
                logs: 0 // remove logs array from output
            }
        },
        { $sort: { updatedAt: -1 } }
    );

    return await Event.aggregate(pipeline);
};

// ✅ GET ALL EVENTS
export const getEvents = async (req: Request, res: Response) => {
    const events = await getAggregatedEvents();
    const formatted = events.map((event: any) => ({
        ...event,
        id: event._id,
    }));
    res.json(formatted);
};

// ✅ GET SINGLE EVENT
export const getEventById = async (req: Request, res: Response) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(404).json({ message: "Invalid event ID" });
    }
    const events = await getAggregatedEvents({ _id: new mongoose.Types.ObjectId(req.params.id) });
    if (!events.length) {
        return res.status(404).json({ message: "Event not found" });
    }
    const event = events[0];
    res.json({
        ...event,
        id: event._id,
    });
};

export const getTrendingEvents = async (req: Request, res: Response) => {
    try {
        const events = await getAggregatedEvents();
        const now = new Date();

        const ranked = events.map((e) => {
            const updated = e.updatedAt || e.updated_at || new Date();
            const hours = (now.getTime() - new Date(updated).getTime()) / (1000 * 60 * 60);

            const views = e.views_count || 0;
            const likes = e.likes_count || 0;

            const score = views * 0.6 + likes * 0.4 - hours * 0.5;

            let trend_label = "💀 Fading";
            if (score > 80) trend_label = "🔥 Trending";
            else if (score > 40) trend_label = "🚀 Rising";

            return {
                ...e,
                id: e._id,
                score,
                trend_label,
            };
        });

        ranked.sort((a, b) => b.score - a.score);
        res.json(ranked);
    } catch (err) {
        console.log("TRENDING ERROR:", err);
        res.status(500).json({ message: "Failed to fetch trending" });
    }
};

// ✅ CREATE EVENT
export const createEvent = async (req: Request, res: Response) => {
    const { title, description, category, image_url } = req.body;
    const event = await Event.create({ title, description, category, image_url });
    res.json({ ...event.toObject(), id: event._id, views_count: 0, likes_count: 0 });
};

// ✅ INCREMENT VIEW
export const incrementView = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || req.ip || "anonymous";
    
    await EventLog.create({
        userId,
        eventId: req.params.id,
        action: "VIEW",
        metadata: {
            source: req.headers["referer"] || "direct",
            device: req.headers["user-agent"]
        }
    });

    res.json({ message: "View logged" });
};

// ✅ TOGGLE LIKE
export const toggleLike = async (req: any, res: Response) => {
    const userId = req.user.id;
    const eventId = req.params.id;

    const existingLike = await EventLog.findOne({
        userId,
        eventId,
        action: "LIKE"
    });

    let liked = false;
    if (existingLike) {
        await EventLog.findByIdAndDelete(existingLike._id);
    } else {
        await EventLog.create({
            userId,
            eventId,
            action: "LIKE"
        });
        liked = true;
    }

    res.json({ liked });
};

// ✅ UPDATE EVENT
export const updateEvent = async (req: Request, res: Response) => {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(event);
};

// ✅ DELETE EVENT
export const deleteEvent = async (req: Request, res: Response) => {
    await Event.findByIdAndDelete(req.params.id);
    await EventLog.deleteMany({ eventId: req.params.id });
    res.json({ message: "Deleted" });
};