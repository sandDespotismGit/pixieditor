// AnalogClockWidget.js
import { Assets, Container, Graphics, Sprite, Text, TextStyle, Texture } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export const ANALOG_CLOCK_CUSTOM_FACES = [
  { id: "face_1", label: "Фон 1", url: "/assets/analog_clock_custom/faces/face_1.png" },
  { id: "face_2", label: "Фон 2", url: "/assets/analog_clock_custom/faces/face_2.png" },
  { id: "face_3", label: "Фон 3", url: "/assets/analog_clock_custom/faces/face_3.png" },
  { id: "face_4", label: "Фон 4", url: "/assets/analog_clock_custom/faces/face_4.png" },
  { id: "face_5", label: "Фон 5", url: "/assets/analog_clock_custom/faces/face_5.png" },
  { id: "face_6", label: "Фон 6", url: "/assets/analog_clock_custom/faces/face_6.png" },
];

export const ANALOG_CLOCK_CUSTOM_HANDS = [
  { id: "gold_thin_hour", label: "Золото тонкая часовая", url: "/assets/analog_clock_custom/hands/gold_thin_hour.png", length: 0.5, anchorX: 0.051, anchorY: 0.5, keyBlack: true },
  { id: "gold_thin_minute", label: "Золото тонкая минутная", url: "/assets/analog_clock_custom/hands/gold_thin_minute.png", length: 0.74, anchorX: 0.042, anchorY: 0.5, keyBlack: true },
  { id: "blue_second", label: "Синяя секундная", url: "/assets/analog_clock_custom/hands/blue_second.png", length: 0.84, anchorX: 0.17, anchorY: 0.496, keyBlack: true },
  { id: "gold_wide_hour", label: "Золото широкая часовая", url: "/assets/analog_clock_custom/hands/gold_wide_hour.png", length: 0.5, anchorX: 0.064, anchorY: 0.5, keyBlack: true },
  { id: "gold_wide_minute", label: "Золото широкая минутная", url: "/assets/analog_clock_custom/hands/gold_wide_minute.png", length: 0.76, anchorX: 0.046, anchorY: 0.5, keyBlack: true },
  { id: "gold_wide_second", label: "Золото широкая секундная", url: "/assets/analog_clock_custom/hands/gold_wide_second.png", length: 0.82, anchorX: 0.225, anchorY: 0.491, keyBlack: true },
];

const CUSTOM_CLOCK_ALIASES = {
  hand_gold_1: "gold_thin_hour",
  hand_gold_2: "gold_thin_minute",
  hand_gold_3: "gold_wide_minute",
  hand_gold_4: "gold_wide_hour",
  hand_blue_1: "blue_second",
  hand_blue_2: "blue_second",
};

const byId = (list, id) => {
  const normalizedId = CUSTOM_CLOCK_ALIASES[id] || id;
  return list.find((item) => item.id === normalizedId) || list[0];
};

async function loadTextureWithOptionalBlackKey(item) {
  if (!item?.keyBlack) return Assets.load(item.url);

  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = item.url;
  });

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < data.data.length; i += 4) {
    const r = data.data[i];
    const g = data.data[i + 1];
    const b = data.data[i + 2];
    if (r < 18 && g < 18 && b < 18) data.data[i + 3] = 0;
  }
  ctx.putImageData(data, 0, 0);
  return Texture.from(canvas);
}

export default class AnalogClockWidget extends DraggableWidget {
  constructor(bounds, width, height, options = {}) {
    const content = new Container();

    // Фон виджета
    const bg = new Graphics();
    bg.beginFill(
      options.backgroundColor ?? 0x1e1e1e,
      options.backgroundAlpha ?? 1,
    )
      .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
      .endFill();
    content.addChild(bg);

    super(bounds, content, options);
    // Сохраняем исходные размеры для масштабирования
    this.originalWidth = width;
    this.originalHeight = height;
    this.contentContainer = new Container();
    content.addChild(this.contentContainer);
    this._width = width;
    this._height = height;
    // === Сохраняем стили ===
    this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
    this._backgroundAlpha = options.backgroundAlpha ?? 1;
    this._cornerRadius = options.cornerRadius ?? 32;

    this._borderColor = options.borderColor ?? 0xffffff;
    this._borderAlpha = options.borderAlpha ?? 1;
    this._borderWidth = options.borderWidth ?? 0;
    this.bg = bg;
    this.clockType = options.clockType || 1;
    this.customFaceId = options.customFaceId || options.analogClockData?.customFaceId || "face_1";
    this.customHourHandId = options.customHourHandId || options.analogClockData?.customHourHandId || "gold_wide_hour";
    this.customMinuteHandId = options.customMinuteHandId || options.analogClockData?.customMinuteHandId || "gold_wide_minute";
    this.customSecondHandId = options.customSecondHandId || options.analogClockData?.customSecondHandId || "blue_second";
    this.customHandsScale = Number(options.customHandsScale ?? options.analogClockData?.customHandsScale ?? 1);
    this.customSecondHandVisible = options.customSecondHandVisible ?? options.analogClockData?.customSecondHandVisible ?? true;

    // Центр часов
    this.centerX = width / 2;
    this.centerY = height / 2;
    this.radius = Math.min(width, height) / 2 - 10;

    // Создаем графический объект для рисования часов
    this.clockGraphics = new Graphics();
    this.contentContainer.addChild(this.clockGraphics);
    this.customContainer = new Container();
    this.contentContainer.addChild(this.customContainer);
    this.faceSprite = new Sprite(Texture.EMPTY);
    this.hourSprite = new Sprite(Texture.EMPTY);
    this.minuteSprite = new Sprite(Texture.EMPTY);
    this.secondSprite = new Sprite(Texture.EMPTY);
    this.customDialGraphics = new Graphics();
    this.customFaceMask = new Graphics();
    this.customFaceMask.renderable = false;
    this.customContainer.addChild(this.faceSprite, this.customDialGraphics, this.hourSprite, this.minuteSprite, this.secondSprite);
    this.customContainer.addChild(this.customFaceMask);
    this.faceSprite.mask = this.customFaceMask;
    this.applyCustomVisibility();
    this.loadCustomAssets();

    // Обновляем часы сразу и устанавливаем интервал
    this.updateClock();
    this._timer = setInterval(() => this.updateClock(), 100);
  }

  updateClock() {
    const now = new Date();
    if (this.clockType === 9) {
      this.type = "analog-custom";
      this.clockGraphics.clear();
      this.updateCustomClock(now);
      return;
    }
    this.clockGraphics.clear();

    // Рисуем циферблат в зависимости от типа часов
    this.drawClockFace();

    // Рисуем стрелки в зависимости от типа часов
    this.drawHands(now);
  }

  applyCustomVisibility() {
    if (!this.customContainer || !this.clockGraphics) return;
    this.customContainer.visible = this.clockType === 9;
    this.clockGraphics.visible = this.clockType !== 9;
  }

  async loadSprite(sprite, item) {
    if (!sprite || !item?.url) return;
    try {
      sprite.texture = await loadTextureWithOptionalBlackKey(item);
      this.layoutCustomAssets();
    } catch (error) {
      console.warn("Не удалось загрузить ассет часов", item.url, error);
      sprite.texture = Texture.EMPTY;
    }
  }

  loadCustomAssets() {
    if (!this.faceSprite) return;
    this.loadSprite(this.faceSprite, byId(ANALOG_CLOCK_CUSTOM_FACES, this.customFaceId));
    this.loadSprite(this.hourSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, this.customHourHandId));
    this.loadSprite(this.minuteSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, this.customMinuteHandId));
    this.loadSprite(this.secondSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, this.customSecondHandId));
  }

  layoutCustomAssets() {
    if (!this.faceSprite) return;
    const cx = this.originalWidth / 2;
    const cy = this.originalHeight / 2;
    const faceMax = Math.min(this.originalWidth, this.originalHeight) * 0.94;
    const faceTexture = this.faceSprite.texture;
    if (faceTexture && faceTexture !== Texture.EMPTY) {
      const scale = Math.max(faceMax / faceTexture.width, faceMax / faceTexture.height);
      this.faceSprite.anchor.set(0.5);
      this.faceSprite.position.set(cx, cy);
      this.faceSprite.scale.set(scale);
    }
    this.customFaceMask.clear();
    this.customFaceMask.circle(cx, cy, faceMax / 2);
    this.customFaceMask.fill({ color: 0xffffff, alpha: 1 });
    this.drawCustomDial(cx, cy, faceMax / 2);
    [
      [this.hourSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, this.customHourHandId), 0.58],
      [this.minuteSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, this.customMinuteHandId), 0.82],
      [this.secondSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, this.customSecondHandId), 0.9],
    ].forEach(([sprite, config, fallbackLength]) => {
      const texture = sprite.texture;
      if (!texture || texture === Texture.EMPTY) return;
      sprite.anchor.set(config.anchorX ?? 0.1, config.anchorY ?? 0.5);
      sprite.position.set(cx, cy);
      const targetLength = (faceMax / 2) * (config.length ?? fallbackLength);
      const visibleLength = texture.width * Math.max(0.35, 1 - (config.anchorX ?? 0.5));
      const scale = (targetLength / Math.max(1, visibleLength)) * this.customHandsScale;
      sprite.scale.set(scale);
    });
    this.secondSprite.visible = this.customSecondHandVisible;
  }

  drawCustomDial(cx, cy, radius) {
    if (!this.customDialGraphics) return;
    const g = this.customDialGraphics;
    const r = Math.max(16, radius * 0.8);
    g.clear();
    g.circle(cx, cy, r);
    g.stroke({ width: Math.max(1, r * 0.015), color: 0xffffff, alpha: 0.5 });
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 - Math.PI / 2;
      const isHour = i % 5 === 0;
      const inner = r * (isHour ? 0.83 : 0.9);
      const outer = r * 0.96;
      g.moveTo(cx + Math.cos(angle) * inner, cy + Math.sin(angle) * inner);
      g.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      g.stroke({
        width: Math.max(1, r * (isHour ? 0.022 : 0.01)),
        color: isHour ? 0xffffff : 0xd6d6d6,
        alpha: isHour ? 0.78 : 0.38,
      });
    }
    g.circle(cx, cy, Math.max(3, r * 0.035));
    g.fill({ color: 0xffffff, alpha: 0.8 });
  }

  updateCustomClock(now) {
    this.applyCustomVisibility();
    this.layoutCustomAssets();
    const seconds = now.getSeconds() + now.getMilliseconds() / 1000;
    const minutes = now.getMinutes() + seconds / 60;
    const hours = (now.getHours() % 12) + minutes / 60;
    this.hourSprite.rotation = (hours / 12) * Math.PI * 2 - Math.PI / 2;
    this.minuteSprite.rotation = (minutes / 60) * Math.PI * 2 - Math.PI / 2;
    this.secondSprite.rotation = (seconds / 60) * Math.PI * 2 - Math.PI / 2;
  }

  setCustomFace(id) {
    this.clockType = 9;
    this.customFaceId = id;
    this.applyCustomVisibility();
    this.loadSprite(this.faceSprite, byId(ANALOG_CLOCK_CUSTOM_FACES, id));
    this.updateClock();
    return this;
  }

  setCustomHourHand(id) {
    this.clockType = 9;
    this.customHourHandId = id;
    this.applyCustomVisibility();
    this.loadSprite(this.hourSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, id));
    this.updateClock();
    return this;
  }

  setCustomMinuteHand(id) {
    this.clockType = 9;
    this.customMinuteHandId = id;
    this.applyCustomVisibility();
    this.loadSprite(this.minuteSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, id));
    this.updateClock();
    return this;
  }

  setCustomSecondHand(id) {
    this.clockType = 9;
    this.customSecondHandId = id;
    this.applyCustomVisibility();
    this.loadSprite(this.secondSprite, byId(ANALOG_CLOCK_CUSTOM_HANDS, id));
    this.updateClock();
    return this;
  }

  setCustomHandsScale(value) {
    this.customHandsScale = Math.max(0.4, Math.min(1.8, Number(value) || 1));
    this.layoutCustomAssets();
    return this;
  }

  setCustomSecondHandVisible(value) {
    this.customSecondHandVisible = value === true || value === "true";
    this.layoutCustomAssets();
    return this;
  }

  drawClockFace() {
    const ctx = this.clockGraphics;
    const centerX = this.centerX;
    const centerY = this.centerY;
    const radius = this.radius;

    // Базовый циферблат для всех типов
    ctx.circle(centerX, centerY, radius);
    ctx.fill({ color: 0xffffff });
    ctx.stroke({ width: 2, color: 0xffffff });

    // Дополнительные элементы в зависимости от типа
    switch (this.clockType) {
      case 1:
        this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0x737373);
        this.type = "analog-1";
        break;
      case 2:
        // Простой циферблат без меток
        this.type = "analog-2";
        break;
      case 3:
        this.drawDots(ctx, centerX, centerY, radius, 60, 3, 0xcccccc);
        this.drawDots(ctx, centerX, centerY, radius, 12, 3, 0x6f6f6f);
        this.drawNumbers(ctx, centerX, centerY, radius);
        this.type = "analog-3";
        break;
      case 4:
        this.drawLines(ctx, centerX, centerY, radius, 12, 4, 0x737373);
        this.type = "analog-4";
        break;
      case 5:
        this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0x737373);
        this.type = "analog-5";
        break;
      case 6:
        this.drawLines(ctx, centerX, centerY, radius, 12, 4, 0xffffff);
        this.type = "analog-6";
        break;
      case 7:
        this.drawDots(ctx, centerX, centerY, radius, 60, 4, 0x404040);
        this.drawDots(ctx, centerX, centerY, radius, 12, 4, 0xffffff);
        this.drawNumbersWhite(ctx, centerX, centerY, radius);
        this.type = "analog-7";
        break;
      case 8:
        this.drawDots(ctx, centerX, centerY, radius, 12, 5, 0xffffff);
        this.type = "analog-8";
        break;
    }
  }

  drawHands(now) {
    const ctx = this.clockGraphics;
    const centerX = this.centerX;
    const centerY = this.centerY;
    const radius = this.radius;

    const hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    switch (this.clockType) {
      case 1:
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius * 0.35,
          12,
          0x404040,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius * 0.65,
          8,
          0x737373,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (seconds * Math.PI) / 30,
          radius * 0.93,
          4,
          0xcccccc,
        );
        break;

      case 2:
        this.drawComplexHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0x737373,
          0.43,
          0.33,
        );
        this.drawComplexHand(
          ctx,
          centerX,
          centerY,
          (seconds * Math.PI) / 30,
          radius,
          12,
          0xfb9739,
          0.9,
          1.0,
        );
        this.drawComplexHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          12,
          0x1e1e1e,
          1.0,
          0.3,
        );

        // Центральный кружок
        ctx.circle(centerX, centerY, 10);
        ctx.fill({ color: 0xffffff });
        break;

      case 3:
      case 4:
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          8,
          0xffffff,
          0x737373,
          0.2,
          0.25,
        );
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0xffffff,
          0x737373,
          0.2,
          0.4,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius);
        break;

      case 5:
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius * 0.35,
          12,
          0x737373,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius * 0.65,
          8,
          0xcccccc,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (seconds * Math.PI) / 30,
          radius * 0.9,
          4,
          0xffffff,
        );
        break;

      case 6:
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          8,
          0xffffff,
          0xffffff,
          0.2,
          0.25,
        );
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0xffffff,
          0xffffff,
          0.2,
          0.4,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius, 0x737373);
        break;

      case 7:
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius,
          8,
          0x737373,
          0x737373,
          0.2,
          0.25,
        );
        this.drawDoubleHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius,
          8,
          0x737373,
          0x737373,
          0.2,
          0.4,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius, 0xffffff);
        break;

      case 8:
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (hours * Math.PI) / 6,
          radius * 0.45,
          8,
          0xffffff,
        );
        this.drawHand(
          ctx,
          centerX,
          centerY,
          (minutes * Math.PI) / 30,
          radius * 0.7,
          8,
          0xffffff,
        );
        this.drawSecondHand(ctx, centerX, centerY, seconds, radius, 0xffffff);
        break;
    }
  }

  drawHand(ctx, centerX, centerY, angle, length, width, color) {
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.sin(angle) * length,
      centerY - Math.cos(angle) * length,
    );
    ctx.stroke({ width: width, color: color, cap: "round" });
  }

  drawComplexHand(
    ctx,
    centerX,
    centerY,
    angle,
    radius,
    width,
    color,
    startRatio,
    endRatio,
  ) {
    const startLength = radius * startRatio;
    const endLength = radius * endRatio;

    const startX = centerX + Math.sin(angle) * startLength;
    const startY = centerY - Math.cos(angle) * startLength;
    const endX = centerX + Math.sin(angle) * endLength;
    const endY = centerY - Math.cos(angle) * endLength;

    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke({ width: width, color: color, cap: "round" });
  }

  drawDoubleHand(
    ctx,
    centerX,
    centerY,
    angle,
    radius,
    width,
    outerColor,
    innerColor,
    innerRatio,
    outerRatio,
  ) {
    this.drawComplexHand(
      ctx,
      centerX,
      centerY,
      angle,
      radius,
      width,
      outerColor,
      innerRatio,
      outerRatio,
    );
    this.drawComplexHand(
      ctx,
      centerX,
      centerY,
      angle,
      radius,
      width - 4,
      innerColor,
      0,
      innerRatio,
    );
  }

  drawSecondHand(ctx, centerX, centerY, seconds, radius, color = 0x000000) {
    const angle = (seconds * Math.PI) / 30 - Math.PI / 2;

    ctx.moveTo(centerX, centerY);
    ctx.lineTo(
      centerX + Math.cos(angle) * radius * 0.9,
      centerY + Math.sin(angle) * radius * 0.9,
    );
    ctx.stroke({ width: 3, color: color, cap: "round" });

    // Центральный кружок
    ctx.circle(centerX, centerY, 4);
    ctx.fill({ color: color });
  }

  drawDots(ctx, centerX, centerY, radius, count, size, color) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x = centerX + Math.cos(angle) * radius * 0.95;
      const y = centerY + Math.sin(angle) * radius * 0.95;

      ctx.circle(x, y, size);
      ctx.fill({ color: color });
    }
  }

  drawLines(ctx, centerX, centerY, radius, count, width, color) {
    for (let i = 0; i < count; i++) {
      const angle = (i * 2 * Math.PI) / count;
      const x1 = centerX + Math.cos(angle) * radius * 0.85;
      const y1 = centerY + Math.sin(angle) * radius * 0.85;
      const x2 = centerX + Math.cos(angle) * radius * 0.75;
      const y2 = centerY + Math.sin(angle) * radius * 0.75;

      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke({ width: width, color: color, cap: "round" });
    }
  }

  drawNumbers(ctx, centerX, centerY, radius) {
    const style = new TextStyle({
      fontFamily: "Rubik",
      fontSize: radius * 0.18,
      fill: 0x000000,
      fontWeight: 300,
    });

    for (let num = 1; num <= 12; num++) {
      const angle = (num * Math.PI) / 6;
      const x = centerX + Math.sin(angle) * radius * 0.8;
      const y = centerY - Math.cos(angle) * radius * 0.8;

      const text = new Text(num.toString(), style);
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      this.contentContainer.addChild(text);
    }
  }

  drawNumbersWhite(ctx, centerX, centerY, radius) {
    const style = new TextStyle({
      fontFamily: "Rubik",
      fontSize: radius * 0.18,
      fill: 0xffffff,
      fontWeight: 300,
    });

    for (let num = 1; num <= 12; num++) {
      const angle = (num * Math.PI) / 6;
      const x = centerX + Math.sin(angle) * radius * 0.75;
      const y = centerY - Math.cos(angle) * radius * 0.75;

      const text = new Text(num.toString(), style);
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      this.contentContainer.addChild(text);
    }
  }
  onResize(width, height) {
    this._width = width;
    this._height = height;

    // Рассчитываем масштаб
    const scale = Math.min(
      width / this.originalWidth,
      height / this.originalHeight,
    );

    // Масштабируем контент пропорционально, чтобы текст не искажался
    this.contentContainer.scale.set(scale);
    this.contentContainer.x = (width - this.originalWidth * scale) / 2;
    this.contentContainer.y = (height - this.originalHeight * scale) / 2;

    // Перерисовываем фон
    this._redrawBackground();
    this.layoutCustomAssets();
  }
  // === API для управления стилем ===
  _redrawBackground() {
    this.bg.clear();

    // Фон
    this.bg
      .beginFill(this._backgroundColor, this._backgroundAlpha)
      .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
      .endFill();
  }

  setColor(color) {
    this._backgroundColor = color;
    this._redrawBackground();
  }

  setAlpha(alpha) {
    this._backgroundAlpha = alpha;
    this._redrawBackground();
  }
  setCornerRadius(radius) {
    this._cornerRadius = radius;
    this._redrawBackground();
  }

  setBackgroundColor(color) {
    this.setColor(color);
  }

  setBackgroundAlpha(alpha) {
    this.setAlpha(alpha);
  }

  getSceneData() {
    return {
      ...super.getSceneData?.(),
      analogClockData: {
        clockType: this.clockType,
        customFaceId: this.customFaceId,
        customHourHandId: this.customHourHandId,
        customMinuteHandId: this.customMinuteHandId,
        customSecondHandId: this.customSecondHandId,
        customHandsScale: this.customHandsScale,
        customSecondHandVisible: this.customSecondHandVisible,
      },
    };
  }

  destroy(options) {
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    super.destroy(options);
  }
}
