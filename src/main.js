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
    editor.importScene({ "background": { "color": 15098112, "alpha": 1 }, "grid": { "size": 20, "visible": true }, "display": { "width": 1734, "height": 686 }, "widgets": [{ "type": "TRAFFICL", "widgetClass": "Container", "x": 453.22358559188524, "y": 302.1490570612568, "size": { "width": 377, "height": 115 }, "texture": null, "w": "TrafficWidget" }, { "type": "TRAFFICL", "widgetClass": "Container", "x": 37.12846418467075, "y": 300.86876302753126, "size": { "width": 377, "height": 115 }, "texture": null, "w": "TrafficWidget" }, { "type": "XS_day", "widgetClass": "Container", "x": 582.5331783425497, "y": 174.11980020656506, "size": { "width": 246, "height": 115 }, "texture": null, "w": "CalendarWidget" }, { "type": "S", "widgetClass": "Container", "x": 579.9725484128514, "y": 40.969367216970994, "size": { "width": 246, "height": 115 }, "texture": null, "w": "DigitalClockWidget" }, { "type": "XLseconds", "widgetClass": "Container", "x": 39.68909411436903, "y": 39.689073183245455, "size": { "width": 508, "height": 246 }, "texture": null, "w": "DigitalClockWidget" }] })
  })


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
      bgDial: 0x101010,
      strokeDial: 0x101010,
    }));
  });
  analogCLockButton6.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 6,
      bgDial: 0x101010,
      strokeDial: 0x101010
    }));
  });
  analogCLockButton7.addEventListener('click', () => {
    const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
    editor.addWidget(new AnalogClockWidget(bounds, 246, 246, {
      clockType: 7,
      bgDial: 0x101010,
      strokeDial: 0x101010
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

  const resizeButton = document.getElementById("resize")
  resizeButton.addEventListener("click", () => {
    const width = document.getElementById("width")
    const height = document.getElementById("height")
    if (width.value && height.value) {
      editor.resize(Number(width.value), Number(height.value))
    }
  })
})();