// Explicit source refresh, never a request-time biography generator.
import fs from "node:fs/promises";
import { createHash } from "node:crypto";
import { peoplePicks, PEOPLE_GROUPS } from "../content/people-picks.mjs";
const cache = new URL("../.data/people-sources/", import.meta.url);
await fs.mkdir(cache, { recursive: true });
const headers = {
  "User-Agent":
    "OliverStudyClub/1.0 (family educational biography source review)",
};
async function json(url, key) {
  const file = new URL(
    createHash("sha256").update(key).digest("hex") + ".json",
    cache,
  );
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch {}
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5500));
      const r = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(25000),
      });
      if (!r.ok) throw Error(`HTTP ${r.status}`);
      const d = await r.json();
      if (d.error) throw Error(JSON.stringify(d.error));
      await fs.writeFile(file, JSON.stringify(d));
      return d;
    } catch (e) {
      if (attempt === 2) throw e;
      await new Promise((resolve) =>
        setTimeout(
          resolve,
          e.message.includes("429") ? 20000 : 2000 * (attempt + 1),
        ),
      );
    }
  }
}
const rows = [],
  issues = [];
for (let start = 0; start < peoplePicks.length; start += 20) {
  const batch = peoplePicks.slice(start, start + 20);
  const args = new URLSearchParams({
    action: "query",
    format: "json",
    formatversion: "2",
    redirects: "1",
    titles: batch.map((p) => p.title).join("|"),
    prop: "info|pageprops|pageimages|extracts",
    exintro: "1",
    explaintext: "1",
    exchars: "1400",
    exlimit: "20",
    piprop: "thumbnail",
    pithumbsize: "320",
  });
  const d = await json(
    "https://en.wikipedia.org/w/api.php?" + args,
    "batch-" + batch.map((p) => p.title).join("-"),
  );
  const changes = [...(d.query.normalized || []), ...(d.query.redirects || [])];
  for (const p of batch) {
    let name = p.title;
    for (let pass = 0; pass < 5; pass++) {
      const r = changes.find((x) => x.from === name);
      if (r) name = r.to;
      else break;
    }
    const page = d.query.pages.find((x) => x.title === name);
    if (
      !page?.pageprops?.wikibase_item ||
      page.pageprops.disambiguation !== undefined
    ) {
      issues.push({ title: p.title, error: "Not a unique biography" });
      continue;
    }
    rows.push({
      ...p,
      id: page.pageprops.wikibase_item,
      name: page.title,
      wiki:
        "https://en.wikipedia.org/wiki/" +
        encodeURIComponent(page.title.replaceAll(" ", "_")),
      revision: page.lastrevid,
      description: page.pageprops["wikibase-shortdesc"] || "",
      thumbnail: page.thumbnail?.source?.split("?")[0] || null,
    });
  }
  console.log(
    `Biographies ${Math.min(start + 20, peoplePicks.length)}/${peoplePicks.length}`,
  );
}
if (issues.length) {
  console.log(JSON.stringify(issues.slice(0, 20), null, 2));
  throw Error("Resolve source titles before publishing");
}
const people = rows;
for (let i = 0; i < people.length; i += 50) {
  const batch = people.slice(i, i + 50);
  const q = `SELECT ?person ?birth ?death WHERE { VALUES ?person { ${batch.map((p) => "wd:" + p.id).join(" ")} } OPTIONAL {?person wdt:P569 ?birth} OPTIONAL {?person wdt:P570 ?death} }`;
  const d = await json(
    "https://query.wikidata.org/sparql?format=json&query=" +
      encodeURIComponent(q),
    "dates-" + batch.map((p) => p.id).join("-"),
  );
  for (const p of batch) {
    const matches = d.results.bindings.filter((x) =>
      x.person.value.endsWith("/" + p.id),
    );
    const years = (field) =>
      [
        ...new Set(
          matches
            .filter((x) => x[field]?.type === "literal")
            .map((x) => x[field].value.match(/^(-?\d+)-/))
            .filter(Boolean)
            .map((m) => Number(m[1]))
            .filter((y) => y !== 0),
        ),
      ].sort((a, b) => a - b);
    const births = years("birth"),
      deaths = years("death");
    p.born = births[0] ?? null;
    p.died = deaths[0] ?? null;
    p.approximate =
      births.length > 1 ||
      deaths.length > 1 ||
      (p.born !== null && p.born < 1500);
  }
  console.log(`Life dates ${Math.min(i + 50, people.length)}/${people.length}`);
}
const plain = (html) =>
  String(html || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
function filename(url) {
  if (!url) return null;
  const match = new URL(url).pathname.match(
    /\/commons\/thumb\/[^/]+\/[^/]+\/([^/]+)\//,
  );
  return match ? decodeURIComponent(match[1]) : null;
}
const imageRows = people.filter((p) => filename(p.thumbnail));
for (let i = 0; i < imageRows.length; i += 20) {
  const batch = imageRows.slice(i, i + 20),
    names = batch.map((p) => "File:" + filename(p.thumbnail));
  const args = new URLSearchParams({
    action: "query",
    titles: names.join("|"),
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: "320",
    format: "json",
  });
  const d = await json(
    "https://commons.wikimedia.org/w/api.php?" + args,
    "images-" + batch.map((p) => p.id).join("-"),
  );
  const pages = Object.values(d.query?.pages || {});
  for (const p of batch) {
    const page = pages.find(
        (x) =>
          x.title?.replaceAll("_", " ") ===
          ("File:" + filename(p.thumbnail)).replaceAll("_", " "),
      ),
      ii = page?.imageinfo?.[0],
      m = ii?.extmetadata;
    const license = plain(m?.LicenseShortName?.value),
      author = plain(m?.Artist?.value) || plain(m?.Credit?.value);
    if (ii && /public domain|^CC (BY|0)|^PDM/i.test(license) && author) {
      const url = (ii.thumburl || p.thumbnail).split("?")[0];
      if (
        ["upload.wikimedia.org", "thumb.wikimedia.org"].includes(
          new URL(url).hostname,
        )
      )
        p.image = {
          url,
          file: page.title,
          source: ii.descriptionurl,
          author,
          license,
          licenseUrl:
            m?.LicenseUrl?.value ||
            "https://commons.wikimedia.org/wiki/Commons:Copyright_rules_by_subject_matter",
          label:
            (p.born ?? 1900) < 1800
              ? "Historical portrait or depiction"
              : "Photo or portrait",
        };
    }
    delete p.thumbnail;
  }
  console.log(
    `Image rights ${Math.min(i + 20, imageRows.length)}/${imageRows.length}`,
  );
}
for (const p of people) {
  delete p.thumbnail;
  delete p.title;
  p.name = p.name.replace(/ \([^)]*\)$/, " ").trim();
}
if (people.length !== 500 || new Set(people.map((p) => p.id)).size !== 500)
  throw Error("Need 500 distinct people");
await fs.writeFile(
  new URL("../content/people.json", import.meta.url),
  JSON.stringify(
    {
      edition: 1,
      checked: "2026-10-19",
      groups: PEOPLE_GROUPS.map(({ rows, ...g }) => g),
      people,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  JSON.stringify({
    people: people.length,
    pictures: people.filter((p) => p.image).length,
    dates: people.filter((p) => p.born !== null).length,
    missingPictures: people.filter((p) => !p.image).map((p) => p.name),
    missingDates: people.filter((p) => p.born === null).map((p) => p.name),
  }),
);
