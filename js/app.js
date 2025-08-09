// app.js — UI wiring for MVP
import { weightedSampleWithoutReplacement, formatResultLine, clamp } from './generator.js';
import { loadManifest, loadModuleByFile } from './modules.js';

const els = {
  moduleSelect: document.getElementById('moduleSelect'),
  minItems: document.getElementById('minItems'),
  maxItems: document.getElementById('maxItems'),
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
  // Reset min/max defaults per module
  els.minItems.value = 0;
  els.maxItems.value = currentModule.maxItems ?? 5;
  syncMinMax();
  els.resultsCard.classList.add('hidden');
}

function syncMinMax() {
  // Parse and clamp raw values
  let min = clamp(parseInt(els.minItems.value, 10) || 0, 0, 999);
  let max = clamp(parseInt(els.maxItems.value, 10) || 0, 0, 999);
  // Ensure attributes enforce the current constraints
  els.minItems.setAttribute('min', '0');
  els.maxItems.setAttribute('min', '0');
  // Keep min <= max but do not auto-swap here; clamp values to the range instead
  if (min > max) min = max;
  // Update input attributes so spinners behave intuitively
  els.minItems.setAttribute('max', String(max));
  els.maxItems.setAttribute('min', String(min));
  // Write back clamped values to inputs
  els.minItems.value = String(min);
  els.maxItems.value = String(max);
}

function computeCount(minVal, maxVal) {
  let min = clamp(parseInt(minVal, 10) || 0, 0, 999);
  let max = clamp(parseInt(maxVal, 10) || 0, 0, 999);
  if (min > max) [min, max] = [max, min];
  // Random integer in [min..max]
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generate() {
  if (!currentModule) return;
  const items = currentModule.items || [];
  const count = computeCount(els.minItems.value, els.maxItems.value);
  const picks = weightedSampleWithoutReplacement(items, count);

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

  els.rollMeta.textContent = `${count} item(s) rolled from ${items.length}`;
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
els.minItems.addEventListener('input', syncMinMax);
els.maxItems.addEventListener('input', syncMinMax);
els.generateBtn.addEventListener('click', generate);

main().catch(err => {
  console.error(err);
  alert('Failed to initialize. See console for details.');
});