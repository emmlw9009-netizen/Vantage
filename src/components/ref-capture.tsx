"use client";

import { useEffect } from "react";
import { useApp } from "@/store/app";

/** Stores ?ref=<code> once in the profile (referredBy). Renders nothing. No rewards yet. */
export function RefCapture() {
  useEffect(() => {
    try {
      const code = new URLSearchParams(location.search).get("ref")?.trim().toLowerCase() ?? "";
      if (!/^[a-z0-9_-]{1,32}$/.test(code)) return;
      const s = useApp.getState();
      if (s.profile.referredBy) return;
      s.setProfile({ referredBy: code });
    } catch {}
  }, []);
  return null;
}
