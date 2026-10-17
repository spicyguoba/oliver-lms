import { randomInt, randomUUID } from "node:crypto";
import fs from "node:fs";
import { vocabularySkills, vocabularyQuestions } from "./vocabulary.mjs";
import { mathSkills, mathQuestions } from "./math.mjs";
const stories = JSON.parse(
  fs.readFileSync(new URL("../content/stories.json", import.meta.url), "utf8"),
);
export const discoveries = JSON.parse(
  fs.readFileSync(
    new URL("../content/discoveries.json", import.meta.url),
    "utf8",
  ),
).concat(
  JSON.parse(
    fs.readFileSync(
      new URL("../content/additions.json", import.meta.url),
      "utf8",
    ),
  ),
);
export const skills = {
  ...vocabularySkills,
  ...mathSkills,
  fractions: {
    title: "Fraction Forge",
    subject: "Math",
    description: "Build whole things from equal parts.",
    icon: "🍕",
    source: "Math 3: unit fractions, halves, equivalent fractions",
  },
  regrouping: {
    title: "Number Builders",
    subject: "Math",
    description: "Trade tens and ones. Build bigger answers.",
    icon: "🧱",
    source: "Math 3: addition and subtraction with regrouping",
  },
  phonics: {
    title: "Sound Safari",
    subject: "Reading",
    description: "Listen for patterns. Crack the word code.",
    icon: "🌿",
    source:
      "Grade 2 newsletters: digraphs, trigraphs, glued sounds, r-controlled vowels",
  },
  stories: {
    title: "Story Detectives",
    subject: "Reading",
    description: "Follow the clues in a whole story.",
    icon: "📖",
    source: "Grade 2 newsletters: retelling, central message, text evidence",
  },
  chinese: {
    title: "Character Garden",
    subject: "Chinese",
    description: "Grow your collection of Chinese characters.",
    icon: "🌸",
    source: "Chinese L1A–L1C: numbers, plants, weather, introductions",
  },
  science: {
    title: "Discovery Lab",
    subject: "Science",
    description: "Try a little experiment in thinking.",
    icon: "🧲",
    source: "Grade 2 newsletters: pushes, pulls, magnets, observations",
  },
  ...Object.fromEntries(
    discoveries.map(({ id, questions, ...meta }) => [
      id,
      {
        ...meta,
        source:
          "Original discovery activities; educator references in content/SOURCES.md",
      },
    ]),
  ),
};
const phonics = [
  [
    "Which word starts with the /sh/ sound?",
    ["ship", "chip", "thin", "cat"],
    0,
    "The letters sh work together to make /sh/.",
  ],
  [
    "Which word ends with ck?",
    ["duck", "dog", "sun", "map"],
    0,
    "Duck ends with ck. These two letters spell one /k/ sound.",
  ],
  [
    "Find the word with ch.",
    ["chin", "shin", "tin", "fin"],
    0,
    "Chin begins with ch, as in chair.",
  ],
  [
    "Find the word ending in tch.",
    ["catch", "cash", "can", "cap"],
    0,
    "Catch ends with tch, which spells /ch/.",
  ],
  [
    "Which word has dge at the end?",
    ["bridge", "bring", "brick", "brim"],
    0,
    "Bridge ends with dge, which spells /j/.",
  ],
  [
    "Find the word with the same ending sound as sing.",
    ["ring", "rip", "sit", "sink"],
    0,
    "Sing and ring both end with /ng/.",
  ],
  [
    "Which word has the same ending sound as pink?",
    ["bank", "bang", "pin", "pick"],
    0,
    "Pink and bank both end in /nk/.",
  ],
  [
    "Which word has ar, as in star?",
    ["farm", "form", "firm", "foam"],
    0,
    "Farm has the r-controlled vowel ar.",
  ],
  [
    "Which word has or, as in corn?",
    ["horn", "hard", "her", "hot"],
    0,
    "Horn and corn share the or sound.",
  ],
  [
    "Which word has an open syllable with a long vowel?",
    ["me", "met", "mat", "mud"],
    0,
    "Me ends with a vowel, which says its name. Met is closed by a consonant.",
  ],
  [
    "Which word has a closed syllable with a short vowel?",
    ["cat", "he", "go", "hi"],
    0,
    "Cat has a consonant after its vowel. The a has a short sound.",
  ],
  [
    "Which word means more than one box?",
    ["boxes", "box", "boxing", "boxed"],
    0,
    "Add es to box to name more than one box.",
  ],
  [
    "Which word tells about something already done?",
    ["jumped", "jump", "jumping", "jumps"],
    0,
    "The ending ed in jumped shows it happened in the past.",
  ],
  [
    "Which word has two syllables?",
    ["sunset", "sun", "set", "ship"],
    0,
    "Clap sun and set: two beats, two syllables.",
  ],
  [
    "Which word has the same vowel pattern as shark?",
    ["park", "pork", "perk", "peak"],
    0,
    "Shark and park both have ar.",
  ],
  [
    "Which word means doing it right now?",
    ["running", "ran", "run", "runs"],
    0,
    "Running uses ing to show an ongoing action.",
  ],
  [
    "Which word has th at the start?",
    ["thin", "tin", "chin", "shin"],
    0,
    "Thin begins with the th sound.",
  ],
  [
    "Which word ends with the same sound as much?",
    ["lunch", "mug", "mud", "mush"],
    0,
    "Much and lunch end with /ch/.",
  ],
  [
    "Which word has a long vowel in an open syllable?",
    ["go", "got", "gum", "gap"],
    0,
    "Go ends in o, and the o says its name.",
  ],
  [
    "Which word has the same ending pattern as think?",
    ["sink", "sing", "sit", "sick"],
    0,
    "Think and sink both end in ink.",
  ],
];
const chinese = [
  ["一", "one", "yī"],
  ["二", "two", "èr"],
  ["三", "three", "sān"],
  ["四", "four", "sì"],
  ["五", "five", "wǔ"],
  ["六", "six", "liù"],
  ["七", "seven", "qī"],
  ["八", "eight", "bā"],
  ["九", "nine", "jiǔ"],
  ["十", "ten", "shí"],
  ["木", "wood", "mù"],
  ["米", "rice", "mǐ"],
  ["草", "grass", "cǎo"],
  ["花", "flower", "huā"],
  ["竹", "bamboo", "zhú"],
  ["天", "sky", "tiān"],
  ["我", "I / me", "wǒ"],
  ["学", "learn", "xué"],
  ["说", "speak", "shuō"],
  ["话", "speech / words", "huà"],
];
const science = [
  [
    "You push a toy car gently, then harder. What should you compare?",
    [
      "How far it rolls each time",
      "Its favorite color",
      "Who owns it",
      "The day of the week",
    ],
    0,
    "Keep the car and surface the same. Change the push and observe the distance.",
  ],
  [
    "Which action is a pull?",
    [
      "Bringing a wagon toward you",
      "Kicking a ball away",
      "Pushing a door shut",
      "Blowing a leaf away",
    ],
    0,
    "A pull brings an object toward the force.",
  ],
  [
    "Which object is most likely to be attracted to a magnet?",
    ["An iron nail", "A wooden spoon", "A paper cup", "A rubber band"],
    0,
    "Magnets attract iron. Many everyday materials are not attracted.",
  ],
  [
    "Which sentence is an observation?",
    [
      "The car rolled to the rug",
      "I think it is the best car",
      "Cars are always fun",
      "It will win tomorrow",
    ],
    0,
    "An observation describes something you can notice or measure.",
  ],
  [
    "A ball is still. You kick it. What changed its motion?",
    ["A push from your foot", "Its color", "Its name", "The clock"],
    0,
    "Your foot applies a force, a push, that changes the ball’s motion.",
  ],
  [
    "You test two ramps. What makes the test fair?",
    [
      "Use the same car and release point",
      "Push one car very hard",
      "Change everything at once",
      "Guess without trying",
    ],
    0,
    "Keep other things the same so you can compare the ramps.",
  ],
  [
    "Which question can you test?",
    [
      "Will a higher ramp make this car roll farther?",
      "Is blue the nicest color?",
      "Is my toy the coolest?",
      "What is the best game ever?",
    ],
    0,
    "You can measure how far the car rolls from different ramp heights.",
  ],
  [
    "A toy moves more slowly on a rug than a smooth floor. What may explain this?",
    [
      "The rug resists its motion more",
      "The toy forgot its name",
      "The rug is hungry",
      "The clock stopped",
    ],
    0,
    "Friction is a force that resists motion. Surfaces can create different friction.",
  ],
];
function shuffled(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function choice(prompt, options, answer, explanation, extra = {}) {
  const opts = shuffled(
    options.map((label, i) => ({ label, right: i === answer })),
  );
  return {
    id: randomUUID(),
    prompt,
    options: opts.map((x) => x.label),
    answer: String(opts.findIndex((x) => x.right)),
    explanation,
    ...extra,
  };
}
export function createQuestions(
  skill,
  difficulty = 1,
  progress = [],
  recent = [],
) {
  const vocabulary = vocabularyQuestions(skill, recent);
  if (vocabulary) return vocabulary;
  const math = mathQuestions(skill);
  if (math) return math;
  const topic = discoveries.find((t) => t.id === skill);
  if (topic) {
    const pool =
      skill === "states"
        ? topic.questions.slice((difficulty - 1) * 10, difficulty * 10)
        : topic.questions;
    const fresh = shuffled(pool.filter((q) => !recent.includes(q.prompt)));
    const repeated = shuffled(pool.filter((q) => recent.includes(q.prompt)));
    return {
      questions: [...fresh, ...repeated].slice(0, 5).map((q) =>
        skill === "states"
          ? choice(
              q.prompt,
              [
                q.options[q.answer],
                ...shuffled(pool.filter((other) => other !== q))
                  .slice(0, 2)
                  .map((other) => other.options[other.answer]),
              ],
              0,
              q.explanation,
            )
          : choice(q.prompt, q.options, q.answer, q.explanation),
      ),
    };
  }
  if (skill === "stories") {
    const rank = Math.max(
      0,
      progress.findLastIndex((x) => x.unlocked),
    );
    const recent = progress[rank]?.streak || [];
    const pool = stories
      .map((s, id) => ({ ...s, id }))
      .filter((s) => s.level === rank);
    const fresh = pool.filter((s) => !recent.includes(s.id));
    const s = shuffled(fresh.length ? fresh : pool)[0];
    return {
      storyId: s.id,
      rank,
      questions: s.questions.map((q) =>
        choice(q.q, q.options, q.answer, q.why, {
          passage: s.text,
          title: s.title,
        }),
      ),
    };
  }
  if (skill === "phonics" || skill === "science")
    return {
      questions: shuffled(skill === "phonics" ? phonics : science)
        .slice(0, 5)
        .map((x) => choice(...x)),
    };
  if (skill === "chinese")
    return {
      questions: shuffled(chinese)
        .slice(0, 5)
        .map(([char, meaning, pinyin]) => {
          const other = shuffled(chinese.filter((c) => c[1] !== meaning))
            .slice(0, 3)
            .map((c) => c[1]);
          return choice(
            `What does ${char} (${pinyin}) mean?`,
            [meaning, ...other],
            0,
            `${char} (${pinyin}) means ${meaning}. Try saying it and writing it with a grown-up.`,
            { character: char },
          );
        }),
    };
  const used = new Set(),
    questions = [];
  while (questions.length < 5) {
    let q;
    if (skill === "fractions") {
      const denominator = [2, 3, 4, 6, 8, 10][
          randomInt(difficulty === 1 ? 5 : 6)
        ],
        numerator = randomInt(1, denominator);
      q = {
        prompt: `A snack is cut into ${denominator} equal pieces. ${numerator} ${numerator === 1 ? "piece is" : "pieces are"} shaded. What fraction is shaded?`,
        answer: `${numerator}/${denominator}`,
        explanation: `The bottom number counts all ${denominator} equal pieces. The top number counts the ${numerator} shaded ${numerator === 1 ? "piece" : "pieces"}. Write ${numerator}/${denominator}.`,
        diagram: { denominator, numerator },
      };
    } else {
      const max = difficulty === 1 ? 90 : 900,
        a = randomInt(21, max),
        b = randomInt(11, max),
        add = randomInt(2) === 0;
      const x = Math.max(a, b),
        y = Math.min(a, b),
        answer = add ? x + y : x - y;
      q = {
        prompt: `${x} ${add ? "+" : "−"} ${y} = ?`,
        answer: String(answer),
        explanation: add
          ? `Add the ones first, trade 10 ones for a ten when needed, then add the tens${difficulty > 1 ? " and hundreds" : ""}. ${x} + ${y} = ${answer}.`
          : `Subtract the ones first. If there are not enough ones, trade one ten for 10 ones. Then subtract the tens${difficulty > 1 ? " and hundreds" : ""}. ${x} − ${y} = ${answer}.`,
      };
    }
    if (!used.has(q.prompt)) {
      used.add(q.prompt);
      questions.push({ id: randomUUID(), ...q });
    }
  }
  return { questions };
}
export function publicQuestion(q) {
  if (!q) return null;
  const { answer, explanation, explanationParts, ...safe } = q;
  return safe;
}
export function normalizeAnswer(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\s/g, "")
    .replace(/−/g, "-");
}
export function grade(q, answer) {
  const value = normalizeAnswer(answer),
    expected = normalizeAnswer(q.answer);
  const fraction = /^(\d{1,6})\/(\d{1,6})$/;
  const a = value.match(fraction),
    b = expected.match(fraction);
  if (a && b && Number(a[2]) > 0 && Number(b[2]) > 0)
    return Number(a[1]) * Number(b[2]) === Number(b[1]) * Number(a[2]);
  if (
    /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(value) &&
    /^-?(?:\d+(?:\.\d*)?|\.\d+)$/.test(expected)
  )
    return Number(value) === Number(expected);
  return value === expected;
}
export function updateStoryProgress(progress, rank, storyId, correct) {
  const p = progress[rank];
  p.streak = correct >= 4 ? [...p.streak, storyId].slice(-3) : [];
  if (p.streak.length === 3 && new Set(p.streak).size === 3 && rank < 4)
    progress[rank + 1].unlocked = true;
}
