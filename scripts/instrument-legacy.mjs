import fs from "node:fs";
for (const game of ["math", "reading", "stories"]) {
  const file = `legacy/${game}.html`;
  let h = fs.readFileSync(file, "utf8");
  if (h.includes("window.LMS?.begin();")) continue;
  h = h.replace("function draw(){", "function draw(){window.LMS?.begin();");
  if (game === "math")
    h = h
      .replace(
        "if(ok)correct++;",
        "window.LMS?.answer(q.display,String(n),ok);if(ok)correct++;",
      )
      .replace('href="stories/"', 'href="/stories/"')
      .replace('href="reading/"', 'href="/reading/"');
  if (game === "reading")
    h = h.replace(
      "if(ok)correct++;",
      "window.LMS?.answer(x.p,x.opts.find(o=>o.i===i)?.v,ok);if(ok)correct++;",
    );
  if (game === "stories")
    h = h
      .replace(
        "if(ok)correct++;",
        "window.LMS?.answer(q.q,q.options[i],ok);if(ok)correct++;",
      )
      .replace(
        "if(!d.streak.includes(currentId))d.streak.push(currentId)",
        "d.streak=[...d.streak,currentId].slice(-3)",
      )
      .replace(
        "d.streak.length>=3&&level<4",
        "d.streak.length===3&&new Set(d.streak).size===3&&level<4",
      )
      .replace('href="../"', 'href="/games/math/"');
  h = h.replace(
    "</style>",
    "@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}button:focus-visible,a:focus-visible{outline:4px solid #cc713d;outline-offset:3px}</style>",
  );
  fs.writeFileSync(file, h);
}
