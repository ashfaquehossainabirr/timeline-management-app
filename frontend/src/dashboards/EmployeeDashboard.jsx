import { useState } from "react";
import { useTasks } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import TaskCard from "../components/TaskCard";
import TaskForm from "../components/TaskForm";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import "./EmployeeDashboard.css";

ChartJS.register(ArcElement, Tooltip, Legend);

/* ===============================
   Donut Center Text Plugin
================================ */
const centerTextPlugin = {
  id: "centerText",
  afterDraw(chart) {
    const { ctx, chartArea, data } = chart;
    if (!chartArea) return;

    const { left, right, top, bottom } = chartArea;
    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    const dataset = data.datasets[0];
    const total = dataset.data.reduce((a, b) => a + b, 0);
    const done = dataset.data[0];
    const percent = total ? Math.round((done / total) * 100) : 0;

    ctx.save();
    ctx.font = "700 36px Inter";
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percent}%`, centerX, centerY - 8);

    ctx.font = "500 14px Inter";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("Completed", centerX, centerY + 18);
    ctx.restore();
  },
};

/* ===============================
   Date Helper
================================ */
const daysUntilDeadline = (deadline) => {
  const today = new Date();
  const due = new Date(deadline);

  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);

  const diffTime = due - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/* ===============================
   Weekly Date Helpers
================================ */
const getWeekRange = () => {
  const today = new Date();
  const day = today.getDay(); // 0 (Sun) → 6 (Sat)

  const diffToMonday = day === 0 ? -6 : 1 - day;

  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

export default function EmployeeDashboard() {
  const { tasks } = useTasks();
  const { logout, user } = useAuth();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);

  /* ===============================
     Assigned Tasks
  ================================ */
  const assignedTasks = tasks.filter(
    (task) => task.assignedTo === user.name
  );

  /* ===============================
    Weekly Progress
  ================================ */
  const { startOfWeek, endOfWeek } = getWeekRange();

  const weeklyTasks = assignedTasks.filter((task) => {
    if (!task.createdAt) return false;

    const createdDate = new Date(task.createdAt);
    return createdDate >= startOfWeek && createdDate <= endOfWeek;
  });

  const weeklyDone = weeklyTasks.filter(
    (task) => task.status === "done"
  ).length;

  const weeklyPending = weeklyTasks.filter(
    (task) => task.status !== "done"
  ).length;

  const weeklyTotal = weeklyTasks.length;

  const weeklyCompletion =
    weeklyTotal === 0
      ? 0
      : Math.round((weeklyDone / weeklyTotal) * 100);

  /* ===============================
     Task Lists (ARRAYS)
  ================================ */
  const todoTaskList = assignedTasks.filter(
    (task) => task.status === "todo"
  );

  const inProgressTaskList = assignedTasks.filter(
    (task) => task.status === "in-progress"
  );

  const doneTaskList = assignedTasks.filter(
    (task) => task.status === "done"
  );

  /* ===============================
     Task Counts (NUMBERS)
  ================================ */
  const totalTasks = assignedTasks.length;
  const todoTasks = todoTaskList.length;
  const inProgressTasks = inProgressTaskList.length;
  const doneTasks = doneTaskList.length;

  /* ===============================
     Filtered Tasks
  ================================ */
  const filteredTasks =
    statusFilter === "all"
      ? assignedTasks
      : assignedTasks.filter(
          (task) => task.status === statusFilter
        );

  /* ===============================
     Urgent Tasks (≤ 3 Days)
  ================================ */
  const urgentTasks = assignedTasks.filter((task) => {
    if (!task.deadline) return false;

    const daysLeft = daysUntilDeadline(task.deadline);
    return daysLeft >= 0 && daysLeft <= 3 && task.status !== "done";
  });

  /* ===============================
     Chart Data
  ================================ */
  const chartData = {
    labels: ["Done", "Pending"],
    datasets: [
      {
        data: [
          doneTasks,
          todoTasks + inProgressTasks,
        ],
        backgroundColor: ["#22c55e", "#f59e0b"],
        borderWidth: 4,
      },
    ],
  };

  const chartOptions = {
    cutout: "75%",
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
    },
  };

  return (
    <div className="container">
      {/* ===============================
          Header
      ================================ */}
      <div className="header">
        <div className="header-left">
          <div className="avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>

          <div className="header-text">
            <h2>Tasks Dashboard</h2>
            <p>
              Welcome back, <span>{user.name}</span>
            </p>
          </div>
        </div>

        <button
          className="logout-btn"
          onClick={() => setShowLogoutConfirm(true)}
        >
          Logout
        </button>
      </div>

      {/* ===============================
          Stats
      ================================ */}
      <div className="stats-container">
        <div className="stat-card">
          <h3>Total Tasks</h3>
          <p>{totalTasks}</p>
        </div>

        <div className="stat-card todo">
          <h3>To-Do</h3>
          <p>{todoTasks}</p>
        </div>

        <div className="stat-card in-progress">
          <h3>In Progress</h3>
          <p>{inProgressTasks}</p>
        </div>

        <div className="stat-card done">
          <h3>Done</h3>
          <p>{doneTasks}</p>
        </div>
      </div>

      {/* ===============================
          Chart + Pending Panel
      ================================ */}
      <section className="employee-chart-layout">
        <div className="employee-chart">
          <h3>Task Progress</h3>
          <div className="chart-box">
            <Doughnut
              data={chartData}
              options={chartOptions}
              plugins={[centerTextPlugin]}
            />
          </div>
        </div>

        <div className="employee-task-panel">
          <h3>Pending Tasks</h3>

          {[...todoTaskList, ...inProgressTaskList].length === 0 ? (
            <p className="empty-text">🎉 No pending tasks</p>
          ) : (
            <div className="employee-task-list">
              {[...todoTaskList, ...inProgressTaskList].map((task) => (
                <div key={task._id} className="employee-task-item">
                  <h4>{task.title}</h4>
                  <span className={`badge ${task.status}`}>
                    {task.status === "todo"
                      ? "To-Do"
                      : "In-Progress"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===============================
          Upcoming Deadlines
      ================================ */}
      {urgentTasks.length > 0 && (
        <section className="urgent-task-section">
          <h3>⚠ Upcoming Deadlines (Next 3 Days)</h3>

          <div className="urgent-task-list">
            {urgentTasks.map((task) => {
              const daysLeft = daysUntilDeadline(task.deadline);

              return (
                <div key={task._id} className="urgent-task-card">
                  <div>
                    <h4>{task.title}</h4>
                    <p className="urgent-deadline">
                      ⏰{" "}
                      {daysLeft === 0
                        ? "Due Today"
                        : `Due in ${daysLeft} day(s)`}
                    </p>
                  </div>

                  <span className={`badge ${task.status}`}>
                    {task.status}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ===============================
          Weekly Progress Summary
      ================================ */}
      <section className="weekly-summary">
        <h3>📅 Weekly Progress Summary</h3>

        {weeklyTotal === 0 ? (
          <p className="empty-text">
            No tasks created this week
          </p>
        ) : (
          <div className="weekly-cards">
            <div className="weekly-card done">
              <h4>Completed</h4>
              <p>{weeklyDone}</p>
            </div>

            <div className="weekly-card pending">
              <h4>Pending</h4>
              <p>{weeklyPending}</p>
            </div>

            <div className="weekly-card percent">
              <h4>Completion</h4>
              <p>{weeklyCompletion}%</p>
            </div>
          </div>
        )}
      </section>

      <section className="dashboard-section">
        {/* Open Modal Button */}
        <button className="add-task-btn" onClick={() => setShowModal(true)}>
          + Create My Task
        </button>

        {/* Modal */}
              {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                  <div
                    className="modal-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="modal-header">
                      <h3>Create New Task</h3>
                      <button
                        className="close-btn"
                        onClick={() => setShowModal(false)}
                      >
                        ✕
                      </button>
                    </div>
        
                    <TaskForm closeModal={() => setShowModal(false)} />
                  </div>
                </div>
              )}
      </section>

      {/* ===============================
          Filter Buttons
      ================================ */}
      <div className="task-filter-bar">
        {["all", "todo", "in-progress", "done"].map((status) => (
          <button
            key={status}
            className={`filter-btn ${
              statusFilter === status ? "active" : ""
            }`}
            onClick={() => setStatusFilter(status)}
          >
            {status === "all"
              ? "All"
              : status === "todo"
              ? "To-Do"
              : status === "in-progress"
              ? "In-Progress"
              : "Done"}
          </button>
        ))}
      </div>

      {/* ===============================
          Task Grid
      ================================ */}
      {filteredTasks.length === 0 ? (
        <div className="no-task-box">
          <h3>📭 No tasks found</h3>
          <p>No tasks for this filter.</p>
        </div>
      ) : (
        <div className="task-grid">
          {filteredTasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </div>
      )}

      {/* ===============================
          Logout Confirm
      ================================ */}
      {showLogoutConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowLogoutConfirm(false)}
        >
          <div
            className="modal-content confirm-logout"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>

            <div className="confirm-actions">
              <button
                className="cancel-btn"
                onClick={() => setShowLogoutConfirm(false)}
              >
                Cancel
              </button>

              <button
                className="confirm-btn"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
              >
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}