import { Application } from "pixi.js";
import * as PIXI from 'pixi.js';
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

(async () => {
  const app = new Application();

  await app.init({
    resizeTo: window,
    antialias: true,
    eventFeatures: {
      wheel: true,
      globalMove: true
    }
  });

  document.getElementById("pixi-container").appendChild(app.canvas);

  document.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  document.addEventListener('dragover', (e) => {
    e.preventDefault();
  });

  document.addEventListener('drop', (e) => {
    e.preventDefault();
  });

  app.view.draggable = false;
  app.view.addEventListener('dragstart', (e) => {
    e.preventDefault();
    return false;
  });

  app.view.style.touchAction = 'none';
  app.view.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

  const editor = new EditorFrame(app);

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
  const importButton = document.getElementById("import")
  importButton.addEventListener("click", () => {
    editor.importScene({ "background": { "color": 6370691, "alpha": 1 }, "grid": { "size": 20, "visible": true }, "display": { "width": 1734, "height": 765 }, "widgets": [{ "type": "USDEURS", "widgetClass": "Container", "x": 308.0000474717882, "y": 154.51851738823783, "size": { "width": 115, "height": 115 }, "texture": null, "w": "RatesWidget" }] })
  })

  // Добавьте этот код после создания editor



  // Функция для сохранения фона в localStorage
  function saveBackgroundToStorage(name, url) {
    try {
      const savedBackgrounds = getSavedBackgrounds();

      // Проверяем, нет ли уже такого фона
      if (!savedBackgrounds.some(bg => bg.url === url)) {
        savedBackgrounds.push({
          id: Date.now().toString(),
          name: name || `Фон ${savedBackgrounds.length + 1}`,
          url: url,
          date: new Date().toISOString()
        });

        localStorage.setItem('saved_backgrounds', JSON.stringify(savedBackgrounds));
        updateSavedBackgroundsList();
        return true;
      } else {
        alert('Этот фон уже сохранен');
        return false;
      }
    } catch (error) {
      console.error('Ошибка сохранения фона:', error);
      return false;
    }
  }

  // Функция для получения сохраненных фонов
  function getSavedBackgrounds() {
    try {
      const saved = localStorage.getItem('saved_backgrounds');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Ошибка получения сохраненных фонов:', error);
      return [];
    }
  }

  // Функция для обновления списка сохраненных фонов
  function updateSavedBackgroundsList() {
    const savedBackgrounds = getSavedBackgrounds();
    savedBackgroundsContainer.innerHTML = '';

    if (savedBackgrounds.length === 0) {
      savedBackgroundsContainer.innerHTML = '<p style="color: #666; font-style: italic;">Нет сохраненных фонов</p>';
      return;
    }

    savedBackgrounds.forEach(background => {
      const bgButton = document.createElement('button');
      bgButton.className = 'saved-bg-button';
      bgButton.title = background.name;
      bgButton.style.backgroundImage = `url(${background.url})`;
      bgButton.style.width = 300
      bgButton.dataset.url = background.url;

      bgButton.addEventListener('click', async () => {
        try {
          // Показываем индикатор загрузки
          bgButton.style.opacity = '1';

          const texture = await PIXI.Assets.load(background.url);
          editor.changeBackground({ texture: texture });

          // Убираем индикатор
          bgButton.style.opacity = '1';

          // Подсвечиваем активную кнопку
          document.querySelectorAll('.saved-bg-button').forEach(btn => {
            btn.classList.remove('active');
          });
          bgButton.classList.add('active');

        } catch (error) {
          console.error('Ошибка загрузки сохраненного фона:', error);
          bgButton.style.opacity = '1';
          alert('Не удалось загрузить сохраненный фон');
        }
      });

      // Кнопка удаления
      const deleteButton = document.createElement('button');
      deleteButton.innerHTML = '×';
      deleteButton.style.position = 'absolute';
      deleteButton.style.top = '-5px';
      deleteButton.style.right = '-5px';
      deleteButton.style.background = 'red';
      deleteButton.style.color = 'white';
      deleteButton.style.border = 'none';
      deleteButton.style.borderRadius = '50%';
      deleteButton.style.width = '20px';
      deleteButton.style.height = '20px';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.fontSize = '12px';
      deleteButton.style.lineHeight = '1';

      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (confirm('Удалить этот фон?')) {
          deleteBackground(background.id);
        }
      });

      const wrapper = document.createElement('div');
      wrapper.style.position = 'relative';
      wrapper.style.display = 'inline-block';
      wrapper.appendChild(bgButton);
      wrapper.appendChild(deleteButton);

      savedBackgroundsContainer.appendChild(wrapper);
    });
  }

  // Функция для удаления фона
  function deleteBackground(id) {
    try {
      const savedBackgrounds = getSavedBackgrounds();
      const filteredBackgrounds = savedBackgrounds.filter(bg => bg.id !== id);

      localStorage.setItem('saved_backgrounds', JSON.stringify(filteredBackgrounds));
      updateSavedBackgroundsList();
    } catch (error) {
      console.error('Ошибка удаления фона:', error);
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
      bgTextures.bg1 = await PIXI.Assets.load('/assets/1.png');
      bgTextures.bg2 = await PIXI.Assets.load('/assets/2.png');
      console.log('Фоновые текстуры загружены');
    } catch (error) {
      console.error('Ошибка загрузки фоновых текстур:', error);
    }
  }

  // Вызовите эту функцию в async функции main.js
  await loadBackgroundTextures();

  // Тогда обработчики можно упростить:
  bgButton1.addEventListener('click', () => {
    editor.changeBackground({ texture: bgTextures.bg1 });
  });

  bgButton2.addEventListener('click', () => {
    editor.changeBackground({ texture: bgTextures.bg2 });
  });


  // Кнопки для добавления виджетов
  const analogCLockButton1 = document.getElementById("analog-clock-1")
  const analogCLockButton2 = document.getElementById("analog-clock-2")
  const analogCLockButton3 = document.getElementById("analog-clock-3")
  const analogCLockButton4 = document.getElementById("analog-clock-4")
  const analogCLockButton5 = document.getElementById("analog-clock-5")
  const analogCLockButton6 = document.getElementById("analog-clock-6")
  const analogCLockButton7 = document.getElementById("analog-clock-7")

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

  const companyButton1 = document.getElementById("company-1")
  const companyButton2 = document.getElementById("company-2")
  const companyButton3 = document.getElementById("company-3")

  // Обработчики для добавления виджетов
  analogCLockButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 1
    }));
  });
  analogCLockButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 2
    }));
  });
  analogCLockButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 3
    }));
  });
  analogCLockButton4.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 4
    }));
  });
  analogCLockButton5.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 5,
      centerClockColor: 0x101010,
    }));
  });
  analogCLockButton6.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 6,
      centerClockColor: 0x101010,
    }));
  });
  analogCLockButton7.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 7,
      centerClockColor: 0x101010,
    }));
  });


  digitalClockButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new DigitalClockWidget(bounds, 508, 246, {
      showSeconds: true
    }));
  });
  digitalClockButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new DigitalClockWidget(bounds, 508, 246, {
      showSeconds: false
    }));
  });
  digitalClockButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new DigitalClockWidget(bounds, 377, 115, {
      showSeconds: true
    }));
  });
  digitalClockButton4.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new DigitalClockWidget(bounds, 246, 115, {
      showSeconds: false
    }));
  });

  calendarButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CalendarWidget(bounds, 508, 377));
  });
  calendarButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CalendarWidget(bounds, 508, 246));
  });
  calendarButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CalendarWidget(bounds, 508, 115));
  });
  calendarButton5.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CalendarWidget(bounds, 246, 246));
  });
  calendarButton6.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CalendarWidget(bounds, 246, 115));
  });
  calendarButton7.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CalendarWidget(bounds, 246, 115, {
      dayOnly: true
    }));
  });

  weatherButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new WeatherWidget(bounds, 508, 246));
  });
  weatherButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new WeatherWidget(bounds, 377, 115));
  });
  weatherButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new WeatherWidget(bounds, 246, 246));
  });
  weatherButton4.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new WeatherWidget(bounds, 246, 115));
  });

  trafficButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new TrafficWidget(bounds, 377, 115));
  });
  trafficButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new TrafficWidget(bounds, 246, 115));
  });
  trafficButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new TrafficWidget(bounds, 115, 115));
  });

  newsButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new NewsWidget(bounds, 508, 538));
  });

  usdEurButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new RatesWidget(bounds, 115, 115, { currency: "USDEURS" }));
  })
  usdEurButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new RatesWidget(bounds, 246, 115, { currency: "EUR" }));
  })
  usdEurButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new RatesWidget(bounds, 246, 115, { currency: "USD" }));
  })
  usdEurButton4.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new RatesWidget(bounds, 246, 115, { currency: "USDEURM" }));
  })
  usdEurButton5.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new RatesWidget(bounds, 377, 115, { currency: "EUR" }));
  })
  usdEurButton6.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new RatesWidget(bounds, 377, 115, { currency: "USD" }));
  })

  metalButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new MetalsWidget(bounds, 508, 246));
  })
  metalButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new MetalsWidget(bounds, 508, 115, {
      showAllMetals: false
    }));
  })

  companyButton1.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CompanyWidget(bounds, 508, 115, {
      type: "info"
    }));
  })
  companyButton2.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CompanyWidget(bounds, 508, 115, {
      type: "logos"
    }));
  })
  companyButton3.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new CompanyWidget(bounds, 508, 115, {
      type: "simple-logos"
    }));
  })
  const video1 = document.getElementById("video-1");
  video1.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new SimpleRectWidget(bounds));
  })
  const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const testCompany = new WeatherWidget(bounds, 246, 115)
  editor.addWidget(testCompany)
  editor.deleteSelected()
  setTimeout(() => {
    testCompany.setBackgroundColor("red")
    testCompany.setBackgroundAlpha(0.1)
    testCompany.setCornerRadius(50)
  }, 5000)

  const resizeButton = document.getElementById("resize")
  resizeButton.addEventListener("click", () => {
    const width = document.getElementById("width")
    const height = document.getElementById("height")
    if (width.value && height.value) {
      editor.resize(Number(width.value), Number(height.value))
    }
  })
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

  // Назначаем обработчики для кнопок черновиков
  document.getElementById("save-draft").addEventListener("click", saveDraft);
  document.getElementById("load-draft").addEventListener("click", loadDraft);
  document.getElementById("delete-draft").addEventListener("click", deleteDraft);
  document.getElementById("delete-all").addEventListener("click", () => { editor.deleteAll() })
  document.getElementById("delete-selected").addEventListener("click", () => { editor.deleteSelected() })
  // Цвет фона
  document.getElementById("background-color").addEventListener("input", (e) => {
    const color = parseInt(e.target.value.replace("#", "0x"), 16);
    editor.getSelected().map((elem) => elem.setBackgroundColor(color))
  });

  // Прозрачность фона
  document.getElementById("background-alpha").addEventListener("input", (e) => {
    const alpha = parseFloat(e.target.value);
    editor.getSelected().map((elem) => elem.setBackgroundAlpha(alpha))
  });

  // Радиус закругления
  document.getElementById("corner-radius").addEventListener("input", (e) => {
    const radius = parseInt(e.target.value, 10);
    editor.getSelected().map((elem) => elem.setCornerRadius(radius))
  });
  document.getElementById("theme1").addEventListener("click", () => {
    editor.importScene({ "background": { "color": 1052688, "alpha": 1, "hasTexture": false }, "grid": { "size": 20, "visible": true }, "display": { "width": 1920, "height": 540 }, "widgets": [{ "type": "logos", "widgetClass": "Container", "x": 19.99621891798003, "y": 419.65557405888956, "size": { "width": 500, "height": 101 }, "texture": null, "w": "CompanyWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "SimpleRect", "widgetClass": "Container", "x": 940.0576167258606, "y": 19.618109491911433, "size": { "width": 960, "height": 501 }, "texture": null, "w": "SimpleRectWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "TRAFFICS", "widgetClass": "Container", "x": 799.6081921099358, "y": 19.88272710549228, "size": { "width": 120, "height": 120 }, "texture": null, "w": "TrafficWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "S", "widgetClass": "Container", "x": 540.1296529231313, "y": 19.876552268126858, "size": { "width": 240, "height": 120 }, "texture": null, "w": "WeatherWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "USDEURM", "widgetClass": "Container", "x": 279.74716242757984, "y": 279.8157390030841, "size": { "width": 240, "height": 120 }, "texture": null, "w": "RatesWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "XS", "widgetClass": "Container", "x": 20.177114452561028, "y": 279.3702955290243, "size": { "width": 242, "height": 121 }, "texture": null, "w": "CalendarWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "type": "XLseconds", "widgetClass": "Container", "x": 20.0235815938494, "y": 20.27436271112856, "size": { "width": 500, "height": 240 }, "texture": null, "w": "DigitalClockWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }, { "widgetClass": "Container", "x": 539.9518525315758, "y": 155.5398028366739, "size": { "width": 380, "height": 360 }, "texture": null, "w": "NewsWidget", "bgColor": 1973790, "bgAlpha": 1, "cornerRadius": 32 }] }
    )
  })
  document.getElementById("theme2").addEventListener("click", () => {
    editor.importScene({ "background": { "color": 16777215, "alpha": 1, "hasTexture": true, "texturePath": "2in" }, "grid": { "size": 20, "visible": true }, "display": { "width": 540, "height": 1920 }, "widgets": [{ "widgetClass": "Container", "x": 18.920163817610046, "y": 956.3483784129046, "size": { "width": 501, "height": 544 }, "texture": null, "w": "NewsWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "logos", "widgetClass": "Container", "x": 18.522041809229222, "y": 1780.0917736810948, "size": { "width": 502, "height": 118 }, "texture": null, "w": "CompanyWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "metal-L", "widgetClass": "Container", "x": 19.40479408540631, "y": 1519.8535051967194, "size": { "width": 501, "height": 241 }, "texture": null, "w": "MetalsWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "TRAFFICM", "widgetClass": "Container", "x": 274.7234866168798, "y": 540.1566721895408, "size": { "width": 246, "height": 115 }, "texture": null, "w": "TrafficWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "USDEURM", "widgetClass": "Container", "x": 18.755526534927697, "y": 540.3551732877755, "size": { "width": 246, "height": 115 }, "texture": null, "w": "RatesWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "S", "widgetClass": "Container", "x": 273.681512920495, "y": 280.03316627652316, "size": { "width": 246, "height": 246 }, "texture": null, "w": "CalendarWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "analog-3", "widgetClass": "Container", "x": 19.79750023131254, "y": 280.3391422799979, "size": { "width": 246, "height": 246 }, "texture": null, "w": "AnalogClockWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "XL", "widgetClass": "Container", "x": 20.017302491573957, "y": 19.79750023131257, "size": { "width": 501, "height": 239 }, "texture": null, "w": "WeatherWidget", "bgColor": 1973790, "bgAlpha": 0.57, "cornerRadius": 32 }, { "type": "SimpleRect", "widgetClass": "Container", "x": 18, "y": 662.6942873088344, "size": { "width": 502, "height": 278 }, "texture": null, "w": "SimpleRectWidget", "bgColor": 0, "bgAlpha": 0.57, "cornerRadius": 32 }] }

    )
  })

  // Инициализируем список черновиков при загрузке
  updateDraftList();

})();