import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlusCircle, Save, Trash2 } from "lucide-react";
import { DishCreator } from "./DishCreator";

interface Dish {
  id: string;
  name: string;
  category: string;
  variant?: string | null;
  available_for_takeaway?: boolean | null;
  takeaway_available_from?: string | null;
  takeaway_available_until?: string | null;
}

export const MenuManager = () => {
  const [mealType, setMealType] = useState<"lunch" | "dinner">("lunch");
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDishes, setSelectedDishes] = useState<{ [category: string]: string[] }>({
    primo: ["", "", "", ""],
    secondo: ["", "", "", ""],
    contorno: ["", "", "", ""],
    dessert: ["", "", "", ""],
    aggiuntivo: ["", "", "", ""],
    richieste: ["", "", "", ""],
  });
  const [existingDishes, setExistingDishes] = useState<Dish[]>([]);
  const [canteenId, setCanteenId] = useState<string | null>(null);

  useEffect(() => {
    loadUserCanteen();
  }, []);

  useEffect(() => {
    if (canteenId) {
      loadExistingDishes();
    }
  }, [canteenId]);

  const loadUserCanteen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("canteen_id")
      .eq("id", user.id)
      .single();

    if (profile?.canteen_id) {
      setCanteenId(profile.canteen_id);
    }
  };

  const loadExistingDishes = async () => {
    const { data } = await supabase
      .from("dishes")
      .select("*")
      .eq("canteen_id", canteenId)
      .order("name");

    if (data) {
      setExistingDishes(data);
    }
  };

  const handleDishInput = (category: string, index: number, value: string) => {
    setSelectedDishes((prev) => {
      const newCategoryDishes = [...prev[category]];
      newCategoryDishes[index] = value;
      return { ...prev, [category]: newCategoryDishes };
    });
  };

  const handleAddToMenu = (dishName: string, category: string) => {
    const dishes = selectedDishes[category];
    const emptyIndex = dishes.findIndex(d => !d.trim());
    if (emptyIndex === -1) {
      toast.error(`Massimo 4 ${category} nel menu`);
      return;
    }
    handleDishInput(category, emptyIndex, dishName);
    toast.success("Piatto aggiunto al menu");
  };

  const handleDeleteDish = async (dishId: string) => {
    if (!confirm("Confermi di voler eliminare questo piatto?")) return;
    
    try {
      const { error } = await supabase
        .from("dishes")
        .delete()
        .eq("id", dishId);
      
      if (error) throw error;
      toast.success("Piatto eliminato");
      loadExistingDishes();
    } catch (error) {
      toast.error("Errore nell'eliminare il piatto");
      console.error(error);
    }
  };

  const handlePrintList = () => {
    window.print();
  };

  const handleSaveMenu = async () => {
    if (!canteenId) {
      toast.error("Mensa non trovata");
      return;
    }

    const allDishes = Object.values(selectedDishes).flat().filter((d) => d.trim());
    if (allDishes.length === 0) {
      toast.error("Inserisci almeno un piatto");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utente non autenticato");

      // Create or get menu
      const { data: menu, error: menuError } = await supabase
        .from("daily_menus")
        .upsert({
          canteen_id: canteenId,
          menu_date: menuDate,
          meal_type: mealType,
          created_by: user.id,
        }, {
          onConflict: "canteen_id,menu_date,meal_type",
        })
        .select()
        .single();

      if (menuError) throw menuError;

      // Delete existing menu_dishes for this menu
      await supabase
        .from("menu_dishes")
        .delete()
        .eq("menu_id", menu.id);

      // Add dishes
      for (const [category, dishNames] of Object.entries(selectedDishes)) {
        for (const dishName of dishNames) {
          if (!dishName.trim()) continue;

          // Find or create dish
          let { data: existingDish } = await supabase
            .from("dishes")
            .select("*")
            .eq("canteen_id", canteenId)
            .eq("name", dishName)
            .eq("category", category)
            .maybeSingle();

          let dishId: string;
          if (existingDish) {
            dishId = existingDish.id;
          } else {
            const { data: newDish, error: dishError } = await supabase
              .from("dishes")
              .insert({
                canteen_id: canteenId,
                name: dishName,
                category: category,
              })
              .select()
              .single();

            if (dishError) throw dishError;
            dishId = newDish.id;
          }

          // Link dish to menu
          await supabase
            .from("menu_dishes")
            .insert({
              menu_id: menu.id,
              dish_id: dishId,
            });
        }
      }

      toast.success("Menu salvato con successo!");
      loadExistingDishes();
    } catch (error: any) {
      toast.error("Errore nel salvare il menu");
      console.error(error);
    }
  };

  const categories = [
    { key: "primo", label: "Primi Piatti" },
    { key: "secondo", label: "Secondi Piatti" },
    { key: "contorno", label: "Contorni" },
    { key: "dessert", label: "Dessert" },
    { key: "aggiuntivo", label: "Piatti Aggiuntivi" },
    { key: "richieste", label: "Piatti Richieste" },
  ];

  const groupedDishes = existingDishes.reduce((acc, dish) => {
    if (!acc[dish.category]) {
      acc[dish.category] = [];
    }
    acc[dish.category].push(dish);
    return acc;
  }, {} as { [key: string]: Dish[] });

  return (
    <div className="space-y-6">
      {/* Dish Creator */}
      <DishCreator canteenId={canteenId} onDishCreated={loadExistingDishes} />

      {/* Existing Dishes Library */}
      <Card className="shadow-medium">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl">Libreria Piatti Esistenti ({existingDishes.length} totali)</CardTitle>
          <Button onClick={handlePrintList} variant="outline">
            <Trash2 className="mr-2 h-4 w-4" />
            Stampa Lista
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map(({ key, label }) => (
            <div key={key} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-primary">{label}</h3>
                <span className="text-sm text-muted-foreground">
                  {groupedDishes[key]?.length || 0} piatti
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedDishes[key]?.length > 0 ? (
                  groupedDishes[key].map((dish) => (
                    <div
                      key={dish.id}
                      className="p-3 bg-muted/50 rounded-lg border border-border hover:border-primary transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{dish.name}</p>
                          {dish.variant && (
                            <p className="text-xs text-muted-foreground mt-1 italic">
                              {dish.variant}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => handleAddToMenu(dish.name, key)}
                            title="Aggiungi al menu"
                          >
                            <PlusCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteDish(dish.id)}
                            title="Cancella piatto"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground col-span-full">
                    Nessun piatto disponibile
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Daily Menu Creation */}
      <Card className="shadow-medium">
        <CardHeader>
          <CardTitle className="text-2xl">Gestione Menu Giornaliero</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="menuDate">Data</Label>
              <Input
                id="menuDate"
                type="date"
                value={menuDate}
                onChange={(e) => setMenuDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mealType">Tipo Pasto</Label>
              <Select value={mealType} onValueChange={(value: any) => setMealType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunch">Pranzo</SelectItem>
                  <SelectItem value="dinner">Cena</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            {categories.map(({ key, label }) => (
              <div key={key} className="space-y-3">
                <Label className="text-base font-semibold">
                  {label} (max 4 opzioni)
                </Label>
                <div className="grid gap-2">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="relative">
                      <Input
                        value={selectedDishes[key][index]}
                        onChange={(e) => handleDishInput(key, index, e.target.value)}
                        placeholder={`Opzione ${index + 1}...`}
                        list={`${key}-suggestions`}
                        className="text-base"
                      />
                    </div>
                  ))}
                  <datalist id={`${key}-suggestions`}>
                    {existingDishes
                      .filter((d) => d.category === key)
                      .map((dish) => (
                        <option key={dish.id} value={dish.name} />
                      ))}
                  </datalist>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleSaveMenu} size="lg" className="w-full">
            <Save className="mr-2 h-5 w-5" />
            Salva Menu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
