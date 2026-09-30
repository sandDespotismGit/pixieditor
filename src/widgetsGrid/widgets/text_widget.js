// TextWidget.js
import { Container, Graphics, Text } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import { createWidgetFillGradient, normalizeWidgetGradient } from "../widgetGradient";

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
        this._text = options.text ?? "Здесь будет ваше объявление";

        // Текстовый элемент
        this.text = new Text(this._text, {
            fontFamily: options.fontFamily || "Arial",
            fontSize: options.fontSize || 16,
            fill: options.textColor || 0xffffff,
            align: options.textAlign || "center",
            wordWrap: true,
            wordWrapWidth: width - 20,
            lineHeight: options.lineHeight || options.fontSize || 16,
            breakWords: true
        });
        this.text.anchor.set(0.5);
        this.text.position.set(width / 2, height / 2);
        this.contentContainer.addChild(this.text);

        // Сохраняем стили для API
        this.bg = bg;
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? 32;

        this._borderColor = options.borderColor ?? 0xffffff;
        this._borderAlpha = options.borderAlpha ?? 1;
        this._borderWidth = options.borderWidth ?? 0;

        this._fontFamily = options.fontFamily || "Arial";
        this._fontSize = options.fontSize || 16;
        this._textColor = options.textColor || 0xffffff;
        this._textAlign = options.textAlign || "center";
        this._lineHeight = options.lineHeight || options.fontSize || 16;
        this._fontWeight = options.fontWeight || "normal";
        this._fontStyle = options.fontStyle || "normal";
        this._backgroundGradient = normalizeWidgetGradient(options.backgroundGradient);
        this.text.style.fontWeight = this._fontWeight;
        this.text.style.fontStyle = this._fontStyle;

        this.type = "TextWidget";

        // Рисуем начальный фон
        this._redrawBackground();
    }

    // Переопределяем метод ресайза
    onResize(width, height) {
        // Обновляем внутренние размеры
        this._width = width;
        this._height = height;

        this._refreshTextLayout();

        // Перерисовываем фон с новыми размерами
        this._redrawBackground();

        // Центрируем текст
        this.text.position.set(width / 2, height / 2);
    }

    _refreshTextLayout() {
        this.text.style.fontFamily = this._fontFamily;
        this.text.style.fontSize = Math.max(4, Number(this._fontSize) || 16);
        this.text.style.lineHeight = Math.max(
            4,
            Number(this._lineHeight) || Number(this._fontSize) || 16,
        );
        this.text.style.fill = this._textColor;
        this.text.style.align = this._textAlign;
        this.text.style.fontWeight = this._fontWeight;
        this.text.style.fontStyle = this._fontStyle;
        this.text.style.wordWrap = true;
        this.text.style.wordWrapWidth = Math.max(20, this._width - 20);
        this.text.style.breakWords = true;
        this.text.position.set(this._width / 2, this._height / 2);
    }

    // === API для управления стилем ===
    _redrawBackground() {
        this.bg.clear();

        // Фон
        this.bg.drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius);
        const gradient = createWidgetFillGradient(
            this._backgroundGradient,
            this._width,
            this._height,
        );
        if (gradient) {
            this.bg.fill(gradient);
            this.bg.alpha = this._backgroundAlpha;
        } else {
            this.bg.alpha = 1;
            this.bg.fill({ color: this._backgroundColor, alpha: this._backgroundAlpha });
        }

        // Рамка
        if (this._borderWidth > 0 && this._borderAlpha > 0) {
            const inset = this._borderWidth / 2;
            this.bg
                .roundRect(
                    inset,
                    inset,
                    Math.max(0, this._width - this._borderWidth),
                    Math.max(0, this._height - this._borderWidth),
                    Math.max(0, this._cornerRadius - inset),
                )
                .stroke({
                    width: this._borderWidth,
                    color: this._borderColor,
                    alpha: this._borderAlpha,
                });
        }
    }

    // Методы для управления текстом
    setText(newText) {
        this._text = newText;
        this.text.text = newText;
        this._refreshTextLayout();
        return this;
    }

    // Установка многострочного текста с поддержкой \n
    setMultilineText(lines) {
        if (Array.isArray(lines)) {
            this._text = lines.join('\n');
        } else {
            this._text = String(lines);
        }
        this.text.text = this._text;
        this._refreshTextLayout();
        return this;
    }

    // Добавление строки
    addLine(line) {
        if (this._text) {
            this._text += '\n' + line;
        } else {
            this._text = line;
        }
        this.text.text = this._text;
        this._refreshTextLayout();
        return this;
    }

    // Добавляем текст (аппенд)
    appendText(additionalText) {
        this._text += additionalText;
        this.text.text = this._text;
        this._refreshTextLayout();
        return this;
    }

    // Очистка текста
    clearText() {
        this._text = "";
        this.text.text = "";
        this._refreshTextLayout();
        return this;
    }

    setTextStyle(style) {
        // Обновляем сохраненные стили
        if (style.fontFamily) this._fontFamily = style.fontFamily;
        if (style.fontSize) this._fontSize = Number(style.fontSize) || this._fontSize;
        if (style.fill !== undefined) this._textColor = style.fill;
        if (style.align) this._textAlign = style.align;
        if (style.lineHeight) this._lineHeight = Number(style.lineHeight) || this._lineHeight;
        if (style.fontWeight) this._fontWeight = style.fontWeight;
        if (style.fontStyle) this._fontStyle = style.fontStyle;

        this.onResize(this._width, this._height);

        return this;
    }

    // Методы для управления фоном
    setColor(color) {
        this._backgroundColor = color;
        this._redrawBackground();
        return this;
    }

    setAlpha(alpha) {
        this._backgroundAlpha = alpha;
        this._redrawBackground();
        return this;
    }

    setCornerRadius(radius) {
        this._cornerRadius = radius;
        this._redrawBackground();
        return this;
    }

    setBackgroundColor(color) {
        this._backgroundGradient = null;
        this.setColor(color);
        return this;
    }

    setBackgroundGradient(gradient) {
        this._backgroundGradient = normalizeWidgetGradient(gradient);
        this._redrawBackground();
        return this;
    }

    setBackgroundAlpha(alpha) {
        this.setAlpha(alpha);
        return this;
    }

    // Методы для рамки
    setBorder(color, width = 1, alpha = 1) {
        this._borderColor = color;
        this._borderWidth = width;
        this._borderAlpha = alpha;
        this._redrawBackground();
        return this;
    }

    removeBorder() {
        this._borderWidth = 0;
        this._redrawBackground();
        return this;
    }

    // Методы для шрифта
    setFontFamily(fontFamily) {
        this._fontFamily = fontFamily;
        this._refreshTextLayout();
        return this;
    }

    setFontSize(size) {
        this._fontSize = Number(size) || this._fontSize;
        this.onResize(this._width, this._height);
        return this;
    }

    setTextColor(color) {
        this._textColor = color;
        this._refreshTextLayout();
        return this;
    }

    setTextAlign(align) {
        this._textAlign = align;
        this._refreshTextLayout();
        return this;
    }

    setLineHeight(height) {
        this._lineHeight = height;
        this.onResize(this._width, this._height);
        return this;
    }

    setFontWeight(weight) {
        this._fontWeight = weight || "normal";
        this._refreshTextLayout();
        return this;
    }

    setFontStyle(style) {
        this._fontStyle = style || "normal";
        this._refreshTextLayout();
        return this;
    }

    // Геттеры для получения свойств
    getText() {
        return this._text;
    }

    getLines() {
        return this._text.split('\n');
    }

    getFontFamily() {
        return this._fontFamily;
    }

    getFontSize() {
        return this._fontSize;
    }

    getTextColor() {
        return this._textColor;
    }

    getBackgroundColor() {
        return this._backgroundColor;
    }

    getBackgroundAlpha() {
        return this._backgroundAlpha;
    }

    getCornerRadius() {
        return this._cornerRadius;
    }

    // Получение текущих стилей
    getTextStyle() {
        return {
            fontFamily: this._fontFamily,
            fontSize: this._fontSize,
            fill: this._textColor,
            align: this._textAlign,
            lineHeight: this._lineHeight,
            fontWeight: this._fontWeight,
            fontStyle: this._fontStyle,
            wordWrap: true,
            wordWrapWidth: this.text.style.wordWrapWidth,
            breakWords: true
        };
    }

    getSceneData() {
        return {
            textData: {
                text: this._text,
                fontFamily: this._fontFamily,
                fontSize: this._fontSize,
                textColor: this._textColor,
                textAlign: this._textAlign,
                lineHeight: this._lineHeight,
                fontWeight: this._fontWeight,
                fontStyle: this._fontStyle,
                backgroundGradient: this._backgroundGradient,
            }
        };
    }

    // Экспорт состояния
    exportState() {
        return {
            ...super.exportState(),
            type: this.type,
            text: this._text,
            styles: {
                backgroundColor: this._backgroundColor,
                backgroundAlpha: this._backgroundAlpha,
                cornerRadius: this._cornerRadius,
                borderColor: this._borderColor,
                borderAlpha: this._borderAlpha,
                borderWidth: this._borderWidth,
                fontFamily: this._fontFamily,
                fontSize: this._fontSize,
                textColor: this._textColor,
                textAlign: this._textAlign,
                lineHeight: this._lineHeight
            }
        };
    }

    // Импорт состояния
    importState(state) {
        super.importState(state);

        if (state.text) {
            this.setText(state.text);
        }

        if (state.styles) {
            const styles = state.styles;
            this._backgroundColor = styles.backgroundColor ?? this._backgroundColor;
            this._backgroundAlpha = styles.backgroundAlpha ?? this._backgroundAlpha;
            this._cornerRadius = styles.cornerRadius ?? this._cornerRadius;
            this._borderColor = styles.borderColor ?? this._borderColor;
            this._borderAlpha = styles.borderAlpha ?? this._borderAlpha;
            this._borderWidth = styles.borderWidth ?? this._borderWidth;

            this.setTextStyle({
                fontFamily: styles.fontFamily ?? this._fontFamily,
                fontSize: styles.fontSize ?? this._fontSize,
                fill: styles.textColor ?? this._textColor,
                align: styles.textAlign ?? this._textAlign,
                lineHeight: styles.lineHeight ?? this._lineHeight
            });

            this._redrawBackground();
        }

        return this;
    }

    destroy(options) {
        this.text.destroy();
        this.bg.destroy();
        super.destroy(options);
    }
}
