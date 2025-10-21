// src/Renderer.js

const CHIP_COLORS = [
  '#ff6b6b', // 0 — красный
  '#4ecdc4', // 1 — бирюзовый
  '#ffd166', // 2 — жёлтый
  '#a09abc', // 3 — фиолетовый
  '#06d6a0', // 4 — зелёный
  '#118ab2'  // 5 — синий
  // тип 6 — бомба (рисуется отдельно)
];

export class Renderer {
  constructor(canvas, background, board) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.background = background;
    this.board = board;
    this.draggingChip = null;
    this.fallingChips = [];
    this.cellSize = Math.min(canvas.width, canvas.height) / 10;
    this.offsetX = (canvas.width - board.width * this.cellSize) / 2;
    this.offsetY = (canvas.height - board.height * this.cellSize) / 2;
  }

  setDraggingChip(chipPos) {
    this.draggingChip = chipPos;
  }

  clearDraggingChip() {
    this.draggingChip = null;
  }

  setFallingChips(chips) {
    this.fallingChips = chips;
  }

  draw() {
    const { width, height } = this.canvas;
    const { width: w, height: h } = this.board;

    this.background.draw(this.ctx, width, height);

    const fallingSet = new Set();
    for (const c of this.fallingChips) {
      fallingSet.add(`${c.x},${c.toY}`);
    }

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (this.draggingChip && this.draggingChip.x === x && this.draggingChip.y === y) {
          continue;
        }
        if (fallingSet.has(`${x},${y}`)) {
          continue;
        }
        const type = this.board.get(x, y);
        if (type >= 0) {
          const cx = this.offsetX + x * this.cellSize + this.cellSize / 2;
          const cy = this.offsetY + y * this.cellSize + this.cellSize / 2;
          const r = this.cellSize * 0.4;

          if (type === 6) {
            this.drawBomb(this.ctx, cx, cy, r);
          } else {
            this.ctx.beginPath();
            this.ctx.arc(cx, cy, r, 0, Math.PI * 2);
            this.ctx.fillStyle = CHIP_COLORS[type % CHIP_COLORS.length];
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
          }
        }
      }
    }
  }

  drawBomb(ctx, x, y, radius) {
    // Корпус бомбы — восьмиугольник
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fillStyle = '#333';
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Детонатор
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.6, radius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = '#ff0000';
    ctx.fill();

    // Иконка
    ctx.font = `${radius * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffcc00';
    ctx.fillText('💥', x, y);
  }

  resize(w, h) {
    this.canvas.width = w;
    this.canvas.height = h;
    this.cellSize = Math.min(w, h) / 10;
    this.offsetX = (w - this.board.width * this.cellSize) / 2;
    this.offsetY = (h - this.board.height * this.cellSize) / 2;
  }
}