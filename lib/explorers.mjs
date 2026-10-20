import fs from "node:fs";
import { randomInt, randomUUID } from "node:crypto";
import { rotatePool } from "./rotation.mjs";
import { COUNTRY_REGIONS } from "../content/atlas-places.mjs";
export const atlas = JSON.parse(
  fs.readFileSync(new URL("../content/atlas.json", import.meta.url), "utf8"),
);
export const peopleBank = JSON.parse(
  fs.readFileSync(new URL("../content/people.json", import.meta.url), "utf8"),
);
export function lifeDates(p) {
  const year = (n) => (n < 0 ? `${Math.abs(n)} BCE` : String(n));
  if (p.born === null) return "Dates uncertain";
  return `${p.approximate ? "about " : ""}${year(p.born)}${p.died === null ? " (born)" : "–" + year(p.died)}`;
}
const groups = new Map();
export const explorerSkills = {};
function add(id, meta, list) {
  groups.set(id, list);
  explorerSkills[id] = {
    ...meta,
    kind: "explorer",
    collectionCount: list.length,
    source:
      "Original practice with linked map / biography sources; content/EXPLORERS.md",
  };
}
function mapSkill(id, title, list, map, mode, description) {
  add(
    id,
    {
      title,
      subject: "Geography",
      course: "maps",
      group:
        map === "states"
          ? "United States"
          : map === "continents"
            ? "Continents"
            : map === "world"
              ? "World mix"
              : COUNTRY_REGIONS.find((r) => r.id === map)?.name,
      icon: mode === "capital" ? "🏛️" : mode === "facts" ? "🔎" : "🗺️",
      map,
      mode,
      description,
    },
    list,
  );
}
mapSkill(
  "map-continents",
  "Continent explorer",
  atlas.continents,
  "continents",
  "locate",
  "Find the seven continents on a real map.",
);
for (const region of COUNTRY_REGIONS)
  for (const mode of ["locate", "capital", "facts"]) {
    mapSkill(
      `map-${region.id}-${mode}`,
      `${region.name} · ${mode === "locate" ? "country hunt" : mode === "capital" ? "capitals" : "place clues"}`,
      atlas.countries.filter(
        (p) =>
          p.region === region.id && !(mode === "capital" && p.id === "360"),
      ),
      region.id,
      mode,
      `Explore ${region.name} with maps, ${mode === "capital" ? "capital cities" : mode === "facts" ? "place facts" : "country shapes"}.`,
    );
  }
for (const mode of ["locate", "capital", "facts"])
  mapSkill(
    `map-world-${mode}`,
    `World mix · ${mode === "locate" ? "country hunt" : mode === "capital" ? "capitals" : "place clues"}`,
    atlas.countries.filter((p) => !(mode === "capital" && p.id === "360")),
    "world",
    mode,
    "Mix places from every inhabited continent.",
  );
for (const mode of ["locate", "capital", "facts"])
  mapSkill(
    `map-states-${mode}`,
    `All 50 states · ${mode === "locate" ? "map hunt" : mode === "capital" ? "capitals" : "state clues"}`,
    atlas.states,
    "states",
    mode,
    "A fresh set of five states from the whole United States.",
  );
for (let i = 0; i < 5; i++)
  for (const mode of ["locate", "capital"])
    mapSkill(
      `map-states-${mode}-${i + 1}`,
      `States trail ${i + 1} · ${mode === "locate" ? "map hunt" : "capitals"}`,
      atlas.states.slice(i * 10, i * 10 + 10),
      "states",
      mode,
      `${atlas.states[i * 10].name} to ${atlas.states[i * 10 + 9].name} · ten places to explore.`,
    );
for (const group of peopleBank.groups) {
  const list = peopleBank.people.filter((p) => p.group === group.id);
  for (let i = 0; i < list.length; i += 10) {
    const pack = list.slice(i, i + 10),
      number = i / 10 + 1;
    add(
      `people-${group.id}-${number}`,
      {
        title: `${group.name} ${number}`,
        subject: "People",
        course: "people",
        icon: group.icon,
        group: group.name,
        keywords: pack.map((p) => p.name).join(" "),
        description: `Meet ${pack.length} people · ${pack[0].name.split(" (")[0]} to ${pack.at(-1).name.split(" (")[0]}.`,
      },
      pack,
    );
  }
}
add(
  "people-world-mix",
  {
    title: "People · world mix",
    subject: "People",
    course: "people",
    icon: "🌟",
    group: "All people",
    description:
      "Mix pictures, achievements and timelines from all 500 people.",
  },
  peopleBank.people,
);
export function explorerLesson(id) {
  const meta = explorerSkills[id],
    list = groups.get(id);
  if (!meta) return null;
  return {
    ...meta,
    id,
    items: list.map((p) =>
      meta.subject === "People"
        ? {
            id: p.id,
            name: p.name,
            fact: p.fact,
            dates: lifeDates(p),
            image: p.image ? { ...p.image, url: `/portraits/${p.id}` } : null,
            source: `${p.wiki}?oldid=${p.revision}`,
            dateSource: `https://www.wikidata.org/wiki/${p.id}`,
          }
        : p,
    ),
  };
}
function shuffle(a) {
  a = a.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const make = (prompt, labels, right, extra, explanation) => ({
  id: randomUUID(),
  prompt,
  options: labels,
  answer: String(right),
  explanation,
  ...extra,
});
export function explorerQuestions(id, recent = []) {
  const meta = explorerSkills[id],
    pool = groups.get(id);
  if (!meta) return null;
  const capitalPrompt = (p) =>
    `Which city is ${p.name}'s ${p.id === "710" ? "executive capital" : p.id === "756" ? "federal city" : p.id === "068" ? "constitutional capital" : "capital"}?`;
  const cluePrompt = (p) =>
    `Which ${meta.map === "states" ? "state" : "country"} is highlighted? Clue: ${p.fact.replaceAll(p.name, meta.map === "states" ? "This state" : "This country")}`;
  const promptIds = new Map(
    pool.flatMap((p) => [
      [`What is ${p.name} remembered for?`, p.id],
      [`Who is pictured? Life dates: ${lifeDates(p)}. Clue: ${p.fact}`, p.id],
      [`When did ${p.name} live?`, p.id],
      [`Find ${p.name} on the map.`, p.id],
      [capitalPrompt(p), p.id],
      [cluePrompt(p), p.id],
    ]),
  );
  const targets = rotatePool(
    pool,
    recent.map((prompt) => promptIds.get(prompt) || prompt),
    (p) => p.id,
  ).slice(0, 5);
  const questions = targets.map((p) => {
    const seenFacts = new Set([p.fact]),
      peers = shuffle(pool.filter((x) => x.id !== p.id))
        .filter((x) => {
          if (seenFacts.has(x.fact)) return false;
          seenFacts.add(x.fact);
          return true;
        })
        .slice(0, 3),
      choices = shuffle([p, ...peers]),
      right = choices.findIndex((x) => x.id === p.id);
    if (meta.subject !== "People") {
      const map = {
        key: meta.map,
        highlight: meta.mode === "locate" ? null : p.id,
        choices: meta.mode === "locate" ? choices.map((x) => x.id) : [],
      };
      const prompt =
        meta.mode === "locate"
          ? `Find ${p.name} on the map.`
          : meta.mode === "capital"
            ? capitalPrompt(p)
            : cluePrompt(p);
      const labels =
        meta.mode === "locate"
          ? choices.map((x, i) => `Map choice ${i + 1}`)
          : meta.mode === "capital"
            ? choices.map((x) => x.capital)
            : choices.map((x) => x.name);
      return make(
        prompt,
        labels,
        right,
        { map, visualAnswer: p.id },
        `${p.name}${p.capital ? ` · ${p.capital}` : ""}. ${p.fact}`,
      );
    }
    const variants = [
      "achievement",
      ...(p.image ? ["picture"] : []),
      ...(p.born !== null && !p.approximate ? ["time"] : []),
    ];
    const mode = variants[randomInt(variants.length)];
    let prompt = `What is ${p.name} remembered for?`,
      labels = choices.map((x) => x.fact);
    if (mode === "picture") {
      prompt = `Who is pictured? Life dates: ${lifeDates(p)}. Clue: ${p.fact}`;
      labels = choices.map((x) => x.name);
    }
    if (mode === "time") {
      prompt = `When did ${p.name} live?`;
      labels = choices.map((x) => lifeDates(x));
      // Several people can share a lifespan. Distinct alternatives are required.
      if (
        new Set(labels).size !== labels.length ||
        choices.some((x) => x.born === null)
      ) {
        prompt = `What is ${p.name} remembered for?`;
        labels = choices.map((x) => x.fact);
      }
    }
    return make(
      prompt,
      labels,
      right,
      {
        photo: p.image
          ? { id: p.id, image: p.image, label: p.image.label }
          : null,
        targetName: mode === "picture" ? null : p.name,
      },
      `${p.name} · ${lifeDates(p)}. ${p.fact}`,
    );
  });
  return { questions };
}
