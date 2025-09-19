// donjon.js — donjon-style dungeon generator with bitmask cells and extras
// Inspired by https://donjon.bin.sh/code/dungeon/

const CELL = {
  BLOCKED: 0x01,
  ROOM: 0x02,
  CORRIDOR: 0x04,
  PERIM: 0x08,
  DOOR: 0x10,
  STAIR_UP: 0x20,
  STAIR_DN: 0x40,
};

class DonjonGenerator {
  constructor(width, height, targetRooms = 12, opts = {}) {
    this.width = Math.max(21, width | 0);   // ensure enough space
    this.height = Math.max(21, height | 0);
    this.targetRooms = targetRooms | 0;
    this.grid = null; // bitmask per cell
    this.rooms = [];
    this.corridors = [];
    this.doors = [];
    this.labels = [];
    this.roomDescriptions = {};
    this.stairs = { up: null, down: null };
    this.opts = Object.assign({
      roomMin: 3,
      roomMax: 11,         // odd sizes preferred
      straightBias: 0.85,  // prefer continuing straight when carving
      doorAttemptsPerRoom: 8,
      removeDeadEnds: true,
      deadEndMaxPasses: 50,
      pruneMST: true,
      spurMaxLen: 0 // keep short decorative spurs branching from the MST (0 disables)
    }, opts);
  }

  generate() {
    // start with solid blocked cells
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(CELL.BLOCKED));

    // 1) Scatter rooms with odd sizes along odd coords; don't overlap
    this._placeRooms();

    // 2) Carve maze-like corridors on odd grid using randomized DFS with bias (avoids rooms/perimeters)
    this._carveMaze();

    // 3) Connect rooms to nearby corridors by opening a few doors on the perimeter
    this._openDoors();

    // 4) Optionally prune dead-end corridors (iterative passes)
    if (this.opts.removeDeadEnds) this._removeDeadEnds(this.opts.deadEndMaxPasses);

    // 5) Optionally prune long detours: keep only shortest paths connecting doors (MST)
    if (this.opts.pruneMST) this._pruneToMST();

    // 6) Place stairs on corridor cells
    this._placeStairs();

    return {
      grid: this.grid,
      rooms: this.rooms,
      corridors: this.corridors,
      doors: this.doors,
      labels: this.labels,
      roomDescriptions: this.roomDescriptions,
      stairs: this.stairs,
      width: this.width,
      height: this.height
    };
  }

  // --- Maze carving on odd grid ---
  _carveMaze() {
    const W = this.width, H = this.height;
    const visited = Array(H).fill().map(() => Array(W).fill(false));

    let sx = (Math.floor(Math.random() * ((W - 1) / 2)) * 2) + 1;
    let sy = (Math.floor(Math.random() * ((H - 1) / 2)) * 2) + 1;
    // pick a start that is not in a room or its perimeter
    let guard = 0;
    while ((this.grid[sy][sx] & (CELL.ROOM | CELL.PERIM)) && guard++ < 1000) {
      sx = (Math.floor(Math.random() * ((W - 1) / 2)) * 2) + 1;
      sy = (Math.floor(Math.random() * ((H - 1) / 2)) * 2) + 1;
    }

    const stack = [{ x: sx, y: sy, dir: null }];
    visited[sy][sx] = true;
    this.grid[sy][sx] = CELL.CORRIDOR;

    const dirs = [ {dx: 0, dy: -2, key: 'N'}, {dx: 2, dy: 0, key: 'E'}, {dx: 0, dy: 2, key: 'S'}, {dx: -2, dy: 0, key: 'W'} ];

    const nextDirs = (prevKey) => {
      const shuffled = dirs.slice();
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      if (!prevKey || Math.random() > this.opts.straightBias) return shuffled;
      shuffled.sort((a, b) => (a.key === prevKey ? -1 : b.key === prevKey ? 1 : 0));
      return shuffled;
    };

    while (stack.length) {
      const top = stack[stack.length - 1];
      const { x, y, dir } = top;
      let carved = false;
      for (const d of nextDirs(dir)) {
        const nx = x + d.dx;
        const ny = y + d.dy;
        if (nx <= 0 || nx >= W - 1 || ny <= 0 || ny >= H - 1) continue;
        if (visited[ny][nx]) continue;
        // avoid carving into rooms or their perimeter
        if (this.grid[ny][nx] & (CELL.ROOM | CELL.PERIM)) continue;
        const wx = x + (d.dx / 2);
        const wy = y + (d.dy / 2);
        if (this.grid[wy][wx] & (CELL.ROOM | CELL.PERIM)) continue;
        this.grid[wy][wx] = CELL.CORRIDOR;
        this.grid[ny][nx] = CELL.CORRIDOR;
        visited[ny][nx] = true;
        stack.push({ x: nx, y: ny, dir: d.key });
        carved = true;
        this.corridors.push({ start: { x, y }, end: { x: nx, y: ny } });
        break;
      }
      if (!carved) stack.pop();
    }
  }

  // --- Room placement ---
  _placeRooms() {
    const W = this.width, H = this.height;
    const { roomMin, roomMax } = this.opts;
    const attempts = this.targetRooms * 8;
    let placed = 0;
    for (let i = 0; i < attempts && placed < this.targetRooms; i++) {
      let rw = this._oddBetween(roomMin, roomMax);
      let rh = this._oddBetween(roomMin, roomMax);
      let rx = this._oddBetween(1, W - rw - 2);
      let ry = this._oddBetween(1, H - rh - 2);
      if (!this._roomOverlaps(rx, ry, rw, rh)) {
        for (let y = ry; y < ry + rh; y++) {
          for (let x = rx; x < rx + rw; x++) {
            this.grid[y][x] = (this.grid[y][x] & ~CELL.BLOCKED) | CELL.ROOM;
          }
        }
        // mark perimeter (optional, helps door checks)
        for (let x = rx - 1; x <= rx + rw; x++) {
          if (this._inBounds(x, ry - 1)) this.grid[ry - 1][x] |= CELL.PERIM;
          if (this._inBounds(x, ry + rh)) this.grid[ry + rh][x] |= CELL.PERIM;
        }
        for (let y = ry - 1; y <= ry + rh; y++) {
          if (this._inBounds(rx - 1, y)) this.grid[y][rx - 1] |= CELL.PERIM;
          if (this._inBounds(rx + rw, y)) this.grid[y][rx + rw] |= CELL.PERIM;
        }
        const label = String(placed + 1);
        const cx = rx + Math.floor(rw / 2);
        const cy = ry + Math.floor(rh / 2);
        this.rooms.push({ x: rx, y: ry, width: rw, height: rh, label });
        this.labels.push({ x: cx, y: cy, text: label });
        // description: convert grid size to feet (5 ft per grid cell)
        const feetW = rw * 5, feetH = rh * 5;
        this.roomDescriptions[label] = `${feetW} x ${feetH} ft room`;
        placed++;
      }
    }
  }

  _roomOverlaps(rx, ry, rw, rh) {
    const x0 = Math.max(0, rx - 1), y0 = Math.max(0, ry - 1);
    const x1 = Math.min(this.width - 1, rx + rw);
    const y1 = Math.min(this.height - 1, ry + rh);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (this.grid[y][x] & (CELL.ROOM | CELL.CORRIDOR)) return true;
      }
    }
    return false;
  }

  // --- Doors: connect room perimeters to nearby corridors ---
  _openDoors() {
    const { doorAttemptsPerRoom } = this.opts;
    for (const room of this.rooms) {
      let attempts = 0;
      let opened = 0;
      const perim = [];
      for (let x = room.x; x < room.x + room.width; x++) {
        perim.push({ x, y: room.y - 1, nx: x, ny: room.y - 2, orient: 'N' });
        perim.push({ x, y: room.y + room.height, nx: x, ny: room.y + room.height + 1, orient: 'S' });
      }
      for (let y = room.y; y < room.y + room.height; y++) {
        perim.push({ x: room.x - 1, y, nx: room.x - 2, ny: y, orient: 'W' });
        perim.push({ x: room.x + room.width, y, nx: room.x + room.width + 1, ny: y, orient: 'E' });
      }
      while (attempts < doorAttemptsPerRoom && opened < 3 && perim.length > 0) {
        attempts++;
        const idx = Math.floor(Math.random() * perim.length);
        const p = perim.splice(idx, 1)[0];
        if (this._inBounds(p.x, p.y) && this._inBounds(p.nx, p.ny)) {
          if (this._isCorridor(p.nx, p.ny)) {
            this.grid[p.y][p.x] = (this.grid[p.y][p.x] & ~CELL.BLOCKED) | CELL.DOOR;
            this.doors.push({ x: p.x, y: p.y, orient: p.orient, type: 'door' });
            opened++;
          }
        }
      }
    }
  }

  _removeDeadEnds(maxPasses = 100) {
    // Build protection mask: keep doors, stairs, and corridor cells adjacent to doors
    const protect = Array(this.height).fill().map(() => Array(this.width).fill(false));
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const v = this.grid[y][x];
        if (v & (CELL.DOOR | CELL.STAIR_UP | CELL.STAIR_DN)) {
          protect[y][x] = true;
          // also protect adjacent corridor neighbors for doors
          if (v & CELL.DOOR) {
            const ns = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const [dx, dy] of ns) {
              const nx = x + dx, ny = y + dy;
              if (this._inBounds(nx, ny) && this._isCorridor(nx, ny)) protect[ny][nx] = true;
            }
          }
        }
      }
    }

    // Iteratively peel dead-end corridors while preserving protected cells
    for (let pass = 0; pass < maxPasses; pass++) {
      const toFill = [];
      for (let y = 1; y < this.height - 1; y++) {
        for (let x = 1; x < this.width - 1; x++) {
          if (!this._isCorridor(x, y) || protect[y][x]) continue;
          const deg = this._degreeOpen(x, y);
          if (deg <= 1) toFill.push({ x, y });
        }
      }
      if (!toFill.length) break;
      for (const p of toFill) this.grid[p.y][p.x] = CELL.BLOCKED;
    }

    // Final connectivity prune: keep only corridors connected to doors or stairs
    const vis = Array(this.height).fill().map(() => Array(this.width).fill(false));
    const q = [];
    // seeds: door cells, stair cells, and corridor neighbors of doors
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        const v = this.grid[y][x];
        if (v & (CELL.DOOR | CELL.STAIR_UP | CELL.STAIR_DN)) {
          q.push({ x, y });
          vis[y][x] = true;
          if (v & CELL.DOOR) {
            const ns = [[1,0],[-1,0],[0,1],[0,-1]];
            for (const [dx, dy] of ns) {
              const nx = x + dx, ny = y + dy;
              if (this._inBounds(nx, ny) && this._isCorridor(nx, ny) && !vis[ny][nx]) {
                q.push({ x: nx, y: ny });
                vis[ny][nx] = true;
              }
            }
          }
        }
      }
    }
    const canTraverse = (x, y) => {
      const v = this.grid[y][x];
      return (v & (CELL.CORRIDOR | CELL.DOOR | CELL.STAIR_UP | CELL.STAIR_DN)) !== 0;
    };
    while (q.length) {
      const { x, y } = q.shift();
      const ns = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx, dy] of ns) {
        const nx = x + dx, ny = y + dy;
        if (!this._inBounds(nx, ny) || vis[ny][nx]) continue;
        if (!canTraverse(nx, ny)) continue;
        vis[ny][nx] = true;
        q.push({ x: nx, y: ny });
      }
    }
    // Remove unreachable corridor cells
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this._isCorridor(x, y) && !vis[y][x]) this.grid[y][x] = CELL.BLOCKED;
      }
    }
  }

  // Keep shortest connecting network between door-adjacent corridor cells (MST)
  _pruneToMST() {
    // terminals are corridor neighbors of doors
    const terms = [];
    for (const d of this.doors) {
      const ns = [[1,0],[-1,0],[0,1],[0,-1]];
      for (const [dx, dy] of ns) {
        const nx = d.x + dx, ny = d.y + dy;
        if (this._inBounds(nx, ny) && this._isCorridor(nx, ny)) {
          terms.push({ x: nx, y: ny });
          break; // one per door
        }
      }
    }
    if (terms.length <= 1) return;

    const key = (x, y) => `${x},${y}`;

    // BFS utility
    const bfsFrom = (sx, sy) => {
      const dist = Array(this.height).fill().map(() => Array(this.width).fill(Infinity));
      const prev = Array(this.height).fill().map(() => Array(this.width).fill(null));
      const q = [];
      dist[sy][sx] = 0; q.push({ x: sx, y: sy });
      while (q.length) {
        const { x, y } = q.shift();
        const ns = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx, dy] of ns) {
          const nx = x + dx, ny = y + dy;
          if (!this._inBounds(nx, ny) || !this._isOpen(nx, ny)) continue;
          if (dist[ny][nx] !== Infinity) continue;
          dist[ny][nx] = dist[y][x] + 1;
          prev[ny][nx] = { x, y };
          q.push({ x: nx, y: ny });
        }
      }
      return { dist, prev };
    };

    // Precompute BFS maps
    const bfs = terms.map(t => bfsFrom(t.x, t.y));
    const edges = [];
    for (let i = 0; i < terms.length; i++) {
      for (let j = i + 1; j < terms.length; j++) {
        const d = bfs[i].dist[terms[j].y][terms[j].x];
        if (d < Infinity) edges.push({ i, j, w: d });
      }
    }
    if (!edges.length) return;

    // Prim's MST, collecting cells to keep
    const keep = new Set();
    const inTree = Array(terms.length).fill(false);
    inTree[0] = true;
    const addPath = (i, j) => {
      let cur = { x: terms[j].x, y: terms[j].y };
      const prev = bfs[i].prev;
      while (cur && !(cur.x === terms[i].x && cur.y === terms[i].y)) {
        keep.add(key(cur.x, cur.y));
        cur = prev[cur.y][cur.x];
      }
      keep.add(key(terms[i].x, terms[i].y));
    };
    for (let k = 0; k < terms.length - 1; k++) {
      let best = null;
      for (const e of edges) {
        if ((inTree[e.i] && !inTree[e.j]) || (inTree[e.j] && !inTree[e.i])) {
          if (!best || e.w < best.w) best = e;
        }
      }
      if (!best) break;
      const a = inTree[best.i] ? best.i : best.j;
      const b = inTree[best.i] ? best.j : best.i;
      addPath(a, b);
      inTree[b] = true;
    }

    // Optionally keep short spurs branching from MST
    const spurLen = this.opts.spurMaxLen | 0;
    if (spurLen > 0) {
      const q = Array.from(keep).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y, d: 0 };
      });
      const seen = new Set(keep);
      while (q.length) {
        const { x, y, d } = q.shift();
        if (d === spurLen) continue;
        const ns = [[1,0],[-1,0],[0,1],[0,-1]];
        for (const [dx, dy] of ns) {
          const nx = x + dx, ny = y + dy;
          if (!this._inBounds(nx, ny) || !this._isOpen(nx, ny)) continue;
          const k = key(nx, ny);
          if (seen.has(k)) continue;
          seen.add(k); keep.add(k);
          q.push({ x: nx, y: ny, d: d + 1 });
        }
      }
    }

    // Remove corridor cells not in the keep set
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this._isCorridor(x, y) && !keep.has(key(x, y))) this.grid[y][x] = CELL.BLOCKED;
      }
    }
  }

  _degreeOpen(x, y) {
    let c = 0;
    if (this._isOpen(x + 1, y)) c++;
    if (this._isOpen(x - 1, y)) c++;
    if (this._isOpen(x, y + 1)) c++;
    if (this._isOpen(x, y - 1)) c++;
    return c;
  }

  _placeStairs() {
    // pick two corridor cells far-ish apart
    const cells = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this._isCorridor(x, y)) cells.push({ x, y });
      }
    }
    if (cells.length < 2) return;
    const a = cells[Math.floor(Math.random() * cells.length)];
    let best = null, bestD = -1;
    for (let i = 0; i < 50; i++) {
      const b = cells[Math.floor(Math.random() * cells.length)];
      const d = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
      if (d > bestD) { bestD = d; best = b; }
    }
    if (!best) return;
    this.grid[a.y][a.x] |= CELL.STAIR_UP;
    this.grid[best.y][best.x] |= CELL.STAIR_DN;
    this.stairs.up = { x: a.x, y: a.y };
    this.stairs.down = { x: best.x, y: best.y };
  }

  _corridorDegree(x, y) {
    let c = 0;
    if (this._isOpen(x + 1, y)) c++;
    if (this._isOpen(x - 1, y)) c++;
    if (this._isOpen(x, y + 1)) c++;
    if (this._isOpen(x, y - 1)) c++;
    return c;
  }

  _isOpen(x, y) {
    const v = this.grid[y][x];
    return (v & (CELL.CORRIDOR | CELL.DOOR | CELL.STAIR_UP | CELL.STAIR_DN)) !== 0;
  }

  _isCorridor(x, y) { return (this.grid[y][x] & CELL.CORRIDOR) !== 0; }
  _inBounds(x, y) { return x > 0 && x < this.width - 1 && y > 0 && y < this.height - 1; }
  _oddBetween(min, max) {
    min = Math.max(min | 0, 1);
    max = Math.max(max | 0, min);
    let n = (Math.floor(Math.random() * ((max - min + 1) / 2)) * 2) + min;
    if (n % 2 === 0) n = Math.max(min, n - 1);
    if (n < min) n = min | 1;
    if (n > max) n = max | 1;
    if (n % 2 === 0) n++;
    return n;
  }
}

export { DonjonGenerator, CELL };
