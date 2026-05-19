import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const check = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (session) {
          navigate("/dashboard");
        } else {
          setChecking(false);
        }
      } catch (err: any) {
        console.error("Errore getSession:", err);
        setError(err?.message || "Impossibile verificare la sessione. Controlla la connessione e riprova.");
        setChecking(false);
      } finally {
        clearTimeout(timer);
      }
    };
    check();
    timer = setTimeout(() => {
      setError("Timeout durante la verifica della sessione. Controlla la connessione e riprova.");
      setChecking(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-primary p-4">
        <Alert variant="destructive" className="max-w-md bg-background">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errore di connessione</AlertTitle>
          <AlertDescription className="mt-2 space-y-3">
            <p>{error}</p>
            <Button size="sm" onClick={() => window.location.reload()}>
              Riprova
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-primary">
        <div className="text-primary-foreground text-xl">Caricamento...</div>
      </div>
    );
  }

  return <Landing />;
};

export default Index;
