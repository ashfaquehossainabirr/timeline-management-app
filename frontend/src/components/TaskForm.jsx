import { useState, useEffect } from "react";
import { useTasks } from "../context/TaskContext";
import toast from "react-hot-toast";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function TaskForm({ closeModal }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);

    useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get(
          "https://timeline-management-app-bsqm.onrender.com/api/users",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        // console.log("USERS RESPONSE 👉", res.data);

        setUsers(Array.isArray(res.data) ? res.data : []);
      } catch (error) {
        console.error("Fetch users failed", error);
        setUsers([]);
      }
    };

    fetchUsers();
  }, []);

  const { addTask } = useTasks();

  const [form, setForm] = useState({
    title: "",
    assignedTo: user.role === "employee" ? user.name : "",
    status: "todo",
    priority: "medium",
    deadline: "",
  });

  const submit = async (e) => {
    e.preventDefault();

    const payload = {
      ...form,
      assignedTo:
        user.role === "employee" ? user.name : form.assignedTo,
    };

    try {
      await addTask(payload);

      toast.success("Task added successfully ✅");

      closeModal();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to create task ❌"
      );
    }
  };

  return (
    <form className="task-form" onSubmit={submit}>
      <label>Title:</label>
      <input
        placeholder="Task title"
        value={form.title}
        required
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />

      {user.role !== "employee" && (
        <>
          <label>Assign to:</label>
          <select
            value={form.assignedTo}
            required
            onChange={(e) =>
              setForm({ ...form, assignedTo: e.target.value })
            }
          >
            <option value="">Select Employee</option>

            {users.map((u) => (
              <option key={u._id} value={u.name}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>
        </>
      )}

      <label>Priority:</label>
      <select
        value={form.priority}
        onChange={(e) => setForm({ ...form, priority: e.target.value })}
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>

      <label>Deadline:</label>
      <input
        type="date"
        value={form.deadline}
        onChange={(e) =>
          setForm({ ...form, deadline: e.target.value })
        }
      />

      <button type="submit">Add Task</button>
    </form>
  );
}