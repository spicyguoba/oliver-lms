import { randomInt, randomUUID } from "node:crypto";
const definitions = [
  [
    "groups",
    "Equal-group factory",
    "✖️",
    "Build multiplication from equal groups.",
    "Equal groups have the same number in each group.",
    "Multiply the number of groups by the number in each group.",
    "Three groups of four make twelve: 3 × 4 = 12.",
  ],
  [
    "sharing",
    "Sharing station",
    "➗",
    "Share fairly and explore division.",
    "Division can share a total into equal groups.",
    "Twelve counters shared among three people give four each.",
    "Check division by multiplying: 3 × 4 = 12.",
  ],
  [
    "place",
    "Place-value towers",
    "🏗️",
    "Find the value of a digit.",
    "A digit's place tells us its value.",
    "In 472, the 4 means four hundreds, or 400.",
    "Ten ones make a ten, and ten tens make a hundred.",
  ],
  [
    "rounding",
    "Rounding rockets",
    "🚀",
    "Round whole numbers to the nearest ten.",
    "Find the tens on either side of a number.",
    "Choose the closer ten; a halfway five rounds up here.",
    "For example, 47 rounds to 50, and 42 rounds to 40.",
  ],
  [
    "clock",
    "Clock workshop",
    "🕒",
    "Connect hours and minutes.",
    "An hour has sixty minutes.",
    "Half an hour is thirty minutes, and a quarter hour is fifteen.",
    "Add the minutes after the whole hours to find a total.",
  ],
  [
    "coins",
    "Coin counter",
    "🪙",
    "Count U.S. coins in cents.",
    "A penny is 1 cent; a nickel is 5 cents.",
    "A dime is 10 cents; a quarter is 25 cents.",
    "Count the value of each coin, then add the values.",
  ],
  [
    "perimeter",
    "Fence builders",
    "🏡",
    "Find the distance around rectangles.",
    "Perimeter is the distance around a shape.",
    "A rectangle has two pairs of equal sides.",
    "Add all four sides, or double the length plus the width.",
  ],
  [
    "area",
    "Tile designers",
    "🟩",
    "Cover rectangles with square units.",
    "Area measures the surface inside a shape.",
    "Count the unit squares in each row and the number of rows.",
    "A rectangle's area is length × width, in square units.",
  ],
  [
    "patterns",
    "Pattern train",
    "🚂",
    "Spot the rule in number sequences.",
    "A number pattern follows a rule.",
    "Look at how much the number changes each time.",
    "If the rule is add three, 2, 5, 8 comes next to 11.",
  ],
  [
    "measurement",
    "Measure & build",
    "📏",
    "Connect meters, centimeters, and lengths.",
    "A centimeter is a small unit of length.",
    "One meter is one hundred centimeters.",
    "Convert meters to centimeters before combining lengths.",
  ],
  [
    "fractions-equal",
    "Equivalent pizzas",
    "🍕",
    "Find fractions with the same value.",
    "Equivalent fractions name the same amount.",
    "Multiply the top and bottom by the same nonzero number.",
    "One half equals two fourths and three sixths.",
  ],
  [
    "fractions-add",
    "Fraction picnic",
    "🥧",
    "Add fractions with the same denominator.",
    "The denominator tells the size of the equal parts.",
    "With the same denominator, add the numerators.",
    "One fifth plus two fifths is three fifths.",
  ],
  [
    "decimals",
    "Decimal stepping stones",
    "🔢",
    "Write tenths and hundredths as decimals.",
    "One tenth is written 0.1.",
    "One hundredth is written 0.01.",
    "Seven hundredths is 0.07, with a zero in the tenths place.",
  ],
  [
    "comparison",
    "Number balance",
    "⚖️",
    "Compare whole numbers.",
    "Compare hundreds first, then tens, then ones.",
    "A larger digit in the first different place gives the larger number.",
    "The digits can be the same but have different places: 421 is larger than 412.",
  ],
  [
    "elapsed",
    "Time travelers",
    "⏱️",
    "Find how many minutes an activity lasts.",
    "Elapsed time is the time from a start to a finish.",
    "Count forward to find the minutes between two times.",
    "From 9:10 to 9:35 is twenty-five minutes.",
  ],
  [
    "word-problems",
    "Math story quest",
    "🎒",
    "Choose the right operation in everyday stories.",
    "Read what the story asks you to find.",
    "Joining equal groups can use multiplication; taking away can use subtraction.",
    "Use a drawing or small objects to show your thinking.",
  ],
];
export const mathSkills = Object.fromEntries(
  definitions.map(([key, title, icon, description, ...lesson]) => [
    "math-" + key,
    {
      title,
      icon,
      description,
      lesson,
      subject: "Math",
      tryIt:
        "Build an example with blocks, counters, coins, or a drawing. Explain the steps to your grown-up.",
      sources: [],
      source: "Original family mathematics practice",
    },
  ]),
);
function item(prompt, answer, explanation) {
  return { id: randomUUID(), prompt, answer: String(answer), explanation };
}
export function mathQuestions(skill, difficulty = 1, recent = []) {
  if (!mathSkills[skill]) return null;
  const key = skill.slice(5),
    questions = [],
    used = new Set();
  let tries = 0;
  while (questions.length < 5) {
    tries++;
    const a = randomInt(2, difficulty === 2 ? 13 : 10),
      b = randomInt(2, difficulty === 2 ? 13 : 10);
    let q;
    switch (key) {
      case "groups":
        q = item(
          `${a} baskets each hold ${b} apples. How many apples altogether?`,
          a * b,
          `${a} equal groups of ${b}: ${a} × ${b} = ${a * b}.`,
        );
        break;
      case "sharing":
        q = item(
          `${a * b} counters are shared equally among ${a} friends. How many does each get?`,
          b,
          `${a * b} ÷ ${a} = ${b}. Check: ${a} × ${b} = ${a * b}.`,
        );
        break;
      case "place": {
        const c = randomInt(1, 10),
          n = Math.min(a, 9) * 100 + Math.min(b, 9) * 10 + c,
          place = randomInt(3),
          digit = [c, Math.min(b, 9), Math.min(a, 9)][place];
        q = item(
          `In ${n}, what is the value of the digit ${digit} in the ${["ones", "tens", "hundreds"][place]} place?`,
          digit * 10 ** place,
          `${digit} in the ${["ones", "tens", "hundreds"][place]} place means ${digit * 10 ** place}.`,
        );
        break;
      }
      case "rounding": {
        const n = randomInt(11, difficulty === 2 ? 999 : 199);
        q = item(
          `Round ${n} to the nearest ten.`,
          Math.round(n / 10) * 10,
          `The nearest ten to ${n} is ${Math.round(n / 10) * 10}. A halfway five rounds up in this game.`,
        );
        break;
      }
      case "clock": {
        const m = [15, 30, 45][randomInt(3)];
        q = item(
          `How many minutes are in ${a} hours and ${m} minutes?`,
          a * 60 + m,
          `${a} × 60 + ${m} = ${a * 60 + m} minutes.`,
        );
        break;
      }
      case "coins": {
        const values = [1, 5, 10, 25],
          i = randomInt(4);
        q = item(
          `You have ${a} ${["pennies", "nickels", "dimes", "quarters"][i]} and ${b} more cents. What is the total in cents?`,
          a * values[i] + b,
          `Each coin is ${values[i]} cent${values[i] === 1 ? "" : "s"}. ${a} × ${values[i]} + ${b} = ${a * values[i] + b} cents.`,
        );
        break;
      }
      case "perimeter":
        q = item(
          `A rectangle is ${a} cm long and ${b} cm wide. What is its perimeter in cm?`,
          2 * (a + b),
          `Add all four sides: ${a} + ${b} + ${a} + ${b} = ${2 * (a + b)} cm.`,
        );
        break;
      case "area":
        q = item(
          `A rectangle is ${a} squares long and ${b} squares wide. What is its area in square units?`,
          a * b,
          `${a} × ${b} = ${a * b} square units cover the rectangle.`,
        );
        break;
      case "patterns":
        q = item(
          `The pattern adds the same amount each time: ${a}, ${a + b}, ${a + 2 * b}, __. What comes next?`,
          a + 3 * b,
          `Add ${b} each time. ${a + 2 * b} + ${b} = ${a + 3 * b}.`,
        );
        break;
      case "measurement":
        q = item(
          `A ribbon is ${a} meters and ${b * 5} centimeters long. How many centimeters long is it?`,
          a * 100 + b * 5,
          `${a} meters is ${a * 100} centimeters. Add ${b * 5} to get ${a * 100 + b * 5} cm.`,
        );
        break;
      case "fractions-equal": {
        const n = randomInt(1, a);
        q = item(
          `Fill the missing numerator: ${n}/${a} = __/${a * b}.`,
          n * b,
          `Multiply the numerator and denominator by ${b}. ${n} × ${b} = ${n * b}.`,
        );
        break;
      }
      case "fractions-add": {
        const d = a + b + 1;
        q = item(
          `What is ${a}/${d} + ${b}/${d}? Write a fraction.`,
          `${a + b}/${d}`,
          `The parts are the same size. Add ${a} + ${b}; keep the denominator ${d}. The sum is ${a + b}/${d}.`,
        );
        break;
      }
      case "decimals": {
        const n = randomInt(1, 99);
        q = item(
          `Write ${n} hundredths as a decimal.`,
          (n / 100).toFixed(2),
          `${n} hundredths means ${n}/100, written ${(n / 100).toFixed(2)}.`,
        );
        break;
      }
      case "comparison": {
        const x = randomInt(100, difficulty === 2 ? 9999 : 999),
          y = randomInt(100, difficulty === 2 ? 9999 : 999);
        if (x === y) continue;
        q = item(
          `Which number is larger: ${x} or ${y}? Write that number.`,
          Math.max(x, y),
          `Compare hundreds, then tens, then ones. ${Math.max(x, y)} is larger.`,
        );
        break;
      }
      case "elapsed": {
        const start = randomInt(0, 20),
          end = start + a * 5;
        const clock = (m) =>
          `${9 + Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")}`;
        q = item(
          `Reading starts at ${clock(start)} a.m. and ends at ${clock(end)} a.m. How many minutes did it last?`,
          a * 5,
          `Count forward from ${clock(start)} to ${clock(end)}: ${a * 5} minutes.`,
        );
        break;
      }
      case "word-problems":
        q = randomInt(2)
          ? item(
              `We plant ${a} rows with ${b} seeds in each row. How many seeds do we plant?`,
              a * b,
              `${a} equal rows of ${b} seeds make ${a * b} seeds.`,
            )
          : item(
              `A class has ${a * b + b} sheets of paper and uses ${b}. How many sheets are left?`,
              a * b,
              `Take away the used sheets: ${a * b + b} − ${b} = ${a * b}.`,
            );
        break;
    }
    if (
      !used.has(q.prompt) &&
      (tries > 500 || !recent.slice(-5).includes(q.prompt))
    ) {
      used.add(q.prompt);
      questions.push(q);
    }
  }
  return { questions };
}
