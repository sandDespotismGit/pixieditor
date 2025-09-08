// TrafficWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class TrafficWidget extends DraggableWidget {
    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Определяем тип виджета по размерам
        const isTrafficL = width === 377 && height === 115;
        const isTrafficM = width === 246 && height === 115;
        const isTrafficS = width === 115 && height === 115;


        super(bounds, content, options);
        // Создаем соответствующий тип виджета
        if (isTrafficL) {
            createTrafficLContent(content, width, height);
            this.type = "TRAFFICL"
        } else if (isTrafficM) {
            createTrafficMContent(content, width, height);
            this.type = "TRAFFICM"
        } else if (isTrafficS) {
            createTrafficSContent(content, width, height);
            this.type = "TRAFFICS"
        }


        this._width = width;
        this._height = height;
        this.bg = bg;

        // Цвета для разных уровней трафика
        this.trafficColors = {
            10: 0xFA2E23,
            9: 0xF95020,
            8: 0xF86F1C,
            7: 0xF78A19,
            6: 0xF7A516,
            5: 0xF5BF13,
            4: 0xEFDE15,
            3: 0xD2FA0B,
            2: 0xA4F312,
            1: 0x90F30D,
            0: 0x4DF30C
        };

        // Обновляем трафик сразу и устанавливаем интервал
        this.updateTraffic();
        this._timer = setInterval(() => this.updateTraffic(), options.updateInterval ?? 1800000);
    }

    updateTraffic() {
        const trafficValue = this.getRandomTraffic();

        if (this.content.trafficValueText) {
            this.content.trafficValueText.text = trafficValue.toString();
        }

        // Для виджетов с бордером (L и M)
        if (this.content.trafficBorder) {
            const color = this.trafficColors[trafficValue] || this.trafficColors[0];
            this.content.trafficBorder.clear();
            this.content.trafficBorder.circle(0, 0, 27);
            this.content.trafficBorder.stroke({ width: 6, color: color });
        }

        // Для виджета с заливкой (S)
        if (this.content.trafficCircle) {
            const color = this.trafficColors[trafficValue] || this.trafficColors[0];
            this.content.trafficCircle.clear();
            this.content.trafficCircle.circle(0, 0, 45);
            this.content.trafficCircle.fill({ color: color });
        }
    }

    getRandomTraffic() {
        return Math.floor(Math.random() * 10) + 1;
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}

// Вспомогательные функции для создания контента
function createTrafficLContent(content, width, height) {
    const styleText = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 32,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    // Основной контейнер
    const mainContainer = new Container();
    mainContainer.x = width / 2;
    mainContainer.y = height / 2;


    // Текст "Пробки"
    const labelText = new Text("Пробки", styleText);
    labelText.anchor.set(0.5);
    labelText.x = -100;
    mainContainer.addChild(labelText);

    // Контейнер для круга
    const circleContainer = new Container();
    circleContainer.x = 0;

    // Графика для бордера круга (НОВЫЙ API)
    const trafficBorder = new Graphics();
    trafficBorder.circle(0, 0, 27);
    trafficBorder.stroke({ width: 6, color: 0xFFFFFF }); // Начальный цвет
    circleContainer.addChild(trafficBorder);

    // Текст значения
    const trafficValueText = new Text("0", styleText);
    trafficValueText.anchor.set(0.5);
    trafficValueText.x = 0;
    trafficValueText.y = 0;
    circleContainer.addChild(trafficValueText);

    mainContainer.addChild(circleContainer);

    // Текст "баллов"
    const unitsText = new Text("баллов", styleText);
    unitsText.anchor.set(0.5);
    unitsText.x = 100;
    mainContainer.addChild(unitsText);

    content.addChild(mainContainer);

    // Сохраняем ссылки
    content.trafficValueText = trafficValueText;
    content.trafficBorder = trafficBorder;
}

function createTrafficMContent(content, width, height) {
    const styleText = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 32,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    // Основной контейнер
    const mainContainer = new Container();
    mainContainer.x = width / 2;
    mainContainer.y = height / 2;

    // Текст "Пробки"
    const labelText = new Text("Пробки", styleText);
    labelText.anchor.set(0.5);
    labelText.x = -40;
    mainContainer.addChild(labelText);

    // Контейнер для круга
    const circleContainer = new Container();
    circleContainer.x = 60;

    // Графика для бордера круга (НОВЫЙ API)
    const trafficBorder = new Graphics();
    trafficBorder.circle(0, 0, 27);
    trafficBorder.stroke({ width: 6, color: 0xFFFFFF }); // Начальный цвет
    circleContainer.addChild(trafficBorder);

    // Текст значения
    const trafficValueText = new Text("0", styleText);
    trafficValueText.anchor.set(0.5);
    trafficValueText.x = 0;
    trafficValueText.y = 0;
    circleContainer.addChild(trafficValueText);

    mainContainer.addChild(circleContainer);

    content.addChild(mainContainer);

    // Сохраняем ссылки
    content.trafficValueText = trafficValueText;
    content.trafficBorder = trafficBorder;
}

function createTrafficSContent(content, width, height) {
    const styleText = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0x1e1e1e,
        fontWeight: 300,
        resolution: 2
    });

    const container = new Container();
    container.x = width / 2;
    container.y = height / 2;

    // Графика для заполненного круга (НОВЫЙ API)
    const trafficCircle = new Graphics();
    trafficCircle.circle(0, 0, 45);
    trafficCircle.fill({ color: 0xFFFFFF }); // Начальный цвет
    container.addChild(trafficCircle);

    // Текст значения
    const trafficValueText = new Text("0", styleText);
    trafficValueText.anchor.set(0.5);
    trafficValueText.x = 0;
    trafficValueText.y = 0;
    container.addChild(trafficValueText);

    content.addChild(container);

    // Сохраняем ссылки
    content.trafficValueText = trafficValueText;
    content.trafficCircle = trafficCircle;
}