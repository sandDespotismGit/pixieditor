// TextWidget.js
import { Container, Graphics, Text } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class TextWidget extends DraggableWidget {
    constructor(bounds, options = {}) {
        const width = options.width ?? 508;
        const height = options.height ?? 115;

        const content = new Container();

        // Прямоугольник фона
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
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
        this._text = options.text ?? "Здесь будет ваше обьявление";

        // Текстовый элемент
        const text = new Text(this._text, {
            fontFamily: options.fontFamily || "Arial",
            fontSize: options.fontSize || 16,
            fill: options.textColor || 0xffffff,
            align: options.textAlign || "center",
            wordWrap: true,
            wordWrapWidth: width - 20
        });
        text.anchor.set(0.5);
        text.position.set(width / 2, height / 2);
        this.contentContainer.addChild(text);

        // Сохраняем стили для API
        this.bg = bg;
        this.text = text;
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? 32;

        this._borderColor = options.borderColor ?? 0xffffff;
        this._borderAlpha = options.borderAlpha ?? 1;
        this._borderWidth = options.borderWidth ?? 0;

        this.type = "TextWidget";

        // Рисуем начальный фон
        this._redrawBackground();
    }

    // Переопределяем метод ресайза
    onResize(width, height) {
        // Обновляем внутренние размеры
        this._width = width;
        this._height = height;

        // Обновляем перенос текста под новые размеры
        this.text.style.wordWrapWidth = width - 20;

        // Перерисовываем фон с новыми размерами
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

    // Методы для управления текстом
    setText(newText) {
        this._text = newText;
        this.text.text = newText;
    }

    setTextStyle(style) {
        this.text.style = { ...this.text.style, ...style };
        // Обновляем перенос текста при изменении стилей
        if (style.wordWrapWidth !== undefined) {
            this.text.style.wordWrapWidth = style.wordWrapWidth;
        }
    }

    // Методы для управления фоном
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

    // Геттер для получения текущего текста
    getText() {
        return this._text;
    }

    destroy(options) {
        super.destroy(options);
    }
}