"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/store/app";
import { buildCoachContext } from "@/lib/coach-context";
import { offlineAnswer } from "@/lib/offline-coach";
import { LESSON_MAP } from "@/lib/course";
import { Markdown } from "@/components/ui";
import { NovaByline } from "@/components/marks";
import { usd } from "@/lib/format";
import Link from "next/link";
import { aiGate } from "@/lib/ai-notice";

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
    const gate = await aiGate();
    if (gate === "wait") return; // the AI data notice is showing; keep the draft
    setInput("");
    setBusy(true);
    pushChat({ role: "user", content: q });
    const history = useApp.getState().chat.map((m) => ({ role: m.role, content: m.content }));
    const replyId = pushChat({ role: "assistant", content: "" });
    const context = buildCoachContext();
    try {
      if (gate === "offline") {
        // AI mode not confirmed: answer locally and send nothing anywhere.
        updateChat(replyId, offlineAnswer(q, context));
        return;
      }
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ aiNoticeAck: true, messages: history, context }),
      });
      // a non-OK response (404 page, 500) or an HTML body is never shown as AI text: fall back to the offline answer
      const ct = res.headers.get("content-type") ?? "";
      if (!res.ok || ct.includes("text/html") || res.headers.get("x-coach-mode") === "offline" || ct.includes("application/json")) {
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
    <div className="flex h-[calc(100dvh-14.5rem)] max-w-[760px] flex-col lg:h-[calc(100dvh-11rem)]">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="t-title">Nova</h1>
            <span className="tag tag-nova">AI coach</span>
          </div>
          <p className="mt-2 t-small text-ink-2">
            {mode === "ai" ? "Nova can see your simulated portfolio, trades and lessons." : mode === "offline" ? "Offline playbook. Answers come from built-in rules, and nothing is sent to an AI service." : "Connecting…"}{" "}
            <Link href="/disclaimer" className="link">
              AI coach limits and disclaimer
            </Link>
          </p>
        </div>
        {chat.length > 0 && (
          <button onClick={clearChat} className="btn btn-secondary">
            New conversation
          </button>
        )}
      </div>

      <div className="mt-6 flex min-h-0 flex-1 flex-col border-t border-rule-strong">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto py-6 pr-1" aria-live="polite">
          {chat.length === 0 && (
            <div>
              <p className="t-lead text-ink">Ask Nova about a trade, a term, or your last mistake{name ? `, ${name}` : ""}.</p>
              <ul className="mt-4 border-t border-rule">
                {STARTERS.map((st) => (
                  <li key={st}>
                    <button onClick={() => send(st)} className="flex min-h-11 w-full items-center border-b border-rule text-left t-small text-ink hover:bg-well">
                      {st}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {chat.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex justify-end">
                <div className="well max-w-[85%] px-4 py-2.5 text-[15px] leading-6 break-words">{m.content}</div>
              </div>
            ) : (
              <div key={m.id} className="nova-note">
                <NovaByline />
                <div className="mt-1.5">{m.content ? <Markdown text={m.content} /> : <span className="t-small text-ink-2">Nova is writing…</span>}</div>
              </div>
            ),
          )}
          <div ref={endRef} />
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="border-t border-rule pt-3"
        >
          <div className="flex items-end gap-2">
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
              placeholder="Ask Nova anything"
              aria-label="Message Nova"
              maxLength={2000}
              className="field max-h-40 min-h-11 flex-1 resize-none py-2.5 leading-6"
            />
            <button type="submit" disabled={!input.trim() || busy} className="btn btn-primary min-h-11">
              Send
            </button>
          </div>
          <p className="mt-2 t-micro text-ink-2">
            {mode === "ai" ? (
              <>
                Nova is an AI coach. It can be wrong. Not investment advice. Your portfolio, trades, name and messages are sent to our AI provider (
                <Link href="/privacy#ai" className="link">
                  privacy policy
                </Link>
                ).
              </>
            ) : mode === "offline" ? (
              <>Educational coaching on a simulated market. Not investment advice. What you write here is not sent anywhere.</>
            ) : (
              <>Educational coaching on a simulated market. Not investment advice.</>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
