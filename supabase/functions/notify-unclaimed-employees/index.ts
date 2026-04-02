import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find unclaimed employees older than 30 days
    const { data: unclaimed, error: unclaimedError } = await supabase
      .from("pending_employees")
      .select("id, full_name, badge_code, canteen_id, created_at")
      .is("claimed_by", null)
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (unclaimedError) {
      throw unclaimedError;
    }

    if (!unclaimed || unclaimed.length === 0) {
      return new Response(
        JSON.stringify({ message: "No unclaimed employees over 30 days" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group by canteen
    const byCanteen: Record<string, typeof unclaimed> = {};
    for (const emp of unclaimed) {
      if (!byCanteen[emp.canteen_id]) {
        byCanteen[emp.canteen_id] = [];
      }
      byCanteen[emp.canteen_id].push(emp);
    }

    const notifications: string[] = [];

    for (const [canteenId, employees] of Object.entries(byCanteen)) {
      // Find chefs for this canteen
      const { data: chefs } = await supabase
        .from("profiles")
        .select("id")
        .eq("canteen_id", canteenId)
        .eq("role", "chef");

      if (!chefs || chefs.length === 0) continue;

      for (const chef of chefs) {
        // Get push subscriptions for chef
        const { data: subs } = await supabase
          .from("push_subscriptions")
          .select("endpoint, p256dh, auth")
          .eq("user_id", chef.id);

        if (subs && subs.length > 0) {
          notifications.push(
            `Chef ${chef.id}: ${employees.length} dipendenti non registrati da 30+ giorni`
          );
          // Push notification sending would go here with web-push library
          // For now we log the intent
        }
      }
    }

    return new Response(
      JSON.stringify({
        message: `Checked ${unclaimed.length} unclaimed employees across ${Object.keys(byCanteen).length} canteens`,
        notifications,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
