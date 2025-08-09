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