// src/main.js

import { Background } from './Background.js';
import { Board } from './Board.js';
import { Renderer } from './Renderer.js';
import { Game } from './Game.js';
import { ScoreManager } from './ScoreManager.js';
import { LevelManager } from './LevelManager.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.style.display = 'block';

const background = new Background();
const board = new Board(8, 8);
const renderer = new Renderer(canvas, background, board);
const scoreManager = new ScoreManager();
const levelManager = new LevelManager();
const game = new Game(board, renderer, scoreManager, levelManager);

function gameLoop() {
  renderer.draw();
  game.drawOverlay();
  scoreManager.draw(renderer.ctx, canvas.width, canvas.height);
  levelManager.draw(renderer.ctx, canvas.width, canvas.height);
  requestAnimationFrame(gameLoop);
}

renderer.resize(window.innerWidth, window.innerHeight);
gameLoop();

window.addEventListener('resize', () => {
  renderer.resize(window.innerWidth, window.innerHeight);
});