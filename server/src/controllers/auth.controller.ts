import { Request, Response } from "express";
import User from "../models/user.model";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken";

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
            role: "user", // ✅ default role
        });

        res.json({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role, // ✅ include role
            token: generateToken(user._id.toString(), user.role), // ✅ FIXED
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
            role: user.role, // ✅ include role
            token: generateToken(user._id.toString(), user.role), // ✅ FIXED
        });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// 🔹 GET CURRENT USER
export const getMe = async (req: any, res: Response) => {
    res.json({
        id: req.user.id,
        role: req.user.role, // ✅ NOW WORKS
    });
};