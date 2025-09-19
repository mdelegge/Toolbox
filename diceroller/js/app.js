// Dice Roller logic (multiple modifiers + dice chips)

const diceButtons = Array.from(document.querySelectorAll('.die-btn'));
const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const modifierGroup = document.getElementById('modifierGroup');
const rollBtn = document.getElementById('rollBtn');
const rerollBtn = document.getElementById('rerollBtn');
const clearResultsBtn = document.getElementById('clearResultsBtn');
const copyTotalBtn = document.getElementById('copyTotalBtn');
const resultsCard = document.getElementById('resultsCard');
const resultText = document.getElementById('resultText');
const detailText = document.getElementById('detailText');
const selectedDiceEl = document.getElementById('selectedDice');
const noDiceHint = document.getElementById('noDiceHint');

let selectedMode = 'normal'; // 'normal' | 'adv' | 'dis'
let lastRollContext = null; // { dice: [{sides}], base: [{sides, base:[r1,r2]}] }
let diceChips = []; // [{id: string, sides: number}]

// Theme dictionary (Tailwind classes). Swappable later.
const Theme = {
  total: 'text-green-300 font-bold',              // Total Dice Result: Light Green, Bold
  dieLabel: 'text-green-500',                     // Dice Type label: Green
  dieValue: 'text-green-300',                     // Individual Dice Result: Light Green
  keptNote: 'text-yellow-200 italic',             // Kept note: Light yellow, Italic
  modPos: 'text-blue-400',                        // Modifier Positive: Blue
  modNeg: 'text-red-300',                         // Modifier Negative: Light Red
  modTotalPos: 'text-sky-300',                    // Modifier Total (Positive): Light Blue
  modTotalNeg: 'text-red-500'                     // Modifier Total (Negative): Red
};

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function setActiveModeButton(mode) {
  modeButtons.forEach(btn => {
    const isActive = btn.dataset.mode === mode;
    btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    btn.classList.toggle('bg-emerald-400/20', isActive);
    btn.classList.toggle('font-semibold', isActive);
  });
}

function rollDie(die) {
  return Math.floor(Math.random() * die) + 1;
}

// Create base rolls (two per die) so we can switch modes without rerolling
function makeBaseRolls(diceList) {
  return diceList.map(d => ({ sides: d.sides, base: [rollDie(d.sides), rollDie(d.sides)] }));
}

// Compute output using stored base rolls; Normal uses only the first roll
function computeFromBase(baseList, mode, totalModifier) {
  const perDie = baseList.map(b => {
    const rolls = (mode === 'normal') ? [b.base[0]] : [b.base[0], b.base[1]];
    const kept = mode === 'adv' ? Math.max(...b.base) : mode === 'dis' ? Math.min(...b.base) : b.base[0];
    return { sides: b.sides, rolls, kept };
  });
  const sumKept = perDie.reduce((a, r) => a + r.kept, 0);
  const total = sumKept + totalModifier;
  return { perDie, sumKept, totalModifier, total };
}

function renderSelectedDice() {
  selectedDiceEl.innerHTML = '';
  diceChips.forEach(chip => {
    const btn = document.createElement('button');
    btn.className = 'chip px-2 py-1 text-sm rounded-lg border border-cyan-500/30 bg-cyan-400/10 hover:bg-cyan-400/20';
    btn.textContent = `d${chip.sides}`;
    btn.title = 'Remove from roll';
    btn.addEventListener('click', () => {
      diceChips = diceChips.filter(c => c.id !== chip.id);
      renderSelectedDice();
    });
    selectedDiceEl.appendChild(btn);
  });
  noDiceHint.classList.toggle('hidden', diceChips.length > 0);
}

function addDieChip(sides) {
  diceChips.push({ id: uid(), sides });
  renderSelectedDice();
}

function sumModifiers() {
  const values = Array.from(document.querySelectorAll('#modifierGroup .modifier-input'))
    .map(inp => parseInt(inp.value || '0', 10))
    .filter(v => Number.isFinite(v));
  return values.reduce((a, b) => a + b, 0);
}

function ensureLastHasAddButton() {
  const rows = Array.from(modifierGroup.querySelectorAll('.flex.items-center'));
  rows.forEach((row, idx) => {
    let btn = row.querySelector('.add-mod-btn');
    if (idx === rows.length - 1) {
      if (!btn) {
        btn = document.createElement('button');
        btn.className = 'add-mod-btn w-8 h-8 grid place-items-center rounded-full border border-sky-500/40 bg-sky-400/10 hover:bg-sky-400/20';
        btn.title = 'Add modifier';
        btn.textContent = '+';
        btn.addEventListener('click', onAddModifierClick);
        row.appendChild(btn);
      }
      btn.disabled = false;
      btn.classList.remove('opacity-50');
    } else {
      if (btn) {
        btn.disabled = true;
        btn.classList.add('opacity-50');
        btn.remove(); // ensure only the last row has the + button present in DOM
      }
    }
  });
}

function onAddModifierClick() {
  const row = document.createElement('div');
  row.className = 'flex items-center gap-2';
  const input = document.createElement('input');
  input.type = 'number';
  input.step = '1';
  input.value = '0';
  input.className = 'modifier-input w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2';
  row.appendChild(input);
  modifierGroup.appendChild(row);
  ensureLastHasAddButton();
}

// Wire up dice buttons: clicking adds a chip
diceButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const sides = Number(btn.dataset.die);
    addDieChip(sides);
  });
});

// Mode buttons (if we have a prior roll, recompute from stored base rolls without rerolling)
modeButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    selectedMode = btn.dataset.mode;
    setActiveModeButton(selectedMode);
    if (lastRollContext && lastRollContext.base) {
      const totalModifier = sumModifiers();
      const output = computeFromBase(lastRollContext.base, selectedMode, totalModifier);
      updateResults(output);
    }
  });
});

function updateResults(output) {
  resultsCard.classList.remove('hidden');
  // Total styling (add theme classes without removing existing)
  Theme.total.split(' ').forEach(c => resultText.classList.add(c));
  resultText.textContent = output.total;
  // Build per-die HTML segments
  const parts = output.perDie.map(r => {
    if (r.rolls.length === 1) {
      return `<span class="${Theme.dieLabel}">d${r.sides}:</span> <span class="${Theme.dieValue}">${r.rolls[0]}</span>`;
    }
    return `<span class="${Theme.dieLabel}">d${r.sides}:</span> <span class="${Theme.dieValue}">${r.rolls[0]}</span> & <span class="${Theme.dieValue}">${r.rolls[1]}</span> <span class="${Theme.keptNote}">(kept ${r.kept})</span>`;
  });
  // Build modifier string as individual parts with total e.g. "+ 2 -3 +10 (=9)"
  const mods = Array.from(document.querySelectorAll('#modifierGroup .modifier-input'))
    .map(inp => parseInt(inp.value || '0', 10))
    .filter(v => Number.isFinite(v) && v !== 0);
  const modPieces = mods.map(v => (
    v >= 0
      ? `<span class="${Theme.modPos}">+ ${v}</span>`
      : `<span class="${Theme.modNeg}">-${Math.abs(v)}</span>`
  ));
  const modTotal = mods.reduce((a, b) => a + b, 0);
  const totalClass = modTotal >= 0 ? Theme.modTotalPos : Theme.modTotalNeg;
  const modStr = mods.length ? `${modPieces.join(' ')} <span class="${totalClass}">(=${modTotal})</span>` : '';
  detailText.innerHTML = `${parts.join(' · ')}${modStr ? ' · ' + modStr : ''}`;
}

rollBtn.addEventListener('click', () => {
  // If no dice selected, add a default d20 chip for convenience
  if (diceChips.length === 0) addDieChip(20);
  const totalModifier = sumModifiers();
  const dice = diceChips.map(d => ({ sides: d.sides }));
  const base = makeBaseRolls(dice);
  const output = computeFromBase(base, selectedMode, totalModifier);
  lastRollContext = { dice, base };
  updateResults(output);
});

rerollBtn.addEventListener('click', () => {
  // Use existing dice list if available, otherwise from current chips
  const dice = (lastRollContext && lastRollContext.dice) ? lastRollContext.dice : diceChips.map(d => ({ sides: d.sides }));
  const base = makeBaseRolls(dice);
  const totalModifier = sumModifiers();
  const output = computeFromBase(base, selectedMode, totalModifier);
  lastRollContext = { dice, base };
  updateResults(output);
});

// Clear results
function clearResults() {
  resultText.textContent = '';
  detailText.textContent = '';
  resultsCard.classList.add('hidden');
  lastRollContext = null;
}

if (clearResultsBtn) {
  clearResultsBtn.addEventListener('click', clearResults);
}

// Copy helpers (mirrors dndtools behavior with fallback)
function copyTextToClipboard(text, buttonEl, successLabel = 'Copied!', defaultLabel = 'Copy Total') {
  if (!text) return;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text).then(() => {
      if (buttonEl) {
        const orig = buttonEl.textContent;
        buttonEl.textContent = successLabel;
        setTimeout(() => (buttonEl.textContent = defaultLabel || orig), 1200);
      }
    }).catch(() => fallbackCopy(text, buttonEl, successLabel, defaultLabel));
  } else {
    fallbackCopy(text, buttonEl, successLabel, defaultLabel);
  }
}

function fallbackCopy(text, buttonEl, successLabel, defaultLabel) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed';
  ta.style.left = '-9999px';
  document.body.appendChild(ta);
  ta.focus();
  ta.select();
  try {
    document.execCommand('copy');
    if (buttonEl) {
      const orig = buttonEl.textContent;
      buttonEl.textContent = successLabel;
      setTimeout(() => (buttonEl.textContent = defaultLabel || orig), 1200);
    }
  } finally {
    ta.remove();
  }
}

// Copy total to clipboard
if (copyTotalBtn) {
  copyTotalBtn.addEventListener('click', () => {
    const text = (resultText.textContent || '').trim();
    copyTextToClipboard(text, copyTotalBtn, 'Copied!', 'Copy Total');
  });
}

// Initial state: one d20 chip; mode Normal; ensure modifier '+' setup
addDieChip(20);
setActiveModeButton(selectedMode);
// Bind to initial + button if present and ensure only last row has one
const initialAddBtn = document.querySelector('#modifierGroup .add-mod-btn');
if (initialAddBtn) initialAddBtn.addEventListener('click', onAddModifierClick);
ensureLastHasAddButton();
