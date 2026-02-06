## Packages
use-sound | For game sound effects (jump, game over, click)
framer-motion | Smooth UI transitions for menus and overlays
canvas-confetti | Celebration effect for high scores

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["'Fredoka'", "var(--font-display)", "sans-serif"],
  body: ["'Outfit'", "var(--font-body)", "sans-serif"],
}

Integration assumptions:
- POST /api/scores stores username + score
- GET /api/scores returns top leaderboard
- Game loop runs on requestAnimationFrame
- Canvas is used for rendering high-performance 2D graphics
