import { Container, Sprite, Texture, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

export default class WidgetsGrid {
    constructor(container) {
        this.container = new Container();
        this.container.position.set(100, 100)
        container.addChild(this.container);

        // Параметры стиля
        const width = 300;
        const height = container.height - 200;
        const borderRadius = 40; // Радиус закругления
        const bgColor = 0x2C2C2C; // HEX эквивалент rgb(44, 44, 44)

        // Создаем фон с закругленными углами
        const bg = new Graphics();
        bg.beginFill(bgColor);

        // Рисуем прямоугольник с закругленными углами
        bg.drawRoundedRect(0, 0, width, height, borderRadius);
        bg.endFill();

        this.container.addChild(bg);
    }
}