import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function RegisterUser({ closeModal }) {
  const { token } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("https://timeline-management-app-bsqm.onrender.com/api/users/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Authorization: `Bearer ${token}`,
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (res.ok) {
      alert("User created successfully");
      closeModal();
    } else {
      alert(data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      <input name="name" placeholder="Name" onChange={handleChange} required />
      <input name="email" placeholder="Email" onChange={handleChange} required />
      <input
        name="password"
        type="password"
        placeholder="Password"
        onChange={handleChange}
        required
      />

      <select name="role" onChange={handleChange}>
        <option value="employee">Employee</option>
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
      </select>

      <button type="submit">Create User</button>
    </form>
  );
}