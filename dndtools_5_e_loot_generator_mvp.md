# DNDTools — 5E Loot Generator (MVP)

This is a zero-build, drop-in MVP using plain JavaScript + Tailwind CDN. Copy the files into a folder and open `index.html`.

> **Structure**
>
> ```
> / (project root)
> ├── index.html
> ├── /js
> │   ├── app.js
> │   ├── generator.js
> │   └── modules.js
> └── /modules
>     ├── manifest.json
>     ├── jobs_board.json
>     └── trolls_cave.json
> ```

---

## index.html

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>DNDTools — Loot & Tables</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <meta name="color-scheme" content="dark light" />
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen">
  <header class="border-b border-slate-800">
    <div class="max-w-5xl mx-auto px-4 py-6 flex items-center justify-between">
      <h1 class="text-2xl font-bold tracking-tight">DNDTools: 5E Loot & Tables</h1>
      <a href="#" id="exportBtn" class="text-sm px-3 py-2 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700">Copy Results</a>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-4 py-6 space-y-6">
    <section class="grid md:grid-cols-3 gap-4">
      <div class="md:col-span-2">
        <div class="p-4 bg-slate-800/60 rounded-2xl border border-slate-700">
          <div class="flex flex-col md:flex-row gap-3 md:items-end">
            <div class="flex-1">
              <label for="moduleSelect" class="block text-sm mb-1">Module</label>
              <select id="moduleSelect" class="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2"></select>
            </div>
            <div>
              <label for="maxItems" class="block text-sm mb-1">Max items</label>
              <input id="maxItems" type="number" min="0" value="5" class="w-28 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2" />
            </div>
            <div class="flex items-center gap-2">
              <input id="randomCount" type="checkbox" class="h-4 w-4" checked />
              <label for="randomCount" class="text-sm">Random count (0..Max)</label>
            </div>
            <button id="generateBtn" class="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium">Generate</button>
          </div>
        </div>

        <div id="resultsCard" class="mt-4 p-4 bg-slate-800/60 rounded-2xl border border-slate-700 hidden">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-lg font-semibold">Results</h2>
            <span id="rollMeta" class="text-xs text-slate-400"></span>
          </div>
          <ul id="results" class="space-y-2"></ul>
        </div>
      </div>

      <aside class="md:col-span-1 p-4 bg-slate-800/40 rounded-2xl border border-slate-700">
        <h3 class="font-semibold mb-2">Module Info</h3>
        <dl class="text-sm space-y-1">
          <div class="flex justify-between"><dt>Name</dt><dd id="infoName" class="text-slate-300"></dd></div>
          <div class="flex justify-between"><dt>Items</dt><dd id="infoCount" class="text-slate-300"></dd></div>
          <div class="flex justify-between"><dt>Default Max</dt><dd id="infoMax" class="text-slate-300"></dd></div>
        </dl>
        <div class="mt-4">
          <h4 class="font-semibold mb-1">Rarity Weights</h4>
          <p class="text-xs text-slate-400">common 100 · uncommon 40 · rare 15 · very_rare 5 · unique 1 (overridden by `weight`)</p>
        </div>
      </aside>
    </section>

    <section class="p-4 bg-slate-800/30 rounded-2xl border border-slate-800">
      <details>
        <summary class="cursor-pointer font-medium">How it works</summary>
        <ul class="list-disc pl-5 mt-2 text-sm text-slate-300 space-y-1">
          <li>Modules are JSON files listed in <code>/modules/manifest.json</code>.</li>
          <li>Each item can have <code>rarity</code>, <code>weight</code>, and <code>dice</code> (e.g. <code>"1d12"</code>).</li>
          <li>If <code>dice</code> is missing, a pattern like <code>"Copper pieces (1D20)"</code> in the name will be parsed.</li>
          <li>Generation draws without replacement by weighted rarity (you won’t get the same entry twice per roll).</li>
        </ul>
      </details>
    </section>
  </main>

  <script src="js/generator.js"></script>
  <script src="js/modules.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

---

## /js/generator.js

```js
// generator.js — shared RNG + helpers

const DEFAULT_RARITY_WEIGHTS = {
  common: 100,
  uncommon: 40,
  rare: 15,
  very_rare: 5,
  unique: 1
};

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function parseDiceInName(name) {
  // Matches "(1D12)" or "(2d6)" variants
  const m = name.match(/\((\d+)\s*[dD]\s*(\d+)\)/);
  if (!m) return null;
  return { count: parseInt(m[1], 10), sides: parseInt(m[2], 10) };
}

function parseDice(diceStr) {
  if (!diceStr) return null;
  const m = diceStr.match(/^(\d+)\s*[dD]\s*(\d+)$/);
  if (!m) return null;
  return { count: parseInt(m[1], 10), sides: parseInt(m[2], 10) };
}

function rollDiceSpec(spec) {
  if (!spec) return null;
  let total = 0;
  for (let i = 0; i < spec.count; i++) {
    total += Math.floor(Math.random() * spec.sides) + 1;
  }
  return total;
}

function itemWeight(item) {
  if (typeof item.weight === 'number') return item.weight;
  const r = (item.rarity || 'common').toLowerCase();
  return DEFAULT_RARITY_WEIGHTS[r] ?? DEFAULT_RARITY_WEIGHTS.common;
}

function weightedSampleWithoutReplacement(items, k) {
  const pool = items.slice();
  const picks = [];
  for (let n = 0; n < k && pool.length > 0; n++) {
    const total = pool.reduce((s, it) => s + itemWeight(it), 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < pool.length; idx++) {
      r -= itemWeight(pool[idx]);
      if (r <= 0) break;
    }
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }
  return picks;
}

function deriveQuantity(item) {
  // Use explicit dice if present, else try to parse from name
  const spec = parseDice(item.dice) || parseDiceInName(item.name);
  return spec ? rollDiceSpec(spec) : null;
}

function formatResultLine(item) {
  const qty = deriveQuantity(item);
  if (qty != null) {
    // Try basic pluralization when the base name looks pluralizable (e.g., "Dagger(s)")
    const name = item.name.replace(/\s*\((?:\d+\s*[dD]\s*\d+).*\)\s*$/, '').trim();
    return `${name}${qty > 1 ? ' x' + qty : ' x' + qty}`; // always show the number rolled
  }
  return item.name;
}

export {
  DEFAULT_RARITY_WEIGHTS,
  parseDiceInName,
  parseDice,
  rollDiceSpec,
  itemWeight,
  weightedSampleWithoutReplacement,
  deriveQuantity,
  formatResultLine,
  clamp
};
```

---

## /js/modules.js

```js
// modules.js — loading module metadata & data

async function fetchJSON(path) {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to fetch ${path}: ${res.status}`);
  return res.json();
}

async function loadManifest() {
  return fetchJSON('modules/manifest.json');
}

async function loadModuleByFile(file) {
  return fetchJSON(`modules/${file}`);
}

export { fetchJSON, loadManifest, loadModuleByFile };
```

---

## /js/app.js

```js
// app.js — UI wiring for MVP
import { weightedSampleWithoutReplacement, formatResultLine, clamp } from './generator.js';
import { loadManifest, loadModuleByFile } from './modules.js';

const els = {
  moduleSelect: document.getElementById('moduleSelect'),
  maxItems: document.getElementById('maxItems'),
  randomCount: document.getElementById('randomCount'),
  generateBtn: document.getElementById('generateBtn'),
  resultsCard: document.getElementById('resultsCard'),
  results: document.getElementById('results'),
  rollMeta: document.getElementById('rollMeta'),
  exportBtn: document.getElementById('exportBtn'),
  infoName: document.getElementById('infoName'),
  infoCount: document.getElementById('infoCount'),
  infoMax: document.getElementById('infoMax')
};

let manifest = [];
let currentModule = null;

function renderModuleInfo(mod) {
  els.infoName.textContent = mod.name || '(unnamed module)';
  els.infoCount.textContent = mod.items?.length ?? 0;
  els.infoMax.textContent = mod.maxItems ?? 5;
}

function renderModuleOptions() {
  els.moduleSelect.innerHTML = '';
  for (const entry of manifest) {
    const opt = document.createElement('option');
    opt.value = entry.file;
    opt.textContent = entry.name;
    els.moduleSelect.appendChild(opt);
  }
}

async function onModuleChange() {
  const file = els.moduleSelect.value;
  currentModule = await loadModuleByFile(file);
  renderModuleInfo(currentModule);
  els.maxItems.value = currentModule.maxItems ?? 5;
  els.resultsCard.classList.add('hidden');
}

function computeCount(maxVal, randomize) {
  const m = clamp(parseInt(maxVal, 10) || 0, 0, 999);
  if (!randomize) return m;
  // Random in [0..m]
  return Math.floor(Math.random() * (m + 1));
}

function generate() {
  if (!currentModule) return;
  const items = currentModule.items || [];
  const max = computeCount(els.maxItems.value, els.randomCount.checked);
  const picks = weightedSampleWithoutReplacement(items, max);

  els.results.innerHTML = '';
  const lines = [];
  for (const item of picks) {
    const li = document.createElement('li');
    li.className = 'px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg';
    const line = formatResultLine(item);
    li.textContent = line;
    els.results.appendChild(li);
    lines.push(line);
  }

  els.rollMeta.textContent = `${max} item(s) rolled from ${items.length}`;
  els.resultsCard.classList.toggle('hidden', picks.length === 0);

  els.exportBtn.onclick = () => {
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      els.exportBtn.textContent = 'Copied!';
      setTimeout(() => (els.exportBtn.textContent = 'Copy Results'), 1200);
    }).catch(() => {
      // Fallback download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'loot.txt';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    });
  };
}

async function main() {
  manifest = await loadManifest();
  renderModuleOptions();
  if (manifest.length) {
    els.moduleSelect.value = manifest[0].file;
    await onModuleChange();
  }
}

els.moduleSelect.addEventListener('change', onModuleChange);
els.generateBtn.addEventListener('click', generate);

main().catch(err => {
  console.error(err);
  alert('Failed to initialize. See console for details.');
});
```

---

## /modules/manifest.json

```json
[
  { "name": "Jobs Board (Town Quests)", "file": "jobs_board.json" },
  { "name": "Troll's Cave (Loot)", "file": "trolls_cave.json" }
]
```

---

## /modules/jobs\_board.json

```json
{
  "name": "Jobs Board (Town Quests)",
  "maxItems": 3,
  "items": [
    { "name": "Find a nearby bandit hideout", "rarity": "common" },
    { "name": "Help a farmer fight off a gang trying to steal his land", "rarity": "common" },
    { "name": "Help a merchant who is being hassled by gangsters", "rarity": "common" },
    { "name": "Help teach a teenager to fight", "rarity": "common" },
    { "name": "Check out a nearby cave", "rarity": "common" },
    { "name": "Help a troubled spirit find peace", "rarity": "uncommon" },
    { "name": "Locate a lost gemstone for a merchant", "rarity": "uncommon" },
    { "name": "Help an innkeeper get a beehive out of the stables", "rarity": "common" },
    { "name": "Investigate a murder for the town council", "rarity": "rare" },
    { "name": "Investigate the burning of a farmhouse", "rarity": "uncommon" },
    { "name": "Find a rare herb for an herbalist", "rarity": "uncommon" },
    { "name": "Help peasants do a controlled field burning", "rarity": "common" },
    { "name": "Clean a temple for the priest", "rarity": "common" },
    { "name": "Impersonate a noble at a party", "rarity": "rare" },
    { "name": "Transport a dragon egg to an elven queen", "rarity": "very_rare" },
    { "name": "Help out at the local quarry", "rarity": "common" },
    { "name": "Help dig a grave", "rarity": "common" },
    { "name": "Raid a troll’s cave", "rarity": "uncommon" },
    { "name": "Investigate a sinkhole", "rarity": "uncommon" },
    { "name": "Guard a ship overnight", "rarity": "common" },
    { "name": "Help repair a dam", "rarity": "uncommon" },
    { "name": "Capture a wanted outlaw", "rarity": "uncommon" },
    { "name": "Cut timber for a businessman", "rarity": "common" },
    { "name": "Help an old lady across the street", "rarity": "common" },
    { "name": "Free a wrongly condemned prisoner", "rarity": "rare" },
    { "name": "Help two teenagers elope", "rarity": "uncommon" },
    { "name": "Help fix a widow’s roof", "rarity": "common" },
    { "name": "Locate a missing merchant", "rarity": "uncommon" },
    { "name": "Break up a gang of bootleggers", "rarity": "uncommon" },
    { "name": "Represent a noble in an archery contest", "rarity": "uncommon" },
    { "name": "Help tend an orchard", "rarity": "common" },
    { "name": "Return a ring to a noble family", "rarity": "uncommon" },
    { "name": "Go to the underworld and bring someone back from the dead", "rarity": "unique" },
    { "name": "Pick flowers for a wedding", "rarity": "common" },
    { "name": "Infiltrate the thieves’ guild and pass information to the mayor", "rarity": "rare" },
    { "name": "Rescue prisoners being held in a goblin lair", "rarity": "uncommon" },
    { "name": "Load cargo on a ship for a sea captain", "rarity": "common" },
    { "name": "Round up escaped horses", "rarity": "common" },
    { "name": "Help raise a barn", "rarity": "common" },
    { "name": "Take care of horses at the stables", "rarity": "common" },
    { "name": "Help a noble find a lost key", "rarity": "common" },
    { "name": "Deliver a letter to the mayor of another town", "rarity": "common" },
    { "name": "Clear land for crops for a farmer", "rarity": "common" },
    { "name": "Help the king’s mare give birth", "rarity": "rare" },
    { "name": "Deliver medicine to an ill person", "rarity": "common" },
    { "name": "Deliver an ancient book to a wizard", "rarity": "uncommon" },
    { "name": "Transport goods for a merchant to another town", "rarity": "common" },
    { "name": "Get a cat out of a tree", "rarity": "common" },
    { "name": "Track down a pickpocket", "rarity": "common" },
    { "name": "Find a little girl’s doll", "rarity": "common" }
  ]
}
```

---

## /modules/trolls\_cave.json

```json
{
  "name": "Troll's Cave (Loot)",
  "maxItems": 6,
  "items": [
    { "name": "Copper pieces (1D20)", "rarity": "common" },
    { "name": "Copper button", "rarity": "common" },
    { "name": "Silver goblet", "rarity": "uncommon" },
    { "name": "Gold coin from a foreign land", "rarity": "uncommon" },
    { "name": "Brass buttons (1D20)", "rarity": "common" },
    { "name": "Silver pieces (1D8)", "rarity": "common" },
    { "name": "Gold pieces (1D10)", "rarity": "uncommon" },
    { "name": "Gold pieces (1D100)", "rarity": "rare" },
    { "name": "Brass buttons (1D10)", "rarity": "common" },
    { "name": "Short swords (1D6)", "rarity": "uncommon" },
    { "name": "Daggers (1D10)", "rarity": "uncommon" },
    { "name": "Iron shield", "rarity": "uncommon" },
    { "name": "Copper kettle", "rarity": "common" },
    { "name": "Lock of red hair tied with a blue silk ribbon", "rarity": "rare" },
    { "name": "Clay bowl", "rarity": "common" },
    { "name": "Bone powder (1lbs)", "rarity": "uncommon" },
    { "name": "Ram horns", "rarity": "uncommon" },
    { "name": "Silver button", "rarity": "uncommon" },
    { "name": "Gold pieces (1D4)", "rarity": "uncommon" },
    { "name": "Daggers (1D4)", "rarity": "uncommon" },
    { "name": "Copper ring", "rarity": "uncommon" },
    { "name": "Cloak (magical)", "rarity": "rare" },
    { "name": "Short swords (1D4)", "rarity": "uncommon" },
    { "name": "Blacksmiths hammer", "rarity": "uncommon" },
    { "name": "Copper pieces (1D4)", "rarity": "common" },
    { "name": "Iron cauldron", "rarity": "uncommon" },
    { "name": "A small locked wooden box", "rarity": "uncommon" },
    { "name": "Elven brooch", "rarity": "rare" },
    { "name": "Silver pieces (1D12)", "rarity": "uncommon" },
    { "name": "Gold ring", "rarity": "rare" },
    { "name": "Gold button", "rarity": "uncommon" },
    { "name": "Long swords (1D6)", "rarity": "uncommon" },
    { "name": "Silver pieces (1D10)", "rarity": "uncommon" },
    { "name": "Long sword", "rarity": "uncommon" },
    { "name": "Silver ring", "rarity": "uncommon" },
    { "name": "Pile of sheep bones", "rarity": "common" },
    { "name": "White jerkin", "rarity": "uncommon" },
    { "name": "Copper pieces (1D8)", "rarity": "common" },
    { "name": "A Halfling roasting over an open fire", "rarity": "unique" },
    { "name": "Locked chest", "rarity": "rare" },
    { "name": "Flint and tinder", "rarity": "common" },
    { "name": "Iron ring", "rarity": "uncommon" },
    { "name": "Wooden stool (troll size)", "rarity": "uncommon" },
    { "name": "Tanned goat hide", "rarity": "uncommon" },
    { "name": "Gold pieces (1D12)", "rarity": "uncommon" },
    { "name": "Tanned ox hide", "rarity": "uncommon" },
    { "name": "Cooking pots (1D8)", "rarity": "common" },
    { "name": "Leather armor", "rarity": "uncommon" },
    { "name": "Copper pieces (1D10)", "rarity": "common" },
    { "name": "Deer antlers", "rarity": "uncommon" },
    { "name": "Brass buttons (1D8)", "rarity": "common" },
    { "name": "Horse tail fly swatter", "rarity": "uncommon" },
    { "name": "Dragon tooth", "rarity": "rare" },
    { "name": "Gold pieces (1D6)", "rarity": "uncommon" },
    { "name": "Fine porcelain tea set (one cup is chipped)", "rarity": "rare" },
    { "name": "Huge rusty key", "rarity": "uncommon" },
    { "name": "Green cloak", "rarity": "uncommon" },
    { "name": "Gold pieces (1D8)", "rarity": "uncommon" },
    { "name": "Gold pieces (1D20)", "rarity": "rare" },
    { "name": "Skinned goats hanging from hooks (1D4)", "rarity": "uncommon" },
    { "name": "Cooking pans (1D10)", "rarity": "common" },
    { "name": "Pile of human bones", "rarity": "uncommon" },
    { "name": "Rope (50’)", "rarity": "common" },
    { "name": "Brass buttons (1D12)", "rarity": "common" },
    { "name": "Daggers (1D8)", "rarity": "uncommon" },
    { "name": "Pile of cow bones", "rarity": "common" },
    { "name": "Pitchfork", "rarity": "uncommon" },
    { "name": "Warhammer", "rarity": "rare" },
    { "name": "Dwarven brooch", "rarity": "rare" },
    { "name": "Bear pelt", "rarity": "uncommon" },
    { "name": "Gold locket with portrait of human woman", "rarity": "rare" },
    { "name": "Bloody rags", "rarity": "common" },
    { "name": "Brass buttons (1D6)", "rarity": "common" },
    { "name": "Blue cloak", "rarity": "uncommon" },
    { "name": "Daggers (1D6)", "rarity": "uncommon" },
    { "name": "Silver pieces (1D20)", "rarity": "uncommon" },
    { "name": "Ring (magical)", "rarity": "very_rare" },
    { "name": "Short sword", "rarity": "uncommon" },
    { "name": "Bull skull", "rarity": "uncommon" },
    { "name": "Copper pieces (1D12)", "rarity": "common" },
    { "name": "Silver pieces (1D6)", "rarity": "common" },
    { "name": "Silver pieces (1D4)", "rarity": "common" },
    { "name": "Silver pieces (1D100)", "rarity": "rare" },
    { "name": "Tin buttons (1D20)", "rarity": "common" },
    { "name": "Red cloak", "rarity": "uncommon" },
    { "name": "Skinned goats hanging from hooks (1D8)", "rarity": "uncommon" },
    { "name": "Tanned deer hide", "rarity": "uncommon" },
    { "name": "Pile of ox bones", "rarity": "common" },
    { "name": "Dagger", "rarity": "uncommon" },
    { "name": "Long swords (1D4)", "rarity": "uncommon" },
    { "name": "Brown cloak", "rarity": "uncommon" },
    { "name": "Mortar and pestle", "rarity": "uncommon" },
    { "name": "Copper pieces (1D6)", "rarity": "common" },
    { "name": "Short swords (1D8)", "rarity": "uncommon" },
    { "name": "Blanket", "rarity": "common" },
    { "name": "Buckler", "rarity": "uncommon" },
    { "name": "Meteorite (enough iron for one long sword blade)", "rarity": "very_rare" },
    { "name": "Ancient elven sword (magical)", "rarity": "very_rare" },
    { "name": "Brass buttons (1D4)", "rarity": "common" },
    { "name": "Copper pieces (1D100)", "rarity": "rare" }
  ]
}
```

---

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

