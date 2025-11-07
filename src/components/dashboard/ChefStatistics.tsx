import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, Package, Users, Calendar } from "lucide-react";
import { toast } from "sonner";

interface StatsData {
  todayOrders: number;
  weeklyTrend: number;
  topDishes: Array<{ name: string; count: number }>;
  ordersByCategory: Record<string, number>;
}

export const ChefStatistics = () => {
  const [stats, setStats] = useState<StatsData>({
    todayOrders: 0,
    weeklyTrend: 0,
    topDishes: [],
    ordersByCategory: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get user's canteen
      const { data: profile } = await supabase
        .from('profiles')
        .select('canteen_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile?.canteen_id) return;

      // Get today's orders
      const { data: todayMenus } = await supabase
        .from('daily_menus')
        .select('id')
        .eq('canteen_id', profile.canteen_id)
        .eq('menu_date', today);

      if (todayMenus && todayMenus.length > 0) {
        const { count: todayCount } = await supabase
          .from('meal_orders')
          .select('*', { count: 'exact', head: true })
          .in('menu_id', todayMenus.map(m => m.id));

        // Get weekly orders
        const { data: weekMenus } = await supabase
          .from('daily_menus')
          .select('id')
          .eq('canteen_id', profile.canteen_id)
          .gte('menu_date', weekAgo);

        if (weekMenus && weekMenus.length > 0) {
          const { count: weekCount } = await supabase
            .from('meal_orders')
            .select('*', { count: 'exact', head: true })
            .in('menu_id', weekMenus.map(m => m.id));

          // Get detailed orders for analysis
          const { data: orders } = await supabase
            .from('meal_orders')
            .select('selected_dishes')
            .in('menu_id', weekMenus.map(m => m.id));

          if (orders) {
            // Analyze dishes
            const dishCounts: Record<string, number> = {};
            const categoryCounts: Record<string, number> = {};

            for (const order of orders) {
              for (const dishId of order.selected_dishes) {
                dishCounts[dishId] = (dishCounts[dishId] || 0) + 1;
              }
            }

            // Get dish details
            const dishIds = Object.keys(dishCounts);
            if (dishIds.length > 0) {
              const { data: dishes } = await supabase
                .from('dishes')
                .select('id, name, category')
                .in('id', dishIds);

              if (dishes) {
                // Count by category
                dishes.forEach(dish => {
                  const count = dishCounts[dish.id];
                  categoryCounts[dish.category] = (categoryCounts[dish.category] || 0) + count;
                });

                // Get top 5 dishes
                const topDishes = dishes
                  .map(dish => ({ name: dish.name, count: dishCounts[dish.id] }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);

                setStats({
                  todayOrders: todayCount || 0,
                  weeklyTrend: ((weekCount || 0) / 7) - (todayCount || 0),
                  topDishes,
                  ordersByCategory: categoryCounts,
                });
              }
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Stats error:', error);
      toast.error("Errore nel caricamento delle statistiche");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Caricamento statistiche...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard Statistiche Chef</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordini Oggi</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend Settimanale</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.weeklyTrend > 0 ? '+' : ''}{stats.weeklyTrend.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">vs media giornaliera</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Piatti Unici</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.topDishes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categorie Attive</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(stats.ordersByCategory).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Piatti Più Richiesti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.topDishes.map((dish, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">{index + 1}.</span>
                    <span>{dish.name}</span>
                  </div>
                  <span className="font-bold">{dish.count}</span>
                </div>
              ))}
              {stats.topDishes.length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nessun dato disponibile
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ordini per Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats.ordersByCategory)
                .sort(([, a], [, b]) => b - a)
                .map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <span className="font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(count / Math.max(...Object.values(stats.ordersByCategory))) * 100}%`
                          }}
                        />
                      </div>
                      <span className="font-bold w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              {Object.keys(stats.ordersByCategory).length === 0 && (
                <p className="text-muted-foreground text-center py-4">
                  Nessun dato disponibile
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
