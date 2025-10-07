import { Color, Container, Graphics, Point, Rectangle } from "pixi.js";

export default class DraggableWidget extends Container {
    constructor(bounds, content, options = {}) {
        super();

        // Параметры
        this.bounds = bounds;
        this._width = content.width;
        this._height = content.height;

        this.options = {
            color: options.color || "red",
            alpha: options.alpha ?? 1.0,
            cornerRadius: options.cornerRadius ?? 8,
            backgroundColor: options.backgroundColor || 0x000000,
            backgroundAlpha: options.backgroundAlpha ?? 0.0,
            proportionedScaling: options.proportionedScaling ?? false,
            autoCenter: options.autoCenter ?? false, // По умолчанию выключено
            snapToGrid: options.snapToGrid ?? false, // Привязка к сетке
            gridSize: options.gridSize ?? 20, // Размер сетки по умолчанию
        };

        // Сохраняем исходное соотношение сторон
        this._originalAspectRatio = this._width / this._height;
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

        // Автоцентрирование при создании если включено
        if (this.options.autoCenter) {
            this.autoCenter();
        }
    }

    createSelection() {
        this.selection = new Graphics();
        this.addChild(this.selection);
        this.selection.visible = false;
        this.redrawSelection();

        // Область взаимодействия
        this.hitArea = new Rectangle(0, 0, this._width, this._height);
    }
    // Add this method to your DraggableWidget class
    setBounds(newBounds) {
        // Update the widget's boundaries
        this.bounds = newBounds;

        // Optional: Immediately correct the widget's position if it's outside the new bounds
        this.setPosition(this.x, this.y);
    }

    redrawSelection() {
        const { color, alpha, cornerRadius, backgroundColor, backgroundAlpha } =
            this.options;

        this.selection.clear();

        // Фон (если нужен)
        if (backgroundAlpha > 0) {
            this.selection.beginFill(backgroundColor, backgroundAlpha);
            this.selection.drawRoundedRect(
                -3,
                -3,
                this._width + 6,
                this._height + 6,
                cornerRadius,
            );
            this.selection.endFill();
        }

        // Рамка - рисуем только контур, не заливая середину
        if (alpha > 0) {
            this.selection.beginFill(color, alpha);

            // Верхняя часть рамки
            this.selection.drawRect(-3, -3, this._width + 2, 1);

            // Правая часть рамки
            this.selection.drawRect(this._width + 3, -3, 1, this._height + 2);

            // Нижняя часть рамки
            this.selection.drawRect(-3, this._height + 3, this._width + 2, 1);

            // Левая часть рамки
            this.selection.drawRect(-3, -3, 1, this._height + 2);

            // Закругленные углы (если нужны)
            if (cornerRadius > 0) {
                // Верхний левый угол
                this.selection.drawRect(-3, -3, cornerRadius, 3);
                this.selection.drawRect(-3, -3, 3, cornerRadius);

                // Верхний правый угол
                this.selection.drawRect(
                    this._width + 3 - cornerRadius,
                    -3,
                    cornerRadius,
                    3,
                );
                this.selection.drawRect(this._width + 3, -3, 3, cornerRadius);

                // Нижний правый угол
                this.selection.drawRect(
                    this._width + 3 - cornerRadius,
                    this._height + 3,
                    cornerRadius,
                    3,
                );
                this.selection.drawRect(
                    this._width + 3,
                    this._height + 3 - cornerRadius,
                    3,
                    cornerRadius,
                );

                // Нижний левый угол
                this.selection.drawRect(-3, this._height + 3, cornerRadius, 3);
                this.selection.drawRect(
                    -3,
                    this._height + 3 - cornerRadius,
                    3,
                    cornerRadius,
                );
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

        // Применяем границы
        newX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, newX),
        );
        newY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, newY),
        );

        // Устанавливаем позицию без привязки к сетке во время перемещения
        this.position.set(newX, newY);

        // Обновляем линии-привязки
        this.updateGuideLines();
    }

    onDragEnd() {
        if (this.isDragging) {
            // Применяем привязку к сетке только при окончании перемещения
            if (this.options.snapToGrid) {
                const snappedX =
                    Math.round(this.x / this.options.gridSize) * this.options.gridSize;
                const snappedY =
                    Math.round(this.y / this.options.gridSize) * this.options.gridSize;

                // Проверяем границы после привязки
                const finalX = Math.max(
                    this.bounds.x,
                    Math.min(this.bounds.x + this.bounds.width - this._width, snappedX),
                );
                const finalY = Math.max(
                    this.bounds.y,
                    Math.min(this.bounds.y + this.bounds.height - this._height, snappedY),
                );

                this.position.set(finalX, finalY);
            }

            // Автоцентрирование при отпускании если включено
            if (this.options.autoCenter) {
                this.autoCenter();
            }
        }

        this.isDragging = false;
        this.dragData = null;
        this.resizeData = null;

        // Скрываем линии-привязки
        this.hideGuideLines();
    }

    // === Методы для автоцентра и привязки к сетке ===
    autoCenter() {
        const centerX =
            Math.round(
                (this.bounds.width - this._width) / 2 / this.options.gridSize,
            ) * this.options.gridSize;
        const centerY =
            Math.round(
                (this.bounds.height - this._height) / 2 / this.options.gridSize,
            ) * this.options.gridSize;

        // Проверяем границы
        const finalX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, centerX),
        );
        const finalY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, centerY),
        );

        this.position.set(finalX, finalY);
        return this.getPosition();
    }

    snapToGrid() {
        if (!this.options.snapToGrid) return this.getPosition();

        const snappedX =
            Math.round(this.x / this.options.gridSize) * this.options.gridSize;
        const snappedY =
            Math.round(this.y / this.options.gridSize) * this.options.gridSize;

        // Проверяем границы
        const finalX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, snappedX),
        );
        const finalY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, snappedY),
        );

        this.position.set(finalX, finalY);
        return this.getPosition();
    }

    snapToPosition(x, y) {
        let targetX = x;
        let targetY = y;

        if (this.options.snapToGrid) {
            targetX = Math.round(x / this.options.gridSize) * this.options.gridSize;
            targetY = Math.round(y / this.options.gridSize) * this.options.gridSize;
        }

        // Проверяем границы
        targetX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, targetX),
        );
        targetY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, targetY),
        );

        this.position.set(targetX, targetY);
        return this.getPosition();
    }

    centerHorizontally() {
        const centerX =
            Math.round(
                (this.bounds.width - this._width) / 2 / this.options.gridSize,
            ) * this.options.gridSize;
        const finalX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, centerX),
        );
        this.position.set(finalX, this.y);
    }

    centerVertically() {
        const centerY =
            Math.round(
                (this.bounds.height - this._height) / 2 / this.options.gridSize,
            ) * this.options.gridSize;
        const finalY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, centerY),
        );
        this.position.set(this.x, finalY);
    }

    // === API для управления автоцентром и привязкой ===
    enableAutoCenter() {
        this.options.autoCenter = true;
    }

    disableAutoCenter() {
        this.options.autoCenter = false;
    }

    setAutoCenter(enabled) {
        this.options.autoCenter = enabled;
        if (enabled) {
            this.autoCenter();
        }
    }

    enableSnapToGrid() {
        this.options.snapToGrid = true;
    }

    disableSnapToGrid() {
        this.options.snapToGrid = false;
    }

    setSnapToGrid(enabled) {
        this.options.snapToGrid = enabled;
        if (enabled) {
            this.snapToGrid();
        }
    }

    setGridSize(size) {
        this.options.gridSize = Math.max(1, size);
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
        this.guideLines.beginFill("red", 0.7);

        // Вертикальные линии (левая и правая границы виджета)
        const leftX = this.x;
        const rightX = this.x + this._width;

        // Левая вертикальная линия - тонкий прямоугольник шириной 1px
        this.guideLines.drawRect(leftX - 0.5, this.bounds.y, 1, this.bounds.height);

        // Правая вертикальная линия - тонкий прямоугольник шириной 1px
        this.guideLines.drawRect(
            rightX - 0.5,
            this.bounds.y,
            1,
            this.bounds.height,
        );

        // Горизонтальные линии (верхняя и нижняя границы виджета)
        const topY = this.y;
        const bottomY = this.y + this._height;

        // Верхняя горизонтальная линия - тонкий прямоугольник высотой 1px
        this.guideLines.drawRect(this.bounds.x, topY - 0.5, this.bounds.width, 1);

        // Нижняя горизонтальная линия - тонкий прямоугольник высотой 1px
        this.guideLines.drawRect(
            this.bounds.x,
            bottomY - 0.5,
            this.bounds.width,
            1,
        );

        this.guideLines.endFill();
    }

    // === Resize ===
    createResizeHandles() {
        this.resizeHandles = [];
        const positions = ["br"]; // пока только bottom-right

        positions.forEach((pos) => {
            const handle = new Graphics()
                .beginFill(0xffffff)
                .lineStyle(1, 0x000000)
                .drawRect(0, 0, this.resizeHandleSize, this.resizeHandleSize)
                .endFill();

            handle.isResizeHandle = true;
            handle.cursor = "nwse-resize";
            handle.eventMode = "static";
            this.addChild(handle);

            handle
                .on("pointerdown", (e) => this.onResizeStart(e, pos))
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
        this.resizeData = {
            pos,
            start: event.data.global.clone(),
            startWidth: this._width,
            startHeight: this._height,
            startX: this.x,
            startY: this.y,
        };
    }

    onResizeMove(event) {
        if (!this.resizeData) return;

        const globalPos = event.data.global;
        const dx = globalPos.x - this.resizeData.start.x;
        const dy = globalPos.y - this.resizeData.start.y;

        let newWidth = this.resizeData.startWidth;
        let newHeight = this.resizeData.startHeight;

        if (this.resizeData.pos === "br") {
            if (this.options.proportionedScaling) {
                // Пропорциональное масштабирование
                const delta = Math.max(dx, dy);
                newWidth = Math.max(20, this.resizeData.startWidth + delta);
                newHeight = Math.max(20, newWidth / this._originalAspectRatio);
            } else {
                // Обычное масштабирование
                newWidth = Math.max(20, this.resizeData.startWidth + dx);
                newHeight = Math.max(20, this.resizeData.startHeight + dy);
            }
        }

        // Применяем привязку размеров к сетке только при окончании ресайза
        // Во время ресайза не применяем привязку для плавности
        this._width = Math.max(20, newWidth);
        this._height = Math.max(20, newHeight);

        this.updateSelection();

        // Вызываем onResize для перерисовки контента
        if (this.onResize) {
            this.onResize(this._width, this._height);
        }

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }
    }

    resize(width, height) {
        if (this.options.proportionedScaling) {
            // Пропорциональное масштабирование при программном вызове
            const newAspectRatio = width / height;

            if (newAspectRatio > this._originalAspectRatio) {
                // Ширина ограничивающая
                height = width / this._originalAspectRatio;
            } else {
                // Высота ограничивающая
                width = height * this._originalAspectRatio;
            }
        }

        // Применяем привязку к сетке если включено
        if (this.options.snapToGrid) {
            width = Math.round(width / this.options.gridSize) * this.options.gridSize;
            height =
                Math.round(height / this.options.gridSize) * this.options.gridSize;
        }

        // Устанавливаем новые размеры
        this._width = Math.max(20, width);
        this._height = Math.max(20, height);

        // Обновляем выделение и ручки ресайза
        this.updateSelection();

        // Вызываем onResize для перерисовки контента
        if (this.onResize) {
            this.onResize(this._width, this._height);
        }

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }

        // Проверяем, чтобы виджет не выходил за границы после ресайза
        const newX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, this.x),
        );
        const newY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, this.y),
        );

        this.position.set(newX, newY);

        // Автоцентрирование после ресайза если включено
        if (this.options.autoCenter) {
            this.autoCenter();
        }
    }

    // === API для управления пропорциональным масштабированием ===
    enableProportionedScaling() {
        this.options.proportionedScaling = true;
        this._originalAspectRatio = this._width / this._height;
    }

    disableProportionedScaling() {
        this.options.proportionedScaling = false;
    }

    setProportionedScaling(enabled) {
        this.options.proportionedScaling = enabled;
        if (enabled) {
            this._originalAspectRatio = this._width / this._height;
        }
    }

    // === API ===
    select() {
        this.isSelected = true;
        this.selection.visible = true;
        this.resizeHandles.forEach((h) => (h.handle.visible = true));
    }

    deselect() {
        this.isSelected = false;
        this.selection.visible = false;
        this.resizeHandles.forEach((h) => (h.handle.visible = false));
    }

    getPosition() {
        return new Point(this.x, this.y);
    }

    setPosition(x, y) {
        // Применяем привязку к сетке если включено
        if (this.options.snapToGrid) {
            x = Math.round(x / this.options.gridSize) * this.options.gridSize;
            y = Math.round(y / this.options.gridSize) * this.options.gridSize;
        }

        // Проверяем границы
        x = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, x),
        );
        y = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, y),
        );

        this.position.set(x, y);

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }
    }

    getSize() {
        return { width: this._width, height: this._height };
    }
    // === Scale метод для пропорционального масштабирования ===
    scale(scaleFactor, options = {}) {
        // Ограничиваем коэффициент масштабирования
        const minScale = options.minScale || 0.1;
        const maxScale = options.maxScale || 3.0;
        let clampedScale = Math.max(minScale, Math.min(maxScale, scaleFactor));

        // Вычисляем новые размеры на основе исходных
        const originalWidth = this.content.width;
        const originalHeight = this.content.height;

        let newWidth = originalWidth * clampedScale;
        let newHeight = originalHeight * clampedScale;

        // При пропорциональном масштабировании сохраняем aspect ratio
        if (this.options.proportionedScaling) {
            const newAspectRatio = newWidth / newHeight;

            if (newAspectRatio > this._originalAspectRatio) {
                // Ширина ограничивающая
                newHeight = newWidth / this._originalAspectRatio;
            } else {
                // Высота ограничивающая
                newWidth = newHeight * this._originalAspectRatio;
            }
        }

        // Ограничиваем максимальные размеры доступным пространством
        if (options.screenWidth && options.screenHeight) {
            const maxAvailableWidth = options.screenWidth - this.x;
            const maxAvailableHeight = options.screenHeight - this.y;

            // Вычисляем максимально возможный масштаб для ширины и высоты
            const maxScaleByWidth = maxAvailableWidth / (this.options.proportionedScaling ?
                originalWidth : newWidth / clampedScale);
            const maxScaleByHeight = maxAvailableHeight / (this.options.proportionedScaling ?
                originalHeight : newHeight / clampedScale);

            // Берем минимальный масштаб из всех ограничений
            const maxAllowedScale = Math.min(maxScaleByWidth, maxScaleByHeight, maxScale);

            // Пересчитываем clampedScale с учетом ограничений экрана
            clampedScale = Math.max(minScale, Math.min(maxAllowedScale, scaleFactor));

            // Пересчитываем размеры с учетом нового масштаба
            newWidth = originalWidth * clampedScale;
            newHeight = originalHeight * clampedScale;

            // Снова применяем пропорциональное масштабирование если нужно
            if (this.options.proportionedScaling) {
                const newAspectRatio = newWidth / newHeight;

                if (newAspectRatio > this._originalAspectRatio) {
                    newHeight = newWidth / this._originalAspectRatio;
                } else {
                    newWidth = newHeight * this._originalAspectRatio;
                }
            }
        }

        // Применяем привязку к сетке если включено
        if (this.options.snapToGrid) {
            newWidth = Math.round(newWidth / this.options.gridSize) * this.options.gridSize;
            newHeight = Math.round(newHeight / this.options.gridSize) * this.options.gridSize;
        }

        // Устанавливаем новые размеры
        this._width = Math.max(20, newWidth);
        this._height = Math.max(20, newHeight);

        // Обновляем выделение и ручки ресайза
        this.updateSelection();

        // Вызываем onResize для перерисовки контента
        if (this.onResize) {
            this.onResize(this._width, this._height);
        }

        // Обновляем линии если они видны
        if (this.showGuides) {
            this.updateGuideLines();
        }

        // Проверяем, чтобы виджет не выходил за границы после скейла
        const newX = Math.max(
            this.bounds.x,
            Math.min(this.bounds.x + this.bounds.width - this._width, this.x),
        );
        const newY = Math.max(
            this.bounds.y,
            Math.min(this.bounds.y + this.bounds.height - this._height, this.y),
        );

        this.position.set(newX, newY);

        // Автоцентрирование после скейла если включено
        if (this.options.autoCenter) {
            this.autoCenter();
        }

        // Возвращаем фактический примененный коэффициент масштабирования
        return {
            scaleFactor: clampedScale,
            width: this._width,
            height: this._height
        };
    }

    // === Дополнительные методы для работы со скейлом ===

    // Получить текущий коэффициент масштабирования относительно исходного размера
    getCurrentScale() {
        const originalWidth = this.content.width;
        return this._width / originalWidth;
    }

    // Сбросить масштаб к исходному размеру
    resetScale() {
        return this.scale(1.0);
    }

    // Увеличить масштаб на определенный множитель
    scaleBy(multiplier, options = {}) {
        const currentScale = this.getCurrentScale();
        return this.scale(currentScale * multiplier, options);
    }

    // Установить минимальный и максимальный масштаб
    setScaleLimits(minScale = 0.1, maxScale = 3.0) {
        this.minScale = minScale;
        this.maxScale = maxScale;
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
