import Anthropic from "@anthropic-ai/sdk";
import { COACH_MODEL, COACH_SYSTEM, hasClaudeCredentials } from "@/lib/coach-prompt";

export const runtime = "nodejs";

export function GET() {
  return Response.json({ mode: hasClaudeCredentials() ? "ai" : "offline" });
}

interface Body {
  aiNoticeAck?: boolean;
  messages: { role: "user" | "assistant"; content: string }[];
  context: string;
}

export async function POST(req: Request) {
  if (!hasClaudeCredentials()) {
    return Response.json({ offline: true }, { status: 200, headers: { "x-coach-mode": "offline" } });
  }
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return Response.json({ error: "bad_request" }, { status: 400 });
  }
  // Defence in depth: refuse to forward user data to the AI provider unless the client confirms the data notice was acknowledged.
  if (body.aiNoticeAck !== true) return Response.json({ error: "ai_notice_required" }, { status: 400 });
  const messages = (body.messages ?? [])
    .filter((m) => m.content?.trim())
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));
  if (!messages.length || messages[0].role !== "user") {
    return Response.json({ error: "Conversation must start with a user message." }, { status: 400 });
  }

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.beta.messages.stream({
          model: COACH_MODEL,
          max_tokens: 8000,
          betas: ["server-side-fallback-2026-07-01"],
          fallbacks: "default",
          output_config: { effort: "low" },
          system: [
            { type: "text", text: COACH_SYSTEM, cache_control: { type: "ephemeral" } },
            { type: "text", text: `Current user context (live from the app):\n${(body.context ?? "").slice(0, 6000)}` },
          ],
          messages,
        });
        for await (const event of s) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await s.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\nI can't help with that one, but I'm happy to keep coaching you on your trades and the lessons."));
        }
      } catch (err) {
        const msg =
          err instanceof Anthropic.AuthenticationError
            ? "The coach isn't connected yet (invalid API key)."
            : err instanceof Anthropic.RateLimitError
              ? "The coach is busy right now. Try again in a moment."
              : "The coach hit a snag. Try again in a moment.";
        controller.enqueue(encoder.encode(`\n\n_${msg}_`));
        console.error("[coach]", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-coach-mode": "ai" },
  });
}
