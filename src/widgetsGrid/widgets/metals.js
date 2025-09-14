// MetalsWidget.js
import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import * as PIXI from 'pixi.js'; // Для модульной системы


export default class MetalsWidget extends DraggableWidget {
    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Определяем тип виджета (полный или сокращенный)
        const isFullVersion = options.showAllMetals !== false; // По умолчанию полная версия

        // Создаем соответствующий тип контента
        if (isFullVersion) {
            createMetalsContent(content, width, height);
            this.type = "metal-L"
        } else {
            createMetalsShortContent(content, width, height);
            this.type = "metal-S"
        }

        super(bounds, content, options);

        this._width = width;
        this._height = height;
        this.bg = bg;
        this.isFullVersion = isFullVersion;

        // URL API для металлов
        this.metalsApiUrl = "https://admin.i-panel.pro:8088/metal";
        this.iconsBaseUrl = "http://212.41.9.251:8000/static/";

        // Загружаем данные сразу и устанавливаем интервал
        this.loadMetals();
        this._timer = setInterval(() => this.loadMetals(), options.updateInterval ?? 172800000); // 48 часов
    }

    async loadMetals() {
        try {
            const response = await fetch(this.metalsApiUrl, {
                method: "GET",
                headers: {
                    accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.updateMetals(result);

        } catch (error) {
            console.error("Error loading metals data:", error);
            this.showErrorState();
        }
    }

    updateMetals(metalsData) {
        // Определяем какие металлы отображать в зависимости от версии
        const metals = this.isFullVersion ? [
            { index: 12, name: 'oil', prefix: 'oil' },
            { index: 15, name: 'silver', prefix: 'silver' },
            { index: 14, name: 'gold', prefix: 'gold' },
            { index: 13, name: 'platinum', prefix: 'platinum' },
            { index: 18, name: 'nikel', prefix: 'nikel' }
        ] : [
            { index: 12, name: 'oil', prefix: 'oil' },
            { index: 14, name: 'gold', prefix: 'gold' },
            { index: 13, name: 'platinum', prefix: 'platinum' }
        ];

        metals.forEach(metal => {
            if (metalsData.data && metalsData.data[metal.index]) {
                const metalResult = metalsData.data[metal.index].split("\t");

                if (metalResult.length >= 4) {
                    const newPrice = metalResult[2];
                    const percentage = metalResult[3];

                    // Вычисляем изменение цены
                    const percChange = parseFloat(percentage.replace(",", ".").replace("%", ""));
                    const priceChange = (parseFloat(newPrice) * (1 + percChange / 100) - parseFloat(newPrice)).toFixed(2);

                    // Обновляем текстовые элементы
                    if (this.content[`${metal.prefix}PriceText`]) {
                        this.content[`${metal.prefix}PriceText`].text = newPrice;
                    }

                    if (this.content[`${metal.prefix}DivideText`]) {
                        this.content[`${metal.prefix}DivideText`].text = priceChange;
                    }

                    if (this.content[`${metal.prefix}PercText`]) {
                        this.content[`${metal.prefix}PercText`].text = percentage;
                    }

                    // Обновляем иконку тренда
                    if (this.content[`${metal.prefix}Icon`]) {
                        const iconName = percChange >= 0 ? "green_triangle.svg" : "red_triangle.svg";
                        this.loadIcon(this.content[`${metal.prefix}Icon`], `${this.iconsBaseUrl}${iconName}`);
                    }
                }
            }
        });
    }

    async loadIcon(sprite, url) {
        try {
            const texture = await PIXI.Assets.load(url);
            sprite.texture = texture;
        } catch (error) {
            console.error("Error loading icon:", error);
        }
    }

    showErrorState() {
        const errorText = "---,--";

        // Список металлов в зависимости от версии
        const metals = this.isFullVersion ?
            ['oil', 'silver', 'gold', 'platinum', 'nikel'] :
            ['oil', 'gold', 'platinum'];

        metals.forEach(metal => {
            if (this.content[`${metal}PriceText`]) {
                this.content[`${metal}PriceText`].text = errorText;
            }

            if (this.content[`${metal}DivideText`]) {
                this.content[`${metal}DivideText`].text = errorText;
            }

            if (this.content[`${metal}PercText`]) {
                this.content[`${metal}PercText`].text = errorText;
            }

            // Устанавливаем красную иконку по умолчанию при ошибке
            if (this.content[`${metal}Icon`]) {
                this.loadIcon(this.content[`${metal}Icon`], `${this.iconsBaseUrl}red_triangle.svg`);
            }
        });
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}

// Вспомогательная функция для создания полного контента (6 строк)
function createMetalsContent(content, width, height) {
    const styleName = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleSecondary = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 18,
        fill: 0x737373,
        fontWeight: 300,
        resolution: 2
    });

    // Металлы и их порядок (полная версия)
    const metals = [
        { name: "Нефть  ", key: "oil", width: 129 },
        { name: "Серебро  ", key: "silver", width: 129 },
        { name: "Золото  ", key: "gold", width: 129 },
        { name: "Платина  ", key: "platinum", width: 129 },
        { name: "Никель  ", key: "nikel", width: 129 }
    ];

    const rowHeight = height / 5;
    const columns = [
        { x: 40, width: 140 }, // Название
        { x: 169, width: 61 }, // Изменение цены
        { x: 230, width: 80 }, // Процент
        { x: 410, width: 160 } // Цена
    ];

    metals.forEach((metal, index) => {
        const rowY = rowHeight * (index + 0.5);

        // Название металла
        const nameText = new Text(metal.name, styleName);
        nameText.anchor.set(0, 0.5);
        nameText.x = columns[0].x;
        nameText.y = rowY;
        content.addChild(nameText);

        // Изменение цены
        const divideText = new Text("---,--", styleSecondary);
        divideText.anchor.set(1, 0.5);
        divideText.x = columns[1].x + columns[1].width;
        divideText.y = rowY;
        content.addChild(divideText);
        content[`${metal.key}DivideText`] = divideText;

        // Процент изменения
        const percText = new Text("---,--", styleSecondary);
        percText.anchor.set(1, 0.5);
        percText.x = columns[2].x + columns[2].width;
        percText.y = rowY;
        content.addChild(percText);
        content[`${metal.key}PercText`] = percText;

        // Контейнер для цены и иконки
        const priceContainer = new Container();
        priceContainer.x = columns[3].x;
        priceContainer.y = rowY;

        // Цена
        const priceText = new Text("---,--", styleValue);
        priceText.anchor.set(1, 0.5);
        priceText.x = 0;
        priceContainer.addChild(priceText);
        content[`${metal.key}PriceText`] = priceText;

        // Пространство между ценой и иконкой
        const space = new Container();
        space.x = priceText.width + 6;
        priceContainer.addChild(space);

        // Иконка тренда
        const trendIcon = Sprite.from(PIXI.Texture.EMPTY);
        trendIcon.width = 12;
        trendIcon.height = 11;
        trendIcon.anchor.set(0, 0.5);
        trendIcon.x = priceText.width + 12;
        priceContainer.addChild(trendIcon);
        content[`${metal.key}Icon`] = trendIcon;

        content.addChild(priceContainer);
    });
}

// Вспомогательная функция для создания сокращенного контента (3 строки)
function createMetalsShortContent(content, width, height) {
    const styleName = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleValue = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleSecondary = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 18,
        fill: 0x737373,
        fontWeight: 300,
        resolution: 2
    });

    // Металлы для сокращенной версии (только 3 основных)
    const metals = [
        { name: "Нефть  ", key: "oil", width: 129 },
        { name: "Золото  ", key: "gold", width: 129 },
        { name: "Платина  ", key: "platinum", width: 129 }
    ];

    const rowHeight = height / 3;
    const columns = [
        { x: 40, width: 140 }, // Название
        { x: 169, width: 61 }, // Изменение цены
        { x: 230, width: 80 }, // Процент
        { x: 410, width: 160 } // Цена
    ];

    metals.forEach((metal, index) => {
        const rowY = rowHeight * (index + 0.5);

        // Название металла
        const nameText = new Text(metal.name, styleName);
        nameText.anchor.set(0, 0.5);
        nameText.x = columns[0].x;
        nameText.y = rowY;
        content.addChild(nameText);

        // Изменение цены
        const divideText = new Text("---,--", styleSecondary);
        divideText.anchor.set(1, 0.5);
        divideText.x = columns[1].x + columns[1].width;
        divideText.y = rowY;
        content.addChild(divideText);
        content[`${metal.key}DivideText`] = divideText;

        // Процент изменения
        const percText = new Text("---,--", styleSecondary);
        percText.anchor.set(1, 0.5);
        percText.x = columns[2].x + columns[2].width;
        percText.y = rowY;
        content.addChild(percText);
        content[`${metal.key}PercText`] = percText;

        // Контейнер для цены и иконки
        const priceContainer = new Container();
        priceContainer.x = columns[3].x;
        priceContainer.y = rowY;

        // Цена
        const priceText = new Text("---,--", styleValue);
        priceText.anchor.set(1, 0.5);
        priceText.x = 0;
        priceContainer.addChild(priceText);
        content[`${metal.key}PriceText`] = priceText;

        // Пространство между ценой и иконкой
        const space = new Container();
        space.x = priceText.width + 6;
        priceContainer.addChild(space);

        // Иконка тренда
        const trendIcon = Sprite.from(PIXI.Texture.EMPTY);
        trendIcon.width = 12;
        trendIcon.height = 11;
        trendIcon.anchor.set(0, 0.5);
        trendIcon.x = priceText.width + 12;
        priceContainer.addChild(trendIcon);
        content[`${metal.key}Icon`] = trendIcon;

        content.addChild(priceContainer);
    });
}