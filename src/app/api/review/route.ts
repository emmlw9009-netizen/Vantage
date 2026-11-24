import Anthropic from "@anthropic-ai/sdk";
import { COACH_MODEL, REVIEW_SCHEMA, REVIEW_SYSTEM, hasClaudeCredentials } from "@/lib/coach-prompt";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!hasClaudeCredentials()) return Response.json({ offline: true });
  const payload = await req.json();
  const client = new Anthropic();

  try {
    const response = await client.beta.messages.create({
      model: COACH_MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: REVIEW_SCHEMA } },
      system: [{ type: "text", text: REVIEW_SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: `Review this simulated trade.\n\n${JSON.stringify(payload, null, 2).slice(0, 8000)}` }],
    });
    if (response.stop_reason === "refusal") return Response.json({ error: "refused" }, { status: 422 });
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return Response.json({ error: "empty" }, { status: 502 });
    const review = JSON.parse(text.text);
    return Response.json({ review: { ...review, source: "ai" } });
  } catch (err) {
    console.error("[review]", err);
    const status = err instanceof Anthropic.APIError && typeof err.status === "number" ? err.status : 500;
    return Response.json({ error: "review_failed" }, { status: status >= 400 ? status : 500 });
  }
}
