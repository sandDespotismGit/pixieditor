// TrafficWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class TrafficWidget extends DraggableWidget {
    constructor(bounds, width = 377, height = 115, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Текстовые элементы
        const styleLabel = new TextStyle({
            fontFamily: "Rubik",
            fontSize: 32,
            fill: options.textColor ?? 0xffffff,
            resolution: 2
        });

        const label = new Text("Пробки", styleLabel);
        label.x = 16;
        label.y = height / 2 - label.height / 2;
        content.addChild(label);

        const valueCircle = new Graphics();
        valueCircle.x = width / 2 - 27; // центрируем кружок по ширине
        valueCircle.y = height / 2 - 27; // центрируем по высоте
        content.addChild(valueCircle);

        const valueText = new Text("0", styleLabel);
        valueText.anchor.set(0.5);
        valueText.x = valueCircle.x + 27;
        valueText.y = valueCircle.y + 27;
        content.addChild(valueText);


        super(bounds, content, options);

        this._width = width;
        this._height = height;
        this.bg = bg;
        this.valueCircle = valueCircle;
        this.valueText = valueText;

        this.minValue = options.minValue ?? 1;
        this.maxValue = options.maxValue ?? 8;

        this.updateTraffic(); // установить начальное значение
        this._timer = setInterval(() => this.updateTraffic(), options.updateInterval ?? 1800000);
    }

    getRandomTraffic() {
        return Math.floor(Math.random() * (this.maxValue - this.minValue + 1)) + this.minValue;
    }

    updateTraffic() {
        const value = this.getRandomTraffic();
        this.valueText.text = value.toString();

        let color;
        if (value >= 9) color = 0xfa2e23;
        else if (value === 8) color = 0xf86f1c;
        else if (value === 7) color = 0xf78a19;
        else if (value === 6) color = 0xf7a516;
        else if (value === 5) color = 0xf5bf13;
        else if (value === 4) color = 0xefde15;
        else if (value === 3) color = 0xd2fa0b;
        else if (value === 2) color = 0xa4f312;
        else color = 0x90f30d;

        // Обновляем цвет кружка и рамки
        this.valueCircle.clear();
        this.valueCircle.beginFill(color);
        this.valueCircle.drawCircle(27, 27, 27);
        this.valueCircle.endFill();

        this.setColor(color);
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}
