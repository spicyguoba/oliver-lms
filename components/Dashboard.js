"use client";
import { useEffect, useState } from "react";
import {
  Home,
  Compass,
  BookOpen,
  Star,
  Shield,
  ArrowRight,
  Check,
  Clock3,
  LogOut,
  ChevronRight,
  Sparkles,
  Trophy,
  Plus,
  Settings,
  Download,
  Upload,
  X,
  Library,
  SlidersHorizontal,
  CircleHelp,
} from "lucide-react";
import { api, Brand, Fox, Landscape, Login, Loading, ErrorBox } from "./ui";
const skillIcons = {
  fractions: "🍕",
  regrouping: "🧱",
  phonics: "🌿",
  stories: "📖",
  chinese: "🌸",
  science: "🧲",
};
const subjectClass = {
  Math: "peach",
  Reading: "sage",
  Chinese: "lavender",
  Science: "blue",
};
function dayNumber() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
  ).getDay();
}
export default function Dashboard({ parent = false }) {
  const [data, setData] = useState(null),
    [unauthorized, setUnauthorized] = useState(false),
    [section, setSection] = useState(parent ? "overview" : "home"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [filter, setFilter] = useState("All"),
    [difficulty, setDifficulty] = useState(1),
    [editQuest, setEditQuest] = useState(null),
    [editReward, setEditReward] = useState(null);
  async function load() {
    try {
      setData(await api(parent ? "admin" : "state"));
      setUnauthorized(false);
    } catch (e) {
      if (e.status === 401) setUnauthorized(true);
      else setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, [parent]);
  async function act(endpoint, body, message) {
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const result = await api(endpoint, body);
      await load();
      if (message) setNotice(message);
      return result;
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function play(skill, mode = "practice") {
    const s = await act("session/start", { skill, mode, difficulty });
    if (s) window.location.href = "/adventure/" + s.id;
  }
  if (unauthorized) return <Login />;
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
  const nav = parent
    ? [
        ["overview", "Overview", Home],
        ["reports", "Learning insights", SlidersHorizontal],
        ["library", "Materials library", Library],
        ["plan", "Study plan", BookOpen],
        ["rewards", "Rewards", Star],
        ["settings", "Settings", Settings],
      ]
    : [
        ["home", "My adventure", Home],
        ["games", "Game collection", Compass],
        ["plan", "My study quests", BookOpen],
        ["rewards", "Star shop", Star],
      ];
  const todayAssignments = data.assignments.filter((a) =>
    a.days.includes(dayNumber()),
  );
  const pending = [
    ...(data.completions || [])
      .filter((c) => c.status === "pending")
      .map((c) => ({
        ...c,
        title:
          data.assignments.find((a) => a.id === c.assignmentId)?.title ||
          "Study quest",
        type: "Study quest",
      })),
    ...(data.redemptions || [])
      .filter((r) => r.status === "pending")
      .map((r) => ({ ...r, type: "Reward" })),
  ];
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="sidebar-profile">
          <div className="avatar">
            <Fox />
          </div>
          <div>
            <strong>{data.profile.name}</strong>
            <small>{parent ? "Parent dashboard" : "Curious explorer"}</small>
          </div>
          <span className="online-dot" />
        </div>
        <div className="nav-label">
          {parent ? "PARENT SPACE" : "YOUR LITTLE WORLD"}
        </div>
        <nav>
          {nav.map(([id, title, Icon]) => (
            <button
              key={id}
              className={section === id ? "nav-item active" : "nav-item"}
              onClick={() => {
                setSection(id);
                setNotice("");
                setError("");
              }}
            >
              <Icon size={21} />
              {title}
              {section === id && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="kindness">
            <span>🌱</span>
            <strong>A little every day.</strong>
            <p>Big discoveries start with small steps.</p>
          </div>
          <a href={parent ? "/" : "/admin"} className="parent-link">
            <Shield size={17} />
            {parent ? "Back to adventure" : "Grown-up corner"}
            <ChevronRight size={16} />
          </a>
          <button
            className="text-button muted"
            onClick={async () => {
              await api("logout", {});
              window.location.reload();
            }}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            <span className="breadcrumb">
              {parent ? "Grown-up corner" : "Adventure Club"}
            </span>
            <ChevronRight size={14} />
            {nav.find((n) => n[0] === section)?.[1]}
          </span>
          <div className="topbar-right">
            <span className="star-pill">
              <Star size={18} fill="currentColor" />
              {data.stars} <span>stars</span>
            </span>
            <a
              className="small-avatar"
              href={parent ? "/" : "/admin"}
              aria-label={parent ? "Adventure home" : "Grown-up corner"}
            >
              {parent ? <Shield size={20} /> : <Fox />}
            </a>
          </div>
        </header>
        <main className="content">
          <ErrorBox message={error} />
          {notice && (
            <div className="notice" role="status">
              <Check size={18} />
              {notice}
            </div>
          )}
          {!parent && section === "home" && (
            <>
              <div className="page-heading">
                <div className="eyebrow">YOUR NEXT DISCOVERY IS WAITING</div>
                <h1>
                  Hey, {data.profile.name}! <span className="wave">✦</span>
                </h1>
                <p>Ready for a little adventure today?</p>
              </div>
              <div className="hero-grid">
                <section className="hero-card">
                  <div className="hero-copy">
                    <span className="pill light">
                      <Sparkles size={14} /> YOUR DAILY ADVENTURE
                    </span>
                    <h2>
                      Small steps.
                      <br />
                      Big discoveries.
                    </h2>
                    <p>
                      Follow your curiosity, try something new,
                      <br className="desktop" /> and collect a few stars along
                      the way.
                    </p>
                    <button
                      className="button warm"
                      disabled={busy}
                      onClick={() => play(data.recommendations[0].id)}
                    >
                      Let’s go explore <ArrowRight size={19} />
                    </button>
                  </div>
                  <Landscape />
                </section>
                <section className="daily-card">
                  <div className="section-kicker">
                    <span>TODAY’S LITTLE GOAL</span>
                    <span>☀</span>
                  </div>
                  <div
                    className="goal-ring"
                    style={{
                      "--progress":
                        Math.min(
                          100,
                          (data.todayMinutes / data.profile.dailyGoal) * 100,
                        ) + "%",
                    }}
                  >
                    <div>
                      <strong>
                        {data.todayMinutes}
                        <small> / {data.profile.dailyGoal}</small>
                      </strong>
                      <span>minutes explored</span>
                    </div>
                  </div>
                  <strong>
                    {data.todayCompleted
                      ? "Look at you growing!"
                      : "A fresh start awaits!"}
                  </strong>
                  <p>
                    {data.todayCompleted} adventures completed today.
                    <br />
                    Take your time. You’ve got this.
                  </p>
                  <span className="tag">
                    <SproutText /> Little by little, you grow
                  </span>
                </section>
              </div>
              {data.activeSessions.length > 0 && (
                <div className="resume-row">
                  {data.activeSessions.map((s) => (
                    <a
                      className="button secondary"
                      key={s.id}
                      href={"/adventure/" + s.id}
                    >
                      Continue {data.stats.find((x) => x.id === s.skill)?.title}{" "}
                      <ArrowRight size={17} />
                    </a>
                  ))}
                </div>
              )}
              <section className="section">
                <div className="section-heading">
                  <div>
                    <div className="eyebrow">PICKED FOR YOUR NEXT STEP</div>
                    <h2>Today’s discovery trail</h2>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setSection("games")}
                  >
                    See all games <ArrowRight size={16} />
                  </button>
                </div>
                <div className="quest-grid">
                  {data.recommendations.map((s, i) => (
                    <button
                      className={
                        "quest-card " + (subjectClass[s.subject] || "sage")
                      }
                      onClick={() => play(s.id)}
                      disabled={busy}
                      key={s.id}
                    >
                      <div className="quest-top">
                        <span className="subject-tag">{s.subject}</span>
                        <span className="muted">0{i + 1}</span>
                      </div>
                      <div className="quest-icon">{skillIcons[s.id]}</div>
                      <h3>{s.title}</h3>
                      <p>{s.description}</p>
                      <div className="quest-footer">
                        <span>
                          <Clock3 size={14} /> 5 questions
                        </span>
                        <span>
                          <Star size={14} fill="currentColor" /> Up to 5
                        </span>
                        <span className="round-arrow">
                          <ArrowRight size={17} />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
              <div className="bottom-grid">
                <section className="white-card">
                  <div className="section-heading">
                    <h2>
                      <BookOpen size={21} /> Study together
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => setSection("plan")}
                    >
                      View plan <ArrowRight size={16} />
                    </button>
                  </div>
                  {todayAssignments.length ? (
                    todayAssignments
                      .slice(0, 2)
                      .map((a) => (
                        <Assignment
                          key={a.id}
                          assignment={a}
                          data={data}
                          busy={busy}
                          act={act}
                        />
                      ))
                  ) : (
                    <div className="empty-inline">
                      <span>📚</span>
                      <div>
                        <strong>Good things are on the way.</strong>
                        <p>
                          Your grown-up can add a reading or workbook quest.
                        </p>
                      </div>
                    </div>
                  )}
                </section>
                <section className="collection-card">
                  <div>
                    <span className="eyebrow">YOUR ORIGINAL FAVORITES</span>
                    <h2>
                      Old friends.
                      <br />
                      New adventures.
                    </h2>
                    <button
                      className="text-button"
                      onClick={() => setSection("games")}
                    >
                      Visit the game collection <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="book-stack">
                    <span>📖</span>
                    <span>🚀</span>
                    <span>🦉</span>
                  </div>
                </section>
              </div>
            </>
          )}
          {!parent && section === "games" && (
            <>
              <PageTitle
                eyebrow="THERE’S A WHOLE WORLD TO EXPLORE"
                title="Pick your next adventure."
                text="Try a new skill, or visit an old favorite."
              />
              <div className="difficulty-row">
                <label>
                  Number practice level
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(Number(e.target.value))}
                  >
                    <option value="1">
                      Build confidence · 2-digit numbers
                    </option>
                    <option value="2">
                      Stretch a little · 3-digit numbers
                    </option>
                  </select>
                </label>
              </div>
              <div className="filters">
                {["All", "Math", "Reading", "Chinese", "Science"].map((x) => (
                  <button
                    key={x}
                    className={filter === x ? "selected" : ""}
                    onClick={() => setFilter(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="quest-grid">
                {data.stats
                  .filter((s) => filter === "All" || s.subject === filter)
                  .map((s) => (
                    <button
                      key={s.id}
                      className={"quest-card " + subjectClass[s.subject]}
                      disabled={busy}
                      onClick={() => play(s.id)}
                    >
                      <span className="subject-tag">{s.subject}</span>
                      <div className="quest-icon">{skillIcons[s.id]}</div>
                      <h3>{s.title}</h3>
                      <p>{s.description}</p>
                      <div className="quest-footer">
                        <span>5 questions · collect stars</span>
                        <ArrowRight size={18} />
                      </div>
                    </button>
                  ))}
              </div>
              <div className="section-heading section">
                <h2>The original three</h2>
                <span className="muted">Your favorites, now in the club</span>
              </div>
              <div className="quest-grid">
                {[
                  [
                    "🚀",
                    "Math Quest",
                    "Six worlds of number adventures.",
                    "/games/math/",
                  ],
                  [
                    "🦉",
                    "Reading Rangers",
                    "Sounds, words, and little reading trails.",
                    "/reading/",
                  ],
                  [
                    "🏰",
                    "Story Star Adventures",
                    "Read, find clues, unlock five story realms.",
                    "/stories/",
                  ],
                ].map(([icon, title, desc, url]) => (
                  <a href={url} className="white-card game-card" key={title}>
                    <span className="quest-icon">{icon}</span>
                    <h3>{title}</h3>
                    <p>{desc}</p>
                    <span className="text-button">
                      Play <ArrowRight size={16} />
                    </span>
                  </a>
                ))}
              </div>
              <p className="footnote">
                The original GitHub Pages games still work at their existing
                addresses. This club has its own saved copies. Original-device
                progress stays at the original site.
              </p>
            </>
          )}
          {section === "plan" && (
            <>
              <PageTitle
                eyebrow={
                  parent
                    ? "MAKE ROOM FOR LITTLE DISCOVERIES"
                    : "A LITTLE BIT, EVERY DAY"
                }
                title={
                  parent ? "A plan that grows with him." : "Your study quests."
                }
                text={
                  parent
                    ? "Short, repeatable activities grounded in your family’s materials."
                    : "Read, write, explore. Ask your grown-up to join you."
                }
              />
              {parent && (
                <AssignmentForm
                  key={editQuest?.id || "new"}
                  data={data}
                  act={act}
                  busy={busy}
                  initial={editQuest}
                  onDone={() => setEditQuest(null)}
                />
              )}
              <div className="plan-list">
                {data.assignments.map((a) => (
                  <div className="white-card" key={a.id}>
                    <Assignment
                      assignment={a}
                      data={data}
                      busy={busy}
                      act={act}
                      parent={parent}
                    />
                    {parent && (
                      <>
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditQuest(a);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Edit quest
                        </button>{" "}
                        <button
                          className="text-button muted"
                          onClick={() =>
                            act(
                              "admin/assignment",
                              { id: a.id, archive: true },
                              "Quest archived.",
                            )
                          }
                        >
                          Archive quest
                        </button>
                      </>
                    )}
                  </div>
                ))}
                {!data.assignments.length && (
                  <Empty text="No study quests yet. Add a short activity from the materials library." />
                )}
              </div>
            </>
          )}
          {section === "rewards" && (
            <>
              <PageTitle
                eyebrow={
                  parent
                    ? "CELEBRATE EFFORT AND GROWTH"
                    : "A LITTLE EFFORT. A LITTLE MAGIC."
                }
                title={
                  parent ? "Rewards worth working toward." : "Your star shop."
                }
                text={
                  parent
                    ? "Set family experiences and approve requests. Stars never expire."
                    : `You’ve collected ${data.stars} stars. Pick something to look forward to.`
                }
              />
              {parent && (
                <form
                  key={editReward?.id || "new-reward"}
                  className="white-card inline-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act(
                      "admin/reward",
                      Object.fromEntries(new FormData(e.currentTarget)),
                      "Reward saved.",
                    ).then((r) => {
                      if (r) setEditReward(null);
                    });
                    e.currentTarget.reset();
                  }}
                >
                  <input name="id" type="hidden" value={editReward?.id || ""} />
                  <label>
                    Reward name
                    <input
                      name="title"
                      defaultValue={editReward?.title || ""}
                      placeholder="Pick our next family activity"
                      required
                    />
                  </label>
                  <label>
                    Star cost
                    <input
                      name="cost"
                      type="number"
                      min="1"
                      defaultValue={editReward?.cost || 20}
                      required
                    />
                  </label>
                  <button className="button" disabled={busy}>
                    <Plus size={17} />
                    {editReward ? "Save reward" : "Add reward"}
                  </button>
                </form>
              )}
              <div className="quest-grid">
                {data.rewards.map((r) => (
                  <div className="white-card reward-card" key={r.id}>
                    <span className="reward-icon">
                      {r.cost >= 30 ? "🎲" : "🌟"}
                    </span>
                    <h3>{r.title}</h3>
                    <p>
                      <Star size={17} fill="currentColor" /> {r.cost} stars
                    </p>
                    {parent ? (
                      <div className="row">
                        <button
                          className="text-button"
                          onClick={() => {
                            setEditReward(r);
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }}
                        >
                          Edit reward
                        </button>
                        <button
                          className="text-button muted"
                          onClick={() =>
                            act(
                              "admin/reward",
                              { id: r.id, archive: true },
                              "Reward removed from the shop.",
                            )
                          }
                        >
                          Remove from shop
                        </button>
                      </div>
                    ) : (
                      <button
                        className="button"
                        disabled={
                          busy ||
                          data.stars < r.cost ||
                          data.redemptions.some(
                            (x) =>
                              x.rewardId === r.id && x.status === "pending",
                          )
                        }
                        onClick={() =>
                          act(
                            "redeem",
                            { id: r.id },
                            "Your grown-up will see your reward request!",
                          )
                        }
                      >
                        Ask my grown-up <ArrowRight size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <h2 className="section">Your requests</h2>
              <div className="white-card">
                {data.redemptions.length ? (
                  data.redemptions
                    .slice()
                    .reverse()
                    .map((r) => (
                      <div className="list-row" key={r.id}>
                        <strong>{r.title}</strong>
                        <span className="tag">{r.status}</span>
                      </div>
                    ))
                ) : (
                  <p className="muted">
                    Your reward adventures will appear here.
                  </p>
                )}
              </div>
            </>
          )}
          {parent && section === "overview" && (
            <>
              <PageTitle
                eyebrow="A CLEARER PICTURE, ONE LITTLE STEP AT A TIME"
                title={`${data.profile.name}’s learning journey.`}
                text="Celebrate the progress. Notice what needs another look."
              />
              <div className="parent-actions">
                <button
                  className="button"
                  disabled={busy}
                  onClick={async () => {
                    const r = await act("launch", {});
                    if (r) window.location.href = "/";
                  }}
                >
                  Open Oliver’s world <ArrowRight size={18} />
                </button>
                <a className="button secondary" href="/api/admin/export">
                  <Download size={17} />
                  Export progress
                </a>
              </div>
              <div className="metrics-grid">
                <Metric title="Collected stars" value={data.stars} icon="★" />
                <Metric
                  title="Practice adventures"
                  value={
                    data.history.filter((s) => s.finishedAt && !s.abandoned)
                      .length
                  }
                  icon="✦"
                />
                <Metric
                  title="First-answer accuracy"
                  value={overallAccuracy(data.stats)}
                  icon="◎"
                />
                <Metric
                  title="Source materials"
                  value={data.materials.length}
                  icon="▤"
                />
              </div>
              <div className="bottom-grid">
                <section className="white-card">
                  <div className="section-heading">
                    <h2>Next best steps</h2>
                    <span className="tag">Practice guidance</span>
                  </div>
                  {data.recommendations.map((s) => (
                    <div className="list-row" key={s.id}>
                      <span className="mini-icon">{skillIcons[s.id]}</span>
                      <div className="grow">
                        <strong>{s.title}</strong>
                        <p>{s.reason}</p>
                      </div>
                      <button
                        className="icon-button"
                        aria-label={"Start observed " + s.title}
                        disabled={busy}
                        onClick={() => play(s.id, "observed")}
                      >
                        <ArrowRight size={19} />
                      </button>
                    </div>
                  ))}
                  <p className="footnote">
                    Arrow buttons start a parent-observed round. Stay beside him
                    without giving answers. The child cannot select this mode.
                  </p>
                </section>
                <section className="white-card">
                  <div className="section-heading">
                    <h2>Ready for your review</h2>
                    <span className="count">{pending.length}</span>
                  </div>
                  {pending.length ? (
                    pending.map((x) => (
                      <div className="review-row" key={x.id}>
                        <span className="eyebrow">{x.type}</span>
                        <strong>{x.title}</strong>
                        <div className="row">
                          <button
                            className="button small"
                            disabled={busy}
                            onClick={() =>
                              act(
                                "admin/approve",
                                { id: x.id, approve: true },
                                "Approved.",
                              )
                            }
                          >
                            Approve
                          </button>
                          <button
                            className="button secondary small"
                            disabled={busy}
                            onClick={() =>
                              act(
                                "admin/approve",
                                { id: x.id, approve: false },
                                x.type === "Reward"
                                  ? "Stars refunded."
                                  : "Marked for another try.",
                              )
                            }
                          >
                            {x.type === "Reward" ? "Refund stars" : "Try again"}
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <Empty text="All caught up. Workbook quests and reward requests will appear here." />
                  )}
                </section>
              </div>
              <section className="section white-card">
                <h2>Learning at a glance</h2>
                <SkillTable stats={data.stats} />
                <button
                  className="text-button"
                  onClick={() => setSection("reports")}
                >
                  Explore learning insights <ArrowRight size={16} />
                </button>
              </section>
            </>
          )}
          {parent && section === "reports" && (
            <Reports
              data={data}
              play={play}
              busy={busy}
              difficulty={difficulty}
              setDifficulty={setDifficulty}
            />
          )}
          {parent && section === "library" && (
            <>
              <PageTitle
                eyebrow="THE MATERIALS YOU ALREADY HAVE, ALL ACCOUNTED FOR"
                title="A library for little discoveries."
                text="Import a dated snapshot manifest. New files enter review; existing notes and quests stay in place."
              />
              <div className="white-card import-card">
                <div>
                  <h3>
                    <Upload size={20} /> Add a snapshot
                  </h3>
                  <p>
                    Run <code>npm run materials:snapshot</code>, then choose{" "}
                    <code>.data/materials-manifest.json</code>. This imports an
                    inventory; the original documents stay in your private local
                    snapshot.
                  </p>
                </div>
                <label className="button secondary file-button">
                  Import manifest
                  <input
                    type="file"
                    accept="application/json,.json"
                    onChange={async (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      try {
                        if (file.size > 1000000)
                          throw Error("Manifest too large.");
                        const body = JSON.parse(await file.text());
                        const r = await act("admin/materials/import", body);
                        if (r)
                          setNotice(
                            `Imported ${r.added} new materials. ${r.total} in your library.`,
                          );
                      } catch (e) {
                        setError(e.message);
                      }
                    }}
                  />
                </label>
              </div>
              <div className="filters">
                {["All", "Math", "Chinese", "School", "Reference"].map((x) => (
                  <button
                    key={x}
                    className={filter === x ? "selected" : ""}
                    onClick={() => setFilter(x)}
                  >
                    {x}
                  </button>
                ))}
              </div>
              <div className="library-list">
                {data.materials
                  .filter((m) => filter === "All" || m.subject === filter)
                  .map((m) => (
                    <Material key={m.id} material={m} act={act} busy={busy} />
                  ))}
                {!data.materials.length && (
                  <Empty text="Import your snapshot manifest to see your family’s study materials." />
                )}
              </div>
            </>
          )}
          {parent && section === "settings" && (
            <>
              <PageTitle
                eyebrow="A LEARNING SPACE THAT FITS YOUR FAMILY"
                title="Make it your own."
                text="Manage Oliver’s profile, the parent password, and device access."
              />
              <div className="settings-grid">
                <form
                  className="white-card form-stack"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act(
                      "admin/profile",
                      Object.fromEntries(new FormData(e.currentTarget)),
                      "Profile updated.",
                    );
                  }}
                >
                  <h2>Learner profile</h2>
                  <label>
                    Display name
                    <input
                      name="name"
                      defaultValue={data.profile.name}
                      maxLength="40"
                      required
                    />
                  </label>
                  <div className="two-col">
                    <label>
                      Age
                      <input
                        type="number"
                        name="age"
                        min="3"
                        max="18"
                        defaultValue={data.profile.age}
                      />
                    </label>
                    <label>
                      School grade
                      <input name="grade" defaultValue={data.profile.grade} />
                    </label>
                  </div>
                  <label>
                    Daily exploration goal (minutes)
                    <input
                      type="number"
                      name="dailyGoal"
                      min="5"
                      max="60"
                      defaultValue={data.profile.dailyGoal}
                    />
                  </label>
                  <button className="button" disabled={busy}>
                    Save profile <Check size={17} />
                  </button>
                </form>
                <form
                  className="white-card form-stack"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const f = e.currentTarget;
                    const r = await act(
                      "admin/password",
                      Object.fromEntries(new FormData(f)),
                      "Parent password changed. Other parent sessions are signed out.",
                    );
                    if (r) f.reset();
                  }}
                >
                  <h2>Parent password</h2>
                  {data.settings.defaultPassword && (
                    <div className="notice">
                      You’re using the starter password. Set a unique parent
                      password before sharing the hosted app.
                    </div>
                  )}
                  <label>
                    Current password
                    <input
                      type="password"
                      name="current"
                      autoComplete="current-password"
                      required
                    />
                  </label>
                  <label>
                    New password (at least 10 characters)
                    <input
                      type="password"
                      name="password"
                      autoComplete="new-password"
                      minLength="10"
                      maxLength="200"
                      required
                    />
                  </label>
                  <button className="button" disabled={busy}>
                    Update password <Shield size={17} />
                  </button>
                </form>
                <div className="white-card">
                  <h2>Devices & data</h2>
                  <p>{data.storage}</p>
                  <p className="muted">
                    Timezone: America/New_York. Opening the child’s world locks
                    the admin session. A paired child device stays signed in for
                    30 days.
                  </p>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() =>
                      act(
                        "admin/revoke",
                        {},
                        "Child devices signed out. Open Oliver’s world again to pair this device.",
                      )
                    }
                  >
                    Sign out child devices
                  </button>
                  <p>
                    <a className="text-button" href="/api/admin/export">
                      <Download size={17} />
                      Download learning history
                    </a>
                  </p>
                </div>
                <div className="white-card">
                  <h2>About these insights</h2>
                  <p>
                    Supplemental learning practice, not a diagnostic or school
                    assessment. Response times and tab changes provide context.
                    They cannot establish whether a calculator or another person
                    was used.
                  </p>
                  <p className="muted">
                    No ads. No analytics trackers. No child email account.
                    Learning records are stored in your app’s database.
                  </p>
                </div>
              </div>
            </>
          )}
          <footer className="app-footer">
            <span>
              <span className="leaf">✦</span> Made for curious minds and little
              discoveries.
            </span>
            <span>
              {parent
                ? "Parent space · " + data.storage
                : "Take your time. Every try helps you grow."}
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
function SproutText() {
  return <span>✿</span>;
}
function PageTitle({ eyebrow, title, text }) {
  return (
    <div className="page-heading">
      <div className="eyebrow">{eyebrow}</div>
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}
function Metric({ title, value, icon }) {
  return (
    <div className="white-card metric">
      <span>{icon}</span>
      <strong>{value}</strong>
      <small>{title}</small>
    </div>
  );
}
function overallAccuracy(stats) {
  const n = stats.reduce((n, s) => n + s.independent, 0);
  return n
    ? Math.round(
        (100 * stats.reduce((n, s) => n + s.independentCorrect, 0)) / n,
      ) + "%"
    : "—";
}
function Empty({ text }) {
  return (
    <div className="empty">
      <span>🌱</span>
      <p>{text}</p>
    </div>
  );
}
function Assignment({ assignment: a, data, busy, act, parent }) {
  const c = data.completions.filter((c) => c.assignmentId === a.id).at(-1);
  return (
    <div className="assignment">
      <span className="assignment-icon">
        {a.material?.subject === "Chinese" ? "🌸" : "📚"}
      </span>
      <div className="grow">
        <h3>{a.title}</h3>
        <p>{a.instructions}</p>
        {a.material && (
          <small className="source-label">From: {a.material.title}</small>
        )}
        <div className="assignment-meta">
          <span>
            <Clock3 size={14} />
            {a.minutes} min
          </span>
          <span>
            <Star size={14} />
            {a.stars} stars with parent review
          </span>
          <span>
            {a.days
              .map((n) => ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"][n])
              .join(" · ")}
          </span>
        </div>
        {c && <small>Latest: {c.status}</small>}
      </div>
      {!parent && (
        <button
          className="icon-button"
          aria-label={"Ask for review: " + a.title}
          disabled={busy || c?.status === "pending"}
          onClick={() =>
            act(
              "assignment/request",
              { id: a.id },
              "Your grown-up will review your work before adding stars.",
            )
          }
        >
          <Check size={21} />
        </button>
      )}
    </div>
  );
}
function AssignmentForm({ data, act, busy, initial, onDone }) {
  const [editing, setEditing] = useState(!!initial);
  if (!editing)
    return (
      <button className="button" onClick={() => setEditing(true)}>
        <Plus size={18} />
        Add a study quest
      </button>
    );
  return (
    <form
      className="white-card form-stack assignment-form"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const r = await act(
          "admin/assignment",
          {
            ...Object.fromEntries(f),
            id: initial?.id,
            days: f.getAll("days").map(Number),
          },
          "Study quest saved.",
        );
        if (r) {
          setEditing(false);
          onDone();
        }
      }}
    >
      <div className="section-heading">
        <h2>{initial ? "Edit this quest" : "A new little quest"}</h2>
        <button
          type="button"
          className="icon-button"
          aria-label="Close quest form"
          onClick={() => {
            setEditing(false);
            onDone();
          }}
        >
          <X size={20} />
        </button>
      </div>
      <label>
        Quest title
        <input
          name="title"
          defaultValue={initial?.title || ""}
          placeholder="Read and retell a story together"
          required
        />
      </label>
      <label>
        Source material
        <select name="materialId" defaultValue={initial?.materialId || ""}>
          <option value="">Original practice / no source file</option>
          {data.materials
            ?.filter((m) => m.status !== "archived")
            .map((m) => (
              <option key={m.id} value={m.id}>
                {m.title}
              </option>
            ))}
        </select>
      </label>
      <label>
        What should Oliver do?
        <textarea
          name="instructions"
          defaultValue={initial?.instructions || ""}
          placeholder="Read one page, then tell me what happened first, next, and last."
          required
        />
      </label>
      <div className="two-col">
        <label>
          Minutes
          <input
            name="minutes"
            type="number"
            min="1"
            max="30"
            defaultValue={initial?.minutes || 5}
          />
        </label>
        <label>
          Stars after parent approval
          <input
            name="stars"
            type="number"
            min="0"
            max="20"
            defaultValue={initial?.stars ?? 3}
          />
        </label>
      </div>
      <fieldset>
        <legend>Practice days</legend>
        <div className="day-picker">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <label key={day}>
              <input
                name="days"
                type="checkbox"
                value={i}
                defaultChecked={
                  initial ? initial.days.includes(i) : i > 0 && i < 6
                }
              />
              {day}
            </label>
          ))}
        </div>
      </fieldset>
      <button className="button" disabled={busy}>
        {initial ? "Save quest" : "Add to the study plan"} <Plus size={17} />
      </button>
    </form>
  );
}
function Material({ material: m, act, busy }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="white-card material-card">
      <div className="list-row">
        <span className="mini-icon">
          {m.subject === "Chinese" ? "🌸" : m.subject === "Math" ? "🧱" : "📄"}
        </span>
        <div className="grow">
          <h3>{m.title}</h3>
          <small>
            {m.subject} · {(m.bytes / 1048576).toFixed(1)} MB · snapshot{" "}
            {m.snapshotAt.slice(0, 10)}
          </small>
        </div>
        <span className={"tag " + (m.status === "reviewed" ? "green" : "")}>
          {m.status.replaceAll("-", " ")}
        </span>
        <button
          className="icon-button"
          aria-label={"Review " + m.title}
          onClick={() => setOpen(!open)}
        >
          <ChevronRight size={19} />
        </button>
      </div>
      {open && (
        <form
          className="form-stack"
          onSubmit={(e) => {
            e.preventDefault();
            act(
              "admin/material",
              {
                id: m.id,
                ...Object.fromEntries(new FormData(e.currentTarget)),
              },
              "Material notes saved.",
            );
          }}
        >
          <p className="footnote">
            Local source: {m.relativePath}
            <br />
            SHA-256: {m.sha256}
          </p>
          <label>
            Review status
            <select name="status" defaultValue={m.status}>
              {["needs-review", "reviewed", "link-only", "archived"].map(
                (s) => (
                  <option key={s}>{s}</option>
                ),
              )}
            </select>
          </label>
          <label>
            Teaching notes & useful sections
            <textarea name="note" defaultValue={m.note} />
          </label>
          <button className="button small" disabled={busy}>
            Save review
          </button>
        </form>
      )}
    </div>
  );
}
function SkillTable({ stats }) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Skill</th>
            <th>Independent first answers</th>
            <th>Accuracy</th>
            <th>Typical correct time</th>
            <th>Observed answers</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr key={s.id}>
              <td>
                <strong>
                  {skillIcons[s.id]} {s.title}
                </strong>
              </td>
              <td>
                {s.independentCorrect} / {s.independent}
              </td>
              <td>
                {s.accuracy === null ? "No baseline yet" : s.accuracy + "%"}
              </td>
              <td>
                {s.medianSeconds === null ? "—" : s.medianSeconds + " sec"}
              </td>
              <td>{s.observed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Reports({ data, play, busy, difficulty, setDifficulty }) {
  const [selected, setSelected] = useState(null);
  return (
    <>
      <PageTitle
        eyebrow="LOOK FOR PATTERNS, NOT PERFECT SCORES"
        title="The story behind each answer."
        text="First answers stay in the record, including mistakes. Speed is context, never a race."
      />
      <div className="white-card">
        <h2>Independent practice</h2>
        <SkillTable stats={data.stats} />
        <p className="footnote">
          Excludes helped answers, answers with reported tab changes, and
          questions left open for 10 minutes or more. Times are median server
          elapsed time for correct independent answers. Active time and tab
          changes are browser reports. Observed means the parent started the
          round; it still needs actual adult supervision.
        </p>
      </div>
      <section className="white-card section">
        <h2>Parent-observed check-in</h2>
        <label>
          Number practice level
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value))}
          >
            <option value="1">2-digit numbers</option>
            <option value="2">3-digit numbers</option>
          </select>
        </label>
        <p>
          Choose a skill, stay beside him, and let him work without tools or
          hints. Stop whenever he needs a break. These short rounds guide
          practice; they are not standardized benchmarks.
        </p>
        <div className="row wrap">
          {data.stats.map((s) => (
            <button
              className="button secondary small"
              key={s.id}
              disabled={busy}
              onClick={() => play(s.id, "observed")}
            >
              {skillIcons[s.id]} {s.title}
            </button>
          ))}
        </div>
      </section>
      <section className="white-card section">
        <h2>Every attempt, kept honestly</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Adventure</th>
                <th>Started</th>
                <th>First answers correct</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {data.history.map((s) => (
                <tr key={s.id}>
                  <td>{data.stats.find((x) => x.id === s.skill)?.title}</td>
                  <td>
                    {new Date(s.startedAt).toLocaleString("en-US", {
                      timeZone: "America/New_York",
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </td>
                  <td>
                    {s.attempts.filter((a) => a.correct).length} /{" "}
                    {s.attempts.length}
                  </td>
                  <td>{s.mode}</td>
                  <td>
                    {s.abandoned
                      ? "Left early"
                      : s.finishedAt
                        ? "Finished"
                        : "In progress"}
                  </td>
                  <td>
                    <button
                      className="text-button"
                      onClick={() =>
                        setSelected(selected === s.id ? null : s.id)
                      }
                    >
                      {selected === s.id ? "Close" : "View"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!data.history.length && (
          <Empty text="Start a short round to begin collecting real observations." />
        )}
        {selected && (
          <div className="attempt-details">
            {data.history
              .find((s) => s.id === selected)
              ?.attempts.map((a) => (
                <div className="attempt" key={a.questionId}>
                  <strong>
                    {a.correct ? "✓" : "↻"} {a.prompt}
                  </strong>
                  <p>
                    Answered: {a.answer} · Expected: {a.expected}
                  </p>
                  <small>
                    {(a.wallMs / 1000).toFixed(1)} sec elapsed ·{" "}
                    {(a.activeMs / 1000).toFixed(1)} sec active ·{" "}
                    {a.focusLosses} tab changes ·{" "}
                    {a.helped ? "Help used" : "No help marked"}
                  </small>
                </div>
              ))}
          </div>
        )}
      </section>
      <section className="white-card section">
        <h2>Original game activity</h2>
        <p className="footnote">
          Legacy game events are reported by the game in the browser and kept
          separately. They do not count toward the server-graded baseline or the
          club’s star wallet. Their own stars and unlocks still work.
        </p>
        {data.legacyEvents.slice(0, 20).map((e, i) => (
          <div className="list-row" key={i}>
            <div className="grow">
              <strong>
                {e.game}: {e.prompt}
              </strong>
              <p>
                {e.correct ? "Correct" : "Needs practice"} · answer: {e.answer}{" "}
                · {Math.round(e.elapsedMs / 1000)} sec ·{" "}
                {e.helped ? "Help used" : "No help marked"} · {e.focusLosses}{" "}
                tab changes
              </p>
            </div>
            <span className="tag">Game reported</span>
          </div>
        ))}
      </section>
    </>
  );
}
