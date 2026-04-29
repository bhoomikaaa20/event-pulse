import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        eventId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
    },
    { timestamps: true }
);

export default mongoose.model("Comment", commentSchema);
