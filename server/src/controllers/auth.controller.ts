import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken";
import EventLog from "../models/eventLog.model";

// 🔹 SIGNUP
export const signup = async (req: Request, res: Response) => {
    try {
        const { name, email, password } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: "user",
        });

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 LOGIN
export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id.toString(), user.role),
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 GET CURRENT USER
export const getMe = async (req: any, res: Response) => {
    const userId = req.user.id;

    // Get all events this user has liked from EventLog
    const likeLogs = await EventLog.find({ userId, action: "LIKE" }).select("eventId");
    const likedEvents = likeLogs.map((log: any) => log.eventId.toString());

    res.json({
        id: userId,
        role: req.user.role,
        likedEvents,
    });
};