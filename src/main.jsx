import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ArchV4 from "../docs/arch_v4.jsx";

function App() {
  return (
    <div>
      <ArchV4 />
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
