import { Container, Sprite, Texture, TilingSprite, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

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
        this.container = new Container();
        this.app.stage.addChild(this.container);
        this._width = this.app.screen.width;
        this._height = this.app.screen.height;

        // Параметры сетки
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
        this.selected_widget = null

        this.setupKeyboardControls();
        this.setupZoom();
        this.setupDrag();

        this.createBackground();
        this.setupBackgroundInteraction()
        this.createGrid();
        this.setupGlobalMiddleClick()
    }

    // ==== СЕРИАЛИЗАЦИЯ/ИМПОРТ/ЭКСПОРТ ====

    exportScene() {
        const widgets = this.container.children
            .filter(c => c instanceof DraggableWidget)
            .map(w => ({
                type: w.content.constructor.name, // класс виджета
                widgetClass: w.content.constructor.name, // альтернативное название для ясности
                x: w.x,
                y: w.y,
                size: w.getSize(),
                color: w.color,
                texture: w.content.texture?.textureCacheIds?.[0] || null,
                w: w.constructor.name,
                type: w.type,
                bgColor: w._backgroundColor,
                bgAlpha: w._backgroundAlpha,
                cornerRadius: w._cornerRadius
            }));


        // Добавляем информацию о текстуре фона
        const backgroundData = {
            color: this.background.tint,
            alpha: this.background.alpha,
            hasTexture: this.backgroundSprite !== null,
            texturePath: this.backgroundSprite ? this.backgroundSprite.texture.textureCacheIds?.[0] || null : null
        };

        console.log(JSON.stringify({
            background: backgroundData,

            grid: {
                size: this.gridSize,
                visible: this.gridVisible
            },
            display: {
                width: this._width,
                height: this._height
            },
            widgets
        }))
        return {
            background: backgroundData,
            grid: {
                size: this.gridSize,
                visible: this.gridVisible
            },
            display: {
                width: this._width,
                height: this._height
            },
            widgets
        };
    }
    getSelected() {
        return this.container.children
            .filter((elem) => elem instanceof DraggableWidget && elem.isSelected)
    }
    deleteSelected() {
        this.container.children
            .filter((elem) => elem instanceof DraggableWidget && elem.isSelected).map((elem) => elem.destroy())
    }
    deleteAll() {
        this.container.children
            .filter((elem) => elem instanceof DraggableWidget).map((elem) => elem.destroy())
    }

    async importScene(data) {
        if (!data) return;

        // фон
        if (data.background) {
            this.changeBackground(data.background);
        }

        // сетка
        if (data.grid) {
            this.gridSize = data.grid.size;
            this.toggleGrid(data.grid.visible);
        }

        // удалить старые виджеты
        this.container.children
            .filter(c => c instanceof DraggableWidget)
            .forEach(c => this.container.removeChild(c));

        // создать новые
        if (data.widgets) {
            data.widgets.forEach(w => {
                console.log(w)
                if (w.w == "AnalogClockWidget") {
                    if (w.type == 'analog-1') {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 1
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-2") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 2
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-3") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 3
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-4") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 4
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-5") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 5
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-6") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 6
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-7") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 7
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "analog-8") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new AnalogClockWidget(bounds, 246, 246, {
                            clockType: 8
                        })

                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }


                }
                if (w.w == "DigitalClockWidget") {
                    if (w.type == "XLseconds") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new DigitalClockWidget(bounds, 508, 246, {
                            showSeconds: true
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "XL") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new DigitalClockWidget(bounds, 508, 246, {
                            showSeconds: false
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "L") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new DigitalClockWidget(bounds, 377, 115, {
                            showSeconds: true
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "S") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new DigitalClockWidget(bounds, 246, 115, {
                            showSeconds: false
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                if (w.w == "CalendarWidget") {
                    if (w.type == "XL") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CalendarWidget(bounds, 508, 377)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "L") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CalendarWidget(bounds, 508, 246)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "M") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CalendarWidget(bounds, 508, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "S") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CalendarWidget(bounds, 246, 246)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "XS") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CalendarWidget(bounds, 246, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "XS_day") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CalendarWidget(bounds, 246, 115, { dayOnly: true })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                if (w.w == "WeatherWidget") {
                    if (w.type == "XL") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new WeatherWidget(bounds, 508, 246)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "L") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new WeatherWidget(bounds, 377, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "M") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new WeatherWidget(bounds, 246, 246)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "S") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new WeatherWidget(bounds, 246, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                if (w.w == "TrafficWidget") {
                    if (w.type == "TRAFFICL") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new TrafficWidget(bounds, 377, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "TRAFFICM") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new TrafficWidget(bounds, 246, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "TRAFFICS") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new TrafficWidget(bounds, 115, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                if (w.w == "NewsWidget") {
                    const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                    const widget = new NewsWidget(bounds, 508, 538)
                    this.addWidget(widget);
                    widget.setBackgroundColor(w.bgColor)
                    widget.setBackgroundAlpha(w.bgAlpha)
                    widget.setCornerRadius(w.cornerRadius)
                    widget.setPosition(w.x, w.y)
                    widget.resize(w.size.width, w.size.height)
                }
                if (w.w == "RatesWidget") {
                    if (w.type == "USDEURS") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new RatesWidget(bounds, 115, 115, { currency: "USDEURS" })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "EURM") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new RatesWidget(bounds, 246, 115, { currency: "EUR" })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "USDM") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new RatesWidget(bounds, 246, 115, { currency: "USD" })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "USDEURM") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new RatesWidget(bounds, 246, 115, { currency: "USDEURM" })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "USDL") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new RatesWidget(bounds, 377, 115, { currency: "USD" })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "EURL") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new RatesWidget(bounds, 377, 115, { currency: "EUR" })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                if (w.w == "MetalsWidget") {
                    if (w.type == "metal-L") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new MetalsWidget(bounds, 508, 246)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "metal-S") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new MetalsWidget(bounds, 508, 115)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                if (w.w == "CompanyWidget") {
                    if (w.type == "info") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CompanyWidget(bounds, 508, 115, {
                            type: "info"
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "logos") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CompanyWidget(bounds, 508, 115, {
                            type: "logos"
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)
                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                    if (w.type == "simple-logos") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new CompanyWidget(bounds, 508, 115, {
                            type: "simple-logos"
                        })
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)


                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }

                }
                if (w.w == "SimpleRectWidget") {
                    if (w.type == "SimpleRect") {
                        const bounds = new PIXI.Rectangle(0, 0, this.getWidth(), this.getHeight());
                        const widget = new SimpleRectWidget(bounds)
                        this.addWidget(widget);
                        widget.setBackgroundColor(w.bgColor)
                        widget.setBackgroundAlpha(w.bgAlpha)
                        widget.setCornerRadius(w.cornerRadius)


                        widget.setPosition(w.x, w.y)
                        widget.resize(w.size.width, w.size.height)
                    }
                }
                // const widget = this.addWidget(graphics, w.x, w.y);
                // widget.color = w.color;
            });
        }
    }

    exportToHTML() {
        const data = this.exportScene();
        let html = `<div style="position:relative; width:${this._width}px; height:${this._height}px; background:#${data.background.color.toString(16)}; opacity:${data.background.alpha};">`;

        data.widgets.forEach(w => {
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
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h') {
                this.toggleDrag();
            }

            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                this.handleZoom({ deltaY: -100, global: this.getCenterPosition() });
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                this.handleZoom({ deltaY: 100, global: this.getCenterPosition() });
            }
        });
    }

    getCenterPosition() {
        return {
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2
        };
    }

    toggleDrag() {
        this.dragEnabled = !this.dragEnabled;

        if (this.dragEnabled) {
            this.container.interactive = true;
            this.container.cursor = 'grab';
        } else {
            this.container.interactive = false;
            this.container.cursor = 'default';
            if (this.dragData) this.onDragEnd();
        }
    }

    setupZoom() {
        this.container.interactive = true;
        this.container.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
        this.container.on('wheel', (event) => {
            event.preventDefault();
            this.handleZoom(event);
        });
    }

    handleZoom(event) {
        const delta = event.deltaY > 0 ? 0.9 : 1.1;

        const mousePos = {
            x: event.global.x - this.container.x,
            y: event.global.y - this.container.y
        };

        const oldScale = this.scale;
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));
        this.container.scale.set(this.scale);

        const newMousePos = {
            x: mousePos.x * this.scale / oldScale,
            y: mousePos.y * this.scale / oldScale
        };

        this.container.x += mousePos.x - newMousePos.x;
        this.container.y += mousePos.y - newMousePos.y;

        this.updateGridAfterZoom();
    }

    updateGridAfterZoom() {
        if (this.grid) {
            this.createGrid({
                size: this.gridSize,
                thickness: 1 / this.scale
            });
        }
    }

    setupDrag() {
        this.container.interactive = true;
        this.container.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);

        this.container
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));
    }

    onDragStart(event) {
        if (!this.dragEnabled) return;
        this.dragData = event.data;
        this.dragStart = {
            x: this.container.x,
            y: this.container.y,
            pointer: this.dragData.getLocalPosition(this.container.parent)
        };
        this.container.cursor = 'grabbing';
    }

    onDragMove(event) {
        if (!this.dragEnabled || !this.dragData) return;
        const newPosition = this.dragData.getLocalPosition(this.container.parent);
        const dx = newPosition.x - this.dragStart.pointer.x;
        const dy = newPosition.y - this.dragStart.pointer.y;
        this.container.x = this.dragStart.x + dx;
        this.container.y = this.dragStart.y + dy;
    }

    onDragEnd() {
        this.dragData = null;
        this.dragStart = null;
        this.container.cursor = 'grab';
    }

    createGrid(options) {
        if (options) {
            if (options.size !== undefined) this.gridSize = options.size;
            if (options.color !== undefined) this.gridColor = options.color;
            if (options.alpha !== undefined) this.gridAlpha = options.alpha;
        }

        if (this.grid) {
            this.container.removeChild(this.grid);
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
            this.container.addChild(this.gridContainer);
        }

        this.gridContainer.removeChildren();
        this.gridContainer.addChild(this.grid);
        this.grid.visible = this.gridVisible;
    }

    addWidget(widgetContent, x, y) {
        const bounds = new PIXI.Rectangle(0, 0, this._width, this._height);

        if (widgetContent instanceof DraggableWidget) {
            widgetContent.position.set(x, y);
            this.container.addChild(widgetContent);
            widgetContent.on("pointerdown", (e) => {
                e.stopPropagation(); // чтобы не срабатывал drag editor'а
                console.log(widgetContent)
                // if (widgetContent.isSelected) {
                //     widgetContent.deselect()
                // } else {
                //     widgetContent.select()
                // }


            });
            return widgetContent;
        }

        const widget = new DraggableWidget(bounds, widgetContent);
        widget.position.set(x, y);
        this.container.addChild(widget);


        return widget;
    }
    // В конструкторе EditorFrame или в main.js
    setupBackgroundInteraction() {

        // Обработчик клика по фону
        this.background.on('pointerdown', (event) => {
            this.deselectAllWidgets();
        });
    }

    deselectAllWidgets() {
        this.container.children.forEach(widget => {
            console.log(widget instanceof DraggableWidget)
            if (widget instanceof DraggableWidget) {
                widget.deselect()
            }
        });
    }
    setupGlobalMiddleClick() {
        this.eventMode = 'static';
        this.container.on('pointerdown', (event) => {
            if (event.button === 1) { // Средняя кнопка мыши
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

    // Обновляем метод resize для обработки текстуры фона
    resize(width, height) {
        this._width = width;
        this._height = height;

        if (this.background) {
            // Обновляем размер основного фона
            this.background.children.forEach(child => {
                child.width = width;
                child.height = height;
            });

            // Обновляем размер текстуры, если она есть
            if (this.backgroundSprite) {
                this.backgroundSprite.width = width;
                this.backgroundSprite.height = height;
            }
        }

        if (this.grid) {
            this.createGrid();
        }
        if (this.dragEnabled) {
            this.setupDrag();
        }
    }

    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    createBackground() {
        this.background = new Container();
        this.backgroundSprite = null;

        // Создаем базовый фон
        const bg = new Sprite(Texture.WHITE);
        bg.width = this._width;
        bg.height = this._height;
        bg.tint = 'rgb(30, 30, 30)';
        this.background.addChild(bg);

        this.container.addChildAt(this.background, 0);
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

    async changeBackground(options = {}) {
        if (!this.background) {
            this.createBackground();
        }

        // Если передается цвет - удаляем текстуру если она есть
        if (options.color !== undefined) {
            // Удаляем текстуру если она была
            if (this.backgroundSprite) {
                this.background.removeChild(this.backgroundSprite);
                this.backgroundSprite.destroy();
                this.backgroundSprite = null;
            }

            // Создаем базовый цветной фон
            const bg = new Sprite(Texture.WHITE);
            bg.width = this._width;
            bg.height = this._height;
            bg.tint = options.color;

            // Удаляем старый фон и добавляем новый
            this.container.removeChild(this.background);
            this.background.destroy();

            this.background = new Container();
            this.background.addChild(bg);
            this.container.addChildAt(this.background, 0);

            // Восстанавливаем обработчики событий
            this.setupBackgroundInteraction();
        }

        // Если передается текстура - удаляем цветной фон
        if (options.texture !== undefined) {
            // Если передана текстура (объект PIXI.Texture)
            if (options.texture instanceof PIXI.Texture) {
                this.applyTextureBackground(options.texture);
            }
            // Если передан путь к текстуре (URL или local path)
            else if (typeof options.texture === 'string') {
                try {
                    const texture = await PIXI.Assets.load(options.texture);
                    this.applyTextureBackground(texture);
                } catch (error) {
                    console.error('Ошибка загрузки текстуры фона:', error);
                    throw error;
                }
            }
        }

        if (options.alpha !== undefined) {
            this.background.alpha = options.alpha;
        }
    }

    applyTextureBackground(texture) {
        // Удаляем предыдущий спрайт текстуры, если он есть
        if (this.backgroundSprite) {
            this.background.removeChild(this.backgroundSprite);
            this.backgroundSprite.destroy();
        }

        // Создаем новый спрайт с текстурой
        this.backgroundSprite = new Sprite(texture);

        // Устанавливаем размеры спрайта под размеры редактора
        this.backgroundSprite.width = this._width;
        this.backgroundSprite.height = this._height;

        // Удаляем старый фон и добавляем текстуру как новый фон
        this.container.removeChild(this.background);
        this.background.destroy();

        // Создаем новый контейнер для фона
        this.background = new Container();
        this.background.addChild(this.backgroundSprite);
        this.container.addChildAt(this.background, 0);

        // Восстанавливаем обработчики событий
        this.setupBackgroundInteraction();
    }

}
