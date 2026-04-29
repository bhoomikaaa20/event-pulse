import express from "express";
import { login, signup } from "../controllers/auth.controller";
import { protect } from "../middleware/auth.middleware";
import { getMe } from "../controllers/auth.controller";

const router = express.Router();

router.post("/login", login);
router.post("/signup", signup);
router.get("/me", protect, getMe);


export default router;