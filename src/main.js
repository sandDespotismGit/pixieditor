import { Application } from "pixi.js";
import * as PIXI from 'pixi.js'; // Для модульной системы

import EditorFrame from "./editorFrame/editor";
import DigitalClockWidget from "./widgetsGrid/widgets/digital_clock";
import CalendarWidget from "./widgetsGrid/widgets/calendar";
import WeatherWidget from "./widgetsGrid/widgets/weather";
import TrafficWidget from "./widgetsGrid/widgets/traffic";
import CompanyWidget from "./widgetsGrid/widgets/about_company";
import RatesWidget from "./widgetsGrid/widgets/rates";


(async () => {
  // Create a new application
  const app = new Application();


  // Initialize the application
  await app.init({
    resizeTo: window, antialias: true, // Важно для работы wheel-событий
    eventFeatures: {
      wheel: true,
      globalMove: true
    }
  });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);
  // Отключаем стандартное поведение перетаскивания для всего документа
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
  // Дополнительная настройка для предотвращения прокрутки страницы
  app.view.style.touchAction = 'none';
  app.view.addEventListener('wheel', (e) => e.preventDefault(), { passive: false });

  const editor = new EditorFrame(app)
  // === Панель управления фоном ===
  const colorInput = document.getElementById("bg-color");
  const alphaInput = document.getElementById("bg-alpha");
  const textureInput = document.getElementById("bg-texture");
  const tilingInput = document.getElementById("bg-tiling");
  const exportButton = document.getElementById("export");

  // Цвет
  colorInput.addEventListener("input", (e) => {
    editor.changeBackground({ color: e.target.value });
  });


  // Прозрачность
  alphaInput.addEventListener("input", (e) => {
    editor.changeBackground({ alpha: parseFloat(e.target.value) });
  });

  // Экспорт
  exportButton.addEventListener("click", (e) => {
    console.log(editor.exportScene())
  })


  console.log(editor.grid)
  console.log(editor.grid.visible)

  // Кнопки для добавления виджетов

  // Цифровые часы
  const digitalClockButton1 = document.getElementById("digital-clock-1")
  const digitalClockButton2 = document.getElementById("digital-clock-2")
  const digitalClockButton3 = document.getElementById("digital-clock-3")
  const digitalClockButton4 = document.getElementById("digital-clock-4")

  // Календари
  const calendarButton1 = document.getElementById("calendar-1");
  const calendarButton2 = document.getElementById("calendar-2");
  const calendarButton3 = document.getElementById("calendar-3");
  const calendarButton5 = document.getElementById("calendar-5");
  const calendarButton6 = document.getElementById("calendar-6");
  const calendarButton7 = document.getElementById("calendar-7");

  // Погода
  const weatherButton1 = document.getElementById("weather-1");
  const weatherButton2 = document.getElementById("weather-2");
  const weatherButton3 = document.getElementById("weather-3");
  const weatherButton4 = document.getElementById("weather-4");

  // Трафик
  const trafficButton1 = document.getElementById("traffic-1");
  const trafficButton2 = document.getElementById("traffic-2");
  const trafficButton3 = document.getElementById("traffic-3");

  // Новости

  // Курс доллара / евро
  const usdEurButton1 = document.getElementById("usdEur-1");
  const usdEurButton2 = document.getElementById("usdEur-2");
  const usdEurButton3 = document.getElementById("usdEur-3");
  const usdEurButton4 = document.getElementById("usdEur-4");
  const usdEurButton5 = document.getElementById("usdEur-5");
  const usdEurButton6 = document.getElementById("usdEur-6");

  // О компании
  const companyButton1 = document.getElementById("company-1")
  const companyButton2 = document.getElementById("company-2")
  const companyButton3 = document.getElementById("company-3")

  // Цифровые часы
  const digitalBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const digitalBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const digitalBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const digitalBounds4 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const digitalClock1 = new DigitalClockWidget(digitalBounds1, 508, 246, {
    showSeconds: true
  });
  const digitalClock2 = new DigitalClockWidget(digitalBounds2, 508, 246, {
    showSeconds: false
  });
  const digitalClock3 = new DigitalClockWidget(digitalBounds3, 377, 115, {
    showSeconds: true
  });
  const digitalClock4 = new DigitalClockWidget(digitalBounds4, 246, 115, {
    showSeconds: false
  });

  // Календари
  const calendarBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const calendarBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const calendarBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const calendarBounds5 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const calendarBounds6 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const calendarBounds7 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const calendar1 = new CalendarWidget(calendarBounds1, 508, 377);
  const calendar2 = new CalendarWidget(calendarBounds2, 508, 246);
  const calendar3 = new CalendarWidget(calendarBounds3, 508, 115);
  const calendar5 = new CalendarWidget(calendarBounds5, 246, 246);
  const calendar6 = new CalendarWidget(calendarBounds6, 246, 115);
  const calendar7 = new CalendarWidget(calendarBounds7, 246, 115, {
    dayOnly: true
  });

  // Погода
  const weatherBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const weatherBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const weatherBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const weatherBounds4 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const weather1 = new WeatherWidget(weatherBounds1, 508, 246);
  const weather2 = new WeatherWidget(weatherBounds2, 377, 115);
  const weather3 = new WeatherWidget(weatherBounds3, 246, 246);
  const weather4 = new WeatherWidget(weatherBounds4, 246, 115);

  // Трафик
  const trafficBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const trafficBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const trafficBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const traffic1 = new TrafficWidget(trafficBounds1, 377, 115);
  const traffic2 = new TrafficWidget(trafficBounds2, 246, 115);
  const traffic3 = new TrafficWidget(trafficBounds3, 115, 115);

  // Новости

  // Курс доллара/евро
  const ratesBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const ratesBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const ratesBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const ratesBounds4 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const ratesBounds5 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const ratesBounds6 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const rates1 = new RatesWidget(ratesBounds1, 377, 115, {
    currency: 'USD'
  });
  const rates2 = new RatesWidget(ratesBounds2, 377, 115, {
    currency: 'EUR'
  });
  const rates3 = new RatesWidget(ratesBounds3, 246, 115, {
    showBoth: true
  });
  const rates4 = new RatesWidget(ratesBounds4, 246, 115, {
    currency: 'USD'
  });
  const rates5 = new RatesWidget(ratesBounds5, 246, 115, {
    currency: 'EUR'
  });
  const rates6 = new RatesWidget(ratesBounds6, 115, 115, {
    showBoth: true
  });

  // О компании
  const companyBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const companyBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const companyBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const company1 = new CompanyWidget(companyBounds1, 508, 115, {
    type: 'info'
  });
  const company2 = new CompanyWidget(companyBounds2, 508, 115, {
    type: 'logos'
  });
  const company3 = new CompanyWidget(companyBounds3, 508, 115, {
    type: 'simple-logos'
  });

  // Добавление виджетов в рабочее пространство при нажатии на кнопку

  // Цифровые часы
  digitalClockButton1.addEventListener('click', () => {
    editor.addWidget(digitalClock1)
  })
  digitalClockButton2.addEventListener('click', () => {
    editor.addWidget(digitalClock2)
  })
  digitalClockButton3.addEventListener('click', () => {
    editor.addWidget(digitalClock3)
  })
  digitalClockButton4.addEventListener('click', () => {
    editor.addWidget(digitalClock4)
  })

  // Календари
  calendarButton1.addEventListener('click', () => {
    editor.addWidget(calendar1)
  })
  calendarButton2.addEventListener('click', () => {
    editor.addWidget(calendar2)
  })
  calendarButton3.addEventListener('click', () => {
    editor.addWidget(calendar3)
  })
  calendarButton5.addEventListener('click', () => {
    editor.addWidget(calendar5)
  })
  calendarButton6.addEventListener('click', () => {
    editor.addWidget(calendar6)
  })
  calendarButton7.addEventListener('click', () => {
    editor.addWidget(calendar7)
  })

  // Погода
  weatherButton1.addEventListener('click', () => {
    editor.addWidget(weather1)
  })
  weatherButton2.addEventListener('click', () => {
    editor.addWidget(weather2)
  })
  weatherButton3.addEventListener('click', () => {
    editor.addWidget(weather3)
  })
  weatherButton4.addEventListener('click', () => {
    editor.addWidget(weather4)
  })

  // Трафик
  trafficButton1.addEventListener('click', () => {
    editor.addWidget(traffic1)
  })
  trafficButton2.addEventListener('click', () => {
    editor.addWidget(traffic2)
  })
  trafficButton3.addEventListener('click', () => {
    editor.addWidget(traffic3)
  })

  // Новости

  // Курс доллара/евро
  usdEurButton1.addEventListener('click', () => {
    editor.addWidget(rates1)
  })
  usdEurButton2.addEventListener('click', () => {
    editor.addWidget(rates2)
  })
  usdEurButton3.addEventListener('click', () => {
    editor.addWidget(rates3)
  })
  usdEurButton4.addEventListener('click', () => {
    editor.addWidget(rates4)
  })
  usdEurButton5.addEventListener('click', () => {
    editor.addWidget(rates5)
  })
  usdEurButton6.addEventListener('click', () => {
    editor.addWidget(rates6)
  })

  // О компании
  companyButton1.addEventListener('click', () => {
    editor.addWidget(company1)
  })
  companyButton2.addEventListener('click', () => {
    editor.addWidget(company2)
  })
  companyButton3.addEventListener('click', () => {
    editor.addWidget(company3)
  })

  console.log(editor.exportScene())

})();
