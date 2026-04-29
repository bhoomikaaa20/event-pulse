import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import eventRoutes from "./routes/event.routes";
import analyticsRoutes from "./routes/analytics.routes";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/analytics", analyticsRoutes);

export default app;