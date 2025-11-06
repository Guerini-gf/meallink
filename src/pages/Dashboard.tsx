import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { MenuManager } from "@/components/menu/MenuManager";
import { CustomerInterface } from "@/components/customer/CustomerInterface";
import { LogOut, ChefHat, ScanLine, User } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/logo.jpg";
import { useUserRole } from "@/hooks/use-user-role";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole, userName, loading } = useUserRole();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logout effettuato");
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-primary">
        <div className="text-primary-foreground text-xl">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted">
      <header className="bg-gradient-primary shadow-medium">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src={logoImage} 
                alt="SOFTTHECHEFS Logo" 
                className="h-16 w-auto object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-primary-foreground">
                  SOFTTHECHEFS
                </h1>
                <p className="text-primary-foreground/90">
                  Benvenuto, {userName}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Esci
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Solo i dipendenti vedono solo la loro area ordini */}
        {userRole === "customer" && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <User className="h-8 w-8 text-primary" />
              <h2 className="text-3xl font-bold">Area Dipendenti</h2>
            </div>
            <CustomerInterface />
          </div>
        )}

        {/* Chef e Operator vedono tutto */}
        {userRole === "chef" && (
          <>
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <ChefHat className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Gestione Menu</h2>
              </div>
              <MenuManager />
            </div>

            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <ScanLine className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Stazione di Servizio</h2>
              </div>
              <ScannerInterface />
            </div>

            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Area Dipendenti</h2>
              </div>
              <CustomerInterface />
            </div>
          </>
        )}

        {userRole === "operator" && (
          <>
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <ScanLine className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Stazione di Servizio</h2>
              </div>
              <ScannerInterface />
            </div>

            <div className="space-y-6 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-8 w-8 text-primary" />
                <h2 className="text-3xl font-bold">Area Dipendenti</h2>
              </div>
              <CustomerInterface />
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
