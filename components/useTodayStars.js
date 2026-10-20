"use client";
import { useEffect, useState } from "react";
import { api } from "./ui";
import { localDay } from "../lib/dates.mjs";

// Refresh only the counter: a date rollover must never replace a board or quiz.
export default function useTodayStars(data) {
  const [view, setView] = useState(null);
  useEffect(() => {
    if (!data) return;
    let active = true,
      pending = false,
      day = data.today,
      retryAfter = 0;
    async function refresh(force = false) {
      const today = localDay(Date.now(), data.timezone);
      if (pending || Date.now() < retryAfter || (!force && today === day))
        return;
      if (today !== day) setView({ source: data, today, todayStars: 0 });
      pending = true;
      try {
        const next = await api("state");
        if (active) {
          day = next.today;
          setView({
            source: data,
            today: next.today,
            todayStars: next.todayStars,
          });
        }
      } catch {
        // Keep the new day's zero while offline; retry without interrupting play.
        retryAfter = Date.now() + 60000;
      } finally {
        pending = false;
      }
    }
    const focus = () => refresh(true);
    const visible = () => {
      if (!document.hidden) refresh(true);
    };
    const timer = window.setInterval(() => refresh(), 1000);
    window.addEventListener("focus", focus);
    document.addEventListener("visibilitychange", visible);
    refresh();
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", focus);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [data]);
  return view?.source === data ? view.todayStars : data?.todayStars || 0;
}
