// DigitalClockWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class DigitalClockWidget extends DraggableWidget {
    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Определяем стили в зависимости от размера виджета
        const isLarge = width === 377 && height === 115;
        const isSmall = width === 246 && height === 115;
        const isXLSingle = width === 508 && height === 246 && !options.showSeconds;
        const isXLWithSeconds = width === 508 && height === 246 && options.showSeconds;

        // Основной стиль текста
        const mainFontSize = options.fontSizeMain ??
            (isLarge || isSmall ? 70 : 140);

        const styleMain = new TextStyle({
            fontFamily: "Rubik",
            fontSize: mainFontSize,
            fill: options.textColor ?? 0xffffff,
            fontWeight: 300,
            resolution: 2
        });

        // Стиль для секунд
        const secondsFontSize = options.fontSizeAdd ??
            (isLarge ? 70 : 70);

        const styleSeconds = new TextStyle({
            fontFamily: "Rubik",
            fontSize: secondsFontSize,
            fill: options.secondsColor ?? 0x404040,
            fontWeight: 300,
            resolution: 2
        });

        // Стиль для разделителей (только для L-версии)
        const styleSeparator = new TextStyle({
            fontFamily: "Rubik",
            fontSize: 70,
            fill: options.textColor ?? 0xffffff,
            fontWeight: 300,
            resolution: 2
        });

        content.mainTexts = [];
        content.separators = [];
        content.secondsText = null;

        if (isLarge) {
            // L-версия с разделителями (виджет 3)
            const hourText = new Text("00", styleMain);
            const minutesText = new Text("00", styleMain);
            const secondsText = new Text("00", styleSeconds);

            const colon1 = new Text(":", styleSeparator);
            const colon2 = new Text(":", styleSeparator);

            content.mainTexts = [hourText, minutesText];
            content.separators = [colon1, colon2];
            content.secondsText = secondsText;

            // Правильное позиционирование для L-версии
            // Сначала измеряем реальные размеры элементов
            const hourWidth = hourText.width;
            const minutesWidth = minutesText.width;
            const secondsWidth = secondsText.width;
            const colonWidth = colon1.width;

            const totalWidth = hourWidth + minutesWidth + secondsWidth + (colonWidth * 2);
            let xPos = (width - totalWidth) / 2;

            // Часы
            hourText.x = xPos + hourWidth / 2;
            hourText.y = height / 2;
            hourText.anchor.set(0.5);
            content.addChild(hourText);
            xPos += hourWidth;

            // Первое двоеточие
            colon1.x = xPos + colonWidth / 2;
            colon1.y = height / 2;
            colon1.anchor.set(0.5);
            content.addChild(colon1);
            xPos += colonWidth;

            // Минуты
            minutesText.x = xPos + minutesWidth / 2;
            minutesText.y = height / 2;
            minutesText.anchor.set(0.5);
            content.addChild(minutesText);
            xPos += minutesWidth;

            // Второе двоеточие
            colon2.x = xPos + colonWidth / 2;
            colon2.y = height / 2;
            colon2.anchor.set(0.5);
            content.addChild(colon2);
            xPos += colonWidth;

            // Секунды
            secondsText.x = xPos + secondsWidth / 2;
            secondsText.y = height / 2;
            secondsText.anchor.set(0.5);
            content.addChild(secondsText);

        } else {
            // XL и S версии
            const hourMinutesText = new Text("00:00", styleMain);
            hourMinutesText.anchor.set(0.5);
            hourMinutesText.y = height / 2;
            content.addChild(hourMinutesText);
            content.mainTexts = [hourMinutesText];

            if (options.showSeconds) {
                const secondsText = new Text("00", styleSeconds);
                secondsText.anchor.set(isXLWithSeconds ? 0 : 0.5, 0.5);
                secondsText.y = isXLWithSeconds ? height / 2 + 25 : height / 2;
                content.addChild(secondsText);
                content.secondsText = secondsText;

                // Позиционирование основного текста для XL с секундами
                if (isXLWithSeconds) {
                    hourMinutesText.x = width / 2 - 40;
                    secondsText.x = width / 2 + hourMinutesText.width / 2 + 10;
                } else {
                    hourMinutesText.x = width / 2;
                }
            } else {
                hourMinutesText.x = width / 2;
            }
        }

        super(bounds, content, options);

        if (isLarge) {
            this.type = "L"
        } else if (isSmall) {
            this.type = "S"
        } else if (isXLSingle) {
            this.type = "XL"
        } else {
            this.type = "XLseconds"
        }

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
        this.showSeconds = options.showSeconds !== undefined ? options.showSeconds : false;
        this.isLargeVersion = isLarge;

        // Обновляем время сразу и устанавливаем интервал
        this.updateTime();
        this._timer = setInterval(() => this.updateTime(), options.updateInterval ?? 100);
    }

    updateTime() {
        const d = new Date();
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');

        if (this.isLargeVersion) {
            // L-версия: отдельные элементы для часов, минут, секунд
            this.content.mainTexts[0].text = hours;  // часы
            this.content.mainTexts[1].text = minutes; // минуты

            if (this.content.secondsText) {
                this.content.secondsText.text = seconds;
            }

            // После обновления текста пересчитываем позиции для L-версии
            // this.repositionLargeVersion();

        } else {
            // XL и S версии: объединенные часы:минуты
            this.content.mainTexts[0].text = `${hours}:${minutes}`;

            if (this.showSeconds && this.content.secondsText) {
                this.content.secondsText.text = seconds;

                // Обновляем позицию секунд для XL версии
                if (this._width === 508 && this._height === 246) {
                    this.content.secondsText.x = this.content.mainTexts[0].x +
                        this.content.mainTexts[0].width / 2 + 10;
                }
            }
        }
    }

    // repositionLargeVersion() {
    //     if (!this.isLargeVersion) return;

    //     const hourText = this.content.mainTexts[0];
    //     const minutesText = this.content.mainTexts[1];
    //     const secondsText = this.content.secondsText;
    //     const colon1 = this.content.separators[0];
    //     const colon2 = this.content.separators[1];

    //     // Пересчитываем позиции на основе актуальных размеров
    //     const hourWidth = hourText.width;
    //     const minutesWidth = minutesText.width;
    //     const secondsWidth = secondsText.width;
    //     const colonWidth = colon1.width;

    //     const totalWidth = hourWidth + minutesWidth + secondsWidth + (colonWidth * 2);
    //     let xPos = (this._width - totalWidth) / 2;

    //     // Часы
    //     hourText.x = xPos + hourWidth / 2;
    //     xPos += hourWidth;

    //     // Первое двоеточие
    //     colon1.x = xPos + colonWidth / 2;
    //     xPos += colonWidth;

    //     // Минуты
    //     minutesText.x = xPos + minutesWidth / 2;
    //     xPos += minutesWidth;

    //     // Второе двоеточие
    //     colon2.x = xPos + colonWidth / 2;
    //     xPos += colonWidth;

    //     // Секунды
    //     secondsText.x = xPos + secondsWidth / 2;
    // }

    toggleSeconds(show) {
        this.showSeconds = show !== undefined ? show : !this.showSeconds;
        if (this.content.secondsText) {
            this.content.secondsText.visible = this.showSeconds;
        }
        return this.showSeconds;
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