// RatesWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class RatesWidget extends DraggableWidget {
    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Определяем тип виджета по размерам и опциям
        const isUsdLarge = width === 377 && height === 115 && options.currency === 'USD';
        const isEurLarge = width === 377 && height === 115 && options.currency === 'EUR';
        const isBothMedium = width === 246 && height === 115 && options.showBoth;
        const isUsdMedium = width === 246 && height === 115 && options.currency === 'USD';
        const isEurMedium = width === 246 && height === 115 && options.currency === 'EUR';
        const isBothSmall = width === 115 && height === 115;



        super(bounds, content, options);
        // Создаем соответствующий тип виджета
        if (isUsdLarge) {
            createUsdLargeContent(content, width, height);
            this.type = "USDL"
        } else if (isEurLarge) {
            createEurLargeContent(content, width, height);
            this.type = "EURL"
        } else if (isBothMedium) {
            createBothMediumContent(content, width, height);
            this.type = "USDEURM"
        } else if (isUsdMedium) {
            createUsdMediumContent(content, width, height);
            this.type = "USDM"
        } else if (isEurMedium) {
            createEurMediumContent(content, width, height);
            this.type = "EURM"
        } else if (isBothSmall) {
            createBothSmallContent(content, width, height);
            this.type = "USDEURS"
        }

        this._width = width;
        this._height = height;
        this.bg = bg;
        this.currencyType = options.currency;
        this.showBoth = options.showBoth;

        // URL API для курсов валют
        this.ratesApiUrl = "https://www.cbr-xml-daily.ru/daily_json.js";

        // Загружаем курсы сразу и устанавливаем интервал
        this.loadRates();
        this._timer = setInterval(() => this.loadRates(), options.updateInterval ?? 43200000); // 12 часов
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

        // Обновляем в зависимости от типа виджета
        if (this.content.usdValueText && this.currencyType === 'USD') {
            this.content.usdValueText.text = usdRate;
        }

        if (this.content.eurValueText && this.currencyType === 'EUR') {
            this.content.eurValueText.text = eurRate;
        }

        if (this.content.bothUsdValueText && this.content.bothEurValueText) {
            this.content.bothUsdValueText.text = usdRate;
            this.content.bothEurValueText.text = eurRate;
        }

        if (this.content.smallUsdValueText && this.content.smallEurValueText) {
            this.content.smallUsdValueText.text = usdRate;
            this.content.smallEurValueText.text = eurRate;
        }
    }

    showErrorState() {
        const errorText = "--.--";

        if (this.content.usdValueText) {
            this.content.usdValueText.text = errorText;
        }

        if (this.content.eurValueText) {
            this.content.eurValueText.text = errorText;
        }

        if (this.content.bothUsdValueText && this.content.bothEurValueText) {
            this.content.bothUsdValueText.text = errorText;
            this.content.bothEurValueText.text = errorText;
        }

        if (this.content.smallUsdValueText && this.content.smallEurValueText) {
            this.content.smallUsdValueText.text = errorText;
            this.content.smallEurValueText.text = errorText;
        }
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
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
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
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
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
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 26,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
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
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 32,
        fill: 0xffffff,
        fontWeight: 400,
        resolution: 2
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
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 32,
        fill: 0xffffff,
        fontWeight: 400,
        resolution: 2
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
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 26,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
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