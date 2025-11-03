import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
      });

      if (error) throw error;

      toast.success("Piatto aggiunto con successo!");
      setDishName("");
      setVariant("");
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

        <Button onClick={handleCreateDish} size="lg" className="w-full">
          <PlusCircle className="mr-2 h-5 w-5" />
          Aggiungi Piatto
        </Button>
      </CardContent>
    </Card>
  );
};
