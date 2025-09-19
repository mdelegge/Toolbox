// app.js — Generated Maps UI
import { DungeonGenerator } from './bsp.js';
import { DonjonGenerator, CELL } from './donjon.js';

const els = {
  algorithm: document.getElementById('algorithm'),
  dungeonWidth: document.getElementById('dungeonWidth'),
  dungeonHeight: document.getElementById('dungeonHeight'),
  roomCount: document.getElementById('roomCount'),
  generateDungeonBtn: document.getElementById('generateDungeonBtn'),
  dungeonCard: document.getElementById('dungeonCard'),
  dungeonCanvas: document.getElementById('dungeonCanvas'),
  dungeonInfo: document.getElementById('dungeonInfo'),
  roomDescriptions: document.getElementById('roomDescriptions'),
  roomDescriptionsList: document.getElementById('roomDescriptionsList'),
  exportDungeonBtn: document.getElementById('exportDungeonBtn'),
  regenerateDungeonBtn: document.getElementById('regenerateDungeonBtn'),
  algoName: document.getElementById('algoName'),
  // Donjon options
  donjonOptions: document.getElementById('donjonOptions'),
  ddPreset: document.getElementById('ddPreset'),
  ddRemoveDeadEnds: document.getElementById('ddRemoveDeadEnds'),
  ddDeadEndPasses: document.getElementById('ddDeadEndPasses'),
  ddPruneMST: document.getElementById('ddPruneMST'),
  ddSpurLen: document.getElementById('ddSpurLen'),
};

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

let currentDungeon = null;

// Donjon presets
const DONJON_PRESETS = {
  natural: {
    removeDeadEnds: true,
    deadEndMaxPasses: 25,
    pruneMST: true,
    spurMaxLen: 2,
  },
  clean: {
    removeDeadEnds: true,
    deadEndMaxPasses: 70,
    pruneMST: true,
    spurMaxLen: 0,
  },
  organic: {
    removeDeadEnds: true,
    deadEndMaxPasses: 15,
    pruneMST: true,
    spurMaxLen: 3,
  },
  maze: {
    removeDeadEnds: false,
    deadEndMaxPasses: 1,
    pruneMST: false,
    spurMaxLen: 0,
  },
};

function applyDonjonPreset(name) {
  const p = DONJON_PRESETS[name];
  if (!p) return;
  if (els.ddRemoveDeadEnds) els.ddRemoveDeadEnds.checked = !!p.removeDeadEnds;
  if (els.ddDeadEndPasses) els.ddDeadEndPasses.value = String(p.deadEndMaxPasses);
  if (els.ddPruneMST) els.ddPruneMST.checked = !!p.pruneMST;
  if (els.ddSpurLen) els.ddSpurLen.value = String(p.spurMaxLen);
}

function generateDungeon() {
  const width = clamp(parseInt(els.dungeonWidth.value) || 80, 20, 1000);
  const height = clamp(parseInt(els.dungeonHeight.value) || 60, 20, 1000);
  const rooms = clamp(parseInt(els.roomCount.value) || 8, 3, 50);

  els.dungeonWidth.value = width;
  els.dungeonHeight.value = height;
  els.roomCount.value = rooms;

  const algo = els.algorithm.value;
  let generator;
  switch (algo) {
    case 'donjon':
      els.algoName && (els.algoName.textContent = 'Donjon');
      {
        const opts = {
          removeDeadEnds: !!els.ddRemoveDeadEnds?.checked,
          deadEndMaxPasses: Math.max(1, parseInt(els.ddDeadEndPasses?.value || '50', 10)),
          pruneMST: !!els.ddPruneMST?.checked,
          spurMaxLen: Math.max(0, parseInt(els.ddSpurLen?.value || '0', 10)),
        };
        generator = new DonjonGenerator(width, height, rooms, opts);
      }
      break;
    case 'bsp':
    default:
      els.algoName && (els.algoName.textContent = 'BSP Tree');
      generator = new DungeonGenerator(width, height, rooms);
      break;
  }

  currentDungeon = generator.generate();
  renderDungeon(currentDungeon);
  els.dungeonCard.classList.remove('hidden');
}

function renderDungeon(dungeon) {
  const canvas = els.dungeonCanvas;
  const ctx = canvas.getContext('2d');

  // Fill available width in the container (module column)
  const container = canvas.parentElement;
  const availWidth = Math.max(200, (container?.clientWidth || 800) - 8);
  const cellSize = Math.max(6, Math.floor(availWidth / dungeon.width));

  canvas.width = dungeon.width * cellSize;
  canvas.height = dungeon.height * cellSize;

  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const isBitmask = Array.isArray(dungeon.grid) && typeof dungeon.grid[0][0] === 'number' && (dungeon.doors || dungeon.stairs);

  // draw floor
  for (let y = 0; y < dungeon.height; y++) {
    for (let x = 0; x < dungeon.width; x++) {
      const v = dungeon.grid[y][x];
      const isFloor = isBitmask ? ((v & (CELL.ROOM | CELL.CORRIDOR | CELL.DOOR | CELL.STAIR_UP | CELL.STAIR_DN)) !== 0) : (v === 1);
      if (isFloor) {
        ctx.fillStyle = '#fef3c7';
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }

  // overlay doors
  if (isBitmask && dungeon.doors && dungeon.doors.length) {
    ctx.fillStyle = '#b45309'; // amber-700
    for (const d of dungeon.doors) {
      ctx.fillRect(d.x * cellSize, d.y * cellSize, cellSize, cellSize);
    }
  }

  // overlay stairs
  if (isBitmask && dungeon.stairs) {
    const drawDot = (pt, color) => {
      const cx = pt.x * cellSize + cellSize / 2;
      const cy = pt.y * cellSize + cellSize / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(2, cellSize * 0.25), 0, Math.PI * 2);
      ctx.fill();
    };
    if (dungeon.stairs.up) drawDot(dungeon.stairs.up, '#10b981');   // emerald-500
    if (dungeon.stairs.down) drawDot(dungeon.stairs.down, '#8b5cf6'); // violet-500
  }

  if (cellSize >= 3) {
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.3;

    for (let x = 0; x <= dungeon.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellSize, 0);
      ctx.lineTo(x * cellSize, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= dungeon.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellSize);
      ctx.lineTo(canvas.width, y * cellSize);
      ctx.stroke();
    }

    ctx.globalAlpha = 1.0;
  }

  // labels in rooms (draw after grid overlay so they stay visible)
  if (isBitmask && dungeon.labels && cellSize >= 6) {
    ctx.font = `bold ${Math.floor(cellSize * 0.8)}px ui-sans-serif, system-ui, -apple-system`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const strokeW = Math.max(1, Math.floor(cellSize * 0.12));
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.fillStyle = '#0f172a';
    for (const lab of dungeon.labels) {
      const tx = lab.x * cellSize + cellSize / 2;
      const ty = lab.y * cellSize + cellSize / 2;
      ctx.lineWidth = strokeW;
      ctx.strokeText(lab.text, tx, ty);
      ctx.fillText(lab.text, tx, ty);
    }
  }

  const extras = dungeon.doors ? `, ${dungeon.doors.length} doors` : '';
  els.dungeonInfo.textContent = `${dungeon.width}×${dungeon.height} grid, ${dungeon.rooms.length} rooms, ${dungeon.corridors.length} corridors${extras}`;

  // render room descriptions (if provided)
  if (els.roomDescriptions && els.roomDescriptionsList) {
    const descs = dungeon.roomDescriptions || {};
    const labels = Object.keys(descs).sort((a, b) => parseInt(a) - parseInt(b));
    if (labels.length) {
      els.roomDescriptions.classList.remove('hidden');
      els.roomDescriptionsList.innerHTML = '';
      for (const lab of labels) {
        const li = document.createElement('li');
        li.textContent = `${lab}. ${descs[lab]}`;
        els.roomDescriptionsList.appendChild(li);
      }
    } else {
      els.roomDescriptions.classList.add('hidden');
      els.roomDescriptionsList.innerHTML = '';
    }
  }
}

function exportDungeonImage() {
  if (!currentDungeon) return;
  const canvas = els.dungeonCanvas;
  canvas.toBlob(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `map_${currentDungeon.width}x${currentDungeon.height}_${currentDungeon.rooms.length}rooms.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    const originalText = els.exportDungeonBtn.textContent;
    els.exportDungeonBtn.textContent = 'Exported!';
    setTimeout(() => els.exportDungeonBtn.textContent = originalText, 1500);
  });
}

els.generateDungeonBtn.addEventListener('click', generateDungeon);
els.regenerateDungeonBtn.addEventListener('click', generateDungeon);
els.exportDungeonBtn.addEventListener('click', exportDungeonImage);

// Toggle Donjon options visibility based on algorithm selection
function updateOptionsVisibility() {
  const isDonjon = els.algorithm.value === 'donjon';
  if (els.donjonOptions) {
    els.donjonOptions.classList.toggle('hidden', !isDonjon);
  }
}

els.algorithm.addEventListener('change', () => {
  updateOptionsVisibility();
});

// initialize visibility on load
updateOptionsVisibility();

// initialize Donjon preset interactions
if (els.ddPreset) {
  els.ddPreset.addEventListener('change', () => applyDonjonPreset(els.ddPreset.value));
  // Apply default preset on load
  applyDonjonPreset(els.ddPreset.value || 'natural');
}
