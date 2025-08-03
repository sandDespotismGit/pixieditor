import { Container, Graphics, Text, TextStyle } from "pixi.js";

export default class DigitalClockWidget extends Container {
    constructor(options = {}) {
        super();

        // Параметры по умолчанию
        this.options = {
            showSeconds: true,
            fontSize: 32,
            fontColor: 0xFFFFFF,
            backgroundColor: 0x333333,
            backgroundAlpha: 1,
            padding: 10,
            ...options
        };

        // Создаем фон
        this.background = new Graphics()
            .beginFill(this.options.backgroundColor, this.options.backgroundColor)
            .drawRoundedRect(0, 0, 200, 80, 10)
            .endFill();
        this.addChild(this.background);

        // Стиль текста
        this.textStyle = new TextStyle({
            fontFamily: 'Arial',
            fontSize: this.options.fontSize,
            fill: this.options.fontColor,
            align: 'center'
        });

        // Текстовый элемент для времени
        this.timeText = new Text('', this.textStyle);
        this.timeText.anchor.set(0.5);
        this.addChild(this.timeText);

        // Обновляем размеры и позиционирование
        this.updateLayout();

        // Запускаем таймер обновления времени
        this.updateTime();
        setInterval(() => this.updateTime(), 1000);
    }

    updateTime() {
        const now = new Date();
        let timeString;

        if (this.options.showSeconds) {
            timeString = now.toLocaleTimeString('ru-RU', { hour12: false });
        } else {
            timeString = now.getHours().toString().padStart(2, '0') + ':' +
                now.getMinutes().toString().padStart(2, '0');
        }

        this.timeText.text = timeString;
        this.updateLayout();
    }

    updateLayout() {
        // Обновляем размер фона в зависимости от текста
        const textWidth = this.timeText.width;
        const textHeight = this.timeText.height;

        this.background.clear()
            .beginFill(this.options.backgroundColor, this.options.backgroundAlpha)
            .drawRoundedRect(
                0,
                0,
                textWidth + this.options.padding * 2,
                textHeight + this.options.padding * 2,
                10
            )
            .endFill();

        // Центрируем текст
        this.timeText.position.set(
            (textWidth + this.options.padding * 2) / 2,
            (textHeight + this.options.padding * 2) / 2
        );
    }

    toggleSeconds(show) {
        this.options.showSeconds = show !== undefined ? show : !this.options.showSeconds;
        this.updateTime();
    }
}