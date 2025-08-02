import { Application, Assets, Sprite } from "pixi.js";
import * as PIXI from 'pixi.js'; // Для модульной системы

import EditorFrame from "./editorFrame/editor";
import WidgetsGrid from "./widgetsGrid/widgets";

(async () => {
  // Create a new application
  const app = new Application();


  // Initialize the application
  await app.init({ resizeTo: window, antialias: true });

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

  const editor = new EditorFrame(app)
  console.log(editor.grid)
  console.log(editor.grid.visible)
  const widgets = new WidgetsGrid(editor.container)

})();
