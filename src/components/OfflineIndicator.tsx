import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineIndicator() {
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2 left-1/2 z-[100] -translate-x-1/2 flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg"
      style={{ paddingTop: "max(0.5rem, env(safe-area-inset-top))" }}
    >
      <WifiOff className="h-4 w-4" />
      Modalità offline — i dati mostrati sono in cache
    </div>
  );
}