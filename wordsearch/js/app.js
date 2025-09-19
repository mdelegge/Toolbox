'use strict';

const DEFAULT_WORDS = [
  'DRAGON',
  'SWORD',
  'MAGIC',
  'DUNGEON',
  'TREASURE',
  'GUILD',
  'RANGER',
  'WIZARD',
  'CLERIC',
  'BARD',
  'QUEST',
  'MONSTER',
  'CASTLE',
  'CAVERN',
  'TRAP'
];

const DIRECTIONS = [
  { dr: 0, dc: 1 },
  { dr: 0, dc: -1 },
  { dr: 1, dc: 0 },
  { dr: -1, dc: 0 },
  { dr: 1, dc: 1 },
  { dr: -1, dc: -1 },
  { dr: 1, dc: -1 },
  { dr: -1, dc: 1 }
];

const boardEl = document.getElementById('board');
const wordListEl = document.getElementById('wordList');
const foundCountEl = document.getElementById('foundCount');
const totalCountEl = document.getElementById('totalCount');
const messageEl = document.getElementById('message');
const wordInputEl = document.getElementById('wordInput');
const rowsInputEl = document.getElementById('rowsInput');
const colsInputEl = document.getElementById('colsInput');
const controlsForm = document.getElementById('controlsForm');
const useDefaultBtn = document.getElementById('useDefaultBtn');
const exportBtn = document.getElementById('exportBtn');
const puzzleWrapperEl = document.getElementById('puzzleWrapper');

const state = {
  grid: [],
  placements: [],
  foundIds: new Set(),
  cellLookup: new Map(),
  wordListLookup: new Map(),
  wordEntries: [],
  gridDimensions: { rows: 0, cols: 0 },
  cellSizeRaf: null
};

const selectionState = {
  active: false,
  pointerId: null,
  start: null,
  path: [],
  highlights: [],
  awaitingSecondClick: false
};

controlsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  generatePuzzle();
});

useDefaultBtn.addEventListener('click', () => {
  wordInputEl.value = DEFAULT_WORDS.join('\n');
  setMessage('Default word list restored.', 'info');
  wordInputEl.focus({ preventScroll: true });
});

exportBtn.addEventListener('click', () => {
  exportPuzzleAsPng();
});

boardEl.addEventListener('pointerdown', handlePointerDown);
document.addEventListener('pointermove', handlePointerMove);
document.addEventListener('pointerup', handlePointerUp);
document.addEventListener('pointercancel', cancelSelection);

generatePuzzle();

function generatePuzzle() {
  resetSelection();

  const parsedRows = parseInt(rowsInputEl.value, 10);
  const parsedCols = parseInt(colsInputEl.value, 10);
  const rows = clamp(Number.isFinite(parsedRows) ? parsedRows : 15, 6, 30);
  const cols = clamp(Number.isFinite(parsedCols) ? parsedCols : 15, 6, 30);
  rowsInputEl.value = String(rows);
  colsInputEl.value = String(cols);

  const parsed = parseWordList(wordInputEl.value);
  let entries = parsed.entries;
  let usedDefaultWords = false;

  if (entries.length === 0) {
    entries = DEFAULT_WORDS.map((word) => ({
      original: word,
      display: word,
      sanitized: word
    }));
    usedDefaultWords = true;
  }

  const words = entries.map((entry) => entry.sanitized);
  const longestWord = words.reduce((max, word) => Math.max(max, word.length), 0);
  if (longestWord > rows && longestWord > cols) {
    setMessage('Your longest word is longer than the grid. Try increasing the size or shortening the word list.', 'warning');
  }

  let puzzle;
  try {
    puzzle = buildPuzzle(words, rows, cols);
  } catch (error) {
    console.error(error);
    setMessage(error.message, 'danger');
    return;
  }

  const entryLookup = new Map(entries.map((entry) => [entry.sanitized, entry]));
  state.grid = puzzle.grid;
  state.placements = puzzle.placements.map((placement) => {
    const entry = entryLookup.get(placement.word);
    return {
      ...placement,
      id: placement.word,
      display: entry ? entry.display : placement.word
    };
  });
  state.wordEntries = entries;
  state.foundIds.clear();

renderBoard(state.grid, rows, cols);
renderWordList(entries);
updateFoundCount();

  const notes = [];
  if (usedDefaultWords) {
    notes.push('Default word list loaded.');
  }
  if (parsed.duplicates.length > 0) {
    notes.push(`${parsed.duplicates.length} duplicate${parsed.duplicates.length === 1 ? '' : 's'} removed.`);
  }
  if (parsed.ignored.length > 0) {
    notes.push(`${parsed.ignored.length} invalid entr${parsed.ignored.length === 1 ? 'y was' : 'ies were'} skipped.`);
  }

  setMessage(notes.length ? `Puzzle ready. ${notes.join(' ')}` : 'Puzzle ready. Good luck!');
}

function parseWordList(raw) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim());
  const entries = [];
  const seen = new Set();
  const duplicates = [];
  const ignored = [];

  for (const line of lines) {
    if (!line) {
      continue;
    }
    const sanitized = line.toUpperCase().replace(/[^A-Z]/g, '');
    if (!sanitized) {
      ignored.push(line);
      continue;
    }
    if (seen.has(sanitized)) {
      duplicates.push(line);
      continue;
    }
    seen.add(sanitized);
    entries.push({
      original: line,
      display: sanitized,
      sanitized
    });
  }

  return { entries, duplicates, ignored };
}

function buildPuzzle(words, rows, cols) {
  const sortedWords = [...words].sort((a, b) => b.length - a.length);
  const maxAttempts = 80;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const grid = Array.from({ length: rows }, () => Array(cols).fill(null));
    const placements = [];
    let success = true;

    for (const word of sortedWords) {
      const placement = tryPlaceWord(word, grid, rows, cols);
      if (!placement) {
        success = false;
        break;
      }
      placements.push(placement);
    }

    if (!success) {
      continue;
    }

    fillRemainingCells(grid);
    return { grid, placements };
  }

  throw new Error('Could not place every word. Try increasing the grid size or trimming your list.');
}

function tryPlaceWord(word, grid, rows, cols) {
  const maxPlacementAttempts = 400;
  const length = word.length;

  for (let attempt = 0; attempt < maxPlacementAttempts; attempt += 1) {
    const direction = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
    const startRow = randomInt(0, rows - 1);
    const startCol = randomInt(0, cols - 1);
    const endRow = startRow + direction.dr * (length - 1);
    const endCol = startCol + direction.dc * (length - 1);

    if (endRow < 0 || endRow >= rows || endCol < 0 || endCol >= cols) {
      continue;
    }

    let fits = true;
    const path = [];

    for (let index = 0; index < length; index += 1) {
      const row = startRow + direction.dr * index;
      const col = startCol + direction.dc * index;
      const existing = grid[row][col];
      const letter = word[index];

      if (existing && existing !== letter) {
        fits = false;
        break;
      }

      path.push({ row, col });
    }

    if (!fits) {
      continue;
    }

    for (let index = 0; index < length; index += 1) {
      const row = path[index].row;
      const col = path[index].col;
      grid[row][col] = word[index];
    }

    const key = path.map((pos) => `${pos.row}-${pos.col}`).join('|');
    const reverseKey = [...path].reverse().map((pos) => `${pos.row}-${pos.col}`).join('|');

    return {
      word,
      cells: path,
      key,
      reverseKey
    };
  }

  return null;
}

function fillRemainingCells(grid) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < grid.length; row += 1) {
    for (let col = 0; col < grid[row].length; col += 1) {
      if (!grid[row][col]) {
        grid[row][col] = alphabet[Math.floor(Math.random() * alphabet.length)];
      }
    }
  }
}

function renderBoard(grid, rows, cols) {
  boardEl.innerHTML = '';
  boardEl.style.gridTemplateColumns = `repeat(${cols}, minmax(0, 1fr))`;
  boardEl.style.gridTemplateRows = `repeat(${rows}, minmax(0, 1fr))`;
  state.cellLookup.clear();
  state.gridDimensions = { rows, cols };

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const cell = document.createElement('div');
      cell.className = 'grid-cell';
      const letter = document.createElement('span');
      letter.className = 'cell-letter';
      letter.textContent = grid[row][col];
      cell.appendChild(letter);
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);
      boardEl.appendChild(cell);
      state.cellLookup.set(cellKey(row, col), cell);
    }
  }

  syncCellSize();
}

function renderWordList(entries) {
  wordListEl.innerHTML = '';
  state.wordListLookup.clear();

  for (const entry of entries) {
    const item = document.createElement('li');
    item.className = 'word-list-item border border-slate-700/60 bg-slate-900/60';
    item.textContent = entry.display;
    item.dataset.word = entry.sanitized;
    wordListEl.appendChild(item);
    state.wordListLookup.set(entry.sanitized, item);
  }
}

function updateFoundCount() {
  foundCountEl.textContent = String(state.foundIds.size);
  totalCountEl.textContent = String(state.placements.length);
}

function handlePointerDown(event) {
  const cell = event.target instanceof HTMLElement ? event.target : null;
  if (!cell || !cell.classList.contains('grid-cell')) {
    return;
  }

  event.preventDefault();
  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);

  if (selectionState.awaitingSecondClick && selectionState.start) {
    const path = computePath(selectionState.start, { row, col });
    if (path && path.length > 1) {
      selectionState.active = true;
      selectionState.pointerId = event.pointerId;
      selectionState.path = path;
      selectionState.awaitingSecondClick = false;
      highlightSelection();
      return;
    }

    if (!path) {
      setMessage('Words must be in a straight line.', 'warning');
    }
    resetSelection();
  }

  selectionState.active = true;
  selectionState.pointerId = event.pointerId;
  selectionState.start = { row, col };
  selectionState.path = [{ ...selectionState.start }];
  selectionState.awaitingSecondClick = false;
  highlightSelection();
}

function handlePointerMove(event) {
  if (!selectionState.active || event.pointerId !== selectionState.pointerId) {
    return;
  }

  const element = document.elementFromPoint(event.clientX, event.clientY);
  if (!element) {
    return;
  }
  const cell = element.closest('.grid-cell');
  if (!cell || cell.closest('#board') !== boardEl) {
    return;
  }

  const row = Number(cell.dataset.row);
  const col = Number(cell.dataset.col);
  const path = computePath(selectionState.start, { row, col });
  if (!path) {
    return;
  }
  selectionState.path = path;
  highlightSelection();
}

function handlePointerUp(event) {
  if (!selectionState.active || event.pointerId !== selectionState.pointerId) {
    return;
  }
  finalizeSelection();
}

function cancelSelection(event) {
  if (!selectionState.active || event.pointerId !== selectionState.pointerId) {
    return;
  }
  resetSelection();
}

function finalizeSelection() {
  const { path } = selectionState;
  if (!path || path.length <= 1) {
    selectionState.active = false;
    selectionState.pointerId = null;
    selectionState.awaitingSecondClick = true;
    if (selectionState.start) {
      selectionState.path = [{ ...selectionState.start }];
      highlightSelection();
    }
    setMessage('Select the other end of the word.', 'info');
    return;
  }

  const key = path.map((pos) => cellKey(pos.row, pos.col)).join('|');
  const match = state.placements.find((placement) => !state.foundIds.has(placement.id) && (placement.key === key || placement.reverseKey === key));

  if (!match) {
    setMessage('No matching word in that direction. Try again.', 'warning');
    resetSelection();
    return;
  }

  state.foundIds.add(match.id);
  for (const position of match.cells) {
    const cell = getCell(position.row, position.col);
    if (cell) {
      cell.classList.add('found');
    }
  }

  const listItem = state.wordListLookup.get(match.id);
  if (listItem) {
    listItem.classList.add('found');
  }

  updateFoundCount();

  if (state.foundIds.size === state.placements.length) {
    setMessage('You found every word! Great job!', 'success');
  } else {
    setMessage(`Found "${match.display}"!`, 'success');
  }

  resetSelection();
}

function computePath(start, end) {
  const dRow = end.row - start.row;
  const dCol = end.col - start.col;

  if (dRow === 0 && dCol === 0) {
    return [start];
  }

  const absRow = Math.abs(dRow);
  const absCol = Math.abs(dCol);

  if (!(dRow === 0 || dCol === 0 || absRow === absCol)) {
    return null;
  }

  const stepRow = Math.sign(dRow);
  const stepCol = Math.sign(dCol);
  const length = Math.max(absRow, absCol) + 1;
  const path = [];

  for (let index = 0; index < length; index += 1) {
    const row = start.row + stepRow * index;
    const col = start.col + stepCol * index;
    path.push({ row, col });
  }

  return path;
}

function highlightSelection() {
  for (const cell of selectionState.highlights) {
    cell.classList.remove('selected');
  }
  selectionState.highlights = [];

  for (const position of selectionState.path) {
    const cell = getCell(position.row, position.col);
    if (cell) {
      cell.classList.add('selected');
      selectionState.highlights.push(cell);
    }
  }
}

function resetSelection() {
  for (const cell of selectionState.highlights) {
    cell.classList.remove('selected');
  }

  selectionState.active = false;
  selectionState.pointerId = null;
  selectionState.start = null;
  selectionState.path = [];
  selectionState.highlights = [];
  selectionState.awaitingSecondClick = false;
}

function syncCellSize() {
  if (!state.gridDimensions.cols) {
    return;
  }

  if (state.cellSizeRaf) {
    cancelAnimationFrame(state.cellSizeRaf);
  }

  state.cellSizeRaf = requestAnimationFrame(() => {
    const { cols } = state.gridDimensions;
    const styles = window.getComputedStyle(boardEl);
    const gap = parseFloat(styles.gap) || 0;
    const boardWidth = boardEl.clientWidth;

    if (boardWidth <= 0) {
      state.cellSizeRaf = null;
      return;
    }

    const totalGap = gap * Math.max(cols - 1, 0);
    const size = (boardWidth - totalGap) / cols;
    boardEl.style.setProperty('--cell-size', `${size}px`);
    state.cellSizeRaf = null;
  });
}

window.addEventListener('resize', syncCellSize);

function exportPuzzleAsPng() {
  if (!window.html2canvas) {
    setMessage('Image export is unavailable right now. Please try again after the page finishes loading.', 'warning');
    return;
  }

  exportBtn.disabled = true;
  const originalLabel = exportBtn.textContent;
  exportBtn.textContent = 'Exporting…';

  window.html2canvas(puzzleWrapperEl, {
    backgroundColor: '#0f172a',
    scale: window.devicePixelRatio < 2 ? 2 : window.devicePixelRatio
  })
    .then((canvas) => {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
      link.href = dataUrl;
      link.download = `wordsearch-${timestamp}.png`;
      link.click();
      setMessage('PNG exported successfully.', 'success');
    })
    .catch((error) => {
      console.error(error);
      setMessage('Could not export the puzzle. Please try again.', 'danger');
    })
    .finally(() => {
      exportBtn.disabled = false;
      exportBtn.textContent = originalLabel;
    });
}

function getCell(row, col) {
  return state.cellLookup.get(cellKey(row, col)) || null;
}

function cellKey(row, col) {
  return `${row}-${col}`;
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function setMessage(text, tone = 'info') {
  messageEl.textContent = text;
  messageEl.classList.remove('text-emerald-300', 'text-amber-300', 'text-rose-300', 'text-slate-300');
  let toneClass = 'text-slate-300';
  if (tone === 'success') {
    toneClass = 'text-emerald-300';
  } else if (tone === 'warning') {
    toneClass = 'text-amber-300';
  } else if (tone === 'danger') {
    toneClass = 'text-rose-300';
  }
  messageEl.classList.add(toneClass);
}
