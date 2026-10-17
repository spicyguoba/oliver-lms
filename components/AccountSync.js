"use client";
import { useEffect } from "react";
export default function AccountSync() {
  useEffect(() => {
    let identity,
      active = true,
      pending = false;
    async function check() {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const r = await fetch("/api/identity", { cache: "no-store" });
        if (r.status !== 200 && r.status !== 401) return;
        const d = r.ok ? await r.json() : null;
        const next = d ? `${d.id}:${d.role}:${d.learnerId}` : "signed-out";
        if (active && identity !== undefined && next !== identity)
          window.location.reload();
        if (active) identity = next;
      } catch {
      } finally {
        pending = false;
      }
    }
    const changed = (e) => {
      if (e.key === "lms-auth-changed-v1") window.location.reload();
    };
    const restored = (e) => {
      if (e.persisted) window.location.reload();
    };
    check();
    window.addEventListener("storage", changed);
    window.addEventListener("focus", check);
    window.addEventListener("pageshow", restored);
    document.addEventListener("visibilitychange", check);
    return () => {
      active = false;
      window.removeEventListener("storage", changed);
      window.removeEventListener("focus", check);
      window.removeEventListener("pageshow", restored);
      document.removeEventListener("visibilitychange", check);
    };
  }, []);
  return null;
}
