/**
 * Three-way merge of persisted state between tabs. `base` is what this tab last saw in storage, `ours` is this tab's
 * state now, `theirs` is what storage holds now. Rules:
 * - a side that did not change a value loses to the side that did;
 * - lists of entities (orders, trades, posts, comments, chat, equity points) are merged by id, so nothing either tab
 *   added is lost and nothing either tab deleted comes back;
 * - maps merge key by key, recursively;
 * - scalars changed on both sides: this tab (the last writer) wins.
 */
type Rec = Record<string, unknown>;
const isRec = (v: unknown): v is Rec => !!v && typeof v === "object" && !Array.isArray(v);
const same = (a: unknown, b: unknown) => a === b || JSON.stringify(a) === JSON.stringify(b);

/** Sort direction and cap for the app's known entity lists, by key. */
const LISTS: Record<string, { dir: "asc" | "desc"; by: string; cap?: number }> = {
  orders: { dir: "desc", by: "at" },
  trades: { dir: "desc", by: "at", cap: 500 },
  posts: { dir: "desc", by: "at" },
  chat: { dir: "asc", by: "at", cap: 100 },
  equityHistory: { dir: "asc", by: "t", cap: 3000 },
};

const keyOf = (x: unknown): string => (isRec(x) ? String(x.id ?? x.t ?? JSON.stringify(x)) : JSON.stringify(x));

function mergeList(base: unknown[], ours: unknown[], theirs: unknown[], name: string): unknown[] {
  const idx = (a: unknown[]) => new Map(a.map((x) => [keyOf(x), x] as const));
  const b = idx(base), o = idx(ours), t = idx(theirs);
  const out = new Map<string, unknown>();
  for (const k of new Set([...t.keys(), ...o.keys()])) {
    const inB = b.has(k), inO = o.has(k), inT = t.has(k);
    if (inO && inT) out.set(k, merge3(b.get(k), o.get(k), t.get(k), name));
    else if (inO) {
      if (!inB || !same(o.get(k), b.get(k))) out.set(k, o.get(k)); // new from us, or changed by us after they deleted it
    } else if (inT) {
      if (!inB || !same(t.get(k), b.get(k))) out.set(k, t.get(k)); // new from them, or changed by them after we deleted it
    }
  }
  let list = [...out.values()];
  const spec = LISTS[name];
  if (spec && list.every((x) => isRec(x) && typeof x[spec.by] === "number")) {
    list.sort((x, y) => ((x as Rec)[spec.by] as number) - ((y as Rec)[spec.by] as number));
    if (spec.dir === "desc") list.reverse();
    if (spec.cap) list = spec.dir === "desc" ? list.slice(0, spec.cap) : list.slice(-spec.cap);
  } else if (!spec && list.length && list.every((x) => isRec(x) && typeof x.at === "number")) {
    list.sort((x, y) => ((x as Rec).at as number) - ((y as Rec).at as number)); // comment lists
  }
  return list;
}

export function merge3(base: unknown, ours: unknown, theirs: unknown, name = ""): unknown {
  if (same(ours, base)) return theirs;
  if (same(theirs, base)) return ours;
  if (same(ours, theirs)) return ours;
  if (Array.isArray(ours) && Array.isArray(theirs)) return mergeList(Array.isArray(base) ? base : [], ours, theirs, name);
  if (isRec(ours) && isRec(theirs)) {
    const b = isRec(base) ? base : {};
    const out: Rec = {};
    for (const k of new Set([...Object.keys(theirs), ...Object.keys(ours)])) {
      const inO = k in ours, inT = k in theirs, inB = k in b;
      if (inO && inT) out[k] = merge3(b[k], ours[k], theirs[k], k);
      else if (inO) {
        if (!inB || !same(ours[k], b[k])) out[k] = ours[k];
      } else if (!inB || !same(theirs[k], b[k])) out[k] = theirs[k];
    }
    return out;
  }
  return ours;
}

/** Merge three raw persisted blobs ({ state, version }). Falls back to ours if anything does not parse. */
export function mergeRaw(baseRaw: string | null, oursRaw: string, theirsRaw: string): string {
  try {
    const t = JSON.parse(theirsRaw), o = JSON.parse(oursRaw);
    const b = baseRaw ? JSON.parse(baseRaw) : { state: {} };
    return JSON.stringify({ ...t, state: merge3(b.state ?? {}, o.state, t.state) });
  } catch {
    return oursRaw;
  }
}
