import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import logoImage from "@/assets/logo.jpg";
import { signupSchema, loginSchema } from "@/lib/validations";
import { z } from "zod";

type AuthMode = "login" | "signup";
type UserRole = 'customer' | 'chef' | 'operator';

export const AuthForm = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [badgeCode, setBadgeCode] = useState("");
  const [role, setRole] = useState<UserRole>('customer');
  const [canteenCode, setCanteenCode] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [pendingEmployee, setPendingEmployee] = useState<{
    full_name: string;
    employee_number: string | null;
    canteen_id: string;
  } | null>(null);

  // Check if badge is pre-registered when customer enters badge code
  const checkPendingEmployee = async (badge: string) => {
    if (role !== 'customer' || !badge || badge.length < 3) {
      setPendingEmployee(null);
      return;
    }

    const { data } = await supabase
      .from('pending_employees')
      .select('full_name, employee_number, canteen_id, claimed_by')
      .eq('badge_code', badge.toUpperCase())
      .is('claimed_by', null)
      .maybeSingle();

    if (data) {
      setPendingEmployee(data);
      setFullName(data.full_name);
      toast.success(`Badge riconosciuto! Benvenuto ${data.full_name}`);
    } else {
      setPendingEmployee(null);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        // Validate input
        const validatedData = signupSchema.parse({
          email,
          password,
          fullName,
          badgeCode,
          canteenCode: role === 'chef' ? canteenCode : undefined,
        });

        // If role is chef, verify canteen code exists
        if (role === 'chef') {
          if (!canteenCode) {
            toast.error("Inserisci il codice mensa per registrarti come chef");
            setLoading(false);
            return;
          }

          const { data: canteen } = await supabase
            .from('canteens')
            .select('id')
            .eq('canteen_code', validatedData.canteenCode)
            .maybeSingle();

          if (!canteen) {
            toast.error("Codice mensa non valido");
            setLoading(false);
            return;
          }
        }

        // For customers with pre-registered badge, use the canteen from pending_employees
        const signupMetadata: Record<string, string | undefined> = {
          full_name: validatedData.fullName,
          badge_code: validatedData.badgeCode,
          role: role,
          canteen_code: validatedData.canteenCode,
        };

        if (role === 'customer' && pendingEmployee) {
          signupMetadata.canteen_id = pendingEmployee.canteen_id;
          signupMetadata.employee_number = pendingEmployee.employee_number || undefined;
        }

        const { data: signupData, error } = await supabase.auth.signUp({
          email: validatedData.email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: signupMetadata,
          },
        });

        if (error) throw error;

        // Mark the pending employee as claimed
        if (role === 'customer' && pendingEmployee && signupData.user) {
          await supabase
            .from('pending_employees')
            .update({
              claimed_by: signupData.user.id,
              claimed_at: new Date().toISOString(),
            })
            .eq('badge_code', validatedData.badgeCode);
        }

        toast.success("Registrazione completata! Effettua il login.");
        setMode("login");
      } else {
        // Validate login input
        const validatedData = loginSchema.parse({
          email,
          password,
        });

        const { error } = await supabase.auth.signInWithPassword({
          email: validatedData.email,
          password,
        });

        if (error) throw error;
        toast.success("Login effettuato!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          toast.error(err.message);
        });
      } else {
        toast.error(error.message || "Si è verificato un errore");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-primary p-4">
      <Card className="w-full max-w-md shadow-strong">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src={logoImage} 
              alt="SOFTTHECHEFS Logo" 
              className="h-24 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-3xl font-bold">SOFTTHECHEFS</CardTitle>
          <CardDescription className="text-base">
            {mode === "login" ? "Accedi al sistema" : "Crea un nuovo account"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {mode === "signup" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="role">Ruolo</Label>
                  <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona ruolo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Cliente</SelectItem>
                      <SelectItem value="chef">Chef</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nome Completo</Label>
                  <Input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    placeholder="Mario Rossi"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="badgeCode">Codice Badge</Label>
                  <Input
                    id="badgeCode"
                    type="text"
                    value={badgeCode}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setBadgeCode(value);
                      checkPendingEmployee(value);
                    }}
                    required
                    placeholder="ABC123"
                  />
                  {pendingEmployee && role === 'customer' && (
                    <p className="text-sm text-green-600 flex items-center gap-1">
                      ✓ Badge pre-registrato dalla tua azienda
                    </p>
                  )}
                </div>

                {role === 'chef' && (
                  <div className="space-y-2">
                    <Label htmlFor="canteenCode">Codice Mensa</Label>
                    <Input
                      id="canteenCode"
                      type="text"
                      value={canteenCode}
                      onChange={(e) => setCanteenCode(e.target.value.toUpperCase())}
                      required
                      placeholder="MENSA001"
                    />
                    <p className="text-sm text-muted-foreground">
                      Richiedi il codice al responsabile della mensa
                    </p>
                  </div>
                )}
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={8}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Caricamento..." : mode === "login" ? "Accedi" : "Registrati"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="text-sm text-primary hover:underline"
            >
              {mode === "login" ? "Non hai un account? Registrati" : "Hai già un account? Accedi"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
