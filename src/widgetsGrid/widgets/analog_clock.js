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
        // === Сохраняем стили ===
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? 32;

        this._borderColor = options.borderColor ?? 0xffffff;
        this._borderAlpha = options.borderAlpha ?? 1;
        this._borderWidth = options.borderWidth ?? 0;
        this.bg = bg;
        this.clockType = options.clockType || 1;
        this.centerClockColor = options.centerClockColor

        // Центр часов
        this.centerX = width / 2;
        this.centerY = height / 2;
        this.radius = Math.min(width, height) / 2 - 10;

        // Создаем графический объект для рисования часов
        this.clockGraphics = new Graphics();
        content.addChild(this.clockGraphics);

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
        ctx.fill({ color: this.centerClockColor ?? 0xffffff });
        ctx.stroke({ width: 2, color: this.centerClockColor ?? 0xffffff });

        // Дополнительные элементы в зависимости от типа
        switch (this.clockType) {
            case 1:
                this.drawHourDots(ctx, centerX, centerY, radius, 4, 0x737373)
                this.type = "analog-1"
                break;
            case 2:
                this.type = "analog-2"
                break;
            case 3:
                this.drawSecondDots(ctx, centerX, centerY, radius, 3, 0xcccccc);
                this.drawHourDots(ctx, centerX, centerY, radius, 3, 0x737373);
                this.type = "analog-3"
                break;
            case 4:
                this.drawHourLines(ctx, centerX, centerY, radius, 4, 0x737373);
                this.type = "analog-4"
                break;
            case 5:
                this.drawHourDots(ctx, centerX, centerY, radius, 4, 0x737373)
                this.type = "analog-5"
                break;
            case 6:
                this.drawHourLines(ctx, centerX, centerY, radius, 4, 0xffffff);
                this.type = "analog-6"
                break;
            case 7:
                this.drawSecondDots(ctx, centerX, centerY, radius, 3, 0x404040);
                this.drawHourDots(ctx, centerX, centerY, radius, 4, 0xffffff)
                this.type = "analog-7"
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
                this.drawDoubleHand(ctx, centerX, centerY, (seconds * Math.PI) / 30, radius, 12, 0xfb9739, 0xffffff, 0.89, 0.9);
                this.drawDoubleHand(ctx, centerX, centerY, (minutes * Math.PI) / 30, radius, 8, 0x737373, 0xffffff, 0.35, 0.7);
                this.drawSimpleHoursArrow(ctx, centerX, centerY, Math.PI * 2 * ((hours + minutes / 60) / 12) - Math.PI / 2, radius * 0.35, 12, 0x1e1e1e);

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

    // 1, 3, 5, 7 часы
    drawHourDots = (ctx, centerX, centerY, radius, size, color) => {
        for (let i = 0; i < 12; i++) {
            const angle = (i * 2 * Math.PI) / 12;
            const x = centerX + Math.cos(angle) * radius * 0.95;
            const y = centerY + Math.sin(angle) * radius * 0.95;

            ctx.circle(x, y, size);
            ctx.fill({ color: color });
        }
    }
    // 3, 7 часы
    drawSecondDots = (ctx, centerX, centerY, radius, size, color) => {
        for (let i = 0; i < 60; i++) {
            const angle = (i * 2 * Math.PI) / 60;
            const x = centerX + Math.cos(angle) * radius * 0.95;
            const y = centerY + Math.sin(angle) * radius * 0.95;

            ctx.circle(x, y, size);
            ctx.fill({ color: color });
        }
    }
    // 4, 6 часы
    drawHourLines = (ctx, centerX, centerY, radius, width, color) => {
        for (let i = 0; i < 12; i++) {
            const angle = (i * 2 * Math.PI) / 12;
            const x1 = centerX + Math.cos(angle) * radius * 0.85;
            const y1 = centerY + Math.sin(angle) * radius * 0.85;
            const x2 = centerX + Math.cos(angle) * radius * 0.75;
            const y2 = centerY + Math.sin(angle) * radius * 0.75;

            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke({ width: width, color: color, cap: 'round' });
        }
    }

    // Для 1 и 5 часов
    drawSimpleSecondArrow = (ctx, centerX, centerY, angle, length, width, color) => {
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.sin(angle) * length,
            centerY - Math.cos(angle) * length
        );
        ctx.stroke({ width: width, color: color, cap: 'round' });
    }
    drawSimpleMinutesArrow = (ctx, centerX, centerY, angle, length, width, color) => {
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.sin(angle) * length,
            centerY - Math.cos(angle) * length
        );
        ctx.stroke({ width: width, color: color, cap: 'round' });
    }
    drawSimpleHoursArrow = (ctx, centerX, centerY, angle, length, width, color) => {
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle) * length,
            centerY + Math.sin(angle) * length
        );
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
    }
    // секундные стрелки с хвостом
    drawArrow = (ctx, centerX, centerY, angle, mainLength, backLength, width, color) => {
        // Основная линия (как в вашем оригинальном коде)
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX + Math.cos(angle) * mainLength,
            centerY + Math.sin(angle) * mainLength
        );

        ctx.moveTo(centerX, centerY);
        ctx.lineTo(
            centerX - Math.cos(angle) * backLength,
            centerY - Math.sin(angle) * backLength
        );

        ctx.stroke({ width: width, color: color, cap: 'round' });
    }
    drawCenterCircle = (ctx, centerX, centerY, size, color, addColor) => {
        ctx.circle(centerX, centerY, size);
        ctx.fill({ color: color ?? 0xffffff });
        ctx.stroke({ width: 1, color: addColor ?? 0xffffff });
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
    // === API для управления стилем ===
    _redrawBackground() {
        this.bg.clear();

        // Фон
        this.bg.beginFill(this._backgroundColor, this._backgroundAlpha)
            .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
            .endFill();

        // Рамка
        if (this._borderWidth > 0) {
            this.bg.lineStyle(this._borderWidth, this._borderColor, this._borderAlpha);
            this.bg.drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius);
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

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}