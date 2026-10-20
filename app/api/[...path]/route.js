import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes } from "node:crypto";
import { transact, databaseMode } from "../../../lib/store.mjs";
import { legacyProgress } from "../../../lib/progress.mjs";
import { vocabularyLesson } from "../../../lib/vocabulary.mjs";
import { explorerLesson } from "../../../lib/explorers.mjs";
import { dailyPlan } from "../../../lib/planner.mjs";
import {
  learningCalendar,
  awardConsistency,
  streaks,
  dailyStarSummary,
} from "../../../lib/calendar.mjs";
import { validMonth } from "../../../lib/dates.mjs";
import {
  rewardRequests,
  reviewReward,
  rewardShop,
  requestReward,
} from "../../../lib/rewards.mjs";
import {
  isManager,
  loginAccount,
  resolveAccountSession,
  publicAccount,
  accountList,
  manageAccount,
  exportForAccount,
} from "../../../lib/accounts.mjs";
import {
  dashState,
  startDash,
  finishDash,
  answerDash,
  hintDash,
} from "../../../lib/dash.mjs";
import { sanitizeLegacyMap } from "../../../lib/legacy-save.mjs";
import {
  chessState,
  startChess,
  openChess,
  moveChess,
  retryChessLesson,
  chessPreferences,
  beginChessQuiz,
  answerChessQuiz,
  nextChessQuiz,
  readChessQuiz,
  closeChessQuiz,
  chessParentHistory,
} from "../../../lib/chess.mjs";
import {
  learnerData,
  learnerList,
  validLearner,
} from "../../../lib/learners.mjs";
import {
  verifyPassword,
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
function authenticatedSession(req, data) {
  for (const bucket of ["admin", "child"]) {
    const s = resolveAccountSession(
      data,
      readSession(req.cookies.get(`oliver-${bucket}`)?.value || "", secret()),
    );
    if (s && (bucket === "admin" ? isManager(s.role) : s.role === "student"))
      return s;
  }
  return null;
}
function actor(req, data) {
  return authenticatedSession(req, data)?.role || null;
}
function checkLearner(req, d, body) {
  const expectedAccount = req.headers.get("x-lms-account");
  if (
    expectedAccount &&
    expectedAccount !== authenticatedSession(req, d)?.accountId
  )
    fail("The signed-in account changed. Reload before continuing.", 409);
  const expected = req.headers.get("x-lms-learner") || body?.learnerId;
  if (expected && expected !== d.learnerId)
    fail("The learner changed in another tab. Reload before continuing.", 409);
}
function requireRole(req, data, admin = false) {
  const role = actor(req, data);
  if (!role || (admin && !isManager(role)))
    fail(
      admin ? "Parent sign-in required." : "Sign in to start your adventure.",
      401,
    );
  return role;
}
function setCookie(
  res,
  role,
  data,
  clear = false,
  learnerId = "oliver",
  accountId,
) {
  const bucket = role === "child" || role === "student" ? "child" : "admin";
  const account =
    data.accounts.find((a) => a.id === accountId) ||
    data.accounts.find(
      (a) =>
        a.role === (role === "child" ? "student" : role) &&
        (role === "admin" || a.learnerId === learnerId),
    );
  res.cookies.set(
    `oliver-${bucket}`,
    clear
      ? ""
      : signSession(
          {
            role: account.role,
            accountId: account.id,
            accountVersion: account.version,
            learnerId,
            v:
              role === "admin"
                ? data.settings.authVersion
                : data.settings.childVersion,
            exp:
              Date.now() + (bucket === "admin" ? 12 * 3600000 : 30 * 86400000),
          },
          secret(),
        ),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: clear ? 0 : bucket === "admin" ? 43200 : 2592000,
    },
  );
}
function sessionResponse(d, view) {
  return NextResponse.json({
    ...view,
    learnerId: d.learnerId,
    learnerName: d.profile.name,
  });
}
function safeState(d, role, family, session) {
  return {
    role,
    learnerId: d.learnerId,
    learners: learnerList(family).filter(
      (l) => role === "admin" || l.id === d.learnerId,
    ),
    account: publicAccount(session.account),
    timezone: d.settings.timezone,
    legacyProgress: legacyProgress(d),
    profile: d.profile,
    stars: d.stars,
    ...dailyStarSummary(d),
    stats: stats(d),
    recommendations: recommendations(d),
    dailyPlan: dailyPlan(d),
    streak: streaks(d),
    today: localDay(Date.now(), d.settings.timezone),
    rewards: rewardShop(d),
    redemptions: rewardRequests(d, isManager(role)),
    assignments: d.assignments
      .filter((x) => !x.archived)
      .map((a) => ({
        ...a,
        material: materialView(
          d.materials.find((m) => m.id === a.materialId),
          role,
        ),
      })),
    completions: d.completions,
    storyProgress: d.storyProgress,
    activeSessions: d.sessions.filter((s) => !s.finishedAt).map(sessionView),
    todayCompleted: d.sessions.filter(
      (s) =>
        s.finishedAt &&
        !s.abandoned &&
        localDay(s.finishedAt, d.settings.timezone) ===
          localDay(Date.now(), d.settings.timezone),
    ).length,
    todayMinutes: Math.round(
      d.sessions
        .filter(
          (s) =>
            s.finishedAt &&
            !s.abandoned &&
            localDay(s.finishedAt, d.settings.timezone) ===
              localDay(Date.now(), d.settings.timezone),
        )
        .flatMap((s) => s.attempts)
        .reduce((n, a) => n + Math.min(a.activeMs, 600000), 0) / 60000,
    ),
    storage: databaseMode(),
  };
}
function materialView(m, role) {
  if (!m) return null;
  return role === "admin"
    ? m
    : { id: m.id, title: m.title, subject: m.subject, status: m.status };
}
export async function GET(req, context) {
  try {
    const { path: p } = await context.params;
    const route = p.join("/");
    return await transact(async (family) => {
      const session = authenticatedSession(req, family);
      const d = learnerData(family, session?.learnerId || "oliver");
      if (route === "health")
        return NextResponse.json({ ok: true, storage: databaseMode() });
      const role = requireRole(
        req,
        d,
        route === "admin" || route === "admin/export",
      );
      if (route === "identity")
        return NextResponse.json({
          id: session.accountId,
          role,
          learnerId: session.learnerId,
        });
      checkLearner(req, d);
      if (route === "state")
        return NextResponse.json(safeState(d, role, family, session));
      if (route === "admin/accounts") {
        if (role !== "admin") fail("Administrator access required.", 403);
        return NextResponse.json({
          accounts: accountList(family),
          learners: learnerList(family),
        });
      }
      if (route === "dash") return NextResponse.json(dashState(d));
      if (route === "chess") return NextResponse.json(chessState(d));
      if (p[0] === "explore" && p.length === 2) {
        const lesson = explorerLesson(p[1]);
        if (!lesson) fail("Discovery not found.", 404);
        return NextResponse.json(lesson);
      }
      if (route === "calendar") {
        const month =
          req.nextUrl.searchParams.get("month") ||
          localDay(Date.now(), d.settings.timezone).slice(0, 7);
        if (!validMonth(month)) fail("Choose a valid calendar month.");
        return NextResponse.json(
          learningCalendar(d, month, Date.now(), isManager(role)),
        );
      }
      if (p[0] === "lesson" && p.length === 2) {
        const lesson = vocabularyLesson(p[1]);
        if (!lesson) fail("Word pack not found.", 404);
        return NextResponse.json(lesson);
      }
      if (route === "admin")
        return NextResponse.json({
          ...safeState(d, role, family, session),
          materials: d.materials
            .filter(
              (m) =>
                role === "admin" ||
                d.assignments.some((a) => a.materialId === m.id),
            )
            .map((m) => materialView(m, role)),
          history: d.sessions
            .map(({ questions, ...s }) => s)
            .slice()
            .reverse(),
          legacyEvents: d.legacyEvents.slice(-200).reverse(),
          settings: {
            timezone: d.settings.timezone,
            defaultPassword: session.account.defaultPassword,
          },
          allAssignments: d.assignments,
          chessHistory: chessParentHistory(d),
          dashHistory: d.dash.runs
            .filter((r) => r.attempt)
            .map(({ question, ...r }) => r)
            .reverse(),
        });
      if (route === "admin/export")
        return new NextResponse(
          JSON.stringify(exportForAccount(family, session), null, 2),
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
        return sessionResponse(d, sessionView(s));
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
            `<script>window.__LMS_LEARNER__=${JSON.stringify(d.learnerId)};window.__LMS_GAME__=${JSON.stringify(game)};window.__LMS_SAVED__=${saved};</script><script src="/game-bridge.js"></script><script>`,
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
    return await transact(async (family) => {
      const session = authenticatedSession(req, family);
      const d = learnerData(family, session?.learnerId || "oliver");
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
        const account = loginAccount(family, body.username, body.password);
        if (!account) {
          limit.count++;
          d.loginLimits[ip] = limit;
          return NextResponse.json(
            { error: "Username or password did not match." },
            { status: 401 },
          );
        }
        delete d.loginLimits[ip];
        const learnerId =
          account.role === "admin" ? "oliver" : account.learnerId;
        const res = NextResponse.json({
          ok: true,
          role: account.role,
          learnerId,
          redirect: account.role === "student" ? "/" : "/admin",
        });
        setCookie(res, account.role, family, false, learnerId, account.id);
        setCookie(
          res,
          account.role === "student" ? "admin" : "student",
          family,
          true,
        );
        return res;
      }
      if (route === "logout") {
        const res = NextResponse.json({ ok: true });
        setCookie(res, "admin", d, true);
        setCookie(res, "child", d, true);
        return res;
      }
      const role = requireRole(req, d, p[0] === "admin" || route === "launch");
      if (route === "learner/select") {
        if (role !== "admin")
          fail("Only the administrator can switch learners.", 403);
        if (!validLearner(body.id)) fail("Choose Oliver, Test1, or Test2.");
        const res = NextResponse.json({ ok: true, learnerId: body.id });
        setCookie(res, role, family, false, body.id, session.accountId);
        return res;
      }
      checkLearner(req, d, route === "admin/account" ? undefined : body);
      if (route === "chess/start")
        return NextResponse.json(startChess(d, body));
      if (route === "chess/open")
        return NextResponse.json(openChess(d, body.id));
      if (route === "chess/move") return NextResponse.json(moveChess(d, body));
      if (route === "chess/retry")
        return NextResponse.json(retryChessLesson(d, body));
      if (route === "chess/preferences")
        return NextResponse.json(chessPreferences(d, body));
      if (route === "chess/quiz")
        return NextResponse.json(beginChessQuiz(d, body));
      if (route === "chess/quiz-answer")
        return NextResponse.json(answerChessQuiz(d, body));
      if (route === "chess/quiz-next")
        return NextResponse.json(nextChessQuiz(d, body));
      if (route === "chess/quiz-read")
        return NextResponse.json(readChessQuiz(d, body));
      if (route === "chess/quiz-close")
        return NextResponse.json(closeChessQuiz(d, body));
      if (route === "dash/start")
        return NextResponse.json(startDash(d, body.level));
      if (route === "dash/finish")
        return NextResponse.json(finishDash(d, body.id, body));
      if (route === "dash/answer")
        return NextResponse.json(answerDash(d, body.id, body));
      if (route === "dash/hint") return NextResponse.json(hintDash(d, body.id));
      if (route === "launch") {
        const student = family.accounts.find(
          (a) =>
            a.role === "student" &&
            a.learnerId === d.learnerId &&
            a.enabled &&
            a.passwordHash,
        );
        if (!student)
          fail("Ask admin to enable this student's login first.", 409);
        const res = NextResponse.json({ ok: true });
        setCookie(res, "student", d, false, d.learnerId, student.id);
        setCookie(res, "admin", d, true);
        return res;
      }
      if (route === "daily/start") {
        const plan = dailyPlan(d);
        if (
          body.day !== plan.day ||
          !Number.isInteger(body.slot) ||
          !plan.slots[body.slot]
        )
          fail("Today's plan has changed. Go home and try again.");
        const slot = plan.slots[body.slot];
        if (slot.completed)
          return sessionResponse(
            d,
            sessionView(d.sessions.find((s) => s.id === slot.sessionId)),
          );
        return sessionResponse(d, beginSession(d, slot.skill, slot.difficulty));
      }
      if (route === "session/start")
        return sessionResponse(
          d,
          beginSession(
            d,
            body.skill,
            body.skill === "states" && Number.isInteger(body.difficulty)
              ? Math.min(5, Math.max(1, body.difficulty))
              : body.difficulty === 2
                ? 2
                : 1,
            isManager(role) && body.mode === "observed"
              ? "observed"
              : "practice",
          ),
        );
      if (p[0] === "session" && p[2] === "answer")
        return sessionResponse(d, submitAnswer(d, p[1], body));
      if (p[0] === "session" && p[2] === "next")
        return sessionResponse(d, nextQuestion(d, p[1]));
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
      if (route === "redeem")
        return NextResponse.json(requestReward(d, body.id));
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
        // Old Oliver clients remain compatible; an old tab cannot write test saves.
        if ((body.learnerId || "oliver") !== d.learnerId)
          fail(
            "The learner changed. Return to adventure home before playing.",
            409,
          );
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
          !verifyPassword(
            String(body.current || ""),
            session.account.passwordHash,
          )
        )
          fail("Current password did not match.");
        if (
          typeof body.password !== "string" ||
          body.password.length < 10 ||
          body.password.length > 200
        )
          fail("Choose 10–200 characters.");
        manageAccount(
          family,
          { id: session.accountId, password: body.password },
          session.accountId,
        );
        const res = NextResponse.json({ ok: true });
        setCookie(res, role, family, false, d.learnerId, session.accountId);
        return res;
      }
      if (route === "admin/revoke") {
        for (const a of family.accounts)
          if (
            a.role === "student" &&
            (role === "admin" || a.learnerId === d.learnerId)
          )
            a.version++;
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/account") {
        if (role !== "admin") fail("Administrator access required.", 403);
        const result = manageAccount(family, body, session.accountId);
        const res = NextResponse.json(result);
        if (result.reauthenticate)
          setCookie(res, role, family, false, d.learnerId, session.accountId);
        return res;
      }
      if (route === "admin/materials/import") {
        if (role !== "admin") fail("Administrator access required.", 403);
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
        if (role !== "admin") fail("Administrator access required.", 403);
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
            daily:
              body.daily === undefined
                ? d.rewards.find((x) => x.id === body.id)?.daily || false
                : body.daily === "true" || body.daily === true,
          };
          const i = d.rewards.findIndex((x) => x.id === r.id);
          if (i >= 0) d.rewards[i] = r;
          else d.rewards.push(r);
        }
        return NextResponse.json({ ok: true });
      }
      if (route === "admin/redemption")
        return NextResponse.json(reviewReward(d, body));
      if (route === "admin/approve") {
        const c = d.completions.find(
          (x) => x.id === body.id && x.status === "pending",
        );
        if (c) {
          c.status = body.approve ? "approved" : "retry";
          c.observation = String(body.observation || "").slice(0, 1000);
          if (body.approve) {
            const a = d.assignments.find((a) => a.id === c.assignmentId);
            c.earned = a?.stars || 0;
            c.title = a?.title || "Study together";
            c.approvedAt = Date.now();
            d.stars += c.earned;
            if (c.day === localDay(c.approvedAt, d.settings.timezone))
              awardConsistency(d, c.approvedAt);
          }
        }
        const r = d.redemptions.find(
          (x) => x.id === body.id && x.status === "pending",
        );
        if (r) {
          reviewReward(d, {
            id: r.id,
            action: body.approve ? "approve" : "refund",
          });
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
