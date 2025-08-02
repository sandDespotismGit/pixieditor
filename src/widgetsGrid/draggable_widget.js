import { Container, Graphics, Point } from "pixi.js";
import * as PIXI from 'pixi.js';

export default class DraggableWidget extends Container {
    constructor(bounds, width, height, color = 0x3498db) {
        super();

        // Параметры виджета
        this.bounds = bounds;
        this._width = width;
        this._height = height;
        this.color = color;
        this.isSelected = false;

        // Настройки контейнера
        this.width = width;
        this.height = height;
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.interactive = true;

        // Для перетаскивания
        this.dragData = null;
        this.isDragging = false;
        this.dragStartPos = new Point();

        this.createWidget();
        this.setupDrag();
    }

    createWidget() {
        this.removeChildren();

        // Основной прямоугольник
        this.background = new Graphics()
            .beginFill(this.color)
            .drawRoundedRect(0, 0, this._width, this._height, 5)
            .endFill();

        // Выделение
        this.selection = new Graphics()
            .lineStyle(2, 0xf1c40f, 1)
            .drawRoundedRect(-3, -3, this._width + 6, this._height + 6, 8);
        this.selection.visible = false;

        this.addChild(this.background);
        this.addChild(this.selection);

        // Область взаимодействия
        this.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
    }

    setupDrag() {
        this.on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('globalpointermove', this.onDragMove.bind(this));
    }

    onDragStart(event) {
        this.dragData = event.data;
        this.isDragging = true;

        // Получаем локальную позицию клика внутри виджета
        const localPos = event.data.getLocalPosition(this);
        this.dragStartPos.set(localPos.x, localPos.y);

        this.select();
        this.zIndex = 9999;
        if (this.parent) {
            this.parent.sortChildren();
        }
    }

    onDragMove() {
        if (!this.isDragging || !this.dragData) return;

        // Получаем глобальные координаты мыши
        const globalPos = this.dragData.global;

        // Конвертируем в локальные координаты родителя
        const parentPos = this.parent.toLocal(globalPos);

        // Вычисляем новую позицию с учетом точки захвата
        let newX = parentPos.x - this.dragStartPos.x;
        let newY = parentPos.y - this.dragStartPos.y;

        // Ограничение границами
        newX = Math.max(this.bounds.x, Math.min(this.bounds.x + this.bounds.width - this._width, newX));
        newY = Math.max(this.bounds.y, Math.min(this.bounds.y + this.bounds.height - this._height, newY));

        // Мгновенное перемещение
        this.position.set(newX, newY);
    }

    onDragEnd() {
        this.isDragging = false;
        this.dragData = null;
    }

    select() {
        this.isSelected = true;
        this.selection.visible = true;
    }

    deselect() {
        this.isSelected = false;
        this.selection.visible = false;
    }

    getPosition() {
        return new Point(this.x, this.y);
    }

    setPosition(x, y) {
        x = Math.max(this.bounds.x, Math.min(this.bounds.x + this.bounds.width - this._width, x));
        y = Math.max(this.bounds.y, Math.min(this.bounds.y + this.bounds.height - this._height, y));
        this.position.set(x, y);
    }

    getSize() {
        return { width: this._width, height: this._height };
    }
}