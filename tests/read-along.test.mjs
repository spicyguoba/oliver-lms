import test from "node:test";
import assert from "node:assert/strict";
import {
  wordAt,
  questionSpeech,
  mappedRange,
  speakParts,
} from "../public/read-along.js";

test("speech boundaries select complete words, retaining UTF-16 offsets", () => {
  const text = "🦊 Oliver’s ice-age story, again!";
  for (const [index, expected] of [
    [3, "Oliver’s"],
    [5, "Oliver’s"],
    [14, "ice"],
    [23, "story"],
    [26, "again"],
  ]) {
    const r = wordAt(text, index);
    assert.equal(text.slice(r.start, r.end), expected);
  }
  assert.equal(wordAt(text, text.length), null);
  assert.equal(wordAt(text, -1), null);
  assert.equal(wordAt(text, NaN), null);
});

test("Mandarin highlights word segments rather than a whole unspaced sentence", () => {
  const text = "我喜欢学习中文。";
  const range = wordAt(text, 3, "zh-CN");
  assert.equal(text.slice(range.start, range.end), "学习");
  assert.ok(range.end - range.start < text.length);
  assert.equal(wordAt("。", 0, "zh-CN"), null);
});

test("question narration binds displayed parts and keeps synthetic choice labels unbound", () => {
  const parts = questionSpeech({
    passage: "A tale.",
    prompt: "Which word?",
    context: "学习",
    language: "zh",
    options: ["学习", "故事"],
    optionsLanguage: "zh-CN",
  });
  assert.deepEqual(parts.slice(0, 3), [
    ["A tale."],
    ["Which word?"],
    ["学习", "zh-CN"],
  ]);
  assert.deepEqual(parts.slice(3), [
    ["Choice 1.", "en-US", false],
    ["学习", "zh-CN"],
    ["Choice 2.", "en-US", false],
    ["故事", "zh-CN"],
  ]);
});

test("a spoken word crossing formatted text nodes maps to its original DOM offsets", () => {
  const first = {},
    second = {};
  const map = {
    nodes: [
      { node: first, start: 0, text: "A won" },
      { node: second, start: 5, text: "derful day" },
    ],
  };
  const range = {};
  const doc = {
    createRange: () => ({
      setStart: (node, offset) => {
        range.start = [node, offset];
      },
      setEnd: (node, offset) => {
        range.end = [node, offset];
      },
    }),
  };
  mappedRange(map, 2, 11, doc);
  assert.deepEqual(range, { start: [first, 2], end: [second, 6] });
  assert.equal(mappedRange(map, 30, 31, doc), null);
});

test("server rendering never accesses browser speech or child data", () => {
  assert.equal(speakParts([["Hello"]]), false);
});
