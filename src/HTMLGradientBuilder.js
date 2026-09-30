export default class HTMLGradientBuilder {
  constructor(editor) {
    this.editor = editor;
    this.app = editor.app;

    // ЕДИНОЕ ХРАНИЛИЩЕ ТЕКУЩЕГО ФОНА
    this.currentBackground = {
      type: "color", // "color", "gradient", "video", "image"
      data: {
        color: 0x1e1e1e,
        alpha: 1,
      },
      appliedAt: Date.now(),
    };

    // Для обратной совместимости
    this.lastAppliedGradient = null;
    this.lastAppliedVideo = null;

    // ВИДЕО-ОБОИ ЗДЕСЬ
    this.animatedPresets = [
      {
        name: "1",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/5188-183786466.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "2",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/24216-340670744.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "3",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/67354-521707462_small.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "4",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/178908-860734672.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "5",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/184069-872413642_small.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "6",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/204565-924698132_small.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "7",
        type: "video",
        videoUrl: "https://admin.i-panel.pro:8787/static/300/206846.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "8",
        type: "video",
        videoUrl: "https://admin.i-panel.pro:8787/static/300/214409_small.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "9",
        type: "video",
        videoUrl: "https://admin.i-panel.pro:8787/static/300/259267.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "10",
        type: "video",
        videoUrl: "https://admin.i-panel.pro:8787/static/300/314643_small.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "11",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/4182916-hd_1920_1080_30fps.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },

      {
        name: "12",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.).mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "13",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-2.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "14",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-3.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "15",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-4.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "16",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-5.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "17",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-6.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
      {
        name: "18",
        type: "video",
        videoUrl:
          "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-7.mp4",
        thumbnail: "",
        loop: true,
        muted: true,
        description: "",
      },
    ];

    // СТАТИЧНЫЕ ГРАДИЕНТЫ
    this.staticPresets = [
      {
        name: "🌅 Закат на пляже",
        type: "linear",
        colorStops: [
          { offset: 0, color: "#ff6b35" },
          { offset: 0.5, color: "#f0134d" },
          { offset: 1, color: "#8a2be2" },
        ],
        angle: 135,
      },
      {
        name: "🌊 Глубины океана",
        type: "linear",
        colorStops: [
          { offset: 0, color: "#00b4db" },
          { offset: 0.5, color: "#0083b0" },
          { offset: 1, color: "#004466" },
        ],
        angle: 45,
      },
      {
        name: "🔥 Огненный градиент",
        type: "linear",
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 0.5, color: "#ffff00" },
          { offset: 1, color: "#ff4500" },
        ],
        angle: 90,
      },
      {
        name: "🌈 Радужный спектр",
        type: "linear",
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 0.17, color: "#ff7f00" },
          { offset: 0.33, color: "#ffff00" },
          { offset: 0.5, color: "#00ff00" },
          { offset: 0.67, color: "#0000ff" },
          { offset: 0.83, color: "#4b0082" },
          { offset: 1, color: "#9400d3" },
        ],
        angle: 90,
      },
      {
        name: "🌙 Лунная ночь",
        type: "radial",
        colorStops: [
          { offset: 0, color: "#0f2027" },
          { offset: 0.4, color: "#203a43" },
          { offset: 0.8, color: "#2c5364" },
        ],
        center: { x: 0.5, y: 0.5 },
      },
      {
        name: "💎 Кристальный градиент",
        type: "radial",
        colorStops: [
          { offset: 0, color: "#667eea" },
          { offset: 0.3, color: "#764ba2" },
          { offset: 0.7, color: "#f093fb" },
        ],
        center: { x: 0.5, y: 0.5 },
      },
    ];

    this.canvas = null;
    this.context = null;
    this.initialized = false;

    this.uploadedImage = null;
    this.uploadedVideoUrl = null;
    this.uploadedVideoMeta = null;
    this.videoElement = null;
    this.videoTexture = null;
    this.videoAnimationFrame = null;

    this.customGradient = {
      type: "linear",
      colorStops: [
        { offset: 0, color: "#ff0000" },
        { offset: 1, color: "#0000ff" },
      ],
      angle: 90,
    };

    this.activeGradientTexture = null;
    this.backgroundApplyToken = 0;
  }

  // ======================== ОСНОВНЫЕ МЕТОДЫ ========================

  synchronizeWithEditor() {
    console.log("🔄 Синхронизация с редактором...");

    // Убеждаемся, что редактор знает о текущем фоне
    if (this.editor && this.editor.changeBackground) {
      // Если у нас есть активная текстура, передаем её в редактор
      if (this.activeGradientTexture) {
        this.editor.changeBackground({
          texture: this.activeGradientTexture,
          alpha: 1,
          isGradientTexture: true,
          gradientConfig: this.currentBackground.data,
        });
      } else if (this.videoTexture) {
        this.editor.changeBackground({
          texture: this.videoTexture,
          alpha: 1,
          isVideoTexture: true,
          videoElement: this.videoElement,
        });
      } else {
        // Иначе просто цвет
        this.editor.changeBackground({
          color: this.currentBackground.data.color || 0x1e1e1e,
          alpha: this.currentBackground.data.alpha || 1,
        });
      }
    }
  }

  saveCurrentBackground(type, data) {
    this.currentBackground = {
      type: type,
      data: JSON.parse(JSON.stringify(data)),
      appliedAt: Date.now(),
    };

    // Обратная совместимость
    if (type === "gradient") {
      this.lastAppliedGradient = data;
      this.lastAppliedVideo = null;
    } else if (type === "video") {
      this.lastAppliedVideo = data;
      this.lastAppliedGradient = null;
    } else {
      this.lastAppliedGradient = null;
      this.lastAppliedVideo = null;
    }

    console.log(`✅ Фон сохранен: ${type}`, data);
  }

  getApiBaseUrl() {
    return window.getApiBaseUrl?.() || "https://admin.i-panel.pro:8787";
  }

  getPanelIdForUpload() {
    const urlParams = new URLSearchParams(window.location.search);
    return window.getPanelId?.() || urlParams.get("panel_id");
  }

  async uploadBackgroundVideo(file) {
    const panelId = this.getPanelIdForUpload();
    if (!panelId) {
      throw new Error("panel_id не найден в URL");
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(
      `${this.getApiBaseUrl()}/api/new_file/${panelId}/upload-background`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
        },
        body: formData,
      },
    );

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Ошибка загрузки видеофона: ${response.status} ${details}`);
    }

    return response.json();
  }

  getBackgroundDataForExport() {
    return {
      type: this.currentBackground.type,
      ...this.currentBackground.data,
      appliedAt: this.currentBackground.appliedAt,
    };
  }

  async restoreBackgroundFromData(backgroundData) {
    if (!backgroundData || !backgroundData.type) {
      console.warn("Нет данных для восстановления фона");
      this.applySolidColorInternal(0x1e1e1e);
      return;
    }

    console.log(`🔄 Восстанавливаем фон типа: ${backgroundData.type}`);
    const backgroundPayload = backgroundData.data || backgroundData;

    switch (backgroundData.type) {
      case "color":
        this.applySolidColorInternal(
          backgroundPayload.color,
          backgroundPayload.alpha || 1,
        );
        break;
      case "gradient":
        await this.restoreGradientBackground(backgroundPayload);
        break;
      case "video":
        await this.restoreVideoBackground(backgroundPayload);
        break;
      case "image":
        await this.restoreImageBackground(backgroundPayload);
        break;
      default:
        this.applySolidColorInternal(0x1e1e1e);
    }
  }

  async restoreGradientBackground(gradientData) {
    try {
      this.stopVideoBackground();
      this.cleanupGradientTexture();

      const texture = this.createGradientTexture(gradientData);
      this.activeGradientTexture = texture;

      this.saveCurrentBackground("gradient", gradientData);

      if (this.editor?.changeBackground) {
        this.editor.changeBackground({
          texture: texture,
          alpha: 1,
          isGradientTexture: true,
          texturePath: `gradient-restored-${Date.now()}`,
          gradientConfig: gradientData,
        });
      }
    } catch (error) {
      console.error("❌ Ошибка восстановления градиента:", error);
      this.applySolidColorInternal(0x1e1e1e);
    }
  }

  async restoreVideoBackground(videoData) {
    try {
      if (!videoData.videoUrl) throw new Error("Нет URL видео");

      this.stopVideoBackground();
      this.cleanupGradientTexture();

      this.saveCurrentBackground("video", videoData);
      this.createVideoBackground(
        videoData.videoUrl,
        videoData.name || "Восстановленное видео",
      );
    } catch (error) {
      console.error("❌ Ошибка восстановления видео:", error);
      this.applySolidColorInternal(0x1e1e1e);
    }
  }

  async restoreImageBackground(imageData) {
    try {
      if (!imageData.imageUrl) throw new Error("Нет URL изображения");

      this.stopVideoBackground();
      this.cleanupGradientTexture();

      const image = new Image();
      image.src = imageData.imageUrl;

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const texture = PIXI.Texture.from(image);

      this.saveCurrentBackground("image", {
        imageUrl: imageData.imageUrl,
        name: imageData.name || "Изображение",
      });

      if (this.editor.changeBackground) {
        this.editor.changeBackground({
          texture: texture,
          alpha: 1,
          isImageTexture: true,
          texturePath: "restored-image-" + Date.now(),
        });
      }
    } catch (error) {
      console.error("❌ Ошибка восстановления изображения:", error);
      this.applySolidColorInternal(0x1e1e1e);
    }
  }

  applySolidColorInternal(color, alpha = 1) {
    this.saveCurrentBackground("color", {
      color: color,
      hex: this.rgbToHex(color),
      alpha: alpha,
    });

    if (this.editor?.changeBackground) {
      this.editor.changeBackground({
        color: color,
        alpha: alpha,
      });
    }
  }

  // ======================== СУЩЕСТВУЮЩИЕ МЕТОДЫ ========================

  init() {
    if (this.initialized) return;
    console.log("🚀 Инициализация конструктора фона...");
    try {
      this.createCanvas();
      this.createModal();
      this.setupEventListeners();
      this.loadAnimatedPresets();
      this.loadStaticPresets();
      this.initialized = true;
      console.log("✅ Конструктор фона инициализирован");
    } catch (error) {
      console.error("❌ Ошибка инициализации:", error);
    }
  }

  createCanvas() {
    const oldCanvas = document.getElementById("gradient-canvas");
    if (oldCanvas) oldCanvas.remove();
    this.canvas = document.createElement("canvas");
    this.canvas.id = "gradient-canvas";
    this.canvas.width = 2048;
    this.canvas.height = 2048;
    this.context = this.canvas.getContext("2d");
    this.canvas.style.display = "none";
    document.body.appendChild(this.canvas);
  }

  createModal() {
    if (document.getElementById("gradient-modal")) return;
    const controlsWidget = document.getElementById("background-controls");
    if (!controlsWidget) {
      console.warn("Background controls widget not found");
      return;
    }

    const button = document.createElement("button");
    button.id = "gradient-builder-btn";
    button.innerHTML = "🎨 Конструктор фона";
    button.style.cssText = `
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 10px;
      cursor: pointer;
      margin: 8px;
      font-weight: 600;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      width: 100%;
      font-size: 14px;
    `;
    button.addEventListener("mouseenter", () => {
      button.style.transform = "translateY(-2px)";
      button.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
    });
    button.addEventListener("mouseleave", () => {
      button.style.transform = "translateY(0)";
      button.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
    });
    button.addEventListener("click", () => this.openModal());
    controlsWidget.appendChild(button);

    const modal = document.createElement("div");
    modal.id = "gradient-modal";
    modal.style.cssText = `
  display: none;
  position: fixed;
  top: 50%;
  right: 0px;
  transform: translateY(-50%);
  width: 400px;
  max-height: 85vh;
  background: #1e1e2e;
  border-radius: 16px;
  padding: 0;
  z-index: 10000;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
  color: white;
  font-family: 'Inter', sans-serif;
  border: 1px solid #2d2d3d;
  overflow: hidden;
`;
    modal.innerHTML = `
  <!-- Заголовок с кнопкой закрытия -->
  <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: #1e1e2e; border-bottom: 1px solid #2d2d3d;">
    <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: white;">Настройки фона</h3>
    <button id="close-modal-btn" style="background: none; border: none; color: #a0a0b0; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;" 
            onmouseover="this.style.background='#2d2d3d'; this.style.color='white'" 
            onmouseout="this.style.background='none'; this.style.color='#a0a0b0'">
      ×
    </button>
  </div>

  <div style="padding: 20px; overflow-y: auto; max-height: calc(85vh - 80px);">
    <div style="display: flex; background: #2d2d3d; border-radius: 8px; padding: 4px; margin-bottom: 20px;">
      <button class="tab-btn active" data-tab="videos" style="flex: 1; padding: 10px 12px; background: #667eea; border: none; color: white; border-radius: 6px; cursor: pointer; font-size: 13px;">🎬 Видео-обои</button>
      <button class="tab-btn" data-tab="gradients" style="flex: 1; padding: 10px 12px; background: none; border: none; color: #a0a0b0; border-radius: 6px; cursor: pointer; font-size: 13px;">🎨 Градиенты</button>
      <button class="tab-btn" data-tab="custom" style="flex: 1; padding: 10px 12px; background: none; border: none; color: #a0a0b0; border-radius: 6px; cursor: pointer; font-size: 13px;">🖌️ Настроить</button>
      <button class="tab-btn" data-tab="upload" style="flex: 1; padding: 10px 12px; background: none; border: none; color: #a0a0b0; border-radius: 6px; cursor: pointer; font-size: 13px;">📁 Загрузить</button>
    </div>

    <div id="videos-tab" class="tab-content active">
      <label style="display: block; margin-bottom: 16px; font-weight: 600; color: white; font-size: 16px;">✨ Анимированные видео-обои</label>
      <div id="animated-presets-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;"></div>
    </div>

    <div id="gradients-tab" class="tab-content" style="display: none;">
      <label style="display: block; margin-bottom: 16px; font-weight: 600; color: white; font-size: 16px;">🎨 Статичные градиенты</label>
      <div id="static-presets-container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;"></div>
    </div>

    <div id="custom-tab" class="tab-content" style="display: none;">
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 14px;">Тип градиента</label>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px;">
          <button id="linear-type" class="gradient-type-btn active" data-type="linear" style="padding: 12px; background: #667eea; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 12px;">📏 Линейный</button>
          <button id="radial-type" class="gradient-type-btn" data-type="radial" style="padding: 12px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 8px; color: white; cursor: pointer; font-size: 12px;">🔴 Радиальный</button>
          <button id="conic-type" class="gradient-type-btn" data-type="conic" style="padding: 12px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 8px; color: white; cursor: pointer; font-size: 12px;">🌀 Конический</button>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 14px;">Направление (для линейного)</label>
        <input type="range" id="gradient-angle" min="0" max="360" step="1" value="90" style="width: 100%; height: 6px; border-radius: 3px; background: #3d3d4d; outline: none;">
        <div style="display: flex; justify-content: space-between; margin-top: 8px;">
          <span style="font-size: 12px; color: #a0a0b0;">0°</span>
          <span id="angle-value" style="font-size: 12px; color: white;">90°</span>
          <span style="font-size: 12px; color: #a0a0b0;">360°</span>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; gap: 8px;">
          <label style="font-weight: 600; color: white; font-size: 14px;">Цвета градиента</label>
          <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;">
            <button id="copy-gradient-settings" style="padding: 6px 10px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Копировать</button>
            <button id="paste-gradient-settings" style="padding: 6px 10px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">Вставить</button>
            <button id="add-color-stop" style="padding: 6px 10px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">+ Добавить</button>
          </div>
        </div>
        <div id="color-stops-container" style="margin-bottom: 16px; max-height: calc(85vh - 360px); min-height: 260px; overflow-y: auto; padding-right: 4px;"></div>
      </div>
    </div>

    <div id="upload-tab" class="tab-content" style="display: none;">
      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 14px;">🖼️ Загрузить изображение</label>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="file" id="image-upload-input" accept="image/*" style="display: none;">
          <button id="select-image-btn" style="flex: 1; padding: 12px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 8px; color: white; cursor: pointer; font-size: 13px;">Выбрать файл</button>
          <button id="apply-image-btn" style="padding: 12px 20px; background: #667eea; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 13px;">Применить</button>
        </div>
        <div id="image-preview-container" style="width: 100%; height: 100px; border-radius: 8px; border: 1px dashed #3d3d4d; display: flex; align-items: center; justify-content: center; color: #a0a0b0; font-size: 12px; overflow: hidden;">
          Выберите изображение
        </div>
      </div>

      <div style="margin-bottom: 24px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 14px;">🎥 Загрузить свое видео</label>
        <div style="display: flex; gap: 8px; margin-bottom: 12px;">
          <input type="file" id="video-upload-input" accept="video/*" style="display: none;">
          <button id="select-video-btn" style="flex: 1; padding: 12px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 8px; color: white; cursor: pointer; font-size: 13px;">Выбрать файл</button>
          <button id="apply-video-btn" style="padding: 12px 20px; background: #667eea; border: none; border-radius: 8px; color: white; cursor: pointer; font-size: 13px;">Применить</button>
        </div>
        <div id="video-preview-container" style="width: 100%; height: 100px; border-radius: 8px; border: 1px dashed #3d3d4d; display: flex; align-items: center; justify-content: center; color: #a0a0b0; font-size: 12px; overflow: hidden;">
          Выберите видео
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 12px; font-weight: 600; color: white; font-size: 14px;">🎨 Простой цвет</label>
        <div style="display: flex; gap: 12px; align-items: center;">
          <div class="ipanel-color-control" data-target="solid-color-picker" style="width: 50px; height: 50px; border-radius: 8px; border: 2px solid #3d3d4d; cursor: pointer; background: #1e1e1e;"></div>
          <input type="text" id="solid-color-picker" value="#1e1e1e" maxlength="7" style="width: 96px; padding: 12px; background: #1e1e2e; border: 1px solid #3d3d4d; border-radius: 8px; color: white; font-family: monospace; text-transform: uppercase;">
          <button id="apply-solid-color" style="flex: 1; padding: 14px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 10px; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">Применить цвет</button>
        </div>
        <div id="solid-color-palette" class="ipanel-color-palette" data-target="solid-color-picker" style="display: grid; grid-template-columns: repeat(8, 1fr); gap: 6px; margin-top: 10px;"></div>
      </div>
    </div>

    <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #2d2d3d;">
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
        <button id="reset-background" style="padding: 12px; background: #2d2d3d; color: white; border: 1px solid #3d3d4d; border-radius: 8px; cursor: pointer; font-weight: 500; font-size: 13px;">🗑️ Сбросить фон</button>
      </div>
    </div>
  </div>
`;
    document.body.appendChild(modal);

    // Добавляем обработчик для закрытия модального окна
    document
      .getElementById("close-modal-btn")
      .addEventListener("click", function () {
        modal.style.display = "none";
      });
    this.addCustomStyles();
    this.setupCustomGradientUI();
  }

  addCustomStyles() {
    const style = document.createElement("style");
    style.textContent = `
      .preset-btn, .gradient-preset-btn {
        padding: 16px;
        background: #2d2d3d;
        color: white;
        border: 1px solid #3d3d4d;
        border-radius: 12px;
        cursor: pointer;
        font-size: 13px;
        text-align: left;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
        min-height: 60px;
        font-weight: 500;
      }
      .preset-btn:hover, .gradient-preset-btn:hover {
        transform: translateY(-2px);
        border-color: #667eea;
        box-shadow: 0 6px 20px rgba(0,0,0,0.2);
      }
      .preset-btn .video-indicator {
        position: absolute;
        top: 8px;
        right: 8px;
        background: #ff4757;
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
      }
      .tab-btn.active {
        background: #667eea !important;
        color: white !important;
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      .gradient-type-btn.active {
        background: #667eea !important;
        border-color: #667eea !important;
      }
      #color-stops-container {
        scrollbar-width: thin;
        scrollbar-color: #667eea #2d2d3d;
      }
      .color-stop-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
        padding: 10px;
        background: #2d2d3d;
        border-radius: 8px;
        border: 1px solid #3d3d4d;
      }
      .color-stop-item input[type="color"] {
        display: none;
      }
      .ipanel-color-swatch {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 7px;
        border: 1px solid rgba(255,255,255,.2);
        cursor: pointer;
      }
      .ipanel-color-code {
        width: 82px;
        padding: 8px;
        background: #1e1e2e;
        border: 1px solid #3d3d4d;
        border-radius: 4px;
        color: white;
        text-align: center;
        font-family: monospace;
        text-transform: uppercase;
      }
      .color-stop-item input[type="range"] {
        flex: 1;
        height: 6px;
        border-radius: 3px;
        background: #3d3d4d;
      }
      .color-stop-item input[type="number"] {
        width: 60px;
        padding: 8px;
        background: #1e1e2e;
        border: 1px solid #3d3d4d;
        border-radius: 4px;
        color: white;
        text-align: center;
      }
      .color-stop-item button {
        background: #ff4757;
        color: white;
        border: none;
        border-radius: 4px;
        width: 30px;
        height: 30px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      #stop-video:hover {
        background: #ff6b81 !important;
        transform: translateY(-2px);
      }
      #reset-background:hover {
        background: #3d3d4d !important;
        border-color: #667eea !important;
        transform: translateY(-2px);
      }
      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #667eea;
        cursor: pointer;
        border: 2px solid white;
      }
    `;
    document.head.appendChild(style);
  }

  setupEventListeners() {
    document.addEventListener("click", (e) => {
      if (e.target.id === "close-gradient-modal") {
        this.closeModal();
      }
      if (e.target.id === "apply-solid-color") {
        this.applySolidColor();
      }
      if (e.target.classList.contains("ipanel-color-swatch")) {
        this.setColorInputValue(e.target.dataset.target, e.target.dataset.color);
      }
      if (e.target.id === "stop-video") {
        this.stopVideoBackground();
      }
      if (e.target.id === "reset-background") {
        this.resetBackground();
      }
      if (e.target.id === "select-image-btn") {
        document.getElementById("image-upload-input").click();
      }
      if (e.target.id === "apply-image-btn") {
        this.applyImageBackground();
      }
      if (e.target.id === "select-video-btn") {
        document.getElementById("video-upload-input").click();
      }
      if (e.target.id === "apply-video-btn") {
        this.applyVideoBackground();
      }
      const presetButton = e.target.closest?.(".preset-btn");
      if (presetButton) {
        const presetDataStr = presetButton.dataset.presetData;
        if (presetDataStr) {
          try {
            this.applyVideoPreset(JSON.parse(presetDataStr));
          } catch (error) {
            console.error("Ошибка парсинга данных видео-пресета:", error);
          }
        } else {
          const index = parseInt(presetButton.dataset.index);
          if (!isNaN(index) && this.animatedPresets[index]) {
            this.applyVideoPreset(this.animatedPresets[index]);
          }
        }
      }
      const gradientPresetButton = e.target.closest?.(".gradient-preset-btn");
      if (gradientPresetButton) {
        const index = parseInt(gradientPresetButton.dataset.index);
        if (!isNaN(index) && this.staticPresets[index]) {
          this.applyStaticGradientPreset(this.staticPresets[index]);
        }
      }
      if (e.target.classList.contains("tab-btn")) {
        e.stopPropagation();
        this.switchTab(e.target.dataset.tab);
      }
      if (e.target.classList.contains("gradient-type-btn")) {
        e.stopPropagation();
        document.querySelectorAll(".gradient-type-btn").forEach((btn) => {
          btn.style.background = "#2d2d3d";
          btn.style.border = "1px solid #3d3d4d";
        });
        e.target.style.background = "#667eea";
        e.target.style.border = "1px solid #667eea";
        this.customGradient.type = e.target.dataset.type;
      }
      if (e.target.id === "add-color-stop") {
        e.stopPropagation();
        this.addColorStop();
      }
      if (e.target.id === "copy-gradient-settings") {
        e.stopPropagation();
        this.copyGradientSettings();
      }
      if (e.target.id === "paste-gradient-settings") {
        e.stopPropagation();
        this.pasteGradientSettings();
      }
      if (e.target.classList.contains("remove-color-stop")) {
        e.stopPropagation();
        const index = parseInt(e.target.dataset.index);
        this.removeColorStop(index);
      }
    });

    document
      .getElementById("image-upload-input")
      ?.addEventListener("change", (e) => {
        this.handleImageUpload(e);
      });

    document
      .getElementById("video-upload-input")
      ?.addEventListener("change", (e) => {
        this.handleVideoUpload(e);
      });

    document
      .getElementById("gradient-angle")
      ?.addEventListener("input", (e) => {
        const angle = e.target.value;
        document.getElementById("angle-value").textContent = `${angle}°`;
        this.customGradient.angle = parseInt(angle);
      });

    document
      .getElementById("solid-color-picker")
      ?.addEventListener("input", (e) => {
        const color = this.normalizeHexColor(e.target.value);
        if (color) this.syncSolidColorControl(color);
      });

    // Исправляем обработчики для всех input элементов внутри color stops
    document.addEventListener("input", (e) => {
      // Проверяем, что событие происходит внутри модального окна
      if (e.target.closest("#gradient-modal")) {
        e.stopPropagation(); // ← ВАЖНО

        if (e.target.classList.contains("color-input")) {
          const index = parseInt(e.target.dataset.index);
          const color = this.normalizeHexColor(e.target.value);
          if (color) {
            this.customGradient.colorStops[index].color = color;
            this.syncColorControl(e.target);
          }
        }
        if (e.target.classList.contains("color-code-input")) {
          const index = parseInt(e.target.dataset.index);
          const color = this.normalizeHexColor(e.target.value);
          if (color) {
            this.customGradient.colorStops[index].color = color;
            const hiddenInput = document.querySelector(
              `.color-input[data-index="${index}"]`,
            );
            if (hiddenInput) hiddenInput.value = color;
            this.syncColorControl(hiddenInput || e.target);
            this.applyCustomGradient();
          }
        }
        if (e.target.classList.contains("offset-slider")) {
          const index = parseInt(e.target.dataset.index);
          const value = parseFloat(e.target.value);
          this.customGradient.colorStops[index].offset = value;
          const numberInput = document.querySelector(
            `.offset-input[data-index="${index}"]`,
          );
          if (numberInput) numberInput.value = value.toFixed(2);
        }
        if (e.target.classList.contains("offset-input")) {
          const index = parseInt(e.target.dataset.index);
          let value = parseFloat(e.target.value);
          if (isNaN(value)) value = 0;
          value = Math.max(0, Math.min(1, value));
          this.customGradient.colorStops[index].offset = value;
          const sliderInput = document.querySelector(
            `.offset-slider[data-index="${index}"]`,
          );
          if (sliderInput) sliderInput.value = value;
        }
      }
    });
  }

  setupCustomGradientUI() {
    this.updateColorStopsUI();
    this.renderPalette("solid-color-palette", "solid-color-picker");
    document.addEventListener("input", (e) => {
      if (e.target.classList.contains("color-input")) {
        const index = parseInt(e.target.dataset.index);
        this.customGradient.colorStops[index].color = e.target.value;
      }
      if (e.target.classList.contains("offset-slider")) {
        const index = parseInt(e.target.dataset.index);
        const value = parseFloat(e.target.value);
        this.customGradient.colorStops[index].offset = value;
        const numberInput = document.querySelector(
          `.offset-input[data-index="${index}"]`,
        );
        if (numberInput) numberInput.value = value.toFixed(2);
      }
      if (e.target.classList.contains("offset-input")) {
        const index = parseInt(e.target.dataset.index);
        let value = parseFloat(e.target.value);
        if (isNaN(value)) value = 0;
        value = Math.max(0, Math.min(1, value));
        this.customGradient.colorStops[index].offset = value;
        const sliderInput = document.querySelector(
          `.offset-slider[data-index="${index}"]`,
        );
        if (sliderInput) sliderInput.value = value;
      }
    });
  }

  switchTab(tabName) {
    // Находим элементы ТОЛЬКО внутри модального окна
    const modal = document.getElementById("gradient-modal");

    document.querySelectorAll("#gradient-modal .tab-content").forEach((tab) => {
      tab.style.display = "none";
      tab.classList.remove("active");
    });

    document.querySelectorAll("#gradient-modal .tab-btn").forEach((btn) => {
      btn.classList.remove("active");
      btn.style.background = "none";
      btn.style.color = "#a0a0b0";
    });

    const activeTab = document.getElementById(`${tabName}-tab`);
    const activeBtn = document.querySelector(
      `#gradient-modal .tab-btn[data-tab="${tabName}"]`,
    );

    if (activeTab) {
      activeTab.style.display = "block";
      activeTab.classList.add("active");
    }

    if (activeBtn) {
      activeBtn.classList.add("active");
      activeBtn.style.background = "#667eea";
      activeBtn.style.color = "white";
    }

    if (tabName === "custom") this.updateColorStopsUI();
  }

  loadAnimatedPresets() {
    const container = document.getElementById("animated-presets-container");
    if (!container) return;
    container.innerHTML = "";
    this.animatedPresets.forEach((preset, index) => {
      const presetBtn = document.createElement("button");
      presetBtn.className = "preset-btn";
      presetBtn.dataset.index = index;
      presetBtn.textContent = preset.name;
      presetBtn.style.background = `url(${preset.thumbnail}) center/cover no-repeat, linear-gradient(135deg, #2d2d3d 0%, #1e1e2e 100%)`;
      presetBtn.style.backgroundBlendMode = "overlay";
      presetBtn.style.color = "white";
      presetBtn.style.textShadow = "0 1px 3px rgba(0,0,0,0.8)";
      const videoIndicator = document.createElement("div");
      videoIndicator.className = "video-indicator";
      videoIndicator.textContent = "VIDEO";
      videoIndicator.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%);
        color: white;
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 700;
      `;
      presetBtn.appendChild(videoIndicator);
      container.appendChild(presetBtn);
    });
  }

  loadStaticPresets() {
    const container = document.getElementById("static-presets-container");
    if (!container) return;
    container.innerHTML = "";
    this.staticPresets.forEach((preset, index) => {
      const presetBtn = document.createElement("button");
      presetBtn.className = "gradient-preset-btn";
      presetBtn.dataset.index = index;
      presetBtn.textContent = preset.name;
      const gradientString = this.getCSSGradientString(preset);
      presetBtn.style.background = gradientString;
      const brightness = this.getColorBrightness(preset.colorStops[0].color);
      presetBtn.style.color = brightness > 128 ? "#000" : "#fff";
      presetBtn.style.textShadow =
        brightness > 128
          ? "0 1px 3px rgba(255,255,255,0.7)"
          : "0 1px 3px rgba(0,0,0,0.7)";
      container.appendChild(presetBtn);
    });
  }

  applyVideoPreset(preset) {
    console.log("🎬 Применяю видео-обои:", preset.name);

    const presetData = { ...preset };
    const applyToken = ++this.backgroundApplyToken;

    setTimeout(() => {
      if (applyToken !== this.backgroundApplyToken) return;
      this.createVideoBackground(presetData.videoUrl, presetData.name, {
        applyToken,
      });
    }, 100);
  }

  applyStaticGradientPreset(preset) {
    if (!preset || typeof preset !== "object") {
      console.error(
        "applyStaticGradientPreset: preset is undefined or invalid",
      );
      return;
    }

    console.log("🎨 Применяю статичный градиент:", preset.name);

    const applyToken = ++this.backgroundApplyToken;

    setTimeout(() => {
      if (applyToken !== this.backgroundApplyToken) return;

      try {
        const texture = this.createGradientTexture(preset);
        this.cleanupAllBackgroundResources();
        this.activeGradientTexture = texture;

        this.saveCurrentBackground("gradient", preset);

        if (this.editor?.changeBackground) {
          const texturePath = preset.name
            ? `gradient-${preset.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`
            : `gradient-unknown-${Date.now()}`;

          this.editor.changeBackground({
            texture: texture,
            alpha: 1,
            isGradientTexture: true,
            texturePath: texturePath,
            gradientConfig: preset,
          });
        }
      } catch (error) {
        console.error("❌ Ошибка создания градиента:", error);
      }
    }, 50);
  }

  cleanupAllBackgroundResources(options = {}) {
    console.log("🧹 Полная очистка всех ресурсов фона");

    // СОХРАНЯЕМ URL ДО ОЧИСТКИ, но не удаляем их из this.uploadedVideoUrl
    // Мы только очищаем текстуры и видео элементы, но сохраняем ссылки на файлы

    if (options.resetEditor && this.editor && this.editor.changeBackground) {
      this.editor.changeBackground({
        color: 0x1e1e1e,
        alpha: 1,
        texture: null,
        isVideoTexture: false,
        isGradientTexture: false,
        videoElement: null,
      });
    }

    // 2. Останавливаем видео и очищаем его ресурсы (НО НЕ URL!)
    this.stopVideoBackground();

    // 3. Очищаем градиентную текстуру
    if (this.activeGradientTexture) {
      try {
        if (!this.activeGradientTexture.destroyed) {
          if (this.activeGradientTexture.textureCacheIds) {
            this.activeGradientTexture.textureCacheIds.forEach((id) => {
              if (PIXI.utils.TextureCache && PIXI.utils.TextureCache[id]) {
                try {
                  if (!PIXI.utils.TextureCache[id].destroyed) {
                    PIXI.utils.TextureCache[id].destroy(true);
                  }
                } catch (e) {}
                delete PIXI.utils.TextureCache[id];
              }
            });
          }
          this.activeGradientTexture.destroy(true);
        }
      } catch (e) {
        console.warn("Ошибка при очистке градиента:", e);
      }
      this.activeGradientTexture = null;
    }

    // 4. Очищаем canvas
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // 5. НЕ ОЧИЩАЕМ uploadedVideoUrl и uploadedImage здесь!
    // Они нужны для последующего применения
    // this.uploadedVideoUrl = null;  // НЕ ДЕЛАЕМ ЭТОГО!
    // this.uploadedImage = null;     // НЕ ДЕЛАЕМ ЭТОГО!

    console.log("✅ Все ресурсы фона очищены, URL сохранены:", {
      videoUrl: this.uploadedVideoUrl,
      imageUrl: this.uploadedImage,
    });
  }

  createGradientTexture(preset) {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = this.canvas?.width || this.editor?._width || 1920;
      canvas.height = this.canvas?.height || this.editor?._height || 1080;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let gradient;
      if (preset.type === "linear") {
        const angleRad = (preset.angle * Math.PI) / 180;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const length = Math.sqrt(
          canvas.width * canvas.width + canvas.height * canvas.height,
        );
        const x1 = centerX + Math.cos(angleRad) * length;
        const y1 = centerY + Math.sin(angleRad) * length;
        const x2 = centerX - Math.cos(angleRad) * length;
        const y2 = centerY - Math.sin(angleRad) * length;
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      } else if (preset.type === "radial") {
        const centerX = (preset.center?.x || 0.5) * canvas.width;
        const centerY = (preset.center?.y || 0.5) * canvas.height;
        const radius = Math.max(canvas.width, canvas.height);
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius,
        );
      } else if (preset.type === "conic") {
        const centerX = (preset.center?.x || 0.5) * canvas.width;
        const centerY = (preset.center?.y || 0.5) * canvas.height;
        const radius = Math.max(canvas.width, canvas.height);
        gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          radius,
        );
      } else {
        gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      }
      preset.colorStops.forEach((stop) => {
        gradient.addColorStop(stop.offset, stop.color);
      });
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const texture = PIXI.Texture.from(canvas);
      texture.update();
      return texture;
    } catch (error) {
      console.error("❌ Ошибка создания градиента:", error);
      return this.createDefaultTexture();
    }
  }

  createDefaultTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = this.canvas?.width || this.editor?._width || 1920;
    canvas.height = this.canvas?.height || this.editor?._height || 1080;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height,
    );
    gradient.addColorStop(0, "#ff0000");
    gradient.addColorStop(1, "#0000ff");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const texture = PIXI.Texture.from(canvas);
    texture.update();
    return texture;
  }

  createVideoBackground(videoUrl, presetName, options = {}) {
    try {
      console.log(`🚀 Начинаю загрузку видео: ${presetName} (${videoUrl})`);

      // Убеждаемся, что URL корректен
      if (!videoUrl || videoUrl === "null" || videoUrl === "undefined") {
        console.error(`❌ Некорректный URL видео: ${videoUrl}`);
        return;
      }

      const applyToken = options.applyToken || ++this.backgroundApplyToken;
      const videoElement = document.createElement("video");
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      videoElement.autoplay = true;
      videoElement.preload = "auto";
      videoElement.crossOrigin = "anonymous";
      videoElement.style.display = "none";
      videoElement.src = videoUrl;
      document.body.appendChild(videoElement);

      let errorShown = false;
      let textureCreated = false;

      const isCurrentRequest = () => applyToken === this.backgroundApplyToken;

      const removeCandidateVideo = () => {
        try {
          videoElement.pause();
          videoElement.removeAttribute("src");
          videoElement.load();
          videoElement.remove();
        } catch (e) {
          console.warn("Ошибка при очистке неподошедшего видео:", e);
        }
      };

      const createTexture = () => {
        if (textureCreated || !isCurrentRequest()) {
          if (!isCurrentRequest()) removeCandidateVideo();
          return;
        }

        try {
          if (!document.body.contains(videoElement)) {
            console.warn("⚠️ Видео элемент был удален");
            return;
          }

          if (videoElement.videoWidth === 0 || videoElement.videoHeight === 0) {
            console.warn(`⚠️ Видео не имеет размеров, ждем еще...`);
            textureCreated = false;
            setTimeout(createTexture, 100);
            return;
          }

          textureCreated = true;

          const texture = PIXI.Texture.from(videoElement);

          console.log(`✅ Текстура создана успешно для: ${presetName}`, {
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
          });

          this.cleanupAllBackgroundResources();
          this.videoElement = videoElement;
          this.videoTexture = texture;

          // Важно: сначала обновляем состояние, потом вызываем changeBackground
          this.saveCurrentBackground("video", {
            videoUrl: videoUrl,
            name: presetName,
            type: "video",
            appliedAt: Date.now(),
          });

          if (this.editor && this.editor.changeBackground) {
            this.editor.changeBackground({
              texture: this.videoTexture,
              alpha: 1,
              isVideoTexture: true,
              texturePath: `video-${presetName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}`,
              videoElement: this.videoElement,
            });
          }

          this.startVideoTextureUpdate();

          // Запускаем воспроизведение видео
          const playPromise = videoElement.play();
          if (playPromise) {
            playPromise.catch((e) => {
              console.warn(`⚠️ Автовоспроизведение не удалось:`, e);
            });
          }
        } catch (error) {
          textureCreated = false;
          if (!errorShown) {
            console.error(
              `❌ Ошибка создания текстуры для "${presetName}":`,
              error,
            );
            errorShown = true;
          }
        }
      };

      const onCanPlay = () => {
        if (textureCreated || !isCurrentRequest()) return;
        console.log(`🎬 Видео готово к воспроизведению: ${presetName}`);
        setTimeout(createTexture, 50);
      };

      const onError = (e) => {
        if (errorShown) return;
        errorShown = true;

        if (!document.body.contains(videoElement)) {
          return;
        }

        console.error(`❌ Ошибка загрузки видео "${presetName}":`, e);
        removeCandidateVideo();

        // Проверяем URL на корректность
        if (videoUrl === "null" || videoUrl === "undefined") {
          console.error(`❌ Некорректный URL видео: ${videoUrl}`);
          return;
        }

        // Пробуем еще раз через некоторое время
        setTimeout(() => {
          if (
            !textureCreated &&
            isCurrentRequest() &&
            !videoElement.error
          ) {
            if (videoElement.readyState >= 2) onCanPlay();
          }
        }, 1000);
      };

      const onLoadedMetadata = () => {
        console.log(`📹 Метаданные видео загружены: ${presetName}`, {
          width: videoElement.videoWidth,
          height: videoElement.videoHeight,
          duration: videoElement.duration,
        });
      };

      videoElement.addEventListener("canplay", onCanPlay);
      videoElement.addEventListener("error", onError);
      videoElement.addEventListener("loadedmetadata", onLoadedMetadata);
      videoElement.addEventListener("loadeddata", () => {
        console.log(`✅ Данные видео загружены: ${presetName}`);
        if (!textureCreated && videoElement.readyState >= 2) {
          onCanPlay();
        }
      });

      videoElement.load();

      // Резервный таймер
      setTimeout(() => {
        if (!textureCreated && !errorShown && isCurrentRequest()) {
          if (videoElement.readyState >= 2) {
            onCanPlay();
          } else if (videoElement.readyState === 0) {
            console.warn(`⚠️ Видео не загрузилось через 3 секунды`);
          }
        }
      }, 3000);
    } catch (error) {
      console.error(
        `❌ Критическая ошибка применения видео "${presetName}":`,
        error,
      );
    }
  }
  stopVideoBackground() {
    console.log("⏹️ Остановка видео-фона");

    // Останавливаем анимационный фрейм
    if (this.videoAnimationFrame) {
      cancelAnimationFrame(this.videoAnimationFrame);
      this.videoAnimationFrame = null;
    }

    // Очищаем видео текстуру
    if (this.videoTexture) {
      try {
        if (!this.videoTexture.destroyed) {
          if (this.videoTexture.textureCacheIds) {
            this.videoTexture.textureCacheIds.forEach((id) => {
              if (PIXI.utils.TextureCache && PIXI.utils.TextureCache[id]) {
                try {
                  if (!PIXI.utils.TextureCache[id].destroyed) {
                    PIXI.utils.TextureCache[id].destroy(true);
                  }
                } catch (e) {}
                delete PIXI.utils.TextureCache[id];
              }
            });
          }
          this.videoTexture.destroy(true);
        }
      } catch (e) {
        console.warn("Ошибка при очистке видео текстуры:", e);
      }
      this.videoTexture = null;
    }

    // Очищаем видео элемент
    if (this.videoElement) {
      try {
        this.videoElement.pause();
        this.videoElement.removeAttribute("src");
        this.videoElement.load();

        const oldElement = this.videoElement;
        if (oldElement.parentNode) {
          oldElement.parentNode.removeChild(oldElement);
        }
      } catch (e) {
        console.warn("Ошибка при очистке видео элемента:", e);
      }

      this.videoElement = null;
    }

    console.log("✅ Видео-фон остановлен");
  }

  startVideoTextureUpdate() {
    if (this.videoAnimationFrame) {
      cancelAnimationFrame(this.videoAnimationFrame);
    }

    const updateFrame = () => {
      if (
        this.videoTexture &&
        this.videoElement &&
        !this.videoElement.paused &&
        this.videoElement.readyState >= 2
      ) {
        // Обновляем текстуру
        this.videoTexture.update();

        // Продолжаем цикл обновления
        this.videoAnimationFrame = requestAnimationFrame(updateFrame);
      } else if (this.videoTexture && this.videoElement) {
        // Если видео на паузе, все равно продолжаем проверять
        this.videoAnimationFrame = requestAnimationFrame(updateFrame);
      } else {
        this.videoAnimationFrame = null;
      }
    };

    this.videoAnimationFrame = requestAnimationFrame(updateFrame);
  }

  cleanupGradientTexture() {
    console.log("🧹 Очистка градиентной текстуры");

    if (this.activeGradientTexture) {
      try {
        // Удаляем из кэша текстур Pixi
        if (this.activeGradientTexture.textureCacheIds) {
          this.activeGradientTexture.textureCacheIds.forEach((id) => {
            if (PIXI.utils.TextureCache && PIXI.utils.TextureCache[id]) {
              PIXI.utils.TextureCache[id].destroy?.(true);
              delete PIXI.utils.TextureCache[id];
            }
          });
        }

        // Уничтожаем текстуру
        this.activeGradientTexture.destroy(true);
      } catch (e) {
        console.warn("Ошибка при очистке градиентной текстуры:", e);
      }
      this.activeGradientTexture = null;
    }

    // Очищаем canvas
    if (this.context && this.canvas) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    console.log("✅ Градиентная текстура очищена");
  }

  updateColorStopsUI() {
    const container = document.getElementById("color-stops-container");
    if (!container) return;
    container.innerHTML = "";

    // Сохраняем ссылку на this для использования внутри обработчиков
    const self = this;

    this.customGradient.colorStops.forEach((stop, index) => {
      const stopElement = document.createElement("div");
      stopElement.className = "color-stop-item";
      stopElement.innerHTML = `
      <div class="ipanel-color-control" data-target="gradient-color-${index}" style="width: 40px; height: 40px; border-radius: 6px; border: 1px solid #3d3d4d; cursor: pointer; background: ${stop.color};"></div>
      <input type="hidden" id="gradient-color-${index}" class="color-input" data-index="${index}" value="${stop.color}">
      <input type="text" class="color-code-input" data-index="${index}" value="${stop.color}" maxlength="7" style="width: 82px; padding: 8px; background: #1e1e2e; border: 1px solid #3d3d4d; border-radius: 4px; color: white; text-align: center; font-family: monospace; text-transform: uppercase;">
      <input type="range" class="offset-slider" data-index="${index}" min="0" max="1" step="0.01" value="${stop.offset}" style="flex: 1; height: 6px; border-radius: 3px; background: #3d3d4d;">
      <input type="number" class="offset-input" data-index="${index}" min="0" max="1" step="0.01" value="${stop.offset.toFixed(2)}" style="width: 60px; padding: 8px; background: #1e1e2e; border: 1px solid #3d3d4d; border-radius: 4px; color: white; text-align: center;">
      <button class="copy-color-stop" data-index="${index}" style="background: #2d2d3d; color: white; border: 1px solid #3d3d4d; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">⧉</button>
      <button class="paste-color-stop" data-index="${index}" style="background: #2d2d3d; color: white; border: 1px solid #3d3d4d; border-radius: 4px; width: 30px; height: 30px; cursor: pointer;">↧</button>
      <button class="remove-color-stop" data-index="${index}" ${this.customGradient.colorStops.length <= 2 ? 'disabled style="opacity: 0.5;"' : ""} style="background: #ff4757; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
      <div class="ipanel-color-palette" data-target="gradient-color-${index}" style="grid-column: 1 / -1; display: grid; grid-template-columns: repeat(10, 1fr); gap: 5px; margin-top: 2px;"></div>
    `;

      container.appendChild(stopElement);

      // Добавляем обработчики событий для каждого инпута
      const colorInput = stopElement.querySelector(".color-input");
      const codeInput = stopElement.querySelector(".color-code-input");
      const offsetSlider = stopElement.querySelector(".offset-slider");
      const offsetInput = stopElement.querySelector(".offset-input");
      const palette = stopElement.querySelector(".ipanel-color-palette");
      if (palette) this.renderPaletteElement(palette, `gradient-color-${index}`);

      stopElement.querySelector(".copy-color-stop")?.addEventListener("click", async () => {
        const color = self.customGradient.colorStops[index]?.color || "#000000";
        try {
          await navigator.clipboard?.writeText(color);
        } catch {
          window.prompt("Скопируйте цвет", color);
        }
      });

      stopElement.querySelector(".paste-color-stop")?.addEventListener("click", async () => {
        let color = "";
        try {
          color = await navigator.clipboard?.readText();
        } catch {
          color = window.prompt("Вставьте HEX цвет") || "";
        }
        color = self.normalizeHexColor(color);
        if (!color) return;
        self.customGradient.colorStops[index].color = color;
        colorInput.value = color;
        codeInput.value = color;
        self.syncColorControl(colorInput);
        self.applyCustomGradient();
      });

      // Обработчик для color input
      colorInput.addEventListener("input", function (e) {
        const idx = parseInt(this.dataset.index);
        const color = self.normalizeHexColor(e.target.value);
        if (color) {
          self.customGradient.colorStops[idx].color = color;
          self.syncColorControl(this);
          self.applyCustomGradient();
        }
      });

      codeInput.addEventListener("input", function (e) {
        const idx = parseInt(this.dataset.index);
        const color = self.normalizeHexColor(e.target.value);
        if (color) {
          self.customGradient.colorStops[idx].color = color;
          colorInput.value = color;
          self.syncColorControl(colorInput);
          self.applyCustomGradient();
        }
      });

      // Обработчик для range слайдера
      offsetSlider.addEventListener("input", function (e) {
        const idx = parseInt(this.dataset.index);
        const value = parseFloat(e.target.value);
        self.customGradient.colorStops[idx].offset = value;

        // Синхронизируем числовой инпут
        const numberInput = stopElement.querySelector(".offset-input");
        if (numberInput) {
          numberInput.value = value.toFixed(2);
        }

        self.applyCustomGradient();
      });

      // Обработчик для числового инпута
      offsetInput.addEventListener("input", function (e) {
        const idx = parseInt(this.dataset.index);
        let value = parseFloat(e.target.value);

        // Проверяем валидность значения
        if (isNaN(value)) value = 0;
        value = Math.max(0, Math.min(1, value)); // Ограничиваем от 0 до 1

        self.customGradient.colorStops[idx].offset = value;

        // Синхронизируем слайдер
        const slider = stopElement.querySelector(".offset-slider");
        if (slider) {
          slider.value = value;
        }

        // Обновляем значение в инпуте, если оно было скорректировано
        if (parseFloat(e.target.value) !== value) {
          e.target.value = value.toFixed(2);
        }

        self.applyCustomGradient();
      });

      // Добавляем обработчик для кнопки удаления
      const removeButton = stopElement.querySelector(".remove-color-stop");
      if (removeButton && !removeButton.disabled) {
        removeButton.addEventListener("click", function (e) {
          const idx = parseInt(this.dataset.index);
          if (self.customGradient.colorStops.length > 2) {
            self.customGradient.colorStops.splice(idx, 1);
            self.updateColorStopsUI();
            self.applyCustomGradient();
          }
        });
      }
    });
  }

  addColorStop() {
    const stops = this.customGradient.colorStops;
    let newOffset = 0.5;
    if (stops.length >= 2) {
      let maxGap = 0;
      for (let i = 1; i < stops.length; i++) {
        const gap = stops[i].offset - stops[i - 1].offset;
        if (gap > maxGap) {
          maxGap = gap;
          newOffset = (stops[i - 1].offset + stops[i].offset) / 2;
        }
      }
    }
    const newStop = { offset: newOffset, color: this.generateRandomColor() };
    this.customGradient.colorStops.push(newStop);
    this.customGradient.colorStops.sort((a, b) => a.offset - b.offset);
    this.updateColorStopsUI();
    this.applyCustomGradient();
  }

  removeColorStop(index) {
    if (this.customGradient.colorStops.length <= 2) return;
    this.customGradient.colorStops.splice(index, 1);
    this.updateColorStopsUI();
    this.applyCustomGradient();
  }

  generateRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++)
      color += letters[Math.floor(Math.random() * 16)];
    return color;
  }

  applyCustomGradient() {
    console.log("🎨 Применяю кастомный градиент...");
    this.stopVideoBackground();
    const gradientPreset = {
      name: "Кастомный градиент",
      type: this.customGradient.type,
      colorStops: JSON.parse(JSON.stringify(this.customGradient.colorStops)),
      angle: this.customGradient.angle,
      isCustom: true,
      created: Date.now(),
    };
    this.applyStaticGradientPreset(gradientPreset);
  }

  prepareBackgroundImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
      reader.onload = () => {
        const image = new Image();
        image.onload = () => {
          try {
            const maxSide = 1920;
            const scale = Math.min(
              1,
              maxSide / Math.max(image.width || 1, image.height || 1),
            );
            const width = Math.max(1, Math.round(image.width * scale));
            const height = Math.max(1, Math.round(image.height * scale));
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) throw new Error("Canvas недоступен");

            canvas.width = width;
            canvas.height = height;
            context.fillStyle = "#000000";
            context.fillRect(0, 0, width, height);
            context.drawImage(image, 0, 0, width, height);

            resolve({
              imageUrl: canvas.toDataURL("image/jpeg", 0.88),
              originalName: file.name || "background-image",
              width,
              height,
              originalWidth: image.width,
              originalHeight: image.height,
            });
          } catch (error) {
            reject(error);
          }
        };
        image.onerror = () => reject(new Error("Не удалось загрузить изображение"));
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Пожалуйста, выберите файл изображения");
      return;
    }
    try {
      const preparedImage = await this.prepareBackgroundImage(file);
      this.uploadedImage = preparedImage.imageUrl;
      this.uploadedImageMeta = preparedImage;
      const previewContainer = document.getElementById(
        "image-preview-container",
      );
      if (previewContainer) {
        previewContainer.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px;">
            <img src="${preparedImage.imageUrl}" style="max-width: 100%; max-height: 100%; object-fit: cover;">
          </div>
        `;
      }
    } catch (error) {
      console.error("❌ Ошибка подготовки изображения:", error);
      alert("Ошибка при загрузке изображения");
    }
  }

  async handleVideoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Пожалуйста, выберите видео файл");
      return;
    }

    // Очищаем предыдущий URL если был
    if (this.uploadedVideoUrl && this.uploadedVideoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(this.uploadedVideoUrl);
    }

    const previewContainer = document.getElementById("video-preview-container");
    if (previewContainer) {
      previewContainer.innerHTML = `
        <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: #000; color: #fff; font-size: 12px;">
          Загрузка видеофона...
        </div>
      `;
    }

    try {
      const uploaded = await this.uploadBackgroundVideo(file);
      this.uploadedVideoUrl = uploaded.url;
      this.uploadedVideoMeta = uploaded;

      if (previewContainer) {
        previewContainer.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: #000;">
            <video src="${uploaded.url}" style="max-width: 100%; max-height: 100%;" muted controls></video>
          </div>
        `;
      }

      console.log("📹 Видео загружено на сервер, URL:", uploaded.url);
    } catch (error) {
      console.error("❌ Ошибка загрузки видеофона:", error);

      const videoURL = URL.createObjectURL(file);
      this.uploadedVideoUrl = videoURL;
      this.uploadedVideoMeta = null;

      if (previewContainer) {
        previewContainer.innerHTML = `
          <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: #000;">
            <video src="${videoURL}" style="max-width: 100%; max-height: 100%;" muted controls></video>
          </div>
        `;
      }

      alert("Не удалось загрузить видеофон на сервер. Проверьте panel_id и соединение.");
    }
  }

  applyImageBackground() {
    if (!this.uploadedImage) {
      alert("Сначала выберите изображение");
      return;
    }

    console.log("🖼️ Применяю изображение как фон...");

    const applyToken = ++this.backgroundApplyToken;
    const imageUrlToApply = this.uploadedImage;

    const image = new Image();
    image.onload = () => {
      if (applyToken !== this.backgroundApplyToken) return;

      try {
        const texture = PIXI.Texture.from(image);
        this.cleanupAllBackgroundResources();

        this.saveCurrentBackground("image", {
          imageUrl: imageUrlToApply,
          name: this.uploadedImageMeta?.originalName || "Загруженное изображение",
          width: this.uploadedImageMeta?.width || image.width,
          height: this.uploadedImageMeta?.height || image.height,
          uploadedAt: Date.now(),
        });

        if (this.editor.changeBackground) {
          this.editor.changeBackground({
            texture: texture,
            alpha: 1,
            isImageTexture: true,
            texturePath: "uploaded-image-" + Date.now(),
          });
        }
      } catch (error) {
        console.error("❌ Ошибка применения изображения:", error);
        alert("Ошибка при загрузке изображения");
      }
    };

    image.onerror = (error) => {
      if (applyToken !== this.backgroundApplyToken) return;
      console.error("❌ Ошибка загрузки изображения:", error);
      alert("Ошибка при загрузке изображения");
    };

    image.src = imageUrlToApply;
  }

  applyVideoBackground() {
    // Сохраняем URL перед любой очисткой
    const videoUrlToApply = this.uploadedVideoUrl;

    if (!videoUrlToApply) {
      alert("Сначала выберите видео");
      return;
    }

    console.log("🎥 Применяю свое видео как фон...");

    const applyToken = ++this.backgroundApplyToken;

    // Небольшая задержка для завершения очистки
    setTimeout(() => {
      if (applyToken !== this.backgroundApplyToken) return;

      // Создаем видео-фон с сохраненным URL
      this.createVideoBackground(videoUrlToApply, "Пользовательское видео", {
        applyToken,
      });
    }, 100);
  }

  applySolidColor() {
    const colorInput = document.getElementById("solid-color-picker");
    const color = colorInput.value;

    console.log("🎨 Применяю цветной фон:", color);

    this.backgroundApplyToken++;

    // Полная очистка всех ресурсов перед применением цвета
    this.cleanupAllBackgroundResources();

    const colorNumber = this.hexToNumber(color);

    this.saveCurrentBackground("color", {
      color: colorNumber,
      hex: color,
      alpha: 1,
    });

    if (this.editor.changeBackground) {
      this.editor.changeBackground({
        color: colorNumber,
        alpha: 1,
      });
    }
  }

  resetBackground() {
    console.log("🗑️ Сбрасываю фон...");
    this.backgroundApplyToken++;

    // Очищаем превью
    const imagePreview = document.getElementById("image-preview-container");
    if (imagePreview) imagePreview.innerHTML = "Выберите изображение";

    const videoPreview = document.getElementById("video-preview-container");
    if (videoPreview) videoPreview.innerHTML = "Выберите видео";

    // Очищаем URL только при полном сбросе
    if (this.uploadedVideoUrl && this.uploadedVideoUrl.startsWith("blob:")) {
      URL.revokeObjectURL(this.uploadedVideoUrl);
    }
    this.uploadedVideoUrl = null;
    this.uploadedVideoMeta = null;

    if (this.uploadedImage && this.uploadedImage.startsWith("blob:")) {
      URL.revokeObjectURL(this.uploadedImage);
    }
    this.uploadedImage = null;

    // Полная очистка всех ресурсов
    this.cleanupAllBackgroundResources();

    // Применяем цвет по умолчанию
    this.applySolidColorInternal(0x1e1e1e);
  }

  getPaletteColors() {
    return [
      "#FFFFFF",
      "#F8FAFC",
      "#111827",
      "#EF4444",
      "#F97316",
      "#F59E0B",
      "#22C55E",
      "#06B6D4",
      "#3B82F6",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#0F172A",
      "#1E293B",
      "#334155",
      "#64748B",
      "#991B1B",
      "#7F1D1D",
      "#064E3B",
      "#172554",
    ];
  }

  renderPalette(containerId, targetId) {
    const container = document.getElementById(containerId);
    if (container) this.renderPaletteElement(container, targetId);
  }

  renderPaletteElement(container, targetId) {
    container.innerHTML = "";
    this.getPaletteColors().forEach((color) => {
      const swatch = document.createElement("button");
      swatch.type = "button";
      swatch.className = "ipanel-color-swatch";
      swatch.dataset.target = targetId;
      swatch.dataset.color = color;
      swatch.style.background = color;
      swatch.title = color;
      container.appendChild(swatch);
    });
  }

  normalizeHexColor(value) {
    if (!value) return null;
    let color = String(value).trim();
    if (!color.startsWith("#")) color = `#${color}`;
    if (/^#[0-9a-fA-F]{3}$/.test(color)) {
      color = `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`;
    }
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return null;
    return color.toUpperCase();
  }

  async copyGradientSettings() {
    const payload = {
      type: this.customGradient.type || "linear",
      angle: Number(this.customGradient.angle ?? 90),
      colorStops: this.customGradient.colorStops.map((stop) => ({
        offset: Number(stop.offset ?? 0),
        color: this.normalizeHexColor(stop.color) || "#000000",
      })),
    };
    const text = JSON.stringify(payload);
    try {
      await navigator.clipboard?.writeText(text);
    } catch {
      window.prompt("Скопируйте настройки градиента", text);
    }
  }

  async pasteGradientSettings() {
    let text = "";
    try {
      text = await navigator.clipboard?.readText();
    } catch {
      text = window.prompt("Вставьте настройки градиента") || "";
    }
    if (!text.trim()) return;

    try {
      const data = JSON.parse(text);
      if (!Array.isArray(data.colorStops) || data.colorStops.length < 2) {
        throw new Error("Нет colorStops");
      }
      this.customGradient = {
        type: ["linear", "radial", "conic"].includes(data.type)
          ? data.type
          : "linear",
        angle: Number(data.angle ?? 90),
        colorStops: data.colorStops.map((stop, index) => ({
          offset:
            Number.isFinite(Number(stop.offset))
              ? Math.max(0, Math.min(1, Number(stop.offset)))
              : index / Math.max(1, data.colorStops.length - 1),
          color: this.normalizeHexColor(stop.color) || "#000000",
        })),
      };
      this.updateColorStopsUI();
      this.applyCustomGradient();
    } catch (error) {
      alert("Не удалось вставить градиент: нужен JSON, скопированный из редактора");
    }
  }

  setColorInputValue(targetId, color) {
    const input = document.getElementById(targetId);
    const normalized = this.normalizeHexColor(color);
    if (!input || !normalized) return;
    input.value = normalized;
    const index = input.dataset?.index;
    if (index !== undefined) {
      this.customGradient.colorStops[Number(index)].color = normalized;
      this.syncColorControl(input);
      this.applyCustomGradient();
    } else {
      this.syncSolidColorControl(normalized);
    }
  }

  syncColorControl(input) {
    const targetId = input?.id;
    if (!targetId) return;
    const color = this.normalizeHexColor(input.value);
    if (!color) return;
    const control = document.querySelector(
      `.ipanel-color-control[data-target="${targetId}"]`,
    );
    const codeInput = input
      .closest(".color-stop-item")
      ?.querySelector(".color-code-input");
    if (control) control.style.background = color;
    if (codeInput) codeInput.value = color;
  }

  syncSolidColorControl(color) {
    const input = document.getElementById("solid-color-picker");
    const normalized = this.normalizeHexColor(color);
    if (!input || !normalized) return;
    input.value = normalized;
    const control = document.querySelector(
      '.ipanel-color-control[data-target="solid-color-picker"]',
    );
    if (control) control.style.background = normalized;
  }

  syncControlsFromCurrentBackground() {
    const background = this.currentBackground || {};
    const data = background.data || {};
    if (background.type === "gradient" && data.colorStops?.length) {
      this.customGradient = {
        type: data.type || "linear",
        angle: Number(data.angle ?? 90),
        colorStops: data.colorStops.map((stop) => ({
          offset: Number(stop.offset ?? 0),
          color: this.normalizeHexColor(stop.color) || "#667EEA",
        })),
      };
      const angleInput = document.getElementById("gradient-angle");
      const angleValue = document.getElementById("angle-value");
      if (angleInput) angleInput.value = this.customGradient.angle;
      if (angleValue) angleValue.textContent = `${this.customGradient.angle}°`;
      document.querySelectorAll(".gradient-type-btn").forEach((btn) => {
        const active = btn.dataset.type === this.customGradient.type;
        btn.style.background = active ? "#667eea" : "#2d2d3d";
        btn.style.border = active ? "1px solid #667eea" : "1px solid #3d3d4d";
      });
      this.updateColorStopsUI();
      this.switchTab("custom");
      return;
    }
    if (background.type === "color") {
      this.syncSolidColorControl(data.hex || this.rgbToHex(data.color || 0x1e1e1e));
      this.switchTab("upload");
    } else if (background.type === "video") {
      this.switchTab("videos");
    } else if (background.type === "image") {
      this.switchTab("upload");
    }
  }

  getCSSGradientString(preset) {
    if (!preset || !preset.type)
      return "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
    if (preset.type === "radial") {
      const centerX = (preset.center?.x || 0.5) * 100;
      const centerY = (preset.center?.y || 0.5) * 100;
      return `radial-gradient(circle at ${centerX}% ${centerY}%, ${preset.colorStops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`;
    } else if (preset.type === "conic") {
      const centerX = (preset.center?.x || 0.5) * 100;
      const centerY = (preset.center?.y || 0.5) * 100;
      return `conic-gradient(from 0deg at ${centerX}% ${centerY}%, ${preset.colorStops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`;
    } else {
      const angle = preset.angle || 90;
      return `linear-gradient(${angle}deg, ${preset.colorStops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(", ")})`;
    }
  }

  getColorBrightness(hexColor) {
    const rgb = this.hexToRgb(hexColor);
    if (!rgb) return 128;
    return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  }

  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  hexToNumber(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3)
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return parseInt(hex, 16);
  }

  rgbToHex(rgb) {
    if (typeof rgb === "string") {
      if (rgb.startsWith("#")) return rgb;
      rgb = parseInt(rgb);
    }
    if (typeof rgb === "number") {
      let hex = rgb.toString(16);
      while (hex.length < 6) hex = "0" + hex;
      return "#" + hex;
    }
    return "#000000";
  }

  openModal() {
    const modal = document.getElementById("gradient-modal");
    if (modal) {
      this.renderPalette("solid-color-palette", "solid-color-picker");
      this.syncControlsFromCurrentBackground();
      modal.style.display = "block";
    }
  }

  closeModal() {
    const modal = document.getElementById("gradient-modal");
    if (modal) modal.style.display = "none";
    this.stopVideoBackground();
  }

  destroy() {
    console.log("🗑️ Очистка конструктора фона...");
    this.stopVideoBackground();
    this.cleanupGradientTexture();
    ["gradient-modal"].forEach((id) => {
      const modal = document.getElementById(id);
      if (modal) modal.remove();
    });
    const button = document.getElementById("gradient-builder-btn");
    if (button) button.remove();
    if (this.canvas && this.canvas.parentNode)
      document.body.removeChild(this.canvas);
    this.initialized = false;
  }
}
