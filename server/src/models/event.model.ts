import mongoose from "mongoose";

const eventSchema = new mongoose.Schema(
    {
        title: String,
        description: String,
        image_url: String,
        category: String,
    },
    { timestamps: true }
);

export default mongoose.model("Event", eventSchema);