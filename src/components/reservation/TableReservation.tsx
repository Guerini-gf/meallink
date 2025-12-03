import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar, Clock, Users, Trash2 } from "lucide-react";

interface Reservation {
  id: string;
  reservation_date: string;
  time_slot: string;
  table_number: number;
  guests: number;
  status: string;
}

const TIME_SLOTS = [
  { value: "12:00-12:30", label: "12:00 - 12:30" },
  { value: "12:30-13:00", label: "12:30 - 13:00" },
  { value: "13:00-13:30", label: "13:00 - 13:30" },
  { value: "13:30-14:00", label: "13:30 - 14:00" },
];

export const TableReservation = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [guests, setGuests] = useState(1);
  const [availableTables, setAvailableTables] = useState<number[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [canteenId, setCanteenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserCanteen();
  }, []);

  useEffect(() => {
    if (canteenId) {
      loadReservations();
    }
  }, [canteenId]);

  useEffect(() => {
    if (canteenId && selectedDate && selectedTimeSlot) {
      loadAvailableTables();
    }
  }, [canteenId, selectedDate, selectedTimeSlot]);

  const loadUserCanteen = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("canteen_id")
      .eq("id", user.id)
      .single();

    if (profile?.canteen_id) {
      setCanteenId(profile.canteen_id);
    }
  };

  const loadReservations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("table_reservations")
      .select("*")
      .eq("user_id", user.id)
      .gte("reservation_date", new Date().toISOString().split("T")[0])
      .order("reservation_date", { ascending: true });

    if (error) {
      console.error("Error loading reservations:", error);
      return;
    }

    setReservations(data || []);
  };

  const loadAvailableTables = async () => {
    if (!canteenId || !selectedDate || !selectedTimeSlot) return;

    // Get canteen info for total tables
    const { data: canteen } = await supabase
      .from("canteens")
      .select("total_tables")
      .eq("id", canteenId)
      .single();

    const totalTables = canteen?.total_tables || 20;

    // Get occupied tables for this slot
    const { data: occupied } = await supabase
      .from("table_reservations")
      .select("table_number")
      .eq("canteen_id", canteenId)
      .eq("reservation_date", selectedDate)
      .eq("time_slot", selectedTimeSlot)
      .eq("status", "confirmed");

    const occupiedTables = new Set(occupied?.map(r => r.table_number) || []);
    const available = [];
    
    for (let i = 1; i <= totalTables; i++) {
      if (!occupiedTables.has(i)) {
        available.push(i);
      }
    }

    setAvailableTables(available);
    setSelectedTable(null);
  };

  const handleReservation = async () => {
    if (!canteenId || !selectedDate || !selectedTimeSlot || !selectedTable) {
      toast.error("Compila tutti i campi");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Devi essere autenticato");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("table_reservations")
        .insert({
          canteen_id: canteenId,
          user_id: user.id,
          reservation_date: selectedDate,
          time_slot: selectedTimeSlot,
          table_number: selectedTable,
          guests: guests,
          status: "confirmed",
        });

      if (error) throw error;

      toast.success("Prenotazione confermata!");
      loadReservations();
      loadAvailableTables();
      setSelectedTable(null);
    } catch (error: any) {
      if (error.code === "23505") {
        toast.error("Questo tavolo è già prenotato");
      } else {
        toast.error("Errore nella prenotazione");
      }
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    if (!confirm("Vuoi cancellare questa prenotazione?")) return;

    try {
      const { error } = await supabase
        .from("table_reservations")
        .update({ status: "cancelled" })
        .eq("id", reservationId);

      if (error) throw error;

      toast.success("Prenotazione cancellata");
      loadReservations();
    } catch (error) {
      toast.error("Errore nella cancellazione");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Reservation Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Prenota il Tuo Tavolo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                min={new Date().toISOString().split("T")[0]}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeSlot">Fascia Oraria</Label>
              <Select value={selectedTimeSlot} onValueChange={setSelectedTimeSlot}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona orario" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((slot) => (
                    <SelectItem key={slot.value} value={slot.value}>
                      {slot.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="guests">Numero Ospiti</Label>
              <Select value={guests.toString()} onValueChange={(v) => setGuests(parseInt(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4].map((n) => (
                    <SelectItem key={n} value={n.toString()}>
                      {n} {n === 1 ? "persona" : "persone"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tavolo Disponibile</Label>
              <Select 
                value={selectedTable?.toString() || ""} 
                onValueChange={(v) => setSelectedTable(parseInt(v))}
                disabled={availableTables.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={
                    !selectedTimeSlot 
                      ? "Seleziona prima l'orario" 
                      : availableTables.length === 0 
                        ? "Nessun tavolo disponibile" 
                        : "Seleziona tavolo"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {availableTables.map((table) => (
                    <SelectItem key={table} value={table.toString()}>
                      Tavolo {table}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedTimeSlot && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {availableTables.length} tavoli disponibili per questa fascia oraria
              </span>
            </div>
          )}

          <Button 
            onClick={handleReservation} 
            disabled={loading || !selectedTable}
            className="w-full"
          >
            {loading ? "Prenotazione in corso..." : "Conferma Prenotazione"}
          </Button>
        </CardContent>
      </Card>

      {/* My Reservations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Le Mie Prenotazioni
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reservations.filter(r => r.status === "confirmed").length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nessuna prenotazione attiva
            </p>
          ) : (
            <div className="space-y-3">
              {reservations
                .filter(r => r.status === "confirmed")
                .map((reservation) => (
                  <div
                    key={reservation.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full">
                        <Calendar className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {new Date(reservation.reservation_date).toLocaleDateString("it-IT", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>{reservation.time_slot}</span>
                          <span>•</span>
                          <span>Tavolo {reservation.table_number}</span>
                          <span>•</span>
                          <Users className="h-3 w-3" />
                          <span>{reservation.guests}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Confermata</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleCancelReservation(reservation.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};