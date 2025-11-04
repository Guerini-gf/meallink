import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { OrderStation } from "./OrderStation";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MenuData {
  id: string;
  menu_date: string;
  meal_type: string;
  dishes: Dish[];
}

export const ScannerInterface = () => {
  const [todayMenu, setTodayMenu] = useState<MenuData | null>(null);
  const [canteenInfo, setCanteenInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTodayMenu();
  }, []);

  const loadTodayMenu = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("canteen_id")
        .eq("id", user.id)
        .single();

      if (!profile?.canteen_id) return;

      // Load canteen info
      const { data: canteen } = await supabase
        .from("canteens")
        .select("name, code")
        .eq("id", profile.canteen_id)
        .single();

      setCanteenInfo(canteen);

      // Load today's menu
      const today = new Date().toISOString().split("T")[0];
      const { data: menu } = await supabase
        .from("daily_menus")
        .select("id, menu_date, meal_type")
        .eq("canteen_id", profile.canteen_id)
        .eq("menu_date", today)
        .eq("meal_type", "lunch")
        .single();

      if (!menu) {
        toast.error("Nessun menu disponibile per oggi");
        setLoading(false);
        return;
      }

      // Load dishes for this menu
      const { data: menuDishes } = await supabase
        .from("menu_dishes")
        .select("dish_id")
        .eq("menu_id", menu.id);

      if (menuDishes && menuDishes.length > 0) {
        const dishIds = menuDishes.map(md => md.dish_id);
        const { data: dishes } = await supabase
          .from("dishes")
          .select("*")
          .in("id", dishIds);

        setTodayMenu({
          ...menu,
          dishes: dishes || [],
        });
      }
    } catch (error) {
      console.error("Error loading menu:", error);
      toast.error("Errore nel caricamento del menu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  if (!todayMenu || !canteenInfo) {
    return (
      <Card className="shadow-medium">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground">
              Nessun menu disponibile per oggi
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-lg border-2 border-primary">
        <CardHeader>
          <CardTitle className="text-3xl text-center">
            Monitor di Servizio - {canteenInfo.name}
          </CardTitle>
          <div className="text-center text-xl font-semibold">
            {new Date(todayMenu.menu_date).toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })} - {todayMenu.meal_type === "lunch" ? "Pranzo" : "Cena"}
          </div>
        </CardHeader>
      </Card>

      {/* Three Order Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <OrderStation
          stationNumber={1}
          menuDishes={todayMenu.dishes}
          menuId={todayMenu.id}
          canteenCode={canteenInfo.code}
        />
        <OrderStation
          stationNumber={2}
          menuDishes={todayMenu.dishes}
          menuId={todayMenu.id}
          canteenCode={canteenInfo.code}
        />
        <OrderStation
          stationNumber={3}
          menuDishes={todayMenu.dishes}
          menuId={todayMenu.id}
          canteenCode={canteenInfo.code}
        />
      </div>
    </div>
  );
};
