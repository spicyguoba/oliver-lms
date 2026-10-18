import {
  dashCourse,
  initialDash,
  stepDash,
  replayDash,
} from "../lib/dash-engine.mjs";
import {
  dashCourse as oldCourse,
  initialDash as oldInitial,
  stepDash as oldStep,
} from "../lib/dash-engine-v1.mjs";
export function legacyPilot(level, seed) {
  const course = { ...oldCourse(level, seed), engineVersion: 1 },
    jumps = [];
  let state = oldInitial();
  while (!state.dead && !state.won) {
    const obstacle = course.obstacles.find((o) => o.x + o.width > state.x + 4);
    const jump =
      state.y === 0 &&
      !!obstacle &&
      obstacle.x + obstacle.width / 2 - state.x - 15 <= course.speed * 0.33;
    if (jump) jumps.push(state.frame);
    state = oldStep(state, jump, course);
  }
  return { jumps, state, course };
}
// Test-only feedback controller. No test pilot or solution is imported by the app.
export function pilot(level, seed, version = 2) {
  if (version === 1) return legacyPilot(level, seed);
  const course = dashCourse(level, seed),
    inputs = [];
  let state = initialDash();
  while (
    !state.dead &&
    !state.won &&
    state.frame < course.durationFrames + 180
  ) {
    let held = false;
    const v = course.speed * state.speed;
    if (state.mode === "wave" || state.mode === "ship") {
      const obstacle = course.obstacles.find(
        (o) =>
          o.kind === "block" &&
          o.side === "floor" &&
          o.x + o.width > state.x + 4,
      );
      const ceiling =
        obstacle &&
        course.obstacles.find(
          (o) => o.x === obstacle.x && o.side === "ceiling",
        );
      const target =
        obstacle && ceiling ? (obstacle.height + ceiling.y) / 2 : 150;
      if (state.mode === "wave") held = state.y + 15 < target;
      else {
        const up = state.y + 15 + state.vy * 0.3 < target;
        held = state.gravity === -1 ? up : !up;
      }
    } else {
      const orb = course.entities.find(
        (e) =>
          ["pink", "yellow", "blue"].includes(e.kind) &&
          !state.used.includes(e.id) &&
          e.x > state.x - 30 &&
          e.x < state.x + 60,
      );
      if (
        orb &&
        Math.abs(state.y + 15 - orb.y) < orb.radius + 10 &&
        orb.x - state.x < (orb.kind === "pink" ? 25 : 40)
      )
        held = !state.held;
      else {
        const floor = state.gravity === -1 ? state.y === 0 : state.y === 270;
        const obstacles = course.obstacles.filter(
          (o) =>
            o.side === (state.gravity === -1 ? "floor" : "ceiling") &&
            o.x + o.width * 0.85 > state.x + 4,
        );
        const o = obstacles[0];
        const waitPink = course.entities.some(
          (e) =>
            e.kind === "pink" &&
            !state.used.includes(e.id) &&
            e.x > state.x &&
            e.x - state.x < v * 0.65,
        );
        held =
          !waitPink &&
          floor &&
          o &&
          o.x + o.width * 0.5 - state.x - 15 <= v * 0.29;
      }
    }
    held = !!held;
    if (held !== state.held) inputs.push({ frame: state.frame, down: held });
    state = stepDash(state, held, course);
  }
  return { inputs, jumps: inputs, state, course };
}
if (process.argv.includes("--check"))
  for (let l = 1; l <= 20; l++) {
    let failed = [];
    for (let seed = 0; seed < 5; seed++) {
      const p = pilot(l, seed);
      if (!p.state.won)
        failed.push([
          seed,
          p.state.frame,
          Math.round(p.state.y),
          p.state.mode,
          p.course.sections.findIndex((s) => s.end > p.state.x),
        ]);
    }
    console.log(l, failed.length ? failed : "pass");
  }
