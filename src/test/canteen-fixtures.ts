import { isoDate, type QueryLog } from "./supabase-mock";

export const EMPLOYEE_ID = "11111111-1111-1111-1111-111111111111";
export const CANTEEN_ID = "22222222-2222-2222-2222-222222222222";

export const TODAY = isoDate(0);
export const TOMORROW = isoDate(1);
export const DAY_AFTER = isoDate(2);

export const MENUS: Record<string, { id: string; dish: { id: string; name: string } }> = {
  [TODAY]: { id: "menu-today", dish: { id: "dish-today", name: "Lasagne di Oggi" } },
  [TOMORROW]: { id: "menu-tomorrow", dish: { id: "dish-tomorrow", name: "Risotto di Domani" } },
  [DAY_AFTER]: { id: "menu-dayafter", dish: { id: "dish-dayafter", name: "Polenta Dopodomani" } },
};

/** Every query the component issues, recorded for assertions. */
export const queries: QueryLog[] = [];

export const resetQueries = () => {
  queries.length = 0;
};

export const handler = (q: QueryLog): unknown => {
  queries.push(q);
  switch (q.table) {
    case "profiles":
      return {
        id: EMPLOYEE_ID,
        canteen_id: CANTEEN_ID,
        full_name: "Mario Rossi",
        employee_number: "42",
        badge_code: "ABC123",
      };
    case "user_roles":
      return { role: "customer" };
    case "user_allergens":
      return [];
    case "canteens":
      return { name: "Mensa Test", code: "MT01" };
    case "daily_menus": {
      const date = q.filters.menu_date as string;
      const menu = MENUS[date];
      return menu ? { id: menu.id, menu_date: date, meal_type: "lunch", order_deadline: "15:00:00" } : null;
    }
    case "menu_dishes": {
      const menuId = q.filters.menu_id as string;
      const entry = Object.values(MENUS).find((m) => m.id === menuId);
      return entry ? [{ dish_id: entry.dish.id }] : [];
    }
    case "dishes": {
      const ids = (q.filters.id as string[]) || [];
      return Object.values(MENUS)
        .filter((m) => ids.includes(m.dish.id))
        .map((m) => ({ ...m.dish, category: "primo", canteen_id: CANTEEN_ID }));
    }
    case "dish_allergens":
      return [];
    default:
      return null;
  }
};
