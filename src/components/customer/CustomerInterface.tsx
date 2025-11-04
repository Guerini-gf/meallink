import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, UtensilsCrossed, CheckCircle2 } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface MenuWithDishes {
  id: string;
  menu_date: string;
  meal_type: string;
  dishes: Dish[];
  order_deadline?: string;
}

interface ExistingOrder {
  id: string;
  selected_dishes: string[];
  is_takeaway: boolean;
  takeaway_time: string | null;
  feedback: string | null;
  notes: string | null;
}

export const CustomerInterface = () => {
  const [todayMenu, setTodayMenu] = useState<MenuWithDishes | null>(null);
  const [todayOrder, setTodayOrder] = useState<ExistingOrder | null>(null);
  const [tomorrowMenu, setTomorrowMenu] = useState<MenuWithDishes | null>(null);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [takeawayTime, setTakeawayTime] = useState("12:30");
  const [notes, setNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [canOrder, setCanOrder] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [canteenInfo, setCanteenInfo] = useState<any>(null);

  useEffect(() => {
    loadMenusAndOrders();
  }, []);

  const loadMenusAndOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("canteen_id, full_name, employee_number, badge_code")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.canteen_id) return;
      
      setUserProfile(profile);

      // Load canteen info
      const { data: canteen } = await supabase
        .from("canteens")
        .select("name, code")
        .eq("id", profile.canteen_id)
        .maybeSingle();
      
      setCanteenInfo(canteen);

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];

      // Load today's menu and order
      await loadMenuAndOrder(today, profile.canteen_id, user.id, true);
      
      // Load tomorrow's menu
      await loadMenuAndOrder(tomorrow, profile.canteen_id, user.id, false);

      // Check if can still order (before 16:00)
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      const deadlineTime = 16 * 60; // 16:00
      setCanOrder(currentTime < deadlineTime);

    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const loadMenuAndOrder = async (
    date: string, 
    canteenId: string, 
    userId: string, 
    isToday: boolean
  ) => {
    // Load menu
    const { data: menu } = await supabase
      .from("daily_menus")
      .select("id, menu_date, meal_type, order_deadline")
      .eq("canteen_id", canteenId)
      .eq("menu_date", date)
      .eq("meal_type", "lunch")
      .single();

    if (!menu) {
      if (isToday) setTodayMenu(null);
      else setTomorrowMenu(null);
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

      const menuWithDishes = {
        ...menu,
        dishes: dishes || [],
      };

      if (isToday) {
        setTodayMenu(menuWithDishes);
        
        // Load today's order
        const { data: order } = await supabase
          .from("meal_orders")
          .select("*")
          .eq("user_id", userId)
          .eq("menu_id", menu.id)
          .single();

        setTodayOrder(order);
      } else {
        setTomorrowMenu(menuWithDishes);
        
        // Load existing order for tomorrow if any
        const { data: existingOrder } = await supabase
          .from("meal_orders")
          .select("*")
          .eq("user_id", userId)
          .eq("menu_id", menu.id)
          .single();

        if (existingOrder) {
          setSelectedDishes(existingOrder.selected_dishes);
          setIsTakeaway(existingOrder.is_takeaway || false);
          setTakeawayTime(existingOrder.takeaway_time || "12:30");
          setNotes(existingOrder.notes || "");
          setFeedback(existingOrder.feedback || "");
        }
      }
    }
  };

  const handleDishToggle = (dishId: string) => {
    setSelectedDishes(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const handleSubmitOrder = async () => {
    if (selectedDishes.length === 0) {
      toast.error("Seleziona almeno un piatto");
      return;
    }

    if (!tomorrowMenu) {
      toast.error("Menu di domani non disponibile");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const orderData = {
        user_id: user.id,
        menu_id: tomorrowMenu.id,
        selected_dishes: selectedDishes,
        is_takeaway: isTakeaway,
        takeaway_time: isTakeaway ? takeawayTime : null,
        notes: notes.trim() || null,
        feedback: feedback.trim() || null,
      };

      const { error } = await supabase
        .from("meal_orders")
        .upsert(orderData, {
          onConflict: "user_id,menu_id",
        });

      if (error) throw error;

      toast.success("Ordine salvato con successo!");
      loadMenusAndOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Errore nel salvare l'ordine");
    }
  };

  const groupDishesByCategory = (dishes: Dish[]) => {
    const grouped: { [key: string]: Dish[] } = {};
    dishes.forEach(dish => {
      if (!grouped[dish.category]) {
        grouped[dish.category] = [];
      }
      grouped[dish.category].push(dish);
    });
    return grouped;
  };

  const getCategoryLabel = (category: string) => {
    const labels: { [key: string]: string } = {
      primo: "PRIMI",
      secondo: "SECONDI",
      contorno: "CONTORNI",
      dessert: "DESSERT",
      aggiuntivo: "AGGIUNTIVI",
      richieste: "RICHIESTE",
    };
    return labels[category] || category.toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header with User and Canteen Info */}
      {userProfile && canteenInfo && (
        <Card className="shadow-lg border-2 border-primary">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-primary">
                  {canteenInfo.name}
                </div>
                <div className="text-xl font-semibold">
                  COD {canteenInfo.code}
                </div>
              </div>
              <div className="grid gap-3 text-lg">
                <div className="flex gap-2">
                  <span className="font-semibold">NOME DIPENDENTE:</span>
                  <span>{userProfile.full_name}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">MATRICOLA:</span>
                  <span>{userProfile.employee_number || 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold">BADGE:</span>
                  <span>{userProfile.badge_code || 'N/A'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Order */}
      {todayMenu && todayOrder && (
        <Card className="shadow-medium border-2 border-primary/20">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              <div>
                <CardTitle className="text-2xl">Il Tuo Ordine di Oggi</CardTitle>
                <CardDescription className="text-base">
                  {new Date(todayMenu.menu_date).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {todayMenu.dishes
                .filter(d => todayOrder.selected_dishes.includes(d.id))
                .map(dish => (
                  <div
                    key={dish.id}
                    className="flex items-center gap-3 p-4 bg-muted rounded-lg"
                  >
                    <UtensilsCrossed className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-semibold text-lg">{dish.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {getCategoryLabel(dish.category)}
                      </p>
                    </div>
                  </div>
                ))}
              {todayOrder.is_takeaway && (
                <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="font-semibold">Asporto - Ritiro alle {todayOrder.takeaway_time}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tomorrow's Menu - Order Form */}
      {tomorrowMenu ? (
        <Card className="shadow-medium">
          <CardHeader className="bg-gradient-to-r from-accent/10 to-accent/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-accent" />
                <div>
                  <CardTitle className="text-2xl">Menu di Domani</CardTitle>
                  <CardDescription className="text-base">
                    {new Date(tomorrowMenu.menu_date).toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </CardDescription>
                </div>
              </div>
              {canOrder && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>Ordini entro le 16:00</span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {!canOrder && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="font-semibold text-destructive">
                  Termine per gli ordini superato (16:00)
                </p>
              </div>
            )}

            {Object.entries(groupDishesByCategory(tomorrowMenu.dishes)).map(
              ([category, dishes]) => (
                <div key={category} className="space-y-3">
                  <h3 className="text-xl font-semibold text-primary">
                    {getCategoryLabel(category)}
                  </h3>
                  <div className="space-y-2">
                    {dishes.map(dish => (
                      <div
                        key={dish.id}
                        className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <Checkbox
                          id={dish.id}
                          checked={selectedDishes.includes(dish.id)}
                          onCheckedChange={() => handleDishToggle(dish.id)}
                          disabled={!canOrder}
                        />
                        <Label
                          htmlFor={dish.id}
                          className="flex-1 text-lg cursor-pointer"
                        >
                          {dish.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}

            {/* Takeaway Option */}
            <div className="space-y-4 p-4 border border-border rounded-lg">
              <div className="flex items-center justify-between">
                <Label htmlFor="takeaway" className="text-lg font-semibold">
                  Asporto
                </Label>
                <Switch
                  id="takeaway"
                  checked={isTakeaway}
                  onCheckedChange={setIsTakeaway}
                  disabled={!canOrder}
                />
              </div>
              {isTakeaway && (
                <div className="space-y-2">
                  <Label htmlFor="takeaway-time">Orario di ritiro</Label>
                  <Input
                    id="takeaway-time"
                    type="time"
                    value={takeawayTime}
                    onChange={(e) => setTakeawayTime(e.target.value)}
                    disabled={!canOrder}
                  />
                </div>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-base font-semibold">
                Note / Annotazioni
              </Label>
              <Textarea
                id="notes"
                placeholder="Eventuali note o richieste particolari..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!canOrder}
                rows={3}
              />
            </div>

            {/* Feedback */}
            <div className="space-y-2">
              <Label htmlFor="feedback" className="text-base font-semibold">
                Feedback sul Servizio
              </Label>
              <Textarea
                id="feedback"
                placeholder="Lascia il tuo feedback sul servizio..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleSubmitOrder}
              size="lg"
              className="w-full text-lg"
              disabled={!canOrder || selectedDishes.length === 0}
            >
              {canOrder ? "Salva Ordine" : "Ordini Chiusi"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-medium">
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl text-muted-foreground">
                Menu di domani non ancora disponibile
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
