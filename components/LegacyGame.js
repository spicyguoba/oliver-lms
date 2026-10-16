"use client";
import { useEffect, useState } from "react";
import { api, Brand, Login, Loading, ErrorBox } from "./ui";
export default function LegacyGame({ game }) {
  const [ready, setReady] = useState(false),
    [login, setLogin] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    api("state")
      .then(() => setReady(true))
      .catch((e) => (e.status === 401 ? setLogin(true) : setError(e.message)));
  }, []);
  if (login) return <Login />;
  if (!ready)
    return (
      <>
        <Loading />
        <ErrorBox message={error} />
      </>
    );
  return (
    <main className="game-page">
      <header>
        <Brand />
        <a className="button secondary small" href="/">
          🏠 Home
        </a>
      </header>
      <iframe
        className="game-frame"
        src={"/api/game/" + game}
        title={
          game === "math"
            ? "Math Quest"
            : game === "reading"
              ? "Reading Rangers"
              : "Story Star Adventures"
        }
        allow="autoplay"
      />
    </main>
  );
}
