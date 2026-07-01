import express from "express";
import User from "../models/User.js";
import Task from "../models/Task.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// GET USERS COUNT
router.get("/users", verifyToken, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({ count: userCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// GET TASKS COUNT
router.get("/tasks", verifyToken, async (req, res) => {
  try {
    const taskCount = await Task.countDocuments();
    res.json({ count: taskCount });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;