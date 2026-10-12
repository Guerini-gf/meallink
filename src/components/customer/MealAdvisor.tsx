import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

interface Dish { id: string; name: string; category: string; allergens?: { name: string }[] }

export const MealAdvisor = ({ dishes }: { dishes: Dish[] }) => {
  const [needs, setNeeds] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const ask = async () => {
    setError(""); setResult("");
    if (!navigator.onLine) { setError("Serve la connessione per i consigli AI."); return; }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("meal-recommendations", {
      body: {
        needs,
        dishes: dishes.map(d => ({ name: d.name, category: d.category, allergens: d.allergens?.map(a => a.name) || [] })),
      },
    });
    setLoading(false);
    if (error) {
      let msg = "Errore nel generare i suggerimenti";
      try { msg = (await (error as any).context?.json())?.error || msg; } catch { /* ignore */ }
      setError(msg);
      return;
    }
    if (data?.error) setError(data.error); else setResult(data?.recommendation || "");
  };

  return (
    <div className="rounded-lg border p-3 space-y-2 bg-muted/30">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Sparkles className="h-4 w-4 text-primary" /> Consigli AI per le tue esigenze
      </div>
      <Textarea
        value={needs}
        onChange={e => setNeeds(e.target.value.slice(0, 1000))}
        placeholder="Es. vegetariano, senza glutine, poche calorie…"
        rows={2}
      />
      <Button size="sm" onClick={ask} disabled={loading || !needs.trim() || dishes.length === 0} className="w-full">
        {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sto pensando…</> : "Suggeriscimi i piatti"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {result && <div className="text-sm whitespace-pre-wrap rounded-md bg-card border p-3">{result}</div>}
      <p className="text-xs text-muted-foreground">Suggerimenti generati con Lovable AI: in caso di allergie gravi verifica sempre con lo chef.</p>
    </div>
  );
};
