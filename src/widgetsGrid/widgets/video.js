// SimpleRectWidget.js
import { Container, Graphics } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class SimpleRectWidget extends DraggableWidget {
    constructor(bounds, options = {}) {
        const width = options.width ?? 577;
        const height = options.height ?? 377;

        const content = new Container();

        // Прямоугольник фона
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        super(bounds, content, options);

        this._width = width;
        this._height = height;

        // Сохраняем стили для API
        this.bg = bg;
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? 32;

        this._borderColor = options.borderColor ?? 0xffffff;
        this._borderAlpha = options.borderAlpha ?? 1;
        this._borderWidth = options.borderWidth ?? 0;

        this.type = "SimpleRect";

        // Рисуем начальный фон
        this._redrawBackground();
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
        super.destroy(options);
    }
}
