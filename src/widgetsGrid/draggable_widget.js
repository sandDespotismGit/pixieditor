import { Container, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

export default class DraggableWidget extends Container {
    constructor(bounds, width, height, color = 0x3498db) {
        super();

        // Сохраняем параметры
        this.bounds = bounds;
        this._width = width;
        this._height = height;
        this.color = color;
        this.isSelected = false;

        // Устанавливаем размеры и делаем виджет интерактивным
        this.width = width;
        this.height = height;
        this.eventMode = 'static';
        this.cursor = 'pointer';

        // Создаем графику виджета
        this.createWidget();

        // Настраиваем перетаскивание
        this.setupDrag();

        // Для отладки
        console.log('Widget created with bounds:', bounds);
    }

    createWidget() {
        this.removeChildren();

        // Основной прямоугольник (сделаем его ярче для видимости)
        this.background = new Graphics()
            .beginFill(this.color, 0.8) // Добавим прозрачность для отладки
            .drawRoundedRect(0, 0, this._width, this._height, 5)
            .endFill();

        // Выделение
        this.selection = new Graphics()
            .lineStyle(2, 0xf1c40f, 1)
            .drawRoundedRect(-3, -3, this._width + 6, this._height + 6, 8);
        this.selection.visible = false;

        this.addChild(this.background);
        this.addChild(this.selection);

        // Устанавливаем область взаимодействия
        this.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
    }

    setupDrag() {
        this.dragData = null;
        this.dragOffset = new PIXI.Point();
        this.dragStartPos = new PIXI.Point();

        this.on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));
    }

    onDragStart(event) {
        // Получаем позицию относительно родительского контейнера
        const localPos = event.data.getLocalPosition(this.parent);

        this.dragData = event.data;
        this.dragOffset.set(localPos.x - this.x, localPos.y - this.y);
        this.dragStartPos.set(this.x, this.y);

        this.select();
        this.parent.addChild(this); // Поднимаем на верхний уровень

        console.log('Drag started at:', localPos);
    }

    onDragMove() {
        if (!this.dragData) return;

        // Получаем текущую позицию курсора
        const newPos = this.dragData.getLocalPosition(this.parent);

        // Вычисляем новые координаты с учетом смещения
        let newX = newPos.x - this.dragOffset.x;
        let newY = newPos.y - this.dragOffset.y;

        // Ограничиваем границами
        newX = Math.max(this.bounds.x, Math.min(this.bounds.x + this.bounds.width - this._width, newX));
        newY = Math.max(this.bounds.y, Math.min(this.bounds.y + this.bounds.height - this._height, newY));

        this.position.set(newX, newY);

        console.log('Dragging to:', newX, newY);
    }

    onDragEnd() {
        if (!this.dragData) return;

        console.log('Drag ended at:', this.position);
        this.dragData = null;
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