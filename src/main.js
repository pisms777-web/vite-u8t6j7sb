import { Background } from './Background.js';
import { Board } from './Board.js';
import { Renderer } from './Renderer.js';
import { Game } from './Game.js';

const canvas = document.createElement('canvas');
document.body.appendChild(canvas);
canvas.style.display = 'block';

const background = new Background();
const board = new Board(8, 8);
const renderer = new Renderer(canvas, background, board);
const game = new Game(board, renderer);

// Основной цикл с отрисовкой
function gameLoop() {
  renderer.draw();
  game.drawOverlay(); // выделение и перетаскивание
  requestAnimationFrame(gameLoop);
}

renderer.resize(window.innerWidth, window.innerHeight);
gameLoop();

window.addEventListener('resize', () => {
  renderer.resize(window.innerWidth, window.innerHeight);
});