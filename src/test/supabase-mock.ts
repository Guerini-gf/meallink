import { vi } from "vitest";

export type QueryLog = {
  table: string;
  op: string;
  filters: Record<string, unknown>;
  payload?: unknown;
};

type Handler = (q: QueryLog) => unknown;

/**
 * Minimal chainable stub of the supabase-js query builder.
 * Every terminal call is recorded so tests can assert *what* a role is
 * allowed to request (e.g. only today's and tomorrow's menu dates).
 */
export const createSupabaseMock = (opts: {
  userId: string;
  handler: Handler;
}) => {
  const queries: QueryLog[] = [];

  const makeBuilder = (table: string) => {
    const q: QueryLog = { table, op: "select", filters: {} };

    const resolve = () => {
      queries.push({ ...q, filters: { ...q.filters } });
      return Promise.resolve({ data: opts.handler(q) ?? null, error: null });
    };

    const builder: any = {
      select: (_c?: string) => builder,
      eq: (col: string, val: unknown) => {
        q.filters[col] = val;
        return builder;
      },
      in: (col: string, val: unknown) => {
        q.filters[col] = val;
        return builder;
      },
      is: (col: string, val: unknown) => {
        q.filters[col] = val;
        return builder;
      },
      order: () => builder,
      limit: () => builder,
      maybeSingle: () => {
        q.op = q.op === "select" ? "maybeSingle" : q.op;
        return resolve();
      },
      single: () => resolve(),
      insert: (payload: unknown) => {
        q.op = "insert";
        q.payload = payload;
        return resolve();
      },
      upsert: (payload: unknown) => {
        q.op = "upsert";
        q.payload = payload;
        return resolve();
      },
      update: (payload: unknown) => {
        q.op = "update";
        q.payload = payload;
        return resolve();
      },
      delete: () => {
        q.op = "delete";
        return resolve();
      },
      then: (onOk: any, onErr: any) => resolve().then(onOk, onErr),
    };
    return builder;
  };

  const client = {
    from: (table: string) => makeBuilder(table),
    rpc: vi.fn(async () => ({ data: null, error: null })),
    auth: {
      getUser: async () => ({ data: { user: { id: opts.userId } }, error: null }),
      getSession: async () => ({
        data: { session: { user: { id: opts.userId } } },
        error: null,
      }),
      signOut: vi.fn(async () => ({ error: null })),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
  };

  return { client, queries };
};

export const isoDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86400000).toISOString().split("T")[0];
