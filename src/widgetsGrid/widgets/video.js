// VideoWidget.js
import { Container, Graphics, Texture, Sprite, Text, Assets } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import { requestWidgetData } from "../../batchWidgetData";
import {
  createWidgetFillGradient,
  normalizeWidgetGradient,
} from "../widgetGradient";

export default class VideoWidget extends DraggableWidget {
  // В конструкторе VideoWidget измените эту часть:
  constructor(bounds, options = {}) {
    const width = options.width ?? 577;
    const height = options.height ?? 377;

    const content = new Container();

    // Фон виджета
    const bg = new Graphics();
    bg.rect(0, 0, width, height);
    bg.fill({
      color: options.backgroundColor ?? 0x000000,
      alpha: options.backgroundAlpha ?? 1,
    });
    bg.roundRect(0, 0, width, height, options.cornerRadius ?? 16);
    content.addChild(bg);

    // Основной контейнер для медиа
    const mediaContainer = new Container();
    content.addChild(mediaContainer);
    const mediaMask = new Graphics();
    mediaMask.roundRect(0, 0, width, height, options.cornerRadius ?? 16);
    mediaMask.fill({ color: 0xffffff, alpha: 1 });
    mediaContainer.mask = mediaMask;
    content.addChild(mediaMask);

    // Контейнер для предупреждений (поверх всего)
    const warningContainer = new Container();
    warningContainer.zIndex = 1000;
    content.addChild(warningContainer);

    const previewControls = new Container();
    previewControls.zIndex = 1100;
    previewControls.visible = options.editorPreviewControls ?? false;

    const playPreviewControl = new Container();
    const playPreviewBg = new Graphics();
    const playPreviewIcon = new Text("▶", {
      fontFamily: "Arial",
      fontSize: 18,
      fontWeight: "700",
      fill: 0xffffff,
    });
    playPreviewControl.addChild(playPreviewBg, playPreviewIcon);

    const soundPreviewControl = new Container();
    const soundPreviewBg = new Graphics();
    const soundPreviewIcon = new Text("×", {
      fontFamily: "Arial",
      fontSize: 18,
      fontWeight: "700",
      fill: 0xffffff,
    });
    soundPreviewControl.addChild(soundPreviewBg, soundPreviewIcon);
    previewControls.addChild(playPreviewControl, soundPreviewControl);
    content.sortableChildren = true;
    content.addChild(previewControls);

    // Передаем размеры через content в super()
    super(bounds, content, options);

    // Сохраняем исходные размеры
    this.originalWidth = width;
    this.originalHeight = height;

    // Сохраняем ссылки
    this.bg = bg;
    this.mediaContainer = mediaContainer;
    this.mediaMask = mediaMask;
    this.warningContainer = warningContainer;
    this.previewControls = previewControls;
    this.playPreviewControl = playPreviewControl;
    this.playPreviewBg = playPreviewBg;
    this.playPreviewIcon = playPreviewIcon;
    this.soundPreviewControl = soundPreviewControl;
    this.soundPreviewBg = soundPreviewBg;
    this.soundPreviewIcon = soundPreviewIcon;
    this._editorPreviewControls = options.editorPreviewControls ?? false;
    this.content = content;
    this.addChild(previewControls);

    // Для хранения placeholder
    this.placeholderContainer = null;

    // Свойства виджета
    this._backgroundColor = options.backgroundColor ?? 0x000000;
    this._backgroundAlpha = options.backgroundAlpha ?? 1;
    this._cornerRadius = options.cornerRadius ?? 16;
    this._backgroundGradient = normalizeWidgetGradient(
      options.backgroundGradient,
    );
    this._panelId = options.panelId ?? null;
    this._baseUrl = options.baseUrl || "https://admin.i-panel.pro:8787";
    this._apiUrl = `${this._baseUrl}/api/new_file`;
    this._playlistLoop = true;
    this._muted = options.muted ?? true;
    this._currentIndex = 0;
    this._playlist = [];
    this._imageDisplayTime = options.imageDisplayTime ?? 5;
    this._slideShowTimer = null;
    this._retryCount = 0;
    this._maxRetries = 3;
    this._errorTimeout = null;
    this._isDestroyed = false;

    // Новые параметры
    this._playerNumber = options.playerNumber ?? 1; // Будет переопределено при добавлении на сцену

    this.type = "VideoWidget";

    // Состояние
    this.isPlaying = false;
    this.videoElement = null;
    this.videoTexture = null;
    this.videoSprite = null;
    this.imageTexture = null;
    this.imageSprite = null;
    this.animationFrameId = null;
    this.isLoading = false;
    this._hasError = false;
    this._previousMedia = null;
    this._mediaBlobCache = new Map();

    // Для управления воспроизведением
    this._videoPlayDuration = null;
    this._videoPlayTimer = null;
    this._multiplexedItems = [];
    this._currentMultiplexedIndex = 0;
    this._currentFileRepeatCount = 0;
    this._maxFileRepeats = 1;

    // Для хранения информации о соотношении сторон
    this._currentAspectRatio = null;
    this._aspectRatioWarningTimeout = null;
    this._aspectRatioWarningDisplayTime = 8000; // 8 секунд показа предупреждения
    this._aspectRatioTolerance = 0.15; // 15% допустимое отклонение от стандартных соотношений

    // Стандартные соотношения сторон
    this._standardAspectRatios = {
      "16:9": 16 / 9, // 1.777
      "32:9": 32 / 9,
      "21:9": 21 / 9,

      "9:16": 9 / 16,
      "9:32": 9 / 32,
      "9:21": 9 / 21,
    };

    // Переопределяем метод resize для дискретного изменения размера
    this.onResize = this.handleDiscreteResize.bind(this);

    this._setupPreviewControls();
    this._layoutPreviewControls();

    // Загружаем медиа при создании
    setTimeout(() => {
      if (this._panelId && !this._isDestroyed) {
        this._loadMediaFromApi();
      } else {
        this._createPlaceholder();
      }
    }, 500);
  }

  // === ДИСКРЕТНОЕ ИЗМЕНЕНИЕ РАЗМЕРА С ШАГОМ 10 ПИКСЕЛЕЙ ===
  handleDiscreteResize(newWidth, newHeight) {
    if (this._isDestroyed) return;

    // Округляем до ближайшего кратного 10
    const snappedWidth = Math.round(newWidth / 10) * 10;
    const snappedHeight = Math.round(newHeight / 10) * 10;

    // Применяем только диагональное масштабирование (сохраняем пропорции)
    if (this.options.proportionedScaling) {
      // Определяем, какое измерение изменилось больше
      const widthDiff = Math.abs(snappedWidth - this._width);
      const heightDiff = Math.abs(snappedHeight - this._height);

      if (widthDiff >= heightDiff) {
        // Меняем размер по ширине, высота пропорционально
        this._width = Math.max(20, snappedWidth);
        this._height = Math.max(
          20,
          Math.round(this._width / this._originalAspectRatio / 10) * 10,
        );
      } else {
        // Меняем размер по высоте, ширина пропорционально
        this._height = Math.max(20, snappedHeight);
        this._width = Math.max(
          20,
          Math.round((this._height * this._originalAspectRatio) / 10) * 10,
        );
      }
    } else {
      // Без сохранения пропорций
      this._width = Math.max(20, snappedWidth);
      this._height = Math.max(20, snappedHeight);
    }

    // Проверяем и корректируем позицию, чтобы не выходить за границы
    this._clampToBounds();

    // Обновляем UI
    this.updateSelection();

    // Обновляем медиа контент
    this._updateMediaSize();

    // Обновляем placeholder если есть
    if (this.placeholderContainer) {
      this._updatePlaceholder();
    }

    // Перерисовываем фон
    this._redrawBackground();
  }

  // Переопределяем метод onResizeMove для дискретного изменения размера
  onResizeMove(event) {
    if (!this.resizeData) return;

    const globalPos = event.data.global;
    const dx = globalPos.x - this.resizeData.start.x;
    const dy = globalPos.y - this.resizeData.start.y;

    let newWidth = this.resizeData.startWidth;
    let newHeight = this.resizeData.startHeight;
    let newX = this.resizeData.startX;
    let newY = this.resizeData.startY;

    // Только диагональные ручки (se, sw, ne, nw) изменяют размер
    switch (this.resizeData.pos) {
      case "se": // bottom-right
        newWidth = this.resizeData.startWidth + dx;
        newHeight = this.resizeData.startHeight + dy;
        break;
      case "sw": // bottom-left
        newWidth = this.resizeData.startWidth - dx;
        newHeight = this.resizeData.startHeight + dy;
        newX = this.resizeData.startX + dx;
        break;
      case "ne": // top-right
        newWidth = this.resizeData.startWidth + dx;
        newHeight = this.resizeData.startHeight - dy;
        newY = this.resizeData.startY + dy;
        break;
      case "nw": // top-left
        newWidth = this.resizeData.startWidth - dx;
        newHeight = this.resizeData.startHeight - dy;
        newX = this.resizeData.startX + dx;
        newY = this.resizeData.startY + dy;
        break;
      default:
        // Не-диагональные ручки не изменяют размер
        return;
    }

    // Применяем дискретное изменение размера
    if (this.options.proportionedScaling) {
      const delta = Math.max(Math.abs(dx), Math.abs(dy));
      const signX = dx > 0 ? 1 : -1;
      const signY = dy > 0 ? 1 : -1;

      // Дискретный шаг изменения размера (10 пикселей)
      const step = 10;
      const deltaSteps = Math.round(delta / step);
      const deltaValue =
        deltaSteps * step * (Math.abs(dx) >= Math.abs(dy) ? signX : signY);

      newWidth = Math.max(20, this.resizeData.startWidth + deltaValue);
      newHeight = Math.max(20, newWidth / this._originalAspectRatio);

      // Округляем до кратного 10
      newWidth = Math.round(newWidth / step) * step;
      newHeight = Math.round(newHeight / step) * step;

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
    } else {
      // Округляем до кратного 10
      const step = 10;
      newWidth = Math.round(Math.max(20, newWidth) / step) * step;
      newHeight = Math.round(Math.max(20, newHeight) / step) * step;
    }

    this._width = Math.max(20, newWidth);
    this._height = Math.max(20, newHeight);
    this.position.set(newX, newY);

    // Проверяем и корректируем позицию, чтобы не выходить за границы
    this._clampToBounds();

    // Обновляем UI
    this.updateSelection();

    // Вызываем обработчик изменения размера
    if (this.onResize) {
      this.onResize(this._width, this._height);
    }

    if (this.showGuides) {
      this.updateGuideLines();
    }
  }

  // Добавьте этот метод в VideoWidget
  updateBounds(bounds) {
    if (this._isDestroyed) return;

    this.bounds = bounds;

    // Проверяем, не выходит ли виджет за новые границы
    this._clampToBounds();

    // Если нужно, обновляем позицию
    if (this.updateSelection) {
      this.updateSelection();
    }
  }

  resize(width, height) {
    if (this._isDestroyed) return;

    // Округляем до кратного 10
    const step = 10;
    let newWidth = Math.round(Math.max(20, width) / step) * step;
    let newHeight = Math.round(Math.max(20, height) / step) * step;

    if (this.options.proportionedScaling && this._originalAspectRatio) {
      const newAspectRatio = newWidth / newHeight;

      if (newAspectRatio > this._originalAspectRatio) {
        newHeight =
          Math.round(newWidth / this._originalAspectRatio / step) * step;
      } else {
        newWidth =
          Math.round((newHeight * this._originalAspectRatio) / step) * step;
      }
    }

    // Дополнительная проверка: размер не может быть больше границ редактора
    if (this.bounds) {
      const maxWidth = this.bounds.width;
      const maxHeight = this.bounds.height;

      if (newWidth > maxWidth) {
        newWidth = maxWidth;
        console.log(
          `⚠️ Ширина ограничена: ${width} -> ${newWidth} (макс: ${maxWidth})`,
        );
      }
      if (newHeight > maxHeight) {
        newHeight = maxHeight;
        console.log(
          `⚠️ Высота ограничена: ${height} -> ${newHeight} (макс: ${maxHeight})`,
        );
      }
    }

    this._width = Math.max(20, newWidth);
    this._height = Math.max(20, newHeight);

    // Проверяем и корректируем позицию
    this._clampToBounds();

    this.updateSelection();

    if (this.onResize) {
      this.onResize(this._width, this._height);
    }

    if (this.showGuides) {
      this.updateGuideLines();
    }

    // Обновляем медиа контент
    this._updateMediaSize();

    // Обновляем placeholder если есть
    if (this.placeholderContainer) {
      this._updatePlaceholder();
    }

    // Еще одна проверка после обновления
    setTimeout(() => {
      if (!this._isDestroyed) {
        this._ensureFullyVisible();
      }
    }, 10);
  }

  // Обновление размера медиа контента
  _updateMediaSize() {
    if (this._isDestroyed) return;

    // Обновляем видео спрайт если есть
    if (this.videoSprite) {
      this.videoSprite.width = this._width;
      this.videoSprite.height = this._height;
      this.videoSprite.x = 0;
      this.videoSprite.y = 0;
    }

    // Обновляем изображение если есть
    if (this.imageSprite) {
      this._fitImageToContainer();
    }

    // Перерисовываем фон
    this._redrawBackground();
    this._layoutPreviewControls();
  }

  _setupPreviewControls() {
    const stopEvent = (event) => event.stopPropagation?.();
    [this.playPreviewControl, this.soundPreviewControl].forEach((control) => {
      control.eventMode = "static";
      control.cursor = "pointer";
      control.on("pointerdown", stopEvent);
      control.on("pointerup", stopEvent);
    });
    this.playPreviewControl.on("pointertap", (event) => {
      stopEvent(event);
      this.togglePlayback();
    });
    this.soundPreviewControl.on("pointertap", (event) => {
      stopEvent(event);
      this.toggleMuted();
    });
    this._updatePreviewControls();
  }

  _layoutPreviewControls() {
    if (!this.previewControls) return;
    const size = Math.max(
      30,
      Math.min(44, Math.min(this._width, this._height) * 0.13),
    );
    const gap = Math.max(6, size * 0.18);
    const padding = Math.max(10, size * 0.28);

    const drawButton = (control, background, icon, x) => {
      background
        .clear()
        .roundRect(0, 0, size, size, Math.min(10, size * 0.24))
        .fill({ color: 0x05070a, alpha: 0.76 })
        .stroke({ color: 0xffffff, alpha: 0.24, width: 1 });
      icon.style.fontSize = size * 0.46;
      icon.anchor.set(0.5);
      icon.position.set(size / 2, size / 2 - 1);
      control.position.set(x, 0);
    };

    drawButton(
      this.playPreviewControl,
      this.playPreviewBg,
      this.playPreviewIcon,
      0,
    );
    drawButton(
      this.soundPreviewControl,
      this.soundPreviewBg,
      this.soundPreviewIcon,
      size + gap,
    );
    this.previewControls.position.set(padding, padding);
  }

  _updatePreviewControls() {
    if (this.playPreviewIcon) {
      this.playPreviewIcon.text = this.isPlaying ? "Ⅱ" : "▶";
    }
    if (this.soundPreviewIcon) {
      this.soundPreviewIcon.text = this._muted ? "×" : "♪";
    }
  }

  _redrawMediaMask() {
    if (!this.mediaMask) return;
    this.mediaMask.clear();
    this.mediaMask.roundRect(
      0,
      0,
      this._width,
      this._height,
      this._cornerRadius,
    );
    this.mediaMask.fill({ color: 0xffffff, alpha: 1 });
  }

  // Загрузка списка медиа с API
  async _loadMediaFromApi() {
    if (!this._panelId || this.isLoading || this._isDestroyed) return;

    this.isLoading = true;
    this._hasError = false;

    try {
      this._showLoading();

      const data = await requestWidgetData("media", {
        baseUrl: this._baseUrl,
        panelId: this._panelId,
      });
      const files = Array.isArray(data)
        ? data
        : Array.isArray(data?.files)
          ? data.files
          : [];
      const sortedArray = [...files].sort(
        (a, b) => (a.position || 0) - (b.position || 0),
      );
      this._processApiResponse(sortedArray);

      if (this._playlist.length > 0) {
        // Создаем мультиплексированный плейлист
        this._createMultiplexedPlaylist();

        if (this._multiplexedItems.length > 0) {
          this._retryCount = 0;
          this._loadCurrentMedia();
        } else {
          this._showError(
            "❌ Нет медиа для воспроизведения с текущими настройками",
          );
        }
      } else {
        this._showError("❌ Медиа не найдены в ответе API");
      }
    } catch (error) {
      this._retryCount++;

      if (this._retryCount <= this._maxRetries) {
        this._showError(
          `Попытка ${this._retryCount}/${this._maxRetries}: ${error.message}`,
        );
        setTimeout(() => {
          if (!this._isDestroyed) {
            this._loadMediaFromApi();
          }
        }, 5000);
      } else {
        this._showError("Не удалось загрузить медиа. Проверьте подключение.");
        this._createPlaceholder();
      }
    } finally {
      this.isLoading = false;
    }
  }

  _clampToBounds() {
    if (!this.bounds) return;

    // Получаем границы редактора
    const minX = this.bounds.x;
    const minY = this.bounds.y;
    const maxX = this.bounds.x + this.bounds.width - this._width;
    const maxY = this.bounds.y + this.bounds.height - this._height;

    let newX = this.x;
    let newY = this.y;
    let needsUpdate = false;

    // Корректируем X - не может быть меньше левой границы
    if (newX < minX) {
      newX = minX;
      needsUpdate = true;
      console.log(`📐 Корректировка X: ${this.x} -> ${newX} (мин: ${minX})`);
    }

    // Корректируем X - не может быть больше правой границы
    if (newX > maxX && maxX >= minX) {
      newX = maxX;
      needsUpdate = true;
      console.log(
        `📐 Корректировка X (правый край): ${this.x} -> ${newX} (макс: ${maxX})`,
      );
    }

    // Корректируем Y - не может быть меньше верхней границы
    if (newY < minY) {
      newY = minY;
      needsUpdate = true;
      console.log(`📐 Корректировка Y: ${this.y} -> ${newY} (мин: ${minY})`);
    }

    // Корректируем Y - не может быть больше нижней границы
    if (newY > maxY && maxY >= minY) {
      newY = maxY;
      needsUpdate = true;
      console.log(
        `📐 Корректировка Y (нижний край): ${this.y} -> ${newY} (макс: ${maxY})`,
      );
    }

    // Если позиция изменилась, обновляем
    if (needsUpdate) {
      this.position.set(newX, newY);

      // Дополнительно проверяем, что виджет полностью виден
      this._ensureFullyVisible();
    }
  }

  // Добавьте этот метод для гарантии, что виджет полностью виден
  _ensureFullyVisible() {
    if (!this.bounds) return;

    const widgetRight = this.x + this._width;
    const widgetBottom = this.y + this._height;
    const editorRight = this.bounds.x + this.bounds.width;
    const editorBottom = this.bounds.y + this.bounds.height;

    let newX = this.x;
    let newY = this.y;
    let needsUpdate = false;

    // Если виджет выходит за правый край, пододвигаем
    if (widgetRight > editorRight) {
      newX = editorRight - this._width;
      needsUpdate = true;
      console.log(
        `🔧 Принудительная корректировка правого края: ${this.x} -> ${newX}`,
      );
    }

    // Если виджет выходит за левый край
    if (newX < this.bounds.x) {
      newX = this.bounds.x;
      needsUpdate = true;
    }

    // Если виджет выходит за нижний край
    if (widgetBottom > editorBottom) {
      newY = editorBottom - this._height;
      needsUpdate = true;
      console.log(
        `🔧 Принудительная корректировка нижнего края: ${this.y} -> ${newY}`,
      );
    }

    // Если виджет выходит за верхний край
    if (newY < this.bounds.y) {
      newY = this.bounds.y;
      needsUpdate = true;
    }

    if (needsUpdate) {
      this.position.set(newX, newY);
    }
  }

  _processApiResponse(data) {
    this._playlist = [];

    const files =
      data.files && Array.isArray(data.files)
        ? data.files
        : Array.isArray(data)
          ? data
          : [];

    files.forEach((file, index) => {
      if (typeof file?.url !== "string") return;

      const originalPath = file?.url;

      let cleanPath = originalPath;

      const encodedPath = this._encodeFilePath(originalPath);

      if (this._isVideoFile(cleanPath)) {
        this._playlist.push({
          type: "video",
          url: encodedPath,
          resolution: file?.resolution || file?.metadata?.resolution || "",
          width:
            file?.width || file?.video_width || file?.metadata?.width || null,
          height:
            file?.height ||
            file?.video_height ||
            file?.metadata?.height ||
            null,
          time_view: file?.time_view,
          multiplexer: file?.count_play,
          player_number: file?.player_number,
          position: file?.position,
        });
      } else if (this._isImageFile(cleanPath)) {
        this._playlist.push({
          type: "image",
          url: encodedPath,
          resolution: file?.resolution || file?.metadata?.resolution || "",
          width:
            file?.width || file?.image_width || file?.metadata?.width || null,
          height:
            file?.height ||
            file?.image_height ||
            file?.metadata?.height ||
            null,
          time_view: file?.time_view,
          multiplexer: file?.count_play,
          player_number: file?.player_number,
          position: file?.position,
        });
      }
    });
  }

  // Создание мультиплексированного плейлиста
  // Замените методы _createMultiplexedPlaylist, ensureNoAdjacentDuplicates и _simpleGreedyMultiplex на эти:

  // Создание мультиплексированного плейлиста с гарантией отсутствия повторов
  _createMultiplexedPlaylist() {
    this._multiplexedItems = [];

    // Фильтруем по номеру проигрывателя
    const filteredPlaylist = this._playlist.filter((item) => {
      const itemPlayerNumber = Number(item.player_number);
      const widgetPlayerNumber = Number(this._playerNumber);
      return (
        Number.isFinite(widgetPlayerNumber) &&
        (itemPlayerNumber === widgetPlayerNumber ||
          (!item.player_number && widgetPlayerNumber === 1))
      );
    });

    if (filteredPlaylist.length === 0) {
      console.warn("Нет элементов для текущего проигрывателя");
      return;
    }

    // Раскрываем мультиплексор (повторы файлов)
    let expandedItems = [];
    filteredPlaylist.forEach((item, originalIndex) => {
      const repeats = Math.max(1, item.multiplexer || 1);
      for (let i = 0; i < repeats; i++) {
        expandedItems.push({
          ...item,
          _originalIndex: originalIndex,
          _repeatIndex: i,
          _totalRepeats: repeats,
          // Уникальный ключ для сравнения (используем URL + оригинальный индекс)
          _compareKey: `${item.url}_${originalIndex}`,
        });
      }
    });

    if (expandedItems.length === 0) {
      console.warn("Нет элементов после раскрытия мультиплексора");
      return;
    }

    if (expandedItems.length === 1) {
      // Если всего один элемент, нет проблем с соседями
      this._multiplexedItems = expandedItems;
      return;
    }

    // Пытаемся построить последовательность без повторов
    const result = this._buildNonAdjacentSequence(expandedItems);

    if (result) {
      this._multiplexedItems = result;
      console.log(
        `✅ Построен мультиплексированный плейлист: ${result.length} элементов`,
      );
    } else {
      // Если не получилось идеально, используем fallback с минимальными повторами
      console.warn(
        "Не удалось построить идеальную последовательность, использую fallback",
      );
      this._multiplexedItems = this._buildFallbackSequence(expandedItems);
    }
  }

  // Построение последовательности без соседних повторов (с циклическим условием)
  _buildNonAdjacentSequence(items) {
    if (items.length === 0) return null;
    if (items.length === 1) return items;

    // Группируем элементы по их ключу (URL)
    const groups = new Map();
    items.forEach((item, idx) => {
      const key = item.url; // Используем URL как ключ
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push({ ...item, _arrayIndex: idx });
    });

    // Проверяем, возможно ли построить последовательность без повторов
    const maxCount = Math.max(
      ...Array.from(groups.values()).map((g) => g.length),
    );
    const total = items.length;

    // Если самый частый элемент встречается больше половины + 1, то идеальная последовательность невозможна
    if (maxCount > Math.floor((total + 1) / 2)) {
      console.warn(
        `Невозможно построить без повторов: самый частый элемент встречается ${maxCount} раз из ${total}`,
      );
      return null;
    }

    // Жадный алгоритм с приоритетом самых частых элементов
    const result = [];
    const remaining = new Map();

    // Копируем группы
    for (const [key, items] of groups) {
      remaining.set(key, [...items]);
    }

    // Функция получения текущего количества оставшихся элементов
    const getRemainingCount = () => {
      let count = 0;
      for (const items of remaining.values()) {
        count += items.length;
      }
      return count;
    };

    // Функция получения элемента с максимальным количеством оставшихся (кроме запрещенного)
    const getNextItem = (forbiddenKey) => {
      let bestKey = null;
      let bestCount = -1;
      let bestItem = null;

      for (const [key, items] of remaining) {
        if (key === forbiddenKey) continue;
        if (items.length > bestCount) {
          bestCount = items.length;
          bestKey = key;
        }
      }

      if (bestKey && remaining.get(bestKey).length > 0) {
        bestItem = remaining.get(bestKey).shift();
      }

      return bestItem;
    };

    let lastKey = null;
    let attempts = 0;
    const maxAttempts = items.length * 100;

    while (getRemainingCount() > 0 && attempts < maxAttempts) {
      attempts++;

      const nextItem = getNextItem(lastKey);

      if (!nextItem) {
        // Не удалось найти подходящий элемент, возможно, зашли в тупик
        console.warn("Тупик при построении последовательности");
        return null;
      }

      result.push(nextItem);
      lastKey = nextItem.url;
    }

    // Проверяем циклическое условие (первый и последний не должны совпадать)
    if (result.length >= 2 && result[0].url === result[result.length - 1].url) {
      // Пытаемся переставить последний элемент
      for (let i = result.length - 2; i >= 0; i--) {
        if (
          result[i].url !== result[0].url &&
          result[i].url !== result[result.length - 1].url
        ) {
          // Меняем местами последний элемент с найденным
          [result[result.length - 1], result[i]] = [
            result[i],
            result[result.length - 1],
          ];
          break;
        }
      }

      // Если все еще совпадают, пробуем переставить первый элемент
      if (result[0].url === result[result.length - 1].url) {
        for (let i = 1; i < result.length - 1; i++) {
          if (
            result[i].url !== result[0].url &&
            result[i].url !== result[result.length - 1].url
          ) {
            [result[0], result[i]] = [result[i], result[0]];
            break;
          }
        }
      }
    }

    // Финальная проверка соседей
    for (let i = 0; i < result.length - 1; i++) {
      if (result[i].url === result[i + 1].url) {
        console.warn(`Обнаружен соседний повтор на позициях ${i} и ${i + 1}`);
        return null;
      }
    }

    // Проверка циклического условия
    if (result.length >= 2 && result[0].url === result[result.length - 1].url) {
      console.warn("Обнаружен циклический повтор (первый и последний)");
      return null;
    }

    return result;
  }

  // Fallback последовательность с минимальными повторами (когда идеальная невозможна)
  _buildFallbackSequence(items) {
    if (items.length === 0) return [];
    if (items.length === 1) return items;

    // Копируем массив
    const remaining = [...items];
    const result = [];

    // Сортируем по частоте встречаемости
    const frequency = new Map();
    remaining.forEach((item) => {
      const key = item.url;
      frequency.set(key, (frequency.get(key) || 0) + 1);
    });

    // Сортируем оставшиеся элементы по убыванию частоты
    const sortByFrequency = (arr) => {
      return [...arr].sort((a, b) => {
        const freqA = frequency.get(a.url) || 0;
        const freqB = frequency.get(b.url) || 0;
        if (freqA !== freqB) return freqB - freqA;
        return a._repeatIndex - b._repeatIndex;
      });
    };

    let lastKey = null;

    while (remaining.length > 0) {
      // Сортируем оставшиеся
      const sorted = sortByFrequency(remaining);

      let selectedIndex = -1;

      // Ищем элемент, не совпадающий с последним
      for (let i = 0; i < sorted.length; i++) {
        if (sorted[i].url !== lastKey) {
          selectedIndex = remaining.findIndex((item) => item === sorted[i]);
          break;
        }
      }

      // Если все элементы совпадают с последним, берем любой (будет повтор)
      if (selectedIndex === -1) {
        selectedIndex = 0;
      }

      const selected = remaining.splice(selectedIndex, 1)[0];
      result.push(selected);
      lastKey = selected.url;
    }

    // Исправляем циклическое условие (первый и последний)
    if (result.length >= 2 && result[0].url === result[result.length - 1].url) {
      // Ищем элемент для обмена
      for (let i = result.length - 2; i > 0; i--) {
        if (result[i].url !== result[0].url) {
          [result[result.length - 1], result[i]] = [
            result[i],
            result[result.length - 1],
          ];
          break;
        }
      }
    }

    return result;
  }

  // Кодирование пути файла
  _encodeFilePath(filePath) {
    if (!filePath) return "";

    try {
      if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
        return filePath;
      }

      // Формируем полный URL
      const baseUrl = this._baseUrl.replace(/\/$/, "");
      const cleanUrl = filePath.replace(/^\//, "");
      const fullUrl = baseUrl + "/" + cleanUrl;

      return fullUrl;
    } catch (e) {
      console.error("Error in URL:", e);
      return filePath;
    }
  }

  _isVideoFile(filePath) {
    if (typeof filePath !== "string") return false;
    const lowerPath = filePath.split(/[?#]/)[0].toLowerCase();
    return (
      lowerPath.endsWith(".mp4") ||
      lowerPath.endsWith(".webm") ||
      lowerPath.endsWith(".ogg")
    );
  }

  _isImageFile(filePath) {
    if (typeof filePath !== "string") return false;
    const lowerPath = filePath.split(/[?#]/)[0].toLowerCase();
    return (
      lowerPath.endsWith(".jpg") ||
      lowerPath.endsWith(".jpeg") ||
      lowerPath.endsWith(".png") ||
      lowerPath.endsWith(".gif") ||
      lowerPath.endsWith(".bmp") ||
      lowerPath.endsWith(".webp")
    );
  }

  _preloadMediaUrl(url) {
    if (!url || typeof url !== "string") return null;

    const existing = this._mediaBlobCache.get(url);
    if (existing?.status === "ready" && existing.objectUrl) return existing;
    if (existing?.status === "loading") return existing;

    const controller = new window.AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    const entry = {
      status: "loading",
      objectUrl: "",
      promise: null,
    };

    entry.promise = window
      .fetch(url, {
        cache: "force-cache",
        signal: controller.signal,
      })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        const objectUrl = window.URL.createObjectURL(blob);
        entry.status = "ready";
        entry.objectUrl = objectUrl;
        entry.promise = Promise.resolve(objectUrl);
        return objectUrl;
      })
      .catch((error) => {
        entry.status = "error";
        entry.error = error;
        this._mediaBlobCache.delete(url);
        throw error;
      })
      .finally(() => {
        clearTimeout(timeoutId);
      });

    this._mediaBlobCache.set(url, entry);
    return entry;
  }

  _preloadPlaylistMedia() {
    const seen = new Set();
    this._multiplexedItems.forEach((item) => {
      if (!item?.url || seen.has(item.url)) return;
      seen.add(item.url);
      this._preloadMediaUrl(item.url);
    });
  }

  _getReadyMediaUrl(url) {
    const entry = this._mediaBlobCache.get(url);
    return entry?.status === "ready" && entry.objectUrl ? entry.objectUrl : url;
  }

  _releaseMediaCache() {
    this._mediaBlobCache.forEach((entry) => {
      if (entry?.objectUrl) {
        window.URL.revokeObjectURL(entry.objectUrl);
      }
    });
    this._mediaBlobCache.clear();
  }

  _loadCurrentMedia() {
    if (this._multiplexedItems.length === 0 || this._isDestroyed) {
      this._showError("Нет доступных медиа для воспроизведения");
      return;
    }

    if (this._currentMultiplexedIndex < 0) {
      this._currentMultiplexedIndex = 0;
    } else if (this._currentMultiplexedIndex >= this._multiplexedItems.length) {
      this._currentMultiplexedIndex = this._multiplexedItems.length - 1;
    }

    const media = this._multiplexedItems[this._currentMultiplexedIndex];
    const mediaUrl = media.url;

    console.log(this._multiplexedItems);

    if (!mediaUrl || !mediaUrl.includes("://")) {
      this._nextMediaWithDelay(3000);
      return;
    }

    this._prepareSeamlessSwitch();
    this._retryCount = 0;
    this._preloadPlaylistMedia();

    this._currentFileRepeatCount = media.repeatIndex;
    this._maxFileRepeats = media.totalRepeats;
    this._videoPlayDuration = media.displayTime;

    if (media.type === "video") {
      this._createAndLoadVideo(mediaUrl);
    } else {
      this._createAndLoadImage(media);
    }
  }

  _createAndLoadVideo(videoUrl) {
    try {
      if (this._errorTimeout) {
        clearTimeout(this._errorTimeout);
        this._errorTimeout = null;
      }

      const cacheEntry = this._preloadMediaUrl(videoUrl);
      if (
        cacheEntry?.status === "loading" &&
        this._previousMedia &&
        cacheEntry.promise
      ) {
        cacheEntry.promise
          .then(() => {
            if (!this._isDestroyed) {
              this._createAndLoadVideo(videoUrl);
            }
          })
          .catch((error) => {
            this._handleMediaError(error);
          });
        return;
      }

      this.videoElement = document.createElement("video");

      this.videoElement.muted = this._muted;
      this.videoElement.playsInline = true;
      this.videoElement.setAttribute("playsinline", "");
      this.videoElement.setAttribute("webkit-playsinline", "");
      if (this._muted) this.videoElement.setAttribute("muted", "muted");
      this.videoElement.crossOrigin = "anonymous";
      this.videoElement.preload = "auto";
      this.videoElement.loop = false;

      const loadTimeout = setTimeout(() => {
        if (this.videoElement && this.videoElement.readyState < 2) {
          this._handleMediaError(new Error("Таймаут загрузки"));
        }
      }, 45000);

      const onLoaded = () => {
        clearTimeout(loadTimeout);
        this._onVideoLoaded();
      };

      const onCanPlay = () => {
        clearTimeout(loadTimeout);
        this._onCanPlay();
      };

      const onError = (e) => {
        clearTimeout(loadTimeout);
        this._handleMediaError(e);
      };

      const onEnded = () => {
        this._onVideoEnded();
      };

      const onLoadedMetadata = () => {
        this._checkVideoAspectRatio();
      };

      this._videoEventHandlers = {
        loadeddata: onLoaded,
        canplay: onCanPlay,
        error: onError,
        ended: onEnded,
        loadedmetadata: onLoadedMetadata,
      };

      this.videoElement.addEventListener("loadeddata", onLoaded);
      this.videoElement.addEventListener("canplay", onCanPlay);
      this.videoElement.addEventListener("error", onError);
      this.videoElement.addEventListener("ended", onEnded);
      this.videoElement.addEventListener("loadedmetadata", onLoadedMetadata);

      this.videoElement.src = this._getReadyMediaUrl(videoUrl);
      this.videoElement.load();
    } catch (error) {
      this._handleMediaError(error);
    }
  }

  // Проверка соотношения сторон видео
  _checkVideoAspectRatio() {
    if (!this.videoElement || this._isDestroyed) return;

    const videoWidth = this.videoElement.videoWidth;
    const videoHeight = this.videoElement.videoHeight;

    if (videoWidth === 0 || videoHeight === 0) return;

    const aspectRatio = videoWidth / videoHeight;
    this._currentAspectRatio = aspectRatio;

    const currentMedia = this._multiplexedItems[this._currentMultiplexedIndex];
    if (currentMedia) {
      currentMedia.width = videoWidth;
      currentMedia.height = videoHeight;
      currentMedia.resolution = `${videoWidth}×${videoHeight}`;
      const originalMedia = this._playlist.find(
        (item) => item.url === currentMedia.url,
      );
      if (originalMedia) {
        originalMedia.width = videoWidth;
        originalMedia.height = videoHeight;
        originalMedia.resolution = currentMedia.resolution;
      }
    }

    const widgetRatio = this._width / this._height;
    const deviation = Math.abs((aspectRatio - widgetRatio) / widgetRatio);
    const expectedStandard = `${Math.round(this._width)}×${Math.round(this._height)}`;

    if (deviation > this._aspectRatioTolerance) {
      this._showAspectRatioWarning(
        "video",
        videoWidth,
        videoHeight,
        aspectRatio,
        expectedStandard,
        deviation,
      );
    }
  }

  // Проверка соотношения сторон изображения
  _checkImageAspectRatio() {
    if (!this.imageTexture || this._isDestroyed) return;

    const imageWidth = this.imageTexture.width;
    const imageHeight = this.imageTexture.height;

    if (imageWidth === 0 || imageHeight === 0) return;

    const aspectRatio = imageWidth / imageHeight;
    this._currentAspectRatio = aspectRatio;

    // Проверяем, соответствует ли соотношение сторон стандартным
    const closestStandard = this._findClosestStandardAspectRatio(aspectRatio);
    const deviation = Math.abs(
      (aspectRatio - closestStandard.ratio) / closestStandard.ratio,
    );

    // Показываем предупреждение только если отклонение значительное
    // if (deviation > this._aspectRatioTolerance) {
    //   this._showAspectRatioWarning(
    //     "image",
    //     imageWidth,
    //     imageHeight,
    //     aspectRatio,
    //     closestStandard.name,
    //     deviation,
    //   );
    // }
  }

  // Поиск ближайшего стандартного соотношения сторон
  _findClosestStandardAspectRatio(ratio) {
    let closestName = "неизвестно";
    let closestRatio = 0;
    let minDifference = Infinity;

    for (const [name, standardRatio] of Object.entries(
      this._standardAspectRatios,
    )) {
      const difference = Math.abs(ratio - standardRatio);
      if (difference < minDifference) {
        minDifference = difference;
        closestName = name;
        closestRatio = standardRatio;
      }
    }

    return {
      name: closestName,
      ratio: closestRatio,
      difference: minDifference,
    };
  }

  // Показ предупреждения о некорректном соотношении сторон НА ВИДЖЕТЕ
  _showAspectRatioWarning(
    type,
    width,
    height,
    actualRatio,
    expectedStandard,
    deviation,
  ) {
    if (this._isDestroyed) return;

    // Очищаем предыдущее предупреждение
    this._clearAspectRatioWarning();

    const warning = new Container();

    // Оранжевый фон с полупрозрачностью
    const bg = new Graphics();
    bg.rect(0, 0, this._width, this._height);
    bg.fill({ color: 0xffa500, alpha: 0.8 }); // Оранжевый
    warning.addChild(bg);

    // Большой черный текст предупреждения
    const warningText = `⚠️ ${type === "video" ? "ВИДЕО" : "ИЗОБРАЖЕНИЕ"} С НЕСТАНДАРТНЫМ СООТНОШЕНИЕМ СТОРОН`;

    const mainText = new Text(warningText, {
      fontFamily: "Arial",
      fontSize: Math.min(22, this._width * 0.05),
      fill: 0x000000, // Черный текст на оранжевом фоне
      fontWeight: "bold",
      align: "center",
      wordWrap: true,
      wordWrapWidth: this._width - 40,
    });
    mainText.x = this._width / 2 - mainText.width / 2;
    mainText.y = 25;
    warning.addChild(mainText);

    // Разделительная линия
    const line = new Graphics();
    line.moveTo(20, mainText.y + mainText.height + 10);
    line.lineTo(this._width - 20, mainText.y + mainText.height + 10);
    line.stroke({ width: 2, color: 0x000000 });
    warning.addChild(line);

    // Информация о размерах
    const sizeText = new Text(`Размер файла: ${width} × ${height}`, {
      fontFamily: "Arial",
      fontSize: Math.min(18, this._width * 0.04),
      fill: 0x000000,
      fontWeight: "bold",
      align: "center",
    });
    sizeText.x = this._width / 2 - sizeText.width / 2;
    sizeText.y = mainText.y + mainText.height + 25;
    warning.addChild(sizeText);

    // Соотношение сторон
    const ratioText = new Text(
      `Соотношение сторон: ${actualRatio.toFixed(3)}`,
      {
        fontFamily: "Arial",
        fontSize: Math.min(18, this._width * 0.04),
        fill: 0x000000,
        fontWeight: "bold",
        align: "center",
      },
    );
    ratioText.x = this._width / 2 - ratioText.width / 2;
    ratioText.y = sizeText.y + sizeText.height + 15;
    warning.addChild(ratioText);

    // Ближайшее стандартное соотношение
    const expectedText = new Text(`Размер виджета: ${expectedStandard}`, {
      fontFamily: "Arial",
      fontSize: Math.min(16, this._width * 0.035),
      fill: 0x000000,
      align: "center",
    });
    expectedText.x = this._width / 2 - expectedText.width / 2;
    expectedText.y = ratioText.y + ratioText.height + 15;
    warning.addChild(expectedText);

    // Отклонение в процентах (выделяем красным если отклонение большое)
    const deviationPercent = deviation * 100;
    const deviationColor = deviationPercent > 25 ? 0xff0000 : 0x8b0000; // Красный или темно-красный

    const deviationText = new Text(
      `Отклонение от виджета: ${deviationPercent.toFixed(1)}%`,
      {
        fontFamily: "Arial",
        fontSize: Math.min(20, this._width * 0.045),
        fill: deviationColor,
        fontWeight: "bold",
        align: "center",
      },
    );
    deviationText.x = this._width / 2 - deviationText.width / 2;
    deviationText.y = expectedText.y + expectedText.height + 20;
    warning.addChild(deviationText);

    // Предупреждение о последствиях
    const consequenceText = new Text(
      `Изображение может выглядеть растянутым или деформированным!`,
      {
        fontFamily: "Arial",
        fontSize: Math.min(18, this._width * 0.04),
        fill: 0x000000,
        fontWeight: "bold",
        align: "center",
        wordWrap: true,
        wordWrapWidth: this._width - 40,
      },
    );
    consequenceText.x = this._width / 2 - consequenceText.width / 2;
    consequenceText.y = deviationText.y + deviationText.height + 20;
    warning.addChild(consequenceText);

    // Имя файла (если есть)
    const currentMedia = this._multiplexedItems[this._currentMultiplexedIndex];
    if (currentMedia && currentMedia.cleanPath) {
      const fileName = currentMedia.cleanPath.split("/").pop();
      const fileText = new Text(`Файл: ${fileName}`, {
        fontFamily: "Arial",
        fontSize: Math.min(14, this._width * 0.03),
        fill: 0x333333,
        align: "center",
        wordWrap: true,
        wordWrapWidth: this._width - 40,
      });
      fileText.x = this._width / 2 - fileText.width / 2;
      fileText.y = consequenceText.y + consequenceText.height + 15;
      warning.addChild(fileText);
    }

    // Таймер исчезновения
    const timerText = new Text("Предупреждение исчезнет через 8 секунд", {
      fontFamily: "Arial",
      fontSize: Math.min(12, this._width * 0.025),
      fill: 0x333333,
      align: "center",
      fontStyle: "italic",
    });
    timerText.x = this._width / 2 - timerText.width / 2;
    timerText.y = this._height - 35;
    warning.addChild(timerText);

    // Добавляем на виджет
    this.warningContainer.addChild(warning);

    // Сохраняем ссылку
    this.aspectRatioWarning = warning;

    // Устанавливаем таймер на удаление предупреждения
    this._aspectRatioWarningTimeout = setTimeout(() => {
      this._clearAspectRatioWarning();
    }, this._aspectRatioWarningDisplayTime);
  }

  // Очистка предупреждения о соотношении сторон
  _clearAspectRatioWarning() {
    if (this._aspectRatioWarningTimeout) {
      clearTimeout(this._aspectRatioWarningTimeout);
      this._aspectRatioWarningTimeout = null;
    }

    if (this.aspectRatioWarning) {
      this.warningContainer.removeChild(this.aspectRatioWarning);
      this.aspectRatioWarning.destroy();
      this.aspectRatioWarning = null;
    }
  }

  async _createAndLoadImage(media) {
    try {
      if (this._errorTimeout) {
        clearTimeout(this._errorTimeout);
        this._errorTimeout = null;
      }

      let texture;
      try {
        texture = await Assets.load(media?.url);
      } catch (assetsError) {
        texture = await new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";

          const timeout = setTimeout(() => {
            reject(new Error("Таймаут загрузки изображения"));
          }, 10000);

          img.onload = () => {
            clearTimeout(timeout);
            try {
              const texture = Texture.from(img);
              resolve(texture);
            } catch (err) {
              reject(err);
            }
          };

          img.onerror = (err) => {
            clearTimeout(timeout);
            reject(new Error(`Не удалось загрузить изображение`));
          };

          img.src = media?.url;
        });
      }

      this.imageTexture = texture;
      this.imageSprite = new Sprite(this.imageTexture);

      // Проверяем соотношение сторон изображения
      // this._checkImageAspectRatio();

      this._fitImageToContainer();
      this.mediaContainer.addChild(this.imageSprite);
      this._cleanupPreviousMedia();

      this._hideLoading();
      this._retryCount = 0;
      this._hasError = false;

      const displayTime = media?.time_view;
      this._startSlideShowTimer(displayTime);
    } catch (error) {
      this._handleMediaError(error);
    }
  }

  _fitImageToContainer() {
    if (!this.imageSprite || !this.imageTexture) return;

    const containerWidth = this._width;
    const containerHeight = this._height;
    const imageWidth = this.imageTexture.width;
    const imageHeight = this.imageTexture.height;

    const containerRatio = containerWidth / containerHeight;
    const imageRatio = imageWidth / imageHeight;

    let newWidth, newHeight;

    if (imageRatio > containerRatio) {
      newWidth = containerWidth;
      newHeight = containerWidth / imageRatio;
    } else {
      newHeight = containerHeight;
      newWidth = containerHeight * imageRatio;
    }

    this.imageSprite.width = newWidth;
    this.imageSprite.height = newHeight;
    this.imageSprite.x = (containerWidth - newWidth) / 2;
    this.imageSprite.y = (containerHeight - newHeight) / 2;
  }

  // Таймер для перехода от изображения
  _startSlideShowTimer(displayTime) {
    if (this._isDestroyed) return;

    if (this._slideShowTimer) {
      clearTimeout(this._slideShowTimer);
      this._slideShowTimer = null;
    }

    this._slideShowTimer = setTimeout(() => {
      if (!this._isDestroyed) {
        this._nextMedia();
      }
    }, displayTime * 1000);
  }

  // Таймер для ограничения времени воспроизведения видео
  _startVideoDurationTimer(duration) {
    if (this._isDestroyed || !duration || duration <= 0) return;

    if (this._videoPlayTimer) {
      clearTimeout(this._videoPlayTimer);
      this._videoPlayTimer = null;
    }

    this._videoPlayTimer = setTimeout(() => {
      if (!this._isDestroyed && this.videoElement && this.isPlaying) {
        this._onVideoEnded();
      }
    }, duration * 1000);
  }

  _onVideoLoaded() {
    if (this._isDestroyed || !this.videoElement) return;

    try {
      this.videoTexture = Texture.from(this.videoElement);
      this.videoSprite = new Sprite(this.videoTexture);

      this.videoSprite.width = this._width;
      this.videoSprite.height = this._height;
      this.videoSprite.x = 0;
      this.videoSprite.y = 0;

      this.mediaContainer.addChild(this.videoSprite);
      this._cleanupPreviousMedia();

      this._hideLoading();
      this._tryPlayVideo();
      this._retryCount = 0;
      this._hasError = false;
    } catch (error) {
      this._handleMediaError(error);
    }
  }

  _onCanPlay() {
    if (this._isDestroyed || !this.videoElement) return;

    if (!this.isPlaying && !this._hasError) {
      this._tryPlayVideo();
    }
  }

  _tryPlayVideo() {
    if (
      this._isDestroyed ||
      !this.videoElement ||
      this.isPlaying ||
      this._hasError
    ) {
      return;
    }

    this.videoElement.muted = this._muted;

    const playPromise = this.videoElement.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          if (!this._isDestroyed) {
            this.isPlaying = true;
            this._updatePreviewControls();
            this._startTextureUpdate();

            if (this._videoPlayDuration) {
              this._startVideoDurationTimer(this._videoPlayDuration);
            }
          }
        })
        .catch((error) => {
          if (!this._isDestroyed) {
            if (error.name === "NotAllowedError") {
              this._muted = true;
              this.videoElement.muted = true;
              this.videoElement.setAttribute("muted", "muted");
              this._updatePreviewControls();
              setTimeout(() => {
                if (!this._isDestroyed) this._tryPlayVideo();
              }, 100);
            } else {
              this._handleMediaError(error);
            }
          }
        });
    }
  }

  _onVideoEnded() {
    if (this._isDestroyed) return;

    this.isPlaying = false;
    this._updatePreviewControls();
    this._stopTextureUpdate();

    if (this._videoPlayTimer) {
      clearTimeout(this._videoPlayTimer);
      this._videoPlayTimer = null;
    }

    setTimeout(() => {
      if (!this._isDestroyed) {
        this._nextMedia();
      }
    }, 1000);
  }

  _handleMediaError(error) {
    if (this._isDestroyed) return;

    this._hasError = true;
    this._retryCount++;

    this._hideLoading();
    if (!this.videoSprite && !this.imageSprite) {
      this._cleanupMedia();
    } else {
      this._cleanupPendingMedia();
    }

    const errorMsg = error.message || "Ошибка загрузки медиа";
    console.warn(`VideoWidget media skipped: ${errorMsg}`);

    if (this._retryCount >= this._maxRetries) {
      this._errorTimeout = setTimeout(() => {
        if (!this._isDestroyed) {
          this._nextMedia();
        }
      }, 3000);
    } else {
      this._errorTimeout = setTimeout(() => {
        if (!this._isDestroyed) {
          this._loadCurrentMedia();
        }
      }, 3000);
    }
  }

  // Переход к следующему медиа
  _nextMedia() {
    if (this._isDestroyed || this._multiplexedItems.length === 0) return;

    // Очищаем таймауты
    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
      this._errorTimeout = null;
    }

    if (this._slideShowTimer) {
      clearTimeout(this._slideShowTimer);
      this._slideShowTimer = null;
    }

    if (this._videoPlayTimer) {
      clearTimeout(this._videoPlayTimer);
      this._videoPlayTimer = null;
    }

    // Очищаем предупреждение о соотношении сторон
    this._clearAspectRatioWarning();

    this._currentMultiplexedIndex++;

    if (this._currentMultiplexedIndex >= this._multiplexedItems.length) {
      if (this._playlistLoop) {
        this._currentMultiplexedIndex = 0;
      } else {
        this._currentMultiplexedIndex = this._multiplexedItems.length - 1;
        return;
      }
    }

    this._retryCount = 0;
    this._loadCurrentMedia();
  }

  _nextMediaWithDelay(delay = 3000) {
    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
    }

    this._errorTimeout = setTimeout(() => {
      if (!this._isDestroyed) {
        this._nextMedia();
      }
    }, delay);
  }

  _showLoading() {
    if (this._isDestroyed) return;
    this._hideLoading();
  }

  _hideLoading() {
    if (this.loadingIndicator) {
      this.mediaContainer.removeChild(this.loadingIndicator);
      this.loadingIndicator.destroy();
      this.loadingIndicator = null;
    }
  }

  _prepareSeamlessSwitch() {
    if (this._isDestroyed) return;

    this._hideLoading();
    this._clearAspectRatioWarning();

    if (this._slideShowTimer) {
      clearTimeout(this._slideShowTimer);
      this._slideShowTimer = null;
    }
    if (this._videoPlayTimer) {
      clearTimeout(this._videoPlayTimer);
      this._videoPlayTimer = null;
    }

    const previous = {
      videoElement: this.videoElement,
      videoTexture: this.videoTexture,
      videoSprite: this.videoSprite,
      imageTexture: this.imageTexture,
      imageSprite: this.imageSprite,
      videoEventHandlers: this._videoEventHandlers,
    };
    const hasCurrentMedia =
      previous.videoElement ||
      previous.videoSprite ||
      previous.imageSprite ||
      previous.videoTexture ||
      previous.imageTexture;

    if (previous.videoElement && previous.videoEventHandlers) {
      Object.entries(previous.videoEventHandlers).forEach(
        ([event, handler]) => {
          previous.videoElement.removeEventListener(event, handler);
        },
      );
    }

    if (hasCurrentMedia) {
      this._cleanupPreviousMedia();
      this._previousMedia = previous;
    }
    this.videoElement = null;
    this.videoTexture = null;
    this.videoSprite = null;
    this.imageTexture = null;
    this.imageSprite = null;
    this._videoEventHandlers = null;
    this.isPlaying = false;
    this._stopTextureUpdate();
  }

  _cleanupPreviousMedia() {
    const previous = this._previousMedia;
    if (!previous) return;
    if (previous.videoSprite?.parent)
      previous.videoSprite.parent.removeChild(previous.videoSprite);
    if (previous.imageSprite?.parent)
      previous.imageSprite.parent.removeChild(previous.imageSprite);
    previous.videoSprite?.destroy?.();
    previous.imageSprite?.destroy?.();
    previous.videoTexture?.destroy?.();
    previous.imageTexture?.destroy?.();
    if (previous.videoElement) {
      previous.videoElement.pause();
      previous.videoElement.removeAttribute("src");
      previous.videoElement.load();
    }
    this._previousMedia = null;
  }

  _cleanupPendingMedia() {
    if (this.videoSprite?.parent)
      this.videoSprite.parent.removeChild(this.videoSprite);
    if (this.imageSprite?.parent)
      this.imageSprite.parent.removeChild(this.imageSprite);
    this.videoSprite?.destroy?.();
    this.imageSprite?.destroy?.();
    this.videoTexture?.destroy?.();
    this.imageTexture?.destroy?.();
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.removeAttribute("src");
      this.videoElement.load();
    }
    this.videoElement = null;
    this.videoTexture = null;
    this.videoSprite = null;
    this.imageTexture = null;
    this.imageSprite = null;
    this._videoEventHandlers = null;
  }

  // Очистка placeholder при ресайзе
  _clearPlaceholder() {
    if (this.placeholderContainer) {
      if (this.placeholderContainer.parent) {
        this.mediaContainer.removeChild(this.placeholderContainer);
      }
      this.placeholderContainer.destroy();
      this.placeholderContainer = null;
    }
  }

  _createPlaceholder() {
    if (this._isDestroyed) return;

    // Очищаем предыдущий placeholder
    this._clearPlaceholder();

    this.placeholderContainer = new Container();

    const placeholder = new Graphics();
    placeholder.rect(0, 0, this._width, this._height);
    placeholder.fill({ color: 0x333333, alpha: 0.7 });
    this.placeholderContainer.addChild(placeholder);

    const centerX = this._width / 2;
    const centerY = this._height / 2;
    const iconSize = Math.min(this._width, this._height) * 0.2;

    const icon = new Graphics();
    icon.rect(
      centerX - iconSize,
      centerY - iconSize,
      iconSize * 2,
      iconSize * 1.5,
    );
    icon.fill({ color: 0x444444, alpha: 1 });
    this.placeholderContainer.addChild(icon);

    const playIcon = new Graphics();
    playIcon.moveTo(centerX - iconSize / 3, centerY - iconSize / 3);
    playIcon.lineTo(centerX - iconSize / 3, centerY + iconSize / 3);
    playIcon.lineTo(centerX + iconSize / 3, centerY);
    playIcon.closePath();
    playIcon.fill({ color: 0xffffff, alpha: 0.8 });
    this.placeholderContainer.addChild(playIcon);

    const text = new Text("Медиа плеер", {
      fontFamily: "Arial",
      fontSize: Math.min(14, this._width * 0.035),
      fill: 0xffffff,
    });
    text.x = this._width / 2 - text.width / 2;
    text.y = centerY + iconSize;
    this.placeholderContainer.addChild(text);

    if (this._panelId) {
      const idText = new Text(`ID: ${this._panelId}`, {
        fontFamily: "Arial",
        fontSize: Math.min(12, this._width * 0.03),
        fill: 0xcccccc,
      });
      idText.x = this._width / 2 - idText.width / 2;
      idText.y = centerY + iconSize + 20;
      this.placeholderContainer.addChild(idText);
    }

    const playerText = new Text(`Проигрыватель: ${this._playerNumber}`, {
      fontFamily: "Arial",
      fontSize: Math.min(12, this._width * 0.03),
      fill: 0xcccccc,
    });
    playerText.x = this._width / 2 - playerText.width / 2;
    playerText.y = centerY + iconSize + 40;
    this.placeholderContainer.addChild(playerText);

    this.mediaContainer.addChild(this.placeholderContainer);
  }

  // Обновление placeholder при изменении размера
  _updatePlaceholder() {
    if (!this.placeholderContainer) return;

    // Очищаем и создаем заново с новыми размерами
    this._clearPlaceholder();
    this._createPlaceholder();
  }

  _startTextureUpdate() {
    this._stopTextureUpdate();

    const updateFrame = () => {
      if (
        !this._isDestroyed &&
        this.videoTexture &&
        this.videoElement &&
        !this.videoElement.paused &&
        !this.videoElement.ended
      ) {
        this.videoTexture.update();
        this.animationFrameId = requestAnimationFrame(updateFrame);
      } else {
        this.animationFrameId = null;
      }
    };

    this.animationFrameId = requestAnimationFrame(updateFrame);
  }

  _stopTextureUpdate() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  _cleanupMedia() {
    if (this._isDestroyed) return;

    this.pause();
    this._stopTextureUpdate();

    if (this._slideShowTimer) {
      clearTimeout(this._slideShowTimer);
      this._slideShowTimer = null;
    }

    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
      this._errorTimeout = null;
    }

    if (this._videoPlayTimer) {
      clearTimeout(this._videoPlayTimer);
      this._videoPlayTimer = null;
    }

    // Очищаем предупреждение о соотношении сторон
    this._clearAspectRatioWarning();

    if (this.videoElement && this._videoEventHandlers) {
      Object.entries(this._videoEventHandlers).forEach(([event, handler]) => {
        this.videoElement.removeEventListener(event, handler);
      });
      this._videoEventHandlers = null;
    }

    if (this.videoSprite) {
      this.mediaContainer.removeChild(this.videoSprite);
      this.videoSprite.destroy();
      this.videoSprite = null;
    }

    if (this.videoTexture) {
      this.videoTexture.destroy();
      this.videoTexture = null;
    }

    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = "";
      this.videoElement.load();
      this.videoElement = null;
    }

    if (this.imageSprite) {
      this.mediaContainer.removeChild(this.imageSprite);
      this.imageSprite.destroy();
      this.imageSprite = null;
    }

    if (this.imageTexture) {
      this.imageTexture.destroy();
      this.imageTexture = null;
    }

    // Очищаем placeholder
    this._clearPlaceholder();

    this._hideLoading();
    this._cleanupPreviousMedia();

    this.isPlaying = false;
    this._hasError = false;
    this._videoPlayDuration = null;
    this._currentAspectRatio = null;
  }

  _showError(message) {
    if (this._isDestroyed) return;

    this._hideLoading();

    const errorContainer = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, this._width, this._height);
    bg.fill({ color: 0x000000, alpha: 0.8 });
    errorContainer.addChild(bg);

    const errorText = new Text(message, {
      fontFamily: "Arial",
      fontSize: Math.min(14, this._width * 0.035),
      fill: 0xff0000,
      align: "center",
      wordWrap: true,
      wordWrapWidth: this._width - 40,
    });
    errorText.x = 20;
    errorText.y = this._height / 2 - errorText.height / 2;
    errorContainer.addChild(errorText);

    this.mediaContainer.addChild(errorContainer);

    setTimeout(() => {
      if (!this._isDestroyed && errorContainer.parent) {
        errorContainer.parent.removeChild(errorContainer);
        errorContainer.destroy();
      }
    }, 5000);
  }

  _showMessage(message) {
    if (this._isDestroyed) return;

    const messageContainer = new Container();

    const bg = new Graphics();
    bg.rect(0, 0, this._width, this._height);
    bg.fill({ color: 0x000000, alpha: 0.6 });
    messageContainer.addChild(bg);

    const messageText = new Text(message, {
      fontFamily: "Arial",
      fontSize: Math.min(16, this._width * 0.04),
      fill: 0xffffff,
      align: "center",
    });
    messageText.x = this._width / 2 - messageText.width / 2;
    messageText.y = this._height / 2 - messageText.height / 2;
    messageContainer.addChild(messageText);

    this.mediaContainer.addChild(messageContainer);

    setTimeout(() => {
      if (!this._isDestroyed && messageContainer.parent) {
        messageContainer.parent.removeChild(messageContainer);
        messageContainer.destroy();
      }
    }, 2000);
  }

  // === ПУБЛИЧНЫЕ МЕТОДЫ ===

  play() {
    this._tryPlayVideo();
  }

  pause() {
    if (!this._isDestroyed && this.videoElement && this.isPlaying) {
      this.videoElement.pause();
      this.isPlaying = false;
      this._stopTextureUpdate();
      this._updatePreviewControls();
    }
  }

  togglePlayback() {
    if (this.videoElement && this.isPlaying && !this.videoElement.paused) {
      this.pause();
    } else {
      this.play();
    }
  }

  toggleMuted() {
    this._muted = !this._muted;
    if (this.videoElement) {
      this.videoElement.muted = this._muted;
      if (this._muted) {
        this.videoElement.setAttribute("muted", "muted");
      } else {
        this.videoElement.removeAttribute("muted");
        if (this.videoElement.paused) this.play();
      }
    }
    this._updatePreviewControls();
  }

  reload() {
    if (this._isDestroyed) return;

    this._cleanupMedia();
    this._currentMultiplexedIndex = 0;
    this._retryCount = 0;
    if (!this._panelId) {
      this._createPlaceholder();
      return;
    }
    this._loadMediaFromApi();
  }

  // Установка номера проигрывателя
  setPlayerNumber(number) {
    const normalized = Number(number);
    this._playerNumber =
      Number.isFinite(normalized) && normalized > 0 ? normalized : 1;

    // Если виджет уже загружен, перезагружаем
    if (this._playlist && this._playlist.length > 0) {
      this.reload();
    }
  }

  select() {
    super.select();
    this.previewControls.visible = this._editorPreviewControls;

    // Уведомляем о выборе ВСЕХ видеовиджетов (не только этого)
    this.notifySelectionChanged();

    return this;
  }

  notifySelectionChanged() {
    // Если есть глобальный обработчик, вызываем его с текущим состоянием
    if (window.onVideoWidgetSelectionChanged) {
      window.onVideoWidgetSelectionChanged();
    }
  }

  // Метод для снятия выделения
  deselect() {
    super.deselect();
    this.previewControls.visible = false;

    // Уведомляем об изменении выделения
    this.notifySelectionChanged();

    return this;
  }

  // Получение номера проигрывателя
  getPlayerNumber() {
    return this._playerNumber;
  }

  getSceneData() {
    return {
      playerNumber: this._playerNumber,
      player_number: this._playerNumber,
      imageDisplayTime: this._imageDisplayTime,
      loop: this._playlistLoop !== undefined ? this._playlistLoop : true,
      muted: this._muted !== undefined ? this._muted : true,
      panelId: this._panelId,
    };
  }

  setPanelId(panelId) {
    if (this._isDestroyed) return;

    this._panelId = panelId || null;
    this.reload();
  }

  // Добавьте эти методы в класс VideoWidget

  /**
   * Экспорт состояния виджета для сохранения
   */
  exportScene() {
    return {
      // Базовые свойства DraggableWidget
      x: this.x,
      y: this.y,
      width: this._width,
      height: this._height,

      // Специфические для видео
      playerNumber: this._playerNumber,
      imageDisplayTime: this._imageDisplayTime,

      // Настройки воспроизведения
      muted: this._muted !== undefined ? this._muted : true,
      loop: this._playlistLoop !== undefined ? this._playlistLoop : true,

      // Внешний вид
      bgColor: this._backgroundColor,
      bgAlpha: this._backgroundAlpha,
      cornerRadius: this._cornerRadius,
      backgroundGradient: this._backgroundGradient,

      // Тип виджета для идентификации
      widgetType: "VideoWidget",

      // Текущая позиция в плейлисте (необязательно, но полезно)
      currentIndex: this._currentMultiplexedIndex || 0,
    };
  }

  /**
   * Импорт состояния виджета
   */
  importScene(data) {
    console.log("📥 VideoWidget.importScene", data);

    // Позиция и размер
    if (data.x !== undefined) this.x = data.x;
    if (data.y !== undefined) this.y = data.y;
    if (data.width) {
      this._width = Math.max(20, Math.round(data.width / 10) * 10);
    }
    if (data.height) {
      this._height = Math.max(20, Math.round(data.height / 10) * 10);
    }

    // Настройки видео
    if (data.playerNumber !== undefined) {
      this.setPlayerNumber(data.playerNumber);
    } else if (data.player_number !== undefined) {
      this.setPlayerNumber(data.player_number);
    }

    if (data.panelId !== undefined && !this._panelId) {
      this._panelId = data.panelId || null;
    }

    if (data.imageDisplayTime !== undefined) {
      this._imageDisplayTime = data.imageDisplayTime;
    }

    // Настройки воспроизведения
    if (data.muted !== undefined) this._muted = data.muted;
    if (data.loop !== undefined) this._playlistLoop = data.loop;

    // Внешний вид
    if (data.bgColor !== undefined) this.setBackgroundColor(data.bgColor);
    if (data.bgAlpha !== undefined) this.setBackgroundAlpha(data.bgAlpha);
    if (data.cornerRadius !== undefined)
      this.setCornerRadius(data.cornerRadius);
    if (data.backgroundGradient !== undefined)
      this.setBackgroundGradient(data.backgroundGradient);

    // Обновляем фон
    this._redrawBackground();

    // Очищаем текущие медиа
    this._cleanupMedia();

    // Если есть panelId, загружаем медиа
    if (this._panelId) {
      console.log(
        `🔄 Загружаем медиа для панели ${this._panelId}, проигрыватель ${this._playerNumber}`,
      );

      // Сбрасываем индексы
      this._currentMultiplexedIndex = 0;
      this._retryCount = 0;

      // Загружаем с небольшой задержкой
      setTimeout(() => {
        if (!this._isDestroyed) {
          this._loadMediaFromApi();
        }
      }, 100);
    } else {
      // Создаем плейсхолдер если нет panelId
      this._createPlaceholder();
    }

    // Обновляем выделение если нужно
    if (this.updateSelection) {
      this.updateSelection();
    }
  }

  /**
   * Получить уникальный идентификатор виджета
   */
  getId() {
    return this._id || this.id || `video_${Date.now()}_${Math.random()}`;
  }

  /**
   * Проверка, загружен ли виджет
   */
  isLoaded() {
    return (
      !this._isDestroyed &&
      (this._playlist.length > 0 || this.placeholderContainer)
    );
  }

  setImageDisplayTime(seconds) {
    if (this._isDestroyed) return;

    this._imageDisplayTime = Math.max(1, seconds);

    this._playlist.forEach((item) => {
      if (item.type === "image" && !item.time_view) {
        item.time_view = this._imageDisplayTime;
      }
    });

    this._createMultiplexedPlaylist();

    const currentMedia = this._multiplexedItems[this._currentMultiplexedIndex];
    if (currentMedia && currentMedia.type === "image" && this.imageSprite) {
      this._startSlideShowTimer(this._imageDisplayTime);
    }
  }

  setMediaIndex(index) {
    if (
      this._isDestroyed ||
      index < 0 ||
      index >= this._multiplexedItems.length
    )
      return;

    this._currentMultiplexedIndex = index;
    this._retryCount = 0;
    this._loadCurrentMedia();
  }

  onResize(width, height) {
    this.handleDiscreteResize(width, height);
  }

  _redrawBackground() {
    if (this._isDestroyed || !this.bg) return;

    this.bg.clear();
    this.bg.roundRect(0, 0, this._width, this._height, this._cornerRadius);
    const gradient = createWidgetFillGradient(
      this._backgroundGradient,
      this._width,
      this._height,
    );
    if (gradient) {
      this.bg.fill(gradient);
      this.bg.alpha = this._backgroundAlpha;
    } else {
      this.bg.alpha = 1;
      this.bg.fill({
        color: this._backgroundColor,
        alpha: this._backgroundAlpha,
      });
    }
    this._redrawMediaMask();
  }

  setBackgroundColor(color) {
    if (this._isDestroyed) return;
    this._backgroundColor = color;
    this._backgroundGradient = null;
    this._redrawBackground();
  }

  setBackgroundGradient(gradient) {
    if (this._isDestroyed) return;
    this._backgroundGradient = normalizeWidgetGradient(gradient);
    this._redrawBackground();
  }

  setBackgroundAlpha(alpha) {
    if (this._isDestroyed) return;
    this._backgroundAlpha = alpha;
    this._redrawBackground();
  }

  setCornerRadius(radius) {
    if (this._isDestroyed) return;
    this._cornerRadius = radius;
    this._redrawBackground();
    this._redrawMediaMask();
  }

  setSize(width, height) {
    if (this._isDestroyed) return;

    const step = 10;
    let newWidth = Math.round(Math.max(20, width) / step) * step;
    let newHeight = Math.round(Math.max(20, height) / step) * step;

    this._width = newWidth;
    this._height = newHeight;

    // Проверяем и корректируем позицию
    this._clampToBounds();

    this.updateSelection();
    this._updateMediaSize();
    this._redrawBackground();

    if (this.placeholderContainer) {
      this._updatePlaceholder();
    }
  }

  getPlaylistInfo() {
    const currentMedia =
      this._multiplexedItems[this._currentMultiplexedIndex] || {};
    const originalMedia = this._playlist.find(
      (item) => item.url === currentMedia.url,
    );

    return {
      currentIndex: this._currentMultiplexedIndex,
      currentRepeat: currentMedia.repeatIndex || 1,
      totalRepeats: currentMedia.totalRepeats || 1,
      totalMedia: this._multiplexedItems.length,
      playlist: this._playlist,
      multiplexedPlaylist: this._multiplexedItems,
      imageDisplayTime: this._imageDisplayTime,
      panelId: this._panelId,
      playerNumber: this._playerNumber,
      isPlaying: this.isPlaying,
      hasError: this._hasError,
      currentType: currentMedia.type || "none",
      currentUrl: currentMedia.url || "",
      currentPath: currentMedia.cleanPath || "",
      currentDuration: currentMedia.displayTime || null,
      currentMultiplexer: currentMedia.multiplexer || 1,
      currentPlayerNumber: originalMedia?.player_number || null,
      isParametrized: currentMedia.isParametrized || false,
      currentAspectRatio: this._currentAspectRatio,
      currentResolution:
        currentMedia.resolution ||
        (currentMedia.width && currentMedia.height
          ? `${currentMedia.width}×${currentMedia.height}`
          : ""),
      widgetWidth: this._width,
      widgetHeight: this._height,
    };
  }

  // Получение статистики
  getStatistics() {
    const totalFiles = this._playlist.length;
    console.log("playlist", this._playlist);
    const videos = this._playlist.filter((m) => m.type === "video");
    const images = this._playlist.filter((m) => m.type === "image");

    const filteredFiles = this._playlist.filter(
      (item) => Number(item.player_number) === Number(this._playerNumber),
    );

    return {
      totalFiles,
      totalVideos: videos.length,
      totalImages: images.length,
      filesForCurrentPlayer: filteredFiles.length,
      multiplexedItems: this._multiplexedItems.length,
      playerNumber: this._playerNumber,
      parametrizedFiles: this._playlist.filter((m) => m.isParametrized).length,
      currentAspectRatio: this._currentAspectRatio,
      widgetWidth: this._width,
      widgetHeight: this._height,
      gridSnap: 10,
    };
  }

  // Получение информации о текущем соотношении сторон
  getAspectRatioInfo() {
    if (!this._currentAspectRatio) {
      return {
        hasAspectRatio: false,
        message: "Соотношение сторон не определено",
      };
    }

    const closestStandard = this._findClosestStandardAspectRatio(
      this._currentAspectRatio,
    );
    const deviation = Math.abs(
      (this._currentAspectRatio - closestStandard.ratio) /
        closestStandard.ratio,
    );

    return {
      hasAspectRatio: true,
      aspectRatio: this._currentAspectRatio,
      closestStandard: closestStandard.name,
      standardRatio: closestStandard.ratio,
      deviation: deviation,
      isStandard: deviation <= this._aspectRatioTolerance,
      warning:
        deviation > this._aspectRatioTolerance
          ? `НЕСТАНДАРТНОЕ СООТНОШЕНИЕ СТОРОН! Отклонение: ${(deviation * 100).toFixed(1)}% от ${closestStandard.name}`
          : "Соотношение сторон корректно",
    };
  }

  // Принудительное скрытие предупреждения о соотношении сторон
  hideAspectRatioWarning() {
    this._clearAspectRatioWarning();
  }

  destroy(options) {
    this._isDestroyed = true;

    if (this._errorTimeout) {
      clearTimeout(this._errorTimeout);
      this._errorTimeout = null;
    }

    if (this._slideShowTimer) {
      clearTimeout(this._slideShowTimer);
      this._slideShowTimer = null;
    }

    if (this._videoPlayTimer) {
      clearTimeout(this._videoPlayTimer);
      this._videoPlayTimer = null;
    }

    // Очищаем предупреждение о соотношении сторон
    this._clearAspectRatioWarning();

    // Очищаем placeholder
    this._clearPlaceholder();

    this._cleanupMedia();
    this._releaseMediaCache();
    this._playlist = [];
    this._multiplexedItems = [];

    super.destroy(options);
  }
}
