"use client";
import { useState } from "react";
import { Sprout, ArrowRight, ShieldCheck } from "lucide-react";
let activeLearner;
export async function api(url, body) {
  const headers =
    body === undefined ? {} : { "Content-Type": "application/json" };
  if (activeLearner && !["login", "logout", "learner/select"].includes(url))
    headers["x-lms-learner"] = activeLearner;
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
  return json;
}
export function Brand({ name = "Oliver" }) {
  return (
    <a className="brand" href="/">
      <span className="brand-mark">
        <Sprout size={28} />
      </span>
      <span>
        adventure
        <span className="brand-second">
          club <i>for {name}</i>
        </span>
      </span>
    </a>
  );
}
export function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api("login", Object.fromEntries(f));
      window.location.href = "/admin";
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }
  return (
    <main className="login-page">
      <Brand />
      <div className="login-art">
        <Fox />
        <span className="sparkle">✦</span>
      </div>
      <div className="login-card">
        <div className="eyebrow">A LITTLE LEARNING. A BIG ADVENTURE.</div>
        <h1>Welcome to the club.</h1>
        <p>A grown-up signs in first. Then it’s time to explore.</p>
        <form onSubmit={submit}>
          <label>
            Username
            <input
              name="username"
              autoComplete="username"
              defaultValue="admin"
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && (
            <p role="alert" className="error">
              {error}
            </p>
          )}
          <button className="button wide" disabled={busy}>
            {busy ? "Opening the gate…" : "Parent sign in"}{" "}
            <ArrowRight size={19} />
          </button>
        </form>
        <small>
          <ShieldCheck size={15} /> A private learning space for your family.
        </small>
      </div>
    </main>
  );
}
export function Fox() {
  return (
    <svg viewBox="0 0 180 180" aria-hidden="true">
      <path fill="#b85428" d="M45 58 24 10 80 40M130 58l27-48-5 73" />
      <path fill="#ef9a55" d="m40 51-7-25 28 21m72 3 16-22-3 36" />
      <path
        fill="#dc783c"
        d="M25 78c-1-58 131-57 135 0 4 57-40 85-67 85S21 139 25 78"
      />
      <path
        fill="#fff2da"
        d="M24 83c30-7 49 7 68 36 18-29 39-43 68-36-2 48-40 80-67 80S24 129 24 83"
      />
      <ellipse cx="60" cy="83" rx="5" ry="7" fill="#273b33" />
      <ellipse cx="123" cy="83" rx="5" ry="7" fill="#273b33" />
      <path d="M81 119q11-10 22 0l-11 10z" fill="#273b33" />
      <path
        d="M82 139q10 9 20 0"
        fill="none"
        stroke="#273b33"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path d="m111 163 15 10-1-24" fill="#62957b" />
    </svg>
  );
}
export function Landscape() {
  return (
    <svg
      viewBox="0 0 600 275"
      className="landscape"
      aria-label="An illustrated adventure trail winding through green hills to a castle"
      role="img"
    >
      <circle cx="451" cy="51" r="27" fill="#f9cf75" />
      <path
        d="M0 149 85 73l69 62 73-101 92 113 88-57 77 48 64-45 52 71v111H0"
        fill="#bbd1b9"
      />
      <path d="M0 174q131-129 268 4 171-135 332-7v104H0" fill="#87ae8d" />
      <path d="M0 239q177-139 364-27 130-75 236-5v68H0" fill="#5d9273" />
      <path
        d="M91 275q-5-61 152-62 111-1 68-41-33-28 78-32 64-4 70-29"
        fill="none"
        stroke="#e8d8ad"
        strokeWidth="22"
      />
      <path d="m440 112 0-46h14V53h12v13h13V53h12v13h14v46" fill="#f5e9cb" />
      <path fill="#7a8162" d="M465 112V91a9 9 0 0 1 18 0v21" />
      <path d="M453 52V28l24 8-24 8" fill="#c66b41" />
      <g fill="#326b51">
        <path d="m52 197 19-46 20 46zm20-26 16-41 17 41zm417 64 22-53 22 53zm-153-44 14-34 15 34z" />
      </g>
      <g fill="#efd58a">
        <circle cx="186" cy="233" r="17" />
        <circle cx="318" cy="189" r="12" />
      </g>
      <text x="186" y="240" fill="#846321" fontSize="23" textAnchor="middle">
        ★
      </text>
      <text x="318" y="194" fill="#846321" fontSize="17" textAnchor="middle">
        ★
      </text>
      <g stroke="#dce7d2" strokeWidth="3" strokeLinecap="round">
        <path d="M165 81h30m-15-15v30M402 27h14m-7-7v14" />
      </g>
    </svg>
  );
}
export function Loading() {
  return (
    <main className="loading">
      <Brand />
      <p>Getting your adventure ready…</p>
    </main>
  );
}
export function ErrorBox({ message }) {
  return message ? (
    <div role="alert" className="notice error">
      {message}
    </div>
  ) : null;
}
