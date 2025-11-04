import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, X } from "lucide-react";

interface Dish {
  id: string;
  name: string;
  category: string;
}

interface OrderStationProps {
  stationNumber: number;
  menuDishes: Dish[];
  menuId: string;
  canteenCode: string;
}

export const OrderStation = ({ stationNumber, menuDishes, menuId, canteenCode }: OrderStationProps) => {
  const [badgeCode, setBadgeCode] = useState("");
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [isTakeaway, setIsTakeaway] = useState(false);
  const [takeawayTime, setTakeawayTime] = useState("12:30");
  const [userName, setUserName] = useState("");

  const groupedDishes = menuDishes.reduce((acc, dish) => {
    if (!acc[dish.category]) {
      acc[dish.category] = [];
    }
    acc[dish.category].push(dish);
    return acc;
  }, {} as { [key: string]: Dish[] });

  const handleDishToggle = (dishId: string, category: string) => {
    // Allow only one dish per category
    setSelectedDishes(prev => {
      const dishesInCategory = groupedDishes[category].map(d => d.id);
      const filtered = prev.filter(id => !dishesInCategory.includes(id));
      
      if (prev.includes(dishId)) {
        return filtered;
      } else {
        return [...filtered, dishId];
      }
    });
  };

  const handleSaveOrder = async () => {
    if (!badgeCode.trim()) {
      toast.error(`Stazione ${stationNumber}: Inserisci badge`);
      return;
    }

    if (selectedDishes.length === 0) {
      toast.error(`Stazione ${stationNumber}: Seleziona almeno un piatto`);
      return;
    }

    try {
      // Find user by badge
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("badge_code", badgeCode)
        .single();

      if (!profile) {
        toast.error(`Stazione ${stationNumber}: Badge non trovato`);
        return;
      }

      // Save order
      const { error } = await supabase
        .from("meal_orders")
        .upsert({
          user_id: profile.id,
          menu_id: menuId,
          selected_dishes: selectedDishes,
          is_takeaway: isTakeaway,
          takeaway_time: isTakeaway ? takeawayTime : null,
        }, {
          onConflict: "user_id,menu_id",
        });

      if (error) throw error;

      toast.success(`Stazione ${stationNumber}: Ordine salvato per ${profile.full_name}`);
      
      // Reset form
      setBadgeCode("");
      setSelectedDishes([]);
      setIsTakeaway(false);
      setTakeawayTime("12:30");
      setUserName("");
    } catch (error) {
      console.error(error);
      toast.error(`Stazione ${stationNumber}: Errore nel salvare l'ordine`);
    }
  };

  const handleClear = () => {
    setBadgeCode("");
    setSelectedDishes([]);
    setIsTakeaway(false);
    setTakeawayTime("12:30");
    setUserName("");
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

  return (
    <Card className="shadow-lg border-2">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-3 rounded-lg text-center">
            <h3 className="text-xl font-bold">STAZIONE {stationNumber}</h3>
            <p className="text-sm">{canteenCode}</p>
          </div>

          {/* Badge Input */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Badge Dipendente</Label>
            <Input
              value={badgeCode}
              onChange={(e) => setBadgeCode(e.target.value)}
              placeholder="Scansiona badge..."
              className="text-lg h-12"
              onKeyDown={(e) => e.key === "Enter" && handleSaveOrder()}
            />
          </div>

          {/* Dish Selection */}
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {Object.entries(groupedDishes).map(([category, dishes]) => (
              <div key={category} className="space-y-2">
                <Label className="text-sm font-bold text-primary">
                  {getCategoryLabel(category)}
                </Label>
                <div className="space-y-1">
                  {dishes.map((dish) => (
                    <div
                      key={dish.id}
                      className="flex items-center gap-2 p-2 bg-muted/50 rounded hover:bg-muted transition-colors"
                    >
                      <Checkbox
                        id={`${stationNumber}-${dish.id}`}
                        checked={selectedDishes.includes(dish.id)}
                        onCheckedChange={() => handleDishToggle(dish.id, category)}
                      />
                      <Label
                        htmlFor={`${stationNumber}-${dish.id}`}
                        className="flex-1 text-sm cursor-pointer"
                      >
                        {dish.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Takeaway */}
          <div className="space-y-2 p-3 border border-border rounded-lg">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`takeaway-${stationNumber}`}
                checked={isTakeaway}
                onCheckedChange={(checked) => setIsTakeaway(checked as boolean)}
              />
              <Label htmlFor={`takeaway-${stationNumber}`} className="font-semibold cursor-pointer">
                Asporto
              </Label>
            </div>
            {isTakeaway && (
              <Input
                type="time"
                value={takeawayTime}
                onChange={(e) => setTakeawayTime(e.target.value)}
                className="h-10"
              />
            )}
          </div>

          {/* Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleClear}
              variant="outline"
              size="lg"
              className="w-full"
            >
              <X className="mr-2 h-4 w-4" />
              Annulla
            </Button>
            <Button
              onClick={handleSaveOrder}
              size="lg"
              className="w-full"
              disabled={!badgeCode.trim() || selectedDishes.length === 0}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Salva
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
