// src/Game.js — бомба перетаскивается, взрыв при клике без движения

import { ChipDragHandler } from './ChipDragHandler.js';

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'powerup') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
    } else if (type === 'explosion') {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(100, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    }

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
  } catch (e) {}
}

export class Game {
  constructor(board, renderer) {
    this.board = board;
    this.renderer = renderer;
    this.canvas = renderer.canvas;
    this.dragHandler = null;
    this.disappearingChips = [];
    this.fallingChips = [];
    this.isAnimating = false;
    this.bombExploding = false;

    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', () => this.onPointerUp());
    this.canvas.addEventListener('pointercancel', () => this.onPointerUp());
    this.canvas.style.touchAction = 'none';
  }

  getCellFromPoint(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    const localX = x - rect.left;
    const localY = y - rect.top;
    const cellX = Math.floor((localX - this.renderer.offsetX) / this.renderer.cellSize);
    const cellY = Math.floor((localY - this.renderer.offsetY) / this.renderer.cellSize);
    if (cellX >= 0 && cellX < this.board.width && cellY >= 0 && cellY < this.board.height) {
      return { x: cellX, y: cellY };
    }
    return null;
  }

  onPointerDown(e) {
    if (this.dragHandler || this.isAnimating) return;
    const cell = this.getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;
    const type = this.board.get(cell.x, cell.y);
    if (type === -1) return;

    // Запоминаем начальную клетку для бомбы
    this.potentialBombClick = { x: cell.x, y: cell.y, type };

    this.renderer.setDraggingChip({ x: cell.x, y: cell.y });
    this.dragHandler = new ChipDragHandler(this.board, this.renderer, e.clientX, e.clientY, cell.x, cell.y);
  }

  onPointerMove(e) {
    if (this.dragHandler) {
      this.dragHandler.update(e.clientX, e.clientY);
    }
  }

  onPointerUp() {
    if (!this.dragHandler || this.isAnimating) {
      this.potentialBombClick = null;
      return;
    }

    const targetCell = this.dragHandler.getTargetCell();
    const origX = this.dragHandler.logicalX;
    const origY = this.dragHandler.logicalY;
    const type = this.dragHandler.type;

    let madeSwap = false;
    let swappedWithBomb = false;

    if (targetCell) {
      const targetType = this.board.get(targetCell.x, targetCell.y);
      this.board.grid[origY][origX] = targetType;
      this.board.grid[targetCell.y][targetCell.x] = type;
      madeSwap = true;

      if (type === 6 || targetType === 6) {
        swappedWithBomb = true;
        const bombX = type === 6 ? targetCell.x : origX;
        const bombY = type === 6 ? targetCell.y : origY;
        this.triggerBombExplosion(bombX, bombY);
      }
    } else {
      // Не было обмена — проверяем, это был клик по бомбе?
      if (type === 6 && this.potentialBombClick) {
        // Клик без движения → взрыв
        this.triggerBombExplosion(origX, origY);
      }
    }

    this.renderer.clearDraggingChip();
    this.dragHandler.release();
    this.dragHandler = null;
    this.potentialBombClick = null;

    if (madeSwap && !swappedWithBomb) {
      const matchInfo = this.findMatchesWithSize();
      if (matchInfo.matches.length > 0) {
        this.startDisappearanceAnimation(matchInfo);
      } else {
        const currentOrig = this.board.get(origX, origY);
        this.board.grid[origY][origX] = type;
        this.board.grid[targetCell.y][targetCell.x] = currentOrig;
      }
    }
  }

  triggerBombExplosion(x, y) {
    if (this.bombExploding) return;
    this.bombExploding = true;
    playSound('explosion');

    const toRemove = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < this.board.width && ny >= 0 && ny < this.board.height) {
          if (this.board.grid[ny][nx] !== -1) {
            toRemove.push({ x: nx, y: ny, type: this.board.grid[ny][nx] });
            this.board.grid[ny][nx] = -1;
          }
        }
      }
    }

    this.disappearingChips = toRemove.map(chip => ({
      ...chip,
      progress: 0,
      phase: 'bomb',
      size: 9
    }));

    setTimeout(() => {
      this.bombExploding = false;
      this.animateDisappearance();
    }, 100);
  }

  findMatchesWithSize() {
    const toRemove = new Set();
    const matchSize = {};

    const grid = this.board.grid;
    const { width, height } = this.board;

    for (let y = 0; y < height; y++) {
      let start = 0;
      for (let x = 1; x <= width; x++) {
        if (x === width || grid[y][x] !== grid[y][x - 1] || grid[y][x] === -1 || grid[y][x] === 6) {
          const count = x - start;
          if (count >= 3) {
            if (count === 4) {
              const bombIndex = Math.floor((start + x - 1) / 2);
              for (let i = start; i < x; i++) {
                const key = `${i},${y}`;
                toRemove.add(key);
                matchSize[key] = (i === bombIndex) ? 'bomb' : count;
              }
              playSound('powerup');
            } else {
              for (let i = start; i < x; i++) {
                const key = `${i},${y}`;
                toRemove.add(key);
                matchSize[key] = count;
              }
            }
          }
          start = x;
        }
      }
    }

    for (let x = 0; x < width; x++) {
      let start = 0;
      for (let y = 1; y <= height; y++) {
        if (y === height || grid[y][x] !== grid[y - 1][x] || grid[y][x] === -1 || grid[y][x] === 6) {
          const count = y - start;
          if (count >= 3) {
            if (count === 4) {
              const bombIndex = Math.floor((start + y - 1) / 2);
              for (let i = start; i < y; i++) {
                const key = `${x},${i}`;
                toRemove.add(key);
                matchSize[key] = (i === bombIndex) ? 'bomb' : count;
              }
              playSound('powerup');
            } else {
              for (let i = start; i < y; i++) {
                const key = `${x},${i}`;
                toRemove.add(key);
                if (!matchSize[key]) matchSize[key] = count;
              }
            }
          }
          start = y;
        }
      }
    }

    return {
      matches: Array.from(toRemove).map(key => {
        const [x, y] = key.split(',').map(Number);
        return { x, y, size: matchSize[key] };
      })
    };
  }

  startDisappearanceAnimation(matchInfo) {
    this.isAnimating = true;
    this.disappearingChips = [];

    for (const { x, y, size } of matchInfo.matches) {
      if (size === 'bomb') {
        this.board.grid[y][x] = 6;
      } else {
        this.disappearingChips.push({
          x,
          y,
          type: this.board.grid[y][x],
          progress: 0,
          phase: 'flash',
          size
        });
        this.board.grid[y][x] = -1;
      }
    }

    this.animateDisappearance();
  }

  animateDisappearance() {
    if (this.disappearingChips.length === 0) {
      this.startGravityAnimation();
      return;
    }

    for (const chip of this.disappearingChips) {
      if (chip.phase === 'bomb') {
        chip.progress += 0.08;
      } else if (chip.phase === 'flash') {
        chip.progress += 0.1;
        if (chip.progress >= 1) {
          chip.progress = 0;
          chip.phase = 'fade';
        }
      } else if (chip.phase === 'fade') {
        chip.progress += 0.08;
      }
    }

    this.disappearingChips = this.disappearingChips.filter(chip => {
      return !(chip.phase === 'fade' && chip.progress >= 1) &&
             !(chip.phase === 'bomb' && chip.progress >= 1);
    });

    if (this.disappearingChips.length > 0) {
      requestAnimationFrame(() => this.animateDisappearance());
    } else {
      this.startGravityAnimation();
    }
  }

  startGravityAnimation() {
    this.fallingChips = [];
    const tempGrid = this.board.grid.map(row => [...row]);

    for (let x = 0; x < this.board.width; x++) {
      const columnChips = [];
      for (let y = this.board.height - 1; y >= 0; y--) {
        if (tempGrid[y][x] !== -1) {
          columnChips.push({ type: tempGrid[y][x], originalY: y });
        }
      }

      for (let i = 0; i < columnChips.length; i++) {
        const targetY = this.board.height - 1 - i;
        const originalY = columnChips[i].originalY;
        if (originalY !== targetY) {
          this.fallingChips.push({
            x,
            y: columnChips[i].type,
            fromY: originalY,
            toY: targetY,
            startY: originalY
          });
        }
        tempGrid[targetY][x] = columnChips[i].type;
      }

      const newCount = this.board.height - columnChips.length;
      for (let i = 0; i < newCount; i++) {
        const newType = Math.floor(Math.random() * 6);
        const targetY = newCount - 1 - i;
        this.fallingChips.push({
          x,
          y: newType,
          fromY: -1,
          toY: targetY,
          startY: - (i + 1)
        });
        tempGrid[targetY][x] = newType;
      }
    }

    this.board.grid = tempGrid;
    this.renderer.setFallingChips(this.fallingChips);
    this.animateFalling();
  }

  animateFalling() {
    if (this.fallingChips.length === 0) {
      this.renderer.setFallingChips([]);
      this.isAnimating = false;
      setTimeout(() => {
        const matchInfo = this.findMatchesWithSize();
        if (matchInfo.matches.length > 0) {
          this.startDisappearanceAnimation(matchInfo);
        }
      }, 100);
      return;
    }

    let allDone = true;
    for (const chip of this.fallingChips) {
      if (chip.progress === undefined) chip.progress = 0;
      if (chip.progress < 1) {
        chip.progress = Math.min(chip.progress + 0.05, 1);
        allDone = false;
      }
    }

    if (allDone) {
      this.fallingChips = [];
      this.renderer.setFallingChips([]);
      this.isAnimating = false;
      setTimeout(() => {
        const matchInfo = this.findMatchesWithSize();
        if (matchInfo.matches.length > 0) {
          this.startDisappearanceAnimation(matchInfo);
        }
      }, 100);
    } else {
      requestAnimationFrame(() => this.animateFalling());
    }
  }

  drawOverlay() {
    const ctx = this.renderer.ctx;
    const cellSize = this.renderer.cellSize;
    const offsetX = this.renderer.offsetX;
    const offsetY = this.renderer.offsetY;
    const radius = cellSize * 0.4;

    const CHIP_COLORS = ['#ff6b6b', '#4ecdc4', '#ffd166', '#a09abc', '#06d6a0', '#118ab2'];

    for (const chip of this.disappearingChips) {
      const centerX = offsetX + chip.x * cellSize + cellSize / 2;
      const centerY = offsetY + chip.y * cellSize + cellSize / 2;

      if (chip.phase === 'bomb') {
        const pulseRadius = radius * (1 + 1.2 * chip.progress);
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        const alpha = 1 - chip.progress;
        ctx.fillStyle = `rgba(255, 77, 77, ${alpha * 0.7})`;
        ctx.fill();
        ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
        ctx.lineWidth = 4;
        ctx.stroke();
      } else if (chip.phase === 'flash') {
        const baseColor = CHIP_COLORS[chip.type % CHIP_COLORS.length];
        const isBig = chip.size >= 4;
        const pulseRadius = radius * (1 + (isBig ? 0.6 : 0.3) * chip.progress);
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        ctx.strokeStyle = isBig ? '#ffcc00' : '#fff';
        ctx.lineWidth = isBig ? 3 : 2;
        ctx.stroke();
        if (isBig) {
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseRadius * 1.3, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255, 204, 0, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      } else if (chip.phase === 'fade') {
        const baseColor = CHIP_COLORS[chip.type % CHIP_COLORS.length];
        const alpha = 1 - chip.progress;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.globalAlpha = alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    for (const chip of this.fallingChips) {
      const centerX = offsetX + chip.x * cellSize + cellSize / 2;
      let currentY;
      if (chip.fromY === -1) {
        const startY = offsetY + chip.startY * cellSize + cellSize / 2;
        const endY = offsetY + chip.toY * cellSize + cellSize / 2;
        currentY = startY + (endY - startY) * (chip.progress || 0);
      } else {
        const startY = offsetY + chip.fromY * cellSize + cellSize / 2;
        const endY = offsetY + chip.toY * cellSize + cellSize / 2;
        currentY = startY + (endY - startY) * (chip.progress || 0);
      }

      if (chip.y === 6) {
        const r = radius;
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2;
          const px = centerX + Math.cos(angle) * r;
          const py = currentY + Math.sin(angle) * r;
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
        ctx.arc(centerX, currentY - r * 0.6, r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#ff0000';
        ctx.fill();

        ctx.font = `${r * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('💥', centerX, currentY);
      } else {
        const color = CHIP_COLORS[chip.y % CHIP_COLORS.length];
        ctx.beginPath();
        ctx.arc(centerX, currentY, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (this.dragHandler) {
      this.dragHandler.draw(ctx);
    }
  }
}