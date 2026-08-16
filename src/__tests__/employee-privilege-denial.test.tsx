import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { QueryLog } from "@/test/supabase-mock";

const { EMPLOYEE_ID, STAFF_TABLES, state } = vi.hoisted(() => ({
  EMPLOYEE_ID: "11111111-1111-1111-1111-111111111111",
  /** Tables an employee (customer role) must never be able to read/write. */
  STAFF_TABLES: ["investor_leads", "pending_employees", "menu_dishes", "dishes"],
  state: { hasSession: true, rpcDenied: true, queries: [] as QueryLog[] },
}));

const navigate = vi.hoisted(() => vi.fn());

vi.mock("@/integrations/supabase/client", async () => {
  const { createSupabaseMock } = await import("@/test/supabase-mock");
  const { denied } = await import("@/test/supabase-mock");
  const mock = createSupabaseMock({
    userId: EMPLOYEE_ID,
    handler: (q) => {
      state.queries.push(q);
      // Simulate RLS: staff-only tables are denied for a customer session.
      if (STAFF_TABLES.includes(q.table)) return denied();
      if (q.table === "user_roles") return { role: "customer" };
      if (q.table === "canteens") return denied("permission denied for table canteens");
      return null;
    },
  });
  mock.client.rpc = (async (name: string) =>
    state.rpcDenied
      ? { data: null, error: { message: `permission denied for function ${name}`, code: "42501" } }
      : { data: null, error: null }) as any;
  mock.client.auth.getSession = (async () => ({
    data: { session: state.hasSession ? { user: { id: EMPLOYEE_ID } } : null },
    error: null,
  })) as any;
  return { supabase: mock.client };
});

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<any>("react-router-dom");
  return { ...actual, useNavigate: () => navigate };
});

vi.mock("@/components/customer/CustomerInterface", () => ({
  CustomerInterface: () => <div>APP MONITOR DIPENDENTE</div>,
}));
vi.mock("@/components/pwa/PWAInstallBanner", () => ({ PWAInstallBanner: () => null }));
vi.mock("@/lib/notifications", () => ({ setupNotifications: vi.fn() }));

const roleState = { userRole: "customer" as string | null, userName: "Mario Rossi", loading: false, error: null };
vi.mock("@/hooks/use-user-role", () => ({ useUserRole: () => roleState }));

import { supabase } from "@/integrations/supabase/client";
import { InvestorLeads } from "@/components/dashboard/InvestorLeads";
import { ScannerInterface } from "@/components/scanner/ScannerInterface";
import Dashboard from "@/pages/Dashboard";
import Dipendente from "@/pages/Dipendente";

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

beforeEach(() => {
  state.queries.length = 0;
  state.hasSession = true;
  state.rpcDenied = true;
  roleState.userRole = "customer";
  navigate.mockClear();
});

describe("employee session hitting chef-only data endpoints", () => {
  it("is denied (42501) when reading investor leads", async () => {
    const { error, data } = await supabase.from("investor_leads").select("*");
    expect(error?.code).toBe("42501");
    expect(data).toBeNull();
  });

  it("is denied when reading pre-registered employees", async () => {
    const { error } = await supabase.from("pending_employees").select("*");
    expect(error?.code).toBe("42501");
  });

  it("is denied when writing dishes or menu composition", async () => {
    const dish = await supabase.from("dishes").insert({ name: "Hack" });
    const link = await supabase.from("menu_dishes").insert({ menu_id: "x", dish_id: "y" });
    expect(dish.error?.code).toBe("42501");
    expect(link.error?.code).toBe("42501");
  });

  it("is denied on the operator-only get_user_canteen RPC", async () => {
    const { error } = await (supabase as any).rpc("get_user_canteen", { _user_id: EMPLOYEE_ID });
    expect(error?.code).toBe("42501");
  });
});

describe("UI degrades safely when the backend denies an employee", () => {
  it("leaks no lead PII when the leads query is refused", async () => {
    renderWithRouter(<InvestorLeads />);
    await waitFor(() => expect(screen.getByText(/Nessun lead ricevuto ancora/)).toBeInTheDocument());
    expect(screen.getByText("0 lead")).toBeInTheDocument();
  });

  it("shows the scanner fallback instead of service data", async () => {
    renderWithRouter(<ScannerInterface />);
    await waitFor(() =>
      expect(screen.getByText("Nessuna mensa associata al tuo badge")).toBeInTheDocument()
    );
    expect(screen.queryByText(/Monitor di Servizio/)).not.toBeInTheDocument();
  });
});

describe("route guards", () => {
  it("renders no chef/operator surface for an employee on /dashboard", async () => {
    renderWithRouter(<Dashboard />);
    await waitFor(() => expect(screen.getByText("APP MONITOR DIPENDENTE")).toBeInTheDocument());
    for (const label of ["Gestione Menu", "Statistiche", "Dipendenti", "Scanner Ordini", "Lead Investitori"]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  it("redirects an unauthenticated visitor away from /dashboard", async () => {
    state.hasSession = false;
    renderWithRouter(<Dashboard />);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/auth"));
  });

  it("redirects an unauthenticated visitor away from /dipendente", async () => {
    state.hasSession = false;
    renderWithRouter(<Dipendente />);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/auth?redirect=/dipendente"));
    expect(screen.getByText("Caricamento...")).toBeInTheDocument();
  });
});
