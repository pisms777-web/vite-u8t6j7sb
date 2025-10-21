// src/ScoreManager.js

export class ScoreManager {
    constructor() {
      this.score = 0;
      this.highScore = parseInt(localStorage.getItem('match3_highScore')) || 0;
    }
  
    addPoints(points) {
      this.score += points;
      if (this.score > this.highScore) {
        this.highScore = this.score;
        localStorage.setItem('match3_highScore', this.highScore.toString());
      }
    }
  
    reset() {
      this.score = 0;
    }
  
    draw(ctx, width, height) {
      ctx.font = '20px Arial';
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'left';
      ctx.fillText(`Счёт: ${this.score}`, 20, 30);
      ctx.fillText(`Рекорд: ${this.highScore}`, 20, 60);
    }
  }