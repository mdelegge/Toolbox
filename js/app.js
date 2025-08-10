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

function createResultItem(item, isPinned = false) {
  const li = document.createElement('li');
  li.className = 'px-3 py-2 bg-slate-900/60 border border-slate-700 rounded-lg flex items-center gap-3';
  
  const line = formatResultLine(item);
  
  // SVG icons for pin states
  const unpinnedIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 17v5"/>
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 7.89 17H16.1a2 2 0 0 0 1.78-2.55l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1z"/>
  </svg>`;
  
  const pinnedIcon = `<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2">
    <path d="M12 17v5"/>
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 7.89 17H16.1a2 2 0 0 0 1.78-2.55l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1z"/>
  </svg>`;
  
  // Create pin button
  const pinBtn = document.createElement('button');
  pinBtn.className = `text-gray-400 hover:text-blue-400 transition-colors ${isPinned ? 'text-blue-400' : ''}`;
  pinBtn.innerHTML = isPinned ? pinnedIcon : unpinnedIcon;
  pinBtn.title = isPinned ? 'Unpin this item' : 'Pin this item';
  pinBtn.onclick = () => {
    const currentlyPinned = li.getAttribute('data-pinned') === 'true';
    const newPinnedState = !currentlyPinned;
    li.setAttribute('data-pinned', newPinnedState.toString());
    pinBtn.innerHTML = newPinnedState ? pinnedIcon : unpinnedIcon;
    pinBtn.title = newPinnedState ? 'Unpin this item' : 'Pin this item';
    pinBtn.className = `text-gray-400 hover:text-blue-400 transition-colors ${newPinnedState ? 'text-blue-400' : ''}`;
    
    // Update UI
    const event = new Event('pinStateChanged');
    document.dispatchEvent(event);
  };
  
  // Create text span for the result
  const textSpan = document.createElement('span');
  textSpan.textContent = line;
  textSpan.className = 'flex-1';
  
  // Create delete button
  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '×';
  deleteBtn.className = 'text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded px-2 py-1 text-lg font-bold transition-colors';
  deleteBtn.title = 'Remove this item';
  deleteBtn.onclick = () => {
    li.remove();
    const event = new Event('pinStateChanged');
    document.dispatchEvent(event);
  };
  
  // Store data attributes
  li.setAttribute('data-result-text', line);
  li.setAttribute('data-pinned', isPinned.toString());
  li.setAttribute('data-item-group', item.group || '');
  
  li.appendChild(pinBtn);
  li.appendChild(textSpan);
  li.appendChild(deleteBtn);
  
  return li;
}

function createClearButton() {
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clearAllBtn';
  clearBtn.className = 'ml-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-all duration-300';
  clearBtn.style.opacity = '0';
  clearBtn.style.pointerEvents = 'none';
  clearBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="inline mr-1">
      <polyline points="3,6 5,6 21,6"/>
      <path d="m19,6v14a2,2 0 0,1-2,2H7a2,2 0 0,1-2-2V6m3,0V4a2,2 0 0,1,2-2h4a2,2 0 0,1,2,2v2"/>
    </svg>
    Clear All
  `;
  clearBtn.title = 'Clear all items (including pinned)';
  clearBtn.onclick = () => {
    els.results.innerHTML = '';
    const event = new Event('pinStateChanged');
    document.dispatchEvent(event);
  };
  
  // Add next to the generate button
  els.generateBtn.parentNode.appendChild(clearBtn);
  
  return clearBtn;
}

// Listen for pin state changes to update UI
document.addEventListener('pinStateChanged', () => {
  const remainingItems = els.results.querySelectorAll('li').length;
  const pinnedCount = els.results.querySelectorAll('li[data-pinned="true"]').length;
  if (els.rollMeta) {
    els.rollMeta.textContent = `${remainingItems} item(s) (${pinnedCount} pinned)`;
  }
  
  // Update clear button visibility
  const clearBtn = document.getElementById('clearAllBtn');
  if (pinnedCount > 0) {
    if (!clearBtn) {
      createClearButton();
    } else {
      clearBtn.style.opacity = '1';
      clearBtn.style.pointerEvents = 'auto';
    }
  } else if (clearBtn) {
    clearBtn.style.opacity = '0';
    clearBtn.style.pointerEvents = 'none';
  }
});

function generate() {
  if (!currentModule) return;
  const items = currentModule.items || [];
  const count = computeCount(els.minItems.value, els.maxItems.value);
  
  // Get currently pinned items
  const pinnedItems = Array.from(els.results.querySelectorAll('li[data-pinned="true"]'));
  const pinnedCount = pinnedItems.length;
  
  // Calculate how many new items to generate
  const newItemsNeeded = Math.max(0, count - pinnedCount);
  
  // Check if any items in this module use the group attribute
  const hasGroupedItems = items.some(item => item.group);
  
  // Get groups from pinned items to avoid duplicates
  const pinnedGroups = new Set();
  pinnedItems.forEach(li => {
    const group = li.getAttribute('data-item-group');
    if (group) pinnedGroups.add(group);
  });
  
  // Filter items to avoid pinned groups if group filtering is enabled
  let availableItems = items;
  if (hasGroupedItems && pinnedGroups.size > 0) {
    availableItems = items.filter(item => !item.group || !pinnedGroups.has(item.group));
  }
  
  // Generate new items only if needed
  let newPicks = [];
  if (newItemsNeeded > 0 && availableItems.length > 0) {
    newPicks = hasGroupedItems 
      ? weightedSampleWithGroupFiltering(availableItems, newItemsNeeded)
      : weightedSampleWithoutReplacement(availableItems, newItemsNeeded);
  }

  // Remove unpinned items, keep pinned ones
  const unpinnedItems = els.results.querySelectorAll('li[data-pinned="false"], li:not([data-pinned])');
  unpinnedItems.forEach(li => li.remove());
  
  // Add new items
  for (const item of newPicks) {
    const li = createResultItem(item, false); // false = not pinned initially
    els.results.appendChild(li);
  }

  function updateRollMeta() {
    const remainingItems = els.results.querySelectorAll('li').length;
    const pinnedCount = els.results.querySelectorAll('li[data-pinned="true"]').length;
    els.rollMeta.textContent = `${remainingItems} item(s) (${pinnedCount} pinned) from ${count} target (${items.length} total items)`;
    updateClearButton();
  }

  function updateClearButton() {
    const pinnedCount = els.results.querySelectorAll('li[data-pinned="true"]').length;
    const clearBtn = document.getElementById('clearAllBtn');
    if (pinnedCount > 0) {
      if (!clearBtn) {
        createClearButton();
      } else {
        clearBtn.style.opacity = '1';
        clearBtn.style.pointerEvents = 'auto';
      }
    } else if (clearBtn) {
      clearBtn.style.opacity = '0';
      clearBtn.style.pointerEvents = 'none';
    }
  }

  updateRollMeta();
  els.resultsCard.classList.toggle('hidden', els.results.children.length === 0);

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