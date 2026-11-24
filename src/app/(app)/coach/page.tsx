"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUp, RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "@/store/app";
import { buildCoachContext } from "@/lib/coach-context";
import { offlineAnswer } from "@/lib/offline-coach";
import { LESSON_MAP } from "@/lib/course";
import { Markdown } from "@/components/ui";
import { cn, usd } from "@/lib/format";
import Link from "next/link";
import { aiAllowed } from "@/lib/ai-notice";

const STARTERS = [
  "Review my portfolio. What's my biggest risk right now?",
  "How do I figure out how many shares to buy?",
  "Explain P/E ratio like I'm new to this.",
  "Help me write a trading plan.",
  "Why did my last trade get that score?",
  "What should I learn next?",
];

export default function CoachPage() {
  return (
    <Suspense>
      <Coach />
    </Suspense>
  );
}

function Coach() {
  const chat = useApp((s) => s.chat);
  const pushChat = useApp((s) => s.pushChat);
  const updateChat = useApp((s) => s.updateChat);
  const clearChat = useApp((s) => s.clearChat);
  const name = useApp((s) => s.profile.name);
  const params = useSearchParams();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"ai" | "offline" | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/coach").then((r) => r.json()).then((d) => setMode(d.mode)).catch(() => setMode("offline"));
  }, []);

  useEffect(() => {
    const tradeId = params.get("trade");
    const lesson = params.get("lesson");
    if (tradeId) {
      const t = useApp.getState().trades.find((x) => x.id === tradeId);
      if (t) setInput(`Walk me through my ${t.side} of ${t.qty} ${t.symbol} at ${usd(t.price)} (score ${t.score}). What should I do differently next time?`);
    } else if (lesson && LESSON_MAP[lesson]) {
      setInput(`Can you explain "${LESSON_MAP[lesson].title}" using my own portfolio as the example?`);
    }
  }, [params]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    if (!(await aiAllowed())) return; // the AI data notice is showing; keep the draft
    setInput("");
    setBusy(true);
    pushChat({ role: "user", content: q });
    const history = useApp.getState().chat.map((m) => ({ role: m.role, content: m.content }));
    const replyId = pushChat({ role: "assistant", content: "" });
    const context = buildCoachContext();
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: history, context }),
      });
      if (res.headers.get("x-coach-mode") === "offline" || res.headers.get("content-type")?.includes("application/json")) {
        setMode("offline");
        updateChat(replyId, offlineAnswer(q, context));
      } else if (res.body) {
        setMode("ai");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          updateChat(replyId, acc);
        }
        if (!acc.trim()) updateChat(replyId, offlineAnswer(q, context));
      }
    } catch {
      updateChat(replyId, offlineAnswer(q, context));
    } finally {
      setBusy(false);
      taRef.current?.focus();
    }
  };

  return (
    <div className="mx-auto flex h-[calc(100dvh-8.5rem)] max-w-3xl flex-col md:h-[calc(100dvh-7rem)]">
      <div className="mb-4 flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-2xl bg-coach text-coach-ink"><Sparkles className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight">Coach Nova</h1>
          <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted">
            <span className={cn("size-1.5 rounded-full", mode === "ai" ? "bg-up" : "bg-warn")} />
            <span>{mode === "ai" ? "AI coach: sees your portfolio, trades and progress" : mode === "offline" ? "Nova, rules engine: add an API key for the AI coach" : "Connecting…"}</span>
            <Link href="/disclaimer" className="font-medium text-series-1 underline underline-offset-2">AI coach limits and disclaimer</Link>
          </p>
        </div>
        {chat.length > 0 && (
          <button onClick={clearChat} className="inline-flex items-center gap-1 rounded-full border border-line px-3 py-1.5 text-xs text-muted hover:text-ink">
            <RotateCcw className="size-3.5" /> New chat
          </button>
        )}
      </div>

      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {chat.length === 0 && (
            <div className="grid h-full place-content-center text-center">
              <h2 className="text-2xl font-semibold tracking-tight">Hey{name ? ` ${name}` : ""}, what are we working on?</h2>
              <p className="mx-auto mt-2 max-w-md text-sm text-ink-2">I can see your positions, trades, scores and lessons. Ask me anything about investing, or about your own decisions.</p>
              <div className="mx-auto mt-6 grid max-w-xl gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-2xl border border-line px-4 py-3 text-left text-sm hover:bg-panel-2">{s}</button>
                ))}
              </div>
            </div>
          )}
          {chat.map((m) => (
            <div key={m.id} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
              {m.role === "assistant" && <span className="mt-1 grid size-7 shrink-0 place-items-center rounded-full bg-coach text-coach-ink"><Sparkles className="size-3.5" /></span>}
              <div className={cn("max-w-[85%] text-[15px] leading-relaxed", m.role === "user" ? "rounded-3xl rounded-br-md bg-ink px-4 py-2.5 text-bg" : "pt-1")}>
                {m.role === "assistant" ? (
                  m.content ? <Markdown text={m.content} /> : <span className="inline-flex gap-1 py-2"><Dot /><Dot d={150} /><Dot d={300} /></span>
                ) : (
                  m.content
                )}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-line p-3"
        >
          <div className="flex items-end gap-2 rounded-3xl border border-line bg-panel-2 p-1.5 pl-4 focus-within:border-line-strong">
            <textarea
              ref={taRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(input);
                }
              }}
              placeholder="Ask Nova anything…"
              aria-label="Message Nova"
              className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent py-2 text-[15px] outline-none placeholder:text-muted"
            />
            <button type="submit" disabled={!input.trim() || busy} className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-ink transition disabled:opacity-40" aria-label="Send">
              <ArrowUp className="size-5" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            {mode !== "offline" ? (
              <>Nova is an AI coach. It can be wrong. Not investment advice. Your portfolio, trades, name and messages are sent to our AI provider (<Link href="/privacy#ai" className="underline underline-offset-2">privacy policy</Link>).</>
            ) : (
              <>Educational coaching on a simulated market. Not investment advice. No AI provider receives what you write here.</>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}

function Dot({ d = 0 }: { d?: number }) {
  return <span className="size-1.5 animate-bounce rounded-full bg-muted" style={{ animationDelay: `${d}ms` }} />;
}
