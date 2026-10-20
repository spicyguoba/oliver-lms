import fs from "node:fs/promises";
import { geoPath, geoNaturalEarth1, geoEquirectangular } from "d3-geo";
import { feature } from "topojson-client";
import {
  COUNTRIES,
  CONTINENTS,
  STATE_FACTS,
} from "../content/atlas-places.mjs";
const out = new URL("../public/maps/", import.meta.url);
await fs.mkdir(out, { recursive: true });
async function source(name) {
  const cache = new URL(`../.data/${name}.json`, import.meta.url);
  try {
    return JSON.parse(await fs.readFile(cache, "utf8"));
  } catch {}
  const r = await fetch(
    `https://raw.githubusercontent.com/nvkelso/natural-earth-vector/v5.1.2/geojson/${name}.geojson`,
  );
  if (!r.ok) throw Error(`Map source ${r.status}`);
  const d = await r.json();
  await fs.writeFile(cache, JSON.stringify(d));
  return d;
}
const physical = await source("ne_110m_geography_regions_polys");
const countrySource = await source("ne_50m_admin_0_countries");
const countries = countrySource.features.map((f) => ({
  ...f,
  id: f.properties.ISO_N3_EH,
}));
const round = (point) => point.map((n) => Math.round(n * 10) / 10);
function shapes(features, path) {
  return features
    .map((f) => ({
      id: String(f.id),
      d: path(f) || "",
      point: round(path.centroid(f)),
    }))
    .filter((s) => s.d);
}
const projection = geoNaturalEarth1().fitExtent(
  [
    [15, 12],
    [985, 578],
  ],
  { type: "Sphere" },
);
const continentFeatures = physical.features
  .filter((f) => f.properties.FEATURECLA === "Continent")
  .map((f) => ({
    ...f,
    id: CONTINENTS.find((c) => c.name.toUpperCase() === f.properties.NAME)?.id,
  }));
const context = (await source("ne_110m_admin_0_countries")).features.map(
  (f, i) => ({ ...f, id: `land-${i}` }),
);
await fs.writeFile(
  new URL("continents.json", out),
  JSON.stringify({
    width: 1000,
    height: 590,
    shapes: [
      ...shapes(context, geoPath(projection).digits(1)),
      ...shapes(continentFeatures, geoPath(projection).digits(1)),
    ],
  }),
);
const views = {
  world: null,
  africa: [20, 2, 440],
  asia: [90, 32, 370],
  europe: [15, 53, 760],
  "north-america": [-100, 42, 350],
  "south-america": [-60, -22, 440],
  oceania: [155, -20, 550],
};
for (const [key, params] of Object.entries(views)) {
  const proj = params
    ? geoEquirectangular()
        .rotate([-params[0], 0])
        .center([0, params[1]])
        .scale(params[2])
        .translate([500, 295])
        .clipExtent([
          [4, 4],
          [996, 586],
        ])
    : projection;
  const path = geoPath(proj).digits(1);
  const paths = shapes(countries, path);
  // A marker makes tiny island countries selectable without inventing larger land.
  for (const p of paths) {
    const f = countries.find((f) => String(f.id) === p.id),
      point = proj([f.properties.LABEL_X, f.properties.LABEL_Y]);
    if (
      point &&
      point[0] >= 8 &&
      point[0] <= 992 &&
      point[1] >= 8 &&
      point[1] <= 582
    )
      p.point = round(point);
  }
  await fs.writeFile(
    new URL(key + ".json", out),
    JSON.stringify({ width: 1000, height: 590, shapes: paths }),
  );
}
const topo = JSON.parse(
  await fs.readFile(
    new URL("../node_modules/us-atlas/states-albers-10m.json", import.meta.url),
    "utf8",
  ),
);
const stateFeatures = feature(topo, topo.objects.states).features.filter(
  (f) => f.id !== "11",
);
const old = JSON.parse(
  await fs.readFile(
    new URL("../content/discoveries.json", import.meta.url),
    "utf8",
  ),
).find((t) => t.id === "states");
const states = old.collection.map((s) => {
  const f = stateFeatures.find((f) => f.properties.name === s.name);
  if (!f) throw Error(s.name);
  return {
    id: String(f.id),
    name: s.name,
    capital: s.detail,
    fact: STATE_FACTS.find((x) => x[0] === s.name)[1],
    source:
      "https://kids.nationalgeographic.com/geography/states/article/" +
      s.name.toLowerCase().replaceAll(" ", "-"),
  };
});
const statePaths = shapes(stateFeatures, geoPath().digits(1));
await fs.writeFile(
  new URL("states.json", out),
  JSON.stringify({ width: 975, height: 610, shapes: statePaths }),
);
const missing = COUNTRIES.filter(
  (c) => !countries.some((f) => String(f.id) === c.id),
);
if (missing.length)
  throw Error("Missing country geometry: " + missing.map((c) => c.name));
if (states.length !== 50) throw Error("Need 50 states");
await fs.writeFile(
  new URL("../content/atlas.json", import.meta.url),
  JSON.stringify(
    {
      edition: 1,
      checked: "2026-10-19",
      continents: CONTINENTS,
      countries: COUNTRIES.map((c) => ({
        ...c,
        source:
          "https://en.wikipedia.org/wiki/" +
          encodeURIComponent(c.name === "Türkiye" ? "Turkey" : c.name),
      })),
      states,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    continents: CONTINENTS.length,
    countries: COUNTRIES.length,
    states: states.length,
    maps: Object.keys(views).length + 2,
  }),
);
