import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Printer } from "lucide-react";

interface Row {
  order_id: string; full_name: string; badge_code: string;
  delivery_time: string | null; is_takeaway: boolean; dish_names: string[]; notes: string | null;
}

const tomorrow = () => new Date(Date.now() + 86400000).toISOString().split("T")[0];

export const DeliverySchedule = () => {
  const [date, setDate] = useState(tomorrow());
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true); setError("");
      const { data, error } = await supabase.rpc("get_delivery_schedule", { _date: date });
      if (error) setError("Impossibile caricare le consegne"); else setRows((data as Row[]) || []);
      setLoading(false);
    })();
  }, [date]);

  const groups = rows.reduce<Record<string, Row[]>>((acc, r) => {
    const k = r.delivery_time ? r.delivery_time.slice(0, 5) : "Senza orario";
    (acc[k] ||= []).push(r);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" /> Orari di consegna</CardTitle>
        <div className="flex items-center gap-2">
          <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-40" />
          <Button variant="outline" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" />Stampa</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && <p className="text-muted-foreground">Caricamento...</p>}
        {error && <p className="text-destructive">{error}</p>}
        {!loading && !error && rows.length === 0 && <p className="text-muted-foreground">Nessun ordine per questa data.</p>}
        {Object.entries(groups).map(([time, list]) => (
          <div key={time} className="space-y-2">
            <div className="flex items-center gap-2 font-bold text-lg">
              {time} <Badge variant="secondary">{list.length} ordini</Badge>
            </div>
            {list.map(r => (
              <div key={r.order_id} className="p-3 rounded-lg border bg-muted/30 text-sm">
                <div className="flex justify-between font-semibold">
                  <span>{r.full_name}</span>
                  <span className="text-muted-foreground">{r.badge_code}</span>
                </div>
                <div>{r.dish_names.join(" · ")}</div>
                {r.is_takeaway && <Badge className="mt-1">Asporto</Badge>}
                {r.notes && <div className="italic text-muted-foreground mt-1">Note: {r.notes}</div>}
              </div>
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
