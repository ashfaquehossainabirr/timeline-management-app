import { createPortal } from "react-dom";
import "./TaskDetailsModal.css";

export default function TaskDetailsModal({ task, closeModal }) {
  const getUrgency = (deadline) => {
    if (!deadline) return "normal";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (due - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return "overdue";
    if (diffDays <= 1) return "urgent";
    if (diffDays < 3) return "warning";

    return "normal";
  };

  const getUrgencyLabel = (urgency) => {
    switch (urgency) {
      case "urgent":
        return "🔴 Urgent";
      case "warning":
        return "🟡 Approaching";
      case "overdue":
        return "⚫ Overdue";
      default:
        return "🟢 Normal";
    }
  };

  const urgency = getUrgency(task.deadline);

  const getRemainingDays = (deadline) => {
    if (!deadline) return "No deadline";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const due = new Date(deadline);
    due.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil(
      (due - today) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "⏰ Due today";
    if (diffDays === 1) return "⏳ 1 day left";
    if (diffDays > 1) return `⏳ ${diffDays} days left`;

    return `⚠ Overdue by ${Math.abs(diffDays)} days`;
  };

  return createPortal(
    <div className="modal-overlay" onClick={closeModal}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 style={{ fontSize: "24px" }}>Task Details</h3>
          <button className="close-btn" onClick={closeModal}>
            ✕
          </button>
        </div>

        {/* URGENCY BADGE */}
        <span className={`urgency-badge ${urgency}`}>
          {getUrgencyLabel(urgency)}
        </span>

        <div className="task-details">
          <p><strong>Title:</strong> {task.title}</p>
          <p><strong>Assigned To:</strong> {task.assignedTo}</p>
          <p><strong>Status:</strong> {task.status}</p>
          <p><strong>Priority:</strong> {task.priority}</p>

          {task.deadline && (
            <p>
              <strong>Deadline:</strong>{" "}
              {new Date(task.deadline).toLocaleDateString("en-GB")}
              <br />
              <span className="remaining-days" style={{ marginTop: "12px" }}>
                {getRemainingDays(task.deadline)}
              </span>
            </p>
          )}

          <p style={{ marginTop: "12px" }}>
            <strong>Created At:</strong>{" "}
            {new Date(task.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
}