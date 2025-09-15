import { Color, Container, Graphics, Point, Rectangle } from "pixi.js";

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

        // Линии-привязки
        this.guideLines = new Graphics();
        this.guideLines.visible = false;
        this.showGuides = false;

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

        // Фон (если нужен)
        if (backgroundAlpha > 0) {
            this.selection.beginFill(backgroundColor, backgroundAlpha);
            this.selection.drawRoundedRect(-3, -3, this._width + 6, this._height + 6, cornerRadius);
            this.selection.endFill();
        }

        // Рамка - рисуем только контур, не заливая середину
        if (alpha > 0) {
            this.selection.beginFill(color, alpha);

            // Верхняя часть рамки
            this.selection.drawRect(-3, -3, this._width + 6, 3);

            // Правая часть рамки
            this.selection.drawRect(this._width + 3, -3, 3, this._height + 6);

            // Нижняя часть рамки
            this.selection.drawRect(-3, this._height + 3, this._width + 6, 3);

            // Левая часть рамки
            this.selection.drawRect(-3, -3, 3, this._height + 6);

            // Закругленные углы (если нужны)
            if (cornerRadius > 0) {
                // Верхний левый угол
                this.selection.drawRect(-3, -3, cornerRadius, 3);
                this.selection.drawRect(-3, -3, 3, cornerRadius);

                // Верхний правый угол
                this.selection.drawRect(this._width + 3 - cornerRadius, -3, cornerRadius, 3);
                this.selection.drawRect(this._width + 3, -3, 3, cornerRadius);

                // Нижний правый угол
                this.selection.drawRect(this._width + 3 - cornerRadius, this._height + 3, cornerRadius, 3);
                this.selection.drawRect(this._width + 3, this._height + 3 - cornerRadius, 3, cornerRadius);

                // Нижний левый угол
                this.selection.drawRect(-3, this._height + 3, cornerRadius, 3);
                this.selection.drawRect(-3, this._height + 3 - cornerRadius, 3, cornerRadius);
            }

            this.selection.endFill();
        }
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

        // Показываем линии-привязки
        this.showGuideLines();
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

        // Обновляем линии-привязки
        this.updateGuideLines();
    }

    onDragEnd() {
        this.isDragging = false;
        this.dragData = null;
        this.resizeData = null;

        // Скрываем линии-привязки
        this.hideGuideLines();
    }

    // === Методы для линий-привязок ===
    showGuideLines() {
        // Добавляем линии в родительский контейнер, если еще не добавлены
        if (this.parent && !this.guideLines.parent) {
            this.parent.addChild(this.guideLines);
        }

        this.showGuides = true;
        this.guideLines.visible = true;
        this.updateGuideLines();
    }

    hideGuideLines() {
        this.showGuides = false;
        this.guideLines.visible = false;
    }

    updateGuideLines() {
        if (!this.showGuides) return;

        this.guideLines.clear();

        // Стиль линий - используем заливку вместо lineStyle
        this.guideLines.beginFill(0x00FF00, 0.7);

        // Вертикальные линии (левая и правая границы виджета)
        const leftX = this.x;
        const rightX = this.x + this._width;

        // Левая вертикальная линия - тонкий прямоугольник шириной 1px
        this.guideLines.drawRect(leftX - 0.5, this.bounds.y, 1, this.bounds.height);

        // Правая вертикальная линия - тонкий прямоугольник шириной 1px
        this.guideLines.drawRect(rightX - 0.5, this.bounds.y, 1, this.bounds.height);

        // Горизонтальные линии (верхняя и нижняя границы виджета)
        const topY = this.y;
        const bottomY = this.y + this._height;

        // Верхняя горизонтальная линия - тонкий прямоугольник высотой 1px
        this.guideLines.drawRect(this.bounds.x, topY - 0.5, this.bounds.width, 1);

        // Нижняя горизонтальная линия - тонкий прямоугольник высотой 1px
        this.guideLines.drawRect(this.bounds.x, bottomY - 0.5, this.bounds.width, 1);

        this.guideLines.endFill();
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

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }
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

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }
    }

    getSize() {
        return { width: this._width, height: this._height };
    }
    // === API для программного ресайза ===
    resize(width, height) {
        // Устанавливаем новые размеры
        this._width = Math.max(20, width);
        this._height = Math.max(20, height);

        // Обновляем размер контента
        this.content.width = this._width;
        this.content.height = this._height;

        // Обновляем выделение и ручки ресайза
        this.updateSelection();

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }

        // Проверяем, чтобы виджет не выходил за границы после ресайза
        const position = this.getPosition();
        const newX = Math.max(this.bounds.x, Math.min(this.bounds.x + this.bounds.width - this._width, position.x));
        const newY = Math.max(this.bounds.y, Math.min(this.bounds.y + this.bounds.height - this._height, position.y));

        this.position.set(newX, newY);
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

    // При удалении виджета нужно удалить и линии
    destroy(options) {
        if (this.guideLines.parent) {
            this.guideLines.parent.removeChild(this.guideLines);
        }
        this.guideLines.destroy();
        super.destroy(options);
    }
}