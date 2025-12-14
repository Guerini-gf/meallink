import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Upload, Trash2, UserCheck, UserX } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PendingEmployee {
  id: string;
  full_name: string;
  badge_code: string;
  employee_number: string | null;
  created_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
}

export const EmployeeManager = () => {
  const [employees, setEmployees] = useState<PendingEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("");
  const [badgeCode, setBadgeCode] = useState("");
  const [employeeNumber, setEmployeeNumber] = useState("");
  const [adding, setAdding] = useState(false);
  const [canteenId, setCanteenId] = useState<string | null>(null);

  useEffect(() => {
    fetchCanteenAndEmployees();
  }, []);

  const fetchCanteenAndEmployees = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('canteen_id')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.canteen_id) {
        setCanteenId(profile.canteen_id);
        await fetchEmployees(profile.canteen_id);
      }
    } catch (error: any) {
      toast.error("Errore nel caricamento dei dipendenti");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async (canteenId: string) => {
    const { data, error } = await supabase
      .from('pending_employees')
      .select('*')
      .eq('canteen_id', canteenId)
      .order('full_name');

    if (error) {
      toast.error("Errore nel caricamento dipendenti");
      return;
    }

    setEmployees(data || []);
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canteenId) {
      toast.error("Mensa non configurata");
      return;
    }

    setAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('pending_employees')
        .insert({
          canteen_id: canteenId,
          full_name: fullName.trim(),
          badge_code: badgeCode.trim().toUpperCase(),
          employee_number: employeeNumber.trim() || null,
          created_by: user?.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error("Badge già registrato");
        } else {
          throw error;
        }
        return;
      }

      toast.success("Dipendente aggiunto");
      setFullName("");
      setBadgeCode("");
      setEmployeeNumber("");
      await fetchEmployees(canteenId);
    } catch (error: any) {
      toast.error(error.message || "Errore nell'aggiunta");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!canteenId) return;
    
    const { error } = await supabase
      .from('pending_employees')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error("Errore nell'eliminazione");
      return;
    }

    toast.success("Dipendente rimosso");
    await fetchEmployees(canteenId);
  };

  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canteenId) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('nome') || 
                           lines[0].toLowerCase().includes('badge') ? 1 : 0;

        const { data: { user } } = await supabase.auth.getUser();
        const employees: { 
          canteen_id: string; 
          full_name: string; 
          badge_code: string; 
          employee_number: string | null;
          created_by: string | undefined;
        }[] = [];

        for (let i = startIndex; i < lines.length; i++) {
          const parts = lines[i].split(/[,;]/).map(p => p.trim().replace(/"/g, ''));
          if (parts.length >= 2) {
            employees.push({
              canteen_id: canteenId,
              full_name: parts[0],
              badge_code: parts[1].toUpperCase(),
              employee_number: parts[2] || null,
              created_by: user?.id,
            });
          }
        }

        if (employees.length === 0) {
          toast.error("Nessun dipendente valido nel file");
          return;
        }

        const { error } = await supabase
          .from('pending_employees')
          .upsert(employees, { onConflict: 'canteen_id,badge_code' });

        if (error) throw error;

        toast.success(`${employees.length} dipendenti importati`);
        await fetchEmployees(canteenId);
      } catch (error: any) {
        toast.error("Errore nell'importazione CSV");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>;
  }

  const pendingEmployees = employees.filter(e => !e.claimed_by);
  const registeredEmployees = employees.filter(e => e.claimed_by);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Aggiungi Dipendente
          </CardTitle>
          <CardDescription>
            Inserisci manualmente o importa da CSV (formato: Nome,Badge,Matricola)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <form onSubmit={handleAddEmployee} className="flex flex-wrap gap-4 items-end">
              <div className="flex-1 min-w-[200px]">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Mario Rossi"
                  required
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label htmlFor="badgeCode">Codice Badge</Label>
                <Input
                  id="badgeCode"
                  value={badgeCode}
                  onChange={(e) => setBadgeCode(e.target.value.toUpperCase())}
                  placeholder="ABC123"
                  required
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <Label htmlFor="employeeNumber">Matricola</Label>
                <Input
                  id="employeeNumber"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  placeholder="12345"
                />
              </div>
              <Button type="submit" disabled={adding}>
                <Plus className="h-4 w-4 mr-2" />
                {adding ? "Aggiunta..." : "Aggiungi"}
              </Button>
            </form>
            
            <div className="flex items-center gap-4 pt-4 border-t">
              <Label htmlFor="csvFile" className="cursor-pointer">
                <div className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors">
                  <Upload className="h-4 w-4" />
                  Importa CSV
                </div>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleCSVImport}
                  className="hidden"
                />
              </Label>
              <span className="text-sm text-muted-foreground">
                Formato: Nome,Badge,Matricola (una riga per dipendente)
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Elenco Dipendenti</CardTitle>
          <CardDescription>
            {pendingEmployees.length} in attesa di registrazione, {registeredEmployees.length} registrati
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <UserX className="h-4 w-4" />
                In Attesa ({pendingEmployees.length})
              </TabsTrigger>
              <TabsTrigger value="registered" className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Registrati ({registeredEmployees.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              {pendingEmployees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun dipendente in attesa di registrazione
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Matricola</TableHead>
                      <TableHead className="w-[100px]">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingEmployees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.badge_code}</TableCell>
                        <TableCell>{emp.employee_number || '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteEmployee(emp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="registered">
              {registeredEmployees.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Nessun dipendente registrato
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Badge</TableHead>
                      <TableHead>Matricola</TableHead>
                      <TableHead>Registrato il</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registeredEmployees.map((emp) => (
                      <TableRow key={emp.id}>
                        <TableCell className="font-medium">{emp.full_name}</TableCell>
                        <TableCell>{emp.badge_code}</TableCell>
                        <TableCell>{emp.employee_number || '-'}</TableCell>
                        <TableCell>
                          {emp.claimed_at ? new Date(emp.claimed_at).toLocaleDateString('it-IT') : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
