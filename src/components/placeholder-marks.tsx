"use client";

import { useEffect } from "react";
import { LEGAL } from "@/lib/legal";

/**
 * Draft placeholders in the legal texts (the bracketed values in src/lib/legal.ts) are shown with a visible
 * "to be completed" style so they read as intentional blanks. Nothing renders once the owner fills them in.
 */
export function PlaceholderMarks() {
  useEffect(() => {
    const values = (Object.values(LEGAL) as unknown[]).filter((v): v is string => typeof v === "string" && /^\[.+\]/.test(v));
    if (!values.length) return;
    const root = document.querySelector(".prose-legal");
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    for (let n = walker.nextNode(); n; n = walker.nextNode()) if (values.some((v) => (n as Text).data.includes(v))) nodes.push(n as Text);
    for (const node of nodes) {
      if (node.parentElement?.closest("mark.ph")) continue;
      const frag = document.createDocumentFragment();
      let rest = node.data;
      while (rest) {
        let at = -1;
        let hit = "";
        for (const v of values) {
          const i = rest.indexOf(v);
          if (i !== -1 && (at === -1 || i < at)) { at = i; hit = v; }
        }
        if (at === -1) { frag.append(rest); break; }
        frag.append(rest.slice(0, at));
        const m = document.createElement("mark");
        m.className = "ph";
        m.title = "To be completed before launch";
        m.textContent = hit;
        frag.append(m);
        rest = rest.slice(at + hit.length);
      }
      node.replaceWith(frag);
    }
  }, []);
  return null;
}
