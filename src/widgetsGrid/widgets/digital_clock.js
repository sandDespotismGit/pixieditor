// DigitalClockXLWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class DigitalClockXLWidget extends DraggableWidget {
    constructor(bounds, width = 508, height = 246, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Стили для текста
        const styleTime = new TextStyle({
            fontFamily: "Rubik",
            fontSize: options.fontSizeMain ?? 140,
            fill: options.textColor ?? 0xffffff,
            fontWeight: 300,
            resolution: 2
        });

        const styleSeconds = new TextStyle({
            fontFamily: "Rubik",
            fontSize: options.fontSizeAdd ?? 70,
            fill: options.secondsColor ?? 0x404040,
            fontWeight: 300,
            resolution: 2
        });

        // Элементы для отображения времени
        const hourMinutesText = new Text("", styleTime);
        hourMinutesText.anchor.set(0.5); // Центрируем текст
        hourMinutesText.x = options.showSeconds ? width / 2 - 40 : width / 2;
        hourMinutesText.y = height / 2;
        content.addChild(hourMinutesText);

        const secondsText = new Text("", styleSeconds);
        secondsText.anchor.set(0, 0.5); // Якорь по вертикали по центру
        secondsText.x = width / 2; // Отступ от основного времени
        secondsText.y = width == 377 ? height / 2 : height / 2 + 25; // Смещение вниз как в оригинале
        content.addChild(secondsText);

        super(bounds, content, options);

        this._width = width;
        this._height = height;
        this.bg = bg;
        this.hourMinutesText = hourMinutesText;
        this.secondsText = secondsText;

        // Опция для отображения секунд
        this.showSeconds = options.showSeconds !== undefined ? options.showSeconds : true;

        // Обновляем время сразу и устанавливаем интервал
        this.updateTime();
        this._timer = setInterval(() => this.updateTime(), options.updateInterval ?? 100);
    }

    updateTime() {
        const d = new Date();

        // Форматируем часы и минуты
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        this.hourMinutesText.text = `${hours}:${minutes}`;

        // Центрируем основной текст после обновления (размер мог измениться)
        // this.hourMinutesText.x = this._width / 2;

        // Обновляем секунды если включено
        if (this.showSeconds) {
            const seconds = d.getSeconds().toString().padStart(2, '0');
            this.secondsText.text = seconds;
            this.secondsText.visible = true;

            // Позиционируем секунды относительно основного текста
            this.secondsText.x = this.hourMinutesText.x + this.hourMinutesText.width / 2 + 10;
        } else {
            this.secondsText.visible = false;
        }
    }

    // Метод для переключения отображения секунд
    toggleSeconds(show) {
        this.showSeconds = show !== undefined ? show : !this.showSeconds;
        this.secondsText.visible = this.showSeconds;
        return this.showSeconds;
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}