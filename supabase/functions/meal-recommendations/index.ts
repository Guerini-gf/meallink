import { createOpenAI } from "npm:@ai-sdk/openai@3";
import { streamText } from "npm:ai@6";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-lovable-aig-run-id",
  "Access-Control-Expose-Headers": "X-Lovable-AIG-Run-ID",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface DishIn { name: string; category: string; allergens?: string[] }

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI non configurata" }, 500);

    const body = await req.json();
    const needs = String(body?.needs ?? "").trim().slice(0, 1000);
    const dishes: DishIn[] = Array.isArray(body?.dishes) ? body.dishes.slice(0, 60) : [];
    if (!needs) return json({ error: "Descrivi le tue esigenze alimentari" }, 400);
    if (dishes.length === 0) return json({ error: "Nessun piatto disponibile nel menu" }, 400);

    const menuText = dishes
      .map((d) => `- [${String(d.category).slice(0, 40)}] ${String(d.name).slice(0, 120)}` +
        (d.allergens?.length ? ` (allergeni: ${d.allergens.slice(0, 15).join(", ")})` : ""))
      .join("\n");

    let runId = req.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
      fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
        const headers = new Headers(init?.headers);
        if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
        const res = await fetch(input, { ...init, headers });
        runId ??= res.headers.get("X-Lovable-AIG-Run-ID")?.trim() || undefined;
        if (!res.ok) {
          const err: any = new Error(await res.clone().text());
          err.status = res.status;
          throw err;
        }
        return res;
      },
    });

    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system:
        "Sei un assistente nutrizionale di una mensa aziendale. Rispondi in italiano, in modo breve. " +
        "Consiglia SOLO piatti presenti nel menu fornito: al massimo un piatto per categoria. " +
        "Escludi piatti con allergeni incompatibili con le esigenze dichiarate e spiega in una riga il perché di ogni scelta. " +
        "Se nessun piatto è adatto per una categoria, dillo. Non dare consigli medici; ricorda di verificare con lo chef in caso di allergie gravi.",
      messages: [
        { role: "user", content: `Esigenze alimentari: ${needs}\n\nMenu disponibile:\n${menuText}` },
      ],
      abortSignal: req.signal,
      providerOptions: {
        openai: {
          store: false,
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          include: ["reasoning.encrypted_content"],
        },
      },
    });

    const text = (await result.text).trim();
    const out = json({ recommendation: text || "Nessun suggerimento disponibile." });
    if (runId) out.headers.set("X-Lovable-AIG-Run-ID", runId);
    return out;
  } catch (e: any) {
    const status = e?.status ?? e?.statusCode ?? e?.cause?.status ?? 500;
    console.error("meal-recommendations error", status, e?.message);
    if (status === 429) return json({ error: "Troppe richieste, riprova tra poco." }, 429);
    if (status === 402) return json({ error: "Crediti AI esauriti per questo spazio di lavoro." }, 402);
    if (status === 403) return json({ error: "Accesso AI non consentito." }, 403);
    return json({ error: "Errore nel generare i suggerimenti" }, 500);
  }
});
