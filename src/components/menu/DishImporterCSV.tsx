import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Loader2 } from "lucide-react";

interface DishImporterCSVProps {
  canteenId: string | null;
  onImportComplete: () => void;
}

export const DishImporterCSV = ({ canteenId, onImportComplete }: DishImporterCSVProps) => {
  const [loading, setLoading] = useState(false);

  const parseCSVData = (csvText: string) => {
    const dishes: Array<{ name: string; category: string; variant?: string }> = [];
    const lines = csvText.split('\n');
    
    let currentCategory = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and headers
      if (!line || line.startsWith('DATI DA INSERIRE') || line.startsWith('Database Menu')) {
        continue;
      }
      
      // Detect category sections
      if (line.includes('Primi') || line.includes('piatti')) {
        currentCategory = 'Primo';
        continue;
      } else if (line.includes('Secondi') || line.includes('Piatti')) {
        currentCategory = 'Secondo';
        continue;
      } else if (line.includes('Contorni')) {
        currentCategory = 'Contorno';
        continue;
      } else if (line.includes('Verdure') && line.includes('Fresche')) {
        currentCategory = 'Insalata';
        continue;
      } else if (line.includes('Tipi di') && line.includes('Riso')) {
        currentCategory = 'Riso';
        continue;
      }
      
      // Skip sub-headers
      if (line.includes('Pasta') || line.includes('Carne') || line.includes('Pesce') || 
          line.includes('Cotti') || line.includes('Varietà')) {
        continue;
      }
      
      // Parse dish entries (format: "number   dish1   dish2   dish3")
      const parts = line.split(/\s{2,}/);
      
      for (let j = 1; j < parts.length; j++) {
        const dishName = parts[j].trim();
        if (dishName && dishName.length > 2 && !/^\d+$/.test(dishName)) {
          // Detect variants in parentheses
          let name = dishName;
          let variant = '';
          
          const variantMatch = dishName.match(/\(([^)]+)\)/);
          if (variantMatch) {
            variant = variantMatch[1];
            name = dishName.replace(/\s*\([^)]+\)/, '').trim();
          }
          
          dishes.push({
            name,
            category: currentCategory || 'Altro',
            variant: variant || undefined,
          });
        }
      }
    }
    
    return dishes;
  };

  const handleImportFromCSV = async () => {
    if (!canteenId) {
      toast.error("Nessuna mensa associata");
      return;
    }

    setLoading(true);
    try {
      // Fetch the CSV file
      const response = await fetch('/APPLICAZIONE-MENSE-2.csv');
      const csvText = await response.text();
      
      // Parse dishes from CSV
      const dishes = parseCSVData(csvText);
      
      if (dishes.length === 0) {
        toast.error("Nessun piatto trovato nel file CSV");
        setLoading(false);
        return;
      }

      // Insert dishes into database
      const dishesWithCanteen = dishes.map(dish => ({
        ...dish,
        canteen_id: canteenId,
        available_for_takeaway: true,
        takeaway_available_from: '11:00:00',
        takeaway_available_until: '14:00:00',
      }));

      const { error } = await supabase
        .from('dishes')
        .insert(dishesWithCanteen);

      if (error) throw error;

      toast.success(`${dishes.length} piatti importati con successo!`);
      onImportComplete();
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error("Errore durante l'importazione: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importa Piatti da CSV</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={handleImportFromCSV} 
          disabled={loading || !canteenId}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importazione in corso...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Importa Piatti dal Database
            </>
          )}
        </Button>
        <p className="text-sm text-muted-foreground mt-2">
          Importa automaticamente tutti i piatti dal database predefinito
        </p>
      </CardContent>
    </Card>
  );
};
