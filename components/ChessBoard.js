"use client";
import { useRef, useState } from "react";
import { PIECE_NAMES } from "../content/chess-lessons.mjs";
const paths = {
  k: (
    <>
      <path d="M30 7v13m-6-7h12" />
      <path d="M21 26q-10-12 0-12 9 0 9 12 0-12 9-12 10 0 0 12l-2 16H23z" />
      <path d="M19 44h22l4 9H15z" />
    </>
  ),
  q: (
    <>
      <path d="M15 17l7 8 8-14 8 14 7-8-7 26H22z" />
      <circle cx="15" cy="15" r="3" />
      <circle cx="30" cy="9" r="3" />
      <circle cx="45" cy="15" r="3" />
      <path d="M20 45h20l5 8H15z" />
    </>
  ),
  r: (
    <>
      <path d="M17 11h7v7h6v-7h6v7h7v-7h3v15l-7 5v12H21V31l-7-5V11z" />
      <path d="M19 45h22l4 8H15z" />
    </>
  ),
  b: (
    <>
      <path d="M30 9q-22 17-7 26l-2 8h18l-2-8Q52 26 30 9z" />
      <path d="M32 17l-8 9" fill="none" />
      <path d="M20 45h20l5 8H15z" />
    </>
  ),
  n: (
    <>
      <path d="M18 44q1-11 12-17l-11 3-7-7 13-13 13 3q9 15 5 31z" />
      <path d="M26 11l-1-5 9 7" />
      <circle cx="28" cy="19" r="1.4" fill="currentColor" />
      <path d="M17 46h26l3 7H14z" />
    </>
  ),
  p: (
    <>
      <circle cx="30" cy="17" r="9" />
      <path d="M24 27h12l-2 7 8 11H18l8-11z" />
      <path d="M19 47h22l4 6H15z" />
    </>
  ),
};
export function ChessPiece({ piece, theme = "classic" }) {
  const white = piece.color === "w";
  if (theme === "letters")
    return (
      <svg viewBox="0 0 60 60" aria-hidden="true">
        <circle
          cx="30"
          cy="30"
          r="24"
          fill={white ? "#fff9e9" : "#203246"}
          stroke={white ? "#203246" : "#fff9e9"}
          strokeWidth="3"
        />
        <text
          x="30"
          y="40"
          textAnchor="middle"
          fontSize="30"
          fontWeight="900"
          fill={white ? "#203246" : "#fff9e9"}
        >
          {piece.type.toUpperCase()}
        </text>
      </svg>
    );
  return (
    <svg
      viewBox="0 0 60 60"
      aria-hidden="true"
      className={theme === "storybook" ? "chess-badge-piece" : undefined}
    >
      {theme === "storybook" && (
        <circle
          cx="30"
          cy="30"
          r="28"
          fill={white ? "#fff1b6" : "#715594"}
          stroke={white ? "#8a5922" : "#e4d7ff"}
          strokeWidth="2"
        />
      )}
      <g
        fill={
          white
            ? theme === "storybook"
              ? "#fff7e6"
              : "#fff8e8"
            : theme === "storybook"
              ? "#38234d"
              : "#243449"
        }
        stroke={white ? "#263a46" : "#fff1d8"}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths[piece.type]}
      </g>
    </svg>
  );
}
export default function ChessBoard({
  game,
  theme,
  pieces,
  selected,
  onSelect,
  disabled,
}) {
  const holder = useRef(null),
    [cursor, setCursor] = useState(null),
    black = game.color === "b";
  const files = black ? "hgfedcba" : "abcdefgh",
    ranks = black ? "12345678" : "87654321";
  const squares = [...ranks].flatMap((rank) =>
    [...files].map((file) => file + rank),
  );
  const board = new Map(game.board.map((p) => [p.square, p])),
    destinations = new Set(
      game.legalMoves.filter((m) => m.from === selected).map((m) => m.to),
    ),
    last = game.moves.at(-1);
  function key(e, square) {
    const i = squares.indexOf(square),
      row = Math.floor(i / 8),
      col = i % 8;
    let next;
    if (e.key === "ArrowRight") next = row * 8 + Math.min(7, col + 1);
    else if (e.key === "ArrowLeft") next = row * 8 + Math.max(0, col - 1);
    else if (e.key === "ArrowUp") next = Math.max(0, row - 1) * 8 + col;
    else if (e.key === "ArrowDown") next = Math.min(7, row + 1) * 8 + col;
    else if (e.key === "Home") next = row * 8;
    else if (e.key === "End") next = row * 8 + 7;
    else return;
    e.preventDefault();
    setCursor(squares[next]);
    holder.current?.querySelector(`[data-square="${squares[next]}"]`)?.focus();
  }
  return (
    <div
      className="chess-board-frame"
      style={{
        "--square-light": theme.light,
        "--square-dark": theme.dark,
        "--board-edge": theme.edge,
      }}
    >
      <div
        className="chess-board"
        ref={holder}
        role="group"
        aria-label={`Chessboard. You play ${black ? "Black" : "White"}. Use arrow keys to explore, Enter to select.`}
      >
        {squares.map((square, i) => {
          const piece = board.get(square),
            legal = destinations.has(square),
            isSelected = selected === square,
            check = game.checkSquare === square,
            hint =
              game.hint &&
              (square === game.hint.from || square === game.hint.to),
            light = (square.charCodeAt(0) - 97 + Number(square[1])) % 2 === 0;
          return (
            <button
              type="button"
              key={square}
              data-square={square}
              tabIndex={
                (cursor || selected || (black ? "e7" : "e2")) === square
                  ? 0
                  : -1
              }
              aria-label={`${square}, ${piece ? (piece.color === "w" ? "White" : "Black") + " " + PIECE_NAMES[piece.type] : "empty"}${legal ? ", legal destination" : ""}${check ? ", king in check" : ""}${hint ? ", earned hint" : ""}`}
              aria-pressed={isSelected}
              aria-disabled={disabled}
              onFocus={() => setCursor(square)}
              onKeyDown={(e) => key(e, square)}
              onClick={() => !disabled && onSelect(square)}
              className={`chess-square ${light ? "light" : "dark"} ${isSelected ? "selected" : ""} ${last && (last.from === square || last.to === square) ? "last-move" : ""} ${check ? "in-check" : ""} ${hint ? "earned-hint" : ""}`}
            >
              {piece && <ChessPiece piece={piece} theme={pieces} />}
              {legal && (
                <span
                  className={piece ? "chess-capture-ring" : "chess-move-dot"}
                  aria-hidden="true"
                />
              )}
              {i % 8 === 0 && (
                <small className="chess-rank" aria-hidden="true">
                  {square[1]}
                </small>
              )}
              {i >= 56 && (
                <small className="chess-file" aria-hidden="true">
                  {square[0]}
                </small>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
