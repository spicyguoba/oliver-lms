import * as legacy from "./dash-engine-v1.mjs";
export const DASH_SIZE = 30,
  DASH_HEIGHT = 300;
export const DASH_LEVELS = legacy.DASH_LEVELS;
export const dashLevel = legacy.dashLevel;
export const DASH_LESSONS = [
  "Tap for each jump. Holding will not jump again.",
  "Green spring pads launch you automatically. Tap for the next obstacle.",
  "Tap inside yellow rings for a big boost. Pink rings make a little hop.",
  "Blue and yellow portals turn gravity upside down. Jump away from your new floor.",
  "Tap a blue ring in mid-air to flip gravity.",
  "Orange portals create a mirrored friend. One tap moves both. Protect both cubes!",
  "SHIP: hold to fly up; release to fall. Steer through the gaps.",
  "WAVE: hold to zig up; release to zag down. Flat walls are safe; hazards are not.",
  "Speed gates change the pace. Look ahead and adjust your timing.",
  "Switch between cube, ship, wave and dual. Read the next gate.",
  "Gravity can change during flight. Watch the arrow.",
  "Two cubes, spring pads and upside-down jumps. Both must survive.",
  "Wave corridors change speed. Use short presses and releases.",
  "Chain little hops, boosts and gravity rings. Every tap matters.",
  "Narrow ship corridors. Use gentle bursts of thrust.",
  "Mirrored cubes at changing speeds. Watch both sides.",
  "Fast wave slalom. Keep your eyes on the next gap.",
  "All mechanics together. Settle into each new rhythm.",
  "A fast mixed challenge. Read gates before you reach them.",
  "COSMIC MASTER: tight gaps, mirrored jumps and up to 4× speed. Take it one section at a time.",
];
const layouts = [
  ["cube", "cube", "cube", "cube"],
  ["cube", "pad", "cube", "pad"],
  ["pink", "orb", "cube", "orb"],
  ["flip", "cube", "flip", "cube"],
  ["blue", "flip", "orb", "blue"],
  ["dual", "cube", "dual", "flip"],
  ["ship", "ship", "cube", "ship"],
  ["wave", "wave", "ship", "wave"],
  ["cube", "ship", "wave", "cube"],
  ["orb", "flip", "ship", "wave", "dual"],
  ["flip", "ship-flip", "blue", "ship", "flip"],
  ["dual", "pad", "dual-flip", "flip", "dual"],
  ["wave", "wave", "wave", "ship", "wave"],
  ["pink", "orb", "blue", "flip", "orb", "dual"],
  ["ship", "ship-flip", "ship", "ship", "ship-flip", "ship"],
  ["dual", "dual-flip", "dual", "flip", "dual-flip", "dual"],
  ["wave", "wave", "ship", "wave", "wave", "wave"],
  ["pink", "blue", "dual-flip", "ship-flip", "wave", "orb", "flip"],
  ["blue", "ship-flip", "wave", "dual-flip", "pink", "orb", "wave", "dual"],
  [
    "cube",
    "pink",
    "orb",
    "blue",
    "dual-flip",
    "ship-flip",
    "wave",
    "dual",
    "wave",
    "ship",
  ],
];
function randomFor(seed) {
  let n = seed >>> 0;
  return () => (n = (Math.imul(n, 1664525) + 1013904223) >>> 0) / 4294967296;
}
export function dashCourse(level, seed, version = 2) {
  if (version === 1)
    return { ...legacy.dashCourse(level, seed), engineVersion: 1 };
  const config = dashLevel(level);
  if (!config) throw Error("Unknown dash level");
  const random = randomFor(seed),
    obstacles = [],
    entities = [],
    sections = [];
  const length = 240,
    intro = 60,
    speed = config.speed;
  let x = 0;
  const add = (kind, at, extra = {}) =>
    entities.push({ id: entities.length, kind, x: at, ...extra });
  layouts[level - 1].forEach((kind, i) => {
    const multiplier =
      level === 20
        ? [1, 2, 2, 2, 3, 2, 4, 3, 4, 3][i]
        : level >= 17
          ? [2, 3, 2, 3, 2, 3, 2, 3][i]
          : level >= 13
            ? [2, 0.5, 2, 1, 2, 2][i]
            : level === 9
              ? [0.5, 2, 1, 2][i]
              : level >= 10 && i % 2
                ? 2
                : 1;
    const v = speed * multiplier,
      start = x,
      at = (f) => start + (v * f) / 60;
    // A clear lead-in allows the previous movement mode to settle naturally.
    sections.push({ x: start, end: at(length), kind, multiplier });
    add("speed", start, { value: multiplier });
    add("mode", at(8), {
      value: kind.startsWith("ship")
        ? "ship"
        : kind === "wave"
          ? "wave"
          : "cube",
    });
    add("gravity", at(16), { value: -1 });
    add("dual", at(24), { value: kind.startsWith("dual") });
    const hazard = (frame, widthFrames, height, side = "floor") =>
      obstacles.push({
        x: at(frame),
        width: (v * widthFrames) / 60,
        height,
        y: side === "floor" ? 0 : DASH_HEIGHT - height,
        kind: "spikes",
        side,
      });
    if (kind.includes("flip") || kind === "flip")
      add("gravity", at(48), { value: 1 });
    if (kind.startsWith("ship") || kind === "wave") {
      // Alternating gaps require active steering. Narrower late-game corridors.
      const gap = level === 20 ? 86 : Math.max(104, 184 - level * 4);
      [94, 145, 196].forEach((f, j) => {
        const center = (j % 2 === 0 ? 112 : 200) + (random() - 0.5) * 18;
        const width = (v * (level >= 17 ? 9 : 12)) / 60;
        obstacles.push({
          x: at(f),
          width,
          y: 0,
          height: center - gap / 2,
          kind: "block",
          side: "floor",
        });
        obstacles.push({
          x: at(f),
          width,
          y: center + gap / 2,
          height: DASH_HEIGHT - center - gap / 2,
          kind: "block",
          side: "ceiling",
        });
      });
    } else if (["orb", "blue", "pink", "pad"].includes(kind)) {
      if (kind === "pink") {
        add("pink", at(89) + 15, { y: 24, radius: 35 });
        hazard(96, 8, 24);
        obstacles.push({
          x: at(88),
          width: (v * 32) / 60,
          y: 75,
          height: 225,
          kind: "block",
          side: "ceiling",
        });
      } else {
        add("pad", at(60), { y: 0 });
        if (kind !== "pad")
          add(kind === "blue" ? "blue" : "yellow", at(82) + 15, {
            y: 166,
            radius: 34,
          });
        hazard(kind === "pad" ? 80 : 101, 10, kind === "pad" ? 70 : 180);
      }
      hazard(
        190,
        level >= 14 ? 16 : 10,
        55,
        kind === "blue" ? "ceiling" : "floor",
      );
    } else {
      const side =
        kind.includes("flip") || kind === "flip" ? "ceiling" : "floor";
      const times =
        level >= 16
          ? [98, 149, 202]
          : level >= 10
            ? [102, 162, 215]
            : [108, 190];
      times.forEach((f) => {
        const widthFrames = level === 20 ? 17 : 8 + random() * 7;
        const height = 38 + level * 1.5 + random() * 8;
        hazard(f, widthFrames, height, side);
        if (kind.startsWith("dual"))
          hazard(
            f,
            widthFrames,
            height,
            side === "floor" ? "ceiling" : "floor",
          );
      });
    }
    x = at(length);
  });
  // Initial runway is part of the deterministic track, not a user-controllable timer.
  const lead = (speed * intro) / 60;
  for (const e of entities) e.x += lead;
  for (const o of obstacles) o.x += lead;
  for (const s of sections) {
    s.x += lead;
    s.end += lead;
  }
  return {
    ...config,
    engineVersion: 2,
    seed,
    height: DASH_HEIGHT,
    obstacles,
    entities,
    sections,
    finishX: x + lead,
    durationFrames: intro + length * sections.length,
    lesson: DASH_LESSONS[level - 1],
  };
}
export function initialDash(version = 2) {
  if (version === 1) return legacy.initialDash();
  return {
    frame: 0,
    x: 0,
    y: 0,
    vy: 0,
    gravity: -1,
    mode: "cube",
    dual: false,
    speed: 1,
    held: false,
    buffer: 0,
    used: [],
    dead: false,
    won: false,
    effect: null,
  };
}
function nearOrb(s, e) {
  const cx = Math.max(s.x, Math.min(s.x + DASH_SIZE, e.x)),
    cy = Math.max(s.y, Math.min(s.y + DASH_SIZE, e.y));
  return (cx - e.x) ** 2 + (cy - e.y) ** 2 <= e.radius ** 2;
}
function hazardHit(x, y, o) {
  // Both shapes have inner death colliders: 15% inset on the hazard and 4px on the player.
  const l = x + 4,
    r = x + 26,
    b = y + 4,
    t = y + 26,
    ol = o.x + o.width * 0.15,
    or = o.x + o.width * 0.85;
  if (r <= ol || l >= or) return false;
  if (o.kind === "block")
    return t > o.y + o.height * 0.15 && b < o.y + o.height * 0.85;
  const count = Math.max(1, Math.round(o.width / 30)),
    w = o.width / count;
  for (let i = 0; i < count; i++) {
    const center = o.x + (i + 0.5) * w,
      nearest = Math.max(l, Math.min(r, center));
    const h =
      o.height *
      0.85 *
      Math.max(0, 1 - Math.abs(nearest - center) / (w * 0.425));
    if (h > 0 && (o.side === "ceiling" ? t > DASH_HEIGHT - h : b < h))
      return true;
  }
  return false;
}
export function stepDash(state, held, course) {
  if (course.engineVersion === 1) return legacy.stepDash(state, held, course);
  if (state.dead || state.won) return state;
  const s = { ...state, used: [...state.used], effect: null };
  const pressed = held && !state.held;
  s.held = held;
  s.buffer = pressed ? 5 : Math.max(0, s.buffer - 1); // five fixed steps ≈ 83 ms
  const trigger = (e) => {
    s.used.push(e.id);
    s.effect = e.kind;
    s.burst = { x: e.x, y: e.y ?? 150, kind: e.kind, frame: s.frame };
  };
  // Swept horizontal portal overlap cannot miss a thin gate at high speed.
  const nextX = s.x + (course.speed * s.speed) / 60;
  for (const e of course.entities) {
    if (s.used.includes(e.id)) continue;
    const crossing =
      (s.x + DASH_SIZE >= e.x && state.x < e.x + 18) ||
      (nextX + DASH_SIZE >= e.x && s.x < e.x);
    if (["speed", "mode", "gravity", "dual"].includes(e.kind) && crossing) {
      trigger(e);
      if (e.kind === "speed") s.speed = e.value;
      if (e.kind === "mode") {
        s.mode = e.value;
        s.vy = 0;
        s.buffer = 0;
      }
      if (e.kind === "gravity") s.gravity = e.value;
      if (e.kind === "dual") s.dual = e.value;
    }
  }
  for (const e of course.entities) {
    if (s.used.includes(e.id)) continue;
    if (
      e.kind === "pad" &&
      s.mode === "cube" &&
      s.x + DASH_SIZE >= e.x &&
      s.x < e.x + 20 &&
      s.y < 8
    ) {
      trigger(e);
      s.vy = 760;
      s.buffer = 0;
    }
    if (
      ["yellow", "pink", "blue"].includes(e.kind) &&
      s.mode === "cube" &&
      s.buffer > 0 &&
      nearOrb(s, e)
    ) {
      trigger(e);
      s.buffer = 0;
      if (e.kind === "blue") {
        s.gravity *= -1;
        s.vy = s.gravity * 220;
      } else s.vy = -s.gravity * (e.kind === "pink" ? 400 : 720);
    }
  }
  const grounded = s.gravity === -1 ? s.y <= 0 : s.y >= DASH_HEIGHT - DASH_SIZE;
  if (s.mode === "cube") {
    if (grounded && s.buffer > 0) {
      s.vy = -s.gravity * 660;
      s.buffer = 0;
      s.effect = "jump";
    }
    s.vy += (s.gravity * 2000) / 60;
  } else if (s.mode === "ship") {
    s.vy += (held ? -s.gravity * 1150 : s.gravity * 850) / 60;
    s.vy = Math.max(-330, Math.min(330, s.vy * 0.988));
  } else s.vy = (held ? 1 : -1) * course.speed * s.speed;
  s.x += (course.speed * s.speed) / 60;
  s.y += s.vy / 60;
  if (s.y < 0) {
    s.y = 0;
    s.vy = Math.max(0, s.vy);
  }
  if (s.y > DASH_HEIGHT - DASH_SIZE) {
    s.y = DASH_HEIGHT - DASH_SIZE;
    s.vy = Math.min(0, s.vy);
  }
  s.frame++;
  for (const o of course.obstacles) {
    if (
      hazardHit(s.x, s.y, o) ||
      (s.dual && hazardHit(s.x, DASH_HEIGHT - DASH_SIZE - s.y, o))
    ) {
      s.dead = true;
      break;
    }
  }
  s.won = !s.dead && s.x >= course.finishX;
  return s;
}
export function validDashInputs(course, inputs) {
  return (
    Array.isArray(inputs) &&
    inputs.length <= course.durationFrames + 180 &&
    inputs.every(
      (e, i) =>
        e &&
        Number.isInteger(e.frame) &&
        e.frame >= 0 &&
        e.frame < course.durationFrames + 180 &&
        typeof e.down === "boolean" &&
        (i === 0
          ? e.down === true
          : e.frame > inputs[i - 1].frame && e.down !== inputs[i - 1].down),
    )
  );
}
export function replayDash(course, inputs) {
  if (course.engineVersion === 1) return legacy.replayDash(course, inputs);
  let s = initialDash(),
    i = 0,
    held = false;
  while (!s.dead && !s.won && s.frame < course.durationFrames + 180) {
    if (inputs[i]?.frame === s.frame) held = inputs[i++].down;
    s = stepDash(s, held, course);
  }
  return s;
}
