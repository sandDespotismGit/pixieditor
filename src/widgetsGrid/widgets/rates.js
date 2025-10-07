// RatesWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class RatesWidget extends DraggableWidget {
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

    // Определяем тип виджета по размерам и опциям
    const isUsdLarge =
      width === 377 && height === 115 && options.currency === "USD";
    const isEurLarge =
      width === 377 && height === 115 && options.currency === "EUR";
    const isBothMedium =
      width === 246 && height === 115 && options.currency === "USDEURM";
    const isUsdMedium =
      width === 246 && height === 115 && options.currency === "USD";
    const isEurMedium =
      width === 246 && height === 115 && options.currency === "EUR";
    const isBothSmall =
      width === 115 && height === 115 && options.currency === "USDEURS";

    super(bounds, content, options);
    // Сохраняем исходные размеры для масштабирования
    this.originalWidth = width;
    this.originalHeight = height;
    this.contentContainer = new Container();
    content.addChild(this.contentContainer);
    this._width = width;
    this._height = height;
    // Создаем соответствующий тип виджета
    if (isUsdLarge) {
      createUsdLargeContent(this.contentContainer, width, height);
      this.type = "USDL";
    } else if (isEurLarge) {
      createEurLargeContent(this.contentContainer, width, height);
      this.type = "EURL";
    } else if (isBothMedium) {
      createBothMediumContent(this.contentContainer, width, height);
      this.type = "USDEURM";
    } else if (isUsdMedium) {
      createUsdMediumContent(this.contentContainer, width, height);
      this.type = "USDM";
    } else if (isEurMedium) {
      createEurMediumContent(this.contentContainer, width, height);
      this.type = "EURM";
    } else if (isBothSmall) {
      createBothSmallContent(this.contentContainer, width, height);
      this.type = "USDEURS";
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
    this.currencyType = options.currency;
    this.showBoth = options.showBoth;

    // URL API для курсов валют
    this.ratesApiUrl = "https://www.cbr-xml-daily.ru/daily_json.js";

    // Загружаем курсы сразу и устанавливаем интервал
    this.loadRates();
    this._timer = setInterval(
      () => this.loadRates(),
      options.updateInterval ?? 43200000,
    ); // 12 часов
  }

  async loadRates() {
    try {
      const response = await fetch(this.ratesApiUrl, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      this.updateRates(result);
    } catch (error) {
      console.error("Error loading rates:", error);
      this.showErrorState();
    }
  }

  updateRates(ratesData) {
    const usdRate = ratesData.Valute.USD.Value.toFixed(2);
    const eurRate = ratesData.Valute.EUR.Value.toFixed(2);

    console.log("content", this.content);

    // Обновляем в зависимости от типа виджета
    if (this.contentContainer.usdValueText && this.currencyType === "USD") {
      this.contentContainer.usdValueText.text = usdRate;
    }

    if (this.contentContainer.eurValueText && this.currencyType === "EUR") {
      this.contentContainer.eurValueText.text = eurRate;
    }

    if (
      this.contentContainer.bothUsdValueText &&
      this.contentContainer.bothEurValueText
    ) {
      this.contentContainer.bothUsdValueText.text = usdRate;
      this.contentContainer.bothEurValueText.text = eurRate;
    }

    if (
      this.contentContainer.smallUsdValueText &&
      this.contentContainer.smallEurValueText
    ) {
      this.contentContainer.smallUsdValueText.text = usdRate;
      this.contentContainer.smallEurValueText.text = eurRate;
    }
  }

  showErrorState() {
    const errorText = "--.--";

    if (this.contentContainer.usdValueText) {
      this.contentContainer.usdValueText.text = errorText;
    }

    if (this.contentContainer.eurValueText) {
      this.contentContainer.eurValueText.text = errorText;
    }

    if (
      this.contentContainer.bothUsdValueText &&
      this.contentContainer.bothEurValueText
    ) {
      this.contentContainer.bothUsdValueText.text = errorText;
      this.contentContainer.bothEurValueText.text = errorText;
    }

    if (
      this.contentContainer.smallUsdValueText &&
      this.contentContainer.smallEurValueText
    ) {
      this.contentContainer.smallUsdValueText.text = errorText;
      this.contentContainer.smallEurValueText.text = errorText;
    }
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
function createUsdLargeContent(content, width, height) {
  const styleSymbol = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 70,
    fill: 0x737373,
    fontWeight: 300,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 70,
    fill: 0xffffff,
    fontWeight: 300,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // Символ доллара
  const symbolText = new Text("$", styleSymbol);
  symbolText.anchor.set(1, 0.5);
  symbolText.x = -80;
  container.addChild(symbolText);

  // Значение курса
  const valueText = new Text("0.00", styleValue);
  valueText.anchor.set(0, 0.5);
  valueText.x = -60;
  container.addChild(valueText);

  content.addChild(container);
  content.usdValueText = valueText;
}

function createEurLargeContent(content, width, height) {
  const styleSymbol = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 70,
    fill: 0x737373,
    fontWeight: 300,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 70,
    fill: 0xffffff,
    fontWeight: 300,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // Символ евро
  const symbolText = new Text("€", styleSymbol);
  symbolText.anchor.set(1, 0.5);
  symbolText.x = -80;
  container.addChild(symbolText);

  // Значение курса
  const valueText = new Text("0.00", styleValue);
  valueText.anchor.set(0, 0.5);
  valueText.x = -60;
  container.addChild(valueText);

  content.addChild(container);
  content.eurValueText = valueText;
}

function createBothMediumContent(content, width, height) {
  const styleLabel = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 26,
    fill: 0x737373,
    fontWeight: 300,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 26,
    fill: 0xffffff,
    fontWeight: 300,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // USD строка
  const usdContainer = new Container();
  usdContainer.y = -20;

  const usdLabel = new Text("USD", styleLabel);
  usdLabel.anchor.set(1, 0.5);
  usdLabel.x = -6;
  usdContainer.addChild(usdLabel);

  const usdValue = new Text("0.00", styleValue);
  usdValue.anchor.set(0, 0.5);
  usdValue.x = 6;
  usdContainer.addChild(usdValue);

  // EUR строка
  const eurContainer = new Container();
  eurContainer.y = 20;

  const eurLabel = new Text("EUR", styleLabel);
  eurLabel.anchor.set(1, 0.5);
  eurLabel.x = -6;
  eurContainer.addChild(eurLabel);

  const eurValue = new Text("0.00", styleValue);
  eurValue.anchor.set(0, 0.5);
  eurValue.x = 6;
  eurContainer.addChild(eurValue);

  container.addChild(usdContainer);
  container.addChild(eurContainer);
  content.addChild(container);

  content.bothUsdValueText = usdValue;
  content.bothEurValueText = eurValue;
}

function createUsdMediumContent(content, width, height) {
  const styleLabel = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 32,
    fill: 0x737373,
    fontWeight: 400,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 32,
    fill: 0xffffff,
    fontWeight: 400,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // USD метка
  const labelText = new Text("USD", styleLabel);
  labelText.anchor.set(1, 0.5);
  labelText.x = -7;
  container.addChild(labelText);

  // USD значение
  const valueText = new Text("0.00", styleValue);
  valueText.anchor.set(0, 0.5);
  valueText.x = 7;
  container.addChild(valueText);

  content.addChild(container);
  content.usdValueText = valueText;
}

function createEurMediumContent(content, width, height) {
  const styleLabel = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 32,
    fill: 0x737373,
    fontWeight: 400,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 32,
    fill: 0xffffff,
    fontWeight: 400,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // EUR метка
  const labelText = new Text("EUR", styleLabel);
  labelText.anchor.set(1, 0.5);
  labelText.x = -7;
  container.addChild(labelText);

  // EUR значение
  const valueText = new Text("0.00", styleValue);
  valueText.anchor.set(0, 0.5);
  valueText.x = 7;
  container.addChild(valueText);

  content.addChild(container);
  content.eurValueText = valueText;
}

function createBothSmallContent(content, width, height) {
  const styleSymbol = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 26,
    fill: 0x737373,
    fontWeight: 300,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 26,
    fill: 0xffffff,
    fontWeight: 300,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // USD строка
  const usdContainer = new Container();
  usdContainer.y = -15;

  const usdSymbol = new Text("$", styleSymbol);
  usdSymbol.anchor.set(1, 0.5);
  usdSymbol.x = -30;
  usdContainer.addChild(usdSymbol);

  const usdValue = new Text("0.00", styleValue);
  usdValue.anchor.set(0, 0.5);
  usdValue.x = -23;
  usdContainer.addChild(usdValue);

  // EUR строка
  const eurContainer = new Container();
  eurContainer.y = 15;

  const eurSymbol = new Text("€", styleSymbol);
  eurSymbol.anchor.set(1, 0.5);
  eurSymbol.x = -30;
  eurContainer.addChild(eurSymbol);

  const eurValue = new Text("0.00", styleValue);
  eurValue.anchor.set(0, 0.5);
  eurValue.x = -23;
  eurContainer.addChild(eurValue);

  container.addChild(usdContainer);
  container.addChild(eurContainer);
  content.addChild(container);

  content.smallUsdValueText = usdValue;
  content.smallEurValueText = eurValue;
}
