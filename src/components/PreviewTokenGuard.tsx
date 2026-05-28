import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const PUBLIC_URL = "https://meallink.lovable.app";
const REDIRECT_DELAY_MS = 4000;

/**
 * Quando l'utente apre l'app tramite l'URL di anteprima Lovable
 * (id-preview--*.lovable.app) con un `__lovable_token` nella query string,
 * mostra un avviso e reindirizza automaticamente all'URL pubblico,
 * dove il token non è richiesto e il link non scade mai.
 */
export const PreviewTokenGuard = () => {
  const [show, setShow] = useState(false);
  const [target, setTarget] = useState<string>("");
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(REDIRECT_DELAY_MS / 1000));

  useEffect(() => {
    if (typeof window === "undefined") return;

    const { hostname, pathname, search, hash } = window.location;
    const isPreviewHost = /^id-preview--.*\.lovable\.app$/i.test(hostname);
    const params = new URLSearchParams(search);
    const hasToken = params.has("__lovable_token") || params.has("__lovable_sha");

    if (!isPreviewHost || !hasToken) return;

    // Rimuovo i parametri Lovable prima del redirect
    params.delete("__lovable_token");
    params.delete("__lovable_sha");
    const cleanSearch = params.toString();
    const publicTarget = `${PUBLIC_URL}${pathname}${cleanSearch ? `?${cleanSearch}` : ""}${hash}`;

    setTarget(publicTarget);
    setShow(true);

    const interval = window.setInterval(() => {
      setSecondsLeft((s) => (s > 1 ? s - 1 : 0));
    }, 1000);

    const timeout = window.setTimeout(() => {
      window.location.replace(publicTarget);
    }, REDIRECT_DELAY_MS);

    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/90 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-lg border border-border bg-card text-card-foreground shadow-lg p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Link di anteprima scaduto</h2>
            <p className="text-sm text-muted-foreground">
              Stai usando un URL temporaneo di anteprima. Ti sto reindirizzando
              all'URL pubblico ufficiale di MealLink…
            </p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          Redirect automatico tra <span className="font-semibold text-foreground">{secondsLeft}s</span>
        </div>

        <a
          href={target}
          className="block w-full text-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 transition"
        >
          Vai subito su meallink.lovable.app
        </a>
      </div>
    </div>
  );
};

export default PreviewTokenGuard;