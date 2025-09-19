## Notes for adding new modules quickly

- Add a JSON file under `/modules/` with the same shape (`name`, `maxItems`, `items[]`).
- Put an entry in `manifest.json` with `name` and `file`.
- Optional fields per item:
  - `rarity`: `common | uncommon | rare | very_rare | unique`
  - `weight`: number to override rarity weighting
  - `dice`: string like `"1d12"`
- Names that include `(XdY)` will auto-roll quantities if `dice` is omitted.

## Nice-to-haves (future)

- Toggle to allow duplicates per roll
- Per-module custom RNG (e.g., pure bell-curve via 2dN for count)
- Export as JSON/CSV
- Seeded RNG for reproducible results
- Module type registry so you can plug in a dungeon generator alongside loot tables
