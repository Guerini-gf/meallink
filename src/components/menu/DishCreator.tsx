import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Trash2, List, Printer, PlusCircle } from "lucide-react";

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

  const handleSaveDish = async () => {
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

      toast.success("Piatto salvato nella libreria!");
      setDishName("");
      setVariant("");
      setAvailableForTakeaway(true);
      setTakeawayFrom("11:00");
      setTakeawayUntil("14:00");
      onDishCreated();
    } catch (error: any) {
      toast.error("Errore nel salvare il piatto");
      console.error(error);
    }
  };

  const handleClearForm = () => {
    setDishName("");
    setVariant("");
    setAvailableForTakeaway(true);
    setTakeawayFrom("11:00");
    setTakeawayUntil("14:00");
    toast.info("Modulo pulito");
  };

  const handleVerifyList = async () => {
    if (!canteenId) {
      toast.error("Mensa non trovata");
      return;
    }

    try {
      const { data, count } = await supabase
        .from("dishes")
        .select("*", { count: "exact" })
        .eq("canteen_id", canteenId);
      
      toast.success(`Libreria verificata: ${count} piatti totali`);
    } catch (error) {
      toast.error("Errore nella verifica");
      console.error(error);
    }
  };

  const handlePrintList = () => {
    window.print();
    toast.success("Lista inviata alla stampante");
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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button onClick={handleSaveDish} size="lg" className="w-full">
            <Save className="mr-2 h-4 w-4" />
            Salva Piatto
          </Button>
          <Button onClick={handleClearForm} variant="outline" size="lg" className="w-full">
            <Trash2 className="mr-2 h-4 w-4" />
            Cancella
          </Button>
          <Button onClick={handleVerifyList} variant="outline" size="lg" className="w-full">
            <List className="mr-2 h-4 w-4" />
            Verifica Lista
          </Button>
          <Button onClick={handlePrintList} variant="outline" size="lg" className="w-full">
            <Printer className="mr-2 h-4 w-4" />
            Stampa Lista
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
