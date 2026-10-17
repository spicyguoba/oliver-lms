import fs from "node:fs";
import path from "node:path";
import { randomInt, randomUUID } from "node:crypto";
import { rotatePool } from "./rotation.mjs";

const root = path.join(process.cwd(), "content", "vocabulary");
export const vocabularyManifest = JSON.parse(
  fs.readFileSync(path.join(root, "manifest.json"), "utf8"),
);
export const wordBanks = { en: [], zh: [] };
for (const file of vocabularyManifest.files) {
  wordBanks[file.slice(0, 2)].push(
    ...JSON.parse(fs.readFileSync(path.join(root, file), "utf8")),
  );
}
const packs = new Map(vocabularyManifest.packs.map((p) => [p.id, p]));
export const vocabularySkills = Object.fromEntries(
  vocabularyManifest.packs.map((p) => [
    p.id,
    {
      kind: "vocabulary",
      subject: p.language === "zh" ? "Chinese" : "Reading",
      title: `${p.language === "zh" ? (p.mode === "words" ? "Word garden" : "Sentence garden") : p.mode === "words" ? "Word explorers" : "Sentence builders"} ${p.number}`,
      description: `${p.band} · ${p.count} words · ${p.preview}`,
      icon:
        p.language === "zh"
          ? p.mode === "words"
            ? "🌸"
            : "🎋"
          : p.mode === "words"
            ? "🔤"
            : "✏️",
      course: `${p.language}-${p.mode}`,
      band: p.band,
      wordCount: p.count,
      keywords: p.keywords,
      language: p.language,
      mode: p.mode,
      source:
        "Original English practice; Chinese vocabulary and examples with credits in each lesson and content/VOCABULARY.md",
    },
  ]),
);
export function packEntries(id) {
  const p = packs.get(id);
  return p ? wordBanks[p.language].slice(p.start, p.start + p.count) : null;
}
export function vocabularyLesson(id) {
  const p = packs.get(id);
  if (!p) return null;
  return {
    id,
    language: p.language,
    mode: p.mode,
    band: p.band,
    cards: packEntries(id),
    note: "Learn these words first. Each game samples five of the twenty words. Replays prefer least-seen words and avoid the last set. Four rounds visit all twenty targets. Finishing a round does not mean the words are mastered.",
    credits:
      p.language === "zh"
        ? "Vocabulary: HSK / CC-CEDICT contributors. Some sentence pairs: Tatoeba contributors via ManyThings (CC BY 2.0 France), converted to simplified characters. Individual credits appear below each card. Other examples are original family practice text."
        : "Original definitions and school/everyday example sentences. Familiar-word ordering informed by the Dale–Chall list (MIT, Titus Wormer).",
  };
}
function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
function similar(a, b) {
  const words = (t) =>
    new Set(
      t
        .toLowerCase()
        .replace(
          /\b(to|a|an|the|of|or|and|in|for|with|something|someone)\b/g,
          "",
        )
        .match(/[a-z]{2,}/g) || [],
    );
  const x = words(a.meaning),
    y = words(b.meaning);
  const overlap = [...x].filter((w) => y.has(w)).length;
  return (
    a.meaning.toLowerCase() === b.meaning.toLowerCase() ||
    overlap / Math.max(1, Math.min(x.size, y.size)) > 0.55
  );
}
export function vocabularyQuestions(id, recent = []) {
  const p = packs.get(id);
  if (!p) return null;
  const entries = packEntries(id);
  const prompt = (e) =>
    p.mode === "words"
      ? `What does “${e.word}” mean in this example?`
      : `Which word completes this sentence? Clue: ${e.meaning}`;
  const selected = rotatePool(entries, recent, prompt).slice(0, 5);
  return {
    questions: selected.map((e) => {
      const sentence = p.language === "zh" ? e.sentence : e.example;
      const candidates = wordBanks[p.language].filter(
        (d) =>
          d.word !== e.word &&
          d.meaning !== e.meaning &&
          !similar(e, d) &&
          !e.meaning.toLowerCase().includes(d.word.toLowerCase()) &&
          !d.meaning.toLowerCase().includes(e.word.toLowerCase()) &&
          !sentence.toLowerCase().includes(d.word.toLowerCase()) &&
          !(
            p.language === "zh" &&
            (d.word.includes(e.word) || e.word.includes(d.word))
          ),
      );
      const preferred = candidates.filter((d) => entries.includes(d));
      const sameBand = candidates.filter(
        (d) => !entries.includes(d) && d.band === p.band,
      );
      const distractors = [
        ...shuffle(preferred),
        ...shuffle(sameBand),
        ...shuffle(
          candidates.filter((d) => !entries.includes(d) && d.band !== p.band),
        ),
      ].slice(0, 2);
      const options = shuffle([e, ...distractors]).map((d) =>
        p.mode === "words" ? d.meaning : d.word,
      );
      const correct = p.mode === "words" ? e.meaning : e.word;
      const escaped = e.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const blank =
        p.language === "zh"
          ? sentence.replaceAll(e.word, "____")
          : sentence.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "____");
      return {
        id: randomUUID(),
        prompt: prompt(e),
        options,
        answer: String(options.indexOf(correct)),
        explanation: `${e.word}${e.pinyin ? ` (${e.pinyin})` : ""}: ${e.meaning}. ${sentence}${e.translation ? " " + e.translation : ""}`,
        explanationParts:
          p.language === "zh"
            ? [
                [e.word, "zh-CN"],
                [e.meaning, "en-US"],
                [sentence, "zh-CN"],
                [e.translation, "en-US"],
              ]
            : [[`${e.word}. ${e.meaning}. ${sentence}`, "en-US"]],
        context: p.mode === "words" ? sentence : blank,
        vocabWord: p.mode === "words" ? e.word : undefined,
        pronunciation: p.mode === "words" ? e.pinyin : undefined,
        language: p.language,
        optionsLanguage:
          p.language === "zh" && p.mode === "usage" ? "zh-CN" : "en-US",
      };
    }),
  };
}
