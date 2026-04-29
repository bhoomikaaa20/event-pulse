import mongoose from "mongoose";

const eventLogSchema = new mongoose.Schema(
    {
        userId: { type: String, required: true },
        eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
        action: { 
            type: String, 
            enum: ["VIEW", "LIKE", "SHARE", "COMMENT", "WATCH_TIME", "CLICK_SOURCE"], 
            required: true 
        },
        metadata: {
            device: String,
            location: String,
            source: String,
            watchTime: Number
        }
    },
    { timestamps: true }
);

export default mongoose.model("EventLog", eventLogSchema);
