// DirectionFloorWidget.js
import { Container, Graphics, Text } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class DirectionFloorWidget extends DraggableWidget {
    constructor(bounds, options = {}) {
        const width = options.width ?? 200;
        const height = options.height ?? 300;

        const content = new Container();

        // Основной контейнер
        const mainContainer = new Container();
        content.addChild(mainContainer);

        // Фон
        const bg = new Graphics();
        mainContainer.addChild(bg);

        // ПЕРЕДАЕМ РАЗМЕРЫ ЧЕРЕЗ CONTENT В SUPER()
        super(bounds, content, options);

        // Сохраняем ссылки
        this.bg = bg;
        this.mainContainer = mainContainer;

        // Параметры отображения
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? options.borderRadius ?? 32;
        this._dotColor = options.dotColor ?? 0x00ff00;
        this._dotSize = options.dotSize ?? 8;
        this._dotSpacing = options.dotSpacing ?? 4;
        this._inactiveAlpha = options.inactiveAlpha ?? 0.2;

        // Текущее состояние
        this._direction = options.direction ?? 'none';
        this._floor = options.floor ?? 1;
        this._floors = options.floors ?? 10;
        this._targetFloor = this._floor;
        this._sourceUrl = options.sourceUrl || options.lkdsUrl || "";
        this._pollIntervalMs = Math.max(5000, Number(options.pollIntervalMs || options.pollInterval || 10000));

        // Анимационные параметры
        this._blinkInterval = null;
        this._blinkState = false;
        this._animationSpeed = options.animationSpeed ?? 500; // ms
        this._isAnimating = false;
        this._animationSteps = [];
        this._currentAnimationStep = 0;

        this.type = "DirectionFloorDisplay";
        this.widgetType = "DirectionFloorWidget";
        this._drawBackground(width, height);

        // Создаем элементы отображения
        this._createDisplay();

        // Первичная отрисовка
        this._updateDisplay();

        // Запускаем мигание стрелок
        this._startBlinking();
        if (this._sourceUrl) this.startExternalPolling();
    }

    _drawBackground(width = this._width, height = this._height) {
        this.bg.clear();
        this.bg.beginFill(this._backgroundColor, this._backgroundAlpha);
        const radius = Math.max(0, Math.min(this._cornerRadius || 0, width / 2, height / 2));
        if (radius > 0 && typeof this.bg.drawRoundedRect === "function") {
            this.bg.drawRoundedRect(0, 0, width, height, radius);
        } else {
            this.bg.drawRect(0, 0, width, height);
        }
        this.bg.endFill();
    }

    _createDisplay() {
        const width = this._width;
        const height = this._height;

        // Контейнер для стрелки направления
        this.directionContainer = new Container();
        this.mainContainer.addChild(this.directionContainer);

        // Контейнер для отображения этажа
        this.floorContainer = new Container();
        this.mainContainer.addChild(this.floorContainer);

        // Создаем точки для стрелки вверх
        this.upDots = [];
        this._createArrowDots('up', this.upDots);

        // Создаем точки для стрелки вниз
        this.downDots = [];
        this._createArrowDots('down', this.downDots);

        // Создаем точки для цифр этажа
        this.digitDots = [];
        this._createDigitDots();

        this.floorText = new Text(String(this._floor), {
            fontFamily: "Rubik",
            fontSize: Math.max(42, this._height * 0.5),
            fontWeight: "300",
            fill: 0xffffff,
        });
        this.floorText.anchor.set(0.5);

        this.labelText = new Text("этаж", {
            fontFamily: "Rubik",
            fontSize: Math.max(18, this._height * 0.12),
            fontWeight: "500",
            fill: 0xffffff,
        });
        this.labelText.anchor.set(0.5);

        this.upArrowText = new Text("↑", {
            fontFamily: "Rubik",
            fontSize: Math.max(44, this._height * 0.34),
            fontWeight: "300",
            fill: 0xffffff,
        });
        this.upArrowText.anchor.set(0.5);

        this.downArrowText = new Text("↓", {
            fontFamily: "Rubik",
            fontSize: Math.max(44, this._height * 0.34),
            fontWeight: "300",
            fill: 0xffffff,
        });
        this.downArrowText.anchor.set(0.5);

        this.floorContainer.visible = false;
        this.directionContainer.visible = false;
        this.mainContainer.addChild(this.floorText, this.labelText, this.upArrowText, this.downArrowText);
        this._layoutTextDisplay();
    }

    _layoutTextDisplay() {
        if (!this.floorText) return;
        this.floorText.style.fontSize = Math.max(42, Math.min(this._width * 0.72, this._height * 0.5));
        this.labelText.style.fontSize = Math.max(16, Math.min(this._width * 0.18, this._height * 0.12));
        const arrowSize = Math.max(42, Math.min(this._width * 0.32, this._height * 0.34));
        this.upArrowText.style.fontSize = arrowSize;
        this.downArrowText.style.fontSize = arrowSize;
        this.floorText.position.set(this._width * 0.34, this._height * 0.38);
        this.labelText.position.set(this._width * 0.34, this._height * 0.76);
        this.upArrowText.position.set(this._width * 0.78, this._height * 0.3);
        this.downArrowText.position.set(this._width * 0.78, this._height * 0.74);
    }

    _createArrowDots(direction, dotsArray) {
        const centerX = this._width / 2;
        // Еще ниже опустил стрелку вниз
        let startY = direction === 'up' ? 40 : 240;

        const dotPositions = direction === 'up'
            ? [
                { x: 0, y: -2 },
                { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
                { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
                { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
                { x: 0, y: 2 }
            ]
            : [
                { x: 0, y: 2 },
                { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 },
                { x: -2, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 },
                { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
                { x: 0, y: -2 }
            ];

        dotPositions.forEach(pos => {
            const dot = new Graphics();
            dot.beginFill(this._dotColor, this._inactiveAlpha);
            dot.drawCircle(0, 0, this._dotSize);
            dot.endFill();

            dot.x = centerX + pos.x * (this._dotSize + this._dotSpacing);
            dot.y = startY + pos.y * (this._dotSize + this._dotSpacing);

            this.directionContainer.addChild(dot);
            dotsArray.push(dot);
        });
    }

    _createDigitDots() {
        const centerX = this._width / 2;
        const startY = 120;

        const segmentPoints = {
            A: [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
            B: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
            C: [{ x: 2, y: 2 }, { x: 2, y: 3 }, { x: 2, y: 4 }],
            D: [{ x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }],
            E: [{ x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
            F: [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
            G: [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }]
        };

        Object.keys(segmentPoints).forEach(segmentName => {
            segmentPoints[segmentName].forEach(point => {
                const dot = new Graphics();
                dot.beginFill(this._dotColor, this._inactiveAlpha);
                dot.drawCircle(0, 0, this._dotSize);
                dot.endFill();

                dot.x = centerX + (point.x - 1) * (this._dotSize * 2 + this._dotSpacing);
                dot.y = startY + point.y * (this._dotSize * 1.5 + this._dotSpacing);

                this.floorContainer.addChild(dot);
                this.digitDots.push({
                    graphics: dot,
                    segment: segmentName
                });
            });
        });

        this.digitPatterns = {
            0: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 0 },
            1: { A: 0, B: 1, C: 1, D: 0, E: 0, F: 0, G: 0 },
            2: { A: 1, B: 1, C: 0, D: 1, E: 1, F: 0, G: 1 },
            3: { A: 1, B: 1, C: 1, D: 1, E: 0, F: 0, G: 1 },
            4: { A: 0, B: 1, C: 1, D: 0, E: 0, F: 1, G: 1 },
            5: { A: 1, B: 0, C: 1, D: 1, E: 0, F: 1, G: 1 },
            6: { A: 1, B: 0, C: 1, D: 1, E: 1, F: 1, G: 1 },
            7: { A: 1, B: 1, C: 1, D: 0, E: 0, F: 0, G: 0 },
            8: { A: 1, B: 1, C: 1, D: 1, E: 1, F: 1, G: 1 },
            9: { A: 1, B: 1, C: 1, D: 1, E: 0, F: 1, G: 1 }
        };
    }

    _startBlinking() {
        if (this._blinkInterval) {
            clearInterval(this._blinkInterval);
        }

        this._blinkInterval = setInterval(() => {
            this._blinkState = !this._blinkState;
            this._updateDirection();
        }, this._animationSpeed);
    }

    _stopBlinking() {
        if (this._blinkInterval) {
            clearInterval(this._blinkInterval);
            this._blinkInterval = null;
        }
    }

    _updateDisplay() {
        this._updateDirection();
        this._updateFloor();
    }

    _updateDirection() {
        // Сбрасываем все точки стрелок
        [...this.upDots, ...this.downDots].forEach(dot => {
            dot.clear();
            dot.beginFill(this._dotColor, this._inactiveAlpha);
            dot.drawCircle(0, 0, this._dotSize);
            dot.endFill();
        });

        // Подсвечиваем активную стрелку с миганием
        if (this._direction !== 'none') {
            const activeDots = this._direction === 'up' ? this.upDots : this.downDots;
            const alpha = this._blinkState ? 1 : 0.7; // Мигание между ярким и чуть тусклее

            activeDots.forEach(dot => {
                dot.clear();
                dot.beginFill(this._dotColor, alpha);
                dot.drawCircle(0, 0, this._dotSize);
                dot.endFill();
            });
        }

        if (this.upArrowText && this.downArrowText) {
            const activeAlpha = this._blinkState ? 1 : 0.72;
            this.upArrowText.alpha = this._direction === 'up' ? activeAlpha : 0.28;
            this.downArrowText.alpha = this._direction === 'down' ? activeAlpha : 0.28;
        }
    }

    _updateFloor() {
        // Сбрасываем все точки цифры
        this.digitDots.forEach(dotInfo => {
            dotInfo.graphics.clear();
            dotInfo.graphics.beginFill(this._dotColor, this._inactiveAlpha);
            dotInfo.graphics.drawCircle(0, 0, this._dotSize);
            dotInfo.graphics.endFill();
        });

        const pattern = this.digitPatterns[this._floor] || this.digitPatterns[0];
        if (this.floorText) this.floorText.text = String(this._floor);

        this.digitDots.forEach(dotInfo => {
            if (pattern[dotInfo.segment] === 1) {
                dotInfo.graphics.clear();
                dotInfo.graphics.beginFill(this._dotColor, 1);
                dotInfo.graphics.drawCircle(0, 0, this._dotSize);
                dotInfo.graphics.endFill();
            }
        });
    }

    // === АНИМАЦИЯ ИЗМЕНЕНИЯ ЭТАЖА ===
    _startFloorAnimation(targetFloor, direction) {
        if (this._isAnimating) return;

        this._isAnimating = true;
        this._targetFloor = targetFloor;
        this._direction = direction;

        // Создаем последовательность этажей для анимации
        this._animationSteps = [];
        const step = targetFloor > this._floor ? 1 : -1;

        for (let i = this._floor + step; i !== targetFloor + step; i += step) {
            this._animationSteps.push(i);
        }

        this._currentAnimationStep = 0;
        this._animateNextStep();
    }

    _animateNextStep() {
        if (this._currentAnimationStep >= this._animationSteps.length) {
            this._isAnimating = false;
            this._floor = this._targetFloor;
            this._updateFloor();
            return;
        }

        const nextFloor = this._animationSteps[this._currentAnimationStep];
        this._floor = nextFloor;
        this._updateFloor();

        this._currentAnimationStep++;

        // Запускаем следующий шаг с задержкой
        setTimeout(() => {
            this._animateNextStep();
        }, this._animationSpeed / 2);
    }

    // === API ДЛЯ УПРАВЛЕНИЯ ===
    setDirection(direction) {
        const validDirections = ['up', 'down', 'none'];
        if (validDirections.includes(direction)) {
            this._direction = direction;
            this._updateDirection();
        }
    }

    setSourceUrl(url) {
        this._sourceUrl = String(url || "").trim();
        this.startExternalPolling();
    }

    getSourceUrl() {
        return this._sourceUrl || "";
    }

    setPollIntervalMs(value) {
        this._pollIntervalMs = Math.max(5000, Number(value) || 10000);
        if (this._sourceUrl) this.startExternalPolling();
    }

    startExternalPolling() {
        this.stopExternalPolling();
        if (!this._sourceUrl) return;
        this.fetchExternalState();
        this._externalPollTimer = setInterval(() => this.fetchExternalState(), this._pollIntervalMs);
    }

    stopExternalPolling() {
        if (this._externalPollTimer) {
            clearInterval(this._externalPollTimer);
            this._externalPollTimer = null;
        }
    }

    async fetchExternalState() {
        try {
            const response = await fetch(this._sourceUrl, { cache: "no-store" });
            if (!response.ok) throw new Error(`Floor source ${response.status}`);
            const contentType = response.headers.get("content-type") || "";
            const payload = contentType.includes("application/json")
                ? await response.json()
                : await response.text();
            const state = this.parseExternalState(payload);
            if (Number.isFinite(state.floor)) this.setFloor(state.floor);
            if (state.direction) this.setDirection(state.direction);
        } catch (error) {
            console.warn("Ошибка загрузки этажа:", error);
        }
    }

    parseExternalState(payload) {
        const raw = typeof payload === "string" ? payload : JSON.stringify(payload || {});
        const data = typeof payload === "object" && payload ? payload : {};
        const floorValue =
            data.floor ?? data.currentFloor ?? data.current_floor ?? data.etazh ?? data.level;
        const parsedFloor =
            Number.isFinite(Number(floorValue))
                ? Number(floorValue)
                : Number((raw.match(/(?:floor|currentFloor|current_floor|этаж|etazh|level)["':=\s-]*(\-?\d+)/i) || [])[1]);
        const directionRaw = String(
            data.direction ?? data.dir ?? data.move ?? data.movement ?? raw,
        ).toLowerCase();
        let direction = null;
        if (/up|вверх|подъем|rise|1/.test(directionRaw)) direction = "up";
        if (/down|вниз|спуск|fall|-1/.test(directionRaw)) direction = "down";
        if (/stop|none|стоп|ожид|0/.test(directionRaw)) direction = "none";
        return { floor: parsedFloor, direction };
    }

    setFloor(floor, animate = true) {
        const targetFloor = Math.max(0, Math.min(this._floors, Math.floor(floor)));

        if (targetFloor === this._floor) return;

        if (animate && Math.abs(targetFloor - this._floor) > 1) {
            const direction = targetFloor > this._floor ? 'up' : 'down';
            this._startFloorAnimation(targetFloor, direction);
        } else {
            this._floor = targetFloor;
            this._updateFloor();
        }
    }

    goUp(animate = true) {
        if (this._floor < this._floors) {
            this.setFloor(this._floor + 1, animate);
            this.setDirection('up');
            return true;
        }
        return false;
    }

    goDown(animate = true) {
        if (this._floor > 0) {
            this.setFloor(this._floor - 1, animate);
            this.setDirection('down');
            return true;
        }
        return false;
    }

    // Автоматическое движение до целевого этажа
    moveToFloor(targetFloor, callback = null) {
        targetFloor = Math.max(0, Math.min(this._floors, targetFloor));

        if (targetFloor === this._floor) {
            this.setDirection('none');
            if (callback) callback();
            return;
        }

        const direction = targetFloor > this._floor ? 'up' : 'down';
        this._startFloorAnimation(targetFloor, direction);

        // Колбек когда анимация завершится
        const checkCompletion = () => {
            if (!this._isAnimating) {
                this.setDirection('none');
                if (callback) callback();
            } else {
                setTimeout(checkCompletion, 100);
            }
        };
        checkCompletion();
    }

    setDotColor(color) {
        this._dotColor = color;
        this._updateDisplay();
    }

    setDotSize(size) {
        this._dotSize = Math.max(1, size);
        this._recreateDisplay();
    }

    setDotSpacing(spacing) {
        this._dotSpacing = Math.max(0, spacing);
        this._recreateDisplay();
    }

    setInactiveAlpha(alpha) {
        this._inactiveAlpha = Math.max(0, Math.min(1, alpha));
        this._updateDisplay();
    }

    setAnimationSpeed(speed) {
        this._animationSpeed = Math.max(100, speed);
        this._startBlinking(); // Перезапускаем мигание с новой скоростью
    }

    setMaxFloors(floors) {
        this._floors = Math.max(1, floors);
        if (this._floor > this._floors) {
            this.setFloor(this._floors);
        }
    }

    getCurrentFloor() {
        return this._floor;
    }

    getCurrentDirection() {
        return this._direction;
    }

    isAnimating() {
        return this._isAnimating;
    }

    _recreateDisplay() {
        this.mainContainer.removeChildren();
        this.mainContainer.addChild(this.bg);

        this.upDots = [];
        this.downDots = [];
        this.digitDots = [];

        this._createDisplay();
        this._updateDisplay();
    }

    // Переопределяем метод ресайза
    onResize(width, height) {
        this._width = width;
        this._height = height;

        this._drawBackground(width, height);

        this._recreateDisplay();
        this._layoutTextDisplay();
    }

    // === НАСЛЕДОВАННЫЕ МЕТОДЫ API ===
    setColor(color) {
        this._backgroundColor = color;
        this._drawBackground();
    }

    setAlpha(alpha) {
        this._backgroundAlpha = alpha;
        this._drawBackground();
    }

    setBackgroundColor(color) {
        this.setColor(color);
    }

    setBackgroundAlpha(alpha) {
        this.setAlpha(alpha);
    }

    setCornerRadius(radius) {
        this._cornerRadius = Math.max(0, Number(radius) || 0);
        this._drawBackground();
    }

    // Сброс к начальному состоянию
    reset() {
        this._stopBlinking();
        this._isAnimating = false;
        this._floor = 1;
        this._direction = 'none';
        this._targetFloor = 1;
        this._updateDisplay();
        this._startBlinking();
    }

    getSceneData() {
        return {
            ...super.getSceneData(),
            floorData: {
                floor: this._floor,
                floors: this._floors,
                direction: this._direction,
                sourceUrl: this._sourceUrl,
                pollIntervalMs: this._pollIntervalMs,
                dotColor: this._dotColor,
                animationSpeed: this._animationSpeed,
                cornerRadius: this._cornerRadius,
            },
        };
    }

    // Демо-режим - автоматическое перемещение по этажам
    startDemo(interval = 2000) {
        this._demoInterval = setInterval(() => {
            if (!this._isAnimating) {
                const randomFloor = Math.floor(Math.random() * this._floors) + 1;
                this.moveToFloor(randomFloor);
            }
        }, interval);
    }

    stopDemo() {
        if (this._demoInterval) {
            clearInterval(this._demoInterval);
            this._demoInterval = null;
        }
    }

    destroy(options) {
        this._stopBlinking();
        this.stopExternalPolling();
        this.stopDemo();

        this.upDots.forEach(dot => dot.clear());
        this.downDots.forEach(dot => dot.clear());
        this.digitDots.forEach(dot => dot.graphics.clear());

        super.destroy(options);
    }
}
