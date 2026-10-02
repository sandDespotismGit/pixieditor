import {
  Container,
  Sprite,
  Texture,
  Graphics,
  FillGradient,
  Text,
  TextStyle,
} from "pixi.js";
import * as PIXI from "pixi.js";

import DraggableWidget from "../widgetsGrid/draggable_widget";
import AnalogClockWidget from "../widgetsGrid/widgets/analog_clock";
import DigitalClockWidget from "../widgetsGrid/widgets/digital_clock";
import CalendarWidget from "../widgetsGrid/widgets/calendar";
import WeatherWidget from "../widgetsGrid/widgets/weather";
import TrafficWidget from "../widgetsGrid/widgets/traffic";
import NewsWidget from "../widgetsGrid/widgets/news";
import RatesWidget from "../widgetsGrid/widgets/rates";
import MetalsWidget from "../widgetsGrid/widgets/metals";
import CompanyWidget from "../widgetsGrid/widgets/about_company";
import SimpleRectWidget from "../widgetsGrid/widgets/video";
import VideoWidget from "../widgetsGrid/widgets/video";
import TextWidget from "../widgetsGrid/widgets/text_widget";
import ShapeWidget from "../widgetsGrid/widgets/shape_widget";
import DrawingWidget from "../widgetsGrid/widgets/drawing_widget";
import AudioPlayerWidget from "../widgetsGrid/widgets/audio_player_widget";
import DirectionFloorWidget from "../widgetsGrid/widgets/direction";

export default class EditorFrame {
  constructor(app) {
    this.app = app;

    // Сохраняем текущую позицию mainContainer для восстановления после изменения размера
    this.savedPosition = { x: null, y: null };

    // Основной контейнер для всего редактора
    this.mainContainer = new Container();
    this.app.stage.addChild(this.mainContainer);

    // Внешнее поле
    this.outerFrame = new Container();
    this.mainContainer.addChild(this.outerFrame);

    // Внутреннее рабочее поле
    this.innerContainer = new Container();
    this.mainContainer.addChild(this.innerContainer);

    this.container = this.innerContainer; // для обратной совместимости

    this._width = 1200;
    this._height = 800;

    // Параметры внешнего поля
    this.outerFrameWidth = this._width + 400;
    this.outerFrameHeight = this._height + 400;
    this.outerFrameColor = "rgba(21, 27, 41, 0.9)";
    this.outerFrameAlpha = 1;

    // Центрируем внутреннее поле
    this.innerContainer.x = 200;
    this.innerContainer.y = 200;

    // Анимация градиента - упрощенная версия
    this.gradientAnimation = {
      enabled: false,
      type: "move",
      speed: 1,
      direction: "right",
      time: 0,
    };
    this.animationFrameId = null;
    this.currentGradientConfig = null;

    // Параметры сетки
    this.grid = null;
    this.gridVisible = true;
    this.gridSize = 10;
    this.gridColor = "rgb(83, 83, 83)";
    this.gridAlpha = 1;

    // Добавьте это свойство:
    this.currentBackgroundType = "color"; // 'color', 'texture', 'gradient', 'gradient-texture', 'video', 'image'
    this.nightMode = {
      enabled: false,
      start: "23:00",
      end: "07:00",
      timezone: "Europe/Moscow",
    };
    this.themeSchedule = [];

    // Масштабирование
    this.scale = 1;
    this.minScale = 0.1;
    this.maxScale = 5;

    // Перетаскивание
    this.dragEnabled = true;
    this.selected_widget = null;

    // Параметры свечения с плавной анимацией
    this.glowEnabled = true;
    this.glowIntensity = 1; // Увеличил интенсивность для лучшей видимости
    this.glowColor = 0x4a90e2;
    this.glowSize = 10; // Увеличил размер для лучшего размытия
    this.glowEffect = null;
    this.glowAnimationId = null;
    this.glowTargetAlpha = 0;
    this.glowCurrentAlpha = 0;
    this.glowAnimationSpeed = 0.05; // Скорость плавного появления/исчезновения

    this.isPreview = false;

    this.setupKeyboardControls();
    this.setupZoom();
    this.setupDrag();

    this.createOuterFrame();
    this.createBackground();
    this.setupBackgroundInteraction();
    this.createGrid();
    this.setupGlobalMiddleClick();

    this.centerOnScreen();

    this.getAllWidgets();

    this.setupGlobalDrag();
    this.setupResizeHandler();
  }

  // ==== МЕТОДЫ ДЛЯ СВЕЧЕНИЯ С ПЛАВНОЙ АНИМАЦИЕЙ ====

  createGlowEffect() {
    // Удаляем старое свечение, если оно есть
    if (this.glowEffect) {
      this.stopGlowAnimation();
      this.outerFrame.removeChild(this.glowEffect);
      this.glowEffect.destroy();
    }

    // Создаем контейнер для свечения с фильтром размытия
    this.glowContainer = new Container();

    // Создаем несколько слоев для более мягкого свечения
    const layers = [];

    // Внешний слой (самый размытый)
    const outerLayer = new Graphics();
    const outerSize = this.glowSize * 1.5;
    for (let i = outerSize; i > 0; i -= 8) {
      const alpha = 0.3 * (1 - i / outerSize);
      outerLayer.rect(
        -i,
        -i,
        this.outerFrameWidth + i * 2,
        this.outerFrameHeight + i * 2,
      );
      outerLayer.fill({ color: this.glowColor, alpha });
    }

    // Средний слой
    const middleLayer = new Graphics();
    for (let i = this.glowSize; i > 0; i -= 4) {
      const alpha = 0.5 * (1 - i / this.glowSize);
      middleLayer.rect(
        -i,
        -i,
        this.outerFrameWidth + i * 2,
        this.outerFrameHeight + i * 2,
      );
      middleLayer.fill({ color: this.glowColor, alpha });
    }

    // Внутренний слой (ближе к рамке)
    const innerLayer = new Graphics();
    for (let i = this.glowSize / 2; i > 0; i -= 2) {
      const alpha = 0.8 * (1 - i / (this.glowSize / 2));
      innerLayer.rect(
        -i,
        -i,
        this.outerFrameWidth + i * 2,
        this.outerFrameHeight + i * 2,
      );
      innerLayer.fill({ color: this.glowColor, alpha });
    }

    // Добавляем слои в контейнер
    this.glowContainer.addChild(outerLayer);
    this.glowContainer.addChild(middleLayer);
    this.glowContainer.addChild(innerLayer);

    // Добавляем фильтр размытия для мягкости
    const blurFilter = new PIXI.BlurFilter(10, 10);
    this.glowContainer.filters = [blurFilter];

    // Добавляем свечение на задний план
    this.glowContainer.zIndex = -1;
    this.glowContainer.alpha = 0; // Начинаем с прозрачности 0
    this.outerFrame.addChildAt(this.glowContainer, 0);

    this.glowEffect = this.glowContainer;
  }

  startGlowAnimation(targetAlpha) {
    this.glowTargetAlpha = targetAlpha;

    if (this.glowAnimationId) return;

    const animate = () => {
      // Плавно изменяем текущую альфу к целевой
      const diff = this.glowTargetAlpha - this.glowCurrentAlpha;

      if (Math.abs(diff) < 0.001) {
        // Достигли цели
        this.glowCurrentAlpha = this.glowTargetAlpha;
        if (this.glowEffect) {
          this.glowEffect.alpha = this.glowCurrentAlpha;
        }
        this.stopGlowAnimation();
        return;
      }

      // Плавное изменение
      this.glowCurrentAlpha += diff * this.glowAnimationSpeed;

      if (this.glowEffect) {
        this.glowEffect.alpha = this.glowCurrentAlpha;
      }

      this.glowAnimationId = requestAnimationFrame(animate);
    };

    this.glowAnimationId = requestAnimationFrame(animate);
  }

  stopGlowAnimation() {
    if (this.glowAnimationId) {
      cancelAnimationFrame(this.glowAnimationId);
      this.glowAnimationId = null;
    }
  }

  showGlow() {
    if (this.glowEnabled && this.glowEffect) {
      this.startGlowAnimation(this.glowIntensity);
    }
  }

  hideGlow() {
    if (this.glowEffect) {
      this.startGlowAnimation(0);
    }
  }

  configureGlow(options = {}) {
    if (options.enabled !== undefined) this.glowEnabled = options.enabled;
    if (options.intensity !== undefined) this.glowIntensity = options.intensity;
    if (options.color !== undefined) this.glowColor = options.color;
    if (options.size !== undefined) this.glowSize = options.size;
    if (options.speed !== undefined) this.glowAnimationSpeed = options.speed;

    // Пересоздаем свечение с новыми параметрами
    this.createGlowEffect();

    // Сбрасываем анимацию
    this.glowCurrentAlpha = 0;
    this.glowTargetAlpha = 0;

    console.log("✨ Параметры свечения обновлены:", {
      intensity: this.glowIntensity,
      color: this.glowColor.toString(16),
      size: this.glowSize,
      speed: this.glowAnimationSpeed,
    });
  }

  toggleGlow(enabled) {
    this.glowEnabled = enabled !== undefined ? enabled : !this.glowEnabled;
    if (!this.glowEnabled) {
      this.hideGlow();
    }
    console.log(`✨ Свечение ${this.glowEnabled ? "включено" : "выключено"}`);
  }

  setupGlowInteractions() {
    // Убираем старые обработчики, если они были
    this.outerFrame.off("mouseenter");
    this.outerFrame.off("mouseleave");

    // Добавляем новые обработчики с плавной анимацией
    this.outerFrame.on("mouseenter", () => {
      this.showGlow();
    });

    this.outerFrame.on("mouseleave", () => {
      this.hideGlow();
    });
  }

  setupGlobalDrag() {
    // Делаем stage интерактивным
    this.app.stage.interactive = true;
    this.app.stage.eventMode = "static";

    // Обработчик начала перетаскивания
    this.app.stage.on("pointerdown", (event) => {
      // Получаем цель клика
      let target = event.target;

      // Проверяем, не кликнули ли мы по виджету
      let isWidget = false;
      let current = target;
      while (current) {
        if (current instanceof DraggableWidget) {
          isWidget = true;
          break;
        }
        current = current.parent;
      }

      // Проверяем, не кликнули ли по элементам редактора
      const isEditorElement =
        target === this.mainContainer ||
        target === this.outerFrame ||
        target === this.innerContainer ||
        this.outerFrame.children.includes(target) ||
        this.innerContainer.children.includes(target);

      // Клик по пустой области (не по виджету и не по редактору)
      if (!isWidget && !isEditorElement) {
        this.startGlobalDrag(event);
      }
    });

    // Обработчик движения
    this.app.stage.on("pointermove", (event) => {
      if (this.isGlobalDragging) {
        this.onGlobalDragMove(event);
      }
    });

    // Обработчики окончания
    this.app.stage.on("pointerup", () => {
      this.endGlobalDrag();
    });

    this.app.stage.on("pointerupoutside", () => {
      this.endGlobalDrag();
    });
  }

  startGlobalDrag(event) {
    if (!this.dragEnabled) return;

    this.isGlobalDragging = true;
    this.globalDragStart = {
      x: this.mainContainer.x,
      y: this.mainContainer.y,
      pointer: { x: event.global.x, y: event.global.y },
    };

    // Меняем курсор
    this.app.stage.cursor = "grabbing";
    document.body.style.cursor = "grabbing";

    event.stopPropagation();
  }

  onGlobalDragMove(event) {
    if (!this.isGlobalDragging || !this.dragEnabled) return;

    const dx = event.global.x - this.globalDragStart.pointer.x;
    const dy = event.global.y - this.globalDragStart.pointer.y;

    this.mainContainer.x = this.globalDragStart.x + dx;
    this.mainContainer.y = this.globalDragStart.y + dy;

    // Сохраняем позицию
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };
  }

  endGlobalDrag() {
    this.isGlobalDragging = false;
    this.globalDragStart = null;
    this.app.stage.cursor = "default";
    document.body.style.cursor = "";
  }

  setupResizeHandler() {
    window.addEventListener("resize", () => {
      // При изменении размера окна ничего особого не делаем
      // так как мы больше не используем оверлей
    });
  }

  destroy() {
    // Удаляем обработчики событий
    this.app.stage.off("pointerdown");
    this.app.stage.off("pointermove");
    this.app.stage.off("pointerup");
    this.app.stage.off("pointerupoutside");

    // Очищаем другие ресурсы
    if (this.mainContainer) {
      this.mainContainer.destroy({ children: true });
    }
  }

  // ==== НОВЫЙ МЕТОД ДЛЯ УПРАВЛЕНИЯ ПРОЗРАЧНОСТЬЮ ====
  setOuterFrameAlpha(alpha) {
    this.outerFrameAlpha = alpha;
    this.createOuterFrame(); // Пересоздаем внешнюю рамку с новой прозрачностью
    console.log(`✅ Прозрачность внешней рамки установлена: ${alpha}`);
  }

  // ==== СОЗДАНИЕ ВНЕШНЕГО ПОЛЯ ====

  setPreview(new_preview) {
    this.isPreview = new_preview;
    // Обновляем метки при изменении режима
    this.updateTutorialLabels();
  }

  updateTutorialLabels() {
    // Удаляем существующие метки
    const existingLabels = this.outerFrame.children.filter(
      (child) => child instanceof Text,
    );
    existingLabels.forEach((label) => this.outerFrame.removeChild(label));

    // Добавляем метки заново с актуальным состоянием isPreview
    this.addTutorialLabels();
  }

  addTutorialLabels() {
    // Сначала удаляем старые метки, если они есть
    const existingLabels = this.outerFrame.children.filter(
      (child) => child instanceof Text,
    );
    existingLabels.forEach((label) => this.outerFrame.removeChild(label));

    const style = new TextStyle({
      fill: 0x666666,
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "bold",
    });

    const topLabel = new Text(
      this.isPreview ? "" : "Рабочее поле редактора",
      style,
    );
    topLabel.x = this.outerFrameWidth / 2 - topLabel.width / 2;
    topLabel.y = 50;
    this.outerFrame.addChild(topLabel);

    const leftLabel = new Text(
      this.isPreview ? "" : "Рабочее поле редактора",
      style,
    );
    leftLabel.rotation = -Math.PI / 2;
    leftLabel.x = 50;
    leftLabel.y = this.outerFrameHeight / 2 + leftLabel.width / 2;
    this.outerFrame.addChild(leftLabel);

    const rightLabel = new Text(
      this.isPreview ? "" : "Рабочее поле редактора",
      style,
    );
    rightLabel.rotation = Math.PI / 2;
    rightLabel.x = this.outerFrameWidth - 50;
    rightLabel.y = this.outerFrameHeight / 2 - rightLabel.width / 2;
    this.outerFrame.addChild(rightLabel);
  }

  setupOuterFrameInteraction() {
    this.outerFrame.interactive = true;
    this.outerFrame.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.outerFrameWidth,
      this.outerFrameHeight,
    );

    // Обработчики только для внешнего поля (без всплытия)
    this.outerFrame
      .on("pointerdown", this.onOuterDragStart.bind(this))
      .on("pointerup", this.onOuterDragEnd.bind(this))
      .on("pointerupoutside", this.onOuterDragEnd.bind(this))
      .on("pointermove", this.onOuterDragMove.bind(this))
      .on("click", this.deselectAllWidgets.bind(this));
  }

  onOuterDragStart(event) {
    if (!this.dragEnabled) return;
    this.dragData = event.data;
    this.dragStart = {
      x: this.mainContainer.x,
      y: this.mainContainer.y,
      pointer: this.dragData.getLocalPosition(this.mainContainer.parent),
    };
    this.mainContainer.cursor = "grabbing";
  }

  onOuterDragMove(event) {
    if (!this.dragEnabled || !this.dragData) return;
    const newPosition = this.dragData.getLocalPosition(
      this.mainContainer.parent,
    );
    const dx = newPosition.x - this.dragStart.pointer.x;
    const dy = newPosition.y - this.dragStart.pointer.y;
    this.mainContainer.x = this.dragStart.x + dx;
    this.mainContainer.y = this.dragStart.y + dy;

    // Сохраняем текущую позицию при перетаскивании
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };
  }

  onOuterDragEnd() {
    this.dragData = null;
    this.dragStart = null;
    this.mainContainer.cursor = "grab";

    // Сохраняем финальную позицию
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };
  }

  // ==== СЕРИАЛИЗАЦИЯ/ИМПОРТ/ЭКСПОРТ ====
  saveGradientConfig(gradientConfig) {
    if (this.gradientBuilder && this.gradientBuilder.lastAppliedGradient) {
      // Сохраняем конфигурацию градиента
      this.savedGradientConfig = {
        ...this.gradientBuilder.lastAppliedGradient,
        appliedTime: Date.now(),
        isGradientTexture: true,
      };
      console.log(
        "✅ Конфигурация градиента сохранена:",
        this.savedGradientConfig,
      );
    }
  }

  setNightModeSettings(settings = {}) {
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
    const current = this.nightMode || {
      start: "23:00",
      end: "07:00",
    };

    this.nightMode = {
      enabled: settings.enabled === true,
      start: validTime.test(settings.start || "")
        ? settings.start
        : current.start,
      end: validTime.test(settings.end || "") ? settings.end : current.end,
      timezone: "Europe/Moscow",
    };

    return { ...this.nightMode };
  }

  getNightModeSettings() {
    return { ...this.nightMode };
  }

  setThemeSchedule(schedule = []) {
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
    const list = Array.isArray(schedule) ? schedule : [];

    this.themeSchedule = list
      .map((entry) => ({
        start: String(entry?.start || "").trim(),
        end: String(entry?.end || "").trim(),
        fabricNumber: String(
          entry?.fabricNumber || entry?.fabric_number || "",
        ).trim(),
        panelId: String(entry?.panelId || entry?.panel_id || "").trim(),
        title: String(entry?.title || entry?.name || "").trim(),
        theme: entry?.theme && typeof entry.theme === "object" ? entry.theme : null,
      }))
      .filter((entry) => validTime.test(entry.start) && validTime.test(entry.end));

    return this.getThemeSchedule();
  }

  getThemeSchedule() {
    return this.themeSchedule.map((entry) => ({ ...entry }));
  }

  getCurrentPanelFabricNumber() {
    const params = new URLSearchParams(window.location.search);
    return String(
      window.__ipanelFabricNumber ||
        window.__ipanelPanelFabricNumber ||
        params.get("fabric_number") ||
        params.get("fabric") ||
        params.get("panel_fabric") ||
        params.get("panel_id") ||
        "",
    ).trim();
  }

  ensurePanelQrWidget() {
    // QR добавляется только вручную как обычный виджет.
    return;
  }

  getWidgetSceneType(widget) {
    if (widget instanceof AudioPlayerWidget) return "AudioPlayerWidget";
    if (widget instanceof DirectionFloorWidget) return "DirectionFloorWidget";
    if (widget instanceof TextWidget) return "TextWidget";
    if (widget instanceof ShapeWidget) return "ShapeWidget";
    if (widget instanceof DrawingWidget) return "DrawingWidget";
    if (widget instanceof AnalogClockWidget) return "AnalogClockWidget";
    if (widget instanceof DigitalClockWidget) return "DigitalClockWidget";
    if (widget instanceof CalendarWidget) return "CalendarWidget";
    if (widget instanceof WeatherWidget) return "WeatherWidget";
    if (widget instanceof TrafficWidget) return "TrafficWidget";
    if (widget instanceof NewsWidget) return "NewsWidget";
    if (widget instanceof RatesWidget) return "RatesWidget";
    if (widget instanceof MetalsWidget) return "MetalsWidget";
    if (widget instanceof CompanyWidget) return "CompanyWidget";
    if (widget instanceof VideoWidget) return "VideoWidget";
    return widget.widgetType || widget.constructor.name;
  }

  exportScene(options = {}) {
    const includeSchedule = options.includeSchedule !== false;
    const widgets = this.innerContainer.children
      .filter((c) => c instanceof DraggableWidget)
      .filter((w) => !(w instanceof CompanyWidget && w.type === "qr-only" && w._autoPanelQr))
      .map((w) => ({
        type: w.content.constructor.name,
        widgetClass: w.content.constructor.name,
        x: w.x,
        y: w.y,
        size: w.getSize(),
        color: w.color,
        texture: w.content.texture?.textureCacheIds?.[0] || null,
        w: this.getWidgetSceneType(w),
        type: w.type,
        bgColor: w._backgroundColor,
        bgAlpha: w._backgroundAlpha,
        cornerRadius: w._cornerRadius,
        fontFamily: w.getFontFamily?.() || w._fontFamily || null,
        effectPreset: w.getEffectPreset?.() || w._effectPreset || "none",
        ...w.getSceneData?.(),
      }));

    const backgroundNode = this.background?.children?.[0];
    const backgroundData = {
      color: backgroundNode?.tint ?? 0x1e1e1e,
      alpha: backgroundNode?.alpha ?? 1,
      type: this.currentBackgroundType,
    };

    const builderBackground = this.gradientBuilder?.currentBackground;
    const builderType = builderBackground?.type;

    // Если фон был создан через HTMLGradientBuilder и это не простой цвет,
    // сохраняем полные данные для восстановления
    if (
      builderBackground &&
      ((this.currentBackgroundType === "gradient-texture" &&
        builderType === "gradient") ||
        (this.currentBackgroundType === "video" && builderType === "video") ||
        (this.currentBackgroundType === "image" && builderType === "image"))
    ) {
      backgroundData.constructorData = JSON.parse(
        JSON.stringify(builderBackground),
      );
      backgroundData.hasConstructorData = true;
    } else {
      // Старая логика (для обратной совместимости)
      if (
        this.currentBackgroundType === "gradient-texture" &&
        this.savedGradientConfig
      ) {
        backgroundData.hasTexture = true;
        backgroundData.hasGradient = true;
        backgroundData.texturePath = "gradient-texture";
        backgroundData.gradient = this.savedGradientConfig;
        backgroundData.gradientType = "static";
      } else if (this.currentBackgroundType === "texture") {
        backgroundData.hasTexture = true;
        backgroundData.hasGradient = false;
        backgroundData.texturePath = this.backgroundTexturePath || "texture";
      } else if (this.currentBackgroundType === "gradient") {
        backgroundData.hasTexture = false;
        backgroundData.hasGradient = true;
        backgroundData.gradient = this.backgroundGradient;
      }
    }

    console.log("🔍 Экспорт фона:", backgroundData);

    return {
      background: backgroundData,
      grid: { size: this.gridSize, visible: this.gridVisible },
      display: { width: this._width, height: this._height },
      nightMode: this.getNightModeSettings(),
      themeSchedule: includeSchedule ? this.getThemeSchedule() : [],
      theme_schedule: includeSchedule ? this.getThemeSchedule() : [],
      widgets,
    };
  }

  getSelected() {
    return this.innerContainer.children.filter(
      (elem) => elem instanceof DraggableWidget && elem.isSelected,
    );
  }

  deleteSelected() {
    this.getSelected().forEach((elem) => elem.destroy());
  }

  getAllWidgets() {
    const widgets = this.innerContainer.children
      .filter((c) => c instanceof DraggableWidget)
      .filter((w) => !(w instanceof CompanyWidget && w.type === "qr-only" && w._autoPanelQr))
      .map((w) => ({
        type: w.content.constructor.name,
        widgetClass: w.content.constructor.name,
        x: w.x,
        y: w.y,
        size: w.getSize(),
        color: w.color,
        texture: w.content.texture?.textureCacheIds?.[0] || null,
        w: this.getWidgetSceneType(w),
        type: w.type,
        bgColor: w._backgroundColor,
        bgAlpha: w._backgroundAlpha,
        cornerRadius: w._cornerRadius,
        fontFamily: w.getFontFamily?.() || w._fontFamily || null,
        ...w.getSceneData?.(),
      }));

    return widgets;
  }

  deleteAll() {
    this.innerContainer.children
      .filter((elem) => elem instanceof DraggableWidget)
      .forEach((elem) => elem.destroy());
  }

  recreateGradientTexture(gradientConfig) {
    if (!this.gradientBuilder || !gradientConfig) {
      console.error("Не удалось восстановить градиент");
      return;
    }

    try {
      // Передаем конфигурацию обратно в gradientBuilder для создания текстуры
      this.gradientBuilder.recreateGradientFromConfig(gradientConfig);
    } catch (error) {
      console.error("Ошибка восстановления градиента:", error);
      this.changeBackground({ color: 0x1e1e1e });
    }
  }

  async recreateGradientTexture(gradientConfig) {
    if (!this.gradientBuilder || !gradientConfig) {
      console.error("Не удалось восстановить градиент");
      this.changeBackground({ color: 0x1e1e1e });
      return;
    }

    try {
      // Восстанавливаем градиент через gradientBuilder
      await this.gradientBuilder.recreateGradientFromConfig(gradientConfig);
    } catch (error) {
      console.error("Ошибка восстановления градиента:", error);
      this.changeBackground({ color: 0x1e1e1e });
    }
  }

  resolveBackgroundTexturePath(texturePath, display = {}) {
    if (
      !texturePath ||
      /^(\/|https?:|data:|blob:)/.test(texturePath) ||
      texturePath.includes("/")
    ) {
      return texturePath;
    }

    const width = Number(display.width || this._width);
    const height = Number(display.height || this._height);
    const normalizedPath =
      texturePath === "2in"
        ? "spectrum_swirl-wallpaper-2560x2048.png"
        : texturePath;

    if (
      (width === 540 && height === 1920) ||
      (width === 1080 && height === 1920)
    ) {
      return `/assets/bg_static_1080_1920/${normalizedPath}`;
    }
    if (width === 1920 && height === 1080) {
      return `/assets/bg_static_1920_1080/${normalizedPath}`;
    }
    if (width === 1920 && height === 540) {
      return `/assets/bg_static_1920_540/${normalizedPath}`;
    }

    const ratio = width && height ? width / height : 1;
    if (ratio < 0.8) {
      return `/assets/bg_static_1080_1920/${normalizedPath}`;
    }
    if (ratio > 2.4) {
      return `/assets/bg_static_1920_540/${normalizedPath}`;
    }
    return `/assets/bg_static_1920_1080/${normalizedPath}`;
  }

  async importScene(data) {
    if (!data) return;
    console.log("📥 Импорт сцены:", data);
    this.setNightModeSettings(
      data.nightMode || {
        enabled: false,
        start: "23:00",
        end: "07:00",
      },
    );
    this.setThemeSchedule(data.themeSchedule || data.theme_schedule || []);

    // Размер сцены должен быть установлен до восстановления фона:
    // путь фоновой текстуры и размер спрайта зависят от ориентации темы.
    if (data.display) {
      this.resize(Number(data.display.width), Number(data.display.height));
    }

    // ФОН
    if (data.background) {
      console.log("🎨 Восстанавливаем фон:", data.background);

      // Приоритет 1: Данные от HTMLGradientBuilder
      if (
        data.background.hasConstructorData &&
        data.background.constructorData &&
        this.gradientBuilder
      ) {
        console.log("🔄 Восстанавливаем фон через gradientBuilder");
        await this.gradientBuilder.restoreBackgroundFromData(
          data.background.constructorData,
        );
      }
      // Приоритет 1.5: Новый формат конструктора без обертки constructorData
      else if (
        data.background.data &&
        ["gradient", "video", "image", "color"].includes(
          data.background.type,
        ) &&
        this.gradientBuilder
      ) {
        console.log("🔄 Восстанавливаем фон из данных конструктора");
        await this.gradientBuilder.restoreBackgroundFromData(data.background);
      }
      // Приоритет 2: Старый формат (текстура)
      else if (
        data.background.texturePath &&
        data.background.texturePath !== "gradient-texture" &&
        !data.background.isGradientTexture
      ) {
        try {
          const texturePath = this.resolveBackgroundTexturePath(
            data.background.texturePath,
            data.display,
          );
          console.log("🖼️ Загружаю текстуру:", texturePath);
          const texture = await PIXI.Assets.load(texturePath);
          await this.changeBackground({
            texture: texture,
            texturePath: texturePath,
            alpha: data.background.alpha ?? 1,
          });
          console.log("✅ Текстура загружена");
        } catch (error) {
          console.error("❌ Ошибка загрузки текстуры:", error);
          await this.changeBackground({ color: 0x1e1e1e });
        }
      }
      // Приоритет 3: Старый формат (градиент/видео/изображение)
      else if (
        data.background.gradient ||
        data.background.videoUrl ||
        data.background.imageUrl
      ) {
        console.log("🎨 Восстанавливаем фон из конструктора (старый формат)");
        if (this.gradientBuilder) {
          const backgroundData = data.background.gradient
            ? { type: "gradient", data: data.background.gradient }
            : data.background.videoUrl
              ? { type: "video", data: { ...data.background } }
              : data.background.imageUrl
                ? { type: "image", data: { ...data.background } }
                : data.background;
          await this.gradientBuilder.restoreBackgroundFromData(backgroundData);
        } else {
          console.warn("⚠️ gradientBuilder не найден");
          await this.changeBackground({ color: 0x1e1e1e });
        }
      }
      // Приоритет 4: Простой цвет
      else if (data.background.color !== undefined) {
        console.log("🎨 Устанавливаем цвет фона:", data.background.color);
        await this.changeBackground({
          color: data.background.color,
          alpha: data.background.alpha ?? 1,
        });
      }
    }

    // Сетка
    if (data.grid) {
      this.gridSize = data.grid.size;
      this.toggleGrid(data.grid.visible);
    }

    // Виджеты - удаляем старые
    this.innerContainer.children
      .filter((c) => c instanceof DraggableWidget)
      .forEach((c) => c.destroy());

    if (data.widgets) {
      data.widgets.forEach((w) => {
        try {
          if (w.w === "CompanyWidget" && w.type === "qr-only" && w.autoPanelQr === true) {
            return;
          }
          const importedCountBefore = this.innerContainer.children.filter(
            (child) => child instanceof DraggableWidget,
          ).length;
          console.log(w);
          if (w.w == "AnalogClockWidget") {
            if (w.type == "analog-custom" || w.analogClockData?.clockType == 9) {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                ...(w.analogClockData || {}),
                clockType: 9,
                backgroundColor: w.bgColor,
                backgroundAlpha: w.bgAlpha,
                cornerRadius: w.cornerRadius,
                borderColor: w.borderColor,
                borderAlpha: w.borderAlpha,
                borderWidth: w.borderWidth,
              });
              this.addWidget(widget);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
              return;
            }
            if (w.type == "analog-1") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 1,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-2") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 2,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-3") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 3,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-4") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 4,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-5") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 5,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-6") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 6,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-7") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 7,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "analog-8") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new AnalogClockWidget(bounds, 246, 246, {
                clockType: 8,
              });

              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "DigitalClockWidget") {
            if (w.type == "XLseconds") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new DigitalClockWidget(bounds, 508, 246, {
                showSeconds: true,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "XL") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new DigitalClockWidget(bounds, 508, 246, {
                showSeconds: false,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "L") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new DigitalClockWidget(bounds, 377, 115, {
                showSeconds: true,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "S") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new DigitalClockWidget(bounds, 246, 115, {
                showSeconds: false,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "CalendarWidget") {
            if (w.type == "XL") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CalendarWidget(bounds, 508, 377);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "L") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CalendarWidget(bounds, 508, 246);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "M") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CalendarWidget(bounds, 508, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "S") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CalendarWidget(bounds, 246, 246);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "XS") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CalendarWidget(bounds, 246, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "XS_day") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CalendarWidget(bounds, 246, 115, {
                dayOnly: true,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "WeatherWidget") {
            if (w.type == "XL") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new WeatherWidget(bounds, 508, 246);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "L") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new WeatherWidget(bounds, 377, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "M") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new WeatherWidget(bounds, 246, 246);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "S") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new WeatherWidget(bounds, 246, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "TrafficWidget") {
            if (w.type == "TRAFFICL") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new TrafficWidget(bounds, 377, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "TRAFFICM") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new TrafficWidget(bounds, 246, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "TRAFFICS") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new TrafficWidget(bounds, 115, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "TRAFFICMAP") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new TrafficWidget(bounds, 246, 246);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "NewsWidget") {
            const bounds = new PIXI.Rectangle(
              0,
              0,
              this.getWidth(),
              this.getHeight(),
            );
            const widget = new NewsWidget(bounds, 508, 538);
            this.addWidget(widget);
            widget.setPosition(w.x, w.y);
            widget.setBackgroundColor(w.bgColor);
            widget.setBackgroundAlpha(w.bgAlpha);
            widget.setCornerRadius(w.cornerRadius);
            widget.resize(w.size.width, w.size.height);
          }
          if (w.w == "RatesWidget") {
            if (w.type == "USDEURS") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new RatesWidget(bounds, 115, 115, {
                currency: "USDEURS",
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "EURM") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new RatesWidget(bounds, 246, 115, {
                currency: "EUR",
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "USDM") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new RatesWidget(bounds, 246, 115, {
                currency: "USD",
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "USDEURM") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new RatesWidget(bounds, 246, 115, {
                currency: "USDEURM",
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "USDL") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new RatesWidget(bounds, 377, 115, {
                currency: "USD",
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "EURL") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new RatesWidget(bounds, 377, 115, {
                currency: "EUR",
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "VideoWidget") {
            if (
              !w.type ||
              w.type == "VideoWidget" ||
              w.type == "video" ||
              w.widgetType == "VideoWidget"
            ) {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new VideoWidget(bounds, {
                width: w.size?.width ?? 577,
                height: w.size?.height ?? 377,
                panelId:
                  new URLSearchParams(window.location.search).get(
                    "panel_id",
                  ) || w.panelId,
                playerNumber: w.playerNumber ?? w.player_number ?? 1,
                imageDisplayTime: w.imageDisplayTime,
                editorPreviewControls: true,
                backgroundColor: w.bgColor,
                backgroundAlpha: w.bgAlpha,
                cornerRadius: w.cornerRadius,
                backgroundGradient: w.backgroundGradient,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "MetalsWidget") {
            if (w.type == "metal-L") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new MetalsWidget(bounds, 508, 246);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "metal-S") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new MetalsWidget(bounds, 508, 115);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "CompanyWidget") {
            if (w.type == "info") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CompanyWidget(bounds, 508, 115, {
                type: "info",
                companyName: w.companyName,
                phoneNumber: w.phoneNumber,
                textColor: w.textColor,
                fontFamily: w.fontFamily,
                backgroundColor: w.bgColor,
                backgroundAlpha: w.bgAlpha,
                cornerRadius: w.cornerRadius,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "logos") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CompanyWidget(bounds, 508, 115, {
                type: "logos",
                fontFamily: w.fontFamily,
                backgroundColor: w.bgColor,
                backgroundAlpha: w.bgAlpha,
                cornerRadius: w.cornerRadius,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "simple-logos" || w.type == "simplelogos") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CompanyWidget(bounds, 508, 115, {
                type: "simple-logos",
                fontFamily: w.fontFamily,
                backgroundColor: w.bgColor,
                backgroundAlpha: w.bgAlpha,
                cornerRadius: w.cornerRadius,
              });
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
            if (w.type == "qr-only") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new CompanyWidget(
                bounds,
                w.size?.width || 180,
                w.size?.height || 180,
                {
                  type: "qr-only",
                  autoPanelQr: w.autoPanelQr === true,
                  panelFabricNumber: w.panelFabricNumber,
                  backgroundColor: w.bgColor,
                  backgroundAlpha: w.bgAlpha,
                  cornerRadius: w.cornerRadius,
                },
              );
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "SimpleRectWidget") {
            if (w.type == "SimpleRect") {
              const bounds = new PIXI.Rectangle(
                0,
                0,
                this.getWidth(),
                this.getHeight(),
              );
              const widget = new SimpleRectWidget(bounds);
              this.addWidget(widget);
              widget.setBackgroundColor(w.bgColor);
              widget.setBackgroundAlpha(w.bgAlpha);
              widget.setCornerRadius(w.cornerRadius);
              widget.setPosition(w.x, w.y);
              widget.resize(w.size.width, w.size.height);
            }
          }
          if (w.w == "TextWidget") {
            const bounds = new PIXI.Rectangle(
              0,
              0,
              this.getWidth(),
              this.getHeight(),
            );
            const widget = new TextWidget(bounds, {
              ...(w.textData || {}),
              backgroundColor: w.bgColor,
              backgroundAlpha: w.bgAlpha,
              cornerRadius: w.cornerRadius,
              backgroundGradient: w.textData?.backgroundGradient,
            });
            this.addWidget(widget);
            widget.setPosition(w.x, w.y);
            widget.resize(w.size.width, w.size.height);
          }
          if (w.w == "ShapeWidget") {
            const bounds = new PIXI.Rectangle(
              0,
              0,
              this.getWidth(),
              this.getHeight(),
            );
            const widget = new ShapeWidget(
              bounds,
              w.shapeData?.shapeType || w.type || "rectangle",
              {
                ...w.shapeData,
                backgroundColor: w.bgColor,
                backgroundAlpha: w.bgAlpha,
                cornerRadius: w.cornerRadius,
                backgroundGradient: w.shapeData?.backgroundGradient,
              },
            );
            this.addWidget(widget);
            widget.setPosition(w.x, w.y);
            widget.resize(w.size.width, w.size.height);
          }
          if (w.w == "DrawingWidget") {
            const bounds = new PIXI.Rectangle(
              0,
              0,
              this.getWidth(),
              this.getHeight(),
            );
            const widget = new DrawingWidget(bounds, {
              ...(w.drawingData || {}),
              backgroundColor: w.bgColor,
              backgroundAlpha: w.bgAlpha,
              cornerRadius: w.cornerRadius,
              backgroundGradient: w.drawingData?.backgroundGradient,
            });
            this.addWidget(widget);
            widget.setPosition(w.x, w.y);
            widget.resize(w.size.width, w.size.height);
          }
          if (w.w == "AudioPlayerWidget") {
            const bounds = new PIXI.Rectangle(
              0,
              0,
              this.getWidth(),
              this.getHeight(),
            );
            const widget = new AudioPlayerWidget(bounds, {
              ...(w.audioData || {}),
              backgroundColor: w.bgColor,
              backgroundAlpha: w.bgAlpha,
              cornerRadius: w.cornerRadius,
              borderColor: w.borderColor,
              borderAlpha: w.borderAlpha,
              borderWidth: w.borderWidth,
              panelId:
                new URLSearchParams(window.location.search).get("panel_id") ||
                "1",
            });
            this.addWidget(widget);
            widget.setPlayerNumber(w.audioData?.playerNumber || 1);
            widget.setPosition(w.x, w.y);
            widget.resize(w.size.width, w.size.height);
          }
          if (w.w == "DirectionFloorWidget" || w.w == "DirectionFloorDisplay") {
            const bounds = new PIXI.Rectangle(
              0,
              0,
              this.getWidth(),
              this.getHeight(),
            );
            const widget = new DirectionFloorWidget(bounds, {
              ...(w.floorData || {}),
              backgroundColor: w.bgColor,
              backgroundAlpha: w.bgAlpha,
              cornerRadius: w.cornerRadius,
            });
            this.addWidget(widget);
            widget.setPosition(w.x, w.y);
            widget.resize(w.size.width, w.size.height);
          }

          const importedWidgets = this.innerContainer.children.filter(
            (child) => child instanceof DraggableWidget,
          );
          if (importedWidgets.length > importedCountBefore && w.fontFamily) {
            importedWidgets[importedWidgets.length - 1].setFontFamily?.(
              w.fontFamily,
            );
          }
          if (
            importedWidgets.length > importedCountBefore &&
            w.textColor !== undefined
          ) {
            importedWidgets[importedWidgets.length - 1].setTextColor?.(
              w.textColor,
            );
          }
          if (importedWidgets.length > importedCountBefore && w.effectPreset) {
            importedWidgets[importedWidgets.length - 1].setEffectPreset?.(
              w.effectPreset,
            );
          }
          if (importedWidgets.length > importedCountBefore) {
            const importedWidget = importedWidgets[importedWidgets.length - 1];
            if (w.borderColor !== undefined) importedWidget.setBorderColor?.(w.borderColor);
            if (w.borderAlpha !== undefined) importedWidget.setBorderAlpha?.(w.borderAlpha);
            if (w.borderWidth !== undefined) importedWidget.setBorderWidth?.(w.borderWidth);
          }
        } catch (error) {
          console.error("Не удалось восстановить виджет темы:", w, error);
        }
      });
    }
  }

  // ==== ОСНОВНОЙ ФУНКЦИОНАЛ ====

  setupKeyboardControls() {
    document.addEventListener("keydown", (e) => {
      if (e.key.toLowerCase() === "h") {
        this.toggleDrag();
      }
      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        this.handleZoom({ deltaY: -100, global: this.getCenterPosition() });
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        this.handleZoom({ deltaY: 100, global: this.getCenterPosition() });
      }
    });
  }

  getCenterPosition() {
    return { x: this.app.screen.width / 2, y: this.app.screen.height / 2 };
  }

  toggleDrag() {
    this.dragEnabled = !this.dragEnabled;
    this.mainContainer.interactive = this.dragEnabled;
    this.mainContainer.cursor = this.dragEnabled ? "grab" : "default";
    if (!this.dragEnabled && this.dragData) this.onDragEnd();
  }

  restoreWorkspaceInteraction() {
    this.dragData = null;
    this.dragStart = null;
    this.isGlobalDragging = false;
    this.globalDragStart = null;
    this.dragEnabled = true;
    this.mainContainer.interactive = true;
    this.mainContainer.eventMode = "static";
    this.mainContainer.cursor = "grab";
    this.outerFrame.interactive = true;
    this.outerFrame.eventMode = "static";
    this.app.stage.cursor = "default";
    document.body.style.cursor = "";
    this.updateInteractiveAreas?.();
  }

  setupZoom() {
    this.mainContainer.interactive = true;
    this.mainContainer.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.outerFrameWidth,
      this.outerFrameHeight,
    );
    this.mainContainer.on("wheel", (event) => {
      event.preventDefault();
      this.handleZoom(event);
    });
  }

  handleZoom(event) {
    const delta = event.deltaY > 0 ? 0.9 : 1.1;
    const mousePos = {
      x: event.global.x - this.mainContainer.x,
      y: event.global.y - this.mainContainer.y,
    };

    const oldScale = this.scale;
    this.scale = Math.max(
      this.minScale,
      Math.min(this.maxScale, this.scale * delta),
    );
    this.mainContainer.scale.set(this.scale);

    const newMousePos = {
      x: (mousePos.x * this.scale) / oldScale,
      y: (mousePos.y * this.scale) / oldScale,
    };

    this.mainContainer.x += mousePos.x - newMousePos.x;
    this.mainContainer.y += mousePos.y - newMousePos.y;

    // Сохраняем позицию после зума
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };

    this.updateGridAfterZoom();
  }

  updateGridAfterZoom() {
    if (this.grid) {
      this.createGrid({ size: this.gridSize, thickness: 1 / this.scale });
    }
  }

  setupDrag() {
    this.mainContainer.interactive = true;
    this.mainContainer.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.outerFrameWidth,
      this.outerFrameHeight,
    );
    this.mainContainer.cursor = "grab";

    // Обработчики для основного контейнера (только когда не взаимодействуем с виджетами)
    this.mainContainer
      .on("pointerdown", this.onDragStart.bind(this))
      .on("pointerup", this.onDragEnd.bind(this))
      .on("pointerupoutside", this.onDragEnd.bind(this))
      .on("pointermove", this.onDragMove.bind(this));
  }

  onDragStart(event) {
    // Если кликнули по виджету - не начинаем перетаскивание редактора
    if (
      event.target instanceof DraggableWidget ||
      event.target?.parent instanceof DraggableWidget
    ) {
      return;
    }

    if (!this.dragEnabled) return;
    this.dragData = event.data;
    this.dragStart = {
      x: this.mainContainer.x,
      y: this.mainContainer.y,
      pointer: this.dragData.getLocalPosition(this.mainContainer.parent),
    };
    this.mainContainer.cursor = "grabbing";
  }

  onDragMove(event) {
    // Если перетаскиваем виджет - не двигаем редактор
    if (this.isDraggingWidget()) {
      return;
    }

    if (!this.dragEnabled || !this.dragData) return;
    const newPosition = this.dragData.getLocalPosition(
      this.mainContainer.parent,
    );
    const dx = newPosition.x - this.dragStart.pointer.x;
    const dy = newPosition.y - this.dragStart.pointer.y;
    this.mainContainer.x = this.dragStart.x + dx;
    this.mainContainer.y = this.dragStart.y + dy;

    // Сохраняем текущую позицию при перетаскивании
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };
  }

  // Проверка, перетаскивается ли в данный момент какой-либо виджет
  isDraggingWidget() {
    return this.innerContainer.children.some(
      (child) => child instanceof DraggableWidget && child.isDragging,
    );
  }

  onDragEnd() {
    this.dragData = null;
    this.dragStart = null;
    this.mainContainer.cursor = "grab";

    // Сохраняем финальную позицию
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };
  }

  createGrid(options = {}) {
    if (options.size !== undefined) this.gridSize = options.size;
    if (options.color !== undefined) this.gridColor = options.color;
    if (options.alpha !== undefined) this.gridAlpha = options.alpha;

    if (this.grid) {
      this.innerContainer.removeChild(this.grid);
      this.grid.destroy();
    }

    this.grid = new Graphics();
    const lineThickness = options.thickness || 0.2;

    for (let x = 0; x <= this._width; x += this.gridSize) {
      this.grid.rect(x - lineThickness / 2, 0, lineThickness, this._height);
    }
    for (let y = 0; y <= this._height; y += this.gridSize) {
      this.grid.rect(0, y - lineThickness / 2, this._width, lineThickness);
    }

    this.grid.fill(this.gridColor, this.gridAlpha);

    if (!this.gridContainer) {
      this.gridContainer = new Container();
      this.innerContainer.addChild(this.gridContainer);
    }

    this.gridContainer.removeChildren();
    this.gridContainer.addChild(this.grid);
    this.grid.visible = this.gridVisible;
  }

  setGridColor(color) {
    this.gridColor = color;
    this.createGrid();
  }

  // В классе EditorFrame полностью замените метод addWidget
  // В классе EditorFrame полностью замените метод addWidget
  // В классе EditorFrame полностью замените метод addWidget
  addWidget(widgetContent, x, y) {
    console.log("🔵 addWidget вызван с:", {
      widgetContent: widgetContent.constructor.name,
      x,
      y,
    });

    const bounds = new PIXI.Rectangle(0, 0, this._width, this._height);

    let widget;

    // Медиаплееры получают собственный номер для привязки файлов.
    if (
      widgetContent instanceof VideoWidget ||
      widgetContent instanceof AudioPlayerWidget
    ) {
      console.log("🎬 Это медиаплеер (наследник DraggableWidget)");
      widget = widgetContent;
      widget.setBounds(bounds);

      // Устанавливаем позицию
      if (x !== undefined && y !== undefined) {
        widget.position.set(x, y);
      }

      // Сначала добавляем в контейнер
      this.innerContainer.addChild(widget);
      console.log("✅ Виджет добавлен в контейнер");

      // Получаем свободный номер
      const nextPlayerNumber = this.getNextAvailablePlayerNumber(
        widget,
        widget.constructor,
      );
      console.log(`🎯 Получен свободный номер: ${nextPlayerNumber}`);

      // Присваиваем номер
      if (widget.setPlayerNumber) {
        widget.setPlayerNumber(nextPlayerNumber);
        console.log(
          `✅ Номер ${nextPlayerNumber} присвоен через setPlayerNumber`,
        );
      } else {
        widget._playerNumber = nextPlayerNumber;
        console.log(`✅ Номер ${nextPlayerNumber} присвоен напрямую`);
      }

      // Проверяем и перезагружаем
      setTimeout(() => {
        const currentNum = widget.getPlayerNumber
          ? widget.getPlayerNumber()
          : widget._playerNumber;
        console.log(`🔍 Проверка: текущий номер = ${currentNum}`);

        if (widget.reload) {
          widget.reload();
          console.log("🔄 Виджет перезагружен");
        }
      }, 200);
    }
    // Если это другой DraggableWidget (не VideoWidget)
    else if (widgetContent instanceof DraggableWidget) {
      console.log(
        "📦 Это другой DraggableWidget:",
        widgetContent.constructor.name,
      );
      widget = widgetContent;
      widget.setBounds(bounds);
      widget.position.set(x, y);
      this.innerContainer.addChild(widget);
    }
    // Если это простой контент, оборачиваем в DraggableWidget
    else {
      console.log("📦 Оборачиваем контент в DraggableWidget");
      widget = new DraggableWidget(bounds, widgetContent);
      widget.position.set(x, y);
      this.innerContainer.addChild(widget);
    }

    // Настраиваем обработчики
    this.setupWidgetInteractions(widget);

    return widget;
  }

  // Выносим логику обработки видео в отдельный метод
  handleVideoWidget(widget, videoWidget) {
    console.log("🎬 Обработка VideoWidget");

    // Сначала добавляем виджет в контейнер
    this.innerContainer.addChild(widget);
    console.log("✅ Виджет добавлен в контейнер");

    // Сбрасываем номер
    if (videoWidget.setPlayerNumber) {
      videoWidget.setPlayerNumber(null);
    } else {
      videoWidget._playerNumber = null;
    }
    console.log(`🔍 Номер сброшен`);

    // Получаем свободный номер
    const nextPlayerNumber = this.getNextAvailablePlayerNumber(widget);
    console.log(`🎯 Получен свободный номер: ${nextPlayerNumber}`);

    // Присваиваем номер
    if (videoWidget.setPlayerNumber) {
      videoWidget.setPlayerNumber(nextPlayerNumber);
      console.log(
        `✅ Номер ${nextPlayerNumber} присвоен через setPlayerNumber`,
      );
    } else {
      videoWidget._playerNumber = nextPlayerNumber;
      console.log(`✅ Номер ${nextPlayerNumber} присвоен напрямую`);
    }

    // Проверяем
    setTimeout(() => {
      const currentNum = videoWidget.getPlayerNumber
        ? videoWidget.getPlayerNumber()
        : videoWidget._playerNumber;
      console.log(`🔍 Проверка: текущий номер = ${currentNum}`);

      if (videoWidget.reload) {
        videoWidget.reload();
        console.log("🔄 Виджет перезагружен");
      }
    }, 200);
  }
  // В классе EditorFrame, метод getNextAvailablePlayerNumber
  getNextAvailablePlayerNumber(
    excludeWidget = null,
    widgetClass = VideoWidget,
  ) {
    console.log("🔍 Поиск свободного номера проигрывателя...");

    const usedPlayerNumbers = new Set();

    this.innerContainer.children.forEach((child) => {
      // Пропускаем текущий виджет
      if (excludeWidget && child === excludeWidget) {
        console.log("  ⏭️ Пропускаем текущий виджет");
        return;
      }

      if (child instanceof widgetClass) {
        console.log(`  🎬 Найден VideoWidget: ${child.constructor.name}`);

        let playerNum = null;
        if (child.getPlayerNumber) {
          playerNum = child.getPlayerNumber();
        } else if (child._playerNumber !== undefined) {
          playerNum = child._playerNumber;
        }

        console.log(`    → Номер: ${playerNum}`);

        if (playerNum && !isNaN(playerNum) && playerNum > 0) {
          usedPlayerNumbers.add(playerNum);
          console.log(`    ✅ Добавлен номер ${playerNum}`);
        }
      }
      // Проверяем другие DraggableWidget на наличие VideoWidget внутри
      else if (child instanceof DraggableWidget) {
        // ... остальная логика для вложенных виджетов
      }
    });

    console.log(
      "📊 ЗАНЯТЫЕ НОМЕРА:",
      Array.from(usedPlayerNumbers).sort((a, b) => a - b),
    );

    // Ищем первый свободный номер
    for (let i = 1; i <= 100; i++) {
      if (!usedPlayerNumbers.has(i)) {
        console.log(`✅ Найден свободный номер: ${i}`);
        return i;
      }
    }

    return 1;
  }

  // Настройка взаимодействий для виджета
  setupWidgetInteractions(widget) {
    // Убедимся, что виджет может получать события
    widget.eventMode = "static";
    widget.interactive = true;

    // Подписываемся на события перетаскивания виджета
    widget.on("drag-start", () => {
      this.onWidgetDragStart();
    });

    widget.on("drag-end", () => {
      this.onWidgetDragEnd();
    });

    if (widget.constructor.name === "DrawingWidget") {
      widget.on("drawing-change", () => {
        window.undoManager?.save("Изменен рисунок");
      });
    }
  }

  onWidgetDragStart() {
    this.dragEnabled = false;
    this.mainContainer.cursor = "default";
    this.isGlobalDragging = false; // Отключаем глобальное перетаскивание
  }

  onWidgetDragEnd() {
    this.dragEnabled = true;
    this.mainContainer.cursor = "grab";
  }

  setupBackgroundInteraction() {
    this.background.interactive = true;
    this.background.on("pointerdown", (event) => {
      this.deselectAllWidgets();
    });
  }

  deselectAllWidgets() {
    this.innerContainer.children.forEach((widget) => {
      if (widget instanceof DraggableWidget) {
        widget.deselect();
      }
    });
  }

  setupGlobalMiddleClick() {
    this.mainContainer.eventMode = "static";
    this.mainContainer.on("pointerdown", (event) => {
      if (event.button === 1) {
        this.deselectAllWidgets();
      }
    });
  }

  toggleGrid(visible) {
    this.gridVisible = visible !== undefined ? visible : !this.gridVisible;
    if (this.grid) this.grid.visible = this.gridVisible;
  }

  setGridSize(size) {
    if (size <= 0) return;
    this.gridSize = Math.max(1, Math.round(size));
    if (this.gridVisible) this.createGrid();
  }

  resize(width, height) {
    const oldWidth = this._width;
    const oldHeight = this._height;

    this._width = width;
    this._height = height;

    const padding = 200;
    this.outerFrameWidth = this._width + padding * 2;
    this.outerFrameHeight = this._height + padding * 2;

    this.innerContainer.x = padding;
    this.innerContainer.y = padding;

    // Обновляем фон
    if (this.background) {
      this.background.children.forEach((child) => {
        child.width = width;
        child.height = height;
      });
      if (this.backgroundSprite) {
        this.backgroundSprite.width = width;
        this.backgroundSprite.height = height;
      }
    }

    this.createOuterFrame();
    if (this.grid) this.createGrid();
    this.updateWidgetsBounds();

    // ОБНОВЛЯЕМ ИНТЕРАКТИВНЫЕ ОБЛАСТИ ПОСЛЕ ИЗМЕНЕНИЯ РАЗМЕРОВ
    this.updateInteractiveAreas();

    // ВОССТАНАВЛИВАЕМ СОХРАНЕННУЮ ПОЗИЦИЮ ВМЕСТО ЦЕНТРИРОВАНИЯ
    if (this.savedPosition.x !== null && this.savedPosition.y !== null) {
      this.mainContainer.x = this.savedPosition.x;
      this.mainContainer.y = this.savedPosition.y;
    } else {
      // Если позиция еще не сохранена, центрируем
      this.centerOnScreen();
    }
  }

  // ДОБАВИТЬ НОВЫЙ МЕТОД ДЛЯ ОБНОВЛЕНИЯ ИНТЕРАКТИВНЫХ ОБЛАСТЕЙ
  updateInteractiveAreas() {
    // Обновляем hitArea для mainContainer
    this.mainContainer.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.outerFrameWidth,
      this.outerFrameHeight,
    );

    // Обновляем hitArea для outerFrame
    this.outerFrame.hitArea = new PIXI.Rectangle(
      0,
      0,
      this.outerFrameWidth,
      this.outerFrameHeight,
    );

    // Пересоздаем обработчики для outerFrame чтобы применить изменения
    this.setupOuterFrameInteraction();
  }

  // ТАКЖЕ ИСПРАВИТЬ МЕТОД createOuterFrame
  createOuterFrame() {
    this.outerFrame.removeChildren();

    // Создаем свечение (добавляем перед основным фоном)
    this.createGlowEffect();

    const outerBg = new Graphics();
    outerBg.rect(0, 0, this.outerFrameWidth, this.outerFrameHeight);
    outerBg.fill(this.outerFrameColor);
    outerBg.alpha = this.outerFrameAlpha;

    this.outerFrame.addChild(outerBg);

    // Добавляем метки ПОСЛЕ фона, но ДО настройки взаимодействий
    this.addTutorialLabels();

    // Добавляем обработчики для свечения
    this.setupGlowInteractions();

    this.setupOuterFrameInteraction();
  }

  updateWidgetsBounds() {
    const bounds = new PIXI.Rectangle(0, 0, this._width, this._height);
    this.innerContainer.children.forEach((child) => {
      if (child instanceof DraggableWidget) {
        child.setBounds(bounds);
      }
    });
  }

  snapToGrid(value) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  createBackground() {
    this.background = new Container();
    const bg = new Sprite(Texture.WHITE);
    bg.width = this._width;
    bg.height = this._height;
    bg.tint = 0x1e1e1e;
    this.background.addChild(bg);
    this.innerContainer.addChildAt(this.background, 0);
    this.setupBackgroundInteraction();
  }

  getWidth() {
    return this._width;
  }
  getHeight() {
    return this._height;
  }
  getSize() {
    return { width: this._width, height: this._height };
  }

  // ==== УПРОЩЕННАЯ АНИМАЦИЯ ГРАДИЕНТОВ ====

  startGradientAnimation() {
    this.stopGradientAnimation();
    if (this.gradientAnimation.enabled) {
      this.animateGradient();
    }
  }

  stopGradientAnimation() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  animateGradient() {
    if (
      !this.gradientAnimation.enabled ||
      !this.background ||
      !this.background.children[0]
    ) {
      this.stopGradientAnimation();
      return;
    }

    this.gradientAnimation.time += 0.016 * this.gradientAnimation.speed;
    this.updateAnimatedGradient();

    this.animationFrameId = requestAnimationFrame(() => this.animateGradient());
  }

  updateAnimatedGradient() {
    const graphics = this.background.children[0];
    if (!graphics) return;

    const gradient = this.createAnimatedGradient();

    graphics.clear();
    graphics.rect(0, 0, this._width, this._height);
    graphics.fill(gradient);
  }

  createAnimatedGradient() {
    if (!this.currentGradientConfig)
      return new FillGradient({
        type: "linear",
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 1, color: "#0000ff" },
        ],
      });

    const config = JSON.parse(JSON.stringify(this.currentGradientConfig));
    const time = this.gradientAnimation.time;

    // Простая анимация - смещение цветовых остановок
    if (this.gradientAnimation.type === "move") {
      const offset = (time * 0.5 * this.gradientAnimation.speed) % 1;
      config.colorStops = config.colorStops.map((stop) => ({
        ...stop,
        offset: (stop.offset + offset) % 1,
      }));
    }
    // Пульсация - изменение альфа-канала
    else if (this.gradientAnimation.type === "pulse") {
      const alpha = 0.5 + Math.sin(time * 2) * 0.3;
      config.colorStops = config.colorStops.map((stop) => ({
        ...stop,
        color: this.adjustColorAlpha(stop.color, alpha),
      }));
    }

    return new FillGradient(config);
  }

  adjustColorAlpha(color, alpha) {
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return color;
  }

  applyGradientBackground(gradientOptions) {
    const config = this.validateGradientOptions(gradientOptions);
    this.currentGradientConfig = config;

    // Настройка анимации
    if (gradientOptions.animation) {
      this.gradientAnimation = {
        ...gradientOptions.animation,
        enabled: true,
        time: 0,
      };
    } else {
      this.gradientAnimation.enabled = false;
      this.stopGradientAnimation();
    }

    this.changeBackground({ gradient: config });
  }

  validateGradientOptions(options) {
    return {
      type: options.type || "linear",
      colorStops: options.colorStops || [
        { offset: 0, color: "#ff0000" },
        { offset: 1, color: "#0000ff" },
      ],
      start: options.start || { x: 0, y: 0 },
      end: options.end || { x: 1, y: 1 },
      textureSpace: options.textureSpace || "local",
    };
  }

  async changeBackground(options = {}) {
    this.stopGradientAnimation();

    console.log("texture", options);

    // Удаляем старый фон
    if (this.background) {
      this.innerContainer.removeChild(this.background);
      this.background.destroy({
        children: true,
        texture: false,
        textureSource: false,
      });
      this.background = null;
    }

    this.background = new Container();
    this.backgroundSprite = null;
    this.backgroundGradient = null;
    this.backgroundTexturePath = null;

    // Определяем тип фона
    if (options.texture != null) {
      try {
        console.log("🖼️ Создаю фон из текстуры:", options.texture);

        // Проверяем, это градиентная текстура или обычная
        if (options.isVideoTexture) {
          this.currentBackgroundType = "video";
          console.log("🎬 Это видео-текстура");
        } else if (options.isImageTexture) {
          this.currentBackgroundType = "image";
          console.log("🖼️ Это изображение из конструктора");
        } else if (options.isGradientTexture) {
          this.currentBackgroundType = "gradient-texture";
          console.log("🎨 Это градиентная текстура");
        } else {
          this.currentBackgroundType = "texture";
        }

        // Создаем спрайт из текстуры
        this.backgroundSprite = new Sprite(options.texture);
        this.backgroundSprite.width = this._width;
        this.backgroundSprite.height = this._height;
        this.backgroundSprite.alpha =
          options.alpha !== undefined ? options.alpha : 1;
        this.background.addChild(this.backgroundSprite);

        this.backgroundTexturePath = options.texturePath || "texture";

        console.log("✅ Фон-спрайт создан");
      } catch (error) {
        console.error("❌ Ошибка создания фона из текстуры:", error);
        this.createDefaultBackground(options);
      }
    } else if (options.gradient !== undefined) {
      try {
        this.currentBackgroundType = "gradient";
        console.log("🎨 Создаю градиентный фон");

        const graphics = new Graphics();

        let gradient;
        if (options.gradient instanceof FillGradient) {
          gradient = options.gradient;
        } else {
          gradient = new FillGradient(options.gradient);
        }

        graphics.rect(0, 0, this._width, this._height);
        graphics.fill(gradient);

        this.background.addChild(graphics);
        this.backgroundGradient = options.gradient;

        if (this.gradientAnimation.enabled) {
          setTimeout(() => this.startGradientAnimation(), 50);
        }
      } catch (error) {
        console.error("❌ Ошибка создания градиента:", error);
        this.createDefaultBackground(options);
      }
    } else if (options.color !== undefined) {
      this.currentBackgroundType = "color";
      this.createColorBackground(options);
    } else {
      this.currentBackgroundType = "color";
      this.createDefaultBackground(options);
    }

    // Добавляем фон в контейнер
    this.innerContainer.addChildAt(this.background, 0);
    this.setupBackgroundInteraction();

    console.log("✅ Фон успешно изменен. Тип:", this.currentBackgroundType);
  }

  // В классе EditorFrame добавьте:
  resetBackground() {
    this.backgroundSprite = null;
    this.backgroundGradient = null;
    this.backgroundTexturePath = null;
    console.log("✅ Фон сброшен");
  }

  createDefaultBackground(options) {
    const bg = new Sprite(Texture.WHITE);
    bg.width = this._width;
    bg.height = this._height;
    bg.tint = 0x1e1e1e;
    bg.alpha = options.alpha !== undefined ? options.alpha : 1;
    this.background.addChild(bg);
  }

  createColorBackground(options) {
    const bg = new Sprite(Texture.WHITE);
    bg.width = this._width;
    bg.height = this._height;
    bg.tint = options.color;
    bg.alpha = options.alpha !== undefined ? options.alpha : 1;
    this.background.addChild(bg);
  }

  async createTextureBackground(options) {
    try {
      let texture;
      if (typeof options.texture === "string") {
        texture = await PIXI.Assets.load(options.texture);
      } else {
        texture = options.texture;
      }

      if (texture) {
        this.backgroundSprite = new Sprite(texture);
        this.backgroundSprite.width = this._width;
        this.backgroundSprite.height = this._height;
        this.backgroundSprite.alpha =
          options.alpha !== undefined ? options.alpha : 1;
        this.background.addChild(this.backgroundSprite);
      }
    } catch (error) {
      console.error("Ошибка загрузки текстуры:", error);
      this.createDefaultBackground(options);
    }
  }

  // ==== МЕТОДЫ ДЛЯ РАБОТЫ С ВНЕШНИМ ПОЛЕМ ====

  changeOuterFrameColor(color) {
    this.outerFrameColor = color;
    this.createOuterFrame();
  }

  changeOuterFrameAlpha(alpha) {
    this.outerFrameAlpha = alpha;
    this.createOuterFrame();
  }

  getOuterFrameSize() {
    return { width: this.outerFrameWidth, height: this.outerFrameHeight };
  }

  centerOnScreen() {
    this.mainContainer.x =
      (this.app.screen.width - this.outerFrameWidth * this.scale) / 2;
    this.mainContainer.y =
      (this.app.screen.height - this.outerFrameHeight * this.scale) / 2;

    // Сохраняем позицию после центрирования
    this.savedPosition = { x: this.mainContainer.x, y: this.mainContainer.y };
  }

  resetView() {
    this.scale = 1;
    this.mainContainer.scale.set(1);
    this.centerOnScreen();
  }

  // Метод для тестирования анимации
  testAnimation() {
    console.log("Тест анимации:", {
      enabled: this.gradientAnimation.enabled,
      frameId: this.animationFrameId,
      background: !!this.background,
      gradient: !!this.backgroundGradient,
    });
    this.startGradientAnimation();
  }
}
