// CompanyWidget.js
import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import * as PIXI from "pixi.js"; // Для модульной системы

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

    super(bounds, content, options);
    // Сохраните исходные размеры для расчета масштаба
    this.originalWidth = width;
    this.originalHeight = height;

    if (isCompanyInfo) {
      createCompanyInfoContent(content, width, height);
      this.type = "info";
    } else if (isCompanyLogos) {
      createCompanyLogosContent(content, width, height);
      this.type = "logos";
    } else if (isCompanySimpleLogos) {
      createCompanySimpleLogosContent(content, width, height);
      this.type = "simplelogos";
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
    if (isCompanyLogos || isCompanySimpleLogos) {
      this.loadLogos();
    }

    // Первая отрисовка
    this._redrawBackground();
  }

  async loadLogos() {
    const logoUrls = {
      qr: "http://212.41.9.251:8000/static/light_qr.svg",
      ipanel: "http://212.41.9.251:8000/static/light_ipanel.svg",
      liftbrand: "http://212.41.9.251:8000/static/light_liftbrand.svg",
      videovision: "http://212.41.9.251:8000/static/light_videovision.svg",
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

    // Рамка (если есть толщина)
    if (this._borderWidth > 0) {
      this.bg.fill(this._borderWidth, this._borderColor, this._borderAlpha);
      this.bg.drawRoundedRect(
        0,
        0,
        this._width,
        this._height,
        this._cornerRadius,
      );
    }
  }
  onResize(width, height) {
    this._width = width;
    this._height = height;

    // Рассчитываем коэффициенты масштабирования
    const scaleX = width / this.originalWidth;
    const scaleY = height / this.originalHeight;

    // Находим основной контейнер с контентом (логотипы, текст)
    // Это последний добавленный child в this.content
    const mainContentContainer =
      this.content.children[this.content.children.length - 1];

    // Применяем масштаб ко всему внутреннему контенту
    if (mainContentContainer) {
      mainContentContainer.scale.set(scaleX, scaleY);
      // Центрируем контент после масштабирования
      mainContentContainer.x = this._width / 2;
      mainContentContainer.y = this._height / 2;
    }

    // Перерисовываем фон
    this._redrawBackground();
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
function createCompanyInfoContent(content, width, height) {
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
  content.simpleIpanelLogo = ipanelLogo;
  content.simpleLiftbrandLogo = liftbrandLogo;
}
