// AnalogClockWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class AnalogClockWidget extends DraggableWidget {
    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        super(bounds, content, options);

        this._width = width;
        this._height = height;
        this.bg = bg;
        this.clockType = options.clockType || 1;

        // Сохраняем стили
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? 32;

        this._borderColor = options.borderColor ?? 0xffffff;
        this._borderAlpha = options.borderAlpha ?? 1;
        this._borderWidth = options.borderWidth ?? 0;

        // Центр часов
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.radius = Math.min(width, height) / 2 - 10;

        // Графика для часов
        this.clockGraphics = new Graphics();
        content.addChild(this.clockGraphics);

        // Первая отрисовка
        this._redrawBackground();

        // Обновляем часы сразу и запускаем таймер
        this.updateClock();
        this._timer = setInterval(() => this.updateClock(), 100);
    }

    // === API для управления стилем ===
    _redrawBackground() {
        this.bg.clear();

        // Фон
        this.bg.beginFill(this._backgroundColor, this._backgroundAlpha)
            .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
            .endFill();

        // Рамка (если есть толщина)
        if (this._borderWidth > 0) {
            this.bg.lineStyle(this._borderWidth, this._borderColor, this._borderAlpha);
            this.bg.drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius);
            this.bg.endFill();
        }
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

    // === Методы для рамки ===
    setBorderColor(color) {
        this._borderColor = color;
        this._redrawBackground();
    }

    setBorderAlpha(alpha) {
        this._borderAlpha = alpha;
        this._redrawBackground();
    }

    setBorderWidth(width) {
        this._borderWidth = width;
        this._redrawBackground();
    }

    // === Размеры ===
    setSize(width, height) {
        this._width = width;
        this._height = height;
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.radius = Math.min(width, height) / 2 - 10;
        this._redrawBackground();
    }

    // === Рендер часов ===
    updateClock() {
        const now = new Date();
        this.clockGraphics.clear();
        this.drawClockFace();
        this.drawHands(now);
    }

    drawClockFace() {
        const ctx = this.clockGraphics;
        const centerX = this.centerX;
        const centerY = this.centerY;
        const radius = this.radius;

        // Базовый круг циферблата
        ctx.circle(centerX, centerY, radius);
        ctx.fill({ color: this.bgDial ?? 0xffffff });
        ctx.stroke({ width: 2, color: this.strokeDial ?? 0xffffff });

        // Типы циферблатов
        switch (this.clockType) {
            case 1:
                this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0x737373);
                this.type = "analog-1";
                break;
            case 2:
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
                this.drawSimpleHoursArrow(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12) - Math.PI / 2, radius * 0.35, 12, 0x404040);
                this.drawSimpleMinutesArrow(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius * 0.65, 8, 0x737373);
                this.drawSimpleSecondArrow(ctx, centerX, centerY, (seconds * Math.PI) / 30, radius * 0.93, 4, 0xcccccc);
                break;
            case 2:
                this.drawComplexHand(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius, 8, 0x737373, 0.43, 0.33);
                this.drawComplexHand(ctx, centerX, centerY, (seconds * Math.PI) / 30, radius, 12, 0xfb9739, 0.9, 1.0);
                this.drawComplexHand(ctx, centerX, centerY, (hours * Math.PI) / 6, radius, 12, 0x1e1e1e, 1.0, 0.3);
                ctx.circle(centerX, centerY, 10);
                ctx.fill({ color: 0xffffff });
                break;
            case 3:
                this.drawNumbers(ctx, centerX, centerY, radius, 0x000000)
                this.drawDoubleHand(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius, 8, 0x737373, 0x737373, 0.15, 0.5);
                this.drawDoubleHand(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12), radius, 8, 0x737373, 0x737373, 0.15, 0.35);
                this.drawCenterCircle(ctx, centerX, centerY, 5, 0x737373, 0x737373)
                this.drawCenterCircle(ctx, centerX, centerY, 3, 0x000000, 0x000000)
                this.drawArrow(ctx, centerX, centerY, (seconds * Math.PI) / 30 - Math.PI / 2, (60 * 25) / 14, 20, 3, 0x000000);
                break;
            case 4:
                this.drawDoubleHand(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius, 8, 0x737373, 0x737373, 0.15, 0.5);
                this.drawDoubleHand(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12), radius, 8, 0x737373, 0x737373, 0.15, 0.35);
                this.drawCenterCircle(ctx, centerX, centerY, 5, 0x737373, 0x737373)
                this.drawArrow(ctx, centerX, centerY, (seconds * Math.PI) / 30 - Math.PI / 2, (60 * 25) / 14, 20, 3, 0xfb9739);
                this.drawCenterCircle(ctx, centerX, centerY, 3, 0xffffff, 0xfb9739)

                break;
            case 5:
                this.drawSimpleHoursArrow(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12) - Math.PI / 2, radius * 0.35, 12, 0x737373);
                this.drawSimpleMinutesArrow(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius * 0.65, 8, 0xcccccc);
                this.drawSimpleSecondArrow(ctx, centerX, centerY, (seconds * Math.PI) / 30, radius * 0.93, 4, 0xffffff);
                break;
            case 6:
                this.drawDoubleHand(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius, 8, 0xffffff, 0xffffff, 0.15, 0.5);
                this.drawDoubleHand(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12), radius, 8, 0xffffff, 0xffffff, 0.15, 0.35);
                this.drawCenterCircle(ctx, centerX, centerY, 5, 0xffffff, 0xffffff)
                this.drawArrow(ctx, centerX, centerY, (seconds * Math.PI) / 30 - Math.PI / 2, (60 * 25) / 14, 20, 3, 0x737373);
                this.drawCenterCircle(ctx, centerX, centerY, 3, 0xffffff, 0x737373)
                break;
            case 7:
                this.drawNumbers(ctx, centerX, centerY, radius, 0xffffff)
                this.drawDoubleHand(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius, 8, 0x737373, 0x737373, 0.15, 0.5);
                this.drawDoubleHand(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12), radius, 8, 0x737373, 0x737373, 0.15, 0.35);
                this.drawCenterCircle(ctx, centerX, centerY, 5, 0x737373, 0x737373)
                this.drawCenterCircle(ctx, centerX, centerY, 3, 0xffffff, 0xffffff)
                this.drawArrow(ctx, centerX, centerY, (seconds * Math.PI) / 30 - Math.PI / 2, (60 * 25) / 14, 20, 3, 0xffffff);
                break;
        }
    }

    // === Рисовалки стрелок и элементов ===
    drawHand(ctx, centerX, centerY, angle, length, width, color) {
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.sin(angle) * length, centerY - Math.cos(angle) * length);
        ctx.stroke({ width: width, color: color, cap: 'round' });
    }

    drawComplexHand(ctx, centerX, centerY, angle, radius, width, color, startRatio, endRatio) {
        const startLength = radius * startRatio;
        const endLength = radius * endRatio;
        const startX = centerX + Math.sin(angle) * startLength;
        const startY = centerY - Math.cos(angle) * startLength;
        const endX = centerX + Math.sin(angle) * endLength;
        const endY = centerY - Math.cos(angle) * endLength;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke({ width: width, color: color, cap: 'round' });
    }
    // 3, 4, 6, 7 часовые и минутные стрелки
    drawDoubleHand(ctx, centerX, centerY, angle, radius, width, outerColor, innerColor, innerRatio, outerRatio) {
        this.drawComplexHand(ctx, centerX, centerY, angle, radius, width - 4, innerColor, 0, innerRatio);
        this.drawComplexHand(ctx, centerX, centerY, angle, radius, width, outerColor, innerRatio, outerRatio);
        this.drawComplexHand(ctx, centerX, centerY, angle, radius, width - 4, innerColor, 0, innerRatio);
    }

    drawSecondHand(ctx, centerX, centerY, seconds, radius, color = 0x000000) {
        const angle = (seconds * Math.PI / 30) - (Math.PI / 2);
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(centerX + Math.cos(angle) * radius * 0.9, centerY + Math.sin(angle) * radius * 0.9);
        ctx.stroke({ width: 3, color: color, cap: 'round' });
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
            ctx.stroke({ width: width, color: color, cap: 'round' });
        }
    }
    // 3, 7 часы
    drawNumbers(ctx, centerX, centerY, radius, color) {
        const style = new TextStyle({
            fontFamily: "Rubik",
            fontSize: radius * 0.18,
            fill: color,
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
            this.content.addChild(text);
        }
    }

    drawNumbersWhite(ctx, centerX, centerY, radius) {
        const style = new TextStyle({
            fontFamily: "Rubik",
            fontSize: radius * 0.18,
            fill: 0xffffff,
            fontWeight: 300
        });
        for (let num = 1; num <= 12; num++) {
            const angle = (num * Math.PI) / 6;
            const x = centerX + Math.sin(angle) * radius * 0.75;
            const y = centerY - Math.cos(angle) * radius * 0.75;
            const text = new Text(num.toString(), style);
            text.anchor.set(0.5);
            text.x = x;
            text.y = y;
            this.content.addChild(text);
        }
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}
