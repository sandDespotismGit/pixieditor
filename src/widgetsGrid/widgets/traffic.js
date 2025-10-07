// TrafficWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class TrafficWidget extends DraggableWidget {
  constructor(bounds, width, height, options = {}) {
    const content = new Container();

    // Фон виджета
    const bg = new Graphics();
    bg.beginFill(
      options.backgroundColor ?? 0x1e1e1e,
      options.backgroundAlpha ?? 1,
    )
      .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
      .endFill();
    content.addChild(bg);

    // Определяем тип виджета по размерам
    const isTrafficL = width === 377 && height === 115;
    const isTrafficM = width === 246 && height === 115;
    const isTrafficS = width === 115 && height === 115;

    super(bounds, content, options);
    // Сохраняем исходные размеры для масштабирования
    this.originalWidth = width;
    this.originalHeight = height;
    this.contentContainer = new Container();
    content.addChild(this.contentContainer);
    this._width = width;
    this._height = height;
    // Создаем соответствующий тип виджета
    if (isTrafficL) {
      createTrafficLContent(this.contentContainer, width, height);
      this.type = "TRAFFICL";
    } else if (isTrafficM) {
      createTrafficMContent(this.contentContainer, width, height);
      this.type = "TRAFFICM";
    } else if (isTrafficS) {
      createTrafficSContent(this.contentContainer, width, height);
      this.type = "TRAFFICS";
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

    // Цвета для разных уровней трафика
    this.trafficColors = {
      10: 0xfa2e23,
      9: 0xf95020,
      8: 0xf86f1c,
      7: 0xf78a19,
      6: 0xf7a516,
      5: 0xf5bf13,
      4: 0xefde15,
      3: 0xd2fa0b,
      2: 0xa4f312,
      1: 0x90f30d,
      0: 0x4df30c,
    };

    // Обновляем трафик сразу и устанавливаем интервал
    this.updateTraffic();
    this._timer = setInterval(
      () => this.updateTraffic(),
      options.updateInterval ?? 1800000,
    );
  }

  updateTraffic() {
    const trafficValue = this.getRandomTraffic();

    if (this.contentContainer.trafficValueText) {
      this.contentContainer.trafficValueText.text = trafficValue.toString();
    }

    // Для виджетов с бордером (L и M)
    if (this.contentContainer.trafficBorder) {
      const color = this.trafficColors[trafficValue] || this.trafficColors[0];
      this.contentContainer.trafficBorder.clear();
      this.contentContainer.trafficBorder.circle(0, 0, 27);
      this.contentContainer.trafficBorder.stroke({ width: 6, color: color });
    }

    // Для виджета с заливкой (S)
    if (this.contentContainer.trafficCircle) {
      const color = this.trafficColors[trafficValue] || this.trafficColors[0];
      this.contentContainer.trafficCircle.clear();
      this.contentContainer.trafficCircle.circle(0, 0, 45);
      this.contentContainer.trafficCircle.fill({ color: color });
    }
  }

  getRandomTraffic() {
    return Math.floor(Math.random() * 10) + 1;
  }
  onResize(width, height) {
    this._width = width;
    this._height = height;

    // Рассчитываем масштаб
    const scaleX = width / this.originalWidth;
    const scaleY = height / this.originalHeight;
    console.log(scaleX, scaleY, "scale", this.content, this.contentContainer);

    // Масштабируем контейнер с контентом
    this.contentContainer.scale.set(scaleX, scaleY);

    // Перерисовываем фон
    this._redrawBackground();
  }
  // === API для управления стилем ===
  _redrawBackground() {
    this.bg.clear();

    // Фон
    this.bg
      .beginFill(this._backgroundColor, this._backgroundAlpha)
      .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
      .endFill();

    // Рамка
    if (this._borderWidth > 0) {
      this.bg.lineStyle(
        this._borderWidth,
        this._borderColor,
        this._borderAlpha,
      );
      this.bg.drawRoundedRect(
        0,
        0,
        this._width,
        this._height,
        this._cornerRadius,
      );
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

// Вспомогательные функции для создания контента
function createTrafficLContent(content, width, height) {
  const styleText = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 32,
    fill: 0xffffff,
    fontWeight: 300,
    resolution: 2,
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
  trafficBorder.stroke({ width: 6, color: 0xffffff }); // Начальный цвет
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
    resolution: 2,
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
  trafficBorder.stroke({ width: 6, color: 0xffffff }); // Начальный цвет
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
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // Графика для заполненного круга (НОВЫЙ API)
  const trafficCircle = new Graphics();
  trafficCircle.circle(0, 0, 45);
  trafficCircle.fill({ color: 0xffffff }); // Начальный цвет
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
