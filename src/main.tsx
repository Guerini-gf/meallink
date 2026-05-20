import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { toast } from "sonner";

const formatReason = (reason: unknown): string => {
  if (!reason) return "Errore sconosciuto";
  if (reason instanceof Error) return reason.message;
  if (typeof reason === "string") return reason;
  try {
    return JSON.stringify(reason);
  } catch {
    return String(reason);
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("unhandledrejection", (event) => {
    const message = formatReason(event.reason);
    console.error("[UnhandledRejection]", event.reason);
    toast.error("Si è verificato un errore", {
      description: message.slice(0, 200),
      duration: 8000,
      action: {
        label: "Ricarica",
        onClick: () => window.location.reload(),
      },
    });
  });

  window.addEventListener("error", (event) => {
    console.error("[GlobalError]", event.error || event.message);
    toast.error("Errore applicazione", {
      description: (event.error?.message || event.message || "Errore imprevisto").slice(0, 200),
      duration: 8000,
      action: {
        label: "Ricarica",
        onClick: () => window.location.reload(),
      },
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
