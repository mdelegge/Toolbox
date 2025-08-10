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

function weightedSampleWithGroupFiltering(items, k) {
  const picks = [];
  const usedGroups = new Set();
  const usedItems = new Set(); // Track used items by reference
  const maxAttempts = k * 10; // Prevent infinite loops
  let attempts = 0;
  
  while (picks.length < k && attempts < maxAttempts) {
    attempts++;
    
    // Filter items that don't conflict with already used groups or items
    const availableItems = items.filter(item => {
      // Skip if this exact item was already picked
      if (usedItems.has(item)) return false;
      // If item has no group, it's always available
      if (!item.group) return true;
      // If item has a group, only allow if group hasn't been used
      return !usedGroups.has(item.group);
    });
    
    // If no available items remain, break out
    if (availableItems.length === 0) break;
    
    // Sample one item from available items using weighted selection
    const sampled = weightedSampleWithoutReplacement(availableItems, 1);
    if (sampled.length === 0) break;
    
    const selectedItem = sampled[0];
    picks.push(selectedItem);
    
    // Mark this item's group as used (if it has one)
    if (selectedItem.group) {
      usedGroups.add(selectedItem.group);
    }
    
    // Mark this specific item as used
    usedItems.add(selectedItem);
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
    return `${name}${qty > 1 ? ' [x ' + qty + ']' : ' [x ' + qty + ']'}`; // always show the number rolled
  }
  return item.name;
}

// BSP Dungeon Generator Classes and Functions

class Rectangle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get centerX() { return this.x + Math.floor(this.width / 2); }
  get centerY() { return this.y + Math.floor(this.height / 2); }
  get right() { return this.x + this.width - 1; }
  get bottom() { return this.y + this.height - 1; }
}

class BSPNode {
  constructor(rect) {
    this.rect = rect;
    this.leftChild = null;
    this.rightChild = null;
    this.room = null;
    this.corridors = [];
  }

  isLeaf() {
    return !this.leftChild && !this.rightChild;
  }

  split(minRoomSize = 6) {
    if (!this.isLeaf()) return false;

    const { width, height } = this.rect;
    
    // Don't split if too small
    if (width < minRoomSize * 2 || height < minRoomSize * 2) {
      return false;
    }

    // Choose split direction - prefer splitting along the longer dimension
    const splitHorizontally = Math.random() > 0.5;
    
    if (splitHorizontally) {
      if (height < minRoomSize * 2) return false;
      
      const splitY = minRoomSize + Math.floor(Math.random() * (height - minRoomSize * 2));
      this.leftChild = new BSPNode(new Rectangle(this.rect.x, this.rect.y, width, splitY));
      this.rightChild = new BSPNode(new Rectangle(this.rect.x, this.rect.y + splitY, width, height - splitY));
    } else {
      if (width < minRoomSize * 2) return false;
      
      const splitX = minRoomSize + Math.floor(Math.random() * (width - minRoomSize * 2));
      this.leftChild = new BSPNode(new Rectangle(this.rect.x, this.rect.y, splitX, height));
      this.rightChild = new BSPNode(new Rectangle(this.rect.x + splitX, this.rect.y, width - splitX, height));
    }

    return true;
  }

  createRoom(minRoomSize = 4, maxRoomSize = 10) {
    if (!this.isLeaf()) {
      // Create rooms in children first
      if (this.leftChild) this.leftChild.createRoom(minRoomSize, maxRoomSize);
      if (this.rightChild) this.rightChild.createRoom(minRoomSize, maxRoomSize);

      // Connect the rooms
      if (this.leftChild && this.rightChild) {
        this.createCorridor(this.leftChild.getRoom(), this.rightChild.getRoom());
      }
    } else {
      // Create a room in this leaf node
      const { x, y, width, height } = this.rect;
      
      const roomWidth = Math.min(maxRoomSize, Math.max(minRoomSize, width - 2));
      const roomHeight = Math.min(maxRoomSize, Math.max(minRoomSize, height - 2));
      
      const roomX = x + 1 + Math.floor(Math.random() * (width - roomWidth - 1));
      const roomY = y + 1 + Math.floor(Math.random() * (height - roomHeight - 1));
      
      this.room = new Rectangle(roomX, roomY, roomWidth, roomHeight);
    }
  }

  getRoom() {
    if (this.isLeaf()) {
      return this.room;
    }
    
    let leftRoom = null;
    let rightRoom = null;
    
    if (this.leftChild) leftRoom = this.leftChild.getRoom();
    if (this.rightChild) rightRoom = this.rightChild.getRoom();
    
    if (!leftRoom && !rightRoom) return null;
    if (!rightRoom) return leftRoom;
    if (!leftRoom) return rightRoom;
    
    // Return a random room from either side
    return Math.random() > 0.5 ? leftRoom : rightRoom;
  }

  createCorridor(room1, room2) {
    if (!room1 || !room2) return;

    const point1 = { x: room1.centerX, y: room1.centerY };
    const point2 = { x: room2.centerX, y: room2.centerY };

    // Create L-shaped corridor
    if (Math.random() > 0.5) {
      // Horizontal first, then vertical
      this.corridors.push({
        start: point1,
        end: { x: point2.x, y: point1.y }
      });
      this.corridors.push({
        start: { x: point2.x, y: point1.y },
        end: point2
      });
    } else {
      // Vertical first, then horizontal
      this.corridors.push({
        start: point1,
        end: { x: point1.x, y: point2.y }
      });
      this.corridors.push({
        start: { x: point1.x, y: point2.y },
        end: point2
      });
    }
  }

  getAllRooms() {
    const rooms = [];
    if (this.isLeaf() && this.room) {
      rooms.push(this.room);
    } else {
      if (this.leftChild) rooms.push(...this.leftChild.getAllRooms());
      if (this.rightChild) rooms.push(...this.rightChild.getAllRooms());
    }
    return rooms;
  }

  getAllCorridors() {
    let corridors = [...this.corridors];
    if (this.leftChild) corridors.push(...this.leftChild.getAllCorridors());
    if (this.rightChild) corridors.push(...this.rightChild.getAllCorridors());
    return corridors;
  }
}

class DungeonGenerator {
  constructor(width, height, targetRooms = 10) {
    this.width = width;
    this.height = height;
    this.targetRooms = targetRooms;
    this.grid = null;
    this.rooms = [];
    this.corridors = [];
  }

  generate() {
    // Initialize grid with walls
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
    
    // Create root BSP node
    const root = new BSPNode(new Rectangle(0, 0, this.width, this.height));
    
    // Split recursively to create a good tree structure
    this.splitRecursively(root);
    
    // Create rooms in leaf nodes
    root.createRoom();
    
    // Get all rooms and corridors
    this.rooms = root.getAllRooms();
    this.corridors = root.getAllCorridors();
    
    // If we don't have enough rooms, try to split more aggressively
    let attempts = 0;
    while (this.rooms.length < this.targetRooms && attempts < 5) {
      const newRoot = new BSPNode(new Rectangle(0, 0, this.width, this.height));
      this.splitMoreAggressively(newRoot, this.targetRooms + attempts * 2);
      newRoot.createRoom();
      
      const newRooms = newRoot.getAllRooms();
      if (newRooms.length > this.rooms.length) {
        this.rooms = newRooms;
        this.corridors = newRoot.getAllCorridors();
      }
      attempts++;
    }
    
    // Draw rooms on grid
    this.rooms.forEach(room => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = 1; // Room floor
          }
        }
      }
    });
    
    // Draw corridors on grid
    this.corridors.forEach(corridor => {
      this.drawLine(corridor.start, corridor.end);
    });

    return {
      grid: this.grid,
      rooms: this.rooms,
      corridors: this.corridors,
      width: this.width,
      height: this.height
    };
  }

  splitRecursively(node, depth = 0, maxDepth = 6) {
    // Stop if we've reached max depth or node is too small
    if (depth >= maxDepth) return;
    
    if (node.split()) {
      this.splitRecursively(node.leftChild, depth + 1, maxDepth);
      this.splitRecursively(node.rightChild, depth + 1, maxDepth);
    }
  }

  splitMoreAggressively(node, targetLeaves, depth = 0) {
    const currentLeaves = this.countLeaves(node);
    
    // Continue splitting if we need more leaves and haven't gone too deep
    if (currentLeaves < targetLeaves && depth < 8) {
      if (node.split()) {
        this.splitMoreAggressively(node.leftChild, targetLeaves, depth + 1);
        this.splitMoreAggressively(node.rightChild, targetLeaves, depth + 1);
      }
    }
  }

  countLeaves(node) {
    if (node.isLeaf()) return 1;
    let count = 0;
    if (node.leftChild) count += this.countLeaves(node.leftChild);
    if (node.rightChild) count += this.countLeaves(node.rightChild);
    return count;
  }

  drawLine(start, end) {
    const dx = Math.abs(end.x - start.x);
    const dy = Math.abs(end.y - start.y);
    const sx = start.x < end.x ? 1 : -1;
    const sy = start.y < end.y ? 1 : -1;
    let err = dx - dy;

    let x = start.x;
    let y = start.y;

    while (true) {
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        this.grid[y][x] = 1; // Corridor floor
      }

      if (x === end.x && y === end.y) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }
  }
}

export {
  DEFAULT_RARITY_WEIGHTS,
  parseDiceInName,
  parseDice,
  rollDiceSpec,
  itemWeight,
  weightedSampleWithoutReplacement,
  weightedSampleWithGroupFiltering,
  deriveQuantity,
  formatResultLine,
  clamp,
  DungeonGenerator,
  Rectangle,
  BSPNode
};