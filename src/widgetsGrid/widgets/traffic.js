// TrafficWidget.js
import { Container, Graphics, Text, TextStyle, Sprite, Texture } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import { requestWidgetData } from "../../batchWidgetData";

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
    const isTrafficWithMap = width === 246 && height === 246

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
    } else if(isTrafficWithMap) {
      createTrafficWithMapContent(this.contentContainer, width, height)
      this.type = "TRAFFICMAP"
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

    // Загружаем данные с сервера и устанавливаем интервал
    this.fetchTrafficData();
    this._timer = setInterval(
      () => this.fetchTrafficData(),
      options.updateInterval ?? 1800000, // 30 минут по умолчанию
    );
  }

  async fetchTrafficData() {
    try {
      const data = await requestWidgetData("traffic");
      
      // Обновляем значение трафика
      this.updateTrafficValue(data);
      
    } catch (error) {
      console.error("Ошибка загрузки данных трафика:", error);
    }
  }

  updateTrafficValue(data) {
    // Парсим значение balls
    const trafficValue = parseInt(data.balls);
    const isValid = !isNaN(trafficValue) && trafficValue >= 0 && trafficValue <= 10;
    
    if (!isValid) {
      console.warn("Получено некорректное значение трафика:", data.balls);
      return;
    }

    // Обновляем текст значения
    if (this.contentContainer.trafficValueText) {
      this.contentContainer.trafficValueText.text = trafficValue.toString();
    }

    // Получаем цвет для текущего значения
    const color = this.trafficColors[trafficValue] || this.trafficColors[0];

    // Для виджетов с бордером (L и M)
    if (this.contentContainer.trafficBorder) {
      this.contentContainer.trafficBorder.clear();
      this.contentContainer.trafficBorder.circle(0, 0, 27);
      this.contentContainer.trafficBorder.stroke({ width: 6, color: color });
    }

    // Для виджета с заливкой (S и MAP)
    if (this.contentContainer.trafficCircle) {
      this.contentContainer.trafficCircle.clear();
      this.contentContainer.trafficCircle.circle(0, 0, 
        this.type === "TRAFFICMAP" ? 30 : 45 // Разный радиус для разных типов
      );
      this.contentContainer.trafficCircle.fill({ color: color });
    }

    // Для виджета с картой дополнительно обрабатываем изображение
    if (this.type === "TRAFFICMAP" && data.img) {
      this.updateMapImage(data.img);
    }
  }

  async updateMapImage(base64Image) {
    try {
      const content = this.contentContainer;
      
      // Создаем изображение
      const img = new Image();
      img.src = `data:image/png;base64,${base64Image}`;
      
      // Ждем загрузки изображения
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Удаляем старый спрайт если есть
      if (content.mapSprite) {
        content.mapContainer.removeChild(content.mapSprite);
        content.mapSprite.destroy();
      }
      
      // Создаем новый спрайт
      const texture = Texture.from(img);
      const sprite = new Sprite(texture);
      
      // Растягиваем на весь контейнер
      sprite.width = this._width;
      sprite.height = this._height;
      sprite.x = 0;
      sprite.y = 0;
      
      content.mapContainer.addChild(sprite);
      content.mapSprite = sprite;
      
    } catch (error) {
      console.error("Ошибка обновления изображения карты:", error);
    }
  }

  onResize(width, height) {
    this._width = width;
    this._height = height;

    // Рассчитываем масштаб
    const scale = Math.min(
      width / this.originalWidth,
      height / this.originalHeight,
    );

    // Масштабируем контент пропорционально, чтобы текст не искажался
    this.contentContainer.scale.set(scale);
    this.contentContainer.x = (width - this.originalWidth * scale) / 2;
    this.contentContainer.y = (height - this.originalHeight * scale) / 2;

    // Перерисовываем фон
    this._redrawBackground();
    
    // Обновляем маску для виджета с картой
    if (this.type === "TRAFFICMAP" && this.contentContainer.updateMask) {
      this.contentContainer.updateMask(width, height);
    }
  }

  // === API для управления стилем ===
  _redrawBackground() {
    this.bg.clear();

    // Фон
    this.bg
      .beginFill(this._backgroundColor, this._backgroundAlpha)
      .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
      .endFill();

    // Рамка: только stroke без заливки поверх виджета.
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

  // Графика для бордера круга
  const trafficBorder = new Graphics();
  trafficBorder.circle(0, 0, 27);
  trafficBorder.stroke({ width: 6, color: 0xffffff });
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

  // Графика для бордера круга
  const trafficBorder = new Graphics();
  trafficBorder.circle(0, 0, 27);
  trafficBorder.stroke({ width: 6, color: 0xffffff });
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

  // Графика для заполненного круга
  const trafficCircle = new Graphics();
  trafficCircle.circle(0, 0, 45);
  trafficCircle.fill({ color: 0xffffff });
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

function createTrafficWithMapContent(content, width, height) {
  console.log("Создание виджета с картой", { width, height });
  
  const styleText = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 48,
    fill: 0xffffff,
    fontWeight: 500,
    resolution: 2,
  });

  // Создаем маску для скругления углов всего виджета
  const widgetMask = new Graphics();
  widgetMask.beginFill(0xffffff);
  widgetMask.drawRoundedRect(0, 0, width, height, 16);
  widgetMask.endFill();
  content.addChild(widgetMask);
  
  // Применяем маску ко всему контенту виджета
  content.mask = widgetMask;

  // Контейнер для карты
  const mapContainer = new Container();
  content.addChild(mapContainer);

  // Контейнер для круга с пробками (поверх карты)
  const circleContainer = new Container();
  circleContainer.x = 30 + 20;
  circleContainer.y = 30 + 20;
  content.addChild(circleContainer);

  // Графика для заполненного круга
  const trafficCircle = new Graphics();
  trafficCircle.circle(0, 0, 30);
  trafficCircle.fill({ color: 0xffffff });
  circleContainer.addChild(trafficCircle);

  // Текст значения
  const trafficValueText = new Text("0", styleText);
  trafficValueText.anchor.set(0.5);
  trafficValueText.x = 0;
  trafficValueText.y = 0;
  circleContainer.addChild(trafficValueText);

  // Сохраняем ссылки
  content.trafficValueText = trafficValueText;
  content.trafficCircle = trafficCircle;
  content.mapContainer = mapContainer;
  content.mapSprite = null;
  content.widgetMask = widgetMask;

  // Функция для обновления маски при изменении размеров
  content.updateMask = function(newWidth, newHeight) {
    widgetMask.clear();
    widgetMask.beginFill(0xffffff);
    widgetMask.drawRoundedRect(0, 0, newWidth, newHeight, 16);
    widgetMask.endFill();
  };

  return content;
}
