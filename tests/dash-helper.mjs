// Test-only pilot. Never imported by app routes or shipped in the client.
import { dashCourse, initialDash, stepDash } from "../lib/dash-engine.mjs";
export function pilot(level, seed) {
  const course = dashCourse(level, seed),
    jumps = [];
  let state = initialDash();
  while (!state.dead && !state.won) {
    const obstacle = course.obstacles.find((o) => o.x + o.width > state.x + 4);
    const jump =
      state.y === 0 &&
      !!obstacle &&
      obstacle.x + obstacle.width / 2 - state.x - 15 <= course.speed * 0.33;
    if (jump) jumps.push(state.frame);
    state = stepDash(state, jump, course);
  }
  return { jumps, state, course };
}
