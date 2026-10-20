import { Chess } from "chess.js";
export { Chess };
const VALUES = { p: 100, n: 320, b: 335, r: 500, q: 900, k: 0 };
function staticScore(c) {
  let score = 0;
  const pieces = c.board().flat().filter(Boolean),
    endgame =
      pieces.filter((p) => p.type === "q" || p.type === "r").length <= 2;
  for (const p of pieces) {
    const file = p.square.charCodeAt(0) - 97,
      rank = Number(p.square[1]) - 1,
      central = 3.5 - Math.max(Math.abs(file - 3.5), Math.abs(rank - 3.5));
    let bonus =
      p.type === "p"
        ? (p.color === "w" ? rank : 7 - rank) * 7
        : p.type === "n" || p.type === "b"
          ? central * 15
          : p.type === "k"
            ? endgame
              ? central * 12
              : -central * 8
            : central * 3;
    score += (p.color === "w" ? 1 : -1) * (VALUES[p.type] + bonus);
  }
  return score * (c.turn() === "w" ? 1 : -1);
}
const spec = (m) => ({
  from: m.from,
  to: m.to,
  ...(m.promotion ? { promotion: m.promotion } : {}),
});
function priority(m) {
  return (
    (m.san.includes("#") ? 100000 : 0) +
    (m.captured ? 10 * VALUES[m.captured] - VALUES[m.piece] : 0) +
    (m.promotion ? VALUES[m.promotion] : 0) +
    (m.san.includes("+") ? 35 : 0) +
    (m.flags.includes("k") || m.flags.includes("q") ? 45 : 0)
  );
}
// Bounded iterative deepening. Difficulty labels are club settings, not Elo ratings.
export function chooseChessMove(c, level = 3) {
  const legal = c.moves({ verbose: true });
  if (!legal.length) return null;
  // Even Fox considers the opponent's reply instead of playing randomly.
  // Later friends have larger search budgets, not deliberate random blunders.
  level = Math.max(1, Math.min(5, Math.trunc(level) || 3));
  const limit = [0, 1800, 2800, 4200, 6500, 10000][level],
    maxDepth = [0, 2, 3, 3, 4, 5][level];
  const deadline = performance.now() + [0, 500, 650, 800, 1100, 1500][level];
  let nodes = 0,
    aborted = false,
    best = legal[0],
    completedDepth = 0;
  const ordered = legal.sort((a, b) => priority(b) - priority(a));
  best = ordered[0];
  function search(depth, alpha, beta, ply) {
    if (++nodes > limit || (nodes % 32 === 0 && performance.now() > deadline)) {
      aborted = true;
      return staticScore(c);
    }
    if (c.isCheckmate()) return -100000 + ply;
    if (c.isDraw() || c.isThreefoldRepetition()) return 0;
    if (depth <= 0) return staticScore(c);
    const moves = c
      .moves({ verbose: true })
      .sort((a, b) => priority(b) - priority(a));
    let value = -Infinity;
    for (const move of moves) {
      c.move(spec(move));
      const n = -search(depth - 1, -beta, -alpha, ply + 1);
      c.undo();
      if (aborted) return value === -Infinity ? staticScore(c) : value;
      value = Math.max(value, n);
      alpha = Math.max(alpha, n);
      if (alpha >= beta) break;
    }
    return value;
  }
  for (let depth = 1; depth <= maxDepth; depth++) {
    let score = -Infinity,
      candidate = best;
    const moves = [best, ...ordered.filter((m) => m.lan !== best.lan)];
    for (const move of moves) {
      c.move(spec(move));
      const n = -search(depth - 1, -Infinity, -score, 1);
      c.undo();
      if (aborted) break;
      if (n > score) {
        score = n;
        candidate = move;
      }
    }
    if (aborted) break;
    best = candidate;
    completedDepth = depth;
    if (score >= 99990) break;
  }
  return { ...spec(best), depth: completedDepth, nodes };
}
export function chessOutcome(c) {
  if (c.isCheckmate())
    return {
      kind: "checkmate",
      winner: c.turn() === "w" ? "b" : "w",
      title: "Checkmate",
      explanation:
        "The king is in check, and no legal move can make it safe. The game ends without capturing the king.",
    };
  if (c.isStalemate())
    return {
      kind: "stalemate",
      title: "Stalemate · a draw",
      explanation:
        "The player to move is not in check, but has no legal move with any piece. Leave a legal reply next time, unless your move gives checkmate.",
    };
  if (c.isInsufficientMaterial())
    return {
      kind: "material",
      title: "Draw · not enough pieces",
      explanation:
        "Neither side has enough material for a possible checkmate in this position.",
    };
  if (c.isThreefoldRepetition())
    return {
      kind: "repetition",
      title: "Draw · repeated position",
      explanation:
        "The same position, with the same player to move and move rights, occurred three times. Club practice games end automatically here.",
    };
  if (c.isDrawByFiftyMoves())
    return {
      kind: "fifty",
      title: "Draw · fifty-move rule",
      explanation:
        "Both players made fifty moves without a pawn move or a capture. Club practice games end automatically here.",
    };
  return null;
}
export function chessHint(c) {
  const move = chooseChessMove(c, 4);
  if (!move) return null;
  const m = c.move(spec(move));
  const outcome = chessOutcome(c);
  c.undo();
  let why =
    outcome?.kind === "checkmate"
      ? "This gives checkmate: check, with no legal escape."
      : m.flags.includes("k") || m.flags.includes("q")
        ? "This castles your king and brings a rook into the game."
        : outcome?.kind === "stalemate"
          ? "This leads to stalemate. A draw can save a difficult game."
          : m.captured
            ? `This captures a ${m.captured === "p" ? "pawn" : { n: "knight", b: "bishop", r: "rook", q: "queen" }[m.captured]}. Check whether the piece will be safe afterward.`
            : m.san.includes("+")
              ? "This gives check. Look at how the other player can answer."
              : "This is one useful move from the club computer. Look at the squares it controls and keep your king safe.";
  return {
    from: move.from,
    to: move.to,
    promotion: move.promotion || null,
    san: m.san,
    text: `Try ${m.piece === "p" ? "pawn" : { k: "king", q: "queen", r: "rook", b: "bishop", n: "knight" }[m.piece]} ${move.from} → ${move.to}${move.promotion ? " and promote" : ""}. ${why}`,
  };
}
