import { useState, useEffect } from "react";
import axios from "axios";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

import { useTasks } from "../context/TaskContext";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";
import RegisterUser from "../pages/RegisterUser";
import "./AdminDashboard.css";

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

    /* =======================
       Main Percentage
    ======================= */
    ctx.font = "700 40px Inter";
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percent}%`, centerX, centerY - 8);

    /* =======================
       Subtitle
    ======================= */
    ctx.font = "500 14px Inter";
    ctx.fillStyle = "#6b7280";
    ctx.fillText("Completed", centerX, centerY + 18);

    /* =======================
       Total Tasks
    ======================= */
    ctx.font = "400 12px Inter";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText(`Total: ${total}`, centerX, centerY + 36);

    ctx.restore();
  },
};

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(0);
  const [taskCount, setTaskCount] = useState(0);
  const { tasks } = useTasks();
  const { logout, user } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("token");

        const usersRes = await axios.get(
          "https://timeline-management-app-bsqm.onrender.com/api/stats/users",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const tasksRes = await axios.get(
          "https://timeline-management-app-bsqm.onrender.com/api/stats/tasks",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserCount(usersRes.data.count);
        setTaskCount(tasksRes.data.count);
      } catch (error) {
        console.error("Failed to fetch stats", error);
      }
    };

    fetchStats();
  }, []);

  const todoCount = tasks.filter(
    (task) => task.status === "todo"
  ).length;

  const inProgressCount = tasks.filter(
    (task) => task.status === "in-progress"
  ).length;

  const doneCount = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const doneTasks = tasks.filter(
    (task) => task.status === "done"
  ).length;

  const pendingTasks = tasks.filter(
    (task) => task.status !== "done"
  ).length;

  const pendingTaskList = tasks.filter(
    (task) => task.status === "todo" || task.status === "in-progress"
  );

  const taskChartData = {
    labels: ["Done Tasks", "Pending Tasks"],
    datasets: [
      {
        label: "Tasks",
        data: [doneTasks, pendingTasks],

        backgroundColor: ["#22c55e", "#f59e0b"],
        borderColor: ["#ffffff"],

        borderWidth: 4,
        hoverOffset: 18,
        borderRadius: 10,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,

    cutout: "75%",

    layout: {
      padding: 10,
    },

    plugins: {
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          padding: 20,
          color: "#374151",
          font: {
            size: 13,
            weight: "600",
          },
        },
      },

      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#fff",
        bodyColor: "#e2e8f0",
        padding: 12,
        cornerRadius: 10,
        displayColors: false,
      },
    },

    animation: {
      animateScale: true,
      animateRotate: true,
      duration: 1200,
      easing: "easeOutQuart",
    },
  };

  // ===============================
  // Employee-wise Task Breakdown
  // ===============================
  const employeeTaskMap = tasks.reduce((acc, task) => {
    const employee = task.assignedTo || "Unassigned";

    if (!acc[employee]) {
      acc[employee] = {
        todo: 0,
        inProgress: 0,
        done: 0,
      };
    }

    if (task.status === "todo") acc[employee].todo += 1;
    if (task.status === "in-progress") acc[employee].inProgress += 1;
    if (task.status === "done") acc[employee].done += 1;

    return acc;
  }, {});

  const employees = [
    ...new Set(tasks.map(task => task.assignedTo).filter(Boolean))
  ];

  const employeeTasks = selectedEmployee
    ? tasks.filter(task => task.assignedTo === selectedEmployee)
    : [];


  // ===============================
  // Tasks Due Within Next 3 Days
  // ===============================
  const today = new Date();
  const threeDaysLater = new Date();
  threeDaysLater.setDate(today.getDate() + 3);

  const upcomingTasks = tasks.filter(task => {
    if (!task.deadline) return false;

    const deadline = new Date(task.deadline);

    return (
      task.status !== "done" &&
      deadline >= today &&
      deadline <= threeDaysLater
    );
  });

  const upcomingTasksByEmployee = upcomingTasks.reduce((acc, task) => {
    const employee = task.assignedTo || "Unassigned";

    if (!acc[employee]) {
      acc[employee] = [];
    }

    acc[employee].push(task);
    return acc;
  }, {});

  const isTomorrow = (dateString) => {
    if (!dateString) return false;

    const deadline = new Date(dateString);
    const today = new Date();

    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    return (
      deadline.getFullYear() === tomorrow.getFullYear() &&
      deadline.getMonth() === tomorrow.getMonth() &&
      deadline.getDate() === tomorrow.getDate()
    );
  };

  const filterTasks = (taskList) => {
    return taskList.filter((task) => {
      const matchesTitle = task.title
        .toLowerCase()
        .includes(debouncedSearchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || task.status === statusFilter;

      return matchesTitle && matchesStatus;
    });
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
            <h2>Admin Dashboard</h2>
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

      <section className="dashboard-section">
        <div className="stats-container">
          <div className="stat-card">
            <h3>Total Users</h3>
            <p>{userCount}</p>
          </div>

          <div className="stat-card">
            <h3>Total Tasks</h3>
            <p>{taskCount}</p>
          </div>

          <div className="stat-card todo">
            <h3>To-Do Tasks</h3>
            <p>{todoCount}</p>
          </div>

          <div className="stat-card in-progress">
            <h3>In-Progress Tasks</h3>
            <p>{inProgressCount}</p>
          </div>

          <div className="stat-card done">
            <h3>Done Tasks</h3>
            <p>{doneCount}</p>
          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <div className="chart-task-layout">

          {/* LEFT: Doughnut Chart */}
          <div className="chart-container">
            <h3>Task Completion</h3>

            <div className="chart-wrapper">
              <Doughnut
                data={taskChartData}
                options={chartOptions}
                plugins={[centerTextPlugin]}
              />
            </div>
          </div>

          {/* RIGHT: Pending Tasks */}
          <div className="pending-task-panel">
            <h3>Pending Tasks</h3>

            {pendingTaskList.length === 0 ? (
              <p className="empty-text">🎉 No pending tasks</p>
            ) : (
              <div className="pending-task-list">
                {pendingTaskList.map((task) => (
                  <div key={task._id} className="pending-task-item">
                    <div>
                      <h4>{task.title}</h4>
                      <span className={`badge ${task.status}`}>
                        {task.status === "todo" ? "To-Do" : "In-Progress"}
                      </span>
                    </div>

                    <span className={`priority ${task.priority}`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </section>

      <section className="dashboard-section" style={{ marginTop: "24px" }}>
        <div className="employee-breakdown">
          <h3>Employee-wise Task Breakdown</h3>

          {Object.keys(employeeTaskMap).length === 0 ? (
            <p className="empty-text">No task data available</p>
          ) : (
            <div className="employee-grid task-breakdown">
              {Object.entries(employeeTaskMap).map(
                ([employee, stats]) => (
                  <div key={employee} className="employee-card">
                    <h4>👤 {employee}</h4>

                    <div className="employee-stats">
                      <span className="todo">
                        To-Do: <b>{stats.todo}</b>
                      </span>

                      <span className="in-progress">
                        In-Progress: <b>{stats.inProgress}</b>
                      </span>

                      <span className="done">
                        Done: <b>{stats.done}</b>
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-section" style={{ marginTop: "24px", marginBottom: "16px" }}>
        <div className="employee-breakdown">
          <h3>⏰ Tasks Due in Next 3 Days</h3>

          {Object.keys(upcomingTasksByEmployee).length === 0 ? (
            <div className="no-task-box">
              <p className="empty-text">🎉 No urgent deadlines</p>
            </div>
          ) : (
            <div className="employee-grid due-task">
              {Object.entries(upcomingTasksByEmployee).map(
                ([employee, tasks]) => (
                  <div key={employee} className="employee-card">
                    <h4>👤 {employee}</h4>

                    <div className="employee-stats deadline-list" style={{ overflowY: "auto", maxHeight: "130px", gap: "8px", paddingRight: "4px" }}>
                      {tasks.map(task => (
                        <div
                          key={task._id}
                          style={{
                            background: isTomorrow(task.deadline)
                              ? "#fee2e2"
                              : "#fff7ed",
                            border: isTomorrow(task.deadline)
                              ? "1px solid #ef4444"
                              : "1px solid #fcd34d",
                            padding: "8px 10px",
                            borderRadius: "10px",
                            fontSize: "13px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "flex-start",
                          }}
                        >
                          <b>{task.title}</b>

                          {isTomorrow(task.deadline) && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "8px",
                                background: "#ef4444",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "2px 8px",
                                borderRadius: "999px",
                              }}
                            >
                              DEADLINE TOMORROW
                            </span>
                          )}

                          {!isTomorrow(task.deadline) && (
                            <span
                              style={{
                                display: "inline-block",
                                marginTop: "8px",
                                background: "#d8a601",
                                color: "#fff",
                                fontSize: "12px",
                                padding: "2px 8px",
                                borderRadius: "999px",
                              }}
                            >
                              EXTEND REQUIRED
                            </span>
                          )}

                          <div style={{ fontSize: "12px", color: "#6b7280", margin: "10px 0" }}>
                            📅 {new Date(task.deadline).toDateString()}
                          </div>

                          <div className={`priority ${task.priority}`}>
                            {task.priority}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-section">
        {/* Open Modal Button */}
        <button className="add-task-btn" onClick={() => setShowModal(true)}>
          + Add Task
        </button>
        
        {user.role === "manager" && (
          <button
            className="add-task-btn"
            style={{ marginLeft: "10px" }}
            onClick={() => setShowRegister(true)}
          >
            + Create User
          </button>
        )}
      </section>

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

      {showRegister && (
        <div className="modal-overlay" onClick={() => setShowRegister(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create User</h3>
              <button className="close-btn" onClick={() => setShowRegister(false)}>
                ✕
              </button>
            </div>

            <RegisterUser closeModal={() => setShowRegister(false)} />
          </div>
        </div>
      )}

      <div className="employee-panel">
        <h3>Employees</h3>

        <div className="employee-list">
          {employees.map((emp) => (
            <button
              key={emp}
              className={`employee-btn ${
                selectedEmployee === emp ? "active" : ""
              }`}
              onClick={() =>
                setSelectedEmployee(
                  selectedEmployee === emp ? null : emp
                )
              }
            >
              👤 {emp}
            </button>
          ))}
        </div>
      </div>

      <section className="dashboard-section">
        {selectedEmployee ? (
          <>
            <h3 style={{ marginBottom: "16px" }}>Tasks for {selectedEmployee}</h3>

            {employeeTasks.length === 0 ? (
              <p className="empty-text">No tasks assigned</p>
            ) : (
              <div className="task-grid">
                {employeeTasks.map(task => (
                  <TaskCard key={task._id} task={task} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="no-task-box">
            <p className="empty-text">👆 Click an employee to view tasks</p>
          </div>
        )}
      </section>

      <section className="dashboard-section task-filter-section">
        <div className="task-filter-bar">
          <div className="task-filter-container">
            
            {/* Search */}
            <div className="search-box">
              <input
                type="text"
                placeholder="Search tasks by title..."
                className="task-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <span className="search-icon">🔍</span>
            </div>

            {/* Status Filter */}
            <div className="filter-dp">
              <select
                  className="status-filter"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="done">Done</option>
                </select>

                {searchQuery !== debouncedSearchQuery && (
                  <span className="searching-indicator">Searching...</span>
                )}
            </div>

          </div>
        </div>
      </section>

      <section className="dashboard-section">
        <h3 style={{ marginTop: "24px", marginBottom: "16px" }}>All Tasks</h3>

        {/* Task List */}
        { tasks.length === 0 ? (
                <div className="no-task-box">
                  <h3>📭 No assigned tasks</h3>
                  <p>Please wait until admin/employee assigns a task.</p>
                </div>
              ) : <div className="task-grid">
                    {filterTasks(tasks).map((task) => (
                      <TaskCard key={task._id} task={task} />
                    ))}
                  </div>
        }

        {filterTasks(tasks).length === 0 && (
          <div className="no-task-box">
            <p className="empty-text">❌ No matching tasks found</p>
          </div>
        )}
      </section>


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