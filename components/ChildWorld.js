"use client";
import { useEffect, useRef, useState } from "react";
import {
  Home,
  Gamepad2,
  Star,
  Volume2,
  ArrowLeft,
  Play,
  Shield,
} from "lucide-react";
import { Fox, api, ErrorBox, Loading, Login } from "./ui";
import {
  courses,
  CourseCard,
  ExerciseCatalog,
  ProgressCount,
  CompletionLabel,
} from "./ExerciseCatalog";
import WordLesson from "./WordLesson";

const worlds = [
  ["Math", "Numbers", "🍕", "Count, build, and share", "peach"],
  ["Reading", "Words & stories", "📚", "Read and find clues", "mint"],
  ["Science", "Science lab", "🔬", "Animals, space, and more", "sky"],
  ["Geography", "Our world", "🌍", "Places and people", "mint"],
  ["History", "Time machine", "🦣", "Travel into the past", "lilac"],
  ["Chinese", "Chinese garden", "🌸", "Learn Chinese words", "peach"],
];
const oldGames = [
  ["🚀", "Math Quest", "/games/math/"],
  ["🦉", "Reading Rangers", "/reading/"],
  ["🏰", "Story Star Adventures", "/stories/"],
];
function say(text) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = "en-US";
  voice.rate = 0.82;
  window.speechSynthesis.speak(voice);
  return true;
}
function currentScreen() {
  const hash = window.location.hash.slice(1);
  return /^[a-zA-Z0-9-]+$/.test(hash) ? hash : "home";
}
export default function ChildWorld() {
  const [data, setData] = useState(null);
  const [login, setLogin] = useState(false);
  const [screen, setScreen] = useState("home");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [level, setLevel] = useState(1);
  const [stateTrail, setStateTrail] = useState(1);
  const [stateCard, setStateCard] = useState(0);
  const heading = useRef(null);
  async function load() {
    try {
      setData(await api("state"));
    } catch (e) {
      if (e.status === 401) setLogin(true);
      else setError(e.message);
    }
  }
  useEffect(() => {
    load();
    function changed() {
      setScreen(currentScreen());
      setNotice("");
      setError("");
    }
    changed();
    window.addEventListener("hashchange", changed);
    return () => {
      window.removeEventListener("hashchange", changed);
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    heading.current?.focus({ preventScroll: true });
    window.speechSynthesis?.cancel();
  }, [screen]);
  async function act(route, body, message) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(route, body);
      await load();
      if (message) setNotice(message);
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function play(skill) {
    window.speechSynthesis?.cancel();
    const s = await act("session/start", {
      skill,
      difficulty: skill === "states" ? stateTrail : level,
    });
    if (s) window.location.href = "/adventure/" + s.id;
  }
  function listen(text) {
    if (!say(text))
      setNotice(
        "Ask your grown-up to read this with you. Your browser has no read-aloud voice.",
      );
  }
  if (login) return <Login />;
  if (!data)
    return (
      <>
        <Loading />
        <ErrorBox message={error} />
        {error && (
          <button className="button" onClick={load}>
            Try again
          </button>
        )}
      </>
    );
  const subject = worlds.find((w) => screen === "world-" + w[0]);
  const topic = data.stats.find((s) => screen === "learn-" + s.id);
  const course = courses.find((c) => screen === "course-" + c.id);
  const known =
    screen === "home" ||
    screen === "games" ||
    screen === "stars" ||
    screen === "plan" ||
    screen === "world-Favorites" ||
    subject ||
    course ||
    topic;
  const title =
    topic?.title ||
    course?.title ||
    subject?.[1] ||
    {
      games: "Pick a world!",
      stars: "My stars",
      plan: "Study together",
      "world-Favorites": "Old favorites",
    }[screen] ||
    `Hi, ${data.profile.name}!`;
  const resume = data.activeSessions[0];
  const pick = data.recommendations[0];
  const next = resume ? data.stats.find((s) => s.id === resume.skill) : pick;
  const learnCards = topic?.collection?.slice(
    (stateTrail - 1) * 10,
    stateTrail * 10,
  );
  return (
    <div className="kid-world">
      <header className="kid-top">
        <a href="/#home" className="kid-logo">
          <span className="kid-fox">
            <Fox />
          </span>
          <span>
            {data.profile.name}’s
            <br />
            <strong>Adventure Club</strong>
          </span>
        </a>
        <a
          href="/#stars"
          className="kid-wallet"
          aria-label={`My stars: ${data.stars}`}
        >
          <Star fill="currentColor" size={26} />
          <strong>{data.stars}</strong>
          <span>stars</span>
        </a>
      </header>
      <main className="kid-main" id="kid-main">
        {screen !== "home" && (
          <a
            className="kid-back"
            href={
              topic
                ? topic.course
                  ? "/#course-" + topic.course
                  : "/#world-" + topic.subject
                : course
                  ? "/#world-" + course.subject
                  : subject
                    ? "/#games"
                    : "/#home"
            }
          >
            <ArrowLeft size={22} />
            {topic
              ? "Back to " +
                (courses.find((c) => c.id === topic.course)?.title ||
                  worlds.find((w) => w[0] === topic.subject)?.[1] ||
                  "games")
              : "Back"}
          </a>
        )}
        <div className="kid-title">
          <h1 ref={heading} tabIndex={-1}>
            {title}
          </h1>
          <button
            className="kid-listen"
            aria-label="Read this page aloud"
            onClick={() =>
              listen(
                topic
                  ? [
                      topic.title,
                      ...(topic.lesson || [topic.description]),
                      topic.tryIt || "",
                    ].join(". ")
                  : subject
                    ? `${subject[1]}. Pick a game. ${courses
                        .filter((c) => c.subject === subject[0])
                        .map((c) => c.title)
                        .join(". ")}. ${data.stats
                        .filter((s) => s.subject === subject[0] && !s.course)
                        .slice(0, 8)
                        .map((s) => s.title)
                        .join(". ")}`
                    : course
                      ? `${course.title}. Choose a path. Starter is a good place to begin. Tap a game to meet its words.`
                      : screen === "games"
                        ? "Pick a world. Numbers. Words and stories. Science lab. Our world. Time machine. Chinese garden. Old favorites."
                        : screen === "home"
                          ? `Hi ${data.profile.name}! Tap the big play button, or choose Games. Stars shows your rewards.`
                          : title,
              )
            }
          >
            <Volume2 size={23} />
            <span>Listen</span>
          </button>
        </div>
        <ErrorBox message={error} />
        {notice && (
          <div className="kid-notice" role="status">
            {notice}
          </div>
        )}
        {(!known || screen === "home") && (
          <>
            <section className="kid-hero">
              <div className="kid-mascot">
                <Fox />
                <span>Let’s play!</span>
              </div>
              <div>
                <p>
                  {resume
                    ? "Your game is waiting."
                    : "One little game. Lots to discover!"}
                </p>
                <a
                  className="kid-play"
                  href={
                    resume ? "/adventure/" + resume.id : "/#learn-" + pick.id
                  }
                >
                  <Play size={28} fill="currentColor" />
                  {resume ? "Keep playing" : "Play"}
                  <small>
                    {next?.icon || "🍕"} {next?.title}
                  </small>
                </a>
              </div>
              <span className="kid-hero-star" aria-hidden="true">
                ✦
              </span>
            </section>
            <div className="kid-home-choices">
              <a href="/#games" className="kid-choice sky">
                <span>🎮</span>
                <strong>Choose a game</strong>
                <small>What will you explore?</small>
              </a>
              <a href="/#plan" className="kid-choice peach">
                <span>🧑‍🤝‍🧑</span>
                <strong>Study together</strong>
                <small>Bring your grown-up</small>
              </a>
              <a href="/#stars" className="kid-choice lilac">
                <span>🌟</span>
                <strong>My rewards</strong>
                <small>See your star collection</small>
              </a>
            </div>
            {data.activeSessions.length > 1 && (
              <details className="kid-more">
                <summary>
                  My other saved games ({data.activeSessions.length - 1})
                </summary>
                {data.activeSessions.slice(1).map((s) => (
                  <a
                    className="kid-saved"
                    key={s.id}
                    href={"/adventure/" + s.id}
                  >
                    ▶ Continue {data.stats.find((x) => x.id === s.skill)?.title}
                  </a>
                ))}
              </details>
            )}
            <p className="kid-encouragement">
              Take your time. Every try helps you grow. 🌱
            </p>
          </>
        )}
        {screen === "games" && (
          <div className="kid-world-grid">
            {worlds.map(([id, label, icon, desc, color]) => (
              <a
                key={id}
                href={"/#world-" + id}
                className={"kid-choice " + color}
              >
                <span>{icon}</span>
                <strong>{label}</strong>
                <small>{desc}</small>
                <ProgressCount
                  exercises={data.stats.filter((s) => s.subject === id)}
                  compact
                />
              </a>
            ))}
            <a href="/#world-Favorites" className="kid-choice butter">
              <span>🏰</span>
              <strong>Old favorites</strong>
              <small>Your first three games</small>
              <ProgressCount
                exercises={oldGames.map((_, i) => ({
                  lastCompletion:
                    data.legacyProgress?.[["math", "reading", "stories"][i]],
                }))}
                compact
              />
            </a>
          </div>
        )}
        {(subject || screen === "world-Favorites") && (
          <>
            <p className="kid-subtitle">Tap a picture to choose your game.</p>
            {subject && (
              <ProgressCount
                exercises={data.stats.filter((s) => s.subject === subject[0])}
              />
            )}
            {subject?.[0] === "History" && (
              <div className="kid-timeline" aria-label="History overview">
                <span>🦣 Ice Age</span>
                <i>→</i>
                <span>🏺 Ancient world</span>
                <i>→</i>
                <span>🏰 Middle Ages</span>
                <i>→</i>
                <span>📜 America</span>
                <p>
                  Different places have histories happening at the same time.
                </p>
              </div>
            )}
            <div className="kid-topic-grid">
              {screen === "world-Favorites"
                ? oldGames.map(([icon, name, url], i) => (
                    <a
                      className={
                        "kid-topic" +
                        (data.legacyProgress?.[
                          ["math", "reading", "stories"][i]
                        ]
                          ? " kid-finished"
                          : "")
                      }
                      href={url}
                      key={name}
                    >
                      <span>{icon}</span>
                      <div>
                        <h2>{name}</h2>
                        <p>Play your favorite</p>
                        <CompletionLabel
                          completion={
                            data.legacyProgress?.[
                              ["math", "reading", "stories"][i]
                            ]
                          }
                          timezone={data.timezone}
                        />
                      </div>
                      <Play size={24} />
                    </a>
                  ))
                : courses
                    .filter((c) => c.subject === subject[0])
                    .map((c) => (
                      <CourseCard
                        key={c.id}
                        course={c}
                        exercises={data.stats.filter((s) => s.course === c.id)}
                      />
                    ))}
            </div>
            {screen === "world-Favorites" && (
              <p className="kid-subtitle">
                Your old in-game stars and unlocks are safe. Dated round results
                here start with this update.
              </p>
            )}
            {subject && (
              <>
                <h2>Quick games</h2>
                <ExerciseCatalog
                  key={subject[0]}
                  exercises={data.stats.filter(
                    (s) => s.subject === subject[0] && !s.course,
                  )}
                  timezone={data.timezone}
                />
              </>
            )}
            {subject && ["Math", "Reading"].includes(subject[0]) && (
              <a className="kid-saved" href="/#world-Favorites">
                🏰 Looking for your old games? Tap here.
              </a>
            )}
          </>
        )}
        {course && (
          <ExerciseCatalog
            key={course.id}
            exercises={data.stats.filter((s) => s.course === course.id)}
            timezone={data.timezone}
            vocabulary
          />
        )}
        {topic && (
          <section className="kid-learn">
            <div className="kid-lesson-picture" aria-hidden="true">
              {topic.icon}
            </div>
            {topic.era && <p className="kid-era">{topic.era}</p>}
            {topic.lastCompletion && (
              <CompletionLabel
                completion={topic.lastCompletion}
                timezone={data.timezone}
              />
            )}
            {topic.kind === "vocabulary" && (
              <WordLesson key={topic.id} id={topic.id} />
            )}
            {topic.lesson ? (
              <>
                <h2>A little discovery first</h2>
                <div className="kid-facts">
                  {topic.lesson.map((line, i) => (
                    <p key={line}>
                      <span>{i + 1}</span>
                      {line}
                    </p>
                  ))}
                </div>
              </>
            ) : (
              <p className="kid-subtitle">
                {topic.description} Five questions. Go at your own pace.
              </p>
            )}
            {topic.visual === "world" && <WorldPicture />}
            {topic.id === "states" && (
              <>
                <h2>Choose a trail</h2>
                <div
                  className="kid-trails"
                  role="group"
                  aria-label="State trail"
                >
                  {Array.from({ length: 5 }, (_, i) => (
                    <button
                      key={i}
                      aria-pressed={stateTrail === i + 1}
                      onClick={() => {
                        setStateTrail(i + 1);
                        setStateCard(0);
                      }}
                    >
                      Trail {i + 1}
                      <small>
                        {topic.collection[i * 10].name} –{" "}
                        {topic.collection[i * 10 + 9].name}
                      </small>
                    </button>
                  ))}
                </div>
                <p>Explore ten cards. Tap the big card to hear it.</p>
                <div className="kid-state-cards" aria-live="polite">
                  <p>Card {stateCard + 1} of 10</p>
                  {learnCards.slice(stateCard, stateCard + 1).map((c) => (
                    <button
                      onClick={() =>
                        listen(`${c.name}. Its capital is ${c.detail}.`)
                      }
                      key={c.name}
                    >
                      <strong>{c.name}</strong>
                      <span>★ {c.detail}</span>
                      <Volume2 size={17} />
                    </button>
                  ))}
                  <div className="kid-card-controls">
                    <button
                      disabled={stateCard === 0}
                      onClick={() => setStateCard((n) => n - 1)}
                      aria-label="Previous state card"
                    >
                      ← Back
                    </button>
                    <button
                      disabled={stateCard === 9}
                      onClick={() => setStateCard((n) => n + 1)}
                      aria-label="Next state card"
                    >
                      Next card →
                    </button>
                  </div>
                  <p>Your game uses only the ten states in this trail.</p>
                </div>
              </>
            )}
            {["fractions", "regrouping"].includes(topic.id) && (
              <div
                className="kid-trails"
                role="group"
                aria-label="Number level"
              >
                <button aria-pressed={level === 1} onClick={() => setLevel(1)}>
                  🌱 Start here
                </button>
                <button aria-pressed={level === 2} onClick={() => setLevel(2)}>
                  🚀 A bigger challenge
                </button>
              </div>
            )}
            <button
              className="kid-play"
              disabled={busy}
              onClick={() => play(topic.id)}
            >
              <Play size={26} fill="currentColor" />
              {busy ? "Opening…" : "Play this game"}
              <small>5 questions · collect stars</small>
            </button>
            {topic.tryIt && (
              <details className="kid-more">
                <summary>👐 Try it with a grown-up</summary>
                <p>{topic.tryIt}</p>
              </details>
            )}
          </section>
        )}
        {screen === "plan" && (
          <>
            <p className="kid-subtitle">
              These are games away from the screen. Ask your grown-up to join
              you.
            </p>
            <div className="kid-topic-grid">
              {data.assignments.map((a) => {
                const completion = data.completions.find(
                  (c) =>
                    c.assignmentId === a.id &&
                    c.day ===
                      new Intl.DateTimeFormat("en-CA", {
                        timeZone: "America/New_York",
                        year: "numeric",
                        month: "2-digit",
                        day: "2-digit",
                      }).format(new Date()),
                );
                const done = completion && completion.status !== "retry";
                return (
                  <section className="kid-paper" key={a.id}>
                    <span className="kid-paper-icon">📚</span>
                    <h2>{a.title}</h2>
                    <p>{a.instructions}</p>
                    <p>★ {a.stars} stars after your grown-up checks</p>
                    <button
                      className="button"
                      disabled={busy || done}
                      onClick={() =>
                        act(
                          "assignment/request",
                          { id: a.id },
                          "Great! Your grown-up can check your work now.",
                        )
                      }
                    >
                      {completion?.status === "approved"
                        ? "✓ Well done!"
                        : completion?.status === "pending"
                          ? "✓ Waiting for your grown-up"
                          : "I did it!"}
                    </button>
                  </section>
                );
              })}
            </div>
            {!data.assignments.length && (
              <p>Your grown-up can add an activity here.</p>
            )}
          </>
        )}
        {screen === "stars" && (
          <>
            <div className="kid-star-total">
              <span>🌟</span>
              <strong>{data.stars}</strong>
              <p>stars to spend</p>
            </div>
            <p className="kid-subtitle">
              Play, learn, and collect. Ask your grown-up for a reward.
            </p>
            <section className="kid-paper kid-stickers">
              <h2>My discovery stickers</h2>
              <p>
                Finish a game to collect its picture. A sticker celebrates
                trying!
              </p>
              <div>
                {data.stats
                  .filter((s) => s.completedRounds > 0)
                  .map((s) => (
                    <span key={s.id}>
                      <b aria-hidden="true">{s.icon}</b>
                      {s.title}
                    </span>
                  ))}
              </div>
              {!data.stats.some((s) => s.completedRounds > 0) && (
                <p>🦣 🌍 🚀 Your first sticker is waiting!</p>
              )}
            </section>
            <div className="kid-topic-grid">
              {data.rewards.map((r) => {
                const pending = data.redemptions.some(
                  (x) => x.rewardId === r.id && x.status === "pending",
                );
                return (
                  <section className="kid-paper" key={r.id}>
                    <span className="kid-paper-icon">🎁</span>
                    <h2>{r.title}</h2>
                    <p>★ {r.cost} stars</p>
                    <button
                      className="button"
                      disabled={busy || pending || data.stars < r.cost}
                      onClick={() =>
                        act(
                          "redeem",
                          { id: r.id },
                          "Your grown-up has your reward request!",
                        )
                      }
                    >
                      {pending
                        ? "✓ Asked your grown-up"
                        : data.stars < r.cost
                          ? `${r.cost - data.stars} more stars to go`
                          : "Ask for this reward"}
                    </button>
                  </section>
                );
              })}
            </div>
            {data.redemptions.length > 0 && (
              <section className="kid-paper">
                <h2>My reward requests</h2>
                {data.redemptions
                  .slice()
                  .reverse()
                  .map((r) => (
                    <p key={r.id}>
                      {r.title} —{" "}
                      {r.status === "pending"
                        ? "Waiting for your grown-up"
                        : r.status === "approved"
                          ? "Ready! Ask your grown-up"
                          : "Stars returned"}
                    </p>
                  ))}
              </section>
            )}
          </>
        )}
        <footer className="kid-grownup">
          <a href="/admin">
            <Shield size={17} /> Grown-ups
          </a>
        </footer>
      </main>
      <nav className="kid-bottom" aria-label="Main navigation">
        {[
          ["home", "Home", Home],
          ["games", "Games", Gamepad2],
          ["stars", "Stars", Star],
        ].map(([id, label, Icon]) => (
          <a
            href={"/#" + id}
            key={id}
            aria-current={
              screen === id ||
              (id === "games" &&
                (subject || course || topic || screen === "world-Favorites"))
                ? "page"
                : undefined
            }
          >
            <Icon size={27} fill={id === "stars" ? "currentColor" : "none"} />
            <span>{label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}

function WorldPicture() {
  return (
    <figure className="kid-map">
      <svg
        viewBox="0 0 600 330"
        role="img"
        aria-label="A simple world picture showing the seven continents, with Antarctica along the bottom. Not a navigation map."
      >
        <rect width="600" height="330" rx="28" fill="#d9eff7" />
        <g fill="#a9cfa0" stroke="#fff" strokeWidth="3">
          <path d="M30 65 65 35 135 30 170 60 155 100 120 130 140 155 110 150 85 120 50 110Z" />
          <path d="M145 150 190 160 210 190 190 240 165 272 150 220 130 180Z" />
          <path d="M265 70 290 48 330 60 337 95 305 108 275 95Z" />
          <path d="M270 120 320 105 350 145 333 195 300 225 278 187 258 145Z" />
          <path d="M330 55 390 30 480 42 550 70 535 110 485 120 450 175 420 145 390 150 365 110 335 100Z" />
          <path d="M460 215 505 200 545 225 533 252 480 255 455 235Z" />
          <path d="M35 300 115 280 230 290 310 280 425 290 555 280 580 315 30 315Z" />
        </g>
        <g
          fill="#244c3c"
          fontSize="15"
          fontFamily="Arial, sans-serif"
          textAnchor="middle"
          fontWeight="bold"
        >
          <text x="100" y="75">
            North
          </text>
          <text x="100" y="94">
            America
          </text>
          <text x="170" y="186">
            South
          </text>
          <text x="170" y="205">
            America
          </text>
          <text x="299" y="83">
            Europe
          </text>
          <text x="301" y="160">
            Africa
          </text>
          <text x="430" y="90">
            Asia
          </text>
          <text x="500" y="237">
            Australia
          </text>
          <text x="300" y="307">
            Antarctica
          </text>
        </g>
      </svg>
      <figcaption>
        A simple picture of our seven-continent model. Oceans connect around the
        land.
      </figcaption>
    </figure>
  );
}
