import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { X } from "lucide-react";

interface Allergen {
  id: string;
  name: string;
  icon: string | null;
}

interface UserAllergen {
  id: string;
  allergen_id: string;
  allergens: Allergen;
}

export function AllergenManager() {
  const [allergens, setAllergens] = useState<Allergen[]>([]);
  const [userAllergens, setUserAllergens] = useState<UserAllergen[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load all allergens
      const { data: allergensData, error: allergensError } = await supabase
        .from("allergens")
        .select("*")
        .order("name");

      if (allergensError) throw allergensError;

      // Load user's allergens
      const { data: userAllergensData, error: userAllergensError } = await supabase
        .from("user_allergens")
        .select(`
          id,
          allergen_id,
          allergens (
            id,
            name,
            icon
          )
        `)
        .eq("user_id", user.id);

      if (userAllergensError) throw userAllergensError;

      setAllergens(allergensData || []);
      setUserAllergens(userAllergensData || []);
    } catch (error) {
      console.error("Errore caricamento allergie:", error);
      toast.error("Errore nel caricamento delle allergie");
    } finally {
      setLoading(false);
    }
  };

  const toggleAllergen = async (allergenId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const existing = userAllergens.find(ua => ua.allergen_id === allergenId);

    try {
      if (existing) {
        // Remove allergen
        const { error } = await supabase
          .from("user_allergens")
          .delete()
          .eq("id", existing.id);

        if (error) throw error;
        toast.success("Allergia rimossa");
      } else {
        // Add allergen
        const { error } = await supabase
          .from("user_allergens")
          .insert({ user_id: user.id, allergen_id: allergenId });

        if (error) throw error;
        toast.success("Allergia aggiunta");
      }

      await loadData();
    } catch (error) {
      console.error("Errore gestione allergia:", error);
      toast.error("Errore nell'aggiornamento");
    }
  };

  const isSelected = (allergenId: string) => {
    return userAllergens.some(ua => ua.allergen_id === allergenId);
  };

  if (loading) {
    return <div>Caricamento...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Le Mie Allergie e Intolleranze</CardTitle>
        <CardDescription>
          Seleziona le tue allergie per filtrare i piatti adatti a te
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {allergens.map((allergen) => {
            const selected = isSelected(allergen.id);
            return (
              <Badge
                key={allergen.id}
                variant={selected ? "default" : "outline"}
                className="cursor-pointer text-base py-2 px-3 hover:opacity-80 transition-opacity"
                onClick={() => toggleAllergen(allergen.id)}
              >
                {allergen.icon && <span className="mr-1">{allergen.icon}</span>}
                {allergen.name}
                {selected && <X className="ml-1 h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
