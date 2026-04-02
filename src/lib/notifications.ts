import { supabase } from "@/integrations/supabase/client";

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const sendLocalNotification = (title: string, body: string) => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/logo.jpg",
      badge: "/logo.jpg",
    });
  }
};

export const scheduleMenuNotification = async () => {
  // Check if menu for tomorrow is available
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = tomorrow.toISOString().split('T')[0];

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('canteen_id')
    .eq('id', user.user.id)
    .single();

  if (!profile?.canteen_id) return;

  const { data: menu } = await supabase
    .from('daily_menus')
    .select('id')
    .eq('canteen_id', profile.canteen_id)
    .eq('menu_date', tomorrowDate)
    .single();

  if (menu) {
    sendLocalNotification(
      "Menu Disponibile",
      "Il menu di domani è ora disponibile! Effettua il tuo ordine."
    );
  }
};

export const checkUnclaimedEmployeesNotification = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  // Check if user is a chef
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.user.id)
    .eq('role', 'chef');

  if (!roles || roles.length === 0) return;

  const { data: profile } = await supabase
    .from('profiles')
    .select('canteen_id')
    .eq('id', user.user.id)
    .single();

  if (!profile?.canteen_id) return;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: unclaimed, error } = await supabase
    .from('pending_employees')
    .select('id, full_name')
    .eq('canteen_id', profile.canteen_id)
    .is('claimed_by', null)
    .lt('created_at', thirtyDaysAgo.toISOString());

  if (error || !unclaimed || unclaimed.length === 0) return;

  sendLocalNotification(
    "Dipendenti non registrati",
    `${unclaimed.length} dipendente/i non si sono registrati da oltre 30 giorni. Controlla il pannello dipendenti.`
  );
};

export const scheduleDeadlineNotification = () => {
  const now = new Date();
  const deadline = new Date();
  deadline.setHours(16, 0, 0, 0);

  // If it's 2 hours before deadline (14:00)
  const twoHoursBefore = new Date(deadline.getTime() - 2 * 60 * 60 * 1000);
  
  if (now >= twoHoursBefore && now < deadline) {
    sendLocalNotification(
      "Scadenza Ordini",
      `Mancano ${Math.floor((deadline.getTime() - now.getTime()) / (60 * 60 * 1000))} ore alla scadenza degli ordini!`
    );
  }
};

export const setupNotifications = async () => {
  const hasPermission = await requestNotificationPermission();
  
  if (hasPermission) {
    // Check for menu availability every hour
    setInterval(scheduleMenuNotification, 60 * 60 * 1000);
    
    // Check for deadline every 30 minutes
    setInterval(scheduleDeadlineNotification, 30 * 60 * 1000);

    // Check for unclaimed employees every 6 hours (chef only)
    setInterval(checkUnclaimedEmployeesNotification, 6 * 60 * 60 * 1000);
    
    // Initial checks
    scheduleMenuNotification();
    scheduleDeadlineNotification();
    checkUnclaimedEmployeesNotification();
  }
};
