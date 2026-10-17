import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { transact, databaseMode } from "../../../lib/store.mjs";
import { legacyProgress } from "../../../lib/progress.mjs";
import { vocabularyLesson } from "../../../lib/vocabulary.mjs";
import { sanitizeLegacyMap } from "../../../lib/legacy-save.mjs";
import {
  verifyPassword,
  hashPassword,
  signSession,
  readSession,
} from "../../../lib/security.mjs";
import {
  beginSession,
  submitAnswer,
  nextQuestion,
  sessionView,
  stats,
  recommendations,
  localDay,
} from "../../../lib/learning.mjs";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;
const devSecret = randomBytes(48).toString("hex");
const secret = () => process.env.SESSION_SECRET || devSecret;
function fail(message, status = 400) {
  throw Object.assign(new Error(message), { status });
}
function actor(req, data) {
  for (const role of ["admin", "child"]) {
    const s = readSession(
      req.cookies.get(`oliver-${role}`)?.value || "",
      secret(),
    );
    if (
      s?.role === role &&
      s.v ===
        (role === "admin"
          ? data.settings.authVersion
          : data.settings.childVersion)
    )
      return role;
  }
  return null;
}
function requireRole(req, data, admin = false) {
  const role = actor(req, data);
  if (!role || (admin && role !== "admin"))
    fail(
      admin ? "Parent sign-in required." : "Sign in to start your adventure.",
      401,
    );
  return role;
}
function setCookie(res, role, data, clear = false) {
  res.cookies.set(
    `oliver-${role}`,
    clear
      ? ""
      : signSession(
          {
            role,
            v:
              role === "admin"
                ? data.settings.authVersion
                : data.settings.childVersion,
            exp: Date.now() + (role === "admin" ? 12 * 3600000 : 30 * 86400000),
          },
          secret(),
        ),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: clear ? 0 : role === "admin" ? 43200 : 2592000,
    },
  );
}
function safeState(d, role) {
  return {
    role,
    timezone: d.settings.timezone,
    legacyProgress: legacyProgress(d),
    profile: d.profile,
    stars: d.stars,
    stats: stats(d),
    recommendations: recommendations(d),
    rewards: d.rewards,
    redemptions: d.redemptions,
    assignments: d.assignments
      .filter((x) => !x.archived)
      .map((a) => ({
        ...a,
        material: d.materials.find((m) => m.id === a.materialId) || null,
      })),
    completions: d.completions,
    storyProgress: d.storyProgress,
    activeSessions: d.sessions.filter((s) => !s.finishedAt).map(sessionView),
    todayCompleted: d.sessions.filter(
      (s) =>
        s.finishedAt &&
        localDay(s.finishedAt, d.settings.timezone) ===
          localDay(Date.now(), d.settings.timezone),
    ).length,
    todayMinutes: Math.round(
      d.sessions
        .filter(
          (s) =>
            s.finishedAt &&
            localDay(s.finishedAt, d.settings.timezone) ===
              localDay(Date.now(), d.settings.timezone),
        )
        .flatMap((s) => s.attempts)
        .reduce((n, a) => n + Math.min(a.activeMs, 600000), 0) / 60000,
    ),
    storage: databaseMode(),
  };
}
export async function GET(req, context) {
  try {
    const { path: p } = await context.params;
    const route = p.join("/");
    return await transact(async (d) => {
      if (route === "health")
        return NextResponse.json({ ok: true, storage: databaseMode() });
      const role = requireRole(
        req,
        d,
        route === "admin" || route === "admin/export",
      );
      if (route === "state") return NextResponse.json(safeState(d, role));
      if (p[0] === "lesson" && p.length === 2) {
        const lesson = vocabularyLesson(p[1]);
        if (!lesson) fail("Word pack not found.", 404);
        return NextResponse.json(lesson);
      }
      if (route === "admin")
        return NextResponse.json({
          ...safeState(d, role),
          materials: d.materials,
          history: d.sessions
            .map(({ questions, ...s }) => s)
            .slice()
            .reverse(),
          legacyEvents: d.legacyEvents.slice(-200).reverse(),
          settings: {
            timezone: d.settings.timezone,
            defaultPassword: d.settings.defaultPassword,
          },
          allAssignments: d.assignments,
        });
      if (route === "admin/export")
        return new NextResponse(
          JSON.stringify(
            { ...d, settings: { timezone: d.settings.timezone } },
            null,
            2,
          ),
          {
            headers: {
              "Content-Type": "application/json",
              "Content-Disposition":
                'attachment; filename="oliver-learning-backup.json"',
            },
          },
        );
      if (p[0] === "session") {
        const s = d.sessions.find((x) => x.id === p[1]);
        if (!s) fail("Adventure not found.", 404);
        return NextResponse.json(sessionView(s));
      }
      if (p[0] === "game" && ["math", "reading", "stories"].includes(p[1])) {
        const game = p[1];
        let html = await fs.readFile(
          path.join(process.cwd(), "legacy", `${game}.html`),
          "utf8",
        );
        const saved = JSON.stringify(
          sanitizeLegacyMap(game, d.legacy[game]),
        ).replaceAll("<", "\\u003c");
        html = html
          .replace("<head>", '<head><base target="_self">')
          .replace(
            "<script>",
            `<script>window.__LMS_GAME__=${JSON.stringify(game)};window.__LMS_SAVED__=${saved};</script><script src="/game-bridge.js"></script><script>`,
          );
        return new NextResponse(html, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "private, no-store",
          },
        });
      }
      fail("Not found.", 404);
    });
  } catch (e) {
    return errorResponse(e);
  }
}
export async function POST(req, context) {
  try {
    const origin = req.headers.get("origin");
    let source;
    try {
      source = new URL(origin);
    } catch {
      fail("Please submit from this site.", 403);
    }
    if (
      source.host !== req.headers.get("host") ||
      !["http:", "https:"].includes(source.protocol)
    )
      fail("Please submit from this site.", 403);
    const raw = await req.text();
    if (Buffer.byteLength(raw) > 1000000)
      fail("This import is too large.", 413);
    let body;
    try {
      body = JSON.parse(raw || "{}");
    } catch {
      fail("Invalid JSON.");
    }
    if (!body || typeof body !== "object" || Array.isArray(body))
      fail("Expected a JSON object.");
    const { path: p } = await context.params;
    const route = p.join("/");
    return await transact(async (d) => {
      if (route === "login") {
        const ip = createHash("sha256")
          .update(
            (req.headers.get("x-forwarded-for") || "local").split(",")[0] +
              secret(),
          )
          .digest("hex");
        const now = Date.now();
        for (const [key, value] of Object.entries(d.loginLimits))
          if (now - value.since > 900000) delete d.loginLimits[key];
        const limit = d.loginLimits[ip] || { count: 0, since: now };
        if (limit.count >= 10)
          return NextResponse.json(
            { error: "Take a short break before trying again." },
            { status: 429 },
          );
        if (
          body.username !== "admin" ||
          !verifyPassword(
            String(body.password || "").slice(0, 300),
            d.settings.passwordHash,
          )
        ) {
          limit.count++;
          d.loginLimits[ip] = limit;
          return NextResponse.json(
            { error: "Username or password did not match." },
            { status: 401 },
          );
        }
        delete d.loginLimits[ip];
        const res = NextResponse.json({ ok: true });
        setCookie(res, "admin", d);
        return res;
      }
      if (route === "logout") {
        const res = NextResponse.json({ ok: true });
        setCookie(res, "admin", d, true);
        setCookie(res, "child", d, true);
        return res;
      }
      const role = requireRole(req, d, p[0] === "admin" || route === "launch");
      if (route === "launch") {
        const res = NextResponse.json({ ok: true });
        setCookie(res, "child", d);
        setCookie(res, "admin", d, true);
        return res;
      }
      if (route === "session/start")
        return NextResponse.json(
          beginSession(
            d,
            body.skill,
            body.skill === "states" && Number.isInteger(body.difficulty)
              ? Math.min(5, Math.max(1, body.difficulty))
              : body.difficulty === 2
                ? 2
                : 1,
            role === "admin" && body.mode === "observed"
              ? "observed"
              : "practice",
          ),
        );
      if (p[0] === "session" && p[2] === "answer")
        return NextResponse.json(submitAnswer(d, p[1], body));
      if (p[0] === "session" && p[2] === "next")
        return NextResponse.json(nextQuestion(d, p[1]));
      if (p[0] === "session" && p[2] === "hint") {
        const s = d.sessions.find((s) => s.id === p[1]);
        if (!s || s.finishedAt || s.pending) fail("Question unavailable.");
        s.hintUsed = true;
        return NextResponse.json({
          hint:
            body.kind === "read-aloud"
              ? null
              : s.questions[s.index].explanation,
        });
      }
      if (p[0] === "session" && p[2] === "leave") {
        const s = d.sessions.find((s) => s.id === p[1]);
        if (!s) fail("Adventure not found.");
        if (!s.finishedAt) {
          s.finishedAt = Date.now();
          s.abandoned = true;
          s.earned = 0;
        }
        return NextResponse.json({ ok: true });
      }
      if (route === "redeem") {
        const r = d.rewards.find((r) => r.id === body.id);
        if (!r) fail("Reward not found.");
        if (
          d.redemptions.some(
            (x) => x.rewardId === r.id && x.status === "pending",
          )
        )
          fail("Your request is already with your grown-up.");
        if (d.stars < r.cost) fail("Keep collecting stars for this reward.");
        d.stars -= r.cost;
        d.redemptions.push({
          id: randomBytes(12).toString("hex"),
          rewardId: r.id,
          title: r.title,
          cost: r.cost,
          status: "pending",
          at: Date.now(),
        });
        return NextResponse.json({ ok: true });
      }
      if (route === "assignment/request") {
        if (!d.assignments.some((a) => a.id === body.id && !a.archived))
          fail("Quest not available.");
        const today = localDay(Date.now(), d.settings.timezone);
        if (
          !d.completions.some(
            (c) => c.assignmentId === body.id && c.day === today,
          )
        ) {
          d.completions.push({
            id: randomBytes(12).toString("hex"),
            assignmentId: body.id,
            day: today,
            status: "pending",
            at: Date.now(),
          });
        }
        return NextResponse.json({ ok: true });
      }
      if (route === "legacy") {
        if (!["math", "reading", "stories"].includes(body.game))
          fail("Unknown game.");
        if (
          body.saved &&
          typeof body.saved === "object" &&
          !Array.isArray(body.saved)
        ) {
          const clean = sanitizeLegacyMap(body.game, body.saved);
          if (JSON.stringify(clean).length > 300000)
            fail("Game save too large.");
          d.legacy[body.game] = clean;
        }
        if (body.completion) {
          const c = body.completion;
          if (
            typeof c.id !== "string" ||
            !/^[a-f0-9-]{16,50}$/.test(c.id) ||
            !Number.isInteger(c.correct) ||
            !Number.isInteger(c.total) ||
            c.total < 1 ||
            c.total > 100 ||
            c.correct < 0 ||
            c.correct > c.total
          )
            fail("Invalid completed round.");
          if (
            !d.legacyCompletions.some(
              (x) => x.id === c.id && x.game === body.game,
            )
          )
            d.legacyCompletions.push({
              id: c.id,
              game: body.game,
              correct: c.correct,
              total: c.total,
              date: Date.now(),
              source: "legacy-client-reported",
            });
        }
        if (body.event) {
          const e = body.event;
          d.legacyEvents.push({
            game: body.game,
            prompt: String(e.prompt || "").slice(0, 500),
            answer: String(e.answer || "").slice(0, 200),
            correct: e.correct === true,
            elapsedMs: Math.min(
              86400000,
              Math.max(0, Number(e.elapsedMs) || 0),
            ),
            helped: !!e.helped,
            focusLosses: Math.min(
              1000,
              Math.max(0, Number(e.focusLosses) || 0),
            ),
            at: Date.now(),
            source: "legacy-client-reported",
          });
        }
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/profile") {
        d.profile = {
          ...d.profile,
          name: String(body.name || "Oliver").slice(0, 40),
          grade: String(body.grade || "2").slice(0, 10),
          age: Math.min(18, Math.max(3, Number(body.age) || 7)),
          dailyGoal: Math.min(60, Math.max(5, Number(body.dailyGoal) || 15)),
        };
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/password") {
        if (
          !verifyPassword(String(body.current || ""), d.settings.passwordHash)
        )
          fail("Current password did not match.");
        if (
          typeof body.password !== "string" ||
          body.password.length < 10 ||
          body.password.length > 200
        )
          fail("Choose 10–200 characters.");
        d.settings.passwordHash = hashPassword(body.password);
        d.settings.authVersion++;
        d.settings.defaultPassword = false;
        const res = NextResponse.json({ ok: true });
        setCookie(res, "admin", d);
        return res;
      }
      if (route === "admin/revoke") {
        d.settings.childVersion++;
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/materials/import") {
        if (!Array.isArray(body.files) || body.files.length > 2000)
          fail("Choose a valid snapshot manifest (up to 2,000 files).");
        let added = 0;
        for (const f of body.files) {
          if (
            !/^[a-f0-9]{24}$/.test(f.id) ||
            !/^([a-f0-9]{64})$/.test(f.sha256)
          )
            continue;
          if (d.materials.some((m) => m.id === f.id)) continue;
          d.materials.push({
            id: f.id,
            title: String(f.title || "Untitled").slice(0, 180),
            relativePath: String(f.relativePath || "").slice(0, 400),
            sha256: f.sha256,
            bytes: Math.max(0, Number(f.bytes) || 0),
            subject: ["Math", "Chinese", "School", "Reference"].includes(
              f.subject,
            )
              ? f.subject
              : "Reference",
            status: f.status === "link-only" ? "link-only" : "needs-review",
            note: String(f.note || "").slice(0, 2000),
            snapshotAt: String(f.snapshotAt || body.createdAt || "").slice(
              0,
              60,
            ),
          });
          added++;
        }
        return NextResponse.json({
          ok: true,
          added,
          total: d.materials.length,
        });
      }
      if (route === "admin/material") {
        const m = d.materials.find((m) => m.id === body.id);
        if (!m) fail("Material not found.");
        m.note = String(body.note || "").slice(0, 2000);
        m.status = [
          "reviewed",
          "needs-review",
          "link-only",
          "archived",
        ].includes(body.status)
          ? body.status
          : m.status;
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/assignment") {
        if (body.archive) {
          const a = d.assignments.find((a) => a.id === body.id);
          if (a) a.archived = true;
          return NextResponse.json({ ok: true });
        }
        const item = {
          id: body.id || randomBytes(12).toString("hex"),
          title: String(body.title || "Study together").slice(0, 160),
          instructions: String(body.instructions || "").slice(0, 2000),
          materialId: String(body.materialId || ""),
          minutes: Math.min(30, Math.max(1, Number(body.minutes) || 5)),
          stars: Math.min(20, Math.max(0, Number(body.stars) || 3)),
          days: Array.isArray(body.days)
            ? body.days.filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
            : [1, 2, 3, 4, 5],
          archived: false,
        };
        const old = d.assignments.findIndex((a) => a.id === item.id);
        if (old >= 0) d.assignments[old] = item;
        else d.assignments.push(item);
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/reward") {
        if (body.archive) {
          d.rewards = d.rewards.filter((r) => r.id !== body.id);
        } else {
          const r = {
            id: body.id || randomBytes(12).toString("hex"),
            title: String(body.title || "Family reward").slice(0, 120),
            cost: Math.min(10000, Math.max(1, Number(body.cost) || 10)),
          };
          const i = d.rewards.findIndex((x) => x.id === r.id);
          if (i >= 0) d.rewards[i] = r;
          else d.rewards.push(r);
        }
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/approve") {
        const c = d.completions.find(
          (x) => x.id === body.id && x.status === "pending",
        );
        if (c) {
          c.status = body.approve ? "approved" : "retry";
          c.observation = String(body.observation || "").slice(0, 1000);
          if (body.approve) {
            const a = d.assignments.find((a) => a.id === c.assignmentId);
            d.stars += a?.stars || 0;
          }
        }
        const r = d.redemptions.find(
          (x) => x.id === body.id && x.status === "pending",
        );
        if (r) {
          r.status = body.approve ? "approved" : "refunded";
          if (!body.approve) d.stars += r.cost;
        }
        return NextResponse.json({ ok: true });
      }
      fail("Not found.", 404);
    });
  } catch (e) {
    return errorResponse(e);
  }
}
function errorResponse(e) {
  if (/Production requires/.test(e.message))
    return NextResponse.json(
      {
        error:
          "Cloud storage and login secrets need configuration before this deployment can be used.",
      },
      { status: 503 },
    );
  if (e.status)
    return NextResponse.json({ error: e.message }, { status: e.status });
  if (
    /Unknown skill|Adventure|question|Enter an answer|Choose one|Finish or leave/.test(
      e.message,
    )
  )
    return NextResponse.json({ error: e.message }, { status: 400 });
  console.error("LMS request failed:", e.message);
  return NextResponse.json(
    {
      error:
        "We could not save this yet. Please try again; keep this page open.",
    },
    { status: 503 },
  );
}
