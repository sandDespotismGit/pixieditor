import { Color, Container, Graphics, Point, Rectangle } from "pixi.js";

export default class DraggableWidget extends Container {
  constructor(bounds, content, options = {}) {
    super();

    // Параметры
    this.bounds = bounds;
    this._width = content.width;
    this._height = content.height;

    this.options = {
      color: options.color || "#00d4ff",
      alpha: options.alpha ?? 1.0,
      cornerRadius: options.cornerRadius ?? 8,
      backgroundColor: options.backgroundColor || 0x000000,
      backgroundAlpha: options.backgroundAlpha ?? 0.0,
      borderColor: options.borderColor ?? 0xffffff,
      borderAlpha: options.borderAlpha ?? 0,
      borderWidth: options.borderWidth ?? 0,
      proportionedScaling: options.proportionedScaling ?? false,
      autoCenter: options.autoCenter ?? false,
      snapToGrid: options.snapToGrid ?? false,
      gridSize: options.gridSize ?? 10,
      zIndex: options.zIndex ?? 0,
      autoZIndex: options.autoZIndex ?? true,
      effectPreset: options.effectPreset || "none",
    };
    this._fontFamily = options.fontFamily || null;
    this._textColor = options.textColor ?? null;
    this._effectPreset = this.options.effectPreset || "none";

    // Сохраняем исходное соотношение сторон
    this._originalAspectRatio = this._width / this._height;
    this.isSelected = false;

    // Z-index состояние - ИСПРАВЛЕНО: правильная инициализация
    this._zIndex = this.options.zIndex;
    this._baseZIndex = this.options.zIndex;
    this._zIndexChanged = false;
    this._tempZIndex = null; // Временный z-index для перетаскивания

    // Настройки контейнера
    this.eventMode = "static";
    this.cursor = "pointer";
    this.interactive = true;

    // Устанавливаем начальный z-index
    this.zIndex = this._zIndex;

    // Контент
    this.content = content;
    this.addChild(content);

    this.effectShadow = new Graphics();
    this.effectFrame = new Graphics();
    this.addChildAt(this.effectShadow, 0);
    this.addChild(this.effectFrame);

    // Drag/Resize логика
    this.dragData = null;
    this.isDragging = false;
    this.dragStartPos = new Point();
    this.resizeData = null;
    this.resizeHandleSize = 8;

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
    this.applyEffectPreset(this._effectPreset, { silent: true });
  }

  createSelection() {
    this.selection = new Graphics();
    this.addChild(this.selection);
    this.selection.visible = false;
    this.redrawSelection();

    // Область взаимодействия
    this.hitArea = new Rectangle(0, 0, this._width, this._height);
  }

  setBounds(newBounds) {
    this.bounds = newBounds;
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

    // Рамка - рисуем только контур
    if (alpha > 0) {
      this.selection.beginFill(color, alpha);

      // Верхняя часть рамки
      this.selection.drawRect(0, 0, this._width, 1);

      // Правая часть рамки
      this.selection.drawRect(this._width, 0, 1, this._height);

      // Нижняя часть рамки
      this.selection.drawRect(0, this._height, this._width, 1);

      // Левая часть рамки
      this.selection.drawRect(0, 0, 1, this._height);

      this.selection.endFill();
    }
  }

  updateSelection() {
    this.redrawEffectFrame();
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

    // Управление z-index при начале перетаскивания - ИСПРАВЛЕНО
    if (this.options.autoZIndex) {
      // Сохраняем текущий z-index как временный
      this._tempZIndex = this._zIndex;
      // Поднимаем на передний план только на время перетаскивания
      this._bringToFrontForDrag();
    }

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

    this.position.set(newX, newY);
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

      // ВОТ ГЛАВНОЕ ИСПРАВЛЕНИЕ: правильно сбрасываем z-index
      if (this.options.autoZIndex && this._tempZIndex !== null) {
        // Восстанавливаем сохраненный z-index
        this._restoreZIndexFromDrag();
      }
    }

    this.isDragging = false;
    this.dragData = null;
    this.resizeData = null;
    this.resetCursor();
    this.hideGuideLines();
  }

  // === ПРАВИЛЬНЫЕ МЕТОДЫ ДЛЯ РАБОТЫ С Z-INDEX ПРИ ПЕРЕТАСКИВАНИИ ===

  // Внутренний метод для поднятия на время перетаскивания
  _bringToFrontForDrag() {
    if (!this.parent) return;

    // Находим максимальный z-index среди всех виджетов
    let maxZIndex = this._baseZIndex;
    this.parent.children.forEach((child) => {
      if (child !== this && child.zIndex > maxZIndex) {
        maxZIndex = child.zIndex;
      }
    });

    // Устанавливаем временный z-index (на 1000 больше максимального, чтобы быть точно сверху)
    this._tempZIndex = this._zIndex; // Сохраняем текущий
    this._zIndex = maxZIndex + 1000; // Временное значение
    this.zIndex = this._zIndex;

    if (this.parent) {
      this.parent.sortChildren();
    }
  }

  // Внутренний метод для восстановления z-index после перетаскивания
  _restoreZIndexFromDrag() {
    // Восстанавливаем сохраненный z-index
    this._zIndex = this._tempZIndex;
    this.zIndex = this._zIndex;
    this._tempZIndex = null;

    // Сбрасываем флаг ручного изменения, если z-index вернулся к базовому
    if (this._zIndex === this._baseZIndex) {
      this._zIndexChanged = false;
    }

    if (this.parent) {
      this.parent.sortChildren();
    }
  }

  // === ПУБЛИЧНЫЕ МЕТОДЫ ДЛЯ УПРАВЛЕНИЯ Z-INDEX ===

  getZIndex() {
    return this._zIndex;
  }

  setZIndex(zIndex) {
    const newZIndex = parseInt(zIndex);
    if (isNaN(newZIndex)) return this._zIndex;

    this._zIndex = newZIndex;
    this.zIndex = newZIndex;
    this._zIndexChanged = true; // Помечаем как измененный вручную
    this._tempZIndex = null; // Сбрасываем временный

    if (this.parent) {
      this.parent.sortChildren();
    }

    return this._zIndex;
  }

  resetZIndex() {
    this._zIndex = this._baseZIndex;
    this.zIndex = this._baseZIndex;
    this._zIndexChanged = false;
    this._tempZIndex = null;

    if (this.parent) {
      this.parent.sortChildren();
    }

    return this._zIndex;
  }

  bringToFront() {
    if (!this.parent) return this._zIndex;

    let maxZIndex = 0;
    this.parent.children.forEach((child) => {
      if (child !== this && child.zIndex > maxZIndex) {
        maxZIndex = child.zIndex;
      }
    });

    const newZIndex = maxZIndex + 1;
    return this.setZIndex(newZIndex);
  }

  sendToBack() {
    if (!this.parent) return this._zIndex;

    let minZIndex = Infinity;
    this.parent.children.forEach((child) => {
      if (child !== this && child.zIndex < minZIndex) {
        minZIndex = child.zIndex;
      }
    });

    const newZIndex = minZIndex === Infinity ? 0 : Math.max(0, minZIndex - 1);
    return this.setZIndex(newZIndex);
  }

  bringForward() {
    return this.setZIndex(this._zIndex + 1);
  }

  sendBackward() {
    return this.setZIndex(Math.max(0, this._zIndex - 1));
  }

  setAutoZIndex(enabled) {
    this.options.autoZIndex = enabled;
    // Если выключаем авто-zindex, сбрасываем к базовому
    if (!enabled && this._tempZIndex !== null) {
      this._restoreZIndexFromDrag();
    }
  }

  enableAutoZIndex() {
    this.options.autoZIndex = true;
  }

  disableAutoZIndex() {
    this.options.autoZIndex = false;
    if (this._tempZIndex !== null) {
      this._restoreZIndexFromDrag();
    }
  }

  isAbove(otherWidget) {
    return this._zIndex > otherWidget.getZIndex();
  }

  isBelow(otherWidget) {
    return this._zIndex < otherWidget.getZIndex();
  }

  compareZIndex(otherWidget) {
    if (this._zIndex > otherWidget.getZIndex()) return 1;
    if (this._zIndex < otherWidget.getZIndex()) return -1;
    return 0;
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
    if (this.parent && !this.guideLines.parent) {
      this.parent.addChild(this.guideLines);
      this.guideLines.zIndex = 99999;
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
    this.guideLines.beginFill("#00d4ff", 1);

    const leftX = this.x;
    const rightX = this.x + this._width;
    const topY = this.y;
    const bottomY = this.y + this._height;

    // Вертикальные линии
    this.guideLines.drawRect(leftX - 0.5, this.bounds.y, 1, this.bounds.height);
    this.guideLines.drawRect(
      rightX - 0.5,
      this.bounds.y,
      1,
      this.bounds.height,
    );

    // Горизонтальные линии
    this.guideLines.drawRect(this.bounds.x, topY, this.bounds.width, 1);
    this.guideLines.drawRect(
      this.bounds.x,
      bottomY,
      this.bounds.width,
      1,
    );

    this.guideLines.endFill();
  }

  // === Методы для управления курсором ===
  setCursor(cursorType) {
    if (!this.originalCursor) {
      this.originalCursor = this.cursor;
    }

    this.cursor = cursorType;
    document.body.style.cursor = cursorType;
  }

  resetCursor() {
    if (this.originalCursor) {
      this.cursor = this.originalCursor;
      document.body.style.cursor = this.originalCursor;
      this.originalCursor = null;
    } else {
      document.body.style.cursor = "default";
    }
  }

createResizeHandles() {
  this.resizeHandles = [];

  const handleConfigs = [
    { pos: "n", cursor: "n-resize" },
    { pos: "s", cursor: "s-resize" },
    { pos: "e", cursor: "e-resize" },
    { pos: "w", cursor: "w-resize" },
    { pos: "ne", cursor: "ne-resize" },
    { pos: "nw", cursor: "nw-resize" },
    { pos: "se", cursor: "se-resize" },
    { pos: "sw", cursor: "sw-resize" },
  ];

  const handleRadius = 2; // Радиус скругления
  const outlineColor = "#f3f3f3"; // Цвет контура
  const outlineWidth = 1; // Толщина контура
  const fillColor = "#00d4ff"; // Цвет заливки (прозрачный или белый)
  const fillAlpha = 1; // Прозрачность заливки (0 - полностью прозрачный)

  handleConfigs.forEach(({ pos, cursor }) => {
    const handle = new Graphics();
    
    // Рисуем пустотелый квадрат с радиусом
    // 1. Сначала рисуем контур
    handle.lineStyle(outlineWidth, outlineColor, 1.0);
    // 2. Рисуем скругленный прямоугольник
    handle.drawRoundedRect(0, 0, this.resizeHandleSize, this.resizeHandleSize, handleRadius);
    
    // Опционально: можно добавить прозрачную заливку для лучшей интерактивности
    // (без заливки может быть сложнее попасть мышкой)
    if (fillAlpha > 0) {
      handle.beginFill(fillColor, fillAlpha);
      handle.drawRoundedRect(0, 0, this.resizeHandleSize, this.resizeHandleSize, handleRadius);
      handle.endFill();
    }

    handle.isResizeHandle = true;
    handle.cursor = cursor;
    handle.eventMode = "static";
    handle.cursorType = cursor;

    this.addChild(handle);

    handle
      .on("pointerenter", () => {
        this.setCursor(handle.cursorType);
        handle.alpha = 1.0;
      })
      .on("pointerleave", () => {
        this.resetCursor();
        handle.alpha = 0.8;
      })
      .on("pointerdown", (e) => {
        this.onResizeStart(e, pos);
        this.setCursor(handle.cursorType);

        if (this.options.autoZIndex) {
          this._bringToFrontForDrag();
        }
      })
      .on("pointerup", () => {
        this.onDragEnd();
        this.resetCursor();
      })
      .on("pointerupoutside", () => {
        this.onDragEnd();
        this.resetCursor();
      });

    this.resizeHandles.push({ pos, handle });
  });

  this.updateResizeHandles();
}
  updateResizeHandles() {
    this.resizeHandles.forEach(({ pos, handle }) => {
      const size = this.resizeHandleSize;
      const half = size / 2;

      switch (pos) {
        case "n": // top
          handle.x = this._width / 2 - half;
          handle.y = -half;
          break;
        case "s": // bottom
          handle.x = this._width / 2 - half;
          handle.y = this._height - half;
          break;
        case "e": // right
          handle.x = this._width - half;
          handle.y = this._height / 2 - half;
          break;
        case "w": // left
          handle.x = -half;
          handle.y = this._height / 2 - half;
          break;
        case "ne": // top-right
          handle.x = this._width - half;
          handle.y = -half;
          break;
        case "nw": // top-left
          handle.x = -half;
          handle.y = -half;
          break;
        case "se": // bottom-right
          handle.x = this._width - half;
          handle.y = this._height - half;
          break;
        case "sw": // bottom-left
          handle.x = -half;
          handle.y = this._height - half;
          break;
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
    let newX = this.resizeData.startX;
    let newY = this.resizeData.startY;

    switch (this.resizeData.pos) {
      case "e": // right
        newWidth = Math.max(20, this.resizeData.startWidth + dx);
        break;
      case "w": // left
        newWidth = Math.max(20, this.resizeData.startWidth - dx);
        newX = this.resizeData.startX + dx;
        break;
      case "s": // bottom
        newHeight = Math.max(20, this.resizeData.startHeight + dy);
        break;
      case "n": // top
        newHeight = Math.max(20, this.resizeData.startHeight - dy);
        newY = this.resizeData.startY + dy;
        break;
      case "ne": // top-right
        newWidth = Math.max(20, this.resizeData.startWidth + dx);
        newHeight = Math.max(20, this.resizeData.startHeight - dy);
        newY = this.resizeData.startY + dy;
        break;
      case "nw": // top-left
        newWidth = Math.max(20, this.resizeData.startWidth - dx);
        newHeight = Math.max(20, this.resizeData.startHeight - dy);
        newX = this.resizeData.startX + dx;
        newY = this.resizeData.startY + dy;
        break;
      case "se": // bottom-right
        newWidth = Math.max(20, this.resizeData.startWidth + dx);
        newHeight = Math.max(20, this.resizeData.startHeight + dy);
        break;
      case "sw": // bottom-left
        newWidth = Math.max(20, this.resizeData.startWidth - dx);
        newHeight = Math.max(20, this.resizeData.startHeight + dy);
        newX = this.resizeData.startX + dx;
        break;
    }

    // При пропорциональном масштабировании
    if (
      this.options.proportionedScaling &&
      ["ne", "nw", "se", "sw"].includes(this.resizeData.pos)
    ) {
      const delta = Math.max(Math.abs(dx), Math.abs(dy));
      const signX = dx > 0 ? 1 : -1;
      const signY = dy > 0 ? 1 : -1;

      newWidth = Math.max(20, this.resizeData.startWidth + delta * signX);
      newHeight = Math.max(20, newWidth / this._originalAspectRatio);

      // Пересчитываем позицию для угловых ручек
      if (this.resizeData.pos === "nw") {
        newX = this.resizeData.startX + (this.resizeData.startWidth - newWidth);
        newY =
          this.resizeData.startY + (this.resizeData.startHeight - newHeight);
      } else if (this.resizeData.pos === "ne") {
        newY =
          this.resizeData.startY + (this.resizeData.startHeight - newHeight);
      } else if (this.resizeData.pos === "sw") {
        newX = this.resizeData.startX + (this.resizeData.startWidth - newWidth);
      }
    }

    this._width = Math.max(20, newWidth);
    this._height = Math.max(20, newHeight);
    this.position.set(newX, newY);

    this.updateSelection();

    if (this.onResize) {
      this.onResize(this._width, this._height);
    }

    if (this.showGuides) {
      this.updateGuideLines();
    }
  }

  resize(width, height) {
    if (this.options.proportionedScaling) {
      const newAspectRatio = width / height;

      if (newAspectRatio > this._originalAspectRatio) {
        height = width / this._originalAspectRatio;
      } else {
        width = height * this._originalAspectRatio;
      }
    }

    if (this.options.snapToGrid) {
      width = Math.round(width / this.options.gridSize) * this.options.gridSize;
      height =
        Math.round(height / this.options.gridSize) * this.options.gridSize;
    }

    this._width = Math.max(20, width);
    this._height = Math.max(20, height);

    this.updateSelection();

    if (this.onResize) {
      this.onResize(this._width, this._height);
    }

    if (this.showGuides) {
      this.updateGuideLines();
    }

    const newX = Math.max(
      this.bounds.x,
      Math.min(this.bounds.x + this.bounds.width - this._width, this.x),
    );
    const newY = Math.max(
      this.bounds.y,
      Math.min(this.bounds.y + this.bounds.height - this._height, this.y),
    );

    this.position.set(newX, newY);

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
    if (this.options.snapToGrid) {
      x = Math.round(x / this.options.gridSize) * this.options.gridSize;
      y = Math.round(y / this.options.gridSize) * this.options.gridSize;
    }

    x = Math.max(
      this.bounds.x,
      Math.min(this.bounds.x + this.bounds.width - this._width, x),
    );
    y = Math.max(
      this.bounds.y,
      Math.min(this.bounds.y + this.bounds.height - this._height, y),
    );

    this.position.set(x, y);

    if (this.showGuides) {
      this.updateGuideLines();
    }
  }

  getSize() {
    return { width: this._width, height: this._height };
  }

  setFontFamily(fontFamily) {
    this._fontFamily = fontFamily || null;
    if (!this._fontFamily) return this;

    this._forEachTextNode((text) => {
      text.style.fontFamily = this._fontFamily;
    });
    return this;
  }

  getFontFamily() {
    return this._fontFamily;
  }

  _forEachTextNode(callback, node = this.content) {
    if (!node) return;
    if (node.style && node.text !== undefined) {
      callback(node);
    }
    node.children?.forEach((child) => this._forEachTextNode(callback, child));
  }

  setTextColor(color) {
    this._textColor = color;
    this._forEachTextNode((text) => {
      text.style.fill = color;
    });
    return this;
  }

  getTextColor() {
    return this._textColor;
  }

  setBorderColor(color) {
    this.options.borderColor = typeof color === "number" ? color : Number(color) || 0xffffff;
    this.updateSelection?.();
    return this;
  }

  getBorderColor() {
    return this.options.borderColor ?? 0xffffff;
  }

  setBorderAlpha(alpha) {
    const value = Math.max(0, Math.min(1, Number(alpha)));
    this.options.borderAlpha = Number.isFinite(value) ? value : 0;
    this.updateSelection?.();
    return this;
  }

  getBorderAlpha() {
    return this.options.borderAlpha ?? 0;
  }

  setBorderWidth(width) {
    const value = Math.max(0, Math.min(24, Number(width)));
    this.options.borderWidth = Number.isFinite(value) ? value : 0;
    this.updateSelection?.();
    return this;
  }

  getBorderWidth() {
    return this.options.borderWidth ?? 0;
  }

  setEffectPreset(preset = "none") {
    this._effectPreset = preset || "none";
    this.options.effectPreset = this._effectPreset;
    return this.applyEffectPreset(this._effectPreset);
  }

  getEffectPreset() {
    return this._effectPreset || "none";
  }

  applyEffectPreset(preset = "none", options = {}) {
    const presets = {
      none: {
        alpha: 1,
        borderAlpha: 0,
        borderWidth: 0,
        shadowAlpha: 0,
      },
      minimal: {
        alpha: 1,
        backgroundColor: 0x101827,
        backgroundAlpha: 0.18,
        radius: 12,
        borderColor: 0xffffff,
        borderAlpha: 0.12,
        borderWidth: 1,
        shadowAlpha: 0.08,
        shadowColor: 0x000000,
        shadowOffsetY: 5,
        shadowSpread: 5,
      },
      glass: {
        alpha: 1,
        backgroundColor: 0x7dd3fc,
        backgroundAlpha: 0.2,
        radius: 20,
        borderColor: 0x67e8f9,
        borderAlpha: 0.5,
        borderWidth: 1,
        shadowAlpha: 0.1,
        shadowColor: 0x000000,
        shadowOffsetY: 6,
        shadowSpread: 6,
      },
      premium: {
        alpha: 1,
        backgroundColor: 0x1d2450,
        backgroundAlpha: 0.5,
        radius: 20,
        borderColor: 0x7b61ff,
        borderAlpha: 0.62,
        borderWidth: 2,
        shadowAlpha: 0.14,
        shadowColor: 0x000000,
        shadowOffsetY: 7,
        shadowSpread: 7,
      },
      dark: {
        alpha: 1,
        backgroundColor: 0x0b1020,
        backgroundAlpha: 0.72,
        radius: 14,
        borderColor: 0x334155,
        borderAlpha: 0.45,
        borderWidth: 1,
        shadowAlpha: 0.16,
        shadowColor: 0x000000,
        shadowOffsetY: 7,
        shadowSpread: 7,
        textColor: 0xffffff,
      },
      light: {
        alpha: 1,
        backgroundColor: 0xffffff,
        backgroundAlpha: 0.78,
        radius: 14,
        borderColor: 0xffffff,
        borderAlpha: 0.72,
        borderWidth: 1,
        shadowAlpha: 0.1,
        shadowColor: 0x000000,
        shadowOffsetY: 6,
        shadowSpread: 6,
        textColor: 0x111827,
      },
    };
    const config = presets[preset] || presets.none;
    this._effectConfig = config;
    this.alpha = config.alpha;

    if (!options.silent && config.backgroundColor !== undefined) {
      if (this.setBackgroundColor) {
        this.setBackgroundColor(config.backgroundColor);
      } else if (this._backgroundColor !== undefined) {
        this._backgroundColor = config.backgroundColor;
      } else if (this.options?.backgroundColor !== undefined) {
        this.options.backgroundColor = config.backgroundColor;
      }
    }

    if (!options.silent && config.backgroundAlpha !== undefined) {
      if (this.setBackgroundAlpha) {
        this.setBackgroundAlpha(config.backgroundAlpha);
      } else if (this._backgroundAlpha !== undefined) {
        this._backgroundAlpha = config.backgroundAlpha;
      } else if (this.options?.backgroundAlpha !== undefined) {
        this.options.backgroundAlpha = config.backgroundAlpha;
      }
    }

    if (!options.silent && config.radius !== undefined && this.setCornerRadius) {
      this.setCornerRadius(Math.min(100, Math.max(0, config.radius)));
    }

    if (!options.silent && config.textColor !== undefined && this.setTextColor) {
      this.setTextColor(config.textColor);
    }

    this.updateSelection?.();
    return this;
  }

  redrawEffectFrame() {
    if (!this.effectShadow || !this.effectFrame) return;
    const config = this._effectConfig || {};
    const radius =
      this.getCornerRadius?.() ??
      this._cornerRadius ??
      this.options.cornerRadius ??
      8;

    this.effectShadow.clear();
    this.effectFrame.clear();

    if (config.shadowAlpha > 0) {
      const spread = config.shadowSpread ?? 6;
      const offsetY = config.shadowOffsetY ?? 8;
      this.effectShadow
        .beginFill(config.shadowColor ?? 0x000000, config.shadowAlpha)
        .drawRoundedRect(
          -spread / 2,
          offsetY,
          this._width + spread,
          this._height + spread * 0.75,
          Math.max(0, radius + spread / 2),
        )
        .endFill();
    }

    const borderWidth = this.options.borderWidth > 0 ? this.options.borderWidth : config.borderWidth;
    const borderAlpha = this.options.borderWidth > 0 ? this.options.borderAlpha : config.borderAlpha;
    const borderColor = this.options.borderWidth > 0 ? this.options.borderColor : config.borderColor;

    if (borderWidth > 0 && borderAlpha > 0) {
      const inset = borderWidth / 2;
      this.effectFrame
        .roundRect(
          inset,
          inset,
          Math.max(0, this._width - borderWidth),
          Math.max(0, this._height - borderWidth),
          Math.max(0, radius - inset),
        )
        .stroke({
          width: borderWidth,
          color: borderColor ?? 0xffffff,
          alpha: borderAlpha,
        });
    }
  }

  getSceneData() {
    return {
      fontFamily: this._fontFamily,
      textColor: this._textColor,
      effectPreset: this._effectPreset,
      borderColor: this.options.borderColor,
      borderAlpha: this.options.borderAlpha,
      borderWidth: this.options.borderWidth,
    };
  }

  // === Scale метод для пропорционального масштабирования ===
  scale(scaleFactor, options = {}) {
    const minScale = options.minScale || 0.1;
    const maxScale = options.maxScale || 3.0;
    let clampedScale = Math.max(minScale, Math.min(maxScale, scaleFactor));

    const originalWidth = this.content.width;
    const originalHeight = this.content.height;

    let newWidth = originalWidth * clampedScale;
    let newHeight = originalHeight * clampedScale;

    if (this.options.proportionedScaling) {
      const newAspectRatio = newWidth / newHeight;

      if (newAspectRatio > this._originalAspectRatio) {
        newHeight = newWidth / this._originalAspectRatio;
      } else {
        newWidth = newHeight * this._originalAspectRatio;
      }
    }

    if (options.screenWidth && options.screenHeight) {
      const maxAvailableWidth = options.screenWidth - this.x;
      const maxAvailableHeight = options.screenHeight - this.y;

      const maxScaleByWidth =
        maxAvailableWidth /
        (this.options.proportionedScaling
          ? originalWidth
          : newWidth / clampedScale);
      const maxScaleByHeight =
        maxAvailableHeight /
        (this.options.proportionedScaling
          ? originalHeight
          : newHeight / clampedScale);

      const maxAllowedScale = Math.min(
        maxScaleByWidth,
        maxScaleByHeight,
        maxScale,
      );
      clampedScale = Math.max(minScale, Math.min(maxAllowedScale, scaleFactor));

      newWidth = originalWidth * clampedScale;
      newHeight = originalHeight * clampedScale;

      if (this.options.proportionedScaling) {
        const newAspectRatio = newWidth / newHeight;

        if (newAspectRatio > this._originalAspectRatio) {
          newHeight = newWidth / this._originalAspectRatio;
        } else {
          newWidth = newHeight * this._originalAspectRatio;
        }
      }
    }

    if (this.options.snapToGrid) {
      newWidth =
        Math.round(newWidth / this.options.gridSize) * this.options.gridSize;
      newHeight =
        Math.round(newHeight / this.options.gridSize) * this.options.gridSize;
    }

    this._width = Math.max(20, newWidth);
    this._height = Math.max(20, newHeight);

    this.updateSelection();

    if (this.onResize) {
      this.onResize(this._width, this._height);
    }

    if (this.showGuides) {
      this.updateGuideLines();
    }

    const newX = Math.max(
      this.bounds.x,
      Math.min(this.bounds.x + this.bounds.width - this._width, this.x),
    );
    const newY = Math.max(
      this.bounds.y,
      Math.min(this.bounds.y + this.bounds.height - this._height, this.y),
    );

    this.position.set(newX, newY);

    if (this.options.autoCenter) {
      this.autoCenter();
    }

    return {
      scaleFactor: clampedScale,
      width: this._width,
      height: this._height,
    };
  }

  // === Дополнительные методы для работы со скейлом ===
  getCurrentScale() {
    const originalWidth = this.content.width;
    return this._width / originalWidth;
  }

  resetScale() {
    return this.scale(1.0);
  }

  scaleBy(multiplier, options = {}) {
    const currentScale = this.getCurrentScale();
    return this.scale(currentScale * multiplier, options);
  }

  setScaleLimits(minScale = 0.1, maxScale = 3.0) {
    this.minScale = minScale;
    this.maxScale = maxScale;
  }

  // === Методы для центрирования по вертикали и горизонтали ===
  centerHorizontal() {
    const centerX =
      Math.round(
        (this.bounds.width - this._width) / 2 / this.options.gridSize,
      ) * this.options.gridSize;

    const finalX = Math.max(
      this.bounds.x,
      Math.min(this.bounds.x + this.bounds.width - this._width, centerX),
    );

    this.position.set(finalX, this.y);
    return this.getPosition();
  }

  centerVertical() {
    const centerY =
      Math.round(
        (this.bounds.height - this._height) / 2 / this.options.gridSize,
      ) * this.options.gridSize;

    const finalY = Math.max(
      this.bounds.y,
      Math.min(this.bounds.y + this.bounds.height - this._height, centerY),
    );

    this.position.set(this.x, finalY);
    return this.getPosition();
  }

  // Компактная версия настроек
  getCompactSettings() {
    return {
      name: this.name || "unnamed_widget",
      type: this.constructor.name,
      x: Math.round(this.x),
      y: Math.round(this.y),
      width: Math.round(this._width),
      height: Math.round(this._height),
      color: this.options.color,
      alpha: this.options.alpha,
      cornerRadius: this.options.cornerRadius,
      backgroundColor: this.options.backgroundColor,
      backgroundAlpha: this.options.backgroundAlpha,
      borderColor: this.options.borderColor,
      borderAlpha: this.options.borderAlpha,
      borderWidth: this.options.borderWidth,
      proportionedScaling: this.options.proportionedScaling,
      autoCenter: this.options.autoCenter,
      snapToGrid: this.options.snapToGrid,
      gridSize: this.options.gridSize,
      zIndex: this._zIndex,
      baseZIndex: this._baseZIndex,
      autoZIndex: this.options.autoZIndex,
      zIndexChanged: this._zIndexChanged,
      effectPreset: this._effectPreset,
      aspectRatio: Math.round(this._originalAspectRatio * 1000) / 1000,
      contentType: this.content.constructor.name,
      isSelected: this.isSelected,
    };
  }

  // Полная версия настроек
  getFullSettings() {
    const settings = this.getCompactSettings();
    settings.dragState = {
      isDragging: this.isDragging,
      isSelected: this.isSelected,
      tempZIndex: this._tempZIndex,
    };
    return settings;
  }

  // Восстановление настроек из объекта
  restoreSettings(settings) {
    if (settings.x !== undefined && settings.y !== undefined) {
      this.setPosition(settings.x, settings.y);
    }

    if (settings.width !== undefined && settings.height !== undefined) {
      this.resize(settings.width, settings.height);
    }

    if (settings.zIndex !== undefined) {
      this.setZIndex(settings.zIndex);
      this._baseZIndex = settings.zIndex;
    }

    if (settings.autoZIndex !== undefined) {
      this.options.autoZIndex = settings.autoZIndex;
    }

    const optionalSettings = [
      "color",
      "alpha",
      "cornerRadius",
      "backgroundColor",
      "backgroundAlpha",
      "borderColor",
      "borderAlpha",
      "borderWidth",
      "proportionedScaling",
      "autoCenter",
      "snapToGrid",
      "gridSize",
      "effectPreset",
    ];

    optionalSettings.forEach((setting) => {
      if (settings[setting] !== undefined) {
        this.options[setting] = settings[setting];
      }
    });

    this.updateSelection();

    if (settings.effectPreset !== undefined) {
      this.setEffectPreset(settings.effectPreset);
    }

    if (settings.borderColor !== undefined) this.setBorderColor(settings.borderColor);
    if (settings.borderAlpha !== undefined) this.setBorderAlpha(settings.borderAlpha);
    if (settings.borderWidth !== undefined) this.setBorderWidth(settings.borderWidth);

    return this.getCompactSettings();
  }

  destroy(options) {
    if (this.guideLines.parent) {
      this.guideLines.parent.removeChild(this.guideLines);
    }
    this.guideLines.destroy();
    super.destroy(options);
  }
}
