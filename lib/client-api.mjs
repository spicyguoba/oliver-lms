let activeLearner;
let activeAccount;
export async function api(url, body) {
  const headers =
    body === undefined ? {} : { "Content-Type": "application/json" };
  if (activeLearner && !["login", "logout", "learner/select"].includes(url))
    headers["x-lms-learner"] = activeLearner;
  if (activeAccount && !["login", "logout"].includes(url))
    headers["x-lms-account"] = activeAccount;
  const r = await fetch("/api/" + url, {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });
  let json;
  try {
    json = await r.json();
  } catch {
    throw new Error("The server is unavailable. Try again.");
  }
  if (!r.ok)
    throw Object.assign(new Error(json.error || "Please try again."), {
      status: r.status,
    });
  if (json.learnerId) activeLearner = json.learnerId;
  if (json.account?.id && json.learnerId) activeAccount = json.account.id;
  if (["login", "logout"].includes(url)) {
    activeAccount = undefined;
    activeLearner = undefined;
    try {
      localStorage.setItem(
        "lms-auth-changed-v1",
        `${Date.now()}-${Math.random()}`,
      );
    } catch {}
  }
  return json;
}
