// src/ChipDragHandler.js

export class ChipDragHandler {
  constructor(board, renderer, startX, startY, logicalX, logicalY) {
    this.board = board;
    this.renderer = renderer;
    this.logicalX = logicalX;
    this.logicalY = logicalY;
    this.type = board.get(logicalX, logicalY);

    const center = this.getCellCenter(logicalX, logicalY);
    this.visualX = center.x;
    this.visualY = center.y;
    this.startX = center.x;
    this.startY = center.y;

    this.isDragging = true;
    this.currentDirection = null;
  }

  getCellCenter(x, y) {
    return {
      x: this.renderer.offsetX + x * this.renderer.cellSize + this.renderer.cellSize / 2,
      y: this.renderer.offsetY + y * this.renderer.cellSize + this.renderer.cellSize / 2
    };
  }

  update(mouseX, mouseY) {
    const dx = mouseX - this.startX;
    const dy = mouseY - this.startY;
    const cellSize = this.renderer.cellSize;

    if (Math.abs(dx) > Math.abs(dy)) {
      this.currentDirection = 'h';
    } else {
      this.currentDirection = 'v';
    }

    if (this.currentDirection === 'h') {
      let newX = this.startX + dx;
      const minX = this.logicalX > 0 ? this.startX - cellSize : this.startX;
      const maxX = this.logicalX < this.board.width - 1 ? this.startX + cellSize : this.startX;
      this.visualX = Math.max(minX, Math.min(newX, maxX));
      this.visualY = this.startY;
    } else {
      let newY = this.startY + dy;
      const minY = this.logicalY > 0 ? this.startY - cellSize : this.startY;
      const maxY = this.logicalY < this.board.height - 1 ? this.startY + cellSize : this.startY;
      this.visualY = Math.max(minY, Math.min(newY, maxY));
      this.visualX = this.startX;
    }
  }

  getTargetCell() {
    const cellSize = this.renderer.cellSize;
    const threshold = cellSize * 0.6;

    if (this.currentDirection === 'h') {
      if (this.visualX > this.startX + threshold && this.logicalX < this.board.width - 1) {
        return { x: this.logicalX + 1, y: this.logicalY };
      } else if (this.visualX < this.startX - threshold && this.logicalX > 0) {
        return { x: this.logicalX - 1, y: this.logicalY };
      }
    } else {
      if (this.visualY > this.startY + threshold && this.logicalY < this.board.height - 1) {
        return { x: this.logicalX, y: this.logicalY + 1 };
      } else if (this.visualY < this.startY - threshold && this.logicalY > 0) {
        return { x: this.logicalX, y: this.logicalY - 1 };
      }
    }
    return null;
  }

  draw(ctx) {
    const radius = this.renderer.cellSize * 0.4;
    const centerX = this.visualX;
    const centerY = this.visualY;

    if (this.type === 6) {
      // Бомба
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const px = centerX + Math.cos(angle) * radius;
        const py = centerY + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = '#333';
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(centerX, centerY - radius * 0.6, radius * 0.25, 0, Math.PI * 2);
      ctx.fillStyle = '#ff0000';
      ctx.fill();

      ctx.font = `${radius * 0.6}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffcc00';
      ctx.fillText('💥', centerX, centerY);
    } else {
      const CHIP_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd166', '#a09abc', '#06d6a0', '#118ab2'];
      const color = CHIP_COLORS[this.type % CHIP_COLORS.length];
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  release() {
    this.isDragging = false;
  }
}