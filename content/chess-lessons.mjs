// Original family lessons. The public goal describes the skill, not a hidden study-quiz key.
export const CHESS_LEVELS = [
  {
    id: 1,
    name: "Friendly Fox",
    description: "A gentle partner who explores and sometimes misses a chance.",
  },
  { id: 2, name: "Curious Owl", description: "Looks for captures and checks." },
  {
    id: 3,
    name: "Clever Badger",
    description: "Looks ahead and protects its pieces.",
  },
  {
    id: 4,
    name: "Brave Dragon",
    description: "Plans deeper. A good challenge after some practice.",
  },
  {
    id: 5,
    name: "Castle Champion",
    description: "Our toughest club opponent. Take your time!",
  },
];
export const BOARD_THEMES = {
  forest: {
    name: "Forest",
    light: "#e5edcf",
    dark: "#70946b",
    edge: "#284c3b",
  },
  ocean: { name: "Ocean", light: "#d9eff5", dark: "#5795b1", edge: "#183a58" },
  sand: {
    name: "Sandcastle",
    light: "#fff0cc",
    dark: "#c59b6c",
    edge: "#6b4936",
  },
  cosmos: { name: "Space", light: "#e8ddfa", dark: "#8a76b2", edge: "#302449" },
};
export const PIECE_THEMES = {
  classic: "Classic carvings",
  storybook: "Storybook badges",
  letters: "Letter helpers",
};
export const PIECE_NAMES = {
  k: "king",
  q: "queen",
  r: "rook",
  b: "bishop",
  n: "knight",
  p: "pawn",
};
export const CHESS_SCENARIOS = {
  standard: { name: "Full chess game", fen: null, guide: [] },
  queen: {
    name: "King + queen finish",
    fen: "4k3/8/8/8/8/8/8/3QK3 w - - 0 1",
    guide: [
      "Use your queen to make a smaller box for the other king. Keep your queen safe from capture.",
      "Bring your king closer to help. Kings must never be next to each other.",
      "Leave the other king a legal move until you can give checkmate. Finish with your queen protected and the escape squares covered.",
    ],
  },
  rook: {
    name: "King + rook finish",
    fen: "4k3/8/8/8/8/8/8/R3K3 w - - 0 1",
    guide: [
      "Your rook can cut off a whole rank or file. Make the enemy king’s box smaller, one step at a time.",
      "Bring your king up to help and protect the rook. Do not put the kings next to each other.",
      "Guide the other king to an edge. Give the final rook check when your king covers the escape squares.",
    ],
  },
  ladder: {
    name: "Two-rook ladder practice",
    fen: "4k3/8/8/8/8/8/8/R3K2R w - - 0 1",
    guide: [
      "One rook makes a wall across a rank. The other rook gives check on the next rank.",
      "Take turns with the rooks to guide the king toward an edge. Keep each rook far enough away that the king cannot capture it.",
      "Check the escape squares before your final check. The aim is checkmate, not trapping a king without check.",
    ],
  },
};
export const CHESS_LESSONS = [
  {
    id: "castle-king",
    title: "A little castle",
    icon: "🏰",
    topic: "Castling",
    fen: "4k3/8/8/8/8/8/8/4K2R w K - 0 1",
    goal: "castle-k",
    task: "Castle on the king side. Tap the king, then g1.",
    guide: [
      "Castling moves two pieces in one turn. Your king goes two squares toward a rook. The rook hops to the square your king crossed.",
      "King side: e1 → g1 and h1 → f1. For Black: e8 → g8 and h8 → f8.",
      "Neither king nor that rook may have moved before. The squares between them must be empty. Your king cannot start in check, cross an attacked square, or finish in check.",
    ],
    success:
      "You made a castle! Your king moved two squares, and your rook hopped beside it.",
  },
  {
    id: "castle-queen",
    title: "A long castle",
    icon: "👑",
    topic: "Castling",
    fen: "4k3/8/8/8/8/8/8/R3K3 w Q - 0 1",
    goal: "castle-q",
    task: "Castle on the queen side. Move the king from e1 to c1.",
    guide: [
      "Queen-side castling also moves the king just two squares. The king goes e1 → c1; the rook goes a1 → d1.",
      "All squares between the king and rook must be empty, including b1. The king travels through d1 to c1. Neither may be attacked, and e1 must be safe too.",
      "The rook may be attacked. The king must be safe. If a king or rook moves away and back, its castling right is still gone.",
    ],
    success:
      "Long castle complete! The king went two squares, even though this rook started farther away.",
  },
  {
    id: "castle-safe",
    title: "Choose the safe castle",
    icon: "🛡️",
    topic: "Castling",
    fen: "1k3r2/8/8/8/8/8/8/R3K2R w KQ - 0 1",
    goal: "castle-q",
    task: "The black rook attacks f1. Which side can your king castle to safely?",
    guide: [
      "Imagine your king walking along its castling route. Every square the king uses must be safe.",
      "Here the black rook looks down the f-file. Your king cannot walk through f1. Try the other side.",
    ],
    success:
      "You checked the whole route! Queen-side castling avoids the attacked f1 square.",
  },
  {
    id: "escape-check",
    title: "Check comes first",
    icon: "🚨",
    topic: "King safety",
    fen: "k3r3/8/8/8/8/8/8/4K2R w K - 0 1",
    goal: "escape",
    task: "Your king is in check. Move your king to a safe square.",
    guide: [
      "Check means a piece attacks your king. Your next move must make your king safe.",
      "You can move the king, capture the checking piece, or block a long-range attack when that is legal. You cannot castle out of check.",
    ],
    success:
      "Safe again! You answered the check before trying to build a castle.",
  },
  {
    id: "rook-mate",
    title: "King and rook teamwork",
    icon: "🤝",
    topic: "Checkmate",
    fen: "7k/8/6K1/8/8/8/8/R7 w - - 0 1",
    goal: "mate",
    task: "White to move. Find checkmate in one move with your rook.",
    guide: [
      "Checkmate needs two things: the king is in check, and no legal move can remove the check.",
      "A rook controls a whole row or column. Your king helps cover the escape squares.",
      "Before finishing, check the king’s neighbors. Can it move, capture the checking piece, or block the attack?",
    ],
    success:
      "Checkmate! The rook gives check along the back rank, and your king guards the escape square.",
  },
  {
    id: "queen-mate",
    title: "A protected queen",
    icon: "💎",
    topic: "Checkmate",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    goal: "mate",
    task: "Move your queen to give checkmate. Keep her protected by your king.",
    guide: [
      "A queen can cover many escape squares, but a lonely queen beside the enemy king may be captured.",
      "Bring your king close enough to protect her. Kings may never stand next to each other.",
      "Checkmate ends the game. You never actually capture a king.",
    ],
    success:
      "Checkmate! Your protected queen checks the king and covers its escape squares.",
  },
  {
    id: "ladder-mate",
    title: "Two-rook ladder",
    icon: "🪜",
    topic: "Checkmate",
    fen: "7k/6R1/5K2/8/8/8/8/R7 w - - 0 1",
    goal: "mate",
    task: "One rook cuts off the seventh rank. Use the other rook to finish the ladder.",
    guide: [
      "Two rooks can work like ladder steps. One rook cuts off a row; the other gives check on the next row.",
      "Keep both rooks safe from the king. Continue shrinking the king’s space until check is checkmate.",
    ],
    success:
      "A ladder finish! One rook guards the escape rank; the other gives the final check.",
  },
  {
    id: "avoid-stalemate",
    title: "Leave a doorway",
    icon: "🚪",
    topic: "Avoiding draws",
    fen: "7k/8/4QK2/8/8/8/8/8 w - - 0 1",
    goal: "keep-playing",
    task: "Move your queen without causing stalemate. Leave Black a legal move, or give checkmate.",
    guide: [
      "Stalemate is a draw: the player to move is NOT in check but has NO legal move with ANY piece.",
      "When you have a big lead, count the enemy king’s safe squares before moving. Leave a doorway unless your move gives checkmate.",
      "A draw is not a loss. Sometimes saving a draw is excellent play!",
    ],
    success:
      "You left the game alive. You checked for a legal reply instead of trapping a king without check.",
  },
  {
    id: "finish-not-trap",
    title: "Check, then finish",
    icon: "🎯",
    topic: "Avoiding draws",
    fen: "7k/8/5KQ1/8/8/8/8/8 w - - 0 1",
    goal: "mate",
    task: "Finish with checkmate instead of simply taking away all the squares.",
    guide: [
      "No escape squares alone is not enough. Ask: “Is the king actually in check?”",
      "If it is in check and no legal move can save it, that is checkmate. If it is not in check and there are no legal moves, that is stalemate.",
    ],
    success:
      "You gave check as well as covering the exits. That makes checkmate, not stalemate.",
  },
  {
    id: "promote-mate",
    title: "A pawn becomes a helper",
    icon: "🌟",
    topic: "Promotion",
    fen: "7k/5P2/6K1/8/8/8/8/8 w - - 0 1",
    goal: "mate",
    task: "Promote the pawn and give checkmate. Choose the new piece carefully.",
    guide: [
      "A pawn that reaches the farthest rank must become a queen, rook, bishop or knight. You may choose even if you still have your original queen.",
      "A queen is often useful, but check the position. A different promotion can sometimes prevent stalemate or make a special check.",
    ],
    success:
      "Your pawn promoted into a powerful helper and delivered checkmate.",
  },
];
