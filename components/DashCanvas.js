"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  dashCourse,
  initialDash,
  stepDash,
  DASH_HEIGHT,
} from "../lib/dash-engine.mjs";
import { createDashAudio } from "../lib/dash-audio.mjs";
import LegacyDashCanvas from "./LegacyDashCanvas";

const colors = {
  gravity: "#88caff",
  dual: "#ffb454",
  mode: "#b6a4ff",
  speed: "#ffdc72",
  yellow: "#ffe866",
  pink: "#ff93d7",
  blue: "#76c9ff",
  pad: "#a7ff98",
};
const gateName = (e) =>
  e.kind === "gravity"
    ? e.value === 1
      ? "↑ GRAVITY"
      : "↓ GRAVITY"
    : e.kind === "mode"
      ? e.value.toUpperCase()
      : e.kind === "dual"
        ? e.value
          ? "DUAL"
          : "SOLO"
        : `${e.value}× SPEED`;
function paint(canvas, s, course, reduced, zoom) {
  const c = canvas.getContext("2d");
  if (!c) return;
  const W = 1000,
    H = 440,
    floor = 370,
    top = floor - DASH_HEIGHT,
    px = (x) => 130 + (x - s.x) * zoom;
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, course.sky);
  sky.addColorStop(1, course.horizon);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  c.strokeStyle = course.accent;
  c.globalAlpha = 0.14;
  for (let i = 0; i < 22; i++) {
    const x = (((i * 137 - (reduced ? 0 : s.x * 0.12)) % 1100) + 1100) % 1100;
    c.strokeRect(x, 105 + (i % 3) * 65, 28, 28);
  }
  c.globalAlpha = 1;
  c.fillStyle = course.sky;
  c.fillRect(0, floor, W, H - floor);
  c.fillRect(0, 0, W, top);
  c.strokeStyle = course.accent;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, floor);
  c.lineTo(W, floor);
  c.moveTo(0, top);
  c.lineTo(W, top);
  c.stroke();
  for (const e of course.entities) {
    const x = px(e.x);
    if (x < -70 || x > W + 80) continue;
    const color =
      e.kind === "gravity" && e.value === -1 ? "#ffe866" : colors[e.kind];
    c.strokeStyle = color;
    c.fillStyle = color;
    c.lineWidth = 3;
    if (["mode", "gravity", "dual", "speed"].includes(e.kind)) {
      // Gates at section starts share a position. Stack their labels instead of hiding them.
      const row = ["mode", "gravity", "dual", "speed"].indexOf(e.kind);
      c.globalAlpha = 0.3;
      c.beginPath();
      c.ellipse(x, 220, 13, 140, 0, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha = 1;
      c.font = "bold 14px system-ui";
      c.fillText(gateName(e), x + 18, 115 + row * 23);
    } else if (e.kind === "pad") {
      c.fillRect(x - 4, floor - 8, Math.max(20, 25 * zoom), 8);
      c.font = "bold 22px system-ui";
      c.fillText("⇧", x, floor - 18);
    } else {
      c.globalAlpha = s.used.includes(e.id) ? 0.24 : 1;
      const y = floor - e.y,
        r = e.radius * 0.64;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.stroke();
      c.globalAlpha *= 0.3;
      c.fill();
      c.globalAlpha = 1;
      c.font = "bold 20px system-ui";
      c.textAlign = "center";
      c.fillText(
        e.kind === "blue" ? "↕" : e.kind === "pink" ? "·" : "+",
        x,
        y + 7,
      );
      c.textAlign = "left";
    }
  }
  for (const o of course.obstacles) {
    const x = px(o.x),
      w = o.width * zoom;
    if (x + w < 0 || x > W) continue;
    c.fillStyle = course.hazard;
    c.strokeStyle = "#ffffff55";
    c.lineWidth = 1.5;
    if (o.kind === "block") {
      c.fillRect(x, floor - o.y - o.height, w, o.height);
      c.strokeRect(x, floor - o.y - o.height, w, o.height);
    } else {
      const count = Math.max(1, Math.round(o.width / 30)),
        sw = w / count;
      for (let i = 0; i < count; i++) {
        const base = o.side === "ceiling" ? top : floor,
          tip = base + (o.side === "ceiling" ? o.height : -o.height);
        c.beginPath();
        c.moveTo(x + i * sw, base);
        c.lineTo(x + (i + 0.5) * sw, tip);
        c.lineTo(x + (i + 1) * sw, base);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }
    if (course.level === 1) {
      const mark = px(o.x + o.width / 2 - course.speed * 0.29 - 15);
      c.fillStyle = course.accent;
      c.fillRect(mark - 12, floor + 12, 24, 6);
    }
  }
  if (!reduced && s.burst && s.frame - s.burst.frame < 18) {
    const age = s.frame - s.burst.frame,
      x = px(s.burst.x),
      y = floor - s.burst.y;
    c.strokeStyle = colors[s.burst.kind] || course.accent;
    c.globalAlpha = 1 - age / 18;
    c.lineWidth = 2;
    c.beginPath();
    c.arc(x, y, 16 + age * 2, 0, Math.PI * 2);
    c.stroke();
    c.globalAlpha = 1;
  }
  function player(y, clone = false) {
    c.save();
    c.translate(130 + 15 * zoom, floor - y - 15);
    if (s.mode === "cube" && !reduced && s.y > 0 && s.y < 270)
      c.rotate(s.frame * 0.13 * (clone ? -1 : 1));
    c.fillStyle = s.dead ? course.hazard : clone ? "#ffb454" : course.accent;
    if (s.mode === "ship") {
      c.beginPath();
      c.moveTo(-17, 10);
      c.lineTo(20, 0);
      c.lineTo(-17, -10);
      c.lineTo(-10, 0);
      c.closePath();
      c.fill();
    } else if (s.mode === "wave") {
      c.beginPath();
      c.moveTo(-15, -12);
      c.lineTo(17, 0);
      c.lineTo(-15, 12);
      c.closePath();
      c.fill();
    } else {
      c.fillRect(-15, -15, 30, 30);
      c.fillStyle = course.sky;
      c.fillRect(-8, -6, 5, 6);
      c.fillRect(4, -6, 5, 6);
      c.fillRect(-5, 6, 11, 3);
    }
    c.restore();
  }
  if (!reduced) {
    c.strokeStyle = course.accent;
    c.globalAlpha = 0.28;
    c.beginPath();
    c.moveTo(80, floor - s.y - 15);
    c.lineTo(125, floor - s.y - 15);
    c.stroke();
    c.globalAlpha = 1;
  }
  player(s.y);
  if (s.dual) player(270 - s.y, true);
  const end = px(course.finishX);
  if (end < W) {
    c.fillStyle = course.accent;
    c.fillRect(end, top + 15, 4, 285);
    c.font = "bold 25px system-ui";
    c.fillText("★", end + 12, top + 43);
  }
  c.fillStyle = "#ffffffdd";
  c.font = "bold 18px system-ui";
  c.fillText(course.icon + " " + course.title, 24, 38);
  c.textAlign = "right";
  c.fillText(
    Math.min(100, Math.floor((s.x / course.finishX) * 100)) + "%",
    976,
    38,
  );
  c.textAlign = "left";
}
export default function DashCanvas(props) {
  return props.run.engineVersion === 1 ? (
    <LegacyDashCanvas {...props} />
  ) : (
    <ModernDashCanvas {...props} />
  );
}
function ModernDashCanvas({ run, music, sfx, onClear }) {
  const course = useMemo(
    () => dashCourse(run.level, run.seed, 2),
    [run.level, run.seed],
  );
  const canvas = useRef(null),
    sim = useRef(initialDash()),
    trace = useRef([]),
    held = useRef(false),
    tap = useRef(false),
    phase = useRef("ready"),
    audio = useRef(null),
    clear = useRef(onClear),
    keys = useRef(new Set()),
    pointer = useRef(null);
  const [status, setStatus] = useState("ready"),
    [tries, setTries] = useState(1),
    [hud, setHud] = useState({
      mode: "cube",
      gravity: -1,
      dual: false,
      speed: 1,
    });
  clear.current = onClear;
  function change(p) {
    phase.current = p;
    setStatus(p);
  }
  function release() {
    held.current = false;
    tap.current = false;
    keys.current.clear();
    pointer.current = null;
  }
  function pause() {
    if (phase.current === "running") {
      change("paused");
      release();
      audio.current?.pause();
    }
  }
  function go() {
    audio.current ||= createDashAudio();
    audio.current.setMusic(music);
    audio.current.setSfx(sfx);
    audio.current.prepare();
    if (phase.current !== "paused") {
      if (phase.current === "dead") setTries((n) => n + 1);
      sim.current = initialDash();
      trace.current = [];
      setHud({ mode: "cube", gravity: -1, dual: false, speed: 1 });
    }
    release();
    change("running");
    canvas.current?.parentElement?.parentElement?.scrollIntoView({
      block: "start",
    });
    audio.current.play(course);
  }
  async function save() {
    change("saving");
    try {
      await clear.current(trace.current);
    } catch {
      change("cleared");
    }
  }
  useEffect(() => {
    audio.current?.setMusic(music);
    audio.current?.setSfx(sfx);
  }, [music, sfx]);
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let raf,
      last = 0,
      accumulator = 0,
      zoom = motion.matches ? 0.55 : 1;
    function frame(time) {
      if (phase.current === "running") {
        if (!last) last = time;
        accumulator += Math.min(100, time - last);
        last = time;
        while (accumulator >= 1000 / 60 && phase.current === "running") {
          const down = held.current || tap.current;
          tap.current = false;
          if (down !== sim.current.held)
            trace.current.push({ frame: sim.current.frame, down });
          const prev = sim.current;
          sim.current = stepDash(prev, down, course);
          const s = sim.current;
          if (s.effect) audio.current?.effect(s.effect);
          if (
            s.mode !== prev.mode ||
            s.gravity !== prev.gravity ||
            s.dual !== prev.dual ||
            s.speed !== prev.speed
          )
            setHud({
              mode: s.mode,
              gravity: s.gravity,
              dual: s.dual,
              speed: s.speed,
            });
          accumulator -= 1000 / 60;
          if (s.dead) {
            change("dead");
            release();
            audio.current?.pause();
            audio.current?.effect("crash");
          } else if (s.won) {
            change("saving");
            release();
            audio.current?.pause();
            audio.current?.effect("clear");
            save();
          }
        }
      } else {
        last = 0;
        accumulator = 0;
      }
      const target = motion.matches
        ? 0.55
        : Math.max(0.5, 1 - (sim.current.speed - 1) * 0.18);
      zoom = motion.matches ? target : zoom + (target - zoom) * 0.06;
      if (canvas.current)
        paint(canvas.current, sim.current, course, motion.matches, zoom);
      raf = requestAnimationFrame(frame);
    }
    function down(e) {
      if (["Escape", "KeyP"].includes(e.code)) {
        e.preventDefault();
        pause();
        return;
      }
      if (
        phase.current === "running" &&
        ["Space", "ArrowUp", "KeyW"].includes(e.code)
      ) {
        e.preventDefault();
        if (e.repeat || keys.current.has(e.code)) return;
        keys.current.add(e.code);
        if (!held.current) tap.current = true;
        held.current = true;
      }
    }
    function up(e) {
      keys.current.delete(e.code);
      held.current = keys.current.size > 0 || pointer.current !== null;
    }
    function hide() {
      if (document.hidden) pause();
    }
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", pause);
    document.addEventListener("visibilitychange", hide);
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      audio.current?.close();
      audio.current = null;
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [course]);
  function press(e) {
    if (phase.current !== "running" || pointer.current !== null) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointer.current = e.pointerId;
    if (!held.current) tap.current = true;
    held.current = true;
  }
  function up(e) {
    if (pointer.current !== e.pointerId) return;
    pointer.current = null;
    held.current = keys.current.size > 0;
  }
  const instruction =
    hud.mode === "ship"
      ? "Hold to thrust against gravity. Release to fall."
      : hud.mode === "wave"
        ? "Hold to zig up. Release to zag down."
        : hud.dual
          ? "Tap to jump both cubes. Watch both sides."
          : "Tap for each jump. Tap inside a ring to activate it.";
  return (
    <section className="dash-stage-wrap">
      <div className="dash-mode-strip" role="status">
        <b>
          {hud.mode.toUpperCase()}
          {hud.dual ? " · DUAL" : ""} · {hud.gravity === -1 ? "↓" : "↑"} ·{" "}
          {hud.speed}×
        </b>
        <span>{instruction}</span>
      </div>
      <div className="dash-stage" onContextMenu={(e) => e.preventDefault()}>
        <canvas
          ref={canvas}
          width="1000"
          height="440"
          aria-label={`Level ${run.level}, ${course.title}. ${course.lesson}`}
          onPointerDown={press}
          onPointerUp={up}
          onPointerCancel={up}
          onLostPointerCapture={up}
        />
        {status !== "running" && (
          <div className="dash-overlay" role="status">
            <span>{status === "dead" ? "🌱" : course.icon}</span>
            <h2>
              {status === "ready"
                ? "Ready for the rhythm?"
                : status === "dead"
                  ? "One more try!"
                  : status === "paused"
                    ? "Take a breath."
                    : "Course cleared!"}
            </h2>
            <p>
              {status === "dead"
                ? "Try a different timing. Your stars are safe."
                : status === "ready"
                  ? course.lesson
                  : status === "paused"
                    ? "Your run is paused."
                    : status === "saving"
                      ? "Saving your finish and getting a study question…"
                      : "Your finish is ready to save."}
            </p>
            {!["saving", "cleared"].includes(status) && (
              <button className="dash-action" onClick={go}>
                {status === "paused"
                  ? "Resume"
                  : status === "dead"
                    ? "Try again"
                    : "Start level"}{" "}
                ▶
              </button>
            )}
            {status === "cleared" && (
              <button className="dash-action" onClick={save}>
                Save finish & reveal question
              </button>
            )}
          </div>
        )}
      </div>
      <div className="dash-controls">
        <button
          className="dash-jump"
          disabled={status !== "running"}
          onPointerDown={press}
          onPointerUp={up}
          onPointerCancel={up}
          onLostPointerCapture={up}
          onClick={(e) => {
            if (e.detail === 0 && phase.current === "running")
              tap.current = true;
          }}
        >
          ↑ Action <small>Cube: tap · Ship / Wave: hold & release</small>
        </button>
        <button
          className="button secondary"
          disabled={status !== "running"}
          onClick={pause}
        >
          Ⅱ Pause
        </button>
        <span>Try {tries}</span>
      </div>
      <details className="dash-mechanics">
        <summary>How to play · rings & gates</summary>
        <p>
          Space / ↑ / W or the big Action button. Cube: one tap per jump. Ship:
          hold to thrust away from gravity. Wave: hold up, release down; flat
          walls are safe.
        </p>
        <p>
          Yellow ring: tap for a big boost. Pink: little hop. Blue ring: tap to
          flip gravity. Green pad: automatic spring. Blue/yellow gravity gates:
          change your floor. Orange dual gate: protect both mirrored cubes.
          Numbered speed gates: adjust your rhythm.
        </p>
      </details>
      <p className="dash-hint">
        {run.level === 1 ? "Mint marks suggest when to tap. " : ""}Switching
        tabs pauses the game. Reloading restarts the course; revealed study
        questions stay saved.
      </p>
    </section>
  );
}
