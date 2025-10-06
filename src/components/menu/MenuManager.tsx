import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlusCircle, Save, Trash2 } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  category: string;
}

export const MenuManager = () => {
  const [mealType, setMealType] = useState<"lunch" | "dinner">("lunch");
  const [menuDate, setMenuDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedDishes, setSelectedDishes] = useState<{ [category: string]: string }>({
    primo: "",
    secondo: "",
    contorno: "",
    dessert: "",
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

  const handleDishInput = (category: string, value: string) => {
    setSelectedDishes((prev) => ({ ...prev, [category]: value }));
  };

  const handleSaveMenu = async () => {
    if (!canteenId) {
      toast.error("Mensa non trovata");
      return;
    }

    const dishValues = Object.values(selectedDishes).filter((d) => d.trim());
    if (dishValues.length === 0) {
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

      // Add dishes
      for (const [category, dishName] of Object.entries(selectedDishes)) {
        if (!dishName.trim()) continue;

        // Create or get dish
        const { data: dish, error: dishError } = await supabase
          .from("dishes")
          .upsert({
            canteen_id: canteenId,
            name: dishName,
            category: category,
          }, {
            onConflict: "canteen_id,name,category",
          })
          .select()
          .single();

        if (dishError) throw dishError;

        // Link dish to menu
        await supabase
          .from("menu_dishes")
          .upsert({
            menu_id: menu.id,
            dish_id: dish.id,
          }, {
            onConflict: "menu_id,dish_id",
          });
      }

      toast.success("Menu salvato con successo!");
      loadExistingDishes();
    } catch (error: any) {
      toast.error("Errore nel salvare il menu");
      console.error(error);
    }
  };

  const categories = [
    { key: "primo", label: "Primo Piatto" },
    { key: "secondo", label: "Secondo Piatto" },
    { key: "contorno", label: "Contorno" },
    { key: "dessert", label: "Dessert" },
  ];

  return (
    <div className="space-y-6">
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

          <div className="space-y-4">
            {categories.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={key} className="text-base font-semibold">
                  {label}
                </Label>
                <div className="relative">
                  <Input
                    id={key}
                    value={selectedDishes[key]}
                    onChange={(e) => handleDishInput(key, e.target.value)}
                    placeholder={`Inserisci ${label.toLowerCase()}...`}
                    list={`${key}-suggestions`}
                    className="text-lg"
                  />
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
