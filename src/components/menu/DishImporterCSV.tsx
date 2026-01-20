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
    
    // Validate row count (max 2000 rows for dishes)
    const MAX_ROWS = 2000;
    if (lines.length > MAX_ROWS) {
      throw new Error(`Troppi record nel file (max ${MAX_ROWS})`);
    }
    
    let currentCategory = '';
    const MAX_NAME_LENGTH = 200;
    const MAX_VARIANT_LENGTH = 100;
    
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
          
          // Validate field lengths
          if (name.length > MAX_NAME_LENGTH) {
            name = name.substring(0, MAX_NAME_LENGTH);
          }
          if (variant.length > MAX_VARIANT_LENGTH) {
            variant = variant.substring(0, MAX_VARIANT_LENGTH);
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
      
      // Validate response
      if (!response.ok) {
        throw new Error("Impossibile caricare il file CSV");
      }
      
      // Check content length (max 5MB)
      const contentLength = response.headers.get('content-length');
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error("File troppo grande (max 5MB)");
      }
      
      const csvText = await response.text();
      
      // Additional size check after reading
      if (csvText.length > MAX_FILE_SIZE) {
        throw new Error("File troppo grande (max 5MB)");
      }
      
      // Parse dishes from CSV (includes row count validation)
      const dishes = parseCSVData(csvText);
      
      if (dishes.length === 0) {
        toast.error("Nessun piatto trovato nel file CSV");
        setLoading(false);
        return;
      }

      // Limit batch size (max 500 dishes per insert)
      const MAX_BATCH_SIZE = 500;
      if (dishes.length > MAX_BATCH_SIZE) {
        toast.warning(`Verranno importati solo i primi ${MAX_BATCH_SIZE} piatti`);
      }
      
      const dishesToInsert = dishes.slice(0, MAX_BATCH_SIZE);

      // Insert dishes into database
      const dishesWithCanteen = dishesToInsert.map(dish => ({
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

      toast.success(`${dishesToInsert.length} piatti importati con successo!`);
      onImportComplete();
    } catch (error: any) {
      toast.error("Errore durante l'importazione: " + (error.message || "Errore sconosciuto"));
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
