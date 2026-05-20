import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import { MenuManager } from "@/components/menu/MenuManager";
import { CustomerInterface } from "@/components/customer/CustomerInterface";
import { ChefStatistics } from "@/components/dashboard/ChefStatistics";
import { InvestorLeads } from "@/components/dashboard/InvestorLeads";
import { EmployeeManager } from "@/components/employees/EmployeeManager";
import { PWAInstallBanner } from "@/components/pwa/PWAInstallBanner";
import { LogOut, ChefHat } from "lucide-react";
import { toast } from "sonner";
import logoImage from "@/assets/logo.jpg";
import { useUserRole } from "@/hooks/use-user-role";
import { setupNotifications } from "@/lib/notifications";

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole, userName, loading } = useUserRole();

  useEffect(() => {
    checkAuth();
    setupNotifications();
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
            <div className="flex items-center gap-2">
              <Button
                asChild
                className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
              >
                <a
                  href="https://mensa-smart-flow.lovable.app/auth"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ChefHat className="mr-2 h-4 w-4" />
                  Accesso Mensa HACCP
                </a>
              </Button>
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Solo i dipendenti vedono solo la loro area ordini */}
        {userRole === "customer" && (
          <CustomerInterface />
        )}

        {/* Chef vede statistiche, gestione menu e scanner */}
        {userRole === "chef" && (
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="stats">Statistiche</TabsTrigger>
              <TabsTrigger value="menu">Gestione Menu</TabsTrigger>
              <TabsTrigger value="employees">Dipendenti</TabsTrigger>
              <TabsTrigger value="scanner">Scanner Ordini</TabsTrigger>
              <TabsTrigger value="leads">Lead Investitori</TabsTrigger>
            </TabsList>
            
            <TabsContent value="stats">
              <ChefStatistics />
            </TabsContent>
            
            <TabsContent value="menu">
              <MenuManager />
            </TabsContent>

            <TabsContent value="employees">
              <EmployeeManager />
            </TabsContent>
            
            <TabsContent value="scanner">
              <ScannerInterface />
            </TabsContent>

            <TabsContent value="leads">
              <InvestorLeads />
            </TabsContent>
          </Tabs>
        )}

        {/* Operator vede solo scanner */}
        {userRole === "operator" && (
          <ScannerInterface />
        )}
      </main>

      {/* PWA Install Banner */}
      <PWAInstallBanner />
    </div>
  );
};

export default Dashboard;
