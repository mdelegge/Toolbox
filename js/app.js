// app.js — UI wiring for MVP
import { weightedSampleWithoutReplacement, weightedSampleWithGroupFiltering, formatResultLine, clamp, DungeonGenerator } from './generator.js';
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
  infoMax: document.getElementById('infoMax'),
  // Dungeon generator elements
  dungeonWidth: document.getElementById('dungeonWidth'),
  dungeonHeight: document.getElementById('dungeonHeight'),
  roomCount: document.getElementById('roomCount'),
  generateDungeonBtn: document.getElementById('generateDungeonBtn'),
  dungeonCard: document.getElementById('dungeonCard'),
  dungeonCanvas: document.getElementById('dungeonCanvas'),
  dungeonInfo: document.getElementById('dungeonInfo'),
  exportDungeonBtn: document.getElementById('exportDungeonBtn'),
  regenerateDungeonBtn: document.getElementById('regenerateDungeonBtn')
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
  els.minItems.value = 1;
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
  
  // Check if any items in this module use the group attribute
  const hasGroupedItems = items.some(item => item.group);
  
  // Use group filtering if any items have groups, otherwise use standard sampling
  const picks = hasGroupedItems 
    ? weightedSampleWithGroupFiltering(items, count)
    : weightedSampleWithoutReplacement(items, count);

  els.results.innerHTML = '';
  for (const item of picks) {
    const li = document.createElement('li');
    li.className = 'px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg flex justify-between items-center';
    
    const line = formatResultLine(item);
    
    // Create text span for the result
    const textSpan = document.createElement('span');
    textSpan.textContent = line;
    textSpan.className = 'flex-1';
    
    // Create delete button
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '×';
    deleteBtn.className = 'ml-3 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded px-2 py-1 text-lg font-bold transition-colors';
    deleteBtn.title = 'Remove this item';
    deleteBtn.onclick = () => {
      li.remove();
      updateRollMeta();
    };
    
    // Store the original text for copy functionality
    li.setAttribute('data-result-text', line);
    li.setAttribute('data-deleted', 'false');
    
    li.appendChild(textSpan);
    li.appendChild(deleteBtn);
    els.results.appendChild(li);
  }

  function updateRollMeta() {
    const remainingItems = els.results.querySelectorAll('li').length;
    els.rollMeta.textContent = `${remainingItems} item(s) remaining from ${count} rolled (${items.length} total items)`;
  }

  updateRollMeta();
  els.resultsCard.classList.toggle('hidden', picks.length === 0);

  els.exportBtn.onclick = () => {
    // Get only non-deleted items
    const remainingItems = Array.from(els.results.querySelectorAll('li'));
    const lines = remainingItems.map(li => li.getAttribute('data-result-text'));
    
    if (lines.length === 0) {
      els.exportBtn.textContent = 'No items to copy';
      setTimeout(() => (els.exportBtn.textContent = 'Copy Results'), 1200);
      return;
    }
    
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

function generateDungeon() {
  const width = clamp(parseInt(els.dungeonWidth.value) || 80, 20, 1000);
  const height = clamp(parseInt(els.dungeonHeight.value) || 60, 20, 1000);
  const rooms = clamp(parseInt(els.roomCount.value) || 8, 3, 50);

  // Update input values to clamped values
  els.dungeonWidth.value = width;
  els.dungeonHeight.value = height;
  els.roomCount.value = rooms;

  const generator = new DungeonGenerator(width, height, rooms);
  currentDungeon = generator.generate();
  
  renderDungeon(currentDungeon);
  els.dungeonCard.classList.remove('hidden');
}

function renderDungeon(dungeon) {
  const canvas = els.dungeonCanvas;
  const ctx = canvas.getContext('2d');
  
  // Calculate cell size based on canvas constraints
  const maxCanvasWidth = 800;
  const maxCanvasHeight = 600;
  const cellSize = Math.max(1, Math.min(
    Math.floor(maxCanvasWidth / dungeon.width),
    Math.floor(maxCanvasHeight / dungeon.height),
    8
  ));
  
  canvas.width = dungeon.width * cellSize;
  canvas.height = dungeon.height * cellSize;
  
  // Clear canvas
  ctx.fillStyle = '#1e293b'; // slate-800 (wall color)
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw dungeon
  ctx.fillStyle = '#fef3c7'; // amber-100 (floor color)
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      if (dungeon.grid[y][x] === 1) { // Floor
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
  
  // Draw subtle grid lines (only if cell size is large enough)
  if (cellSize >= 3) {
    ctx.strokeStyle = '#475569'; // slate-600 (subtle grid color)
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3; // Make grid lines subtle
    
    // Draw vertical lines
    for (let x = 0; x <= dungeon.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }
    
    // Draw horizontal lines
    for (let y = 0; y <= dungeon.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }
    
    ctx.globalAlpha = 1.0; // Reset alpha
  }
  
  // Update info
  els.dungeonInfo.textContent = `${dungeon.width}×${dungeon.height} grid, ${dungeon.rooms.length} rooms, ${dungeon.corridors.length} corridors`;
}

function exportDungeonImage() {
  if (!currentDungeon) return;
  
  const canvas = els.dungeonCanvas;
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dungeon_${currentDungeon.width}x${currentDungeon.height}_${currentDungeon.rooms.length}rooms.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    
    // Update button text temporarily
    const originalText = els.exportDungeonBtn.textContent;
    els.exportDungeonBtn.textContent = 'Exported!';
    setTimeout(() => els.exportDungeonBtn.textContent = originalText, 1500);
  });
}

async function main() {
  manifest = await loadManifest();
  renderModuleOptions();
  if (manifest.length) {
    els.moduleSelect.value = manifest[0].file;
    await onModuleChange();
  }
}

// Dungeon Generator Variables
let currentDungeon = null;

// Event Listeners
els.moduleSelect.addEventListener('change', onModuleChange);
els.minItems.addEventListener('input', syncMinMax);
els.maxItems.addEventListener('input', syncMinMax);
els.generateBtn.addEventListener('click', generate);
els.exportBtn.addEventListener('click', () => {
  const text = els.results.textContent;
  if (!text) return;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      els.exportBtn.textContent = 'Copied!';
      setTimeout(() => els.exportBtn.textContent = 'Copy Results', 1500);
    });
  } else {
    // Fallback download
    const blob = new Blob([text], { type: 'text/plain' });
    if (navigator.msSaveBlob) {
      navigator.msSaveBlob(blob, 'loot.txt');
    } else {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'loot.txt';
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    }
  }
});

// Dungeon Generator Event Listeners
els.generateDungeonBtn.addEventListener('click', generateDungeon);
els.regenerateDungeonBtn.addEventListener('click', generateDungeon);
els.exportDungeonBtn.addEventListener('click', exportDungeonImage);

main().catch(err => {
  console.error(err);
  alert('Failed to initialize. See console for details.');
});