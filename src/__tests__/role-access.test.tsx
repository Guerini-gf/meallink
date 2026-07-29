import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import {
  EMPLOYEE_ID,
  CANTEEN_ID,
  TODAY,
  TOMORROW,
  DAY_AFTER,
  queries,
  resetQueries,
} from "@/test/canteen-fixtures";

vi.mock("@/integrations/supabase/client", async () => {
  const { createSupabaseMock } = await import("@/test/supabase-mock");
  const fixtures = await import("@/test/canteen-fixtures");
  const mock = createSupabaseMock({ userId: fixtures.EMPLOYEE_ID, handler: fixtures.handler });
  return { supabase: mock.client };
});


// Heavy staff-only widgets are stubbed: these tests assert access, not rendering.
vi.mock("@/components/menu/MenuManager", () => ({ MenuManager: () => <div>MenuManager</div> }));
vi.mock("@/components/scanner/ScannerInterface", () => ({ ScannerInterface: () => <div>ScannerInterface</div> }));
vi.mock("@/components/dashboard/ChefStatistics", () => ({ ChefStatistics: () => <div>ChefStatistics</div> }));
vi.mock("@/components/dashboard/InvestorLeads", () => ({ InvestorLeads: () => <div>InvestorLeads</div> }));
vi.mock("@/components/employees/EmployeeManager", () => ({ EmployeeManager: () => <div>EmployeeManager</div> }));
vi.mock("@/components/pwa/PWAInstallBanner", () => ({ PWAInstallBanner: () => null }));
vi.mock("@/lib/notifications", () => ({ setupNotifications: vi.fn() }));

const roleState = { userRole: "customer" as string | null, userName: "Mario Rossi", loading: false, error: null };
vi.mock("@/hooks/use-user-role", () => ({ useUserRole: () => roleState }));

import { CustomerInterface } from "@/components/customer/CustomerInterface";
import Dashboard from "@/pages/Dashboard";

const renderWithRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  resetQueries();
  roleState.userRole = "customer";
});

describe("employee (customer) menu scope", () => {
  it("requests only today's and tomorrow's menu, never later dates", async () => {
    renderWithRouter(<CustomerInterface />);
    await waitFor(() => expect(screen.getByText("APP MONITOR DIPENDENTE")).toBeInTheDocument());

    const menuDates = queries
      .filter((q) => q.table === "daily_menus")
      .map((q) => q.filters.menu_date as string);

    expect(menuDates.length).toBeGreaterThan(0);
    expect(new Set(menuDates)).toEqual(new Set([TODAY, TOMORROW]));
    expect(menuDates).not.toContain(DAY_AFTER);
  });

  it("scopes every menu query to the employee's own canteen", async () => {
    renderWithRouter(<CustomerInterface />);
    await waitFor(() => expect(queries.some((q) => q.table === "daily_menus")).toBe(true));

    for (const q of queries.filter((q) => q.table === "daily_menus")) {
      expect(q.filters.canteen_id).toBe(CANTEEN_ID);
    }
  });

  it("reads meal orders only for the signed-in employee", async () => {
    renderWithRouter(<CustomerInterface />);
    await waitFor(() => expect(queries.some((q) => q.table === "meal_orders")).toBe(true));

    for (const q of queries.filter((q) => q.table === "meal_orders" && q.op !== "upsert")) {
      expect(q.filters.user_id).toBe(EMPLOYEE_ID);
    }
  });

  it("does not surface dishes from dates beyond tomorrow", async () => {
    renderWithRouter(<CustomerInterface />);
    await waitFor(() => expect(screen.getByText("APP MONITOR DIPENDENTE")).toBeInTheDocument());

    expect(screen.queryByText("Polenta Dopodomani")).not.toBeInTheDocument();
  });

  it("offers booking only against tomorrow's menu", async () => {
    renderWithRouter(<CustomerInterface />);
    await waitFor(() => expect(screen.getByText("APP MONITOR DIPENDENTE")).toBeInTheDocument());

    // Tomorrow's menu is the one loaded into the "new order" tab.
    const bookableMenuIds = queries
      .filter((q) => q.table === "menu_dishes")
      .map((q) => q.filters.menu_id as string);
    expect(bookableMenuIds).toContain("menu-tomorrow");
    expect(bookableMenuIds).not.toContain("menu-dayafter");
  });
});

describe("dashboard role-based access", () => {
  it("hides all staff tools from an employee", async () => {
    roleState.userRole = "customer";
    renderWithRouter(<Dashboard />);
    await waitFor(() => expect(screen.getByText("APP MONITOR DIPENDENTE")).toBeInTheDocument());

    expect(screen.queryByText("Gestione Menu")).not.toBeInTheDocument();
    expect(screen.queryByText("Statistiche")).not.toBeInTheDocument();
    expect(screen.queryByText("Dipendenti")).not.toBeInTheDocument();
    expect(screen.queryByText("Scanner Ordini")).not.toBeInTheDocument();
    expect(screen.queryByText("Lead Investitori")).not.toBeInTheDocument();
    expect(screen.queryByText("Accesso Mensa HACCP")).not.toBeInTheDocument();
  });

  it("gives a chef the full management surface", async () => {
    roleState.userRole = "chef";
    renderWithRouter(<Dashboard />);

    await waitFor(() => expect(screen.getByText("Gestione Menu")).toBeInTheDocument());
    expect(screen.getByText("Statistiche")).toBeInTheDocument();
    expect(screen.getByText("Dipendenti")).toBeInTheDocument();
    expect(screen.getByText("Scanner Ordini")).toBeInTheDocument();
    expect(screen.getByText("Accesso Mensa HACCP")).toBeInTheDocument();
  });

  it("limits an operator to the order scanner", async () => {
    roleState.userRole = "operator";
    renderWithRouter(<Dashboard />);

    await waitFor(() => expect(screen.getByText("ScannerInterface")).toBeInTheDocument());
    expect(screen.queryByText("Gestione Menu")).not.toBeInTheDocument();
    expect(screen.queryByText("Lead Investitori")).not.toBeInTheDocument();
    expect(screen.queryByText("APP MONITOR DIPENDENTE")).not.toBeInTheDocument();
  });
});
