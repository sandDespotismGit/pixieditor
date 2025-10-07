// AnalogClockWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class AnalogClockWidget extends DraggableWidget {
  constructor(bounds, width, height, options = {}) {
    const content = new Container();

    // Фон виджета
    const bg = new Graphics();
    bg.beginFill(
      options.backgroundColor ?? 0x1e1e1e,
      options.backgroundAlpha ?? 1,
    )
      .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
      .endFill();
    content.addChild(bg);

    super(bounds, content, options);
    // Сохраняем исходные размеры для масштабирования
    this.originalWidth = width;
    this.originalHeight = height;
    this.contentContainer = new Container();
    content.addChild(this.contentContainer);
    this._width = width;
    this._height = height;
    // === Сохраняем стили ===
    this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
    this._backgroundAlpha = options.backgroundAlpha ?? 1;
    this._cornerRadius = options.cornerRadius ?? 32;

    this._borderColor = options.borderColor ?? 0xffffff;
    this._borderAlpha = options.borderAlpha ?? 1;
    this._borderWidth = options.borderWidth ?? 0;
    this.bg = bg;
    this.clockType = options.clockType || 1;

    // Центр часов
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.radius = Math.min(width, height) / 2 - 10;

    // Создаем графический объект для рисования часов
    this.clockGraphics = new Graphics();
    this.contentContainer.addChild(this.clockGraphics);

    // Обновляем часы сразу и устанавливаем интервал
    this.updateClock();
    this._timer = setInterval(() => this.updateClock(), 100);
  }

  updateClock() {
    const now = new Date();
    this.clockGraphics.clear();

    // Рисуем циферблат в зависимости от типа часов
    this.drawClockFace();

    // Рисуем стрелки в зависимости от типа часов
    this.drawHands(now);
  }

  drawClockFace() {
    const ctx = this.clockGraphics;
    const centerX = this.centerX;
    const centerY = this.centerY;
    const radius = this.radius;

    // Базовый циферблат для всех типов
    ctx.circle(centerX, centerY, radius);
    ctx.fill({ color: 0xffffff });
    ctx.stroke({ width: 2, color: 0xffffff });

    // Дополнительные элементы в зависимости от типа
    switch (this.clockType) {
      case 1:
        this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0x737373);
        this.type = "analog-1";
        break;
      case 2:
        // Простой циферблат без меток
        this.type = "analog-2";
        break;
      case 3:
        this.drawDots(ctx, centerX, centerY, radius, 60, 3, 0xcccccc);
        this.drawDots(ctx, centerX, centerY, radius, 12, 3, 0x6f6f6f);
        this.drawNumbers(ctx, centerX, centerY, radius);
        this.type = "analog-3";
        break;
      case 4:
        this.drawLines(ctx, centerX, centerY, radius, 12, 4, 0x737373);
        this.type = "analog-4";
        break;
      case 5:
        this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0x737373);
        this.type = "analog-5";
        break;
      case 6:
        this.drawLines(ctx, centerX, centerY, radius, 12, 4, 0xffffff);
        this.type = "analog-6";
        break;
      case 7:
        this.drawDots(ctx, centerX, centerY, radius, 60, 4, 0x404040);
        this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0xffffff);
        this.drawNumbersWhite(ctx, centerX, centerY, radius);
        this.type = "analog-7";
        break;
      case 8:
        this.drawDots(ctx, centerX, centerY, radius, 12, 5, 0xffffff);
        this.type = "analog-8";
        break;
    }
  }

  drawHands(now) {
    const ctx = this.clockGraphics;
    const centerX = this.centerX;
    const centerY = this.centerY;
    const radius = this.radius;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    switch (this.clockType) {
      case 1:
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius * 0.35,
          12,
          0x404040,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius * 0.65,
          8,
          0x737373,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (seconds * Math.PI) / 30,
          radius * 0.93,
          4,
          0xcccccc,
        );
        break;

      case 2:
        this.drawComplexHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0x737373,
          0.43,
          0.33,
        );
        this.drawComplexHand(
          ctx,
          centerX,
          centerY,
          (seconds * Math.PI) / 30,
          radius,
          12,
          0xfb9739,
          0.9,
          1.0,
        );
        this.drawComplexHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          12,
          0x1e1e1e,
          1.0,
          0.3,
        );

        // Центральный кружок
        ctx.circle(centerX, centerY, 10);
        ctx.fill({ color: 0xffffff });
        break;

      case 3:
      case 4:
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          8,
          0xffffff,
          0x737373,
          0.2,
          0.25,
        );
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0xffffff,
          0x737373,
          0.2,
          0.4,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius);
        break;

      case 5:
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius * 0.35,
          12,
          0x737373,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius * 0.65,
          8,
          0xcccccc,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (seconds * Math.PI) / 30,
          radius * 0.9,
          4,
          0xffffff,
        );
        break;

      case 6:
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          8,
          0xffffff,
          0xffffff,
          0.2,
          0.25,
        );
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0xffffff,
          0xffffff,
          0.2,
          0.4,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius, 0x737373);
        break;

      case 7:
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          8,
          0x737373,
          0x737373,
          0.2,
          0.25,
        );
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0x737373,
          0x737373,
          0.2,
          0.4,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius, 0xffffff);
        break;

      case 8:
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius * 0.45,
          8,
          0xffffff,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius * 0.7,
          8,
          0xffffff,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius, 0xffffff);
        break;
    }
  }

  drawHand(ctx, centerX, centerY, angle, length, width, color) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.sin(angle) * length,
      centerY - Math.cos(angle) * length,
    );
    ctx.stroke({ width: width, color: color, cap: "round" });
  }

  drawComplexHand(
    ctx,
    centerX,
    centerY,
    angle,
    radius,
    width,
    color,
    startRatio,
    endRatio,
  ) {
    const startLength = radius * startRatio;
    const endLength = radius * endRatio;

    const startX = centerX + Math.sin(angle) * startLength;
    const startY = centerY - Math.cos(angle) * startLength;
    const endX = centerX + Math.sin(angle) * endLength;
    const endY = centerY - Math.cos(angle) * endLength;

    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke({ width: width, color: color, cap: "round" });
  }

  drawDoubleHand(
    ctx,
    centerX,
    centerY,
    angle,
    radius,
    width,
    outerColor,
    innerColor,
    innerRatio,
    outerRatio,
  ) {
    this.drawComplexHand(
      ctx,
      centerX,
      centerY,
      angle,
      radius,
      width,
      outerColor,
      innerRatio,
      outerRatio,
    );
    this.drawComplexHand(
      ctx,
      centerX,
      centerY,
      angle,
      radius,
      width - 4,
      innerColor,
      0,
      innerRatio,
    );
  }

  drawSecondHand(ctx, centerX, centerY, seconds, radius, color = 0x000000) {
    const angle = (seconds * Math.PI) / 30 - Math.PI / 2;

    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius * 0.9,
      centerY + Math.sin(angle) * radius * 0.9,
    );
    ctx.stroke({ width: 3, color: color, cap: "round" });

    // Центральный кружок
    ctx.circle(centerX, centerY, 4);
    ctx.fill({ color: color });
  }

  drawDots(ctx, centerX, centerY, radius, count, size, color) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x = centerX + Math.cos(angle) * radius * 0.95;
      const y = centerY + Math.sin(angle) * radius * 0.95;

      ctx.circle(x, y, size);
      ctx.fill({ color: color });
    }
  }

  drawLines(ctx, centerX, centerY, radius, count, width, color) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x1 = centerX + Math.cos(angle) * radius * 0.85;
      const y1 = centerY + Math.sin(angle) * radius * 0.85;
      const x2 = centerX + Math.cos(angle) * radius * 0.75;
      const y2 = centerY + Math.sin(angle) * radius * 0.75;

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke({ width: width, color: color, cap: "round" });
    }
  }

  drawNumbers(ctx, centerX, centerY, radius) {
    const style = new TextStyle({
      fontFamily: "Rubik",
      fontSize: radius * 0.18,
      fill: 0x000000,
      fontWeight: 300,
    });

    for (let num = 1; num <= 12; num++) {
      const angle = (num * Math.PI) / 6;
      const x = centerX + Math.sin(angle) * radius * 0.8;
      const y = centerY - Math.cos(angle) * radius * 0.8;

      const text = new Text(num.toString(), style);
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      this.contentContainer.addChild(text);
    }
  }

  drawNumbersWhite(ctx, centerX, centerY, radius) {
    const style = new TextStyle({
      fontFamily: "Rubik",
      fontSize: radius * 0.18,
      fill: 0xffffff,
      fontWeight: 300,
    });

    for (let num = 1; num <= 12; num++) {
      const angle = (num * Math.PI) / 6;
      const x = centerX + Math.sin(angle) * radius * 0.75;
      const y = centerY - Math.cos(angle) * radius * 0.75;

      const text = new Text(num.toString(), style);
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      this.contentContainer.addChild(text);
    }
  }
  onResize(width, height) {
    this._width = width;
    this._height = height;

    // Рассчитываем масштаб
    const scaleX = width / this.originalWidth;
    const scaleY = height / this.originalHeight;
    console.log(scaleX, scaleY, "scale", this.content, this.contentContainer);

    // Масштабируем контейнер с контентом
    this.contentContainer.scale.set(scaleX, scaleY);

    // Перерисовываем фон
    this._redrawBackground();
  }
  // === API для управления стилем ===
  _redrawBackground() {
    this.bg.clear();

    // Фон
    this.bg
      .beginFill(this._backgroundColor, this._backgroundAlpha)
      .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
      .endFill();
  }

  setColor(color) {
    this._backgroundColor = color;
    this._redrawBackground();
  }

  setAlpha(alpha) {
    this._backgroundAlpha = alpha;
    this._redrawBackground();
  }
  setCornerRadius(radius) {
    this._cornerRadius = radius;
    this._redrawBackground();
  }

  setBackgroundColor(color) {
    this.setColor(color);
  }

  setBackgroundAlpha(alpha) {
    this.setAlpha(alpha);
  }

  destroy(options) {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    super.destroy(options);
  }
}
