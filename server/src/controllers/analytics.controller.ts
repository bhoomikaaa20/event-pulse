import { Request, Response } from "express";
import EventLog from "../models/eventLog.model";
import mongoose from "mongoose";

export const getAnalyticsDashboard = async (req: Request, res: Response) => {
    try {
        const { eventId, dateRange } = req.query;

        const matchStage: any = {};

        // Filter by eventId if provided
        if (eventId && eventId !== "all") {
            matchStage.eventId = new mongoose.Types.ObjectId(eventId as string);
        }

        // Filter by date range
        let days = parseInt(dateRange as string);
        if (isNaN(days)) days = 30; // Default to 30 days

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        matchStage.createdAt = { $gte: startDate };

        // Aggregate total stats
        const totals = await EventLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: null,
                    totalViews: { $sum: { $cond: [{ $eq: ["$action", "VIEW"] }, 1, 0] } },
                    totalLikes: { $sum: { $cond: [{ $eq: ["$action", "LIKE"] }, 1, 0] } },
                    uniqueViewsSet: { 
                        $addToSet: { 
                            $cond: [{ $eq: ["$action", "VIEW"] }, "$userId", null] 
                        } 
                    }
                }
            },
            {
                $project: {
                    totalViews: 1,
                    totalLikes: 1,
                    uniqueViews: {
                        $size: {
                            $filter: { input: "$uniqueViewsSet", as: "item", cond: { $ne: ["$$item", null] } }
                        }
                    }
                }
            }
        ]);

        const stats = totals[0] || { totalViews: 0, totalLikes: 0, uniqueViews: 0 };

        // Aggregate time series
        const timeSeries = await EventLog.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    views: { $sum: { $cond: [{ $eq: ["$action", "VIEW"] }, 1, 0] } },
                    likes: { $sum: { $cond: [{ $eq: ["$action", "LIKE"] }, 1, 0] } }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const formattedTimeSeries = timeSeries.map(item => ({
            date: item._id,
            views: item.views,
            likes: item.likes
        }));

        // Top Performing Events
        let topPerformingEvents = [];
        if (!eventId || eventId === "all") {
            topPerformingEvents = await EventLog.aggregate([
                { $match: matchStage },
                {
                    $group: {
                        _id: "$eventId",
                        views: { $sum: { $cond: [{ $eq: ["$action", "VIEW"] }, 1, 0] } },
                        likes: { $sum: { $cond: [{ $eq: ["$action", "LIKE"] }, 1, 0] } }
                    }
                },
                { $sort: { views: -1 } },
                { $limit: 5 },
                {
                    $lookup: {
                        from: "events",
                        localField: "_id",
                        foreignField: "_id",
                        as: "eventDetails"
                    }
                },
                { $unwind: "$eventDetails" },
                {
                    $project: {
                        eventId: "$_id",
                        title: "$eventDetails.title",
                        views: 1,
                        likes: 1
                    }
                }
            ]);
        }

        res.json({
            stats,
            timeSeries: formattedTimeSeries,
            topPerformingEvents
        });

    } catch (err) {
        console.error("Analytics Error:", err);
        res.status(500).json({ message: "Failed to fetch analytics" });
    }
};
