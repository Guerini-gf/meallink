import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { CustomerInterface } from "@/components/customer/CustomerInterface";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

const Dipendente = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Swap manifest to the employee-only PWA so install uses /dipendente as start_url
    const existing = document.querySelector('link[rel="manifest"]');
    if (existing) existing.setAttribute("href", "/manifest-dipendente.webmanifest");
    document.title = "MealLink Dipendente";

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth?redirect=/dipendente");
        return;
      }
      setReady(true);
    })();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/auth?redirect=/dipendente");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted px-3 py-4">
      <CustomerInterface />
      <div className="max-w-md mx-auto mt-4 flex justify-center">
        <Button onClick={handleLogout} variant="ghost" size="sm" className="text-muted-foreground">
          <LogOut className="mr-2 h-4 w-4" /> Esci
        </Button>
      </div>
    </div>
  );
};

export default Dipendente;