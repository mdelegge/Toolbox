# Blackfeather's Toolbox

Blackfeather's Toolbox is a collection of lightweight browser tools, generators, and arcade prototypes built with plain HTML, CSS, and JavaScript, predominantly using AI assistance (vibe coding). Each module lives in its own directory and can be opened directly without a build step, making the toolbox easy to tweak, remix, or deploy as a static site.

## Run It Locally
- Open `index.html` in any modern browser to use the toolbox as a portal.
- For cleaner asset loading, you can also serve the folder with a simple static server, e.g. `npx http-server .` or `python3 -m http.server 5173` and then visit the printed URL.

## Repository Layout
- `index.html` — landing page that links out to every tool.
- `<tool>/index.html` — entry point for a specific tool (supporting scripts live beside it under `js/`, `css/`, etc.).
- `*/PRD.md` — design prompts and feature notes that guided each build.
- `dndtools/README.md` — extra guidance for expanding the D&D generators; see below for a summary.

## Tool Catalog
| Folder | Entry Point | Highlights |
| ------ | ----------- | ---------- |
| `dndtools/` | `dndtools/index.html` | Loot, encounter, flavor, and name generators for 5e with table/category filtering. Add new tables by extending `modules/manifest.json`; optional weights, dice notations, and rarity metadata are supported. |
| `wordsearch/` | `wordsearch/index.html` | Interactive word search builder with adjustable grid (6–30 rows/cols), custom word lists, pointer/touch selection, progress tracking, and PNG export of the puzzle. Includes a hidden celebratory word for demos. |
| `generated_maps/` | `generated_maps/index.html` | Procedural dungeon generator with BSP and Donjon-style algorithms, tunable dimensions, room counts, and presets for corridor trimming. |
| `reference_chart/` | `reference_chart/index.html` | Click-to-expand quick reference for the 2024 D&D basic rules, powered by JSON topic data for easy updates. |
| `diceroller/` | `diceroller/index.html` | Dice roller with chip-based die selection, unlimited modifiers, advantage/disadvantage toggles that reuse stored rolls, reroll/copy helpers, and rich result breakdowns. |
| `bonkersify/` | `bonkersify/index.html` | “Random case” text transformer with playful UI polish; paste text, get chaotic casing instantly. |
| `hacker_l33t/` | `hacker_l33t/index.html` | Text-to-leetspeak converter with live preview and simple copy workflow. |
| `svg2png/` | `svg2png/svg2png.html` | Client-side SVG to PNG exporter with configurable scale, background color, padding, and batch handling for multiple assets. |
| `asteroids/` | `asteroids/index.html` | HTML5 Canvas reinterpretation of the classic Asteroids loop featuring ship thrust/rotation, screen wrapping, destructible rocks, scoring, and lives. |
| `defender/` | `defender/index.html` | Side-scrolling Defender homage: parallax terrain, multiple enemy behaviors, projectile combat, scoring, and game-state transitions. |
| `defender-copilot/` | `defender-copilot/index.html` | Alternate Defender prototype produced with AI assistance; useful for comparing structure and feature coverage against the hand-crafted version. |
| `snake/` | `snake/index.html` | Vanilla JS snake game with canvas rendering, score tracking, and restart flow. |
| `tetris/` | `tetris/tetris.html` | Classic Tetris implementation with the seven tetrominoes, rotation logic, line clears, scoring, and accelerating drop speed. |

## Extending the Toolbox
- To surface a new tool on the landing page, duplicate an existing card block in `index.html`, update the link/title/emoji, and drop your module folder beside the others.
- Follow the conventions already used (self-contained HTML file, optional `js/` and `css/` folders, and a `PRD.md` if you want to track requirements or future ideas).
- For D&D content, consult `dndtools/README.md` for the manifest format, rarity weighting, and wishlist of future enhancements.

## Dependencies & Hosting Notes
- All tools are client-side only; there is no Node build, bundler, or backend dependency.
- Tailwind CSS is pulled in via CDN where needed. If you host the toolbox offline, fetch those assets ahead of time or swap to a locally served stylesheet.
- Because everything is static, the site can be deployed to any static host (GitHub Pages, Netlify, S3, itch.io, etc.) by uploading the folder as-is.

Happy tinkering!
