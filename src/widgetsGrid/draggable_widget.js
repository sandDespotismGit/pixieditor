import { Container, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

export default class DraggableWidget extends Container {
    constructor(bounds, width, height, color = 0x3498db) {
        super();

        // Сохраняем параметры
        this.bounds = bounds;
        this._width = width;  // Используем внутренние свойства
        this._height = height;
        this.color = color;
        this.isSelected = false;

        // Важно: устанавливаем размеры контейнера
        this.width = width;
        this.height = height;

        // Создаем графику виджета
        this.createWidget();

        // Настраиваем перетаскивание
        this.setupDrag();

        // Для отладки: покажем границы виджета
        this.debugBounds();
    }

    createWidget() {
        // Очищаем предыдущие элементы
        this.removeChildren();

        // Основной прямоугольник
        this.background = new Graphics()
            .beginFill(this.color)
            .drawRoundedRect(0, 0, this._width, this._height, 5)
            .endFill();

        // Выделение (изначально скрыто)
        this.selection = new Graphics()
            .lineStyle(2, 0xf1c40f, 1)
            .drawRoundedRect(-3, -3, this._width + 6, this._height + 6, 8)
            .endFill();
        this.selection.visible = false;

        // Добавляем в правильном порядке
        this.addChild(this.background);
        this.addChild(this.selection);

        // Включаем взаимодействие
        this.interactive = true;
        this.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
    }

    /**
     * Настраивает перетаскивание виджета
     */
    setupDrag() {
        this.eventMode = 'static';
        this.cursor = 'pointer';

        // Для хранения данных перетаскивания
        this.dragData = null;
        this.dragOffset = new PIXI.Point();

        this.on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));
    }

    /**
     * Обработчик начала перетаскивания
     * @param {PIXI.FederatedPointerEvent} event 
     */
    onDragStart(event) {
        this.dragData = event;
        this.dragOffset.set(event.global.x - this.x, event.global.y - this.y);
        this.select();

        // Поднимаем виджет на верхний уровень
        this.parent.addChild(this);
    }

    /**
     * Обработчик перемещения мыши при перетаскивании
     */
    onDragMove() {
        if (!this.dragData) return;

        const newPosition = this.dragData.getLocalPosition(this.parent);

        // Рассчитываем новые координаты с учетом ограничений
        let newX = newPosition.x - this.dragOffset.x;
        let newY = newPosition.y - this.dragOffset.y;

        // Ограничиваем перемещение границами рабочей области
        newX = Math.max(this.bounds.x, Math.min(this.bounds.width - this.width, newX));
        newY = Math.max(this.bounds.y, Math.min(this.bounds.height - this.height, newY));

        this.position.set(newX, newY);
    }

    /**
     * Обработчик окончания перетаскивания
     */
    onDragEnd() {
        this.dragData = null;
    }

    /**
     * Выделяет виджет
     */
    select() {
        this.isSelected = true;
        this.selection.visible = true;
    }

    /**
     * Снимает выделение с виджета
     */
    deselect() {
        this.isSelected = false;
        this.selection.visible = false;
    }

    /**
     * Возвращает текущие координаты виджета
     * @returns {PIXI.Point}
     */
    getPosition() {
        return new PIXI.Point(this.x, this.y);
    }

    /**
     * Устанавливает новые координаты виджета
     * @param {number} x 
     * @param {number} y 
     */
    setPosition(x, y) {
        // Проверяем границы
        x = Math.max(this.bounds.x, Math.min(this.bounds.width - this.width, x));
        y = Math.max(this.bounds.y, Math.min(this.bounds.height - this.height, y));

        this.position.set(x, y);
    }

    /**
     * Возвращает размеры виджета
     * @returns {Object} {width, height}
     */
    getSize() {
        return { width: this.width, height: this.height };
    }

    // Метод для отладки
    debugBounds() {
        const debug = new Graphics()
            .lineStyle(1, 0xFF0000)
            .drawRect(0, 0, this._width, this._height);
        this.addChild(debug);
    }
}