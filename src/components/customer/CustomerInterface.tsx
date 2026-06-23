import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, UtensilsCrossed, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface Allergen { id: string; name: string; icon: string | null; }
interface Dish { id: string; name: string; category: string; allergens?: Allergen[]; }
interface MenuWithDishes { id: string; menu_date: string; meal_type: string; dishes: Dish[]; order_deadline?: string; }
interface ExistingOrder {
  id: string;
  selected_dishes: string[];
  is_takeaway: boolean;
  takeaway_time: string | null;
  feedback: string | null;
  notes: string | null;
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: "primo", label: "Primo Piatto" },
  { key: "secondo", label: "Secondo Piatto" },
  { key: "contorno", label: "Contorno" },
  { key: "aggiuntivo", label: "Piatto Aggiunto" },
  { key: "richieste", label: "Piatto Richiesto" },
  { key: "dessert", label: "Dessert" },
];

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
  const [userAllergens, setUserAllergens] = useState<string[]>([]);
  const [filterByAllergens, setFilterByAllergens] = useState(false);

  useEffect(() => { loadMenusAndOrders(); }, []);

  const loadMenusAndOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, canteen_id, full_name, employee_number, badge_code")
        .eq("id", user.id)
        .maybeSingle();
      if (!profile?.canteen_id) return;
      setUserProfile(profile);

      const { data: allergensData } = await supabase
        .from("user_allergens").select("allergen_id").eq("user_id", user.id);
      setUserAllergens(allergensData?.map(a => a.allergen_id) || []);

      const { data: canteen } = await supabase
        .from("canteens").select("name, code").eq("id", profile.canteen_id).maybeSingle();
      setCanteenInfo(canteen);

      const today = new Date().toISOString().split("T")[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
      await loadMenuAndOrder(today, profile.canteen_id, user.id, true);
      await loadMenuAndOrder(tomorrow, profile.canteen_id, user.id, false);

      const now = new Date();
      setCanOrder(now.getHours() * 60 + now.getMinutes() < 16 * 60);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setLoading(false);
    }
  };

  const loadMenuAndOrder = async (date: string, canteenId: string, userId: string, isToday: boolean) => {
    const { data: menu } = await supabase
      .from("daily_menus")
      .select("id, menu_date, meal_type, order_deadline")
      .eq("canteen_id", canteenId).eq("menu_date", date).eq("meal_type", "lunch")
      .maybeSingle();
    if (!menu) {
      if (isToday) setTodayMenu(null); else setTomorrowMenu(null);
      return;
    }
    const { data: menuDishes } = await supabase
      .from("menu_dishes").select("dish_id").eq("menu_id", menu.id);
    if (!menuDishes || menuDishes.length === 0) {
      const empty = { ...menu, dishes: [] };
      if (isToday) setTodayMenu(empty); else setTomorrowMenu(empty);
      return;
    }
    const dishIds = menuDishes.map(md => md.dish_id);
    const { data: dishes } = await supabase.from("dishes").select("*").in("id", dishIds);
    const dishesWithAllergens = await Promise.all((dishes || []).map(async (dish) => {
      const { data: da } = await supabase
        .from("dish_allergens")
        .select(`allergens ( id, name, icon )`).eq("dish_id", dish.id);
      return { ...dish, allergens: da?.map(x => x.allergens).filter(Boolean) || [] };
    }));
    const menuWithDishes = { ...menu, dishes: dishesWithAllergens };
    if (isToday) {
      setTodayMenu(menuWithDishes);
      const { data: order } = await supabase
        .from("meal_orders").select("*").eq("user_id", userId).eq("menu_id", menu.id).maybeSingle();
      setTodayOrder(order);
    } else {
      setTomorrowMenu(menuWithDishes);
      const { data: existingOrder } = await supabase
        .from("meal_orders").select("*").eq("user_id", userId).eq("menu_id", menu.id).maybeSingle();
      if (existingOrder) {
        setSelectedDishes(existingOrder.selected_dishes);
        setIsTakeaway(existingOrder.is_takeaway || false);
        setTakeawayTime(existingOrder.takeaway_time || "12:30");
        setNotes(existingOrder.notes || "");
        setFeedback(existingOrder.feedback || "");
      }
    }
  };

  const handleSubmitOrder = async () => {
    if (selectedDishes.length === 0) { toast.error("Seleziona almeno un piatto"); return; }
    if (!tomorrowMenu) { toast.error("Menu di domani non disponibile"); return; }
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
      const { error } = await supabase.from("meal_orders").upsert(orderData, { onConflict: "user_id,menu_id" });
      if (error) throw error;
      toast.success("Ordine salvato con successo!");
      loadMenusAndOrders();
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Errore nel salvare l'ordine");
    }
  };

  const groupDishesByCategory = (dishes: Dish[]) => {
    const grouped: { [k: string]: Dish[] } = {};
    dishes.forEach(d => { (grouped[d.category] ||= []).push(d); });
    return grouped;
  };

  const dishHasUserAllergens = (dish: Dish) =>
    !!dish.allergens?.some(a => userAllergens.includes(a.id));

  const getFilteredDishes = (dishes: Dish[]) =>
    !filterByAllergens || userAllergens.length === 0 ? dishes : dishes.filter(d => !dishHasUserAllergens(d));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Caricamento...</div>
      </div>
    );
  }

  const tomorrowByCat = tomorrowMenu ? groupDishesByCategory(tomorrowMenu.dishes) : {};
  const todayByCat = todayMenu ? groupDishesByCategory(todayMenu.dishes) : {};

  const getSelectedDishForCategory = (key: string) => {
    if (!tomorrowMenu) return null;
    const list = tomorrowByCat[key] || [];
    return list.find(d => selectedDishes.includes(d.id)) || null;
  };

  const handlePickDishForCategory = (key: string, dishId: string) => {
    const list = tomorrowByCat[key] || [];
    const others = selectedDishes.filter(id => !list.some(d => d.id === id));
    setSelectedDishes([...others, dishId]);
  };

  const handleClearCategory = (key: string) => {
    const list = tomorrowByCat[key] || [];
    setSelectedDishes(selectedDishes.filter(id => !list.some(d => d.id === id)));
  };

  const initials = (userProfile?.full_name || "ID")
    .split(" ").map((p: string) => p[0]).slice(0, 2).join("").toUpperCase();
  const now = new Date();
  const dateStr = now.toLocaleDateString("it-IT");
  const timeStr = now.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-md mx-auto pb-8">
      <div className="bg-green-600 text-white rounded-t-2xl p-4 flex items-center gap-3 shadow-medium">
        <div className="w-12 h-12 rounded-full border-2 border-white flex items-center justify-center font-bold">
          {initials}
        </div>
        <div className="font-bold tracking-wide text-lg">APP MONITOR DIPENDENTE</div>
      </div>

      <div className="bg-card rounded-b-2xl shadow-medium border border-t-0 p-4 space-y-4">
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-auto">
            <TabsTrigger value="saved" className="text-xs sm:text-sm py-2 whitespace-normal">
              1. Ordine del Giorno Salvato
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="text-xs sm:text-sm py-2 whitespace-normal data-[state=active]:bg-green-600 data-[state=active]:text-white"
            >
              2. Inserisci Nuovo Ordine
            </TabsTrigger>
          </TabsList>

          <TabsContent value="saved" className="space-y-3 pt-3">
            <h2 className="text-xl font-bold">Ordine del Giorno Salvato</h2>
            {todayMenu && todayOrder ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {new Date(todayMenu.menu_date).toLocaleDateString("it-IT", {
                    weekday: "long", day: "numeric", month: "long",
                  })}
                </p>
                {CATEGORIES.map(({ key, label }) => {
                  const dish = (todayByCat[key] || []).find(d => todayOrder.selected_dishes.includes(d.id));
                  return (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <span className="font-semibold text-sm">{label}</span>
                      <span className={`text-sm ${dish ? "text-green-700 font-medium" : "italic text-muted-foreground"}`}>
                        {dish ? dish.name : "Non selezionato"}
                      </span>
                    </div>
                  );
                })}
                {todayOrder.is_takeaway && (
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-sm font-semibold">
                    Asporto — Ritiro alle {todayOrder.takeaway_time}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nessun ordine salvato per oggi</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="space-y-4 pt-3">
            <h2 className="text-xl font-bold">Nuovo Ordine del Giorno - Selezione</h2>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Data: {dateStr}</span>
              <span>Ora: {timeStr}</span>
            </div>

            {!tomorrowMenu ? (
              <div className="text-center py-10 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Menu di domani non ancora disponibile</p>
                <p className="text-xs mt-2">Lo chef non ha ancora pubblicato il menu</p>
              </div>
            ) : (
              <>
                {!canOrder && (
                  <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-sm font-semibold text-destructive">
                    Termine per gli ordini superato (16:00)
                  </div>
                )}

                {userAllergens.length > 0 && (
                  <div className="flex items-center justify-between p-3 bg-warning/10 border border-warning/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <Label htmlFor="filter-allergens" className="font-semibold cursor-pointer">
                        Solo piatti sicuri per me
                      </Label>
                    </div>
                    <Switch id="filter-allergens" checked={filterByAllergens} onCheckedChange={setFilterByAllergens} />
                  </div>
                )}

                <div className="space-y-2">
                  {CATEGORIES.map(({ key, label }) => {
                    const dishesInCat = getFilteredDishes(tomorrowByCat[key] || []);
                    const selected = getSelectedDishForCategory(key);
                    return (
                      <div key={key} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                        <span className="font-semibold text-sm flex-shrink-0">{label}</span>
                        <div className="flex items-center gap-2 ml-2 flex-1 justify-end">
                          <span className={`text-sm truncate max-w-[120px] ${selected ? "text-green-700 font-medium" : "italic text-muted-foreground"}`}>
                            {selected ? selected.name : "Non selezionato"}
                          </span>
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                size="sm"
                                disabled={!canOrder || dishesInCat.length === 0}
                                className="bg-green-600 hover:bg-green-700 text-white rounded-full h-8 px-3"
                              >
                                Scegli
                                <ChevronRight className="h-3 w-3 ml-1" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] overflow-y-auto">
                              <SheetHeader>
                                <SheetTitle>{label}</SheetTitle>
                              </SheetHeader>
                              <div className="space-y-2 mt-4">
                                {dishesInCat.length === 0 && (
                                  <p className="text-center text-muted-foreground py-6">Nessuna opzione disponibile</p>
                                )}
                                {dishesInCat.map(dish => {
                                  const hasWarning = dishHasUserAllergens(dish);
                                  const isSelected = selected?.id === dish.id;
                                  return (
                                    <button
                                      key={dish.id}
                                      onClick={() => handlePickDishForCategory(key, dish.id)}
                                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                        isSelected ? "bg-green-50 border-green-500"
                                        : hasWarning ? "bg-destructive/5 border-destructive/30"
                                        : "bg-muted/30 hover:bg-muted"
                                      }`}
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">{dish.name}</span>
                                        {isSelected && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                      </div>
                                      {dish.allergens && dish.allergens.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                          {dish.allergens.map(a => (
                                            <Badge
                                              key={a.id}
                                              variant={userAllergens.includes(a.id) ? "destructive" : "secondary"}
                                              className="text-xs"
                                            >
                                              {a.icon && <span className="mr-1">{a.icon}</span>}{a.name}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })}
                                {selected && (
                                  <Button variant="outline" className="w-full mt-2" onClick={() => handleClearCategory(key)}>
                                    Rimuovi selezione
                                  </Button>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2 p-3 border rounded-lg">
                  <Checkbox id="takeaway" checked={isTakeaway} onCheckedChange={(v) => setIsTakeaway(!!v)} disabled={!canOrder} />
                  <Label htmlFor="takeaway" className="font-semibold cursor-pointer">Asporto</Label>
                  {isTakeaway && (
                    <Input
                      type="time" value={takeawayTime}
                      onChange={(e) => setTakeawayTime(e.target.value)}
                      disabled={!canOrder}
                      className="ml-auto w-32"
                    />
                  )}
                </div>

                <Button
                  onClick={handleSubmitOrder} size="lg"
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                  disabled={!canOrder || selectedDishes.length === 0}
                >
                  {canOrder ? "Salva Nuovo Ordine" : "Ordini Chiusi"}
                </Button>

                <Card className="border-2 border-green-200 bg-green-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Menù Selezionato (Anteprima)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedDishes.length === 0 ? (
                      <p className="text-sm italic text-muted-foreground">
                        Seleziona i piatti per visualizzare l'anteprima.
                      </p>
                    ) : (
                      <ul className="space-y-1 text-sm">
                        {CATEGORIES.map(({ key, label }) => {
                          const dish = getSelectedDishForCategory(key);
                          if (!dish) return null;
                          return (
                            <li key={key} className="flex items-start gap-2">
                              <UtensilsCrossed className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span><strong>{label}:</strong> {dish.name}</span>
                            </li>
                          );
                        })}
                        {isTakeaway && (
                          <li className="text-xs italic mt-2">Asporto — ritiro {takeawayTime}</li>
                        )}
                      </ul>
                    )}
                  </CardContent>
                </Card>

                <div className="space-y-1">
                  <Label htmlFor="notes" className="text-xs font-semibold">Note (opzionale)</Label>
                  <Textarea
                    id="notes" placeholder="Richieste particolari..."
                    value={notes} onChange={(e) => setNotes(e.target.value)}
                    disabled={!canOrder} rows={2} className="text-sm"
                  />
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between pt-3 border-t text-xs text-muted-foreground">
          <span className="truncate max-w-[40%]">
            ID Utente: {userProfile?.id?.slice(0, 8) || "—"}...
          </span>
          <span>Monitor v1.0</span>
          <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold">
            {canteenInfo?.code || "SOFTCO"}
          </span>
        </div>
      </div>
    </div>
  );
};
