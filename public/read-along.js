// Shared by React lessons and the hosted copies of the original story games.
// Speech events use UTF-16 offsets, as do DOM Range and Intl.Segmenter.
export function wordAt(text, charIndex, language = "en-US") {
  if (!Number.isInteger(charIndex) || charIndex < 0 || charIndex >= text.length)
    return null;
  const words =
    typeof Intl.Segmenter === "function"
      ? [...new Intl.Segmenter(language, { granularity: "word" }).segment(text)]
          .filter((s) => s.isWordLike)
          .map((s) => ({ start: s.index, end: s.index + s.segment.length }))
      : [...text.matchAll(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)].map(
          (m) => ({ start: m.index, end: m.index + m[0].length }),
        );
  return words.find((w) => w.end > charIndex) || null;
}

export function questionSpeech(q) {
  return [
    [q.passage],
    [q.prompt],
    [q.context, q.language === "zh" ? "zh-CN" : "en-US"],
    ...(q.options || []).flatMap((o, i) => [
      [`Choice ${i + 1}.`, "en-US", false],
      [o, q.optionsLanguage || "en-US"],
    ]),
  ];
}

// Never wrap/replace React's text nodes. A Range paints the existing text without
// changing line breaks, selection, focus, screen-reader content or saved records.
export function textMap(root) {
  const doc = root.ownerDocument;
  const walker = doc.createTreeWalker(root, 4);
  const nodes = [];
  let text = "",
    node;
  while ((node = walker.nextNode())) {
    const p = node.parentElement;
    if (
      p.closest(
        'script,style,svg,[hidden],[aria-hidden="true"],.read-along-tools',
      ) ||
      !p.getClientRects().length ||
      doc.defaultView.getComputedStyle(p).visibility === "hidden"
    )
      continue;
    nodes.push({ node, start: text.length, text: node.data });
    text += node.data;
  }
  return { text, nodes };
}

export function mappedRange(map, start, end, doc) {
  const first = map.nodes.find(
    (n) => start >= n.start && start < n.start + n.text.length,
  );
  const last = map.nodes.find(
    (n) => end > n.start && end <= n.start + n.text.length,
  );
  if (!first || !last) return null;
  const range = doc.createRange();
  range.setStart(first.node, start - first.start);
  range.setEnd(last.node, end - last.start);
  return range;
}

export function createReader(win) {
  let session = null;
  const doc = win.document;
  function stop() {
    // Invalidate first: cancel() can synchronously fire old end/error handlers.
    const old = session;
    session = null;
    old?.cleanup();
    win.speechSynthesis?.cancel();
  }
  function speak(parts, root) {
    stop();
    if (!win.speechSynthesis || !win.SpeechSynthesisUtterance) return false;
    root ||=
      doc.querySelector('[aria-modal="true"]') ||
      doc.querySelector("main") ||
      doc.body;
    const map = textMap(root);
    let cursor = 0;
    const tracks = parts
      .filter(([text]) => text)
      .map(([value, lang = "en-US", bind = true]) => {
        const text = String(value);
        let start = bind ? map.text.indexOf(text, cursor) : -1;
        if (bind && start < 0) start = map.text.indexOf(text);
        if (start >= 0) cursor = start + text.length;
        return { text, lang, start };
      });
    if (!tracks.length) return false;
    if (!doc.getElementById("read-along-style")) {
      const style = doc.createElement("style");
      style.id = "read-along-style";
      style.textContent = `
        ::highlight(read-along-word){background:#ffe16b;color:#172344;text-decoration:underline;text-decoration-color:#956000}
        ::highlight(read-along-passage){background:#e2f1ff;color:#172344}
        .read-along-tools{position:fixed;bottom:max(12px,env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);z-index:10000;display:flex;align-items:center;gap:12px;width:max-content;max-width:calc(100vw - 24px);padding:8px 12px;background:#fffdf3;color:#172344;border:2px solid #d2a944;border-radius:16px;box-shadow:0 3px 14px #17234425;font:600 15px/1.35 system-ui}
        .read-along-tools button{font:inherit;min-height:44px;padding:8px 14px;border:2px solid #956000;border-radius:12px;color:#172344;background:#ffe16b;cursor:pointer;white-space:nowrap}
        .read-along-tools button:focus-visible{outline:3px solid #155ac5;outline-offset:3px}
        .read-along-ink{position:fixed;pointer-events:none;z-index:9999;background:#ffd44c66;border-bottom:2px solid #956000;border-radius:3px;mix-blend-mode:multiply}
        @media(max-width:480px){.read-along-tools{font-size:13px;gap:8px}}
      `;
      doc.head.append(style);
    }
    const tools = doc.createElement("div"),
      label = doc.createElement("span"),
      button = doc.createElement("button");
    tools.className = "read-along-tools";
    label.textContent = "Listening… follow the blue text.";
    button.type = "button";
    button.textContent = "■ Stop reading";
    button.onclick = stop;
    tools.append(label, button);
    // Keep the stop control inside a quiz's modal focus trap.
    (root.closest('[aria-modal="true"]') || doc.body).append(tools);
    let range = null,
      wordTiming = false,
      overlay = [];
    const custom = !!(win.CSS?.highlights && win.Highlight);
    function clearInk() {
      win.CSS?.highlights?.delete("read-along-word");
      win.CSS?.highlights?.delete("read-along-passage");
      overlay.forEach((el) => el.remove());
      overlay = [];
    }
    function paint() {
      clearInk();
      if (!range) return;
      if (custom) {
        win.CSS.highlights.set(
          wordTiming ? "read-along-word" : "read-along-passage",
          new win.Highlight(range),
        );
      } else {
        for (const rect of range.getClientRects()) {
          const ink = doc.createElement("span");
          ink.className = "read-along-ink";
          ink.setAttribute("aria-hidden", "true");
          ink.style.cssText = `left:${rect.left}px;top:${rect.top}px;width:${rect.width}px;height:${rect.height}px;${wordTiming ? "" : "background:#b8dcff55;border:0"}`;
          (root.closest('[aria-modal="true"]') || doc.body).append(ink);
          overlay.push(ink);
        }
      }
    }
    function hidden() {
      if (doc.hidden) stop();
    }
    // Cancel if a question/card is replaced, including by a legacy innerHTML update.
    const bound = tracks
      .filter((t) => t.start >= 0)
      .flatMap((t) =>
        map.nodes.filter(
          (n) =>
            n.start < t.start + t.text.length &&
            n.start + n.text.length > t.start,
        ),
      );
    const observer = new win.MutationObserver(() => {
      if (
        !root.isConnected ||
        !root.getClientRects().length ||
        bound.some(
          (n) =>
            !n.node.isConnected ||
            n.node.data !== n.text ||
            !n.node.parentElement.getClientRects().length,
        )
      )
        stop();
    });
    // Legacy games hide a story's ancestor; React can remove the whole root.
    // Watch the containing document so both transitions invalidate the ranges.
    observer.observe(doc.body, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ["class", "hidden", "style"],
    });
    win.addEventListener("scroll", paint, true);
    win.addEventListener("resize", paint);
    win.addEventListener("pagehide", stop);
    win.addEventListener("hashchange", stop);
    doc.addEventListener("visibilitychange", hidden);
    const current = {
      cleanup() {
        observer.disconnect();
        clearInk();
        tools.remove();
        win.removeEventListener("scroll", paint, true);
        win.removeEventListener("resize", paint);
        win.removeEventListener("pagehide", stop);
        win.removeEventListener("hashchange", stop);
        doc.removeEventListener("visibilitychange", hidden);
      },
      utterances: [],
    };
    session = current;
    for (let i = 0; i < tracks.length; i++) {
      const track = tracks[i],
        u = new win.SpeechSynthesisUtterance(track.text);
      u.lang = track.lang;
      u.rate = track.lang.startsWith("zh") ? 0.75 : 0.82;
      const voices = win.speechSynthesis.getVoices();
      const prefix = track.lang.startsWith("zh") ? "zh-cn" : "en";
      const voice =
        voices.find(
          (v) => v.localService && v.lang.toLowerCase().startsWith(prefix),
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(prefix));
      if (voice) u.voice = voice;
      u.onstart = () => {
        if (session !== current) return;
        wordTiming = false;
        label.textContent = "Listening… follow the blue text.";
        range =
          track.start < 0
            ? null
            : mappedRange(
                map,
                track.start,
                track.start + track.text.length,
                doc,
              );
        paint();
      };
      u.onboundary = (event) => {
        if (session !== current || event.name !== "word") return;
        const word = wordAt(track.text, event.charIndex, track.lang);
        if (!wordTiming) label.textContent = "Follow the gold word.";
        wordTiming = true;
        range =
          !word || track.start < 0
            ? null
            : mappedRange(
                map,
                track.start + word.start,
                track.start + word.end,
                doc,
              );
        paint();
      };
      u.onend = () => {
        if (session !== current) return;
        range = null;
        clearInk();
        if (i === tracks.length - 1) {
          session = null;
          current.cleanup();
        }
      };
      u.onerror = () => {
        if (session === current) stop();
      };
      current.utterances.push(u); // Retain handlers while the native engine speaks.
    }
    try {
      current.utterances.forEach((u) => win.speechSynthesis.speak(u));
    } catch {
      stop();
      return false;
    }
    return true;
  }
  return { speak, stop };
}

let reader;
export function speakParts(parts, root) {
  if (typeof window === "undefined") return false;
  reader ||= createReader(window);
  return reader.speak(parts, root);
}
export function stopReading() {
  reader?.stop();
}
if (typeof window !== "undefined")
  window.LMSReadAlong = { speakParts, stopReading };
