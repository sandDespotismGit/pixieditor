import { Container, Sprite, Texture, TilingSprite, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

import DraggableWidget from "../widgetsGrid/draggable_widget";

export default class EditorFrame {

    constructor(app) {
        this.app = app;
        this.container = new Container();
        this.app.stage.addChild(this.container);
        this._width = this.app.screen.width;  // внутреннее свойство для ширины
        this._height = this.app.screen.height; // внутреннее свойство для высоты

        // Параметры сетки
        this.grid = null;
        this.gridVisible = true;
        this.gridSize = 20;
        this.gridColor = "rgb(83, 83, 83)";
        this.gridAlpha = 1;

        // Добавляем параметры масштабирования
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;

        // Добавляем флаг для перетаскивания
        this.dragEnabled = true;

        // Инициализируем обработчик клавиатуры
        this.setupKeyboardControls();

        // Инициализируем обработчик колеса
        this.setupZoom();

        // Добавляем обработчики для перетаскивания
        this.dragData = null;
        this.dragStart = null;
        this.setupDrag();

        this.createBackground();
        this.createGrid()
    }
    /**
     * Настраивает обработку клавиатуры
     */
    setupKeyboardControls() {
        // Обработчик нажатия клавиш
        document.addEventListener('keydown', (e) => {
            // Переключаем перетаскивание по нажатию H
            if (e.key.toLowerCase() === 'h') {
                this.toggleDrag();
            }
        });
    }

    /**
    * Переключает возможность перетаскивания рабочей области
    */
    toggleDrag() {
        this.dragEnabled = !this.dragEnabled;

        if (this.dragEnabled) {
            // Включаем перетаскивание
            this.container.interactive = true;
            this.container.cursor = 'grab';
            console.log('Drag enabled');
        } else {
            // Отключаем перетаскивание
            this.container.interactive = false;
            this.container.cursor = 'default';

            // Если было начато перетаскивание - завершаем его
            if (this.dragData) {
                this.onDragEnd();
            }
            console.log('Drag disabled');
        }
    }

    /**
     * Настраивает масштабирование колесом мыши
     */
    setupZoom() {
        this.container.interactive = true;
        this.container.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);

        this.container.on('wheel', (event) => {
            event.preventDefault();
            this.handleZoom(event);
        });
    }

    /**
     * Обрабатывает масштабирование
     * @param {WheelEvent} event - Событие колеса мыши
     */
    handleZoom(event) {
        // Определяем направление прокрутки
        const delta = event.deltaY > 0 ? 0.9 : 1.1;

        // Получаем позицию мыши относительно контейнера
        const mousePos = {
            x: event.global.x - this.container.x,
            y: event.global.y - this.container.y
        };

        // Сохраняем старый масштаб
        const oldScale = this.scale;

        // Вычисляем новый масштаб с ограничениями
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));

        // Применяем масштаб
        this.container.scale.set(this.scale);

        // Корректируем позицию для сохранения точки под курсором
        const newMousePos = {
            x: mousePos.x * this.scale / oldScale,
            y: mousePos.y * this.scale / oldScale
        };

        this.container.x += mousePos.x - newMousePos.x;
        this.container.y += mousePos.y - newMousePos.y;

        // Обновляем сетку при масштабировании
        this.updateGridAfterZoom();
    }

    /**
     * Обновляет сетку после масштабирования
     */
    updateGridAfterZoom() {
        if (this.grid) {
            // Рассчитываем эффективный размер сетки с учетом масштаба
            const effectiveGridSize = this.gridSize; // Базовый размер без изменений

            // Пересоздаем сетку с новыми параметрами
            this.createGrid({
                size: effectiveGridSize,
                // Учитываем масштаб в толщине линий
                thickness: 1 / this.scale
            });
        }
    }
    /**
     * Настраивает перетаскивание рабочей области
     */
    setupDrag() {
        // Делаем весь контейнер интерактивным
        this.container.interactive = true;
        this.container.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);

        // Обработчики событий
        this.container
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));
    }

    /**
     * Начало перетаскивания
     * @param {PIXI.InteractionEvent} event 
     */
    onDragStart(event) {
        if (!this.dragEnabled) return;
        // Запоминаем начальную позицию
        this.dragData = event.data;
        this.dragStart = {
            x: this.container.x,
            y: this.container.y,
            pointer: this.dragData.getLocalPosition(this.container.parent)
        };

        // Изменяем курсор
        this.container.cursor = 'grabbing';
    }

    /**
     * Перемещение при перетаскивании
     * @param {PIXI.InteractionEvent} event 
     */
    onDragMove(event) {
        if (!this.dragEnabled || !this.dragData) return;

        const newPosition = this.dragData.getLocalPosition(this.container.parent);

        // Вычисляем смещение
        const dx = newPosition.x - this.dragStart.pointer.x;
        const dy = newPosition.y - this.dragStart.pointer.y;

        // Применяем смещение к контейнеру
        this.container.x = this.dragStart.x + dx;
        this.container.y = this.dragStart.y + dy;
    }

    /**
     * Конец перетаскивания
     */
    onDragEnd() {
        this.dragData = null;
        this.dragStart = null;
        this.container.cursor = 'grab';
    }
    /**
     * Создает или обновляет сетку
     * @param {object} [options] - Параметры сетки
     * @param {number} [options.size=20] - Размер ячейки
     * @param {number} [options.color="rgb(83, 83, 83)"] - Цвет
     * @param {number} [options.alpha=0.2] - Прозрачность
     */
    /**
     * Создает или обновляет сетку с использованием прямоугольников
     * @param {object} [options] - Параметры сетки
     */
    createGrid(options) {
        // Обновляем параметры если переданы
        if (options) {
            if (options.size !== undefined) this.gridSize = options.size;
            if (options.color !== undefined) this.gridColor = options.color;
            if (options.alpha !== undefined) this.gridAlpha = options.alpha;
        }

        // Удаляем старую сетку
        if (this.grid) {
            this.container.removeChild(this.grid);
            this.grid.destroy({ children: true });
        }

        // Создаем новую сетку
        this.grid = new Graphics();

        // Настройки для максимальной видимости
        this.grid.fill("rgb(83, 83, 83)", this.gridAlpha);

        // Толщина линий сетки (в пикселях)
        const lineThickness = 0.5;

        // Вертикальные линии (рисуем как тонкие прямоугольники)
        for (let x = 0; x <= this._width; x += this.gridSize) {
            this.grid.rect(
                x - lineThickness / 2, // X позиция
                0,                  // Y позиция
                lineThickness,       // Ширина
                this._height         // Высота
            );
        }

        // Горизонтальные линии
        for (let y = 0; y <= this._height; y += this.gridSize) {
            this.grid.rect(
                0,                  // X позиция
                y - lineThickness / 2,// Y позиция
                this._width,        // Ширина
                lineThickness       // Высота
            );
        }

        this.grid.endFill();

        // Добавляем сетку в отдельный контейнер
        if (!this.gridContainer) {
            this.gridContainer = new Container();
            this.container.addChild(this.gridContainer);
        }

        this.gridContainer.removeChildren();
        this.gridContainer.addChild(this.grid);
        this.grid.visible = this.gridVisible;

        // Для отладки
        this.debugGrid();
    }

    // В классе EditorFrame
    addWidget(widgetContent) {
        // Создаем границы для виджета
        const bounds = new PIXI.Rectangle(
            0,
            0,
            this._width,
            this._height
        );

        // Если передали уже готовый DraggableWidget
        if (widgetContent instanceof DraggableWidget) {
            widgetContent.position.set(50, 50);
            this.container.addChild(widgetContent);
            return widgetContent;
        }

        // Если передали обычный контейнер или графику - оборачиваем в DraggableWidget
        const widget = new DraggableWidget(bounds, widgetContent);
        widget.position.set(50, 50);
        this.container.addChild(widget);

        return widget;
    }

    /**
     * Метод для отладки сетки
     */
    debugGrid() {

        console.log('Grid debug:', {
            width: this._width,
            height: this._height,
            color: this.gridColor.toString(16),
            size: this.gridSize,
            bounds: this.grid.getBounds()
        });
    }
    /**
     * Переключает видимость сетки
     * @param {boolean} [visible] - Если не указано - переключает
     */
    toggleGrid(visible) {
        this.gridVisible = visible !== undefined ? visible : !this.gridVisible;

        if (this.grid) {
            this.grid.visible = this.gridVisible;
        } else if (this.gridVisible) {
            this.createGrid();
        }
    }

    /**
     * Изменяет размеры с обновлением сетки
     * @param {number} width - Новая ширина
     * @param {number} height - Новая высота
     */
    resize(width, height) {
        this._width = width;
        this._height = height;

        if (this.background) {
            this.background.width = width;
            this.background.height = height;

            if (this.background instanceof TilingSprite) {
                this.background.width = width;
                this.background.height = height;
            }
        }

        // Обновляем сетку
        if (this.grid) {
            this.createGrid();
        }
    }

    /**
     * Привязывает координату к сетке
     * @param {number} value - Координата
     * @returns {number} Привязанная координата
     */
    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    createBackground() {
        const bg = new Sprite(Texture.WHITE);
        this.background = bg;
        this.resize(this.app.screen.width, this.app.screen.height);
        bg.tint = 'rgb(30, 30, 30)';
        this.container.addChild(bg);
    }

    /**
     * Изменяет размеры фрейма
     * @param {number} width - Новая ширина
     * @param {number} height - Новая высота
     */
    resize(width, height) {
        this._width = width;
        this._height = height;

        if (this.background) {
            this.background.width = width;
            this.background.height = height;

            // Если это TilingSprite, обновляем и его размеры
            if (this.background instanceof TilingSprite) {
                this.background.width = width;
                this.background.height = height;
            }
        }
    }

    /**
     * Получает текущую ширину фрейма
     * @returns {number} Текущая ширина
     */
    getWidth() {
        return this._width;
    }

    /**
     * Получает текущую высоту фрейма
     * @returns {number} Текущая высота
     */
    getHeight() {
        return this._height;
    }

    /**
     * Получает текущие размеры фрейма
     * @returns {object} Объект с шириной и высотой {width, height}
     */
    getSize() {
        return {
            width: this._width,
            height: this._height
        };
    }

    /**
     * Изменяет параметры фона
     * @param {object} options - Параметры фона
     * @param {number|string} [options.color] - Новый цвет
     * @param {string} [options.texture] - Путь к новой текстуре
     * @param {number} [options.alpha] - Прозрачность (0-1)
     * @param {boolean} [options.tiling] - Флаг для тайлинга
     */
    changeBackground(options = {}) {
        if (!this.background) {
            this.createBackground();
        }

        if (options.color !== undefined) {
            this.background.tint = options.color;
        }

        if (options.texture) {
            PIXI.Assets.load(options.texture).then(texture => {
                this.background.texture = texture;
                console.log("cock", texture)

                if (options.tiling) {
                    const oldBg = this.background;
                    this.background = new TilingSprite(
                        texture,
                        this._width,
                        this._height
                    );
                    this.background.tint = oldBg.tint;
                    this.background.alpha = oldBg.alpha;
                    this.container.removeChild(oldBg);
                    this.container.addChildAt(this.background, 0);
                }
            });
        }

        if (options.alpha !== undefined) {
            this.background.alpha = options.alpha;
        }
    }
}