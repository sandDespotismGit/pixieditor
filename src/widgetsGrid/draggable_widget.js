import { Container, Graphics, Point, Text } from "pixi.js";
import * as PIXI from 'pixi.js';

export default class DraggableWidget extends Container {
    constructor(bounds, content, options = {}) {
        super();

        // Параметры
        this.bounds = bounds;
        this._width = content.width;
        this._height = content.height;
        this.color = options.color || "red";
        this.isSelected = false;
        this.angle = 0; // Текущий угол поворота
        this.rotationStep = options.rotationStep || 5; // Шаг поворота в градусах
        this.isRotating = false;

        // Настройки контейнера
        this.eventMode = 'static';
        this.cursor = 'pointer';
        this.interactive = true;

        // Контент
        this.content = content;
        this.addChild(content);

        // Drag логика
        this.dragData = null;
        this.isDragging = false;
        this.dragStartPos = new Point();

        // Выделение и элементы управления поворотом
        this.createSelectionAndControls();
        this.setupDrag();
        this.setupKeyboardControls();
    }

    createSelectionAndControls() {
        // Выделение
        this.selection = new Graphics()
            .lineStyle(2, 0xf1c40f, 1)
            .drawRoundedRect(-3, -3, this._width + 6, this._height + 6, 8);
        this.selection.visible = false;

        // Маркер поворота (кружок в правом верхнем углу)
        this.rotationHandle = new Graphics()
            .beginFill(0xf1c40f)
            .drawCircle(this._width + 10, -10, 8)
            .endFill();
        this.rotationHandle.visible = false;
        this.rotationHandle.interactive = true;
        this.rotationHandle.cursor = 'grab';
        this.rotationHandle.on('pointerdown', this.onRotateStart.bind(this));

        // Текст с углом поворота (для отладки)
        this.rotationText = new Text('0°', {
            fontSize: 12,
            fill: 0xffffff,
            align: 'center'
        });
        this.rotationText.position.set(this._width + 15, -25);
        this.rotationText.visible = false;

        this.addChild(this.selection);
        this.addChild(this.rotationHandle);
        this.addChild(this.rotationText);

        // Область взаимодействия
        this.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
    }

    setupDrag() {
        this.on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('globalpointermove', this.onDragMove.bind(this));
    }

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (!this.isSelected) return;

            // Поворот по клавише R
            if (e.key.toLowerCase() === 'r') {
                this.rotate(this.rotationStep);
            }
            if (e.key.toLowerCase() === 'q') {
                this.backRotate(this.rotationStep);
            }
        });
    }

    onDragStart(event) {
        // Если кликнули по маркеру поворота - начинаем вращение
        if (event.target === this.rotationHandle) {
            return;
        }

        this.dragData = event.data;
        this.isDragging = true;

        const localPos = event.data.getLocalPosition(this);
        this.dragStartPos.set(localPos.x, localPos.y);

        this.select();
        this.zIndex = 9999;
        if (this.parent) {
            this.parent.sortChildren();
        }
    }

    onRotateStart(event) {
        event.stopPropagation();
        this.isRotating = true;
        this.rotationStartPos = event.data.global.clone();
        this.rotationStartAngle = this.angle;
    }

    onDragMove() {
        if (this.isRotating) {
            this.handleRotation();
            return;
        }

        if (!this.isDragging || !this.dragData) return;

        const globalPos = this.dragData.global;
        const parentPos = this.parent.toLocal(globalPos);

        let newX = parentPos.x - this.dragStartPos.x;
        let newY = parentPos.y - this.dragStartPos.y;

        newX = Math.max(this.bounds.x, Math.min(this.bounds.x + this.bounds.width - this._width, newX));
        newY = Math.max(this.bounds.y, Math.min(this.bounds.y + this.bounds.height - this._height, newY));

        this.position.set(newX, newY);
    }

    handleRotation() {
        if (!this.isRotating || !this.dragData) return;

        const currentPos = this.dragData.global;
        const center = this.getGlobalPosition(new PIXI.Point(this._width / 2, this._height / 2));

        // Вычисляем угол между начальной позицией и текущей относительно центра
        const startAngle = Math.atan2(
            this.rotationStartPos.y - center.y,
            this.rotationStartPos.x - center.x
        );

        const currentAngle = Math.atan2(
            currentPos.y - center.y,
            currentPos.x - center.x
        );

        // Вычисляем разницу углов
        let angleDiff = currentAngle - startAngle;

        // Применяем поворот относительно центра
        this.angle = this.rotationStartAngle + angleDiff * (180 / Math.PI);

        // Устанавливаем точку вращения в центр
        this.pivot.set(this.content.width / 2, this.content.height / 2);
        this.position.x += this.content.width / 2 - this.pivot.x;
        this.position.y += this.content.height / 2 - this.pivot.y;

        // Применяем поворот
        this.rotation = this.angle * (Math.PI / 180);
        this.rotationText.text = `${Math.round(this.angle)}°`;
    }

    onDragEnd() {
        this.isDragging = false;
        this.isRotating = false;
        this.dragData = null;
    }

    backRotate(degrees) {
        this.angle -= degrees;
        this.rotation = this.angle * (Math.PI / 180);
        this.rotationText.text = `${Math.round(this.angle)}°`;
    }
    rotate(degrees) {
        this.angle += degrees;
        this.rotation = this.angle * (Math.PI / 180);
        this.rotationText.text = `${Math.round(this.angle)}°`;
    }

    select() {
        this.isSelected = true;
        this.selection.visible = true;
        this.rotationHandle.visible = true;
        this.rotationText.visible = true;
    }

    deselect() {
        this.isSelected = false;
        this.selection.visible = false;
        this.rotationHandle.visible = false;
        this.rotationText.visible = false;
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