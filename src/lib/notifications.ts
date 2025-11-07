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
    
    // Initial checks
    scheduleMenuNotification();
    scheduleDeadlineNotification();
  }
};
