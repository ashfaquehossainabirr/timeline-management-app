import express from "express";
import User from "../models/User.js";
import { createUser } from "../controllers/userController.js";
import { verifyToken, managerOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  try {
    const users = await User.find().select("name role");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

router.post("/create", verifyToken, managerOnly, createUser);

export default router;