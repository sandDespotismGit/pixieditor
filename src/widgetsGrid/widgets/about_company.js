// CompanyWidget.js
import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import * as PIXI from "pixi.js"; // Для модульной системы

function getCurrentPanelIdentifier(fallback = "") {
  const params =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : new URLSearchParams();
  return String(
    (typeof window !== "undefined" && window.__ipanelFabricNumber) ||
      (typeof window !== "undefined" && window.__ipanelPanelFabricNumber) ||
      params.get("fabric_number") ||
      params.get("fabric") ||
      params.get("panel_fabric") ||
      params.get("panel_id") ||
      fallback ||
      "",
  ).trim();
}

function buildPanelQrUrl(panelIdentifier = "") {
  const identifier = getCurrentPanelIdentifier(panelIdentifier);
  return `https://admin.i-panel.pro:8787/api/panels/qr/${encodeURIComponent(
    identifier || "unknown",
  )}.png`;
}

export default class CompanyWidget extends DraggableWidget {
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

    // Определяем тип виджета по опциям
    const isCompanyInfo = options.type === "info";
    const isCompanyLogos = options.type === "logos";
    const isCompanySimpleLogos = options.type === "simple-logos";
    const isCompanyQrOnly = options.type === "qr-only";

    super(bounds, content, options);
    // Сохраните исходные размеры для расчета масштаба
    this.originalWidth = width;
    this.originalHeight = height;

    // Сохраняем текстовые элементы для последующего изменения
    this.textElements = {};

    this._fontFamily = options.fontFamily || "Rubik";
    this._textColor = options.textColor ?? 0xffffff;
    this._panelFabricNumber = options.panelFabricNumber || "";
    this._autoPanelQr = options.autoPanelQr === true;

    if (isCompanyInfo) {
      createCompanyInfoContent(content, width, height, this.textElements);
      this.type = "info";
      this.setCompanyName(options.companyName || "Meteor");
      this.setPhoneNumber(options.phoneNumber || "+7 (925) 533-22-33");
      this.setFontFamily(this._fontFamily);
      this.setTextColor(this._textColor);
    } else if (isCompanyLogos) {
      createCompanyLogosContent(content, width, height);
      this.type = "logos";
    } else if (isCompanySimpleLogos) {
      createCompanySimpleLogosContent(content, width, height);
      this.type = "simple-logos";
    } else if (isCompanyQrOnly) {
      createCompanyQrOnlyContent(content, width, height);
      this.type = "qr-only";
    }

    this._width = width;
    this._height = height;
    this.bg = bg;

    // Сохраняем стили
    this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
    this._backgroundAlpha = options.backgroundAlpha ?? 1;
    this._cornerRadius = options.cornerRadius ?? 32;

    this._borderColor = options.borderColor ?? 0xffffff;
    this._borderAlpha = options.borderAlpha ?? 1;
    this._borderWidth = options.borderWidth ?? 0;

    // Загружаем изображения если это логотипы
    if (isCompanyLogos || isCompanySimpleLogos || isCompanyQrOnly) {
      this.loadLogos();
    }

    // Первая отрисовка
    this._redrawBackground();
  }

  async loadLogos() {
    const logoUrls = {
      qr: buildPanelQrUrl(this._panelFabricNumber),
      ipanel: "https://admin.i-panel.pro:8787/static/light_ipanel.svg",
      liftbrand: "https://admin.i-panel.pro:8787/static/light_liftbrand.svg",
      videovision: "https://admin.i-panel.pro:8787/static/light_videovision.svg",
    };

    try {
      // Для виджета с логотипами в колонке
      if (this.content.ipanelLogo && this.content.liftbrandLogo) {
        const ipanelTexture = await PIXI.Assets.load(logoUrls.ipanel);
        const liftbrandTexture = await PIXI.Assets.load(logoUrls.liftbrand);

        this.content.ipanelLogo.texture = ipanelTexture;
        this.content.liftbrandLogo.texture = liftbrandTexture;

        // Устанавливаем размер для ipanel
        this.content.ipanelLogo.width = 116;
        this.content.ipanelLogo.height = 12;
      }

      // Для всех виджетов загружаем QR и другие логотипы
      if (this.content.qrLogo) {
        const qrTexture = await PIXI.Assets.load(logoUrls.qr);
        this.content.qrLogo.texture = qrTexture;
        this._resizeQrLogo();
      }

      if (this.content.videovisionLogo) {
        const videovisionTexture = await PIXI.Assets.load(logoUrls.videovision);
        this.content.videovisionLogo.texture = videovisionTexture;
      }

      // Для простого виджета с логотипами
      if (this.content.simpleIpanelLogo) {
        const ipanelTexture = await PIXI.Assets.load(logoUrls.ipanel);
        this.content.simpleIpanelLogo.texture = ipanelTexture;
      }

      if (this.content.simpleLiftbrandLogo) {
        const liftbrandTexture = await PIXI.Assets.load(logoUrls.liftbrand);
        this.content.simpleLiftbrandLogo.texture = liftbrandTexture;
      }
    } catch (error) {
      console.error("Error loading logos:", error);
    }
  }

  _resizeQrLogo() {
    const qrLogo = this.content?.qrLogo;
    if (!qrLogo) return;

    const width = this._width || this.originalWidth;
    const height = this._height || this.originalHeight;
    const role = this.content.qrLogoRole || this.type;

    let size;
    if (role === "qr-only") {
      size = Math.max(36, Math.min(width, height) * 0.72);
    } else if (role === "simple-logos") {
      size = Math.max(28, Math.min(height * 0.58, width * 0.16, 78));
    } else {
      size = Math.max(28, Math.min(height * 0.58, width * 0.16, 72));
    }

    qrLogo.width = size;
    qrLogo.height = size;
  }

  destroy(options) {
    super.destroy(options);
  }

  // === API для управления стилем ===
  _redrawBackground() {
    this.bg.clear();

    // Фон
    this.bg
      .beginFill(this._backgroundColor, this._backgroundAlpha)
      .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
      .endFill();

    // Рамка: только stroke без заливки поверх виджета.
    if (this._borderWidth > 0 && this._borderAlpha > 0) {
      const inset = this._borderWidth / 2;
      this.bg
        .roundRect(
          inset,
          inset,
          Math.max(0, this._width - this._borderWidth),
          Math.max(0, this._height - this._borderWidth),
          Math.max(0, this._cornerRadius - inset),
        )
        .stroke({
          width: this._borderWidth,
          color: this._borderColor,
          alpha: this._borderAlpha,
        });
    }
  }

  onResize(width, height) {
    this._width = width;
    this._height = height;

    // Рассчитываем коэффициенты масштабирования
    const scale = Math.min(
      width / this.originalWidth,
      height / this.originalHeight,
    );

    // Находим основной контейнер с контентом (логотипы, текст)
    // Это последний добавленный child в this.content
    const mainContentContainer =
      this.content.children[this.content.children.length - 1];

    // Применяем масштаб ко всему внутреннему контенту
    if (mainContentContainer) {
      mainContentContainer.scale.set(scale);
      // Центрируем контент после масштабирования
      mainContentContainer.x = this._width / 2;
      mainContentContainer.y = this._height / 2;
    }

    // Перерисовываем фон
    this._redrawBackground();
    this._resizeQrLogo();
  }

  // === МЕТОДЫ ДЛЯ ИЗМЕНЕНИЯ ТЕКСТА ===

  /**
   * Устанавливает название компании
   * @param {string} companyName - Название компании
   */
  setCompanyName(companyName) {
    if (this.textElements.companyValue) {
      this.textElements.companyValue.text = companyName;
    }
  }

  /**
   * Получает текущее название компании
   * @returns {string} Название компании
   */
  getCompanyName() {
    return this.textElements.companyValue ? this.textElements.companyValue.text : '';
  }

  /**
   * Устанавливает номер телефона поддержки
   * @param {string} phoneNumber - Номер телефона
   */
  setPhoneNumber(phoneNumber) {
    if (this.textElements.phoneValue) {
      this.textElements.phoneValue.text = phoneNumber;
    }
  }

  /**
   * Получает текущий номер телефона
   * @returns {string} Номер телефона
   */
  getPhoneNumber() {
    return this.textElements.phoneValue ? this.textElements.phoneValue.text : '';
  }

  /**
   * Устанавливает оба текста сразу
   * @param {string} companyName - Название компании
   * @param {string} phoneNumber - Номер телефона
   */
  setTexts(companyName, phoneNumber) {
    this.setCompanyName(companyName);
    this.setPhoneNumber(phoneNumber);
  }

  /**
   * Получает оба текста
   * @returns {object} Объект с companyName и phoneNumber
   */
  getTexts() {
    return {
      companyName: this.getCompanyName(),
      phoneNumber: this.getPhoneNumber(),
    };
  }

  setTextColor(color) {
    this._textColor = color;
    Object.values(this.textElements).forEach((text) => {
      if (text?.style) text.style.fill = color;
    });
  }

  setFontFamily(fontFamily) {
    this._fontFamily = fontFamily;
    Object.values(this.textElements).forEach((text) => {
      if (text?.style) text.style.fontFamily = fontFamily;
    });
  }

  getFontFamily() {
    return this._fontFamily;
  }

  getSceneData() {
    return {
      ...super.getSceneData(),
      type: this.type,
      autoPanelQr: this._autoPanelQr,
      panelFabricNumber: this._panelFabricNumber,
      companyName: this.getCompanyName(),
      phoneNumber: this.getPhoneNumber(),
      textColor: this._textColor,
      fontFamily: this._fontFamily,
    };
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

  setPanelFabricNumber(panelFabricNumber) {
    this._panelFabricNumber = String(panelFabricNumber || "").trim();
    if (this.content?.qrLogo) {
      this.loadLogos();
    }
  }

  setBackgroundColor(color) {
    this.setColor(color);
  }

  setBackgroundAlpha(alpha) {
    this.setAlpha(alpha);
  }

  // === Методы для рамки ===
  setBorderColor(color) {
    this._borderColor = color;
    this._redrawBackground();
  }

  setBorderAlpha(alpha) {
    this._borderAlpha = alpha;
    this._redrawBackground();
  }

  setBorderWidth(width) {
    this._borderWidth = width;
    this._redrawBackground();
  }

  // === Размеры ===
  setSize(width, height) {
    this._width = width;
    this._height = height;
    this._redrawBackground();
  }
}

// Вспомогательные функции для создания контента
function createCompanyInfoContent(content, width, height, textElements) {
  const styleLabel = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 18,
    fill: 0x737373,
    fontWeight: 300,
    resolution: 2,
  });

  const styleValue = new TextStyle({
    fontFamily: "Rubik",
    fontSize: 18,
    fill: 0xffffff,
    fontWeight: 300,
    resolution: 2,
  });

  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // Первая строка: информация о компании
  const companyContainer = new Container();
  companyContainer.y = -20;

  const companyLabel = new Text("Лифт обслуживает компания  ", styleLabel);
  companyLabel.anchor.set(0.5);
  companyLabel.x = -100;
  companyContainer.addChild(companyLabel);

  const companyValue = new Text("Meteor", styleValue);
  companyValue.anchor.set(0.5);
  companyValue.x = 200;
  companyContainer.addChild(companyValue);

  // Вторая строка: телефон поддержки
  const phoneContainer = new Container();
  phoneContainer.y = 20;

  const phoneLabel = new Text("Телефон поддержки  ", styleLabel);
  phoneLabel.anchor.set(0.5);
  phoneLabel.x = -140;
  phoneContainer.addChild(phoneLabel);

  const phoneValue = new Text("+7 (925) 533-22-33", styleValue);
  phoneValue.anchor.set(0.5);
  phoneValue.x = 160;
  phoneContainer.addChild(phoneValue);

  container.addChild(companyContainer);
  container.addChild(phoneContainer);
  content.addChild(container);

  // Сохраняем ссылки на текстовые элементы
  textElements.companyValue = companyValue;
  textElements.phoneValue = phoneValue;
}

function createCompanyLogosContent(content, width, height) {
  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // QR код слева
  const qrLogo = Sprite.from(PIXI.Texture.EMPTY);
  qrLogo.anchor.set(0.5);
  qrLogo.x = -150;
  container.addChild(qrLogo);

  // Центральная колонка с логотипами
  const logosColumn = new Container();
  logosColumn.x = 0;

  const ipanelLogo = Sprite.from(PIXI.Texture.EMPTY);
  ipanelLogo.anchor.set(0.5);
  ipanelLogo.y = -15;
  logosColumn.addChild(ipanelLogo);

  // Пространство между логотипами
  const space = new Container();
  space.y = 0;
  logosColumn.addChild(space);

  const liftbrandLogo = Sprite.from(PIXI.Texture.EMPTY);
  liftbrandLogo.anchor.set(0.5);
  liftbrandLogo.y = 15;
  logosColumn.addChild(liftbrandLogo);

  container.addChild(logosColumn);

  // Видеовидение справа
  const videovisionLogo = Sprite.from(PIXI.Texture.EMPTY);
  videovisionLogo.anchor.set(0.5);
  videovisionLogo.x = 150;
  container.addChild(videovisionLogo);

  content.addChild(container);

  // Сохраняем ссылки для загрузки текстур
  content.qrLogo = qrLogo;
  content.qrLogoRole = "logos";
  content.ipanelLogo = ipanelLogo;
  content.liftbrandLogo = liftbrandLogo;
  content.videovisionLogo = videovisionLogo;
}

function createCompanySimpleLogosContent(content, width, height) {
  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  // Равномерно распределяем логотипы по ширине

  // QR код
  const qrLogo = Sprite.from(PIXI.Texture.EMPTY);
  qrLogo.anchor.set(0.5);
  qrLogo.x = -width / 2 + 60;
  container.addChild(qrLogo);

  // iPanel логотип
  const ipanelLogo = Sprite.from(PIXI.Texture.EMPTY);
  ipanelLogo.anchor.set(0.5);
  ipanelLogo.x = -60;
  container.addChild(ipanelLogo);

  // LiftBrand логотип
  const liftbrandLogo = Sprite.from(PIXI.Texture.EMPTY);
  liftbrandLogo.anchor.set(0.5);
  liftbrandLogo.x = width / 2 - 120;
  container.addChild(liftbrandLogo);

  content.addChild(container);

  // Сохраняем ссылки для загрузки текстур
  content.qrLogo = qrLogo;
  content.qrLogoRole = "simple-logos";
  content.simpleIpanelLogo = ipanelLogo;
  content.simpleLiftbrandLogo = liftbrandLogo;
}

function createCompanyQrOnlyContent(content, width, height) {
  const container = new Container();
  container.x = width / 2;
  container.y = height / 2;

  const qrLogo = Sprite.from(PIXI.Texture.EMPTY);
  qrLogo.anchor.set(0.5);
  container.addChild(qrLogo);

  content.addChild(container);
  content.qrLogo = qrLogo;
  content.qrOnlyLogo = qrLogo;
  content.qrLogoRole = "qr-only";
}
