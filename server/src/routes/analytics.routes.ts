import express from "express";
import { getAnalyticsDashboard } from "../controllers/analytics.controller";
import { protect } from "../middleware/auth.middleware";
import { isAdmin } from "../middleware/admin.middleware";

const router = express.Router();

router.get("/", protect, isAdmin, getAnalyticsDashboard);

export default router;
