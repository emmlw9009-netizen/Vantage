"use client";

import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Award, Flag, Flame, Heart, MessageCircle, Send, Sparkles, Trophy, Users } from "lucide-react";
import { useApp, useEquity, ME, STARTING_CASH } from "@/store/app";
import { CHALLENGES, MEMBERS, MEMBER_MAP, SEED_POSTS } from "@/lib/community-seed";
import { TICKER_MAP } from "@/lib/market-data";
import { buildCoachContext } from "@/lib/coach-context";
import { levelFor } from "@/lib/course";
import { cn, pct, timeAgo } from "@/lib/format";
import { aiGate } from "@/lib/ai-notice";
import { useToast } from "@/store/toast";
import { Avatar, Delta, Pill, Segmented, SectionTitle } from "@/components/ui";

type Tab = "feed" | "leaders" | "challenges";
const KINDS = [
  { value: "idea", label: "Trade idea" },
  { value: "question", label: "Question" },
  { value: "win", label: "Win" },
  { value: "lesson", label: "Lesson learned" },
] as const;
const KIND_LABEL: Record<string, string> = { idea: "Trade idea", question: "Question", win: "Win", lesson: "Lesson" };

async function novaReply(postBody: string): Promise<string> {
  try {
    // Only send the post text to the AI when AI mode is confirmed and the notice was acknowledged.
    if ((await aiGate()) !== "send") throw new Error("not sending");
    const res = await fetch("/api/coach", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        aiNoticeAck: true,
        context: buildCoachContext(),
        messages: [{ role: "user", content: `I just posted this in the ${BRAND.name} community feed:\n\n"${postBody}"\n\nReply as a public comment from Coach Nova: 2–3 warm, specific sentences. If there's a risk-management lesson in it, name it and link the relevant lesson. No preamble.` }],
      }),
    });
    const ct = res.headers.get("content-type") ?? "";
    // a non-OK response (404 page, 500) or an HTML body is never posted as Nova's reply: use the canned reply
    if (!res.ok || ct.includes("text/html") || ct.includes("application/json")) throw new Error("offline");
    const text = await res.text();
    if (text.trim()) return text.trim();
    throw new Error("empty");
  } catch {
    return "Love that you shared this. Writing your reasoning down publicly is one of the fastest ways to improve. What would make you wrong here? That answer is your stop. See [Stop-losses](/learn/stop-losses).";
  }
}

export default function Community() {
  const [tab, setTab] = useState<Tab>("feed");
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Community</h1>
          <p className="mt-1 text-sm text-ink-2">Share ideas, post lessons, compete on discipline, not just profit.</p>
        </div>
        <Segmented kind="tabs" label="Community sections" size="md" value={tab} onChange={setTab} options={[{ value: "feed", label: "Feed" }, { value: "leaders", label: "Leaderboard" }, { value: "challenges", label: "Challenges" }]} />
      </div>
      <div className="flex items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-2.5 text-xs text-muted">
        <Users className="size-4 shrink-0" /> <span>Preview community. Members, posts, comments and leaderboard rows marked Demo are fictional sample content. Your posts are yours, and Nova&apos;s replies are marked AI-generated.</span>
      </div>
      {tab === "feed" && <Feed />}
      {tab === "leaders" && <Leaderboard />}
      {tab === "challenges" && <Challenges />}
    </div>
  );
}

function Feed() {
  const posts = useApp((s) => s.posts);
  const liked = useApp((s) => s.liked);
  const comments = useApp((s) => s.comments);
  const addPost = useApp((s) => s.addPost);
  const addComment = useApp((s) => s.addComment);
  const toggleLike = useApp((s) => s.toggleLike);
  const reported = useApp((s) => s.reported);
  const reportItem = useApp((s) => s.reportItem);
  const unreportItem = useApp((s) => s.unreportItem);
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("idea");
  const [symbol, setSymbol] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [novaTyping, setNovaTyping] = useState<string | null>(null);

  const feed = useMemo(() => {
    // Likes are never fabricated: the count is only the real user's own like (0 or 1).
    const seeded = SEED_POSTS.map((p) => ({
      ...p,
      demo: true,
      allComments: [
        ...p.seedComments.map((c, i) => ({ id: `${p.id}-${i}`, authorId: c.authorId, body: c.body, at: Date.now() - c.ago, demo: true })),
        ...(comments[p.id] ?? []).map((c) => ({ ...c, demo: false })),
      ].filter((c) => !reported[c.id]),
      likeCount: liked[p.id] ? 1 : 0,
    }));
    const mine = posts.map((p) => ({ ...p, demo: false, allComments: (comments[p.id] ?? []).map((c) => ({ ...c, demo: false })).filter((c) => !reported[c.id]), likeCount: liked[p.id] ? 1 : 0 }));
    return [...mine, ...seeded].filter((p) => !reported[p.id]).sort((a, b) => b.at - a.at);
  }, [posts, comments, liked, reported]);

  const report = (id: string) => {
    reportItem(id);
    useToast.getState().push({ title: "Reported. Thanks for flagging it.", action: { label: "Undo", run: () => unreportItem(id) } });
  };

  const submit = async () => {
    const text = body.trim();
    if (!text) return;
    const sym = symbol.trim().toUpperCase();
    const id = addPost({ kind, body: text, symbol: TICKER_MAP[sym] ? sym : undefined });
    setBody("");
    setSymbol("");
    setOpen((o) => ({ ...o, [id]: true }));
    setNovaTyping(id);
    const reply = await novaReply(text);
    addComment(id, reply, "u7");
    setNovaTyping(null);
  };

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card p-4">
          <div className="flex gap-3">
            <Avatar id={ME} />
            <div className="min-w-0 flex-1">
              <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} placeholder="Share a trade idea, a question or a lesson…" className="w-full resize-none bg-transparent pt-2 text-[15px] outline-none placeholder:text-muted" aria-label="Post text" />
              <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                {KINDS.map((k) => (
                  <button key={k.value} onClick={() => setKind(k.value)} className={cn("rounded-full px-3 py-1 text-xs font-medium", kind === k.value ? "bg-ink text-bg" : "bg-panel-2 text-ink-2")}>{k.label}</button>
                ))}
                <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="$TICKER" className="h-7 w-24 rounded-full border border-line bg-transparent px-3 text-xs uppercase outline-none" aria-label="Ticker" />
                <button onClick={submit} disabled={!body.trim()} className="ml-auto inline-flex h-10 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink disabled:opacity-40">
                  <Send className="size-4" /> Post
                </button>
              </div>
              <p className="mt-2 text-xs text-muted">Posts follow the <Link href="/community-guidelines" className="text-ink-2 underline underline-offset-2">community guidelines</Link>. Nothing here is investment advice.</p>
            </div>
          </div>
        </div>

        {feed.map((p) => {
          const author = p.authorId === ME ? null : MEMBER_MAP[p.authorId];
          return (
            <article key={p.id} className="card p-4 sm:p-5">
              <header className="flex items-center gap-3">
                <Avatar id={p.authorId} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 text-sm">
                    <span className="font-semibold">{author ? author.name : "You"}</span>
                    {author?.badge && <Pill className={author.id === "u7" ? "bg-accent-soft text-ink" : ""}>{author.id === "u7" && <Sparkles className="size-3" />}{author.badge}</Pill>}
                    {p.authorId === "u7" && <Pill className="bg-accent-soft text-ink">AI-generated</Pill>}
                    {p.demo && <DemoTag what="post" />}
                    <span className="text-muted">@{author?.handle ?? "you"} · {timeAgo(p.at)}</span>
                  </div>
                  <div className="text-xs text-muted">{KIND_LABEL[p.kind]}{p.symbol && <> · <Link href={`/markets/${p.symbol}`} className="font-semibold text-series-1 hover:underline">${p.symbol}</Link></>}</div>
                </div>
              </header>
              <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed">{p.body}</p>
              <div className="mt-3 flex items-center gap-1 text-sm text-muted">
                <button onClick={() => toggleLike(p.id)} data-like className={cn("inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 hover:bg-panel-2", liked[p.id] && "text-down")} aria-pressed={!!liked[p.id]} aria-label={liked[p.id] ? "Unlike" : "Like"}>
                  <Heart className={cn("size-4", liked[p.id] && "fill-current")} />
                  {(!p.demo || p.likeCount > 0) && <span className="tnum" data-like-count>{p.likeCount}</span>}
                </button>
                <button onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 hover:bg-panel-2" aria-label={`Comments, ${p.allComments.length}`}>
                  <MessageCircle className="size-4" /> <span className="tnum">{p.allComments.length}</span>
                </button>
                <button onClick={() => report(p.id)} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-2.5 hover:bg-panel-2" aria-label="Report post">
                  <Flag className="size-4" /> Report
                </button>
              </div>
              {(open[p.id] || novaTyping === p.id) && (
                <div className="mt-3 space-y-3 border-t border-line pt-3">
                  {p.allComments.map((c) => (
                    <div key={c.id} className="flex gap-2.5">
                      <Avatar id={c.authorId} size={28} />
                      <div className="min-w-0 rounded-2xl bg-panel-2 px-3 py-2 text-sm">
                        <span className="font-semibold">{c.authorId === ME ? "You" : MEMBER_MAP[c.authorId]?.name}</span>{c.authorId === "u7" && <Pill className="mx-1.5 bg-accent-soft text-ink">AI-generated</Pill>}{c.demo && <span className="mx-1.5"><DemoTag what="comment" /></span>}{" "}
                        <CommentBody text={c.body} />
                        <div>
                          <button onClick={() => report(c.id)} className="-ml-2 inline-flex min-h-10 items-center gap-1 rounded-lg px-2 text-xs font-medium text-muted hover:text-ink" aria-label="Report comment">
                            <Flag className="size-3.5" /> Report
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {novaTyping === p.id && (
                    <div className="flex items-center gap-2 text-sm text-muted"><Sparkles className="size-4 animate-pulse text-coach" /> Nova is replying…</div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const t = (draft[p.id] ?? "").trim();
                      if (!t) return;
                      addComment(p.id, t);
                      setDraft((d) => ({ ...d, [p.id]: "" }));
                    }}
                    className="flex gap-2"
                  >
                    <input value={draft[p.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))} placeholder="Add a comment…" className="h-9 flex-1 rounded-full border border-line bg-transparent px-4 text-sm outline-none" aria-label="Comment" />
                    <button className="h-9 rounded-full border border-line px-4 text-sm font-medium hover:bg-panel-2">Reply</button>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <aside className="space-y-4">
        <MiniLeaders />
        <section className="card p-5">
          <SectionTitle title="Community guidelines" />
          <ul className="space-y-2 text-sm text-ink-2">
            <li>• Share your reasoning, not just your result.</li>
            <li>• Post losses too. They teach the most.</li>
            <li>• No real-money tips or pump talk.</li>
            <li>• Be kind. Everyone starts as a rookie.</li>
          </ul>
          <p className="mt-3 text-sm"><Link href="/community-guidelines" className="text-series-1 underline underline-offset-2">Read the full guidelines</Link>. Use Report on any post or comment to flag it.</p>
        </section>
      </aside>
    </div>
  );
}

/** Marks sample content. Text, not color alone. */
function DemoTag({ what }: { what: string }) {
  return <span className="inline-flex items-center rounded-full border border-line px-2 py-0.5 text-xs font-medium text-ink-2" title={`Demo ${what}: sample content, fictional`} data-demo>Demo</span>;
}

function CommentBody({ text }: { text: string }) {
  // render [label](/path) links inline
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((s, i) => {
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(s);
        if (m && m[2].startsWith("/")) return <Link key={i} href={m[2]} className="text-series-1 underline">{m[1]}</Link>;
        return <span key={i}>{s.replace(/\*\*/g, "")}</span>;
      })}
    </>
  );
}

function useMyRow() {
  const equity = useEquity();
  const trades = useApp((s) => s.trades);
  const xp = useApp((s) => s.xp);
  const name = useApp((s) => s.profile.name);
  const entries = trades.filter((t) => t.role === "entry");
  const closed = trades.filter((t) => t.realizedPnl != null);
  return {
    id: ME,
    name: name || "You",
    handle: "you",
    level: levelFor(xp).name,
    returnPct: (equity - STARTING_CASH) / STARTING_CASH,
    winRate: closed.length ? closed.filter((t) => (t.realizedPnl ?? 0) > 0).length / closed.length : 0,
    disciplineScore: entries.length ? Math.round(entries.reduce((a, t) => a + t.score, 0) / entries.length) : 0,
    hue: 95,
    bio: "",
  };
}

function Leaderboard() {
  const [by, setBy] = useState<"disciplineScore" | "returnPct">("disciplineScore");
  const me = useMyRow();
  const following = useApp((s) => s.following);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const rows = [...MEMBERS.filter((m) => m.id !== "u7"), me].sort((a, b) => b[by] - a[by]);
  return (
    <section className="card p-2 sm:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 px-2 pb-3 pt-1">
        <p className="text-sm text-ink-2">{by === "disciplineScore" ? "Ranked by average coach score: process over luck." : "Ranked by simulated total return since start."}</p>
        <Segmented value={by} onChange={setBy} options={[{ value: "disciplineScore", label: "Discipline" }, { value: "returnPct", label: "Return" }]} />
      </div>
      <p className="px-2 pb-3 text-xs text-muted" data-testid="sim-results-note"><strong className="font-semibold text-ink-2">Simulated results.</strong> Not real trades. They don&apos;t include fees, slippage or real market conditions, and past simulated results don&apos;t predict real ones. Rows marked Demo are fictional.</p>
      <ol className="divide-y divide-line">
        {rows.map((r, i) => (
          <li key={r.id} className={cn("flex items-center gap-3 px-2 py-3", r.id === ME && "rounded-2xl bg-accent-soft")}>
            <span className="tnum w-6 text-center text-sm font-semibold text-muted">{i + 1}</span>
            <Avatar id={r.id} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium">{r.name}{r.id !== ME && <span className="ml-2 align-middle"><DemoTag what="member" /></span>} {i === 0 && <Trophy className="inline size-4 text-warn" aria-label="First place" />}</div>
              <div className="truncate text-xs text-muted">{r.level}{"bio" in r && r.bio ? ` · ${r.bio}` : ""}</div>
            </div>
            <div className="hidden w-20 text-right text-sm sm:block">
              <div className="tnum font-semibold">{r.disciplineScore || "—"}</div>
              <div className="text-xs text-muted">score</div>
            </div>
            <div className="w-20 text-right text-sm">
              <Delta ratio={r.returnPct} size="xs" />
              <div className="text-xs text-muted">{pct(r.winRate, 0, false)} wins</div>
            </div>
            {r.id !== ME ? (
              <button onClick={() => toggleFollow(r.id)} className={cn("hidden h-8 rounded-full px-3 text-xs font-semibold sm:block", following[r.id] ? "border border-line text-muted" : "bg-ink text-bg")}>
                {following[r.id] ? "Following" : "Follow"}
              </button>
            ) : (
              <span className="hidden w-[72px] sm:block" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

function MiniLeaders() {
  const me = useMyRow();
  const rows = [...MEMBERS.filter((m) => m.id !== "u7"), me].sort((a, b) => b.disciplineScore - a.disciplineScore).slice(0, 5);
  return (
    <section className="card p-5">
      <SectionTitle title="Discipline leaders" action={<Award className="size-4 text-muted" />} />
      <p className="-mt-2 mb-3 text-xs text-muted">Demo members, simulated scores.</p>
      <ol className="space-y-3">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 text-sm">
            <span className="tnum w-4 text-muted">{i + 1}</span>
            <Avatar id={r.id} size={28} />
            <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
            <span className="tnum font-semibold">{r.disciplineScore || "—"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Challenges() {
  const following = useApp((s) => s.following);
  const toggleFollow = useApp((s) => s.toggleFollow);
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {CHALLENGES.map((c) => {
        const joined = !!following[`challenge:${c.id}`];
        return (
          <section key={c.id} className="card flex flex-col p-5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted"><Flame className="size-4 text-warn" /> Ends in {c.endsInDays} days <DemoTag what="challenge" /></div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight">{c.title}</h2>
            <p className="mt-1 flex-1 text-sm text-ink-2">{c.detail}</p>
            <div className="mt-4 flex items-center justify-between text-xs text-muted">
              <span>{joined ? "You joined" : "Sample challenge"}</span>
              <span className="font-semibold text-accent">+{c.xp} XP</span>
            </div>
            <button onClick={() => toggleFollow(`challenge:${c.id}`)} className={cn("mt-3 h-10 rounded-full text-sm font-semibold", joined ? "border border-line text-ink-2" : "bg-accent text-accent-ink")}>
              {joined ? "Joined ✓" : "Join challenge"}
            </button>
          </section>
        );
      })}
    </div>
  );
}
