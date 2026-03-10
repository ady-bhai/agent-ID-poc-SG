import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import IncidentV5 from "../docs/incident_v5.jsx";
import ArchV3 from "../docs/arch_v3.jsx";
import ArchV4 from "../docs/arch_v4.jsx";

function App() {
  const [view, setView] = useState("incident");

  return (
    <div>
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          zIndex: 9999,
          display: "flex",
          gap: 4,
          padding: "8px 12px",
          background: "rgba(6,9,15,0.9)",
          borderRadius: "0 0 0 10px",
          border: "1px solid #21293b",
          borderTop: "none",
          borderRight: "none",
        }}
      >
        {[
          { id: "incident", label: "Demo (Incident Explorer)" },
          { id: "arch", label: "Reference (Architecture v3)" },
          { id: "ecosystem", label: "Ecosystem View (arch_v4)" },
        ].map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            style={{
              padding: "5px 12px",
              fontSize: 10,
              fontWeight: 600,
              borderRadius: 5,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Geist', 'DM Sans', sans-serif",
              background: view === v.id ? "#3d7cf5" : "transparent",
              color: view === v.id ? "#fff" : "#5e6e87",
              transition: "all 0.15s",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>
      {view === "incident"
        ? <IncidentV5 />
        : view === "arch"
          ? <ArchV3 />
          : <ArchV4 />}
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
