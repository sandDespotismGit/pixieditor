import { Application, Assets, Sprite, Container } from "pixi.js";
import * as PIXI from 'pixi.js'; // Для модульной системы
import { string2hex } from "pixi.js";


import EditorFrame from "./editorFrame/editor";
import WidgetsGrid from "./widgetsGrid/widgets";
import DraggableWidget from "./widgetsGrid/draggable_widget";
import ClockWidget from "./widgetsGrid/widgets/clock_widget";
import TrafficWidget from "./widgetsGrid/widgets/traffic";
import DigitalClockXLWidget from "./widgetsGrid/widgets/digital_clock";

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



  // Пример использования:
  const test_container = new PIXI.Container();
  const test_graphics = new PIXI.Graphics()
    .beginFill(0xFF0000)
    .drawRect(0, 0, 200, 150)
    .endFill();
  test_container.addChild(test_graphics);
  // const bounds = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  // const clock = new ClockWidget(bounds)
  // const bounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  // const traffic = new TrafficWidget(bounds1)

  const digitalBounds1 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const digitalBounds2 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const digitalBounds3 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());
  const digitalBounds4 = new PIXI.Rectangle(0, 0, editor.getWidth(), editor.getHeight());

  const digitalClock1 = new DigitalClockXLWidget(digitalBounds1, 508, 246, {
    showSeconds: true
  });
  const digitalClock2 = new DigitalClockXLWidget(digitalBounds2, 508, 246, {
    showSeconds: false
  });
  const digitalClock3 = new DigitalClockXLWidget(digitalBounds3, 377, 115, {
    showSeconds: true,
    fontSizeMain: 70
  });
  const digitalClock4 = new DigitalClockXLWidget(digitalBounds4, 246, 115, {
    showSeconds: false,
    fontSizeMain: 70
  });

  // Добавление виджетов при нажатии на кнопку

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

  console.log(editor.exportScene())

})();
