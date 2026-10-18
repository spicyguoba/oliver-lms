// Shared deterministic 60 Hz physics. Browser input traces are replayed on the server.
export const DASH_SIZE = 30;
export const DASH_LEVELS = [
  [
    "Meadow Hop",
    "🌱",
    "#102f32",
    "#236553",
    "#c6ff79",
    "#ffb3aa",
    [0, 4, 7, 9, 7, 4, 2, 4],
  ],
  [
    "Candy Clouds",
    "☁️",
    "#202949",
    "#5d508d",
    "#ffe59b",
    "#ff92cb",
    [0, 7, 4, 9, 12, 9, 4, 7],
  ],
  [
    "Coral Coast",
    "🐚",
    "#082f49",
    "#096e80",
    "#80ffea",
    "#ffac88",
    [0, 3, 7, 10, 7, 5, 3, 5],
  ],
  [
    "Sunlit Dunes",
    "🏜️",
    "#422936",
    "#ab6542",
    "#ffdd80",
    "#db8aff",
    [0, 1, 4, 7, 8, 7, 4, 1],
  ],
  [
    "Bamboo Bounce",
    "🎋",
    "#102e32",
    "#2c7157",
    "#d1ffa0",
    "#ffbd70",
    [0, 2, 4, 7, 9, 7, 4, 2],
  ],
  [
    "Crystal Cavern",
    "💎",
    "#19183f",
    "#51418c",
    "#a9ffff",
    "#ff9fe9",
    [0, 7, 12, 10, 7, 3, 5, 7],
  ],
  [
    "Neon City",
    "🌃",
    "#15132e",
    "#34367e",
    "#54ffe1",
    "#ff58c8",
    [0, 0, 7, 10, 12, 10, 7, 3],
  ],
  [
    "Autumn Rush",
    "🍂",
    "#36223d",
    "#86444a",
    "#ffdc8c",
    "#ff888a",
    [0, 4, 9, 7, 4, 2, 5, 7],
  ],
  [
    "Moonlit Harbor",
    "🌙",
    "#101f40",
    "#345c7e",
    "#c2e9ff",
    "#f9a3c5",
    [0, 3, 7, 12, 10, 7, 5, 3],
  ],
  [
    "Clockwork Factory",
    "⚙️",
    "#24233b",
    "#68514a",
    "#ffd074",
    "#73e6df",
    [0, 7, 5, 7, 0, 10, 7, 3],
  ],
  [
    "Frozen Aurora",
    "❄️",
    "#102841",
    "#315a80",
    "#a3ffd6",
    "#da9bff",
    [0, 2, 7, 11, 9, 7, 4, 2],
  ],
  [
    "Cherry Skyline",
    "🌸",
    "#30223f",
    "#814c79",
    "#ffdaed",
    "#9de8df",
    [0, 4, 7, 12, 11, 7, 4, 9],
  ],
  [
    "Jungle Circuit",
    "🌴",
    "#102e39",
    "#266c66",
    "#ceff6f",
    "#ffa36f",
    [0, 3, 5, 7, 10, 7, 5, 3],
  ],
  [
    "Volcano Vault",
    "🌋",
    "#321e38",
    "#8a354a",
    "#ffca6b",
    "#ff787e",
    [0, 1, 7, 8, 12, 8, 7, 4],
  ],
  [
    "Starlight Railway",
    "🚂",
    "#181b41",
    "#464a88",
    "#fff4a7",
    "#8cf3ff",
    [0, 7, 9, 12, 14, 12, 7, 4],
  ],
  [
    "Deep Sea Signal",
    "🐙",
    "#092b46",
    "#225f78",
    "#7fffe7",
    "#f699eb",
    [0, 3, 10, 7, 12, 10, 5, 3],
  ],
  [
    "Solar Sprint",
    "☀️",
    "#35233b",
    "#965444",
    "#fff19b",
    "#ff9bd0",
    [0, 4, 8, 12, 11, 8, 4, 7],
  ],
  [
    "Thunder Temple",
    "⚡",
    "#24204d",
    "#57518d",
    "#dbff7a",
    "#b2a0ff",
    [0, 2, 3, 7, 12, 10, 7, 3],
  ],
  [
    "Galaxy Gateway",
    "🪐",
    "#14183b",
    "#4b3c85",
    "#9bffed",
    "#ff9ecf",
    [0, 7, 10, 14, 12, 10, 7, 5],
  ],
  [
    "Crown of the Cosmos",
    "👑",
    "#17112e",
    "#603878",
    "#ffe483",
    "#ff79db",
    [0, 3, 7, 11, 14, 11, 7, 1],
  ],
].map(([title, icon, sky, horizon, accent, hazard, melody], i) => ({
  level: i + 1,
  title,
  icon,
  sky,
  horizon,
  accent,
  hazard,
  melody,
  bpm: 90 + i * 4,
  root: 48 + ((i * 5) % 12),
  voice: ["triangle", "sine", "square", "triangle"][i % 4],
  speed: 216 + i * 10,
  durationFrames: 1080 + i * 45,
  interval: 135 - i * 3.8,
  reward: i === 19 ? 3 : 1,
}));
export function dashLevel(level) {
  return DASH_LEVELS[level - 1];
}
function rng(seed) {
  let n = seed >>> 0;
  return () => {
    n = (Math.imul(n, 1664525) + 1013904223) >>> 0;
    return n / 4294967296;
  };
}
export function dashCourse(level, seed) {
  const config = dashLevel(level);
  if (!config) throw Error("Unknown dash level");
  const random = rng(seed),
    obstacles = [];
  let frame = 150;
  while (frame < config.durationFrames - 85) {
    const width =
      24 +
      (level - 1) * 3.4 +
      (level === 20 ? 12 : 0) +
      Math.floor(random() * 8);
    obstacles.push({
      x: (frame * config.speed) / 60,
      width,
      height: 30 + (level - 1) * 1.6 + Math.floor(random() * 7),
      kind: level > 4 && random() > 0.65 ? "block" : "spikes",
    });
    frame += Math.round(config.interval + random() * 16);
  }
  return { ...config, seed, obstacles };
}
export function initialDash() {
  return { frame: 0, x: 0, y: 0, vy: 0, dead: false, won: false };
}
export function stepDash(state, jump, course) {
  if (state.dead || state.won) return state;
  let vy = jump && state.y === 0 ? 660 : state.vy;
  vy -= 2000 / 60;
  const y = Math.max(0, state.y + vy / 60),
    x = state.x + course.speed / 60,
    frame = state.frame + 1;
  const left = x + 4,
    right = x + DASH_SIZE - 4,
    bottom = y + 3;
  let dead = false;
  for (const o of course.obstacles) {
    if (right <= o.x || left >= o.x + o.width) continue;
    if (o.kind === "block") {
      if (bottom < o.height) dead = true;
    } else {
      const count = Math.max(1, Math.round(o.width / 30)),
        w = o.width / count;
      for (let i = 0; i < count; i++) {
        const center = o.x + (i + 0.5) * w;
        const nearest = Math.max(left, Math.min(right, center));
        const height =
          o.height * Math.max(0, 1 - Math.abs(nearest - center) / (w / 2));
        if (bottom < height) dead = true;
      }
    }
  }
  return {
    frame,
    x,
    y,
    vy: y === 0 ? 0 : vy,
    dead,
    won: !dead && frame >= course.durationFrames,
  };
}
export function replayDash(course, jumps) {
  let state = initialDash(),
    index = 0;
  while (!state.dead && !state.won) {
    state = stepDash(state, jumps[index] === state.frame, course);
    if (jumps[index] === state.frame - 1) index++;
  }
  return state;
}
