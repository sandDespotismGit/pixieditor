import {
    Container,
    Sprite,
    Texture,
    TilingSprite,
    Graphics,
    FillGradient,
    Text,
    TextStyle,
} from "pixi.js";
import * as PIXI from "pixi.js";

import DraggableWidget from "../widgetsGrid/draggable_widget";
import AnalogClockWidget from "../widgetsGrid/widgets/analog_clock";
import DigitalClockWidget from "../widgetsGrid/widgets/digital_clock";
import CalendarWidget from "../widgetsGrid/widgets/calendar";
import WeatherWidget from "../widgetsGrid/widgets/weather";
import TrafficWidget from "../widgetsGrid/widgets/traffic";
import NewsWidget from "../widgetsGrid/widgets/news";
import RatesWidget from "../widgetsGrid/widgets/rates";
import MetalsWidget from "../widgetsGrid/widgets/metals";
import CompanyWidget from "../widgetsGrid/widgets/about_company";
import SimpleRectWidget from "../widgetsGrid/widgets/video";

export default class EditorFrame {
    constructor(app) {
        this.app = app;

        // Основной контейнер для всего редактора
        this.mainContainer = new Container();
        this.app.stage.addChild(this.mainContainer);

        // Внешнее поле (неизменяемое по размерам)
        this.outerFrame = new Container();
        this.mainContainer.addChild(this.outerFrame);

        // Внутреннее рабочее поле
        this.innerContainer = new Container();
        this.mainContainer.addChild(this.innerContainer);

        // Сохраняем ссылку для обратной совместимости
        this.container = this.innerContainer;

        this._width = 1200; // фиксированная ширина внутреннего поля
        this._height = 800; // фиксированная высота внутреннего поля

        // Параметры внешнего поля
        this.outerFrameWidth = this._width + 400; // +200px с каждой стороны
        this.outerFrameHeight = this._height + 400;
        this.outerFrameColor = 0x1a1a1a;
        this.outerFrameAlpha = 1;

        // Центрируем внутреннее поле относительно внешнего
        this.innerContainer.x = 200;
        this.innerContainer.y = 200;

        // Параметры сетки (только для внутреннего поля)
        this.grid = null;
        this.gridVisible = true;
        this.gridSize = 20;
        this.gridColor = "rgb(83, 83, 83)";
        this.gridAlpha = 1;

        // Масштабирование
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;

        // Перетаскивание
        this.dragEnabled = true;
        this.selected_widget = null;

        this.setupKeyboardControls();
        this.setupZoom();
        this.setupDrag();

        this.createOuterFrame();
        this.createBackground();
        this.setupBackgroundInteraction();
        this.createGrid();
        this.setupGlobalMiddleClick();

        // Центрируем на экране
        this.centerOnScreen();
    }

    // ==== СОЗДАНИЕ ВНЕШНЕГО ПОЛЯ ====

    createOuterFrame() {
        // Очищаем предыдущее содержимое
        this.outerFrame.removeChildren();

        // Создаем фон внешнего поля
        const outerBg = new Graphics();
        outerBg.rect(0, 0, this.outerFrameWidth, this.outerFrameHeight);
        outerBg.fill(this.outerFrameColor);
        outerBg.alpha = this.outerFrameAlpha;

        this.outerFrame.addChild(outerBg);

        // Добавляем обучающие подписи
        this.addTutorialLabels();

        // Настраиваем интерактивность для перетаскивания
        this.setupOuterFrameInteraction();
    }

    addTutorialLabels() {
        const style = new TextStyle({
            fill: 0x666666,
            fontSize: 16,
            fontFamily: "Arial",
            fontWeight: "bold",
        });

        const smallStyle = new TextStyle({
            fill: "white",
            fontSize: 20,
            fontFamily: "Arial",
        });

        // Подпись сверху
        const topLabel = new Text("Рабочая область редактора", style);
        topLabel.x = this.outerFrameWidth / 2 - topLabel.width / 2;
        topLabel.y = 50;
        this.outerFrame.addChild(topLabel);

        // Подпись снизу
        const bottomLabel = new Text(
            "Перетащите для перемещения • Колесо мыши для масштабирования",
            smallStyle,
        );
        bottomLabel.x = this.outerFrameWidth / 2 - bottomLabel.width / 2;
        bottomLabel.y = this.outerFrameHeight - 80;
        this.outerFrame.addChild(bottomLabel);
        const bottomLabel1 = new Text(
            "Автоцентр включает и выключает притягивание виджетов к клеточкам",
            smallStyle,
        );
        const bottomLabel2 = new Text(
            "Функция пропорции включает и отключает изменение размера строго пропорционально",
            smallStyle,
        );
        bottomLabel1.x = this.outerFrameWidth / 2 - bottomLabel.width / 2;
        bottomLabel1.y = this.outerFrameHeight - 60;
        bottomLabel2.x = this.outerFrameWidth / 2 - bottomLabel.width / 2;
        bottomLabel2.y = this.outerFrameHeight - 40;
        this.outerFrame.addChild(bottomLabel1);
        this.outerFrame.addChild(bottomLabel2);

        // Подпись слева
        const leftLabel = new Text("Область для обучающих материалов", style);
        leftLabel.rotation = -Math.PI / 2;
        leftLabel.x = 50;
        leftLabel.y = this.outerFrameHeight / 2 + leftLabel.width / 2;
        this.outerFrame.addChild(leftLabel);

        // Подпись справа
        const rightLabel = new Text("Внешняя рамка", style);
        rightLabel.rotation = Math.PI / 2;
        rightLabel.x = this.outerFrameWidth - 50;
        rightLabel.y = this.outerFrameHeight / 2 - rightLabel.width / 2;
        this.outerFrame.addChild(rightLabel);

        // Угловые маркеры
        this.addCornerMarkers();
    }

    addCornerMarkers() {
        const markerStyle = new TextStyle({
            fill: 0x444444,
            fontSize: 10,
            fontFamily: "Arial",
        });

        // Левый верхний
        const ltMarker = new Text("↖", markerStyle);
        ltMarker.x = 10;
        ltMarker.y = 10;
        this.outerFrame.addChild(ltMarker);

        // Правый верхний
        const rtMarker = new Text("↗", markerStyle);
        rtMarker.x = this.outerFrameWidth - 20;
        rtMarker.y = 10;
        this.outerFrame.addChild(rtMarker);

        // Левый нижний
        const lbMarker = new Text("↙", markerStyle);
        lbMarker.x = 10;
        lbMarker.y = this.outerFrameHeight - 20;
        this.outerFrame.addChild(lbMarker);

        // Правый нижний
        const rbMarker = new Text("↘", markerStyle);
        rbMarker.x = this.outerFrameWidth - 20;
        rbMarker.y = this.outerFrameHeight - 20;
        this.outerFrame.addChild(rbMarker);
    }

    setupOuterFrameInteraction() {
        this.outerFrame.interactive = true;
        this.outerFrame.hitArea = new PIXI.Rectangle(
            0,
            0,
            this.outerFrameWidth,
            this.outerFrameHeight,
        );

        this.outerFrame
            .on("pointerdown", this.onOuterDragStart.bind(this))
            .on("pointerup", this.onOuterDragEnd.bind(this))
            .on("pointerupoutside", this.onOuterDragEnd.bind(this))
            .on("pointermove", this.onOuterDragMove.bind(this));
    }

    onOuterDragStart(event) {
        if (!this.dragEnabled) return;
        this.dragData = event.data;
        this.dragStart = {
            x: this.mainContainer.x,
            y: this.mainContainer.y,
            pointer: this.dragData.getLocalPosition(this.mainContainer.parent),
        };
        this.mainContainer.cursor = "grabbing";
    }

    onOuterDragMove(event) {
        if (!this.dragEnabled || !this.dragData) return;
        const newPosition = this.dragData.getLocalPosition(
            this.mainContainer.parent,
        );
        const dx = newPosition.x - this.dragStart.pointer.x;
        const dy = newPosition.y - this.dragStart.pointer.y;
        this.mainContainer.x = this.dragStart.x + dx;
        this.mainContainer.y = this.dragStart.y + dy;
    }

    onOuterDragEnd() {
        this.dragData = null;
        this.dragStart = null;
        this.mainContainer.cursor = "grab";
    }

    // ==== СЕРИАЛИЗАЦИЯ/ИМПОРТ/ЭКСПОРТ ====

    exportScene() {
        const widgets = this.innerContainer.children
            .filter((c) => c instanceof DraggableWidget)
            .map((w) => ({
                type: w.content.constructor.name,
                widgetClass: w.content.constructor.name,
                x: w.x,
                y: w.y,
                size: w.getSize(),
                color: w.color,
                texture: w.content.texture?.textureCacheIds?.[0] || null,
                w: w.constructor.name,
                type: w.type,
                bgColor: w._backgroundColor,
                bgAlpha: w._backgroundAlpha,
                cornerRadius: w._cornerRadius,
            }));

        const backgroundData = {
            color: this.background.children[0]?.tint ?? 0x1e1e1e,
            alpha: this.background.children[0]?.alpha ?? 1,
            hasTexture: !!this.backgroundSprite,
            texturePath: this.backgroundTexturePath,
            hasGradient: !!this.backgroundGradient,
            gradient: this.backgroundGradient
                ? {
                    type: this.backgroundGradient.type,
                    colorStops: this.backgroundGradient.colorStops,
                    start: this.backgroundGradient.start,
                    end: this.backgroundGradient.end,
                    center: this.backgroundGradient.center,
                    innerRadius: this.backgroundGradient.innerRadius,
                    outerCenter: this.backgroundGradient.outerCenter,
                    outerRadius: this.backgroundGradient.outerRadius,
                    textureSpace: this.backgroundGradient.textureSpace,
                }
                : null,
        };

        console.log(
            JSON.stringify({
                background: backgroundData,
                grid: {
                    size: this.gridSize,
                    visible: this.gridVisible,
                },
                display: {
                    width: this._width,
                    height: this._height,
                },
                widgets,
            }),
        );
        return {
            background: backgroundData,
            grid: {
                size: this.gridSize,
                visible: this.gridVisible,
            },
            display: {
                width: this._width,
                height: this._height,
            },
            widgets,
        };
    }

    getSelected() {
        return this.innerContainer.children.filter(
            (elem) => elem instanceof DraggableWidget && elem.isSelected,
        );
    }

    deleteSelected() {
        this.innerContainer.children
            .filter((elem) => elem instanceof DraggableWidget && elem.isSelected)
            .forEach((elem) => elem.destroy());
    }

    deleteAll() {
        this.innerContainer.children
            .filter((elem) => elem instanceof DraggableWidget)
            .forEach((elem) => elem.destroy());
    }

    async importScene(data) {
        if (!data) return;

        // фон
        if (data.background) {
            let bg1, bg2;
            async function loadBackgroundTextures() {
                try {
                    bg1 = await PIXI.Assets.load("/assets/1.png");
                    bg2 = await PIXI.Assets.load("/assets/2.png");
                    console.log("Фоновые текстуры загружены");
                } catch (error) {
                    console.error("Ошибка загрузки фоновых текстур:", error);
                }
            }
            await loadBackgroundTextures();
            if (data.background.hasTexture) {
                if (data.background.texturePath == "1in") {
                    this.changeBackground({ texture: bg1 });
                } else if (data.background.texturePath == "2in") {
                    this.changeBackground({ texture: bg2 });
                }
            } else if (data.background.hasGradient && data.background.gradient) {
                this.changeBackground({ gradient: data.background.gradient });
            } else {
                this.changeBackground(data.background);
            }
        }

        // сетка
        if (data.grid) {
            this.gridSize = data.grid.size;
            this.toggleGrid(data.grid.visible);
        }
        if (data.display) {
            this.resize(data.display.width, data.display.height);
        }

        // удалить старые виджеты
        this.innerContainer.children
            .filter((c) => c instanceof DraggableWidget)
            .forEach((c) => this.innerContainer.removeChild(c));

        // создать новые
        if (data.widgets) {
            data.widgets.forEach((w) => {
                console.log(w);
                if (w.w == "AnalogClockWidget") {
                    if (w.type == "analog-1") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 1,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-2") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 2,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-3") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 3,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-4") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 4,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-5") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 5,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-6") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 6,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-7") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 7,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "analog-8") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 8,
                        });

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "DigitalClockWidget") {
                    if (w.type == "XLseconds") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new DigitalClockWidget(bounds, 508, 246, {
                            showSeconds: true,
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "XL") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new DigitalClockWidget(bounds, 508, 246, {
                            showSeconds: false,
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "L") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new DigitalClockWidget(bounds, 377, 115, {
                            showSeconds: true,
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "S") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new DigitalClockWidget(bounds, 246, 115, {
                            showSeconds: false,
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "CalendarWidget") {
                    if (w.type == "XL") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CalendarWidget(bounds, 508, 377);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "L") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CalendarWidget(bounds, 508, 246);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "M") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CalendarWidget(bounds, 508, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "S") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CalendarWidget(bounds, 246, 246);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "XS") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CalendarWidget(bounds, 246, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "XS_day") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CalendarWidget(bounds, 246, 115, {
                            dayOnly: true,
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "WeatherWidget") {
                    if (w.type == "XL") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new WeatherWidget(bounds, 508, 246);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "L") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new WeatherWidget(bounds, 377, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "M") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new WeatherWidget(bounds, 246, 246);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "S") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new WeatherWidget(bounds, 246, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "TrafficWidget") {
                    if (w.type == "TRAFFICL") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new TrafficWidget(bounds, 377, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "TRAFFICM") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new TrafficWidget(bounds, 246, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "TRAFFICS") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new TrafficWidget(bounds, 115, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "NewsWidget") {
                    const bounds = new PIXI.Rectangle(
                        0,
                        0,
                        this.getWidth(),
                        this.getHeight(),
                    );
                    const widget = new NewsWidget(bounds, 508, 538);
                    this.addWidget(widget);
                    widget.setPosition(w.x, w.y);
                    widget.setBackgroundColor(w.bgColor);
                    widget.setBackgroundAlpha(w.bgAlpha);
                    widget.setCornerRadius(w.cornerRadius);
                    widget.resize(w.size.width, w.size.height);
                }
                if (w.w == "RatesWidget") {
                    if (w.type == "USDEURS") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new RatesWidget(bounds, 115, 115, {
                            currency: "USDEURS",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "EURM") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new RatesWidget(bounds, 246, 115, {
                            currency: "EUR",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "USDM") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new RatesWidget(bounds, 246, 115, {
                            currency: "USD",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "USDEURM") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new RatesWidget(bounds, 246, 115, {
                            currency: "USDEURM",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "USDL") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new RatesWidget(bounds, 377, 115, {
                            currency: "USD",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "EURL") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new RatesWidget(bounds, 377, 115, {
                            currency: "EUR",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "MetalsWidget") {
                    if (w.type == "metal-L") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new MetalsWidget(bounds, 508, 246);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "metal-S") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new MetalsWidget(bounds, 508, 115);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "CompanyWidget") {
                    if (w.type == "info") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CompanyWidget(bounds, 508, 115, {
                            type: "info",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "logos") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CompanyWidget(bounds, 508, 115, {
                            type: "logos",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                    if (w.type == "simple-logos") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new CompanyWidget(bounds, 508, 115, {
                            type: "simple-logos",
                        });
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
                if (w.w == "SimpleRectWidget") {
                    if (w.type == "SimpleRect") {
                        const bounds = new PIXI.Rectangle(
                            0,
                            0,
                            this.getWidth(),
                            this.getHeight(),
                        );
                        const widget = new SimpleRectWidget(bounds);
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor);
                        widget.setBackgroundAlpha(w.bgAlpha);
                        widget.setCornerRadius(w.cornerRadius);
                        widget.setPosition(w.x, w.y);
                        widget.resize(w.size.width, w.size.height);
                    }
                }
            });
        }
    }

    exportToHTML() {
        const data = this.exportScene();
        let html = `<div style="position:relative; width:${this._width}px; height:${this._height}px; background:#${data.background.color.toString(16)}; opacity:${data.background.alpha};">`;

        data.widgets.forEach((w) => {
            html += `<div style="
                position:absolute;
                left:${w.x}px;
                top:${w.y}px;
                width:${w.size.width}px;
                height:${w.size.height}px;
                background:${w.color};
            "></div>`;
        });

        html += `</div>`;
        return html;
    }

    // ==== ОСНОВНОЙ ФУНКЦИОНАЛ ====

    setupKeyboardControls() {
        document.addEventListener("keydown", (e) => {
            if (e.key.toLowerCase() === "h") {
                this.toggleDrag();
            }

            if (e.key === "+" || e.key === "=") {
                e.preventDefault();
                this.handleZoom({ deltaY: -100, global: this.getCenterPosition() });
            } else if (e.key === "-" || e.key === "_") {
                e.preventDefault();
                this.handleZoom({ deltaY: 100, global: this.getCenterPosition() });
            }
        });
    }

    getCenterPosition() {
        return {
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2,
        };
    }

    toggleDrag() {
        this.dragEnabled = !this.dragEnabled;

        if (this.dragEnabled) {
            this.mainContainer.interactive = true;
            this.mainContainer.cursor = "grab";
        } else {
            this.mainContainer.interactive = false;
            this.mainContainer.cursor = "default";
            if (this.dragData) this.onDragEnd();
        }
    }

    setupZoom() {
        this.mainContainer.interactive = true;
        this.mainContainer.hitArea = new PIXI.Rectangle(
            0,
            0,
            this.outerFrameWidth,
            this.outerFrameHeight,
        );
        this.mainContainer.on("wheel", (event) => {
            event.preventDefault();
            this.handleZoom(event);
        });
    }

    handleZoom(event) {
        const delta = event.deltaY > 0 ? 0.9 : 1.1;

        const mousePos = {
            x: event.global.x - this.mainContainer.x,
            y: event.global.y - this.mainContainer.y,
        };

        const oldScale = this.scale;
        this.scale = Math.max(
            this.minScale,
            Math.min(this.maxScale, this.scale * delta),
        );
        this.mainContainer.scale.set(this.scale);

        const newMousePos = {
            x: (mousePos.x * this.scale) / oldScale,
            y: (mousePos.y * this.scale) / oldScale,
        };

        this.mainContainer.x += mousePos.x - newMousePos.x;
        this.mainContainer.y += mousePos.y - newMousePos.y;

        this.updateGridAfterZoom();
    }

    updateGridAfterZoom() {
        if (this.grid) {
            this.createGrid({
                size: this.gridSize,
                thickness: 1 / this.scale,
            });
        }
    }

    setupDrag() {
        this.mainContainer.interactive = true;
        this.mainContainer.hitArea = new PIXI.Rectangle(
            0,
            0,
            this.outerFrameWidth,
            this.outerFrameHeight,
        );
        this.mainContainer.cursor = "grab";

        this.mainContainer
            .on("pointerdown", this.onDragStart.bind(this))
            .on("pointerup", this.onDragEnd.bind(this))
            .on("pointerupoutside", this.onDragEnd.bind(this))
            .on("pointermove", this.onDragMove.bind(this));
    }

    onDragStart(event) {
        if (!this.dragEnabled) return;
        this.dragData = event.data;
        this.dragStart = {
            x: this.mainContainer.x,
            y: this.mainContainer.y,
            pointer: this.dragData.getLocalPosition(this.mainContainer.parent),
        };
        this.mainContainer.cursor = "grabbing";
    }

    onDragMove(event) {
        if (!this.dragEnabled || !this.dragData) return;
        const newPosition = this.dragData.getLocalPosition(
            this.mainContainer.parent,
        );
        const dx = newPosition.x - this.dragStart.pointer.x;
        const dy = newPosition.y - this.dragStart.pointer.y;
        this.mainContainer.x = this.dragStart.x + dx;
        this.mainContainer.y = this.dragStart.y + dy;
    }

    onDragEnd() {
        this.dragData = null;
        this.dragStart = null;
        this.mainContainer.cursor = "grab";
    }

    createGrid(options) {
        if (options) {
            if (options.size !== undefined) this.gridSize = options.size;
            if (options.color !== undefined) this.gridColor = options.color;
            if (options.alpha !== undefined) this.gridAlpha = options.alpha;
        }

        if (this.grid) {
            this.innerContainer.removeChild(this.grid);
            this.grid.destroy({ children: true });
        }

        this.grid = new Graphics();
        this.grid.fill("rgb(83, 83, 83)", this.gridAlpha);
        const lineThickness = 0.5;

        for (let x = 0; x <= this._width; x += this.gridSize) {
            this.grid.rect(x - lineThickness / 2, 0, lineThickness, this._height);
        }
        for (let y = 0; y <= this._height; y += this.gridSize) {
            this.grid.rect(0, y - lineThickness / 2, this._width, lineThickness);
        }
        this.grid.endFill();

        if (!this.gridContainer) {
            this.gridContainer = new Container();
            this.innerContainer.addChild(this.gridContainer);
        }

        this.gridContainer.removeChildren();
        this.gridContainer.addChild(this.grid);
        this.grid.visible = this.gridVisible;
    }

    addWidget(widgetContent, x, y) {
        const bounds = new PIXI.Rectangle(0, 0, this._width, this._height);

        if (widgetContent instanceof DraggableWidget) {
            widgetContent.position.set(x, y);
            this.innerContainer.addChild(widgetContent);
            widgetContent.on("pointerdown", (e) => {
                e.stopPropagation();
                console.log(widgetContent);
            });
            return widgetContent;
        }

        const widget = new DraggableWidget(bounds, widgetContent);
        widget.position.set(x, y);
        this.innerContainer.addChild(widget);

        return widget;
    }

    setupBackgroundInteraction() {
        this.background.on("pointerdown", (event) => {
            this.deselectAllWidgets();
        });
    }

    deselectAllWidgets() {
        this.innerContainer.children.forEach((widget) => {
            console.log(widget instanceof DraggableWidget);
            if (widget instanceof DraggableWidget) {
                widget.deselect();
            }
        });
    }

    setupGlobalMiddleClick() {
        this.mainContainer.eventMode = "static";
        this.mainContainer.on("pointerdown", (event) => {
            if (event.button === 1) {
                this.deselectAllWidgets();
            }
        });
    }

    toggleGrid(visible) {
        this.gridVisible = visible !== undefined ? visible : !this.gridVisible;
        if (this.grid) {
            this.grid.visible = this.gridVisible;
        } else if (this.gridVisible) {
            this.createGrid();
        }
    }

    resize(width, height) {
        // Сохраняем старые размеры
        const oldWidth = this._width;
        const oldHeight = this._height;

        // Обновляем размеры внутреннего поля
        this._width = width;
        this._height = height;

        // Автоматически обновляем размеры внешнего поля с сохранением пропорций
        const padding = 200; // 200px с каждой стороны
        this.outerFrameWidth = this._width + padding * 2;
        this.outerFrameHeight = this._height + padding * 2;

        // Обновляем позицию внутреннего контейнера (центрируем во внешнем поле)
        this.innerContainer.x = padding;
        this.innerContainer.y = padding;

        // Обновляем фон внутреннего поля
        if (this.background) {
            this.background.children.forEach((child) => {
                child.width = width;
                child.height = height;
            });

            if (this.backgroundSprite) {
                this.backgroundSprite.width = width;
                this.backgroundSprite.height = height;
            }
        }

        // Пересоздаем внешнее поле с новыми размерами
        this.createOuterFrame();

        // Обновляем сетку
        if (this.grid) {
            this.createGrid();
        }

        // Обновляем hitArea для перетаскивания
        this.mainContainer.hitArea = new PIXI.Rectangle(
            0,
            0,
            this.outerFrameWidth,
            this.outerFrameHeight,
        );

        // Обновляем границы для всех виджетов
        this.updateWidgetsBounds();

        // Перецентрируем на экране
        this.centerOnScreen();
    }

    // Добавьте этот вспомогательный метод в класс
    updateWidgetsBounds() {
        const bounds = new PIXI.Rectangle(0, 0, this._width, this._height);

        this.innerContainer.children.forEach((child) => {
            if (child instanceof DraggableWidget) {
                child.setBounds(bounds);
            }
        });
    }

    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    createBackground() {
        this.background = new Container();
        this.backgroundSprite = null;

        const bg = new Sprite(Texture.WHITE);
        bg.width = this._width;
        bg.height = this._height;
        bg.tint = "rgb(30, 30, 30)";
        this.background.addChild(bg);

        this.innerContainer.addChildAt(this.background, 0);
        this.setupBackgroundInteraction();
    }

    getWidth() {
        return this._width;
    }

    getHeight() {
        return this._height;
    }

    getSize() {
        return { width: this._width, height: this._height };
    }

    applyGradientBackground(gradientOptions) {
        const validatedOptions = this.validateGradientOptions(gradientOptions);
        this.changeBackground({ gradient: validatedOptions });
    }

    validateGradientOptions(options) {
        return {
            type: options.type || "linear",
            colorStops: options.colorStops || [
                { offset: 0, color: "#ff0000" },
                { offset: 1, color: "#0000ff" },
            ],
            start: options.start || { x: 0, y: 0 },
            end: options.end || { x: 1, y: 1 },
            textureSpace: options.textureSpace || "local",
        };
    }

    async changeBackground(options = {}) {
        if (!this.background) {
            this.createBackground();
        }

        this.innerContainer.removeChild(this.background);
        this.background.destroy();

        this.background = new Container();
        this.backgroundSprite = null;

        if (options.gradient !== undefined) {
            try {
                const graphics = new Graphics();
                const gradient = new FillGradient({
                    type: options.gradient.type || "linear",
                    colorStops: options.gradient.colorStops || [
                        { offset: 0, color: "red" },
                        { offset: 1, color: "blue" },
                    ],
                    start: options.gradient.start || { x: 0, y: 0 },
                    end: options.gradient.end || { x: 1, y: 1 },
                    textureSpace: options.gradient.textureSpace || "local",
                });

                graphics.rect(0, 0, this._width, this._height);
                graphics.fill(gradient);

                this.background.addChild(graphics);
                this.backgroundGradient = gradient;
            } catch (error) {
                console.error("Ошибка создания градиента:", error);
                this.createDefaultBackground(options);
            }
        } else if (options.color !== undefined) {
            this.createColorBackground(options);
        } else if (options.texture !== undefined) {
            await this.createTextureBackground(options);
        } else {
            this.createDefaultBackground(options);
        }

        this.innerContainer.addChildAt(this.background, 0);
        this.setupBackgroundInteraction();
    }

    createDefaultBackground(options) {
        const bg = new Sprite(Texture.WHITE);
        bg.width = this._width;
        bg.height = this._height;
        bg.tint = 0x1e1e1e;
        bg.alpha = options.alpha !== undefined ? options.alpha : 1;
        this.background.addChild(bg);
    }

    createColorBackground(options) {
        const bg = new Sprite(Texture.WHITE);
        bg.width = this._width;
        bg.height = this._height;
        bg.tint = options.color;
        bg.alpha = options.alpha !== undefined ? options.alpha : 1;
        this.background.addChild(bg);
    }

    async createTextureBackground(options) {
        try {
            let texture;
            if (typeof options.texture === "string") {
                texture = await PIXI.Assets.load(options.texture);
            } else if (options.texture instanceof Texture) {
                texture = options.texture;
                if (options.texture.label.includes("1.png")) {
                    this.backgroundTexturePath = "1in";
                } else if (options.texture.label.includes("2.png")) {
                    this.backgroundTexturePath = "2in";
                }
            }

            if (texture) {
                this.backgroundSprite = new Sprite(texture);
                this.backgroundSprite.width = this._width;
                this.backgroundSprite.height = this._height;
                this.backgroundSprite.alpha =
                    options.alpha !== undefined ? options.alpha : 1;
                this.background.addChild(this.backgroundSprite);
            }
        } catch (error) {
            console.error("Ошибка загрузки текстуры фона:", error);
            this.createDefaultBackground(options);
        }
    }

    applyTextureBackground(texture, path) {
        if (this.backgroundSprite) {
            this.background.removeChild(this.backgroundSprite);
            this.backgroundSprite.destroy();
        }

        this.backgroundSprite = new Sprite(texture);
        this.backgroundSprite.width = this._width;
        this.backgroundSprite.height = this._height;
        this.backgroundSprite.alpha = 1;

        this.background.removeChildren();
        this.background.addChild(this.backgroundSprite);

        this.backgroundTexturePath = path ?? null;
        this.setupBackgroundInteraction();
    }

    // ==== МЕТОДЫ ДЛЯ РАБОТЫ С ВНЕШНИМ ПОЛЕМ ====

    changeOuterFrameColor(color) {
        this.outerFrameColor = color;
        this.createOuterFrame();
    }

    changeOuterFrameAlpha(alpha) {
        this.outerFrameAlpha = alpha;
        this.createOuterFrame();
    }

    getOuterFrameSize() {
        return { width: this.outerFrameWidth, height: this.outerFrameHeight };
    }

    centerOnScreen() {
        this.mainContainer.x =
            (this.app.screen.width - this.outerFrameWidth * this.scale) / 2;
        this.mainContainer.y =
            (this.app.screen.height - this.outerFrameHeight * this.scale) / 2;
    }

    resetView() {
        this.scale = 1;
        this.mainContainer.scale.set(1);
        this.centerOnScreen();
    }
}
