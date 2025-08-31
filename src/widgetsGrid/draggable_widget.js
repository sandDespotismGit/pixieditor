import { Container, Graphics, Point, Rectangle } from "pixi.js";

export default class DraggableWidget extends Container {
    constructor(bounds, content, options = {}) {
        super();

        // Параметры
        this.bounds = bounds;
        this._width = content.width;
        this._height = content.height;

        this.options = {
            color: options.color || 0xf1c40f,        // цвет рамки
            alpha: options.alpha ?? 1.0,             // прозрачность рамки
            cornerRadius: options.cornerRadius ?? 8, // закругление углов
            backgroundColor: options.backgroundColor || 0x000000, // цвет фона
            backgroundAlpha: options.backgroundAlpha ?? 0.0       // прозрачность фона
        };

        this.isSelected = false;

        // Настройки контейнера
        this.eventMode = "static";
        this.cursor = "pointer";
        this.interactive = true;

        // Контент
        this.content = content;
        this.addChild(content);

        // Drag/Resize логика
        this.dragData = null;
        this.isDragging = false;
        this.dragStartPos = new Point();
        this.resizeData = null;
        this.resizeHandleSize = 10;

        // Выделение
        this.createSelection();
        this.setupDrag();
        this.createResizeHandles();
    }

    createSelection() {
        this.selection = new Graphics();
        this.addChild(this.selection);
        this.selection.visible = false;
        this.redrawSelection();

        // Область взаимодействия
        this.hitArea = new Rectangle(0, 0, this._width, this._height);
    }

    redrawSelection() {
        const { color, alpha, cornerRadius, backgroundColor, backgroundAlpha } = this.options;

        this.selection.clear();

        // Фон
        if (backgroundAlpha > 0) {
            this.selection.beginFill(backgroundColor, backgroundAlpha);
            this.selection.drawRoundedRect(-3, -3, this._width + 6, this._height + 6, cornerRadius);
            this.selection.endFill();
        }

        // Рамка
        this.selection.lineStyle(2, color, alpha)
            .drawRoundedRect(-3, -3, this._width + 6, this._height + 6, cornerRadius);
    }

    updateSelection() {
        this.redrawSelection();
        this.hitArea = new Rectangle(0, 0, this._width, this._height);
        this.updateResizeHandles();
    }

    setupDrag() {
        this.on("pointerdown", this.onDragStart.bind(this))
            .on("pointerup", this.onDragEnd.bind(this))
            .on("pointerupoutside", this.onDragEnd.bind(this))
            .on("globalpointermove", this.onDragMove.bind(this));
    }

    onDragStart(event) {
        if (event.target.isResizeHandle) return;

        this.dragData = event.data;
        this.isDragging = true;

        const localPos = event.data.getLocalPosition(this);
        this.dragStartPos.set(localPos.x, localPos.y);

        this.select();
        this.zIndex = 9999;
        if (this.parent) this.parent.sortChildren();
    }

    onDragMove(event) {
        if (this.resizeData) {
            this.onResizeMove(event);
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

    onDragEnd() {
        this.isDragging = false;
        this.dragData = null;
        this.resizeData = null;
    }

    // === Resize ===
    createResizeHandles() {
        this.resizeHandles = [];
        const positions = ["br"]; // пока только bottom-right

        positions.forEach(pos => {
            const handle = new Graphics()
                .beginFill(0xffffff)
                .lineStyle(1, 0x000000)
                .drawRect(0, 0, this.resizeHandleSize, this.resizeHandleSize)
                .endFill();

            handle.isResizeHandle = true;
            handle.cursor = "nwse-resize";
            handle.eventMode = "static";
            this.addChild(handle);

            handle.on("pointerdown", (e) => this.onResizeStart(e, pos))
                .on("pointerup", () => this.onDragEnd())
                .on("pointerupoutside", () => this.onDragEnd());

            this.resizeHandles.push({ pos, handle });
        });

        this.updateResizeHandles();
    }

    updateResizeHandles() {
        this.resizeHandles.forEach(({ pos, handle }) => {
            if (pos === "br") {
                handle.x = this._width - this.resizeHandleSize / 2;
                handle.y = this._height - this.resizeHandleSize / 2;
            }
        });
    }

    onResizeStart(event, pos) {
        this.resizeData = { pos, start: event.data.global.clone(), startWidth: this._width, startHeight: this._height };
    }

    onResizeMove(event) {
        if (!this.resizeData) return;

        const globalPos = event.data.global;
        const dx = globalPos.x - this.resizeData.start.x;
        const dy = globalPos.y - this.resizeData.start.y;

        if (this.resizeData.pos === "br") {
            this._width = Math.max(20, this.resizeData.startWidth + dx);
            this._height = Math.max(20, this.resizeData.startHeight + dy);
        }

        this.content.width = this._width;
        this.content.height = this._height;

        this.updateSelection();
    }

    // === API ===
    select() {
        this.isSelected = true;
        this.selection.visible = true;
        this.resizeHandles.forEach(h => h.handle.visible = true);
    }

    deselect() {
        this.isSelected = false;
        this.selection.visible = false;
        this.resizeHandles.forEach(h => h.handle.visible = false);
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

    // === API для управления стилем ===
    setColor(color) {
        this.options.color = color;
        this.updateSelection();
    }

    setAlpha(alpha) {
        this.options.alpha = alpha;
        this.updateSelection();
    }

    setCornerRadius(radius) {
        this.options.cornerRadius = radius;
        this.updateSelection();
    }

    setBackgroundColor(color) {
        this.options.backgroundColor = color;
        this.updateSelection();
    }

    setBackgroundAlpha(alpha) {
        this.options.backgroundAlpha = alpha;
        this.updateSelection();
    }
}
