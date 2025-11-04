import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";

interface DishCreatorProps {
  canteenId: string | null;
  onDishCreated: () => void;
}

export const DishCreator = ({ canteenId, onDishCreated }: DishCreatorProps) => {
  const [dishName, setDishName] = useState("");
  const [category, setCategory] = useState("primo");
  const [variant, setVariant] = useState("");
  const [availableForTakeaway, setAvailableForTakeaway] = useState(true);
  const [takeawayFrom, setTakeawayFrom] = useState("11:00");
  const [takeawayUntil, setTakeawayUntil] = useState("14:00");

  const handleCreateDish = async () => {
    if (!canteenId) {
      toast.error("Mensa non trovata");
      return;
    }

    if (!dishName.trim()) {
      toast.error("Inserisci il nome del piatto");
      return;
    }

    try {
      const { error } = await supabase.from("dishes").insert({
        canteen_id: canteenId,
        name: dishName.trim(),
        category: category,
        variant: variant.trim() || null,
        available_for_takeaway: availableForTakeaway,
        takeaway_available_from: availableForTakeaway ? takeawayFrom : null,
        takeaway_available_until: availableForTakeaway ? takeawayUntil : null,
      });

      if (error) throw error;

      toast.success("Piatto aggiunto con successo!");
      setDishName("");
      setVariant("");
      setAvailableForTakeaway(true);
      setTakeawayFrom("11:00");
      setTakeawayUntil("14:00");
      onDishCreated();
    } catch (error: any) {
      toast.error("Errore nell'aggiungere il piatto");
      console.error(error);
    }
  };

  const categories = [
    { value: "primo", label: "Primo Piatto" },
    { value: "secondo", label: "Secondo Piatto" },
    { value: "contorno", label: "Contorno" },
    { value: "dessert", label: "Dessert" },
    { value: "aggiuntivo", label: "Piatto Aggiuntivo" },
    { value: "richieste", label: "Piatto Richieste" },
  ];

  return (
    <Card className="shadow-medium border-2 border-primary/30">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <PlusCircle className="h-6 w-6" />
          Aggiungi Nuovo Piatto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="dish-name" className="text-base font-semibold">
            Nome Piatto
          </Label>
          <Input
            id="dish-name"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            placeholder="Es: Spaghetti al Pomodoro"
            className="text-lg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category" className="text-base font-semibold">
            Categoria
          </Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="variant" className="text-base font-semibold">
            Variante (opzionale)
          </Label>
          <Input
            id="variant"
            value={variant}
            onChange={(e) => setVariant(e.target.value)}
            placeholder="Es: Opzione pesce, Burro e salvia, Senza glutine"
            className="text-lg"
          />
          <p className="text-sm text-muted-foreground">
            Aggiungi note o varianti come "Opzione pesce", "Opzione brodo", ecc.
          </p>
        </div>

        <div className="space-y-4 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="takeaway" className="text-base font-semibold">
                Disponibile per Asporto
              </Label>
              <p className="text-sm text-muted-foreground">
                Indica se questo piatto può essere ordinato per asporto
              </p>
            </div>
            <Switch
              id="takeaway"
              checked={availableForTakeaway}
              onCheckedChange={setAvailableForTakeaway}
            />
          </div>

          {availableForTakeaway && (
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="takeaway-from" className="text-sm font-semibold">
                  Dalle
                </Label>
                <Input
                  id="takeaway-from"
                  type="time"
                  value={takeawayFrom}
                  onChange={(e) => setTakeawayFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="takeaway-until" className="text-sm font-semibold">
                  Alle
                </Label>
                <Input
                  id="takeaway-until"
                  type="time"
                  value={takeawayUntil}
                  onChange={(e) => setTakeawayUntil(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleCreateDish} size="lg" className="w-full">
          <PlusCircle className="mr-2 h-5 w-5" />
          Aggiungi Piatto
        </Button>
      </CardContent>
    </Card>
  );
};
