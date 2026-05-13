import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Landing from "./Landing";

const Index = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate("/dashboard");
        } else {
          setChecking(false);
        }
      } catch {
        setChecking(false);
      }
    };
    check();
    const timer = setTimeout(() => setChecking(false), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

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
