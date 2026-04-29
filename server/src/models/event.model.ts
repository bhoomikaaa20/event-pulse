import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        image_url: String,
        category: String,

        views_count: { type: Number, default: 0 },
        likes_count: { type: Number, default: 0 },

        likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
    { timestamps: true }
);

export default mongoose.model("Event", eventSchema);