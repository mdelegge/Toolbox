// bsp.js — BSP dungeon generator implementation

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

    if (width < minRoomSize * 2 || height < minRoomSize * 2) {
      return false;
    }

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
      if (this.leftChild) this.leftChild.createRoom(minRoomSize, maxRoomSize);
      if (this.rightChild) this.rightChild.createRoom(minRoomSize, maxRoomSize);

      if (this.leftChild && this.rightChild) {
        this.createCorridor(this.leftChild.getRoom(), this.rightChild.getRoom());
      }
    } else {
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

    return Math.random() > 0.5 ? leftRoom : rightRoom;
  }

  createCorridor(room1, room2) {
    if (!room1 || !room2) return;

    const point1 = { x: room1.centerX, y: room1.centerY };
    const point2 = { x: room2.centerX, y: room2.centerY };

    if (Math.random() > 0.5) {
      this.corridors.push({ start: point1, end: { x: point2.x, y: point1.y } });
      this.corridors.push({ start: { x: point2.x, y: point1.y }, end: point2 });
    } else {
      this.corridors.push({ start: point1, end: { x: point1.x, y: point2.y } });
      this.corridors.push({ start: { x: point1.x, y: point2.y }, end: point2 });
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
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));

    const root = new BSPNode(new Rectangle(0, 0, this.width, this.height));

    this.splitRecursively(root);

    root.createRoom();

    this.rooms = root.getAllRooms();
    this.corridors = root.getAllCorridors();

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

    this.rooms.forEach(room => {
      for (let y = room.y; y < room.y + room.height; y++) {
        for (let x = room.x; x < room.x + room.width; x++) {
          if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
            this.grid[y][x] = 1;
          }
        }
      }
    });

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
    if (depth >= maxDepth) return;

    if (node.split()) {
      this.splitRecursively(node.leftChild, depth + 1, maxDepth);
      this.splitRecursively(node.rightChild, depth + 1, maxDepth);
    }
  }

  splitMoreAggressively(node, targetLeaves, depth = 0) {
    const currentLeaves = this.countLeaves(node);

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
        this.grid[y][x] = 1;
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

export { Rectangle, BSPNode, DungeonGenerator };
