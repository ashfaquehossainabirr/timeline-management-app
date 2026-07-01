import cron from "node-cron";
import Task from "../models/Task.js";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";

export const startTaskReminderJob = () => {
  // Runs every day at 10 AM
  cron.schedule(
  "00 10 * * *",
  async () => {
    console.log("⏰ Running task reminder job.");

    const now = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const tasks = await Task.find({
      status: { $ne: "done" },
      deadline: { $lte: tomorrow },
    });

    for (const task of tasks) {
      const user = await User.findOne({ name: task.assignedTo });
      if (!user) continue;

      const isOverdue = task.deadline < now;

      await sendEmail({
        to: user.email,
        subject: isOverdue
          ? "⚠️ Task Overdue!"
          : "⏰ Task Deadline Reminder",
        html: `
            <p style="color: dodgerblue; font-size: 18px; font-weight: bold;">Hello, ${task.assignedTo}</p>
            <p style="color: dodgerblue; font-size: 18px; font-weight: bold; margin-bottom: 24px;">This is a reminder for your assigned task.</p>
            
            <h2>${isOverdue ? "Overdue Task" : "Upcoming Deadline"}</h2>
            <p><b>Task:</b> ${task.title}</p>
            <p><b>Deadline:</b> ${task.deadline.toDateString()}</p>
            <p>Status: ${task.status}</p>
            
            <br/>
            <p>Please log in to your dashboard for details.</p>
            <p>— Task Manager Team</p>

        `,
      });
    }
  },
  { timezone: "Asia/Dhaka" }
);
};