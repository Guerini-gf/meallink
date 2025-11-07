import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Trash2, List, Printer, PlusCircle, X } from "lucide-react";

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
  const [allergens, setAllergens] = useState<{ id: string; name: string; icon: string | null }[]>([]);
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);

  useEffect(() => {
    loadAllergens();
  }, []);

  const loadAllergens = async () => {
    try {
      const { data, error } = await supabase
        .from("allergens")
        .select("*")
        .order("name");
      
      if (error) throw error;
      setAllergens(data || []);
    } catch (error) {
      console.error("Errore caricamento allergie:", error);
    }
  };

  const toggleAllergen = (allergenId: string) => {
    setSelectedAllergens(prev =>
      prev.includes(allergenId)
        ? prev.filter(id => id !== allergenId)
        : [...prev, allergenId]
    );
  };

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
      const { data: dish, error: dishError } = await supabase
        .from("dishes")
        .insert({
          canteen_id: canteenId,
          name: dishName.trim(),
          category: category,
          variant: variant.trim() || null,
          available_for_takeaway: availableForTakeaway,
          takeaway_available_from: availableForTakeaway ? takeawayFrom : null,
          takeaway_available_until: availableForTakeaway ? takeawayUntil : null,
        })
        .select()
        .single();

      if (dishError) throw dishError;

      // Insert allergens
      if (selectedAllergens.length > 0 && dish) {
        const allergenInserts = selectedAllergens.map(allergenId => ({
          dish_id: dish.id,
          allergen_id: allergenId,
        }));

        const { error: allergenError } = await supabase
          .from("dish_allergens")
          .insert(allergenInserts);

        if (allergenError) throw allergenError;
      }

      toast.success("Piatto salvato nella libreria!");
      setDishName("");
      setVariant("");
      setAvailableForTakeaway(true);
      setTakeawayFrom("11:00");
      setTakeawayUntil("14:00");
      setSelectedAllergens([]);
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
    setSelectedAllergens([]);
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

  const handlePrintList = async () => {
    if (!canteenId) {
      toast.error("Nessuna mensa associata");
      return;
    }

    try {
      const { data: dishes } = await supabase
        .from('dishes')
        .select('name, category')
        .eq('canteen_id', canteenId)
        .order('category')
        .order('name');

      if (!dishes || dishes.length === 0) {
        toast.error("Nessun piatto da stampare");
        return;
      }

      // Create print content
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error("Impossibile aprire la finestra di stampa");
        return;
      }

      const groupedDishes = dishes.reduce((acc, dish) => {
        if (!acc[dish.category]) {
          acc[dish.category] = [];
        }
        acc[dish.category].push(dish.name);
        return acc;
      }, {} as Record<string, string[]>);

      let printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Lista Piatti</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            h2 { color: #666; margin-top: 20px; border-bottom: 2px solid #333; }
            ul { list-style: none; padding: 0; }
            li { padding: 5px 0; border-bottom: 1px solid #eee; }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <h1>SOFTTHECHEFS - Lista Piatti</h1>
          <p style="text-align: center;">Data: ${new Date().toLocaleDateString('it-IT')}</p>
      `;

      Object.entries(groupedDishes).forEach(([category, dishNames]) => {
        printContent += `<h2>${category}</h2><ul>`;
        dishNames.forEach(name => {
          printContent += `<li>${name}</li>`;
        });
        printContent += `</ul>`;
      });

      printContent += `
          <p style="margin-top: 30px; text-align: center; color: #666;">
            Totale piatti: ${dishes.length}
          </p>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error: any) {
      console.error('Print error:', error);
      toast.error("Errore durante la stampa");
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

        {/* Allergens Section */}
        <div className="space-y-3 p-4 bg-muted/30 rounded-lg border border-border">
          <div className="space-y-1">
            <Label className="text-base font-semibold">
              Allergie e Intolleranze
            </Label>
            <p className="text-sm text-muted-foreground">
              Seleziona gli allergeni presenti in questo piatto
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {allergens.map((allergen) => {
              const isSelected = selectedAllergens.includes(allergen.id);
              return (
                <Badge
                  key={allergen.id}
                  variant={isSelected ? "default" : "outline"}
                  className="cursor-pointer text-sm py-1.5 px-3 hover:opacity-80 transition-opacity"
                  onClick={() => toggleAllergen(allergen.id)}
                >
                  {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                  {allergen.name}
                  {isSelected && <X className="ml-1 h-3 w-3" />}
                </Badge>
              );
            })}
          </div>
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
