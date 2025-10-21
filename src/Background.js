export class Background {
    constructor() {
      // Позже сюда можно добавить изображение или градиент
      this.color = '#1a1a2e'; // тёмно-синий фон
    }
  
    draw(ctx, width, height) {
      ctx.fillStyle = this.color;
      ctx.fillRect(0, 0, width, height);
    }
  
    // Метод для смены фона из настроек (в будущем)
    setColor(color) {
      this.color = color;
    }
  }