import fs from "node:fs/promises";
const base = (process.env.LMS_URL || "http://127.0.0.1:3000").replace(
  /\/$/,
  "",
);
const origin = new URL(base).origin;
if (
  !["localhost", "127.0.0.1"].includes(new URL(base).hostname) &&
  !process.env.LMS_ADMIN_PASSWORD
)
  throw Error(
    "Set LMS_ADMIN_PASSWORD in your local environment for a hosted import. Never put it in a command argument or commit it.",
  );
let cookie = "";
async function request(route, body) {
  const r = await fetch(base + "/api/" + route, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      Origin: origin,
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.headers.get("set-cookie"))
    cookie = r.headers.get("set-cookie").split(";")[0];
  const json = await r.json();
  if (!r.ok) throw Error(json.error);
  return json;
}
const manifest = JSON.parse(
  await fs.readFile(".data/materials-manifest.json", "utf8"),
);
await request("login", {
  username: "admin",
  password: process.env.LMS_ADMIN_PASSWORD || "admin1234",
});
const imported = await request("admin/materials/import", manifest);
const state = await request("admin");
if (process.argv.includes("--initial-plan") && !state.assignments.length) {
  const byPath = (part) =>
    state.materials.find((m) => m.relativePath.includes(part));
  const math = byPath("Math-3-Course"),
    chinese = byPath("L1A"),
    newsletter = byPath("September_27"),
    remote = state.materials.find((m) => m.relativePath.endsWith(".gdoc"));
  const notes = [
    [
      math,
      "Home-use course. Parent notes identify fractions and multi-digit regrouping as gaps. Use lessons 2 and 7 for regrouping; 23 for unit fractions; 35 and 38 for halves and naming fractions. Later: 43 (comparison), 47 (equivalence), 51 (number line). Page numbers are printed pages from the contents, not PDF page indices. Original file stays local; do not upload or redistribute.",
    ],
    [
      chinese,
      "Opening pages reviewed: numbers one through five, counting, matching, tracing and reading with pinyin. Use one short section, say each character, then write it on paper. L1B extends to plants; L1C to speaking and introductions. Start with L1; use L2 only when the parent sees readiness.",
    ],
    [
      newsletter,
      "School topics reviewed: ar/or spelling patterns, asking and answering text questions, chronological retelling, doubles/near doubles/making 10/inverse operations. Earlier newsletters include sh/ch/th/ck, tch/dge, ng/nk, open/closed syllables, place value, forces and magnets. Dates are historical topic sources, not current school deadlines.",
    ],
    [
      remote,
      "Connected Google Doc text reviewed on 2026-10-16. Prior-grade remote-learning choice board with screen-free literacy, math, science, movement and art. Use as optional reinforcement: retell beginning/middle/end, group small objects into tens, draw an observation and explain it. The local .gdoc is a shortcut, not a document-content backup.",
    ],
  ];
  for (const [material, note] of notes)
    if (material)
      await request("admin/material", {
        id: material.id,
        note,
        status: "reviewed",
      });
  const zip = state.materials.find((m) => m.title.endsWith(".zip"));
  if (zip)
    await request("admin/material", {
      id: zip.id,
      status: "reviewed",
      note: "Archive inventory and first four pages of all five PDFs reviewed: L2A–L2D workbooks (40 pages each) and a 26-page L1–L2 review workbook. Topics include learning/student vocabulary and punctuation, animal names/radicals, classmates and measure words, colors and everyday phrases. Use as extension after L1. Full books remain in the verified local ZIP snapshot.",
    });
  const plans = [
    {
      id: "reading-retell",
      title: "Read, retell, find a clue",
      materialId: newsletter?.id,
      days: [1, 2, 3, 4, 5],
      minutes: 5,
      stars: 3,
      instructions:
        "Read one short passage together. Let Oliver tell the beginning, middle, and end. Ask one “why” question and have him point to a clue. Read aloud for him when needed; tell the parent what help was used.",
    },
    {
      id: "math-hands-on",
      title: "Build it with tens and ones",
      materialId: math?.id,
      days: [1, 3, 5],
      minutes: 5,
      stars: 3,
      instructions:
        "Use the saved Math 3 course, lesson 2 or 7, for 2–3 problems at a comfortable level. Model regrouping with tens and ones on paper or with blocks. Let Oliver explain one trade. Finish with a Number Builders round when ready.",
    },
    {
      id: "fraction-share",
      title: "Share a whole fairly",
      materialId: math?.id,
      days: [2, 4],
      minutes: 5,
      stars: 3,
      instructions:
        "Use Math 3 lesson 23 (unit fractions), then 35 or 38 when ready. Fold or draw one whole into equal parts. Name the total parts and one chosen part. Try Fraction Forge after the hands-on explanation.",
    },
    {
      id: "chinese-garden",
      title: "Say it, find it, write it",
      materialId: chinese?.id,
      days: [1, 3, 5],
      minutes: 4,
      stars: 3,
      instructions:
        "Start with one small L1A section. Say 3–5 characters, find them on the page, and write each on paper. Use L1B plants and L1C introductions for variety. L2 stays an optional extension until the parent checks readiness.",
    },
    {
      id: "screen-free-discovery",
      title: "A discovery away from the screen",
      materialId: remote?.id,
      days: [6],
      minutes: 8,
      stars: 4,
      instructions:
        "Choose a screen-free activity from the saved remote-learning plan: group small objects into tens, retell a favorite story, or draw an observation. Ask Oliver to explain what he noticed. Record completion after a grown-up sees the work.",
    },
  ];
  for (const plan of plans) await request("admin/assignment", plan);
  const coins = state.materials.find((m) => m.title.includes("BBCoin"));
  if (coins)
    await request("admin/material", {
      id: coins.id,
      status: "reviewed",
      note: "Connected sheet text reviewed on 2026-10-16. Family concept for missions, skills, history and a shop, including future cash conversion and penalties. Initial LMS uses separate stars and parent-approved family experiences. No cash exchange, penalty deductions, or automated screen-time promises are enabled.",
    });
}
console.log(
  `Imported ${imported.added} new entries; ${imported.total} materials in the private library. ${process.argv.includes("--initial-plan") ? "Initial plan created only if none existed." : ""}`,
);
