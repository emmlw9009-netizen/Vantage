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
import { gateFor, hasCurrentConsent, probeCoachMode, type CoachMode } from "@/lib/ai-notice";

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
  const aiNoticeAt = useApp((s) => s.profile.aiNoticeAt);
  const params = useSearchParams();
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<CoachMode | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // A failed probe is "unknown", never "offline". Re-probe on focus so the header and footer follow the server.
    const probe = () => probeCoachMode().then(setMode);
    probe();
    window.addEventListener("focus", probe);
    return () => window.removeEventListener("focus", probe);
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

  // Chat from before the AI notice was acknowledged (or written while nothing could be sent) is never sent to the provider.
  const noticeMs = Date.parse(aiNoticeAt ?? "");
  const kept = (m: { at: number; local?: boolean }) => Number.isFinite(noticeMs) && (!!m.local || m.at < noticeMs);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    if (!hasCurrentConsent()) return;
    // One probe decides the gate, the header and the footer. Only a successful probe of AI mode plus the notice sends anything.
    const probed = await probeCoachMode();
    setMode(probed);
    const gate = gateFor(probed);
    if (gate === "wait") return; // the AI data notice is showing; keep the draft
    const local = gate !== "send";
    setInput("");
    setBusy(true);
    pushChat({ role: "user", content: q, local });
    // Only messages written after the AI notice was acknowledged, and while sending was possible, may go to the provider.
    const since = Date.parse(useApp.getState().profile.aiNoticeAt ?? "");
    const history = useApp
      .getState()
      .chat.filter((m) => !m.local && Number.isFinite(since) && m.at >= since)
      .map((m) => ({ role: m.role, content: m.content }));
    const replyId = pushChat({ role: "assistant", content: "", local });
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
        useApp.setState((st) => ({ chat: st.chat.map((c) => (c.id === replyId ? { ...c, local: true } : c)) }));
        updateChat(replyId, offlineAnswer(q, context));
      } else if (res.body) {
        setMode("ai");
        const reader = res.body.getReader();
        const dec = new TextDecoder();
        let acc = "";
        let lastWrite = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          acc += dec.decode(value, { stream: true });
          // batch the streamed text: one store write about every 200 ms, and a final one below
          if (Date.now() - lastWrite > 200) {
            lastWrite = Date.now();
            updateChat(replyId, acc);
          }
        }
        acc += dec.decode();
        updateChat(replyId, acc);
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
            {mode === "ai"
              ? "Nova can see your simulated portfolio, trades and lessons."
              : mode === "offline"
                ? "Offline playbook. Answers come from built-in rules, and nothing is sent to an AI service while the AI coach is off."
                : mode === "unknown"
                  ? "Can't tell yet whether the AI coach is on. Nothing is sent until that is confirmed, and answers come from built-in rules for now."
                  : "Connecting…"}{" "}
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
                <div className="max-w-[85%]">
                  <div className="well px-4 py-2.5 text-[15px] leading-6 break-words">{m.content}</div>
                  {kept(m) && <p className="mt-1 text-right t-micro text-ink-2">Kept on this device</p>}
                </div>
              </div>
            ) : (
              <div key={m.id} className="nova-note">
                <NovaByline />
                <div className="mt-1.5">{m.content ? <Markdown text={m.content} /> : <span className="t-small text-ink-2">Nova is writing…</span>}</div>
                {kept(m) && m.content && <p className="mt-1 t-micro text-ink-2">Kept on this device</p>}
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
              Send message
            </button>
          </div>
          <p className="mt-2 t-micro text-ink-2">
            {mode === "ai" ? (
              <>
                Nova is an AI coach. It can be wrong. Not investment advice. Your name, experience and goal, portfolio, orders, trades and notes, progress and messages are sent to our AI provider (
                <Link href="/privacy#ai" className="link">
                  privacy policy
                </Link>
                ).
              </>
            ) : mode === "offline" ? (
              <>Educational coaching on a simulated market. Not investment advice. While the AI coach is off, what you write here stays on this device.</>
            ) : mode === "unknown" ? (
              <>Educational coaching on a simulated market. Not investment advice. We could not check the AI coach, so nothing you write is sent until the check succeeds.</>
            ) : (
              <>Educational coaching on a simulated market. Not investment advice.</>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
