(function () {
  const game = window.__LMS_GAME__,
    saved = window.__LMS_SAVED__ || {};
  const learnerId = window.__LMS_LEARNER__ || "oliver";
  const prefix = /^(mathquest-|reading-rangers-|rr-previous-|story-star-)/;
  const original = Storage.prototype.setItem;
  const originalGet = Storage.prototype.getItem;
  const originalRemove = Storage.prototype.removeItem;
  const namespace = learnerId === "oliver" ? "" : `lms-${learnerId}:`;
  const physicalKey = (k) =>
    namespace && prefix.test(String(k)) ? namespace + k : k;
  Storage.prototype.getItem = function (k) {
    return originalGet.call(this, this === localStorage ? physicalKey(k) : k);
  };
  Storage.prototype.removeItem = function (k) {
    return originalRemove.call(
      this,
      this === localStorage ? physicalKey(k) : k,
    );
  };
  for (const [k, v] of Object.entries(saved)) {
    try {
      original.call(localStorage, physicalKey(k), v);
    } catch {}
  }
  let timer,
    start = performance.now(),
    losses = 0,
    helped = false;
  function snapshot() {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const stored = localStorage.key(i);
      if (namespace && !stored.startsWith(namespace)) continue;
      const k = namespace ? stored.slice(namespace.length) : stored;
      if (prefix.test(k)) out[k] = localStorage.getItem(k);
    }
    return out;
  }
  let retry,
    roundId = crypto.randomUUID(),
    roundEnded = false;
  const pendingKey =
    "lms-pending-completions-" +
    (learnerId === "oliver" ? "" : learnerId + "-") +
    game;
  let pending = [];
  try {
    pending = JSON.parse(localStorage.getItem(pendingKey) || "[]");
  } catch {}
  if (!Array.isArray(pending)) pending = [];
  const remember = () => {
    try {
      original.call(localStorage, pendingKey, JSON.stringify(pending));
    } catch {}
  };
  const status = (text) => {
    const el = document.getElementById("lms-save-status");
    if (el) el.textContent = text;
  };
  async function sync(event) {
    try {
      const completions = pending.length ? [...pending] : [null];
      for (const completion of completions) {
        const r = await fetch("/api/legacy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learnerId,
            game,
            saved: snapshot(),
            event,
            completion,
          }),
        });
        if (r.status === 409) {
          status("Learner changed · return to adventure home");
          return;
        }
        if (!r.ok) throw Error();
        event = undefined;
        if (completion) {
          pending = pending.filter((c) => c.id !== completion.id);
          remember();
        }
      }
      status("☁ Saved to your adventure");
    } catch {
      status("Saved on this iPad · cloud sync will retry");
      clearTimeout(retry);
      retry = setTimeout(() => sync(event), 5000);
    }
  }
  Storage.prototype.setItem = function (k, v) {
    original.call(this, this === localStorage ? physicalKey(k) : k, v);
    if (this === localStorage && prefix.test(k)) {
      clearTimeout(timer);
      timer = setTimeout(() => sync(), 400);
    }
  };
  window.LMS = {
    begin() {
      if (roundEnded) {
        roundId = crypto.randomUUID();
        roundEnded = false;
      }
      start = performance.now();
      losses = 0;
      helped = false;
    },
    answer(prompt, answer, correct) {
      sync({
        prompt,
        answer,
        correct,
        elapsedMs: Math.round(performance.now() - start),
        focusLosses: losses,
        helped,
      });
    },
    complete(correct, total) {
      if (roundEnded) return;
      roundEnded = true;
      pending.push({ id: roundId, correct, total });
      remember();
      sync();
    },
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) losses++;
  });
  document.addEventListener("click", (e) => {
    if (["help", "hint", "hear", "speak"].includes(e.target.id)) helped = true;
  });
  window.addEventListener("online", () => sync());
  window.addEventListener("pagehide", () => {
    fetch("/api/legacy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learnerId, game, saved: snapshot() }),
      keepalive: true,
    }).catch(() => {});
  });
  document.addEventListener("DOMContentLoaded", () => {
    const bar = document.createElement("div");
    bar.style =
      "position:sticky;top:0;z-index:99;background:#173f3b;color:white;padding:10px 16px;display:flex;justify-content:space-between;font:14px system-ui";
    const a = document.createElement("a");
    a.href = "/";
    a.target = "_top";
    a.textContent = "← Adventure home";
    a.style = "color:white;min-height:30px;display:grid;place-content:center";
    const s = document.createElement("span");
    s.id = "lms-save-status";
    s.textContent = "☁ Your LMS game copy";
    bar.append(a, s);
    document.body.prepend(bar);
    if (pending.length) sync();
  });
})();
