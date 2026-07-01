import { Toaster } from "react-hot-toast";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { TaskProvider } from "./context/TaskContext";
import AdminDashboard from "./dashboards/AdminDashboard";
import EmployeeDashboard from "./dashboards/EmployeeDashboard";
import Login from "./pages/Login";

function AppContent() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  // Admin + Manager → Admin Dashboard
  if (user.role === "admin" || user.role === "manager") {
    return <AdminDashboard />;
  }

  // Employee → Employee Dashboard
  return <EmployeeDashboard />;
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontSize: "14px",
            borderRadius: "10px",
          },
        }}
      />
      
      <AuthProvider>
        <TaskProvider>
          <AppContent />
        </TaskProvider>
      </AuthProvider>
    </>
  );
}