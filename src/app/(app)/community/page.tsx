"use client";

import { BRAND } from "@/lib/brand";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useApp, useEquity, usePlan, ME, STARTING_CASH } from "@/store/app";
import { can } from "@/lib/plans";
import { PaywallDialog, PlanTag } from "@/components/paywall";
import { CHALLENGES, MEMBERS, MEMBER_MAP, SEED_POSTS } from "@/lib/community-seed";
import { TICKER_MAP } from "@/lib/market-data";
import { buildCoachContext } from "@/lib/coach-context";
import { levelFor } from "@/lib/course";
import { cn, pct, timeAgo } from "@/lib/format";
import { aiGate } from "@/lib/ai-notice";
import { useToast } from "@/store/toast";
import { Avatar, Delta, Segmented, SectionTitle, TabPanel } from "@/components/ui";
import { CheckCell, NovaByline, ScoreLoop } from "@/components/marks";

type Tab = "feed" | "leaders" | "challenges";
const KINDS = [
  { value: "idea", label: "Trade idea" },
  { value: "question", label: "Question" },
  { value: "win", label: "Win" },
  { value: "lesson", label: "Lesson" },
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
    <div>
      <h1 className="t-title">Community</h1>
      <p className="mt-2 max-w-[72ch] t-lead">Share ideas and lessons. Ranked on process, not profit.</p>
      <Segmented kind="tabs" idBase="community" label="Community sections" size="md" value={tab} onChange={setTab} options={[{ value: "feed", label: "Feed" }, { value: "leaders", label: "Leaderboard" }, { value: "challenges", label: "Challenges" }]} className="mt-6" />
      <p className="mt-4 flex flex-wrap items-baseline gap-2 t-small text-ink-2">
        <span className="tag">Demo</span>
        <span className="min-w-0 flex-1">Preview community. Members, posts, comments and leaderboard rows marked Demo are fictional sample content. Your posts are yours, and Nova&apos;s replies are marked AI-generated.</span>
      </p>
      <TabPanel idBase="community" value={tab} className="mt-8">
        {tab === "feed" && <Feed />}
        {tab === "leaders" && <Leaderboard />}
        {tab === "challenges" && <Challenges />}
      </TabPanel>
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
    <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0">
        <div className="flex gap-3 border-y border-rule-strong py-4">
          <Avatar id={ME} />
          <div className="min-w-0 flex-1">
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} maxLength={2000} placeholder="Write a post. A trade idea, a question, or something you learned." className="field resize-y" aria-label="Post text" />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Segmented label="Post type" value={kind} onChange={setKind} options={KINDS.map((k) => ({ value: k.value, label: k.label }))} className="flex-wrap" />
              <input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="Ticker" maxLength={6} className="field min-h-10 w-24 uppercase" aria-label="Ticker" />
              <button onClick={submit} disabled={!body.trim()} className="btn btn-primary ml-auto">
                Post
              </button>
            </div>
            <p className="mt-2 t-micro text-ink-2">
              Posts follow the{" "}
              <Link href="/community-guidelines" className="link">
                community guidelines
              </Link>
              . Nothing here is investment advice.
            </p>
          </div>
        </div>

        {feed.map((p) => {
          const author = p.authorId === ME ? null : MEMBER_MAP[p.authorId];
          return (
            <article key={p.id} className="border-b border-rule py-5">
              <header className="flex items-start gap-3">
                <Avatar id={p.authorId} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 t-small">
                    <span className="font-semibold">{author ? author.name : "You"}</span>
                    {p.authorId === ME && <EliteBadge />}
                    {p.authorId === "u7" && <span className="tag tag-nova">AI coach</span>}
                    {author?.badge && p.authorId !== "u7" && <span className="tag">{author.badge}</span>}
                    {p.authorId === "u7" && <span className="tag tag-nova">AI-generated</span>}
                    {p.demo && <DemoTag what="post" />}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 t-micro text-ink-2">
                    <span>@{author?.handle ?? "you"}</span>
                    {!p.demo && <span>{timeAgo(p.at)}</span>}
                    <span>{KIND_LABEL[p.kind]}</span>
                    {p.symbol && (
                      <Link href={`/markets/${p.symbol}`} className="link inline-flex min-h-10 items-center font-semibold">
                        {p.symbol}
                      </Link>
                    )}
                  </div>
                </div>
              </header>
              <p className="mt-3 whitespace-pre-line break-words text-[15px] leading-6 [overflow-wrap:anywhere]">{p.body}</p>
              <div className="mt-2 flex items-center gap-1 t-small text-ink-2">
                <button onClick={() => toggleLike(p.id)} data-like className={cn("inline-flex min-h-10 w-14 items-center justify-start gap-2 rounded-md px-2 hover:bg-well", liked[p.id] && "text-ink")} aria-pressed={!!liked[p.id]} aria-label="Like this post">
                  <CheckCell state={liked[p.id] ? "done" : "todo"} size={20} ink />
                  {(!p.demo || p.likeCount > 0) && (
                    <span className="tnum" data-like-count>
                      {p.likeCount}
                    </span>
                  )}
                </button>
                <button onClick={() => setOpen((o) => ({ ...o, [p.id]: !o[p.id] }))} aria-expanded={!!open[p.id]} className="inline-flex min-h-10 items-center gap-1 rounded-md px-2 hover:bg-well">
                  Comments <span className="tnum">{p.allComments.length}</span>
                </button>
                <button onClick={() => report(p.id)} className="ml-auto inline-flex min-h-10 items-center rounded-md px-2 hover:bg-well" aria-label="Report post">
                  Report
                </button>
              </div>
              {(open[p.id] || novaTyping === p.id) && (
                <div className="mt-2 space-y-4 border-t border-rule pt-4 sm:ml-11">
                  {p.allComments.map((c) =>
                    /* the comment body keeps the rounded-2xl hook verify uses; it has no background, so the radius is invisible */
                    c.authorId === "u7" ? (
                      <div key={c.id} className="nova-note rounded-2xl t-small">
                        <NovaByline
                          tag="AI coach"
                          extra={
                            <>
                              <span className="tag tag-nova">AI-generated</span>
                              {c.demo && <DemoTag what="comment" />}
                            </>
                          }
                        />
                        <div className="t-note mt-1">
                          <CommentBody text={c.body} />
                        </div>
                        <button onClick={() => report(c.id)} className="-ml-2 inline-flex min-h-10 items-center rounded-md px-2 t-micro text-ink-2 hover:text-ink" aria-label="Report comment">
                          Report
                        </button>
                      </div>
                    ) : (
                      <div key={c.id} className="flex gap-2.5">
                        <Avatar id={c.authorId} size={28} />
                        <div className="min-w-0 rounded-2xl t-small">
                          <span className="font-semibold">{c.authorId === ME ? "You" : MEMBER_MAP[c.authorId]?.name}</span>
                          {c.demo && (
                            <span className="mx-1.5">
                              <DemoTag what="comment" />
                            </span>
                          )}{" "}
                          <span className="block break-words [overflow-wrap:anywhere]">
                            <CommentBody text={c.body} />
                          </span>
                          <button onClick={() => report(c.id)} className="-ml-2 inline-flex min-h-10 items-center rounded-md px-2 t-micro text-ink-2 hover:text-ink" aria-label="Report comment">
                            Report
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                  {novaTyping === p.id && <p className="nova-note t-small text-ink-2">Nova is replying.</p>}
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
                    <input value={draft[p.id] ?? ""} onChange={(e) => setDraft((d) => ({ ...d, [p.id]: e.target.value }))} maxLength={1000} placeholder="Add a comment" className="field min-h-10 min-w-0 flex-1" aria-label="Comment" />
                    <button className="btn btn-secondary">Reply</button>
                  </form>
                </div>
              )}
            </article>
          );
        })}
      </div>
      <aside className="min-w-0 space-y-12">
        <MiniLeaders />
        <section aria-labelledby="guide-h">
          <SectionTitle id="guide-h" title="Guidelines" />
          <ul className="space-y-2 t-small text-ink-2">
            <li>Share your reasoning, not just your result.</li>
            <li>Post losses too. They teach the most.</li>
            <li>No real-money tips or pump talk.</li>
            <li>Be kind. Everyone starts somewhere.</li>
          </ul>
          <p className="mt-3 t-small">
            <Link href="/community-guidelines" className="link">
              Read the full guidelines
            </Link>
            . Use Report on any post or comment to flag it.
          </p>
        </section>
      </aside>
    </div>
  );
}

/** Elite members' badge. Shown only on the user's own posts and rows: demo members never get a paid badge. */
function EliteBadge() {
  const plan = usePlan();
  if (!can(plan, "elite-badge")) return null;
  return (
    <span className="tag tag-plan" data-elite-badge>
      Elite
    </span>
  );
}

/** Marks sample content. Text, not colour alone. */
function DemoTag({ what }: { what: string }) {
  return (
    <span className="tag" title={`Demo ${what}: sample content, fictional`} data-demo>
      Demo
    </span>
  );
}

function CommentBody({ text }: { text: string }) {
  // render [label](/path) links inline
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return (
    <>
      {parts.map((s, i) => {
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(s);
        if (m && m[2].startsWith("/"))
          return (
            <Link key={i} href={m[2]} className="link">
              {m[1]}
            </Link>
          );
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
    <section aria-labelledby="lb-h" className="max-w-[880px]">
      <div className="sec-head">
        <h2 id="lb-h" className="t-h2">
          Leaderboard
        </h2>
        <Segmented label="Rank by" value={by} onChange={setBy} options={[{ value: "disciplineScore", label: "Process score" }, { value: "returnPct", label: "Return" }]} />
      </div>
      <p className="mt-3 t-small text-ink-2">{by === "disciplineScore" ? "Ranked by average process score. Process over luck." : "Ranked by simulated total return since the start."}</p>
      <p className="mt-1 t-micro text-ink-2" data-testid="sim-results-note">
        <strong className="font-semibold text-ink">Simulated results.</strong> Not real trades. They include a small simulated slippage but no fees, taxes or real market conditions, and past simulated results don&apos;t predict real ones. Rows marked Demo are fictional.
      </p>
      <ol className="mt-4 border-t border-rule-strong">
        {rows.map((r, i) => (
          <li key={r.id} className={cn("grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-rule py-3 sm:grid-cols-[28px_minmax(0,1fr)_80px_96px_96px]", r.id === ME && "bg-well")}>
            <span className="tnum text-center t-small font-semibold text-ink-2">{i + 1}</span>
            <div className="flex min-w-0 items-center gap-3">
              <Avatar id={r.id} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-medium">
                  <span className="truncate">{r.name}</span>
                  {r.id !== ME ? <DemoTag what="member" /> : <EliteBadge />}
                </div>
                <div className="truncate t-micro text-ink-2">{r.level}</div>
              </div>
            </div>
            <div className="hidden text-right sm:block">{r.disciplineScore ? <ScoreLoop score={r.disciplineScore} size="s" /> : <span className="t-small text-ink-2">None</span>}</div>
            <div className="text-right t-small">
              <Delta ratio={r.returnPct} size="xs" />
              <div className="t-micro text-ink-2">{pct(r.winRate, 0, false)} wins</div>
            </div>
            {r.id !== ME ? (
              <button onClick={() => toggleFollow(r.id)} aria-pressed={!!following[r.id]} className="btn btn-secondary hidden min-h-10 px-3 t-small sm:inline-flex">
                {following[r.id] ? "Following" : "Follow"}
              </button>
            ) : (
              <span className="hidden sm:block" />
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
    <section aria-labelledby="ml-h">
      <SectionTitle id="ml-h" title="Process leaders" />
      <p className="mb-2 t-micro text-ink-2">Demo members, simulated scores.</p>
      <ul className="t-small">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3 border-b border-rule py-2">
            <span className="tnum w-4 text-ink-2">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate font-medium">{r.name}</span>
            {r.id !== ME ? <DemoTag what="member" /> : <EliteBadge />}
            <span className="tnum font-semibold">{r.disciplineScore || "None"}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Challenges() {
  const following = useApp((s) => s.following);
  const toggleFollow = useApp((s) => s.toggleFollow);
  const plan = usePlan();
  const canJoin = can(plan, "challenges");
  const [paywall, setPaywall] = useState(false);
  return (
    <div className="max-w-[880px] border-t border-rule-strong">
      {CHALLENGES.map((c) => {
        const joined = !!following[`challenge:${c.id}`];
        return (
          <section key={c.id} aria-labelledby={`ch-${c.id}`} className="grid grid-cols-1 gap-3 border-b border-rule py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id={`ch-${c.id}`} className="t-h3">
                  {c.title}
                </h2>
                <DemoTag what="challenge" />
              </div>
              <p className="mt-1 t-small text-ink-2">{c.detail}</p>
              <p className="tnum mt-1 t-micro text-ink-2">
                Ends in {c.endsInDays} days. {c.xp} XP. {joined ? "You joined." : "Sample challenge."}
              </p>
            </div>
            {canJoin || joined ? (
              <button onClick={() => toggleFollow(`challenge:${c.id}`)} aria-pressed={joined} className={cn("btn", joined ? "btn-secondary" : "btn-primary")}>
                {joined ? "Joined" : "Join challenge"}
              </button>
            ) : (
              <span className="flex items-center gap-2">
                <PlanTag feature="challenges" />
                <button onClick={() => setPaywall(true)} aria-haspopup="dialog" className="btn btn-secondary">
                  Join challenge
                </button>
              </span>
            )}
          </section>
        );
      })}
      {paywall && <PaywallDialog gate="challenges" onClose={() => setPaywall(false)} />}
    </div>
  );
}
