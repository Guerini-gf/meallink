import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building2, MessageSquare, Users } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Lead {
  id: string;
  full_name: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  created_at: string;
}

export const InvestorLeads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      const { data, error } = await supabase
        .from("investor_leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) setLeads(data);
      setLoading(false);
    };
    fetchLeads();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-muted-foreground">Caricamento lead...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Lead Investitori</h2>
          <p className="text-muted-foreground">Contatti raccolti dalla landing page</p>
        </div>
        <Badge variant="secondary" className="text-base px-4 py-1">
          <Users className="h-4 w-4 mr-2" />
          {leads.length} lead
        </Badge>
      </div>

      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nessun lead ricevuto ancora. I contatti appariranno qui quando qualcuno compilerà il form sulla landing page.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {leads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{lead.full_name}</CardTitle>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(lead.created_at), "d MMM yyyy, HH:mm", { locale: it })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <a href={`tel:${lead.phone}`} className="hover:underline">{lead.phone}</a>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Building2 className="h-4 w-4 shrink-0" />
                    <span>{lead.company}</span>
                  </div>
                )}
                {lead.message && (
                  <div className="flex items-start gap-2 text-muted-foreground pt-2 border-t">
                    <MessageSquare className="h-4 w-4 shrink-0 mt-0.5" />
                    <p className="text-foreground">{lead.message}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
