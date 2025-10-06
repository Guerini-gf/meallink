import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Scan, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface OrderData {
  userName: string;
  mealType: string;
  dishes: string[];
}

export const ScannerInterface = () => {
  const [badgeCode, setBadgeCode] = useState("");
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [scanning, setScanning] = useState(false);

  const handleScan = async () => {
    if (!badgeCode.trim()) {
      toast.error("Inserisci un codice badge");
      return;
    }

    setScanning(true);
    try {
      // Find user by badge code
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*, canteen_id")
        .eq("badge_code", badgeCode)
        .single();

      if (profileError || !profile) {
        toast.error("Badge non trovato");
        setOrderData(null);
        return;
      }

      // Get today's menu and order
      const today = new Date().toISOString().split("T")[0];
      const { data: menu } = await supabase
        .from("daily_menus")
        .select("*")
        .eq("canteen_id", profile.canteen_id)
        .eq("menu_date", today)
        .single();

      if (!menu) {
        toast.error("Nessun menu disponibile per oggi");
        setOrderData(null);
        return;
      }

      // Get user's order
      const { data: order } = await supabase
        .from("meal_orders")
        .select("*, selected_dishes")
        .eq("user_id", profile.id)
        .eq("menu_id", menu.id)
        .single();

      if (!order) {
        toast.error("Nessun ordine trovato per questo utente");
        setOrderData(null);
        return;
      }

      // Get dish names
      const { data: dishes } = await supabase
        .from("dishes")
        .select("name")
        .in("id", order.selected_dishes);

      setOrderData({
        userName: profile.full_name,
        mealType: menu.meal_type === "lunch" ? "Pranzo" : "Cena",
        dishes: dishes?.map((d) => d.name) || [],
      });

      toast.success("Ordine trovato!");
    } catch (error: any) {
      toast.error("Errore durante la scansione");
      console.error(error);
    } finally {
      setScanning(false);
    }
  };

  const handleMarkServed = async () => {
    setBadgeCode("");
    setOrderData(null);
    toast.success("Pasto servito!");
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-medium">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <Input
              placeholder="Scansiona o inserisci codice badge..."
              value={badgeCode}
              onChange={(e) => setBadgeCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleScan()}
              className="text-lg h-14"
              autoFocus
            />
            <Button
              onClick={handleScan}
              disabled={scanning}
              size="lg"
              className="px-8"
            >
              <Scan className="mr-2 h-5 w-5" />
              Scansiona
            </Button>
          </div>
        </CardContent>
      </Card>

      {orderData && (
        <Card className="shadow-strong border-2 border-primary animate-in fade-in slide-in-from-bottom-4">
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-4xl font-bold text-primary mb-2">
                  {orderData.userName}
                </h2>
                <p className="text-xl text-muted-foreground">
                  {orderData.mealType}
                </p>
              </div>

              <div className="bg-muted rounded-lg p-6 space-y-4">
                <h3 className="text-xl font-semibold mb-4">Scelte del menu:</h3>
                <div className="space-y-3">
                  {orderData.dishes.map((dish, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 bg-background p-4 rounded-lg"
                    >
                      <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
                      <span className="text-lg font-medium">{dish}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleMarkServed}
                size="lg"
                className="w-full text-lg py-6"
                variant="default"
              >
                <CheckCircle className="mr-2 h-6 w-6" />
                Segna come Servito
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!orderData && badgeCode === "" && (
        <Card className="shadow-soft bg-muted/50">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Scan className="h-24 w-24 text-muted-foreground mx-auto mb-4 opacity-50" />
              <p className="text-xl text-muted-foreground">
                In attesa di scansione badge...
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
