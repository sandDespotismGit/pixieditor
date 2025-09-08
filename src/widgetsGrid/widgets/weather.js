// WeatherWidget.js
import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import * as PIXI from 'pixi.js'; // Для модульной системы
import DraggableWidget from "../draggable_widget";

export default class WeatherWidget extends DraggableWidget {
    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Определяем тип виджета по размерам
        const isWeatherXL = width === 508 && height === 246;
        const isWeatherL = width === 377 && height === 115;
        const isWeatherM = width === 246 && height === 246;
        const isWeatherS = width === 246 && height === 115;



        super(bounds, content, options);
        // Создаем соответствующий тип виджета
        if (isWeatherXL) {
            createWeatherXLContent(content, width, height);
            this.type = "XL"
        } else if (isWeatherL) {
            createWeatherLContent(content, width, height);
            this.type = "L"
        } else if (isWeatherM) {
            createWeatherMContent(content, width, height);
            this.type = "M"
        } else if (isWeatherS) {
            createWeatherSContent(content, width, height);
            this.type = "S"
        }

        // После super() можно использовать this
        this._width = width;
        this._height = height;
        this.bg = bg;

        // URL для получения погоды
        this.weatherApiUrl = options.weatherApiUrl || "http://212.41.9.251:8000/get_weather";

        // Маппинг погодных условий на иконки
        this.weatherIcons = {
            "Ясно": "http://212.41.9.251:8000/static/weather_clear.svg",
            "Облачно": "http://212.41.9.251:8000/static/weather_cloudy.svg",
            "Переменная облачность": "http://212.41.9.251:8000/static/weather_p_cloudy.svg",
            "Местами дождь": "http://212.41.9.251:8000/static/weather_rain.svg",
            "Местами грозы": "http://212.41.9.251:8000/static/weather_thunderstorm.svg",
            "Местами легкий дождь с грозой": "http://212.41.9.251:8000/static/weather_rain.svg",
            "Моросящий дождь": "http://212.41.9.251:8000/static/weather_rain.svg",
            "Небольшой дождь": "http://212.41.9.251:8000/static/weather_rain.svg"
        };

        // Загружаем погоду сразу и устанавливаем интервал
        this.loadWeather();
        this._timer = setInterval(() => this.loadWeather(), options.updateInterval ?? 300000);
    }

    async loadWeather() {
        try {
            const response = await fetch(this.weatherApiUrl, {
                method: "GET",
                headers: {
                    accept: "application/json",
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.updateWeather(result);

        } catch (error) {
            console.error("Error loading weather:", error);
            this.showErrorState();
        }
    }

    updateWeather(weatherData) {
        const currentWeather = weatherData[0];
        const timeWeather = weatherData[1] || [];

        if (this.content.currentTempText) {
            this.content.currentTempText.text = currentWeather[0];
        }

        if (this.content.statusText) {
            this.content.statusText.text = currentWeather[1];
        }

        if (this.content.currentIcon && currentWeather[1]) {
            const iconUrl = this.weatherIcons[currentWeather[1]] || this.weatherIcons["Ясно"];
            this.loadIcon(this.content.currentIcon, iconUrl);
        }

        // Для XL виджета обновляем иконки по времени суток
        if (this.content.timeIcons && timeWeather.length >= 4) {
            const times = ["Утро", "День", "Вечер", "Ночь"];
            times.forEach((time, index) => {
                if (this.content.timeIcons[index] && timeWeather[index] && timeWeather[index][1]) {
                    const iconUrl = this.weatherIcons[timeWeather[index][1]] || this.weatherIcons["Ясно"];
                    this.loadIcon(this.content.timeIcons[index], iconUrl);
                }
            });
        }
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
        if (this.content.currentTempText) {
            this.content.currentTempText.text = "--°";
        }
        if (this.content.statusText) {
            this.content.statusText.text = "Нет данных";
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

// Вспомогательные функции для создания контента (остаются без изменений)
function createWeatherXLContent(content, width, height) {
    // Стили для температуры
    const styleTemp = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleStatus = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 26,
        fill: 0x737373,
        fontWeight: 300,
        resolution: 2
    });

    const styleTime = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 26,
        fill: 0x737373,
        fontWeight: 300,
        resolution: 2
    });

    // Контейнер для текущей погоды
    const currentWeatherContainer = new Container();
    currentWeatherContainer.x = 40;
    currentWeatherContainer.y = 0;

    // Текущая температура
    const tempText = new Text("--°", styleTemp);
    tempText.x = 0;
    tempText.y = 0;
    currentWeatherContainer.addChild(tempText);

    // Статус погоды
    const statusText = new Text("Загрузка...", styleStatus);
    statusText.x = 0;
    statusText.y = 80;
    currentWeatherContainer.addChild(statusText);

    // Иконка погоды
    const weatherIcon = Sprite.from(PIXI.Texture.EMPTY);
    weatherIcon.x = width - 150;
    weatherIcon.y = 0;
    weatherIcon.width = 80;
    weatherIcon.height = 80;
    currentWeatherContainer.addChild(weatherIcon);

    content.addChild(currentWeatherContainer);

    // Контейнер для погody по времени суток
    const timeWeatherContainer = new Container();
    timeWeatherContainer.y = 140;

    const times = ["Утро", "День", "Вечер", "Ночь"];
    const timeIcons = [];
    const spacing = width / 4;

    times.forEach((time, index) => {
        const timeGroup = new Container();
        timeGroup.x = spacing * (index + 0.5);

        // Иконка
        const timeIcon = Sprite.from(PIXI.Texture.EMPTY);
        timeIcon.width = 46;
        timeIcon.height = 46;
        timeIcon.y = 0;
        timeIcon.anchor.set(0.5);
        timeGroup.addChild(timeIcon);
        timeIcons.push(timeIcon);

        // Текст времени
        const timeText = new Text(time, styleTime);
        timeText.anchor.set(0.5);
        timeText.y = 60;
        timeGroup.addChild(timeText);

        timeWeatherContainer.addChild(timeGroup);
    });

    content.addChild(timeWeatherContainer);

    // Сохраняем ссылки для обновления
    content.currentTempText = tempText;
    content.statusText = statusText;
    content.currentIcon = weatherIcon;
    content.timeIcons = timeIcons;
}

function createWeatherLContent(content, width, height) {
    const styleTemp = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    // Температура
    const tempText = new Text("--°", styleTemp);
    tempText.anchor.set(0.5);
    tempText.x = width / 2 - 40;
    tempText.y = height / 2;
    content.addChild(tempText);

    // Иконка погоды
    const weatherIcon = Sprite.from(PIXI.Texture.EMPTY);
    weatherIcon.width = 80;
    weatherIcon.height = 80;
    weatherIcon.anchor.set(0.5);
    weatherIcon.x = width - weatherIcon.width - 20;
    weatherIcon.y = height / 2;
    content.addChild(weatherIcon);

    content.currentTempText = tempText;
    content.currentIcon = weatherIcon;
}

function createWeatherMContent(content, width, height) {
    const styleTemp = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleStatus = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 26,
        fill: 0x737373,
        fontWeight: 300,
        resolution: 2
    });

    const container = new Container();
    container.x = 30;
    container.y = 30;

    // Иконка погоды
    const weatherIcon = Sprite.from(PIXI.Texture.EMPTY);
    weatherIcon.width = 80;
    weatherIcon.height = 70;
    weatherIcon.y = 0;
    container.addChild(weatherIcon);

    // Статус погоды
    const statusText = new Text("Загрузка...", styleStatus);
    statusText.x = 0;
    statusText.y = 80;
    container.addChild(statusText);

    // Температура
    const tempText = new Text("--°", styleTemp);
    tempText.x = 0;
    tempText.y = 110;
    container.addChild(tempText);

    content.addChild(container);

    content.currentTempText = tempText;
    content.statusText = statusText;
    content.currentIcon = weatherIcon;
}

function createWeatherSContent(content, width, height) {
    const styleTemp = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 70,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const tempText = new Text("--°", styleTemp);
    tempText.anchor.set(0.5);
    tempText.x = width / 2;
    tempText.y = height / 2;
    content.addChild(tempText);

    content.currentTempText = tempText;
}