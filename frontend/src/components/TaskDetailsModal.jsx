import { createPortal } from "react-dom";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import "./TaskDetailsModal.css";
import logo from "../assets/logo.webp";

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

  /* ===============================
     PRINT
  ================================ */
  const handlePrint = () => {
    window.print();
  };

  /* ===============================
     EXPORT PDF
  ================================ */
  const handleExportPDF = async () => {
    const content = document.getElementById("task-details-print");

    const canvas = await html2canvas(content, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;

    /* ===============================
      HEADER SECTION
    ================================ */

    // Logo
    pdf.addImage(logo, "PNG", margin, 10, 30, 20);

    // Company Name
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
    pdf.text("Softvence", 50, 18);

    // Report Title
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal");
    pdf.text("Task Details Report", 50, 26);

    // Date
    pdf.setFontSize(10);
    pdf.text(
      `Exported on: ${new Date().toLocaleDateString()}`,
      pageWidth - margin,
      18,
      { align: "right" }
    );

    // Divider Line
    pdf.setDrawColor(200);
    pdf.line(margin, 35, pageWidth - margin, 35);

    /* ===============================
      CONTENT SECTION
    ================================ */

    const imgWidth = pageWidth - margin * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", margin, 40, imgWidth, imgHeight);

    pdf.save(`task-${task.title}.pdf`);
  };

  /* ===============================
     EXPORT JSON
  ================================ */
  const handleExportJSON = () => {
    const dataStr = JSON.stringify(task, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `task-${task.title}.json`;
    link.click();
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

        {/* ACTION BUTTONS */}
        <div className="task-export-actions">
          <button onClick={handlePrint}>🖨 Print</button>
          <button onClick={handleExportPDF}>📄 Export PDF</button>
          <button onClick={handleExportJSON}>📦 Export JSON</button>
        </div>

        {/* URGENCY BADGE */}
        <span className={`urgency-badge ${urgency}`}>
          {getUrgencyLabel(urgency)}
        </span>

        <div id="task-details-print" className="task-details">
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