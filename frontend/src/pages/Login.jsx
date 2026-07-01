import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const { login } = useAuth();

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitHandler = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const success = await login(name, password);

    if (!success) {
      setError("Invalid name or password");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1 className="app-title">Timeline Management</h1>

      <div className="login-box">
        <h2>Welcome Back 👋</h2>
        <p className="subtitle">Please login to your account</p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={submitHandler}>
          <input
            placeholder="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={loading}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
          />

          <button type="submit" disabled={loading}>
            {loading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}