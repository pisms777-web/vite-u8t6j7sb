// src/LevelManager.js

export class LevelManager {
    constructor() {
      this.currentLevel = 1;
      this.movesLeft = 25;
      this.blueDestroyed = 0;
      this.targetBlue = this.getTargetForLevel(this.currentLevel);
    }
  
    getTargetForLevel(level) {
      const targets = [10, 12, 13, 15, 16, 18, 20, 22, 24, 25];
      return targets[Math.min(level - 1, 9)];
    }
  
    useMove() {
      if (this.movesLeft > 0) {
        this.movesLeft--;
        return true;
      }
      return false;
    }
  
    addBlueDestroyed(count = 1) {
      this.blueDestroyed += count;
    }
  
    isLevelComplete() {
      return this.blueDestroyed >= this.targetBlue;
    }
  
    isGameOver() {
      return this.movesLeft <= 0 && !this.isLevelComplete();
    }
  
    nextLevel() {
      if (this.currentLevel < 10) {
        this.currentLevel++;
        this.reset();
        return false;
      }
      return true; // финальная победа
    }
  
    reset() {
      this.movesLeft = 25;
      this.blueDestroyed = 0;
      this.targetBlue = this.getTargetForLevel(this.currentLevel);
    }
  
    draw(ctx, width, height) {
      ctx.font = '18px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'right';
      ctx.fillText(`Ходы: ${this.movesLeft}`, width - 20, 30);
      ctx.fillText(`Синие: ${this.blueDestroyed} / ${this.targetBlue}`, width - 20, 60);
      ctx.textAlign = 'center';
      ctx.fillText(`Уровень ${this.currentLevel}/10`, width / 2, 30);
    }
  }