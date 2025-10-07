import { Application } from "pixi.js";
import * as PIXI from "pixi.js";
import EditorFrame from "./editorFrame/editor";
import DigitalClockWidget from "./widgetsGrid/widgets/digital_clock";
import CalendarWidget from "./widgetsGrid/widgets/calendar";
import WeatherWidget from "./widgetsGrid/widgets/weather";
import TrafficWidget from "./widgetsGrid/widgets/traffic";
import RatesWidget from "./widgetsGrid/widgets/rates";
import MetalsWidget from "./widgetsGrid/widgets/metals";
import AnalogClockWidget from "./widgetsGrid/widgets/analog_clock";
import NewsWidget from "./widgetsGrid/widgets/news";
import CompanyWidget from "./widgetsGrid/widgets/about_company";
import SimpleRectWidget from "./widgetsGrid/widgets/video";
import TextWidget from "./widgetsGrid/widgets/text_widget";

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    antialias: true,
    eventFeatures: {
      wheel: true,
      globalMove: true,
    },
  });

  document.getElementById("pixi-container").appendChild(app.canvas);

  document.addEventListener("dragstart", (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  document.addEventListener("drop", (e) => {
    e.preventDefault();
  });

  app.view.draggable = false;
  app.view.addEventListener("dragstart", (e) => {
    e.preventDefault();
    return false;
  });

  app.view.style.touchAction = "none";
  app.view.addEventListener("wheel", (e) => e.preventDefault(), {
    passive: false,
  });

  const editor = new EditorFrame(app);
  // Конструктор градиентов - добавляем в main.js
  class GradientBuilder {
    constructor(editor) {
      this.editor = editor;
      // Устанавливаем линейный градиент по умолчанию
      this.currentGradient = {
        type: "linear",
        angle: 0,
        colorStops: [
          { offset: 0, color: "#ff0000" },
          { offset: 1, color: "#0000ff" },
        ],
        textureSpace: "local",
      };

      this.createModal();
      this.init();
    }

    createModal() {
      // Создаем кнопку для открытия конструктора градиентов
      const gradientBtn = document.createElement("button");
      gradientBtn.id = "gradient-builder-btn";
      gradientBtn.innerHTML = "Градиент";
      gradientBtn.style.cssText = `
      padding: 4px 8px;
      border: none;
      border-radius: 4px;
      background: #555;
      color: white;
      cursor: pointer;
    `;

      // Добавляем кнопку в панель управления
      const controlsWidget = document.getElementById(
        "background-controls-widget",
      );
      controlsWidget.appendChild(gradientBtn);

      // Создаем модальное окно
      const modal = document.createElement("div");
      modal.id = "gradient-modal";
      modal.style.cssText = `
      display: none;
      position: fixed;
      top: 50%;
      left: 20%;
      transform: translate(-50%, -50%);
      width: 500px;
      background: #2d2d2d;
      border-radius: 12px;
      padding: 20px;
      z-index: 10000;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
      color: white;
      font-family: Arial, sans-serif;
    `;

      modal.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
        <h3 style="margin: 0;">Конструктор градиентов</h3>
        <button id="close-gradient-modal" style="background: none; border: none; color: white; font-size: 20px; cursor: pointer;">×</button>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px;">Тип градиента:</label>
        <select id="gradient-type" style="width: 100%; padding: 8px; border-radius: 4px; background: #404040; color: white; border: 1px solid #555;">
          <option value="linear">Линейный</option>
          <option value="radial">Радиальный</option>
        </select>
      </div>

      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 8px;">Цветовые остановки:</label>
        <div id="color-stops-container"></div>
        <button id="add-color-stop" type="button" style="
          padding: 6px 12px;
          background: #555;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        ">+ Добавить цвет</button>
      </div>

      <div id="linear-params" style="margin-bottom: 20px;">
        <div style="margin-bottom: 15px;">
          <label style="display: block; margin-bottom: 5px;">Угол градиента (°):</label>
          <div style="display: flex; gap: 10px; align-items: center;">
            <input type="range" id="linear-angle" min="0" max="360" step="1" value="0" style="flex: 1;">
            <input type="number" id="linear-angle-input" min="0" max="360" step="1" value="0" style="width: 80px; padding: 4px; background: #404040; color: white; border: 1px solid #555;">
            <span style="width: 30px; text-align: center;">°</span>
          </div>
        </div>
      </div>

      <div id="radial-params" style="margin-bottom: 20px; display: none;">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="display: block; margin-bottom: 5px;">Центр X:</label>
            <input type="range" id="radial-center-x" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
            <input type="number" id="radial-center-x-input" min="0" max="1" step="0.01" value="0.5" style="width: 100%; margin-top: 5px; padding: 4px; background: #404040; color: white; border: 1px solid #555;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px;">Центр Y:</label>
            <input type="range" id="radial-center-y" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
            <input type="number" id="radial-center-y-input" min="0" max="1" step="0.01" value="0.5" style="width: 100%; margin-top: 5px; padding: 4px; background: #404040; color: white; border: 1px solid #555;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px;">Внутренний радиус:</label>
            <input type="range" id="radial-inner-radius" min="0" max="1" step="0.01" value="0" style="width: 100%;">
            <input type="number" id="radial-inner-radius-input" min="0" max="1" step="0.01" value="0" style="width: 100%; margin-top: 5px; padding: 4px; background: #404040; color: white; border: 1px solid #555;">
          </div>
          <div>
            <label style="display: block; margin-bottom: 5px;">Внешний радиус:</label>
            <input type="range" id="radial-outer-radius" min="0" max="1" step="0.01" value="0.5" style="width: 100%;">
            <input type="number" id="radial-outer-radius-input" min="0" max="1" step="0.01" value="0.5" style="width: 100%; margin-top: 5px; padding: 4px; background: #404040; color: white; border: 1px solid #555;">
          </div>
        </div>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="close-gradient-modal-btn" style="
          padding: 8px 16px;
          background: #555;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Закрыть</button>
      </div>
    `;

      document.body.appendChild(modal);
    }

    init() {
      this.setupEventListeners();
      this.addDefaultColorStops();
      this.applyGradient();
    }

    setupEventListeners() {
      document
        .getElementById("gradient-builder-btn")
        .addEventListener("click", () => {
          document.getElementById("gradient-modal").style.display = "block";
        });

      document
        .getElementById("close-gradient-modal")
        .addEventListener("click", () => {
          this.closeModal();
        });

      document
        .getElementById("close-gradient-modal-btn")
        .addEventListener("click", () => {
          this.closeModal();
        });

      document
        .getElementById("gradient-type")
        .addEventListener("change", (e) => {
          this.currentGradient.type = e.target.value;
          this.toggleGradientType();
          this.applyGradient();
        });

      document
        .getElementById("add-color-stop")
        .addEventListener("click", () => {
          this.addColorStop();
        });

      this.setupInputSync();
    }

    setupInputSync() {
      // Только угол для линейного градиента
      this.syncInputs("linear-angle", "linear-angle-input");

      // Настройки для радиального градиента
      this.syncInputs("radial-center-x", "radial-center-x-input");
      this.syncInputs("radial-center-y", "radial-center-y-input");
      this.syncInputs("radial-inner-radius", "radial-inner-radius-input");
      this.syncInputs("radial-outer-radius", "radial-outer-radius-input");
    }

    syncInputs(sliderId, inputId) {
      const slider = document.getElementById(sliderId);
      const input = document.getElementById(inputId);

      const updateHandler = () => {
        input.value = slider.value;
        this.updateGradientParams();
        this.applyGradient();
      };

      slider.addEventListener("input", updateHandler);

      input.addEventListener("input", () => {
        let value = parseFloat(input.value);
        if (isNaN(value)) value = 0;

        const min = parseFloat(slider.min);
        const max = parseFloat(slider.max);

        value = Math.max(min, Math.min(max, value));
        input.value = value;
        slider.value = value;
        this.updateGradientParams();
        this.applyGradient();
      });
    }

    toggleGradientType() {
      const linearParams = document.getElementById("linear-params");
      const radialParams = document.getElementById("radial-params");

      if (this.currentGradient.type === "linear") {
        linearParams.style.display = "block";
        radialParams.style.display = "none";
      } else {
        linearParams.style.display = "none";
        radialParams.style.display = "block";
      }
    }

    addDefaultColorStops() {
      this.currentGradient.colorStops.forEach((stop, index) => {
        this.addColorStopElement(stop.offset, stop.color, index);
      });
    }

    addColorStop(offset = 0.5, color = "#ff0000") {
      const newStop = { offset, color };
      this.currentGradient.colorStops.push(newStop);
      this.currentGradient.colorStops.sort((a, b) => a.offset - b.offset);

      this.recreateColorStopElements();
      this.applyGradient();
    }

    addColorStopElement(offset, color, index) {
      const container = document.getElementById("color-stops-container");
      const stopElement = document.createElement("div");
      stopElement.className = "color-stop";
      stopElement.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
      padding: 8px;
      background: #404040;
      border-radius: 4px;
    `;

      stopElement.innerHTML = `
      <input type="color" value="${color}" class="color-picker" data-index="${index}" style="width: 40px; height: 30px;">
      <input type="range" min="0" max="1" step="0.01" value="${offset}" class="offset-slider" data-index="${index}" style="flex: 1;">
      <input type="number" min="0" max="1" step="0.01" value="${offset}" class="offset-input" data-index="${index}" style="width: 60px; padding: 4px; background: #333; color: white; border: 1px solid #555;">
      <span class="offset-percent" style="width: 40px; text-align: center;">${Math.round(offset * 100)}%</span>
      <button type="button" class="remove-stop" data-index="${index}" style="background: #ff4444; color: white; border: none; border-radius: 3px; width: 25px; height: 25px; cursor: pointer;">×</button>
    `;

      container.appendChild(stopElement);

      const colorPicker = stopElement.querySelector(".color-picker");
      const offsetSlider = stopElement.querySelector(".offset-slider");
      const offsetInput = stopElement.querySelector(".offset-input");
      const removeBtn = stopElement.querySelector(".remove-stop");

      colorPicker.addEventListener("input", (e) => {
        const index = parseInt(e.target.dataset.index);
        this.currentGradient.colorStops[index].color = e.target.value;
        this.applyGradient();
      });

      offsetSlider.addEventListener("input", (e) => {
        const index = parseInt(e.target.dataset.index);
        const value = parseFloat(e.target.value);
        this.currentGradient.colorStops[index].offset = value;
        offsetInput.value = value;
        stopElement.querySelector(".offset-percent").textContent =
          Math.round(value * 100) + "%";
        this.applyGradient();
      });

      offsetInput.addEventListener("input", (e) => {
        const index = parseInt(e.target.dataset.index);
        let value = parseFloat(e.target.value);
        if (isNaN(value)) value = 0;
        value = Math.max(0, Math.min(1, value));
        this.currentGradient.colorStops[index].offset = value;
        offsetSlider.value = value;
        stopElement.querySelector(".offset-percent").textContent =
          Math.round(value * 100) + "%";
        this.applyGradient();
      });

      removeBtn.addEventListener("click", (e) => {
        const index = parseInt(e.target.dataset.index);
        if (this.currentGradient.colorStops.length > 2) {
          this.currentGradient.colorStops.splice(index, 1);
          this.recreateColorStopElements();
          this.applyGradient();
        }
      });
    }

    recreateColorStopElements() {
      const container = document.getElementById("color-stops-container");
      container.innerHTML = "";
      this.currentGradient.colorStops.forEach((stop, index) => {
        this.addColorStopElement(stop.offset, stop.color, index);
      });
    }

    updateGradientParams() {
      if (this.currentGradient.type === "linear") {
        this.currentGradient.angle = parseFloat(
          document.getElementById("linear-angle").value,
        );
        this.calculateLinearPointsFromAngle();
      } else {
        this.currentGradient.center = {
          x: parseFloat(document.getElementById("radial-center-x").value),
          y: parseFloat(document.getElementById("radial-center-y").value),
        };
        this.currentGradient.innerRadius = parseFloat(
          document.getElementById("radial-inner-radius").value,
        );
        this.currentGradient.outerRadius = parseFloat(
          document.getElementById("radial-outer-radius").value,
        );
      }
    }

    calculateLinearPointsFromAngle() {
      const angle = this.currentGradient.angle;

      // Простая логика для основных направлений
      if (angle >= 315 || angle < 45) {
        // Слева направо
        this.currentGradient.start = { x: 0, y: 0.5 };
        this.currentGradient.end = { x: 1, y: 0.5 };
      } else if (angle >= 45 && angle < 135) {
        // Сверху вниз
        this.currentGradient.start = { x: 0.5, y: 0 };
        this.currentGradient.end = { x: 0.5, y: 1 };
      } else if (angle >= 135 && angle < 225) {
        // Справа налево
        this.currentGradient.start = { x: 1, y: 0.5 };
        this.currentGradient.end = { x: 0, y: 0.5 };
      } else {
        // Снизу вверх
        this.currentGradient.start = { x: 0.5, y: 1 };
        this.currentGradient.end = { x: 0.5, y: 0 };
      }
    }

    applyGradient() {
      this.updateGradientParams();

      const gradientConfig = {
        type: this.currentGradient.type,
        colorStops: [...this.currentGradient.colorStops],
        textureSpace: "local",
      };

      if (this.currentGradient.type === "linear") {
        gradientConfig.start = this.currentGradient.start;
        gradientConfig.end = this.currentGradient.end;
      } else {
        gradientConfig.center = this.currentGradient.center;
        gradientConfig.innerRadius = this.currentGradient.innerRadius;
        gradientConfig.outerRadius = this.currentGradient.outerRadius;
      }

      this.editor.applyGradientBackground(gradientConfig);
    }

    closeModal() {
      document.getElementById("gradient-modal").style.display = "none";
    }
  }

  // В вашем основном коде main.js, после создания editor, добавьте:
  // Инициализация конструктора градиентов
  window.gradientBuilder = new GradientBuilder(editor);

  const colorInput = document.getElementById("bg-color");
  const alphaInput = document.getElementById("bg-alpha");
  const exportButton = document.getElementById("export");

  colorInput.addEventListener("input", (e) => {
    editor.changeBackground({ color: e.target.value });
  });

  alphaInput.addEventListener("input", (e) => {
    editor.changeBackground({ alpha: parseFloat(e.target.value) });
  });

  exportButton.addEventListener("click", (e) => {
    console.log(editor.exportScene());
  });
  const importButton = document.getElementById("import");
  importButton.addEventListener("click", () => {
    editor.importScene({
      background: { color: 6370691, alpha: 1 },
      grid: { size: 20, visible: true },
      display: { width: 1734, height: 765 },
      widgets: [
        {
          type: "USDEURS",
          widgetClass: "Container",
          x: 308.0000474717882,
          y: 154.51851738823783,
          size: { width: 115, height: 115 },
          texture: null,
          w: "RatesWidget",
        },
      ],
    });
  });

  // Добавьте этот код после создания editor

  // Функция для сохранения фона в localStorage
  function saveBackgroundToStorage(name, url) {
    try {
      const savedBackgrounds = getSavedBackgrounds();

      // Проверяем, нет ли уже такого фона
      if (!savedBackgrounds.some((bg) => bg.url === url)) {
        savedBackgrounds.push({
          id: Date.now().toString(),
          name: name || `Фон ${savedBackgrounds.length + 1}`,
          url: url,
          date: new Date().toISOString(),
        });

        localStorage.setItem(
          "saved_backgrounds",
          JSON.stringify(savedBackgrounds),
        );
        updateSavedBackgroundsList();
        return true;
      } else {
        alert("Этот фон уже сохранен");
        return false;
      }
    } catch (error) {
      console.error("Ошибка сохранения фона:", error);
      return false;
    }
  }

  // Функция для получения сохраненных фонов
  function getSavedBackgrounds() {
    try {
      const saved = localStorage.getItem("saved_backgrounds");
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error("Ошибка получения сохраненных фонов:", error);
      return [];
    }
  }

  // Функция для обновления списка сохраненных фонов
  function updateSavedBackgroundsList() {
    const savedBackgrounds = getSavedBackgrounds();
    savedBackgroundsContainer.innerHTML = "";

    if (savedBackgrounds.length === 0) {
      savedBackgroundsContainer.innerHTML =
        '<p style="color: #666; font-style: italic;">Нет сохраненных фонов</p>';
      return;
    }

    savedBackgrounds.forEach((background) => {
      const bgButton = document.createElement("button");
      bgButton.className = "saved-bg-button";
      bgButton.title = background.name;
      bgButton.style.backgroundImage = `url(${background.url})`;
      bgButton.style.width = 300;
      bgButton.dataset.url = background.url;

      bgButton.addEventListener("click", async () => {
        try {
          // Показываем индикатор загрузки
          bgButton.style.opacity = "1";

          const texture = await PIXI.Assets.load(background.url);
          editor.changeBackground({ texture: texture });

          // Убираем индикатор
          bgButton.style.opacity = "1";

          // Подсвечиваем активную кнопку
          document.querySelectorAll(".saved-bg-button").forEach((btn) => {
            btn.classList.remove("active");
          });
          bgButton.classList.add("active");
        } catch (error) {
          console.error("Ошибка загрузки сохраненного фона:", error);
          bgButton.style.opacity = "1";
          alert("Не удалось загрузить сохраненный фон");
        }
      });

      // Кнопка удаления
      const deleteButton = document.createElement("button");
      deleteButton.innerHTML = "×";
      deleteButton.style.position = "absolute";
      deleteButton.style.top = "-5px";
      deleteButton.style.right = "-5px";
      deleteButton.style.background = "red";
      deleteButton.style.color = "white";
      deleteButton.style.border = "none";
      deleteButton.style.borderRadius = "50%";
      deleteButton.style.width = "20px";
      deleteButton.style.height = "20px";
      deleteButton.style.cursor = "pointer";
      deleteButton.style.fontSize = "12px";
      deleteButton.style.lineHeight = "1";

      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("Удалить этот фон?")) {
          deleteBackground(background.id);
        }
      });

      const wrapper = document.createElement("div");
      wrapper.style.position = "relative";
      wrapper.style.display = "inline-block";
      wrapper.appendChild(bgButton);
      wrapper.appendChild(deleteButton);

      savedBackgroundsContainer.appendChild(wrapper);
    });
  }

  // Функция для удаления фона
  function deleteBackground(id) {
    try {
      const savedBackgrounds = getSavedBackgrounds();
      const filteredBackgrounds = savedBackgrounds.filter((bg) => bg.id !== id);

      localStorage.setItem(
        "saved_backgrounds",
        JSON.stringify(filteredBackgrounds),
      );
      updateSavedBackgroundsList();
    } catch (error) {
      console.error("Ошибка удаления фона:", error);
    }
  }

  // Добавьте эту функцию в класс EditorFrame для поддержки URL текстур
  // (должна быть уже реализована по предыдущим инструкциям)

  // Кнопки для добавления картинки на задний фон
  const bgButton1 = document.getElementById("bg-1");
  const bgButton2 = document.getElementById("bg-2");

  const bgTextures = {};

  async function loadBackgroundTextures() {
    try {
      bgTextures.bg1 = await PIXI.Assets.load("/assets/1.png");
      bgTextures.bg2 = await PIXI.Assets.load("/assets/2.png");
      console.log("Фоновые текстуры загружены");
    } catch (error) {
      console.error("Ошибка загрузки фоновых текстур:", error);
    }
  }

  // Вызовите эту функцию в async функции main.js
  await loadBackgroundTextures();

  // Тогда обработчики можно упростить:
  bgButton1.addEventListener("click", () => {
    editor.changeBackground({ texture: bgTextures.bg1 });
  });

  bgButton2.addEventListener("click", () => {
    editor.changeBackground({ texture: bgTextures.bg2 });
  });

  // Кнопки для добавления виджетов
  const analogCLockButton1 = document.getElementById("analog-clock-1");
  const analogCLockButton2 = document.getElementById("analog-clock-2");
  const analogCLockButton3 = document.getElementById("analog-clock-3");
  const analogCLockButton4 = document.getElementById("analog-clock-4");
  const analogCLockButton5 = document.getElementById("analog-clock-5");
  const analogCLockButton6 = document.getElementById("analog-clock-6");
  const analogCLockButton7 = document.getElementById("analog-clock-7");

  const digitalClockButton1 = document.getElementById("digital-clock-1");
  const digitalClockButton2 = document.getElementById("digital-clock-2");
  const digitalClockButton3 = document.getElementById("digital-clock-3");
  const digitalClockButton4 = document.getElementById("digital-clock-4");

  const calendarButton1 = document.getElementById("calendar-1");
  const calendarButton2 = document.getElementById("calendar-2");
  const calendarButton3 = document.getElementById("calendar-3");
  const calendarButton5 = document.getElementById("calendar-5");
  const calendarButton6 = document.getElementById("calendar-6");
  const calendarButton7 = document.getElementById("calendar-7");

  const weatherButton1 = document.getElementById("weather-1");
  const weatherButton2 = document.getElementById("weather-2");
  const weatherButton3 = document.getElementById("weather-3");
  const weatherButton4 = document.getElementById("weather-4");

  const trafficButton1 = document.getElementById("traffic-1");
  const trafficButton2 = document.getElementById("traffic-2");
  const trafficButton3 = document.getElementById("traffic-3");

  const newsButton1 = document.getElementById("news-1");

  const usdEurButton1 = document.getElementById("usdEur-1");
  const usdEurButton2 = document.getElementById("usdEur-2");
  const usdEurButton3 = document.getElementById("usdEur-3");
  const usdEurButton4 = document.getElementById("usdEur-4");
  const usdEurButton5 = document.getElementById("usdEur-5");
  const usdEurButton6 = document.getElementById("usdEur-6");

  const metalButton1 = document.getElementById("metal-1");
  const metalButton2 = document.getElementById("metal-2");

  const companyButton1 = document.getElementById("company-1");
  const companyButton2 = document.getElementById("company-2");
  const companyButton3 = document.getElementById("company-3");

  // Обработчики для добавления виджетов
  analogCLockButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 1,
      }),
    );
  });
  analogCLockButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 2,
      }),
    );
  });
  analogCLockButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 3,
      }),
    );
  });
  analogCLockButton4.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 4,
      }),
    );
  });
  analogCLockButton5.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 5,
        centerClockColor: 0x101010,
      }),
    );
  });
  analogCLockButton6.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 6,
        centerClockColor: 0x101010,
      }),
    );
  });
  analogCLockButton7.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 7,
        centerClockColor: 0x101010,
      }),
    );
  });

  digitalClockButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new DigitalClockWidget(bounds, 508, 246, {
        showSeconds: true,
      }),
    );
  });
  digitalClockButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new DigitalClockWidget(bounds, 508, 246, {
        showSeconds: false,
      }),
    );
  });
  digitalClockButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new DigitalClockWidget(bounds, 377, 115, {
        showSeconds: true,
      }),
    );
  });
  digitalClockButton4.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new DigitalClockWidget(bounds, 246, 115, {
        showSeconds: false,
      }),
    );
  });

  calendarButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new CalendarWidget(bounds, 508, 377));
  });
  calendarButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new CalendarWidget(bounds, 508, 246));
  });
  calendarButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new CalendarWidget(bounds, 508, 115));
  });
  calendarButton5.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new CalendarWidget(bounds, 246, 246));
  });
  calendarButton6.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new CalendarWidget(bounds, 246, 115));
  });
  calendarButton7.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new CalendarWidget(bounds, 246, 115, {
        dayOnly: true,
      }),
    );
  });

  weatherButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new WeatherWidget(bounds, 508, 246));
  });
  weatherButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new WeatherWidget(bounds, 377, 115));
  });
  weatherButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new WeatherWidget(bounds, 246, 246));
  });
  weatherButton4.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new WeatherWidget(bounds, 246, 115));
  });

  trafficButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new TrafficWidget(bounds, 377, 115));
  });
  trafficButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new TrafficWidget(bounds, 246, 115));
  });
  trafficButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new TrafficWidget(bounds, 115, 115));
  });

  newsButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new NewsWidget(bounds, 508, 538));
  });

  usdEurButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new RatesWidget(bounds, 115, 115, { currency: "USDEURS" }),
    );
  });
  usdEurButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new RatesWidget(bounds, 246, 115, { currency: "EUR" }));
  });
  usdEurButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new RatesWidget(bounds, 246, 115, { currency: "USD" }));
  });
  usdEurButton4.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new RatesWidget(bounds, 246, 115, { currency: "USDEURM" }),
    );
  });
  usdEurButton5.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new RatesWidget(bounds, 377, 115, { currency: "EUR" }));
  });
  usdEurButton6.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new RatesWidget(bounds, 377, 115, { currency: "USD" }));
  });

  metalButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new MetalsWidget(bounds, 508, 246));
  });
  metalButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new MetalsWidget(bounds, 508, 115, {
        showAllMetals: false,
      }),
    );
  });

  companyButton1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new CompanyWidget(bounds, 508, 115, {
        type: "info",
      }),
    );
  });
  companyButton2.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new CompanyWidget(bounds, 508, 115, {
        type: "logos",
      }),
    );
  });
  companyButton3.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new CompanyWidget(bounds, 508, 115, {
        type: "simple-logos",
      }),
    );
  });
  const video1 = document.getElementById("video-1");
  video1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new SimpleRectWidget(bounds, { width: 577, height: 377 }));
  });
  const info1 = document.getElementById("info-1");
  info1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new TextWidget(bounds));
  });
  // const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  // const testCompany = new WeatherWidget(bounds, 246, 115)
  // editor.addWidget(testCompany)
  // editor.deleteSelected()
  // setTimeout(() => {
  //   testCompany.setBackgroundColor("red")
  //   testCompany.setBackgroundAlpha(0.1)
  //   testCompany.setCornerRadius(50)
  // }, 5000)

  const resizeButton = document.getElementById("resize");
  resizeButton.addEventListener("click", () => {
    const width = document.getElementById("width");
    const height = document.getElementById("height");
    if (width.value && height.value) {
      editor.resize(Number(width.value), Number(height.value));
    }
  });
  // Функции для работы с черновиками
  function updateDraftList() {
    const draftSelect = document.getElementById("draft-select");
    draftSelect.innerHTML = '<option value="">Выберите черновик</option>';

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("draft_")) {
        const option = document.createElement("option");
        option.value = key;
        option.textContent = key.replace("draft_", "");
        draftSelect.appendChild(option);
      }
    }
  }

  function saveDraft() {
    const draftNameInput = document.getElementById("draft-name");
    const draftName = draftNameInput.value.trim();

    if (!draftName) {
      alert("Введите название черновика");
      return;
    }

    const exportData = editor.exportScene();
    localStorage.setItem(`draft_${draftName}`, JSON.stringify(exportData));
    draftNameInput.value = "";
    updateDraftList();
    alert(`Черновик "${draftName}" сохранен!`);
  }

  function loadDraft() {
    const draftSelect = document.getElementById("draft-select");
    const selectedDraft = draftSelect.value;

    if (!selectedDraft) {
      alert("Выберите черновик для загрузки");
      return;
    }

    const draftData = localStorage.getItem(selectedDraft);
    if (draftData) {
      try {
        editor.importScene(JSON.parse(draftData));
        alert("Черновик загружен!");
      } catch (e) {
        alert("Ошибка при загрузке черновика: " + e.message);
      }
    }
  }

  function deleteDraft() {
    const draftSelect = document.getElementById("draft-select");
    const selectedDraft = draftSelect.value;

    if (!selectedDraft) {
      alert("Выберите черновик для удаления");
      return;
    }

    if (confirm("Удалить выбранный черновик?")) {
      localStorage.removeItem(selectedDraft);
      updateDraftList();
      alert("Черновик удален!");
    }
  }
  // // Радиальный градиент
  // const radialGradient = {
  //   type: "radial",
  //   center: { x: 0.5, y: 0.5 },
  //   innerRadius: 0,
  //   outerCenter: { x: 0.5, y: 0.5 },
  //   outerRadius: 0.5,
  //   colorStops: [
  //     { offset: 0, color: "yellow" },
  //     { offset: 1, color: "green" },
  //   ],
  //   textureSpace: "local",
  // };

  // // Применение градиента
  // editor.applyGradientBackground(radialGradient);

  // Назначаем обработчики для кнопок черновиков
  document.getElementById("save-draft").addEventListener("click", saveDraft);
  document.getElementById("load-draft").addEventListener("click", loadDraft);
  document
    .getElementById("delete-draft")
    .addEventListener("click", deleteDraft);
  document.getElementById("delete-all").addEventListener("click", () => {
    editor.deleteAll();
  });
  document.getElementById("delete-selected").addEventListener("click", () => {
    editor.deleteSelected();
  });
  // Цвет фона
  document.getElementById("background-color").addEventListener("input", (e) => {
    const color = parseInt(e.target.value.replace("#", "0x"), 16);
    editor.getSelected().map((elem) => elem.setBackgroundColor(color));
  });

  // Прозрачность фона
  document.getElementById("background-alpha").addEventListener("input", (e) => {
    const alpha = parseFloat(e.target.value);
    editor.getSelected().map((elem) => elem.setBackgroundAlpha(alpha));
  });
  document
    .getElementById("background-alpha-input")
    .addEventListener("input", (e) => {
      const alpha = parseFloat(e.target.value);
      editor.getSelected().map((elem) => elem.setBackgroundAlpha(alpha));
    });

  // Радиус закругления
  document.getElementById("corner-radius").addEventListener("input", (e) => {
    const radius = parseInt(e.target.value, 10);
    editor.getSelected().map((elem) => elem.setCornerRadius(radius));
  });
  document
    .getElementById("corner-radius-input")
    .addEventListener("input", (e) => {
      const radius = parseInt(e.target.value, 10);
      editor.getSelected().map((elem) => elem.setCornerRadius(radius));
    });

  document.getElementById("scale0.5x").addEventListener("click", () => {
    editor.getSelected().map((elem) => elem.scale(0.5, {
      minScale: 0.5,
      maxScale: 3.0,
      screenWidth: editor._width,
      screenHeight: editor._height,
    }));
  })
  document.getElementById("scale2x").addEventListener("click", () => {
    editor.getSelected().map((elem) => elem.scale(2, {
      minScale: 0.5,
      maxScale: 3.0,
      screenWidth: editor._width,
      screenHeight: editor._height,
    }));
  })
  document.getElementById("scale3x").addEventListener("click", () => {
    editor.getSelected().map((elem) => elem.scale(3, {
      minScale: 0.5,
      maxScale: 3.0,
      screenWidth: editor._width,
      screenHeight: editor._height,

    }));
  })
  document.getElementById("theme1").addEventListener("click", () => {
    editor.importScene({ "background": { "color": 1973790, "alpha": 1, "hasTexture": false, "hasGradient": true, "gradient": { "type": "radial", "colorStops": [{ "offset": 0, "color": "#ffff00ff" }, { "offset": 1, "color": "#008000ff" }], "center": { "x": 0.5, "y": 0.5 }, "innerRadius": 0, "outerCenter": { "x": 0.5, "y": 0.5 }, "outerRadius": 0.5, "textureSpace": "local" } }, "grid": { "size": 20, "visible": true }, "display": { "width": 1920, "height": 540 }, "widgets": [{ "type": "XLseconds", "widgetClass": "Container", "x": 20, "y": 20, "size": { "width": 500, "height": 240 }, "texture": null, "w": "DigitalClockWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "S", "widgetClass": "Container", "x": 540, "y": 20, "size": { "width": 260, "height": 120 }, "texture": null, "w": "WeatherWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "logos", "widgetClass": "Container", "x": 20, "y": 420, "size": { "width": 497.066650390625, "height": 112.5249306986651 }, "texture": null, "w": "CompanyWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "TRAFFICS", "widgetClass": "Container", "x": 820, "y": 20, "size": { "width": 120, "height": 120 }, "texture": null, "w": "TrafficWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "XS", "widgetClass": "Container", "x": 20, "y": 280, "size": { "width": 240.39999389648438, "height": 112.38211096786871 }, "texture": null, "w": "CalendarWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "USDEURM", "widgetClass": "Container", "x": 280, "y": 280, "size": { "width": 232.933349609375, "height": 108.89160652470783 }, "texture": null, "w": "RatesWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "widgetClass": "Container", "x": 540, "y": 160, "size": { "width": 400.53338623046875, "height": 372.933349609375 }, "texture": null, "w": "NewsWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "SimpleRect", "widgetClass": "Container", "x": 960, "y": 20, "size": { "width": 930.800048828125, "height": 510.5830561011461 }, "texture": null, "w": "SimpleRectWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }] });
  });
  document.getElementById("theme2").addEventListener("click", () => {
    editor.importScene({
      background: {
        color: 16777215,
        alpha: 1,
        hasTexture: true,
        texturePath: "2in",
        hasGradient: true,
        gradient: {
          type: "radial",
          colorStops: [
            { offset: 0, color: "#ffff00ff" },
            { offset: 1, color: "#008000ff" },
          ],
          center: { x: 0.5, y: 0.5 },
          innerRadius: 0,
          outerCenter: { x: 0.5, y: 0.5 },
          outerRadius: 0.5,
          textureSpace: "local",
        },
      },
      grid: { size: 20, visible: true },
      display: { width: 540, height: 1920 },
      widgets: [
        {
          type: "logos",
          widgetClass: "Container",
          x: 20,
          y: 1780,
          size: { width: 500, height: 120 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "metal-L",
          widgetClass: "Container",
          x: 20,
          y: 1520,
          size: { width: 500, height: 240 },
          texture: null,
          w: "MetalsWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "TRAFFICM",
          widgetClass: "Container",
          x: 280,
          y: 540,
          size: { width: 240.39999389648438, height: 112.38211096786871 },
          texture: null,
          w: "TrafficWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "USDEURM",
          widgetClass: "Container",
          x: 20,
          y: 540,
          size: { width: 240.39999389648438, height: 112.38211096786871 },
          texture: null,
          w: "RatesWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "S",
          widgetClass: "Container",
          x: 280,
          y: 280,
          size: { width: 240, height: 240 },
          texture: null,
          w: "CalendarWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "analog-3",
          widgetClass: "Container",
          x: 20,
          y: 280,
          size: { width: 240, height: 240 },
          texture: null,
          w: "AnalogClockWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "XL",
          widgetClass: "Container",
          x: 20,
          y: 20,
          size: { width: 500, height: 240 },
          texture: null,
          w: "WeatherWidget",
          bgColor: 1973790,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          type: "SimpleRect",
          widgetClass: "Container",
          x: null,
          y: 660,
          size: { width: null, height: 280 },
          texture: null,
          w: "SimpleRectWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
        {
          widgetClass: "Container",
          x: 20,
          y: 960,
          size: { width: 500, height: 520 },
          texture: null,
          w: "NewsWidget",
          bgColor: 0,
          bgAlpha: 0.57,
          cornerRadius: 32,
        },
      ],
    });
  });
  document
    .getElementById("proportioned-scaling")
    .addEventListener("change", function (e) {
      const isProportional = e.target.checked;

      // Применяем к выбранным виджетам
      editor.getSelected().forEach((widget) => {
        if (widget.setProportionedScaling) {
          widget.setProportionedScaling(isProportional);
        }
      });

      console.log(
        "Пропорциональное масштабирование:",
        isProportional ? "включено" : "выключено",
      );
    });
  document
    .getElementById("autocenter")
    .addEventListener("change", function (e) {
      const isAutoCenter = e.target.checked;

      // Применяем к выбранным виджетам
      editor.getSelected().forEach((widget) => {
        if (widget.setSnapToGrid) {
          widget.setSnapToGrid(isAutoCenter);
        }
      });
    });



  // Инициализируем список черновиков при загрузке
  updateDraftList();
})();
