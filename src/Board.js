// src/Board.js — обновлённая версия

export class Board {
  constructor(width = 8, height = 8, types = 6) {
    this.width = width;
    this.height = height;
    this.types = types;
    this.grid = [];
    this.initialize();
  }

  initialize() {
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.width; x++) {
        this.grid[y][x] = Math.floor(Math.random() * this.types);
      }
    }
    // Убираем начальные матчи
    while (this.removeMatches()) {
      this.fillEmpty();
    }
  }

  get(x, y) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      return this.grid[y][x];
    }
    return -1;
  }

  getSize() {
    return { width: this.width, height: this.height };
  }

  // === НОВОЕ: поиск и удаление матчей ===
  findMatches() {
    const toRemove = Array(this.height).fill().map(() => Array(this.width).fill(false));

    // По горизонтали
    for (let y = 0; y < this.height; y++) {
      let count = 1;
      for (let x = 1; x < this.width; x++) {
        if (this.grid[y][x] === this.grid[y][x - 1] && this.grid[y][x] !== -1) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = 0; i < count; i++) {
              toRemove[y][x - 1 - i] = true;
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          toRemove[y][this.width - 1 - i] = true;
        }
      }
    }

    // По вертикали
    for (let x = 0; x < this.width; x++) {
      let count = 1;
      for (let y = 1; y < this.height; y++) {
        if (this.grid[y][x] === this.grid[y - 1][x] && this.grid[y][x] !== -1) {
          count++;
        } else {
          if (count >= 3) {
            for (let i = 0; i < count; i++) {
              toRemove[y - 1 - i][x] = true;
            }
          }
          count = 1;
        }
      }
      if (count >= 3) {
        for (let i = 0; i < count; i++) {
          toRemove[this.height - 1 - i][x] = true;
        }
      }
    }

    return toRemove;
  }

  removeMatches() {
    const toRemove = this.findMatches();
    let hasMatch = false;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (toRemove[y][x]) {
          this.grid[y][x] = -1;
          hasMatch = true;
        }
      }
    }
    return hasMatch;
  }

  // === НОВОЕ: гравитация (логическая, без анимации) ===
  applyGravity() {
    for (let x = 0; x < this.width; x++) {
      let writePos = this.height - 1;
      for (let y = this.height - 1; y >= 0; y--) {
        if (this.grid[y][x] !== -1) {
          this.grid[writePos][x] = this.grid[y][x];
          if (writePos !== y) {
            this.grid[y][x] = -1;
          }
          writePos--;
        }
      }
      // Заполняем пустоты сверху
      while (writePos >= 0) {
        this.grid[writePos][x] = Math.floor(Math.random() * this.types);
        writePos--;
      }
    }
  }

  // Заполнить пустоты (для инициализации)
  fillEmpty() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === -1) {
          this.grid[y][x] = Math.floor(Math.random() * this.types);
        }
      }
    }
  }
}