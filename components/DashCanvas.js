"use client";
import { useEffect, useRef, useState } from "react";
import {
  dashCourse,
  initialDash,
  stepDash,
  DASH_SIZE,
} from "../lib/dash-engine.mjs";
import { createDashAudio } from "../lib/dash-audio.mjs";

function draw(canvas, state, course, reduced) {
  const c = canvas.getContext("2d"),
    W = 1000,
    H = 440,
    ground = 354;
  if (!c) return;
  c.clearRect(0, 0, W, H);
  const sky = c.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, course.sky);
  sky.addColorStop(1, course.horizon);
  c.fillStyle = sky;
  c.fillRect(0, 0, W, H);
  for (let i = 0; i < 27; i++) {
    const x =
        ((((i * 173 + course.level * 43 - (reduced ? 0 : state.x * 0.08)) %
          1100) +
          1100) %
          1100) -
        50,
      y = 30 + ((i * 67) % 240);
    c.globalAlpha = 0.15 + (i % 3) * 0.08;
    c.strokeStyle = course.accent;
    c.fillStyle = course.accent;
    if (course.level % 4 === 0) {
      c.fillRect(x, y, 6, 6);
    } else if (course.level % 4 === 1) {
      c.beginPath();
      c.moveTo(x, y + 25);
      c.lineTo(x + 22, y - 12);
      c.lineTo(x + 44, y + 25);
      c.stroke();
    } else if (course.level % 4 === 2) {
      c.beginPath();
      c.arc(x, y, 9 + (i % 4) * 6, 0, Math.PI * 2);
      c.stroke();
    } else {
      c.strokeRect(x, y, 22, 22);
    }
  }
  c.globalAlpha = 1;
  c.fillStyle = course.sky;
  for (let i = 0; i < 10; i++) {
    const x = i * 145 - ((reduced ? 0 : state.x * 0.22) % 145);
    c.globalAlpha = 0.38;
    c.fillRect(x, ground - 60 - (i % 3) * 24, 90, 120);
  }
  c.globalAlpha = 1;
  c.fillStyle = course.sky;
  c.fillRect(0, ground, W, H - ground);
  c.strokeStyle = course.accent;
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(0, ground);
  c.lineTo(W, ground);
  c.stroke();
  c.globalAlpha = 0.2;
  for (let x = -state.x % 60; x < W; x += 60) {
    c.beginPath();
    c.moveTo(x, ground);
    c.lineTo(x - 35, H);
    c.stroke();
  }
  c.globalAlpha = 1;
  for (const o of course.obstacles) {
    const x = o.x - state.x + 120;
    if (course.level <= 3) {
      const mark = o.x + o.width / 2 - course.speed * 0.33 - state.x + 120;
      c.fillStyle = course.accent;
      c.globalAlpha = 0.65;
      c.fillRect(mark - 18, ground + 12, 36, 7);
      c.globalAlpha = 1;
    }
    if (x < -150 || x > W + 100) continue;
    c.fillStyle = course.hazard;
    c.strokeStyle = "#fff4";
    c.lineWidth = 2;
    if (o.kind === "block") {
      c.fillRect(x, ground - o.height, o.width, o.height);
      c.strokeRect(x + 5, ground - o.height + 5, o.width - 10, o.height - 5);
    } else {
      const count = Math.max(1, Math.round(o.width / 30)),
        w = o.width / count;
      for (let i = 0; i < count; i++) {
        c.beginPath();
        c.moveTo(x + i * w, ground);
        c.lineTo(x + (i + 0.5) * w, ground - o.height);
        c.lineTo(x + (i + 1) * w, ground);
        c.closePath();
        c.fill();
        c.stroke();
      }
    }
  }
  const finish = (course.durationFrames * course.speed) / 60 - state.x + 120;
  if (finish < W + 60) {
    c.fillStyle = course.accent;
    c.fillRect(finish, ground - 160, 5, 160);
    c.fillRect(finish + 5, ground - 160, 48, 33);
    c.fillStyle = course.sky;
    c.font = "bold 20px system-ui";
    c.fillText("★", finish + 17, ground - 136);
  }
  c.save();
  c.translate(135, ground - state.y - DASH_SIZE / 2);
  if (state.y > 0 && !reduced) c.rotate(state.frame * 0.15);
  c.fillStyle = state.dead ? course.hazard : course.accent;
  c.shadowColor = course.accent;
  c.shadowBlur = reduced ? 0 : 15;
  c.fillRect(-15, -15, 30, 30);
  c.shadowBlur = 0;
  c.fillStyle = course.sky;
  c.fillRect(-8, -6, 5, 6);
  c.fillRect(4, -6, 5, 6);
  c.fillRect(-5, 6, 11, 3);
  c.restore();
  c.fillStyle = "#ffffffcc";
  c.font = "bold 17px system-ui";
  c.fillText(course.icon + "  " + course.title, 28, 36);
  c.textAlign = "right";
  c.fillText(
    Math.min(100, Math.floor((state.frame / course.durationFrames) * 100)) +
      "%",
    W - 28,
    36,
  );
  c.textAlign = "left";
}
export default function DashCanvas({ run, music, sfx, onClear }) {
  const canvas = useRef(null),
    sim = useRef(initialDash()),
    trace = useRef([]),
    held = useRef(false),
    buffer = useRef(0),
    phase = useRef("ready"),
    audio = useRef(null),
    clear = useRef(onClear);
  const [status, setStatus] = useState("ready"),
    [tries, setTries] = useState(1);
  clear.current = onClear;
  const course = dashCourse(run.level, run.seed);
  function setPhase(p) {
    phase.current = p;
    setStatus(p);
  }
  function pause() {
    if (phase.current === "running") {
      setPhase("paused");
      held.current = false;
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
    }
    held.current = false;
    buffer.current = 0;
    setPhase("running");
    canvas.current?.parentElement?.scrollIntoView({ block: "start" });
    audio.current.play(course);
  }
  async function save() {
    setPhase("saving");
    try {
      await clear.current(trace.current);
    } catch {
      setPhase("cleared");
    }
  }
  useEffect(() => {
    audio.current?.setMusic(music);
    audio.current?.setSfx(sfx);
  }, [music, sfx]);
  useEffect(() => {
    const level = dashCourse(run.level, run.seed),
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf,
      last = 0,
      accumulator = 0;
    function frame(time) {
      if (phase.current === "running") {
        if (!last) last = time;
        // Discard long frame stalls so resuming never skips unseen hazards.
        const delta = Math.min(100, time - last);
        last = time;
        {
          accumulator += delta;
          while (accumulator >= 1000 / 60 && phase.current === "running") {
            const jump =
              (held.current || buffer.current > 0) && sim.current.y === 0;
            if (jump) {
              trace.current.push(sim.current.frame);
              audio.current?.effect("jump");
              buffer.current = 0;
            }
            sim.current = stepDash(sim.current, jump, level);
            buffer.current = Math.max(0, buffer.current - 1);
            accumulator -= 1000 / 60;
            if (sim.current.dead) {
              setPhase("dead");
              audio.current?.pause();
              audio.current?.effect("crash");
              held.current = false;
            } else if (sim.current.won) {
              setPhase("saving");
              audio.current?.pause();
              audio.current?.effect("clear");
              save();
            }
          }
        }
      } else {
        last = 0;
        accumulator = 0;
      }
      if (canvas.current) draw(canvas.current, sim.current, level, reduced);
      raf = requestAnimationFrame(frame);
    }
    function down(e) {
      if (["Escape", "KeyP"].includes(e.code)) {
        pause();
        return;
      }
      if (
        phase.current === "running" &&
        ["Space", "ArrowUp", "KeyW"].includes(e.code)
      ) {
        e.preventDefault();
        held.current = true;
        buffer.current = 8;
      }
    }
    function up(e) {
      if (["Space", "ArrowUp", "KeyW"].includes(e.code)) held.current = false;
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
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", pause);
      document.removeEventListener("visibilitychange", hide);
    };
  }, [run.id]);
  function press(e) {
    if (phase.current !== "running") return;
    e.preventDefault();
    e.currentTarget.setPointerCapture?.(e.pointerId);
    held.current = true;
    buffer.current = 8;
  }
  return (
    <section className="dash-stage-wrap">
      <div className="dash-stage" onContextMenu={(e) => e.preventDefault()}>
        <canvas
          ref={canvas}
          width="1000"
          height="440"
          aria-label={`Level ${run.level}, ${course.title}. Tap the jump button or press Space to jump.`}
          onPointerDown={press}
          onPointerUp={() => (held.current = false)}
          onPointerCancel={() => (held.current = false)}
        />
        {status !== "running" && (
          <div className="dash-overlay" role="status">
            <span>{status === "dead" ? "🌱" : course.icon}</span>
            <h2>
              {status === "ready"
                ? "Ready to jump?"
                : status === "dead"
                  ? "One more try!"
                  : status === "paused"
                    ? "Take a breath."
                    : "Course cleared!"}
            </h2>
            <p>
              {status === "dead"
                ? "Find the rhythm. Your stars are safe."
                : status === "ready"
                  ? "Tap or hold to jump. Dodge spikes and blocks."
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
          onPointerUp={() => (held.current = false)}
          onPointerCancel={() => (held.current = false)}
          onClick={() => {
            if (phase.current === "running") buffer.current = 8;
          }}
        >
          ↑ Jump <small>Tap or hold · Space / ↑</small>
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
      <p className="dash-hint">
        {run.level <= 3 &&
          "Tip: jump when your cube reaches a mint-colored ground mark. "}
        No hurry between tries. Switching tabs pauses the game. Reloading
        restarts the course; revealed study questions stay saved.
      </p>
    </section>
  );
}
