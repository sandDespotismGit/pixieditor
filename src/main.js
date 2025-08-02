import { Application, Assets, Sprite, Container } from "pixi.js";
import * as PIXI from 'pixi.js'; // Для модульной системы

import EditorFrame from "./editorFrame/editor";
import WidgetsGrid from "./widgetsGrid/widgets";
import DraggableWidget from "./widgetsGrid/draggable_widget";

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
  editor.changeBackground({ texture: "assets/oboi.jpg" })
  console.log(editor.grid)
  console.log(editor.grid.visible)


  // Пример использования:
  const test_container = new PIXI.Container();
  const test_graphics = new PIXI.Graphics()
    .beginFill(0xFF0000)
    .drawRect(0, 0, 200, 150)
    .endFill();
  test_container.addChild(test_graphics);


  editor.addWidget(test_container); // Добавит draggable виджет
  const widgets = new WidgetsGrid(app)

})();
