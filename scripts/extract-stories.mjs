import fs from "node:fs";
const html = fs.readFileSync("legacy/stories.html", "utf8");
const start = html.indexOf("const STORIES=") + "const STORIES=".length;
const end = html.indexOf(";", start);
fs.writeFileSync(
  "content/stories.json",
  JSON.stringify(JSON.parse(html.slice(start, end)), null, 2),
);
console.log("Stored original story corpus separately for server-side grading");
