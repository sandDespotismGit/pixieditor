import { Container, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

export default class WidgetsGrid {
    constructor(app) {
        this.container = new Container();
        this.container.position.set(100, 100);
        app.stage.addChild(this.container);

        // Параметры стиля
        const width = 300;
        const height = app.screen.height - 200;
        const borderRadius = 20;
        const bgColor = 0x2C2C2C;       // Основной цвет фона
        const borderColor = 0x4F4F4F;    // RGB(79, 79, 79) в HEX
        const borderWidth = 2;           // Толщина бордера

        // Создаем фон с закругленными углами и бордером
        const bg = new Graphics();

        // 1. Рисуем бордер (немного больше основного фона)
        bg.beginFill(borderColor);
        bg.drawRoundedRect(
            0,
            0,
            width + borderWidth * 2,
            height + borderWidth * 2,
            borderRadius + borderWidth
        );
        bg.endFill();

        // 2. Рисуем основной фон (поверх бордера, с отступом)
        bg.beginFill(bgColor);
        bg.drawRoundedRect(
            borderWidth,
            borderWidth,
            width,
            height,
            borderRadius
        );
        bg.endFill();

        this.container.addChild(bg);
    }
}