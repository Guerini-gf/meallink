import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Download } from "lucide-react";

interface DishImporterProps {
  canteenId: string | null;
  onImportComplete: () => void;
}

export const DishImporter = ({ canteenId, onImportComplete }: DishImporterProps) => {
  const parseCsvData = (csvText: string) => {
    const lines = csvText.split("\n");
    const dishes: Array<{ name: string; category: string; variant?: string }> = [];

    // Parse Primi Piatti (lines 13-53)
    for (let i = 12; i < 53; i++) {
      const line = lines[i]?.trim();
      if (!line || line.startsWith('"1.') || line.startsWith('"2.')) continue;

      const parts = line.replace(/^"|"$/g, "").split(/\s{2,}/);
      
      // Pasta column
      if (parts[1] && parts[1].trim() && !parts[1].match(/^\d+$/)) {
        dishes.push({ name: parts[1].trim(), category: "primo", variant: "Pasta" });
      }
      // Zuppe & Risotti column
      if (parts[2] && parts[2].trim() && !parts[2].match(/^\d+$/)) {
        dishes.push({ name: parts[2].trim(), category: "primo", variant: "Zuppe/Risotti" });
      }
      // Vegetariano/Altro column
      if (parts[3] && parts[3].trim() && !parts[3].match(/^\d+$/)) {
        dishes.push({ name: parts[3].trim(), category: "primo", variant: "Vegetariano" });
      }
    }

    // Parse Secondi Piatti (lines 61-87)
    for (let i = 60; i < 87; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const parts = line.replace(/^"|"$/g, "").split(/\s{2,}/);
      
      // Carne column
      if (parts[1] && parts[1].trim() && !parts[1].match(/^\d+$/)) {
        dishes.push({ name: parts[1].trim(), category: "secondo", variant: "Carne" });
      }
      // Pesce column
      if (parts[2] && parts[2].trim() && !parts[2].match(/^\d+$/)) {
        dishes.push({ name: parts[2].trim(), category: "secondo", variant: "Pesce" });
      }
      // Vegetariano/Altro column
      if (parts[3] && parts[3].trim() && !parts[3].match(/^\d+$/)) {
        dishes.push({ name: parts[3].trim(), category: "secondo", variant: "Vegetariano" });
      }
    }

    // Parse Contorni (lines 98-127)
    for (let i = 97; i < 127; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const parts = line.replace(/^"|"$/g, "").split(/\s{2,}/);
      
      // Verdure al Forno / Saltate
      if (parts[1] && parts[1].trim() && !parts[1].match(/^\d+$/)) {
        dishes.push({ name: parts[1].trim(), category: "contorno", variant: "Verdure Cotte" });
      }
      // Legumi & Altro
      if (parts[2] && parts[2].trim() && !parts[2].match(/^\d+$/)) {
        dishes.push({ name: parts[2].trim(), category: "contorno", variant: "Legumi" });
      }
      // Third column
      if (parts[3] && parts[3].trim() && !parts[3].match(/^\d+$/)) {
        dishes.push({ name: parts[3].trim(), category: "contorno", variant: "Altro" });
      }
    }

    // Parse Verdure Fresche/Insalate (lines 136-165)
    for (let i = 135; i < 165; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const parts = line.replace(/^"|"$/g, "").split(/\s{2,}/);
      
      // Insalate Base
      if (parts[1] && parts[1].trim() && !parts[1].match(/^\d+$/)) {
        dishes.push({ name: parts[1].trim(), category: "contorno", variant: "Insalata Base" });
      }
      // Composizioni
      if (parts[2] && parts[2].trim() && !parts[2].match(/^\d+$/)) {
        dishes.push({ name: parts[2].trim(), category: "contorno", variant: "Insalata Composta" });
      }
    }

    // Parse Tipi di Riso (lines 176-195)
    for (let i = 175; i < 195; i++) {
      const line = lines[i]?.trim();
      if (!line) continue;

      const parts = line.replace(/^"|"$/g, "").split(/\s{2,}/);
      
      // Varietà di Riso
      if (parts[1] && parts[1].trim() && !parts[1].match(/^\d+$/)) {
        dishes.push({ name: parts[1].trim(), category: "primo", variant: "Riso" });
      }
      // Applicazioni
      if (parts[2] && parts[2].trim() && !parts[2].match(/^\d+$/)) {
        dishes.push({ name: parts[2].trim(), category: "primo", variant: "Riso Preparato" });
      }
    }

    // Parse Dessert (lines 200-203)
    for (let i = 199; i < 204; i++) {
      const line = lines[i]?.trim();
      if (!line || line.startsWith('"')) continue;
      const dishName = line.replace(/^\d+\s+/, "").trim();
      if (dishName) {
        dishes.push({ name: dishName, category: "dessert" });
      }
    }

    return dishes;
  };

  const handleImportFromCsv = async () => {
    if (!canteenId) {
      toast.error("Mensa non trovata");
      return;
    }

    try {
      const response = await fetch("/APPLICAZIONE-MENSE.csv");
      const csvText = await response.text();
      
      const dishes = parseCsvData(csvText);
      
      toast.info(`Importazione di ${dishes.length} piatti in corso...`);

      let imported = 0;
      let skipped = 0;

      for (const dish of dishes) {
        // Check if dish already exists
        const { data: existing } = await supabase
          .from("dishes")
          .select("id")
          .eq("canteen_id", canteenId)
          .eq("name", dish.name)
          .eq("category", dish.category)
          .maybeSingle();

        if (existing) {
          skipped++;
          continue;
        }

        // Insert new dish
        const { error } = await supabase
          .from("dishes")
          .insert({
            canteen_id: canteenId,
            name: dish.name,
            category: dish.category,
            variant: dish.variant,
            available_for_takeaway: true,
          });

        if (error) {
          console.error("Error inserting:", dish, error);
        } else {
          imported++;
        }
      }

      toast.success(`Importati ${imported} piatti! (${skipped} già presenti)`);
      onImportComplete();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("Errore nell'importazione");
    }
  };

  const handleDownloadTemplate = () => {
    window.open("/APPLICAZIONE-MENSE.csv", "_blank");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Importa Piatti da CSV</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-3">
          <Button onClick={handleImportFromCsv} className="flex-1">
            <Upload className="mr-2 h-4 w-4" />
            Importa da CSV Predefinito
          </Button>
          <Button onClick={handleDownloadTemplate} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Scarica CSV
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Importa tutti i piatti dal file CSV predefinito. I piatti già esistenti verranno saltati.
        </p>
      </CardContent>
    </Card>
  );
};
