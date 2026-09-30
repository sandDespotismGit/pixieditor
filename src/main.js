import { Application } from "pixi.js";
import * as PIXI from "pixi.js";
import EditorFrame from "./editorFrame/editor";
import DigitalClockWidget from "./widgetsGrid/widgets/digital_clock";
import CalendarWidget from "./widgetsGrid/widgets/calendar";
import WeatherWidget from "./widgetsGrid/widgets/weather";
import TrafficWidget from "./widgetsGrid/widgets/traffic";
import RatesWidget from "./widgetsGrid/widgets/rates";
import MetalsWidget from "./widgetsGrid/widgets/metals";
import AnalogClockWidget, {
  ANALOG_CLOCK_CUSTOM_FACES,
  ANALOG_CLOCK_CUSTOM_HANDS,
} from "./widgetsGrid/widgets/analog_clock";
import NewsWidget from "./widgetsGrid/widgets/news";
import CompanyWidget from "./widgetsGrid/widgets/about_company";
import SimpleRectWidget from "./widgetsGrid/widgets/video";
import TextWidget from "./widgetsGrid/widgets/text_widget";
import ImageWidget from "./widgetsGrid/widgets/image_widget";
import DirectionFloorWidget from "./widgetsGrid/widgets/direction";
import VideoWidget from "./widgetsGrid/widgets/video";
import DraggableWidget from "./widgetsGrid/draggable_widget";
import ShapeWidget from "./widgetsGrid/widgets/shape_widget";
import DrawingWidget from "./widgetsGrid/widgets/drawing_widget";
import AudioPlayerWidget, {
  AUDIO_PLAYLIST_PRESETS,
} from "./widgetsGrid/widgets/audio_player_widget";

// Добавьте эту функцию в начало файла, после импортов
function getPanelIdFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("panel_id");
}

async function loadEditorFonts() {
  if (!document.fonts?.load) return;
  const fonts = [
    "16px Inter",
    "16px Montserrat",
    "16px 'Montserrat Alternates'",
    "16px Rubik",
  ];
  await Promise.allSettled(fonts.map((font) => document.fonts.load(font)));
  await document.fonts.ready;
}

(async () => {
  await loadEditorFonts();
  const app = new Application();

  await app.init({
    resizeTo: window,
    antialias: true,
    eventFeatures: {
      wheel: true,
      globalMove: true,
    },
  });
  window.addEventListener("error", (event) => {
    if (
      event.message.includes("JSON Parse error") ||
      event.message.includes("is not valid JSON")
    ) {
      event.preventDefault();
      console.warn("Suppressed JSON parse error:", event.error);
    }
  });
  // Custom Alert System - полная замена системного alert
  (function () {
    // Сохраняем оригинальный alert
    const originalAlert = window.alert;

    // Создаем стили для уведомлений
    const style = document.createElement("style");
    style.textContent = `
        /* Контейнер для уведомлений */
        .custom-alert-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 999999;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-width: 400px;
            width: calc(100% - 40px);
            pointer-events: none;
        }
        
        /* Базовое уведомление */
        .custom-alert {
            background: rgba(21, 27, 41, 0.95);
            backdrop-filter: blur(15px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            padding: 16px 20px;
            color: white;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.05);
            display: flex;
            align-items: flex-start;
            gap: 14px;
            transform: translateX(120%);
            opacity: 0;
            transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
            position: relative;
            overflow: hidden;
            pointer-events: auto;
            cursor: pointer;
        }
        
        .custom-alert.show {
            transform: translateX(0);
            opacity: 1;
        }
        
        /* Градиентная линия сверху */
        .custom-alert::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, var(--accent-primary, #00d4ff), var(--accent-secondary, #7b61ff));
        }
        
        /* Иконка */
        .custom-alert-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            flex-shrink: 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            backdrop-filter: blur(5px);
        }
        
        /* Контент */
        .custom-alert-content {
            flex: 1;
            min-width: 0;
        }
        
        .custom-alert-title {
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 4px;
            color: white;
            letter-spacing: 0.3px;
        }
        
        .custom-alert-message {
            font-size: 13px;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1.5;
            word-break: break-word;
        }
        
        /* Кнопка закрытия */
        .custom-alert-close {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.05);
            border: none;
            border-radius: 6px;
            color: rgba(255, 255, 255, 0.6);
            font-size: 16px;
            cursor: pointer;
            transition: all 0.2s;
            padding: 0;
            flex-shrink: 0;
        }
        
        .custom-alert-close:hover {
            background: rgba(255, 255, 255, 0.15);
            color: white;
            transform: scale(1.1);
        }
        
        /* Прогресс-бар */
        .custom-alert-progress {
            position: absolute;
            bottom: 0;
            left: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--accent-primary, #00d4ff), var(--accent-secondary, #7b61ff));
            width: 100%;
            transform-origin: left;
            transition: transform linear;
        }
        
        /* Типы уведомлений */
        .custom-alert.success .custom-alert-icon {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }
        
        .custom-alert.success::before {
            background: linear-gradient(90deg, #10b981, #34d399);
        }
        
        .custom-alert.error .custom-alert-icon {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }
        
        .custom-alert.error::before {
            background: linear-gradient(90deg, #ef4444, #f87171);
        }
        
        .custom-alert.warning .custom-alert-icon {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
        }
        
        .custom-alert.warning::before {
            background: linear-gradient(90deg, #f59e0b, #fbbf24);
        }
        
        .custom-alert.info .custom-alert-icon {
            background: rgba(59, 130, 246, 0.2);
            color: #3b82f6;
        }
        
        .custom-alert.info::before {
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
        }
        
        /* Модальное окно подтверждения */
        .custom-confirm-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
            z-index: 1000000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            transition: opacity 0.2s ease;
        }
        
        .custom-confirm-overlay.show {
            opacity: 1;
        }
        
        .custom-confirm {
            background: rgba(21, 27, 41, 0.95);
            backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 24px;
            width: 90%;
            max-width: 400px;
            color: white;
            font-family: 'Inter', sans-serif;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.05);
            transform: scale(0.9);
            opacity: 0;
            transition: all 0.2s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .custom-confirm-overlay.show .custom-confirm {
            transform: scale(1);
            opacity: 1;
        }
        
        .custom-confirm-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 16px;
        }
        
        .custom-confirm-icon {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, rgba(0, 212, 255, 0.2), rgba(123, 97, 255, 0.2));
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
        }
        
        .custom-confirm-title {
            font-size: 18px;
            font-weight: 600;
            color: white;
            margin: 0;
        }
        
        .custom-confirm-message {
            font-size: 14px;
            line-height: 1.6;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 24px;
            padding: 0 4px;
        }
        
        .custom-confirm-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
        }
        
        .custom-confirm-btn {
            padding: 10px 20px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
            font-family: 'Inter', sans-serif;
            background: rgba(255, 255, 255, 0.05);
            color: white;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .custom-confirm-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            border-color: var(--accent-primary, #00d4ff);
            transform: translateY(-2px);
        }
        
        .custom-confirm-btn.primary {
            background: linear-gradient(135deg, var(--accent-primary, #00d4ff), var(--accent-secondary, #7b61ff));
            border: none;
            color: white;
        }
        
        .custom-confirm-btn.primary:hover {
            box-shadow: 0 5px 15px rgba(0, 212, 255, 0.3);
        }
        
        /* Анимации */
        @keyframes slideIn {
            from {
                transform: translateX(120%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(120%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Создаем контейнер для уведомлений
    let container = document.querySelector(".custom-alert-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "custom-alert-container";
      document.body.appendChild(container);
    }

    // Глобальный счетчик для ID
    let alertCounter = 0;

    // Функция создания уведомления
    function createAlert(
      message,
      type = "info",
      title = null,
      duration = 5000,
    ) {
      const id = `alert-${Date.now()}-${alertCounter++}`;

      // Определяем заголовок по умолчанию
      if (!title) {
        switch (type) {
          case "success":
            title = "✅ Успешно";
            break;
          case "error":
            title = "❌ Ошибка";
            break;
          case "warning":
            title = "⚠️ Внимание";
            break;
          default:
            title = "ℹ️ Информация";
        }
      }

      // Определяем иконку
      let icon = "ℹ️";
      switch (type) {
        case "success":
          icon = "✓";
          break;
        case "error":
          icon = "✕";
          break;
        case "warning":
          icon = "⚠";
          break;
        default:
          icon = "ℹ";
      }

      const alertElement = document.createElement("div");
      alertElement.id = id;
      alertElement.className = `custom-alert ${type}`;
      alertElement.innerHTML = `
            <div class="custom-alert-icon">${icon}</div>
            <div class="custom-alert-content">
                <div class="custom-alert-title">${title}</div>
                <div class="custom-alert-message">${message}</div>
            </div>
            <button class="custom-alert-close" onclick="(function(e){e.stopPropagation(); window.customAlert.close('${id}');})(event)">✕</button>
            <div class="custom-alert-progress" style="transform: scaleX(1);"></div>
        `;

      container.appendChild(alertElement);

      // Анимация появления
      setTimeout(() => alertElement.classList.add("show"), 10);

      // Анимация прогресс-бара
      const progressBar = alertElement.querySelector(".custom-alert-progress");
      progressBar.style.transition = `transform ${duration}ms linear`;
      setTimeout(() => {
        progressBar.style.transform = "scaleX(0)";
      }, 50);

      // Автоматическое закрытие
      const timeoutId = setTimeout(() => {
        closeAlert(id);
      }, duration);

      // Сохраняем timeoutId для возможности отмены
      alertElement.dataset.timeoutId = timeoutId;

      return id;
    }

    // Функция закрытия уведомления
    function closeAlert(id) {
      const alert = document.getElementById(id);
      if (!alert) return;

      // Очищаем таймаут
      if (alert.dataset.timeoutId) {
        clearTimeout(parseInt(alert.dataset.timeoutId));
      }

      // Анимация закрытия
      alert.style.animation = "slideOut 0.2s ease-out forwards";

      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 200);
    }

    // Функция закрытия всех уведомлений
    function closeAllAlerts() {
      document.querySelectorAll(".custom-alert").forEach((alert) => {
        closeAlert(alert.id);
      });
    }

    // Кастомный confirm
    function customConfirm(message, options = {}) {
      return new Promise((resolve) => {
        const {
          title = "Подтверждение",
          confirmText = "Подтвердить",
          cancelText = "Отмена",
          icon = "❓",
          type = "info",
        } = options;

        // Удаляем предыдущий confirm если есть
        const existingOverlay = document.querySelector(
          ".custom-confirm-overlay",
        );
        if (existingOverlay) {
          existingOverlay.remove();
        }

        const overlay = document.createElement("div");
        overlay.className = "custom-confirm-overlay";

        const confirmDialog = document.createElement("div");
        confirmDialog.className = "custom-confirm";
        confirmDialog.innerHTML = `
                <div class="custom-confirm-header">
                    <div class="custom-confirm-icon">${icon}</div>
                    <h3 class="custom-confirm-title">${title}</h3>
                </div>
                <div class="custom-confirm-message">${message}</div>
                <div class="custom-confirm-actions">
                    <button class="custom-confirm-btn cancel-btn">${cancelText}</button>
                    <button class="custom-confirm-btn primary confirm-btn">${confirmText}</button>
                </div>
            `;

        overlay.appendChild(confirmDialog);
        document.body.appendChild(overlay);

        // Анимация появления
        setTimeout(() => overlay.classList.add("show"), 10);

        // Обработчики
        const confirmBtn = confirmDialog.querySelector(".confirm-btn");
        const cancelBtn = confirmDialog.querySelector(".cancel-btn");

        const close = (result) => {
          overlay.classList.remove("show");
          setTimeout(() => {
            overlay.remove();
            resolve(result);
          }, 200);
        };

        confirmBtn.addEventListener("click", () => close(true));
        cancelBtn.addEventListener("click", () => close(false));

        // Закрытие по клику вне диалога
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            close(false);
          }
        });

        // Закрытие по Escape
        const escapeHandler = (e) => {
          if (e.key === "Escape") {
            close(false);
            document.removeEventListener("keydown", escapeHandler);
          }
        };
        document.addEventListener("keydown", escapeHandler);
      });
    }

    // Кастомный prompt
    function customPrompt(message, defaultValue = "", options = {}) {
      return new Promise((resolve) => {
        const {
          title = "Ввод данных",
          confirmText = "OK",
          cancelText = "Отмена",
          icon = "📝",
          placeholder = "",
        } = options;

        // Удаляем предыдущий prompt если есть
        const existingOverlay = document.querySelector(
          ".custom-confirm-overlay",
        );
        if (existingOverlay) {
          existingOverlay.remove();
        }

        const overlay = document.createElement("div");
        overlay.className = "custom-confirm-overlay";

        const promptDialog = document.createElement("div");
        promptDialog.className = "custom-confirm";
        promptDialog.innerHTML = `
                <div class="custom-confirm-header">
                    <div class="custom-confirm-icon">${icon}</div>
                    <h3 class="custom-confirm-title">${title}</h3>
                </div>
                <div class="custom-confirm-message">${message}</div>
                <div style="margin-bottom: 20px;">
                    <input type="text" id="custom-prompt-input" class="form-input" 
                           value="${defaultValue.replace(/"/g, "&quot;")}" 
                           placeholder="${placeholder}"
                           style="width: 100%; padding: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: white; font-size: 14px;">
                </div>
                <div class="custom-confirm-actions">
                    <button class="custom-confirm-btn cancel-btn">${cancelText}</button>
                    <button class="custom-confirm-btn primary confirm-btn">${confirmText}</button>
                </div>
            `;

        overlay.appendChild(promptDialog);
        document.body.appendChild(overlay);

        // Анимация появления
        setTimeout(() => overlay.classList.add("show"), 10);

        const input = promptDialog.querySelector("#custom-prompt-input");

        // Фокус на инпуте
        setTimeout(() => input.focus(), 150);

        // Обработчики
        const confirmBtn = promptDialog.querySelector(".confirm-btn");
        const cancelBtn = promptDialog.querySelector(".cancel-btn");

        const close = (result) => {
          overlay.classList.remove("show");
          setTimeout(() => {
            overlay.remove();
            resolve(result);
          }, 200);
        };

        confirmBtn.addEventListener("click", () => close(input.value));
        cancelBtn.addEventListener("click", () => close(null));

        // Enter в инпуте
        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") {
            close(input.value);
          }
        });

        // Закрытие по клику вне диалога
        overlay.addEventListener("click", (e) => {
          if (e.target === overlay) {
            close(null);
          }
        });

        // Закрытие по Escape
        const escapeHandler = (e) => {
          if (e.key === "Escape") {
            close(null);
            document.removeEventListener("keydown", escapeHandler);
          }
        };
        document.addEventListener("keydown", escapeHandler);
      });
    }

    // Основной объект для работы с кастомными алертами
    window.customAlert = {
      // Основные методы
      show: (message, type = "info", duration = 5000) =>
        createAlert(message, type, null, duration),
      success: (message, duration = 5000) =>
        createAlert(message, "success", null, duration),
      error: (message, duration = 7000) =>
        createAlert(message, "error", null, duration),
      warning: (message, duration = 6000) =>
        createAlert(message, "warning", null, duration),
      info: (message, duration = 5000) =>
        createAlert(message, "info", null, duration),

      // Метод с кастомным заголовком
      custom: (message, title, type = "info", duration = 5000) =>
        createAlert(message, type, title, duration),

      // Управление уведомлениями
      close: closeAlert,
      closeAll: closeAllAlerts,

      // Диалоги
      confirm: customConfirm,
      prompt: customPrompt,

      // Конфигурация
      config: {
        defaultDuration: 5000,
        position: "top-right",
      },
    };

    // Функция для мониторинга текстур в Pixi (для отладки)
    function monitorTextures() {
      if (PIXI.utils && PIXI.utils.TextureCache) {
        const textureCount = Object.keys(PIXI.utils.TextureCache).length;
        console.log(`📊 Текстур в кэше: ${textureCount}`);

        // Если текстур слишком много, показываем предупреждение
        if (textureCount > 20) {
          console.warn(
            `⚠️ Слишком много текстур (${textureCount}). Возможна утечка памяти.`,
          );

          // Для отладки показываем, какие текстуры висят
          if (textureCount > 30) {
            console.log(
              "Список текстур:",
              Object.keys(PIXI.utils.TextureCache),
            );
          }
        }
      }
    }

    // Вызывайте monitorTextures() при переключении фона для отладки

    // === ПЕРЕОПРЕДЕЛЕНИЕ СИСТЕМНЫХ ФУНКЦИЙ ===

    // 1. Переопределяем alert
    window.alert = function (message) {
      // Если сообщение - ошибка, показываем как error, иначе как info
      if (message instanceof Error) {
        window.customAlert.error(message.message || "Произошла ошибка");
      } else if (
        typeof message === "string" &&
        message.toLowerCase().includes("ошибк")
      ) {
        window.customAlert.error(message);
      } else {
        window.customAlert.info(String(message));
      }

      // Для совместимости вызываем оригинальный alert в консоли
      console.log("[Alert]", message);
    };

    // 2. Переопределяем confirm
    window.confirm = function (message) {
      // Возвращаем Promise, но для совместимости можно использовать callback
      return window.customAlert.confirm(message);
    };

    // 3. Переопределяем prompt
    window.prompt = function (message, defaultValue) {
      return window.customAlert.prompt(message, defaultValue);
    };

    // 4. Перехват ошибок для автоматического показа
    window.addEventListener("error", function (e) {
      window.customAlert.error(e.message || "Произошла ошибка выполнения");
    });

    window.addEventListener("unhandledrejection", function (e) {
      window.customAlert.error(
        e.reason?.message || "Необработанная ошибка Promise",
      );
    });

    // Сохраняем оригинальные функции для возможности восстановления
    window.originalAlert = originalAlert;

    console.log(
      "✅ Системные alert/confirm/prompt переопределены на кастомные",
    );

    // Возвращаем объект с функциями
    return window.customAlert;
  })();

  class UndoRedoManager {
    constructor(editor, maxSteps = 20) {
      this.editor = editor;
      this.app = editor.app;
      this.actions = [];
      this.currentPos = -1;
      this.maxSteps = maxSteps;
      this.isRestoring = false;
      this.storageKey = "undo_redo_history";
      this.historyVersion = 2;

      this.undoBtn = document.getElementById("undo-btn");
      this.redoBtn = document.getElementById("redo-btn");

      if (!this.undoBtn || !this.redoBtn) {
        console.error("❌ Кнопки отмены/повтора не найдены!");
        return;
      }

      this.undoBtn.addEventListener("click", () => this.undo());
      this.redoBtn.addEventListener("click", () => this.redo());

      this.loadFromStorage();

      if (this.actions.length === 0) {
        setTimeout(() => {
          console.log("📝 Сохраняем начальное состояние");
          this.save("Начальное состояние");
        }, 1000);
      } else {
        console.log(`📀 Загружено ${this.actions.length} состояний`);
        this.updateButtons();
        this.show();
      }
    }

    getCurrentState() {
      try {
        return this.editor.exportScene();
      } catch (e) {
        console.warn("Не удалось получить текущее состояние:", e);
        return null;
      }
    }

    save(description = "Действие") {
      if (this.isRestoring) {
        console.log("⏭️ Пропускаем сохранение (идет восстановление)");
        return;
      }

      try {
        const currentState = this.editor.exportScene();

        // Проверяем, изменилось ли состояние относительно текущей позиции
        const currentAction = this.actions[this.currentPos];
        if (
          currentAction &&
          JSON.stringify(currentAction.data) === JSON.stringify(currentState)
        ) {
          console.log("⏭️ Состояние не изменилось, пропускаем");
          return;
        }

        // Обрезаем историю после текущей позиции
        if (this.currentPos < this.actions.length - 1) {
          this.actions = this.actions.slice(0, this.currentPos + 1);
        }

        // Добавляем новое действие
        this.actions.push({
          data: JSON.parse(JSON.stringify(currentState)),
          desc: description,
          time: Date.now(),
        });

        // Ограничиваем количество шагов
        if (this.actions.length > this.maxSteps) {
          this.actions.shift();
        }

        this.currentPos = this.actions.length - 1;
        this.saveToStorage();
        this.updateButtons();
        this.show();
      } catch (e) {
        console.error("Ошибка сохранения:", e);
      }
    }

    // Безопасная остановка видео-фона
    stopVideoBackground() {
      try {
        // Останавливаем видео в gradientBuilder
        if (window.gradientBuilder) {
          // Останавливаем видео фон
          if (window.gradientBuilder.stopVideoBackground) {
            window.gradientBuilder.stopVideoBackground();
          }

          // Очищаем ссылки на видео элемент
          if (window.gradientBuilder.videoElement) {
            try {
              const video = window.gradientBuilder.videoElement;
              if (video) {
                video.pause();
                video.removeAttribute("src");
                video.load();
              }
            } catch (e) {}
            window.gradientBuilder.videoElement = null;
          }

          // Очищаем текстуру видео
          if (window.gradientBuilder.videoTexture) {
            try {
              const texture = window.gradientBuilder.videoTexture;
              if (texture && !texture.destroyed) {
                texture.destroy(true);
              }
            } catch (e) {}
            window.gradientBuilder.videoTexture = null;
          }

          // Очищаем анимационный фрейм
          if (window.gradientBuilder.videoAnimationFrame) {
            cancelAnimationFrame(window.gradientBuilder.videoAnimationFrame);
            window.gradientBuilder.videoAnimationFrame = null;
          }
        }

        // Также проверяем, нет ли видео в самом редакторе
        if (
          this.editor &&
          this.editor._background &&
          this.editor._background.videoElement
        ) {
          try {
            const video = this.editor._background.videoElement;
            if (video) {
              video.pause();
              video.removeAttribute("src");
              video.load();
            }
          } catch (e) {}
          this.editor._background.videoElement = null;
          this.editor._background.videoTexture = null;
        }

        console.log("⏹️ Видео-фон остановлен");
      } catch (e) {
        console.warn("Ошибка при остановке видео-фона:", e);
      }
    }

    // Очистка проблемных текстур фона
    clearBackgroundTexture() {
      try {
        if (
          this.editor &&
          this.editor._background &&
          this.editor._background.texture
        ) {
          const texture = this.editor._background.texture;
          if (texture && !texture.destroyed && texture.source) {
            try {
              // Проверяем, не является ли текстура видео-текстурой
              const isVideoTexture = texture.source instanceof HTMLVideoElement;
              if (isVideoTexture) {
                // Не уничтожаем видео-текстуру здесь, она будет обработана отдельно
                console.log("🎬 Видео-текстура будет обработана отдельно");
              } else {
                texture.destroy(true);
              }
            } catch (e) {
              console.warn("Ошибка при очистке текстуры фона:", e);
            }
          }
          this.editor._background.texture = null;
        }
      } catch (e) {
        console.warn("Ошибка при очистке текстуры фона:", e);
      }
    }

    // Полная очистка перед восстановлением
    cleanupBeforeRestore() {
      console.log("🧹 Очистка перед восстановлением...");

      // Останавливаем видео-фон
      this.stopVideoBackground();

      // Очищаем текстуру фона
      this.clearBackgroundTexture();

      // Небольшая задержка для завершения очистки
      return new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Безопасное восстановление состояния
    async restoreState(stateData) {
      try {
        // Очищаем перед восстановлением
        await this.cleanupBeforeRestore();

        // Импортируем состояние
        await this.editor.importScene(stateData);

        console.log("✅ Состояние успешно восстановлено");
      } catch (error) {
        console.error("Ошибка при восстановлении состояния:", error);

        // Fallback: пробуем восстановить без видео-фона
        try {
          const cleanState = JSON.parse(JSON.stringify(stateData));
          if (cleanState.background && cleanState.background.type === "video") {
            cleanState.background = {
              type: "color",
              data: { color: 0x1e1e1e, alpha: 1 },
            };
          }
          await this.editor.importScene(cleanState);
        } catch (e) {
          console.error("Критическая ошибка при восстановлении:", e);
        }
      }
    }

    async undo() {
      if (this.currentPos <= 0) {
        console.log("⛔ Нечего отменять");
        return;
      }

      this.isRestoring = true;
      this.currentPos--;

      const state = this.actions[this.currentPos];

      try {
        await this.restoreState(JSON.parse(JSON.stringify(state.data)));

        console.log(`↩️ Отмена к [${this.currentPos + 1}]: ${state.desc}`);

        this.saveToStorage();
        this.updateButtons();
        this.show();

        this.undoBtn.style.transform = "rotate(180deg) scale(0.9)";
        setTimeout(
          () => (this.undoBtn.style.transform = "rotate(180deg)"),
          100,
        );
      } catch (error) {
        console.error("Ошибка при отмене:", error);
      } finally {
        setTimeout(() => {
          this.isRestoring = false;
        }, 200);
      }
    }

    async redo() {
      if (this.currentPos >= this.actions.length - 1) {
        console.log("⛔ Нечего повторять");
        return;
      }
      this.isRestoring = true;
      this.currentPos++;

      const state = this.actions[this.currentPos];

      try {
        await this.restoreState(JSON.parse(JSON.stringify(state.data)));

        this.saveToStorage();
        this.updateButtons();
        this.show();

        this.redoBtn.style.transform = "rotate(180deg) scale(0.9)";
        setTimeout(
          () => (this.redoBtn.style.transform = "rotate(180deg)"),
          100,
        );
      } catch (error) {
        console.error("Ошибка при повторе:", error);
      } finally {
        setTimeout(() => {
          this.isRestoring = false;
        }, 200);
      }
    }

    updateButtons() {
      this.undoBtn.disabled = this.currentPos <= 0;
      this.undoBtn.style.opacity = this.undoBtn.disabled ? "0.3" : "1";
      this.undoBtn.style.cursor = this.undoBtn.disabled ? "default" : "pointer";

      this.redoBtn.disabled = this.currentPos >= this.actions.length - 1;
      this.redoBtn.style.opacity = this.redoBtn.disabled ? "0.3" : "1";
      this.redoBtn.style.cursor = this.redoBtn.disabled ? "default" : "pointer";
    }

    saveToStorage() {
      try {
        const saveData = {
          actions: this.actions.map((a) => ({
            data: a.data,
            desc: a.desc,
            time: a.time,
          })),
          currentPos: this.currentPos,
          version: this.historyVersion,
        };
        localStorage.setItem(this.storageKey, JSON.stringify(saveData));
      } catch (e) {
        console.warn("Не удалось сохранить историю:", e);
      }
    }

    loadFromStorage() {
      try {
        const saved = localStorage.getItem(this.storageKey);
        if (saved) {
          const data = JSON.parse(saved);
          if (data.version !== this.historyVersion) {
            localStorage.removeItem(this.storageKey);
            this.actions = [];
            this.currentPos = -1;
            console.log("🧹 Старая история undo/redo сброшена");
            return;
          }
          this.actions = data.actions || [];
          this.currentPos =
            data.currentPos !== undefined ? data.currentPos : -1;
          console.log(`📀 Загружено ${this.actions.length} состояний`);
        }
      } catch (e) {
        console.warn("Не удалось загрузить историю:", e);
        this.actions = [];
        this.currentPos = -1;
      }
      this.updateButtons();
    }

    show() {
      console.log("=== ИСТОРИЯ ДЕЙСТВИЙ ===");
      console.log(
        `Всего: ${this.actions.length}, Текущий: ${this.currentPos + 1}`,
      );
      this.actions.forEach((s, i) => {
        const mark = i === this.currentPos ? "👉" : "  ";
        const time = new Date(s.time).toLocaleTimeString();
        console.log(`${mark} [${i + 1}] ${s.desc} (${time})`);
      });
    }

    clear() {
      this.actions = [];
      this.currentPos = -1;
      localStorage.removeItem(this.storageKey);
      this.updateButtons();
      console.log("🧹 История очищена");
    }
  }

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
  window.editorFrame = editor;

  // Создаем менеджер отмены/повтора с 20 шагами
  const undoManager = new UndoRedoManager(editor, 20); // 20 шагов истории
  window.undoManager = undoManager; // для отладки

  let sceneImportDepth = 0;
  const shouldSkipHistory = () =>
    undoManager.isRestoring || sceneImportDepth > 0;
  const saveHistoryAfter = (result, description) => {
    Promise.resolve(result)
      .then(() => {
        if (!shouldSkipHistory()) {
          undoManager.save(description);
        }
      })
      .catch(() => {});
  };
  const refreshBackgroundControls = () => {
    setTimeout(() => {
      destroyBgCarousel();
      initBgCarousel();

      setTimeout(() => {
        if (typeof window.refreshBackgroundButtons === "function") {
          window.refreshBackgroundButtons();
        }

        if (typeof window.loadAnimatedPresets === "function") {
          window.loadAnimatedPresets();
        }
      }, 0);
    }, 0);
  };
  const isPortraitStaticBackgroundSize = (width, height) =>
    (width === 540 && height === 1920) || (width === 1080 && height === 1920);
  const isSupportedBackgroundSize = (width, height) =>
    isPortraitStaticBackgroundSize(width, height) ||
    (width === 1920 && height === 1080) ||
    (width === 1920 && height === 540);
  const normalizeBackgroundSize = (width, height) => {
    const numericWidth = Number(width);
    const numericHeight = Number(height);

    if (isSupportedBackgroundSize(numericWidth, numericHeight)) {
      return { width: numericWidth, height: numericHeight };
    }

    if (!numericWidth || !numericHeight) {
      return { width: numericWidth, height: numericHeight };
    }

    const ratio = numericWidth / numericHeight;
    if (ratio < 0.8) return { width: 1080, height: 1920 };
    if (ratio > 2.4) return { width: 1920, height: 540 };
    return { width: 1920, height: 1080 };
  };
  const getBackgroundImageIdOffset = (width, height) => {
    if (isPortraitStaticBackgroundSize(width, height)) return 0;
    if (width === 1920 && height === 1080) return 100;
    if (width === 1920 && height === 540) return 200;
    return 0;
  };
  const syncDisplayInputs = (display) => {
    if (!display) return;

    const widthInputElement = document.getElementById("width");
    const heightInputElement = document.getElementById("height");

    if (widthInputElement) widthInputElement.value = display.width;
    if (heightInputElement) heightInputElement.value = display.height;
  };
  const syncNightModeInputs = (nightMode) => {
    const settings = nightMode || editor.getNightModeSettings();
    const enabledInput = document.getElementById("night-mode-enabled");
    const startInput = document.getElementById("night-mode-start");
    const endInput = document.getElementById("night-mode-end");

    if (enabledInput) enabledInput.checked = Boolean(settings.enabled);
    if (startInput) startInput.value = settings.start;
    if (endInput) endInput.value = settings.end;
  };
  const normalizeThemeScheduleRows = (schedule = []) => {
    const validTime = /^([01]\d|2[0-3]):[0-5]\d$/;
    return (Array.isArray(schedule) ? schedule : [])
      .map((entry) => ({
        title: String(entry?.title || entry?.name || "").trim(),
        start: String(entry?.start || "").trim(),
        end: String(entry?.end || "").trim(),
        fabricNumber: String(
          entry?.fabricNumber || entry?.fabric_number || "",
        ).trim(),
        panelId: String(entry?.panelId || entry?.panel_id || "").trim(),
        theme: entry?.theme && typeof entry.theme === "object" ? entry.theme : null,
      }))
      .filter((entry) => validTime.test(entry.start) && validTime.test(entry.end));
  };
  const collectThemeScheduleRows = () => {
    const previous = editor.getThemeSchedule?.() || [];
    return normalizeThemeScheduleRows(
      Array.from(
        document.querySelectorAll("#theme-schedule-list .theme-schedule-row"),
      ).map((row) => {
        const index = Number(row.dataset.index);
        return {
        title: row.querySelector(".theme-schedule-title")?.value,
        start: row.querySelector(".theme-schedule-start")?.value,
        end: row.querySelector(".theme-schedule-end")?.value,
          theme: previous[index]?.theme || null,
        };
      }),
    );
  };
  const renderThemeScheduleInputs = (schedule = editor.getThemeSchedule?.()) => {
    const list = document.getElementById("theme-schedule-list");
    if (!list) return;

    const rows = normalizeThemeScheduleRows(schedule);
    list.innerHTML = "";

    if (!rows.length) {
      const empty = document.createElement("div");
      empty.style.cssText =
        "padding:10px;border:1px dashed rgba(148,163,184,.25);border-radius:8px;color:var(--text-secondary);font-size:11px;";
      empty.textContent = "Периоды не заданы";
      list.appendChild(empty);
      return;
    }

    rows.forEach((entry, index) => {
      const palette = [
        { border: "#8b5cf6", bg: "rgba(139,92,246,.16)" },
        { border: "#06b6d4", bg: "rgba(6,182,212,.14)" },
        { border: "#10b981", bg: "rgba(16,185,129,.14)" },
        { border: "#f59e0b", bg: "rgba(245,158,11,.14)" },
        { border: "#ef4444", bg: "rgba(239,68,68,.12)" },
      ];
      const color = palette[index % palette.length];
      const row = document.createElement("div");
      row.className = "theme-schedule-row";
      row.dataset.index = String(index);
      row.style.cssText =
        `display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:10px;border:1px solid ${color.border};border-left:5px solid ${color.border};border-radius:10px;background:${color.bg};box-shadow:0 8px 20px rgba(0,0,0,.16);`;
      row.innerHTML = `
        <div style="grid-column:1 / -1;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div style="display:flex;align-items:center;gap:8px;color:#fff;font-weight:700;">
            <span style="display:inline-flex;width:26px;height:26px;border-radius:999px;align-items:center;justify-content:center;background:${color.border};color:#fff;">${index + 1}</span>
            <span>Период ${index + 1}</span>
          </div>
          <span style="font-size:11px;color:${entry.theme ? "var(--success)" : "var(--warning)"};">${entry.theme ? "тема сохранена" : "нет темы"}</span>
        </div>
        <input class="form-input theme-schedule-title" placeholder="Название" value="${entry.title.replace(/"/g, "&quot;")}" style="grid-column:1 / -1;">
        <div>
          <label class="form-label">С</label>
          <input type="time" class="form-input theme-schedule-start" value="${entry.start}">
        </div>
        <div>
          <label class="form-label">До</label>
          <input type="time" class="form-input theme-schedule-end" value="${entry.end}">
        </div>
        <div style="grid-column:1 / -1;padding:8px;border-radius:8px;background:${entry.theme ? "rgba(16,185,129,.12)" : "rgba(245,158,11,.10)"};border:1px solid ${entry.theme ? "rgba(16,185,129,.35)" : "rgba(245,158,11,.32)"};color:${entry.theme ? "var(--success)" : "var(--warning)"};font-size:11px;">
          ${entry.theme ? "Тема периода сохранена" : "Тема периода еще не сохранена"}
        </div>
        <button type="button" class="btn-modern theme-schedule-save-theme" data-index="${index}" style="justify-content:center;">Сохранить текущую тему</button>
        <button type="button" class="btn-modern theme-schedule-load-theme" data-index="${index}" ${entry.theme ? "" : "disabled"} style="justify-content:center;opacity:${entry.theme ? "1" : ".45"};">Открыть тему периода</button>
        <button type="button" class="btn-modern theme-schedule-remove" data-index="${index}" style="grid-column:1 / -1;justify-content:center;">Удалить период</button>
      `;
      list.appendChild(row);
    });
  };
  const commitThemeScheduleFromInputs = (saveHistory = true) => {
    editor.setThemeSchedule?.(collectThemeScheduleRows());
    renderThemeScheduleInputs(editor.getThemeSchedule?.());
    if (saveHistory) undoManager.save("Изменено расписание тем");
  };
  const getBackgroundCarouselSize = () => {
    const editorWidth = Number(editor?._width);
    const editorHeight = Number(editor?._height);

    const normalizedEditorSize = normalizeBackgroundSize(
      editorWidth,
      editorHeight,
    );
    if (
      isSupportedBackgroundSize(
        normalizedEditorSize.width,
        normalizedEditorSize.height,
      )
    ) {
      return normalizedEditorSize;
    }

    const inputWidth = Number(document.getElementById("width")?.value);
    const inputHeight = Number(document.getElementById("height")?.value);

    const normalizedInputSize = normalizeBackgroundSize(
      inputWidth,
      inputHeight,
    );
    if (
      isSupportedBackgroundSize(
        normalizedInputSize.width,
        normalizedInputSize.height,
      )
    ) {
      return normalizedInputSize;
    }

    return { width: editorWidth, height: editorHeight };
  };

  // 1. Добавление виджета
  const originalAddWidget = editor.addWidget;
  editor.addWidget = function (widget) {
    const result = originalAddWidget.call(this, widget);
    saveHistoryAfter(result, "Добавлен виджет");
    return result;
  };

  // 2. Удаление виджета
  const originalDeleteSelected = editor.deleteSelected;
  editor.deleteSelected = function () {
    const result = originalDeleteSelected.call(this);
    saveHistoryAfter(result, "Удален виджет");
    return result;
  };

  // 3. Удаление всех
  const originalDeleteAll = editor.deleteAll;
  editor.deleteAll = function () {
    const result = originalDeleteAll.call(this);
    saveHistoryAfter(result, "Удалены все");
    return result;
  };

  // 4. Изменение фона
  const originalChangeBackground = editor.changeBackground;
  editor.changeBackground = function (options = {}) {
    const result = originalChangeBackground.call(this, options);
    if (!options.skipUndo) {
      saveHistoryAfter(result, "Изменен фон");
    }
    return result;
  };

  // 5. Изменение размера
  const originalResize = editor.resize;
  editor.resize = function (w, h) {
    const result = originalResize.call(this, w, h);
    saveHistoryAfter(result, "Изменен размер");
    return result;
  };

  // 6. Загрузка темы
  const originalImportScene = editor.importScene;
  editor.importScene = function (scene) {
    sceneImportDepth += 1;
    const requestedDisplay = scene?.display
      ? {
          width: Number(scene.display.width),
          height: Number(scene.display.height),
        }
      : null;

    let result;
    try {
      result = originalImportScene.call(this, scene);
    } catch (error) {
      sceneImportDepth = Math.max(0, sceneImportDepth - 1);
      throw error;
    }

    const importResult = Promise.resolve(result).finally(() => {
      sceneImportDepth = Math.max(0, sceneImportDepth - 1);
    });

    importResult
      .then(() => {
        if (!undoManager.isRestoring) {
          undoManager.save("Загружена тема");
        }
      })
      .catch(() => {})
      .finally(() => {
        editor.restoreWorkspaceInteraction?.();
        syncDisplayInputs(requestedDisplay);
        syncNightModeInputs(editor.getNightModeSettings());
        renderThemeScheduleInputs(editor.getThemeSchedule?.());
        refreshBackgroundControls();
      });

    return importResult;
  };

  // 7. Перемещение виджетов (отслеживаем)
  let isDragging = false;
  let dragTimer;
  let lastPositions = new Map();

  document.addEventListener("mousedown", (e) => {
    const selected = editor.getSelected();
    if (selected && selected.length > 0) {
      isDragging = true;
      // Сохраняем начальные позиции
      lastPositions.clear();
      selected.forEach((widget) => {
        lastPositions.set(widget, { x: widget.x, y: widget.y });
      });
    }
  });

  document.addEventListener("mouseup", (e) => {
    if (isDragging) {
      clearTimeout(dragTimer);
      dragTimer = setTimeout(() => {
        // Проверяем, действительно ли были перемещения
        const selected = editor.getSelected();
        let moved = false;

        selected.forEach((widget) => {
          const oldPos = lastPositions.get(widget);
          if (oldPos && (oldPos.x !== widget.x || oldPos.y !== widget.y)) {
            moved = true;
          }
        });

        if (moved) {
          undoManager.save("Перемещен виджет");
        }

        isDragging = false;
        lastPositions.clear();
      }, 200);
    }
  });

  // 8. Изменение свойств через инспектор
  let propTimer;
  const bgColor = document.getElementById("background-color");
  if (bgColor) {
    bgColor.addEventListener("input", () => {
      clearTimeout(propTimer);
      propTimer = setTimeout(() => undoManager.save("Изменен цвет"), 500);
    });
  }

  const bgAlpha = document.getElementById("background-alpha");
  if (bgAlpha) {
    bgAlpha.addEventListener("input", () => {
      clearTimeout(propTimer);
      propTimer = setTimeout(
        () => undoManager.save("Изменена прозрачность"),
        500,
      );
    });
  }

  const cornerRadius = document.getElementById("corner-radius");
  if (cornerRadius) {
    cornerRadius.addEventListener("input", () => {
      clearTimeout(propTimer);
      propTimer = setTimeout(() => undoManager.save("Изменен радиус"), 500);
    });
  }

  const updateNightModeSettings = () => {
    editor.setNightModeSettings({
      enabled: document.getElementById("night-mode-enabled")?.checked,
      start: document.getElementById("night-mode-start")?.value,
      end: document.getElementById("night-mode-end")?.value,
    });
    undoManager.save("Изменен ночной режим");
  };

  ["night-mode-enabled", "night-mode-start", "night-mode-end"].forEach((id) => {
    document
      .getElementById(id)
      ?.addEventListener("change", updateNightModeSettings);
  });
  syncNightModeInputs(editor.getNightModeSettings());
  renderThemeScheduleInputs(editor.getThemeSchedule?.());
  document.getElementById("theme-schedule-add")?.addEventListener("click", () => {
    const current = editor.getThemeSchedule?.() || [];
    editor.setThemeSchedule?.([
      ...current,
      { title: "", start: "14:00", end: "16:00", theme: null },
    ]);
    renderThemeScheduleInputs(editor.getThemeSchedule?.());
    undoManager.save("Добавлен период расписания тем");
  });
  document
    .getElementById("theme-schedule-list")
    ?.addEventListener("change", (event) => {
      if (event.target.closest(".theme-schedule-row")) {
        commitThemeScheduleFromInputs(true);
      }
    });
  document
    .getElementById("theme-schedule-list")
    ?.addEventListener("click", (event) => {
      const saveThemeButton = event.target.closest(".theme-schedule-save-theme");
      if (saveThemeButton) {
        commitThemeScheduleFromInputs(false);
        const index = Number(saveThemeButton.dataset.index);
        const current = editor.getThemeSchedule?.() || [];
        const scene = editor.exportScene({ includeSchedule: false });
        current[index] = {
          ...current[index],
          theme: scene,
          title:
            current[index]?.title ||
            `Тема ${current[index]?.start || ""}-${current[index]?.end || ""}`,
        };
        editor.setThemeSchedule?.(current);
        renderThemeScheduleInputs(editor.getThemeSchedule?.());
        undoManager.save("Сохранена тема периода");
        return;
      }

      const loadThemeButton = event.target.closest(".theme-schedule-load-theme");
      if (loadThemeButton) {
        commitThemeScheduleFromInputs(false);
        const index = Number(loadThemeButton.dataset.index);
        const schedule = editor.getThemeSchedule?.() || [];
        const entry = schedule[index];
        if (entry?.theme) {
          Promise.resolve(editor.importScene(entry.theme)).finally(() => {
            editor.restoreWorkspaceInteraction?.();
            editor.setThemeSchedule?.(schedule);
            renderThemeScheduleInputs(editor.getThemeSchedule?.());
            undoManager.save("Открыта тема периода");
          });
        }
        return;
      }

      const removeButton = event.target.closest(".theme-schedule-remove");
      if (!removeButton) return;
      const index = Number(removeButton.dataset.index);
      const next = (editor.getThemeSchedule?.() || []).filter(
        (_entry, entryIndex) => entryIndex !== index,
      );
      editor.setThemeSchedule?.(next);
      renderThemeScheduleInputs(editor.getThemeSchedule?.());
      undoManager.save("Удален период расписания тем");
    });

  // 9. Горячие клавиши
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undoManager.undo();
      }
      if (e.key === "y" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        undoManager.redo();
      }
    }
  });

  console.log("🚀 Undo/Redo готов к работе (10 шагов)");

  function destroyBgCarousel() {
    const track = document.getElementById("bg-carousel-track");

    if (track) {
      // Удаляем флаг инициализации
      track.removeAttribute("data-carousel-initialized");
      // Очищаем трек
      track.innerHTML = "";
    }

    // Сбрасываем счетчики
    const currentSlideSpan = document.getElementById("bg-current-slide");
    const totalSlidesSpan = document.getElementById("bg-total-slides");
    const dotsContainer = document.getElementById("carousel-dots-container");

    if (currentSlideSpan) currentSlideSpan.textContent = "0";
    if (totalSlidesSpan) totalSlidesSpan.textContent = "0";
    if (dotsContainer) dotsContainer.innerHTML = "";

    // Восстанавливаем кнопки навигации в исходное состояние
    const prevBtn = document.getElementById("bg-carousel-prev");
    const nextBtn = document.getElementById("bg-carousel-next");

    if (prevBtn) {
      prevBtn.style.opacity = "1";
      prevBtn.style.pointerEvents = "auto";
    }
    if (nextBtn) {
      nextBtn.style.opacity = "1";
      nextBtn.style.pointerEvents = "auto";
    }

    console.log("🔄 Карусель очищена");
  }

  function initBgCarousel() {
    // Ждем, пока загрузятся все текстуры
    if (!isBackgroundsReady) {
      console.log("⏳ Ожидание загрузки фоновых текстур...");

      // Показываем индикатор загрузки
      showLoaderInCarousel();

      // Проверяем каждые 500 мс, не загрузились ли текстуры
      const checkInterval = setInterval(() => {
        if (isBackgroundsReady) {
          clearInterval(checkInterval);
          console.log("✅ Текстуры загружены, инициализируем карусель");
          initBgCarouselInternal();
        }
      }, 500);

      // Таймаут на случай ошибки
      setTimeout(() => {
        if (!isBackgroundsReady) {
          clearInterval(checkInterval);
          console.warn("⚠️ Таймаут загрузки текстур");
          showError("Не удалось загрузить фоновые изображения");
        }
      }, 30000);

      return;
    }

    initBgCarouselInternal();
  }

  function refreshBgCarousel() {
    console.log("🔄 Обновление карусели после изменения размеров...");

    refreshBackgroundControls();
  }

  function showEmptyCarouselState() {
    const carouselSize = getBackgroundCarouselSize();
    const track = document.getElementById("bg-carousel-track");
    const prevBtn = document.getElementById("bg-carousel-prev");
    const nextBtn = document.getElementById("bg-carousel-next");
    const dotsContainer = document.getElementById("carousel-dots-container");
    const currentSlideSpan = document.getElementById("bg-current-slide");
    const totalSlidesSpan = document.getElementById("bg-total-slides");

    if (!track) return;

    // Очищаем трек
    track.innerHTML = "";

    // Показываем сообщение об отсутствии изображений
    const emptyContainer = document.createElement("div");
    emptyContainer.style.cssText = `
    flex: 0 0 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 16px;
    padding: 20px;
  `;

    emptyContainer.innerHTML = `
    <div style="
      font-size: 48px;
      opacity: 0.5;
    ">🖼️</div>
    <div style="
      color: var(--text-secondary);
      font-size: 14px;
      text-align: center;
      max-width: 200px;
    ">
      Нет фоновых изображений для размера ${carouselSize.width}×${carouselSize.height}
    </div>
  `;

    track.appendChild(emptyContainer);

    // Скрываем или отключаем кнопки навигации
    if (prevBtn) {
      prevBtn.style.opacity = "0.3";
      prevBtn.style.pointerEvents = "none";
      prevBtn.style.cursor = "default";
    }

    if (nextBtn) {
      nextBtn.style.opacity = "0.3";
      nextBtn.style.pointerEvents = "none";
      nextBtn.style.cursor = "default";
    }

    // Обновляем счетчики
    if (currentSlideSpan) {
      currentSlideSpan.textContent = "0";
    }

    if (totalSlidesSpan) {
      totalSlidesSpan.textContent = "0";
    }

    // Очищаем dots если есть
    if (dotsContainer) {
      dotsContainer.innerHTML = "";
    }

    console.log(
      `📭 Нет изображений для размера ${carouselSize.width}×${carouselSize.height}`,
    );
  }

  function initBgCarouselInternal() {
    const oldTrack = document.getElementById("bg-carousel-track");
    if (oldTrack && oldTrack.hasAttribute("data-carousel-initialized")) {
      console.log("🔄 Пересоздаем карусель...");
      destroyBgCarousel();
    }
    const track = document.getElementById("bg-carousel-track");
    const prevBtn = document.getElementById("bg-carousel-prev");
    const nextBtn = document.getElementById("bg-carousel-next");
    const currentSlideSpan = document.getElementById("bg-current-slide");
    const totalSlidesSpan = document.getElementById("bg-total-slides");
    const dotsContainer = document.getElementById("carousel-dots-container");
    // Проверяем наличие всех необходимых элементов
    if (!track || !prevBtn || !nextBtn) {
      console.log("⏳ Ожидание загрузки элементов карусели...");
      setTimeout(initBgCarouselInternal, 300);
      return;
    }

    // Проверяем, не инициализирована ли уже карусель
    if (track.hasAttribute("data-carousel-initialized")) {
      console.log("✅ Карусель уже инициализирована");
      return;
    }

    console.log("🎨 Инициализация карусели фонов...");

    const static_1080_1920 = "/assets/bg_static_1080_1920/";
    const static_1920_1080 = "/assets/bg_static_1920_1080/";
    const static_1920_540 = "/assets/bg_static_1920_540/";

    const images_1080_1920 = [
      "abstract-bird-3840x2160-24453.png",
      "blue-abstract-3840x2160-24798.png",
      "blue-abstract-3840x2160-25023.png",
      "blue-abstract-blue-background-gradient-abstract-3840x2160-8985.png",
      "flutie8211-gradient-8174930.png",
      "glowing-light-in-colors-8k-pb.png",
      "golden-dark-3840x2160-25333.png",
      "huawei-mate-80-3840x2160-24785.png",
      "infinity-purple-5120x2880-25344.png",
      "macos-tahoe-26-5120x2880-22675.png",
      "mesmerizing-purple-gradient-waves-9o.png",
      "samsung-galaxy-s21-stock-amoled-particles-blue-black-3200x3200-3972.png",
      "spectrum_swirl-wallpaper-2560x2048.png",
      "ultrawide-blue-3840x2160-19825.png",
      "wallhaven-pk1ykp.png",
      "xiaomi-pad-stock-3840x2160-11667.png",
    ];

    const images_1920_1080 = [
      "abstract-bird-3840x2160-24453.png",
      "blue-abstract-3840x2160-24798.png",
      "blue-abstract-3840x2160-25023.png",
      "blue-abstract-blue-background-gradient-abstract-3840x2160-8985.png",
      "glowing-light-in-colors-8k-pb.png",
      "golden-dark-3840x2160-25333.png",
      "huawei-mate-80-3840x2160-24785.png",
      "infinity-purple-5120x2880-25344.png",
      "macos-tahoe-26-5120x2880-22675.png",
      "mesmerizing-purple-gradient-waves-9o.png",
      "samsung-galaxy-s21-stock-amoled-particles-blue-black-3200x3200-3972.png",
      "spectrum_swirl-wallpaper-2560x2048.png",
      "ultrawide-blue-3840x2160-19825.png",
      "wallhaven-pk1ykp.png",
      "xiaomi-pad-stock-3840x2160-11667.png",
    ];

    const images_1920_540 = [
      "glowing-light-in-colors-8k-pb.png",
      "spectrum_swirl-wallpaper-2560x2048.png",
    ];

    let filterOrientation = [];
    let static_folder = null;

    const carouselSize = getBackgroundCarouselSize();

    // Проверяем editor и его размеры
    if (!carouselSize.width || !carouselSize.height) {
      console.warn(
        "⚠️ Editor или его размеры не определены, повторная попытка...",
      );
      setTimeout(initBgCarouselInternal, 2000);
      return;
    }

    // Определяем ориентацию и получаем список изображений
    if (
      isPortraitStaticBackgroundSize(carouselSize.width, carouselSize.height)
    ) {
      filterOrientation = images_1080_1920;
      static_folder = static_1080_1920;
    } else if (carouselSize.width == 1920 && carouselSize.height == 540) {
      filterOrientation = images_1920_540;
      static_folder = static_1920_540;
    } else if (carouselSize.width / carouselSize.height >= 2.5) {
      filterOrientation = images_1920_540;
      static_folder = static_1920_540;
    } else {
      filterOrientation = images_1920_1080;
      static_folder = static_1920_1080;
    }

    // ===== НОВАЯ ПРОВЕРКА: если нет изображений для текущего размера =====
    if (!filterOrientation || filterOrientation.length === 0) {
      console.warn(
        "⚠️ Нет изображений для текущей ориентации:",
        carouselSize.width,
        "x",
        carouselSize.height,
      );

      // Показываем сообщение об отсутствии изображений
      showEmptyCarouselState();

      // Восстанавливаем кнопки навигации (делаем неактивными)
      if (prevBtn) {
        prevBtn.style.opacity = "0.3";
        prevBtn.style.pointerEvents = "none";
      }
      if (nextBtn) {
        nextBtn.style.opacity = "0.3";
        nextBtn.style.pointerEvents = "none";
      }

      return;
    }

    // Если изображения есть - восстанавливаем кнопки навигации
    if (prevBtn) {
      prevBtn.style.opacity = "1";
      prevBtn.style.pointerEvents = "auto";
    }
    if (nextBtn) {
      nextBtn.style.opacity = "1";
      nextBtn.style.pointerEvents = "auto";
    }

    // Остальной код инициализации карусели...
    // Очищаем трек и пересоздаем контент
    track.innerHTML = "";

    filterOrientation.forEach((elem, index) => {
      const container = document.createElement("div");
      container.style.cssText = `
      flex: 0 0 100%;
      height: 100%;
      padding: 8px;
      display: flex;
      justify-content: center;
      align-items: center;
    `;

      const image = document.createElement("img");
      const imageId = `bg-${
        index +
        1 +
        getBackgroundImageIdOffset(carouselSize.width, carouselSize.height)
      }`;
      image.setAttribute("id", imageId);

      image.setAttribute("loading", index === 0 ? "eager" : "lazy");
      image.setAttribute("decoding", "async");

      image.style.cssText = `
      width: auto;
      height: 100%;
      max-width: 100%;
      object-fit: contain;
      border-radius: var(--border-radius-sm);
      cursor: pointer;
      transition: var(--transition);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      border: 2px solid transparent;
      opacity: 0;
      transform: scale(0.95);
      transition: opacity 0.3s ease, transform 0.3s ease, border-color 0.2s ease;
    `;

      // Добавляем эффект появления изображения
      image.onload = function () {
        this.style.opacity = "1";
        this.style.transform = "scale(1)";
      };

      image.onerror = function () {
        console.warn(`❌ Не удалось загрузить изображение: ${elem}`);
        this.style.opacity = "0.3";
        this.style.transform = "scale(0.95)";
        this.style.filter = "grayscale(1)";
      };

      image.onmouseover = function () {
        if (this.style.opacity === "1") {
          this.style.borderColor = "var(--accent-primary)";
          this.style.transform = "scale(1.02)";
        }
      };

      image.onmouseout = function () {
        if (this.style.opacity === "1") {
          this.style.borderColor = "transparent";
          this.style.transform = "scale(1)";
        }
      };

      image.src = static_folder + elem;
      image.addEventListener("click", async () => {
        try {
          const texture = await PIXI.Assets.load(image.src);
          await setBackground(texture, image.src);
        } catch (error) {
          console.error("❌ Ошибка применения фона из карусели:", error);
          if (typeof showError === "function") {
            showError("Фон не загружен. Попробуйте позже.");
          }
        }
      });
      container.append(image);
      track.append(container);
    });

    const slides = track.children;
    const totalSlides = slides.length;
    let currentIndex = 0;

    // Создаем индикаторы динамически
    if (dotsContainer) {
      dotsContainer.innerHTML = "";
      for (let i = 0; i < totalSlides; i++) {
        const dot = document.createElement("div");
        dot.className = "carousel-dot";
        dot.setAttribute("data-index", i);
        dot.style.cssText = `
        width: 20px;
        height: 4px;
        border-radius: 2px;
        background: rgba(255, 255, 255, 0.3);
        cursor: pointer;
        transition: var(--transition);
        ${i === 0 ? "background: var(--accent-primary); opacity: 0.8;" : ""}
      `;
        dotsContainer.appendChild(dot);
      }
    }

    const dots = document.querySelectorAll(".carousel-dot");

    if (totalSlidesSpan) {
      totalSlidesSpan.textContent = totalSlides;
    }

    function updateCarousel(index) {
      if (index < 0) index = 0;
      if (index >= totalSlides) index = totalSlides - 1;
      currentIndex = index;
      track.style.transform = `translateX(-${currentIndex * 100}%)`;

      dots.forEach((dot, i) => {
        if (i === currentIndex) {
          dot.style.background = "var(--accent-primary)";
          dot.style.opacity = "0.8";
        } else {
          dot.style.background = "rgba(255, 255, 255, 0.3)";
          dot.style.opacity = "1";
        }
      });

      if (currentSlideSpan) {
        currentSlideSpan.textContent = currentIndex + 1;
      }
    }

    // Удаляем старые обработчики
    const newPrevBtn = prevBtn.cloneNode(true);
    const newNextBtn = nextBtn.cloneNode(true);
    prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
    nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);

    newPrevBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateCarousel(currentIndex - 1);
    });

    newNextBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      updateCarousel(currentIndex + 1);
    });

    // Обновляем ссылки на кнопки
    const finalPrevBtn = document.getElementById("bg-carousel-prev");
    const finalNextBtn = document.getElementById("bg-carousel-next");

    // Обработчики для точек
    dots.forEach((dot, index) => {
      dot.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        updateCarousel(index);
      });
    });

    // Обработчики для кнопок навигации с эффектами
    [finalPrevBtn, finalNextBtn].forEach((btn) => {
      if (btn) {
        btn.addEventListener("mouseenter", () => {
          btn.style.background = "rgba(0, 212, 255, 0.2)";
          btn.style.borderColor = "var(--accent-primary)";
          btn.style.transform = "translateY(-50%) scale(1.1)";
        });
        btn.addEventListener("mouseleave", () => {
          btn.style.background = "rgba(21, 27, 41, 0.8)";
          btn.style.borderColor = "rgba(255, 255, 255, 0.1)";
          btn.style.transform = "translateY(-50%) scale(1)";
        });
      }
    });

    // Отмечаем, что карусель инициализирована
    track.setAttribute("data-carousel-initialized", "true");

    updateCarousel(0);

    console.log("✅ Карусель фонов успешно инициализирована");
  }

  setTimeout(() => {
    initBgCarousel();
  }, 2000);

  class HTMLGradientBuilder {
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
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_1V3xk3BcKH.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "2",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/24216-340670744.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_eBcjz3au07.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "3",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/67354-521707462_small.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_4wl9Z8n9FB.png",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "4",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/178908-860734672.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_M4B8UnK877.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "5",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/184069-872413642_small.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_oWyqIHEPt4.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "6",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/204565-924698132_small.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_FsVAEF85Wq.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "7",
          type: "video",
          videoUrl: "https://admin.i-panel.pro:8787/static/300/206846.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_o6L3EVwcwE.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "8",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/214409_small.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_cvJ76ugfB5.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "9",
          type: "video",
          videoUrl: "https://admin.i-panel.pro:8787/static/300/259267.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_PtK4DF5AjH.png",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "10",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/314643_small.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_LNXFR1eT0o.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "11",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/4182916-hd_1920_1080_30fps.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_r2Lae8qYOk.jpg",
          thumbnail: "",
          width: 1920,
          height: 1080,
          loop: true,
          muted: true,
          description: "",
        },

        {
          name: "12",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.).mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_oDACxGZAVL.png",
          thumbnail: "",
          width: 1080,
          height: 1920,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "13",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-2.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_PEIjoNfssK.png",
          thumbnail: "",

          width: 1080,
          height: 1920,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "14",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-3.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_osbrgQtWvv.png",
          thumbnail: "",
          width: 1080,
          height: 1920,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "15",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-4.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_0PbCyYXJaz.png",
          thumbnail: "",
          width: 1080,
          height: 1920,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "16",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-5.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_6NbIVad7oY.png",
          thumbnail: "",
          width: 1080,
          height: 1920,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "17",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-6.mp4",
          preview: "https://admin.i-panel.pro:8787/static/300/VaNkzJWXYU.png",
          thumbnail: "",
          width: 1080,
          height: 1920,
          loop: true,
          muted: true,
          description: "",
        },
        {
          name: "18",
          type: "video",
          videoUrl:
            "https://admin.i-panel.pro:8787/static/300/Без названия (1080 x 1920 пикс.)-7.mp4",
          preview:
            "https://admin.i-panel.pro:8787/static/300/firefox_D0LcOZe8NG.png",
          thumbnail: "",
          width: 1080,
          height: 1920,
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
        this.applySolidColorInternal(0x1e1e1e, 1, { skipUndo: true });
        return;
      }

      console.log(`🔄 Восстанавливаем фон типа: ${backgroundData.type}`);
      const backgroundPayload = backgroundData.data || backgroundData;

      switch (backgroundData.type) {
        case "color":
          this.applySolidColorInternal(
            backgroundPayload.color,
            backgroundPayload.alpha || 1,
            { skipUndo: true },
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
          this.applySolidColorInternal(0x1e1e1e, 1, { skipUndo: true });
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
            skipUndo: true,
          });
        }
      } catch (error) {
        console.error("❌ Ошибка восстановления градиента:", error);
        this.applySolidColorInternal(0x1e1e1e, 1, { skipUndo: true });
      }
    }

    async restoreVideoBackground(videoData) {
      try {
        if (!videoData.videoUrl) throw new Error("Нет URL видео");

        this.stopVideoBackground();
        this.cleanupGradientTexture();

        this.saveCurrentBackground("video", videoData);
        if (this.editor) {
          this.editor.currentBackgroundType = "video";
        }
        this.createVideoBackground(
          videoData.videoUrl,
          videoData.name || "Восстановленное видео",
          { skipUndo: true },
        );
      } catch (error) {
        console.error("❌ Ошибка восстановления видео:", error);
        this.applySolidColorInternal(0x1e1e1e, 1, { skipUndo: true });
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
            skipUndo: true,
          });
        }
      } catch (error) {
        console.error("❌ Ошибка восстановления изображения:", error);
        this.applySolidColorInternal(0x1e1e1e, 1, { skipUndo: true });
      }
    }

    applySolidColorInternal(color, alpha = 1, options = {}) {
      this.saveCurrentBackground("color", {
        color: color,
        hex: this.rgbToHex(color),
        alpha: alpha,
      });

      if (this.editor?.changeBackground) {
        this.editor.changeBackground({
          color: color,
          alpha: alpha,
          skipUndo: true,
        });

        // ДОБАВЛЕНО: Явное сохранение в истории
        if (!options.skipUndo && window.undoManager) {
          setTimeout(() => window.undoManager.save("Изменен цвет фона"), 100);
        }
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
      display: none;
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
      window.openModalConstructor = () => this.openModal();
      const modal = document.createElement("div");
      modal.id = "gradient-modal";
      modal.style.cssText = `
  display: none;
  position: absolute;
  top: 56px;
  right: 0px;
  width: 400px;
  height: calc(100vh - 56px);
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
    <button id="close-modal-btn" style="display: none; background: none; border: none; color: #a0a0b0; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 32px; height: 32px; align-items: center; justify-content: center; border-radius: 6px; transition: all 0.2s;" 
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
      <div id="animated-presets-container" style="display: grid; grid-template-columns: 1fr; gap: 12px; margin-bottom: 20px;"></div>
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
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <label style="font-weight: 600; color: white; font-size: 14px;">Цвета градиента</label>
          <button id="add-color-stop" style="padding: 6px 12px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 4px; color: white; cursor: pointer; font-size: 11px;">+ Добавить</button>
        </div>
        <div id="color-stops-container" style="margin-bottom: 16px; max-height: 200px; overflow-y: auto; padding-right: 4px;"></div>
      </div>
    </div>

    <div id="upload-tab" class="tab-content">
      <div style="margin-bottom: 24px; display: none">
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
          <input type="color" id="solid-color-picker" value="#1e1e1e" style="width: 50px; height: 50px; border-radius: 8px; border: 2px solid #3d3d4d; cursor: pointer;">
          <button id="apply-solid-color" style="flex: 1; padding: 14px; background: #2d2d3d; border: 1px solid #3d3d4d; border-radius: 10px; color: white; cursor: pointer; font-size: 14px; font-weight: 500;">Применить цвет</button>
        </div>
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

      window.modalConstructor = modal;

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
      .preset-btn {
        height: 200px;
      }
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
        width: 40px;
        height: 40px;
        border-radius: 6px;
        border: 1px solid #3d3d4d;
        cursor: pointer;
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
          // Получаем данные пресета из dataset
          const presetDataStr = presetButton.dataset.presetData;
          if (presetDataStr) {
            try {
              const preset = JSON.parse(presetDataStr);
              this.applyVideoPreset(preset);
            } catch (e) {
              console.error("Ошибка парсинга данных пресета:", e);
            }
          } else {
            // Fallback для обратной совместимости
            const index = parseInt(presetButton.dataset.index);
            if (!isNaN(index)) {
              // Получаем актуальный список пресетов для текущего размера
              const filteredPresets = this.getAnimatedPresetsForCurrentSize();
              if (filteredPresets && filteredPresets[index]) {
                this.applyVideoPreset(filteredPresets[index]);
              }
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

      // Исправляем обработчики для всех input элементов внутри color stops
      document.addEventListener("input", (e) => {
        // Проверяем, что событие происходит внутри модального окна
        if (e.target.closest("#gradient-modal")) {
          e.stopPropagation(); // ← ВАЖНО

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
        }
      });
    }

    setupCustomGradientUI() {
      this.updateColorStopsUI();
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

      document
        .querySelectorAll("#gradient-modal .tab-content")
        .forEach((tab) => {
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

    getAnimatedPresetsForCurrentSize() {
      const displaySize = normalizeBackgroundSize(
        editor?._width,
        editor?._height,
      );
      const exactPresets = this.animatedPresets?.filter(
        (item) =>
          item?.width == displaySize.width &&
          item?.height == displaySize.height,
      );

      if (exactPresets?.length) return exactPresets;

      const isPortrait = Number(editor?._height) > Number(editor?._width);
      const sameOrientationPresets = this.animatedPresets?.filter((item) => {
        const itemIsPortrait = Number(item?.height) > Number(item?.width);
        return itemIsPortrait === isPortrait;
      });

      return sameOrientationPresets?.length
        ? sameOrientationPresets
        : this.animatedPresets || [];
    }

    loadAnimatedPresets() {
      const container = document.getElementById("animated-presets-container");
      if (!container) return;
      container.innerHTML = "";

      const filteredPresets = this.getAnimatedPresetsForCurrentSize();

      if (!filteredPresets || filteredPresets.length === 0) {
        // Показываем сообщение, если нет пресетов для текущего размера
        const emptyMessage = document.createElement("div");
        emptyMessage.style.cssText = `
      grid-column: 1 / -1;
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
      font-size: 13px;
    `;
        emptyMessage.textContent =
          "Нет видео-обоев для текущего размера экрана";
        container.appendChild(emptyMessage);
        return;
      }

      filteredPresets.forEach((preset, index) => {
        const presetBtn = document.createElement("button");
        presetBtn.className = "preset-btn";
        // Сохраняем данные пресета напрямую в кнопку, а не индекс
        presetBtn.dataset.presetData = JSON.stringify(preset);
        presetBtn.textContent = preset.name || (index + 1).toString();
        presetBtn.style.background = `url(${preset.preview}) center/cover no-repeat, linear-gradient(135deg, #2d2d3d 0%, #1e1e2e 100%)`;
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
              skipUndo: true,
            });

            // ДОБАВЛЕНО: Явное сохранение в истории
            if (window.undoManager) {
              setTimeout(
                () =>
                  window.undoManager.save(`Применен градиент: ${preset.name}`),
                100,
              );
            }
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
          skipUndo: true,
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
        const ctx = this.context;
        const canvas = this.canvas;
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
          gradient = ctx.createLinearGradient(
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
        preset.colorStops.forEach((stop) => {
          gradient.addColorStop(stop.offset, stop.color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const outputCanvas = document.createElement("canvas");
        outputCanvas.width = canvas.width;
        outputCanvas.height = canvas.height;
        const outputContext = outputCanvas.getContext("2d");
        outputContext.drawImage(canvas, 0, 0);
        const texture = PIXI.Texture.from(outputCanvas);
        texture.update();
        return texture;
      } catch (error) {
        console.error("❌ Ошибка создания градиента:", error);
        return this.createDefaultTexture();
      }
    }

    createDefaultTexture() {
      const ctx = this.context;
      const canvas = this.canvas;
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
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = canvas.width;
      outputCanvas.height = canvas.height;
      const outputContext = outputCanvas.getContext("2d");
      outputContext.drawImage(canvas, 0, 0);
      const texture = PIXI.Texture.from(outputCanvas);
      texture.update();
      return texture;
    }

    createVideoBackground(videoUrl, presetName, options = {}) {
      try {
        console.log(`🚀 Начинаю загрузку видео: ${presetName} (${videoUrl})`);

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

            if (
              videoElement.videoWidth === 0 ||
              videoElement.videoHeight === 0
            ) {
              console.warn(`⚠️ Видео не имеет размеров, ждем еще...`);
              textureCreated = false;
              setTimeout(createTexture, 100);
              return;
            }

            textureCreated = true;

            const texture = PIXI.Texture.from(videoElement);

            console.log(`✅ Текстура создана успешно для: ${presetName}`);

            this.cleanupAllBackgroundResources();
            this.videoElement = videoElement;
            this.videoTexture = texture;

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
                skipUndo: true,
              });

              // ДОБАВЛЕНО: Явное сохранение в истории
              if (!options.skipUndo && window.undoManager) {
                setTimeout(
                  () =>
                    window.undoManager.save(`Применено видео: ${presetName}`),
                  100,
                );
              }
            }

            this.startVideoTextureUpdate();

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

          setTimeout(() => {
            if (!textureCreated && isCurrentRequest() && !videoElement.error) {
              if (videoElement.readyState >= 2) onCanPlay();
            }
          }, 1000);
        };

        const onLoadedMetadata = () => {
          console.log(`📹 Метаданные видео загружены: ${presetName}`);
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
      <input type="color" class="color-input" data-index="${index}" value="${stop.color}" style="width: 40px; height: 40px; border-radius: 6px; border: 1px solid #3d3d4d; cursor: pointer;">
      <input type="range" class="offset-slider" data-index="${index}" min="0" max="1" step="0.01" value="${stop.offset}" style="flex: 1; height: 6px; border-radius: 3px; background: #3d3d4d;">
      <input type="number" class="offset-input" data-index="${index}" min="0" max="1" step="0.01" value="${stop.offset.toFixed(2)}" style="width: 60px; padding: 8px; background: #1e1e2e; border: 1px solid #3d3d4d; border-radius: 4px; color: white; text-align: center;">
      <button class="remove-color-stop" data-index="${index}" ${this.customGradient.colorStops.length <= 2 ? 'disabled style="opacity: 0.5;"' : ""} style="background: #ff4757; color: white; border: none; border-radius: 4px; width: 30px; height: 30px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
    `;

        container.appendChild(stopElement);

        // Добавляем обработчики событий для каждого инпута
        const colorInput = stopElement.querySelector(".color-input");
        const offsetSlider = stopElement.querySelector(".offset-slider");
        const offsetInput = stopElement.querySelector(".offset-input");

        // Обработчик для color input
        colorInput.addEventListener("input", function (e) {
          const idx = parseInt(this.dataset.index);
          self.customGradient.colorStops[idx].color = e.target.value;
          self.applyCustomGradient();
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

      // ДОБАВЛЕНО: Явное сохранение в истории (уже вызывается в applyStaticGradientPreset, но для надежности)
      if (window.undoManager) {
        setTimeout(
          () => window.undoManager.save("Применен кастомный градиент"),
          100,
        );
      }
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
          image.onerror = () =>
            reject(new Error("Не удалось загрузить изображение"));
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

    handleVideoUpload(event) {
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

      const videoURL = URL.createObjectURL(file);
      this.uploadedVideoUrl = videoURL;

      const previewContainer = document.getElementById(
        "video-preview-container",
      );
      if (previewContainer) {
        previewContainer.innerHTML = `
      <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; border-radius: 6px; background: #000;">
        <video src="${videoURL}" style="max-width: 100%; max-height: 100%;" muted controls></video>
      </div>
    `;
      }

      console.log("📹 Видео загружено, URL:", videoURL);
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
            name:
              this.uploadedImageMeta?.originalName ||
              "Загруженное изображение",
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
              skipUndo: true,
            });

            // ДОБАВЛЕНО: Явное сохранение в истории
            if (window.undoManager) {
              setTimeout(
                () => window.undoManager.save("Загружено изображение фона"),
                100,
              );
            }
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
          skipUndo: true,
        });

        // ДОБАВЛЕНО: Явное сохранение в истории
        if (window.undoManager) {
          setTimeout(
            () => window.undoManager.save(`Изменен цвет фона на ${color}`),
            100,
          );
        }
      }
    }

    resetBackground() {
      console.log("🗑️ Сбрасываю фон...");
      this.backgroundApplyToken++;

      const imagePreview = document.getElementById("image-preview-container");
      if (imagePreview) imagePreview.innerHTML = "Выберите изображение";

      const videoPreview = document.getElementById("video-preview-container");
      if (videoPreview) videoPreview.innerHTML = "Выберите видео";

      if (this.uploadedVideoUrl && this.uploadedVideoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(this.uploadedVideoUrl);
      }
      this.uploadedVideoUrl = null;

      if (this.uploadedImage && this.uploadedImage.startsWith("blob:")) {
        URL.revokeObjectURL(this.uploadedImage);
      }
      this.uploadedImage = null;

      this.cleanupAllBackgroundResources();

      this.applySolidColorInternal(0x1e1e1e, 1, { skipUndo: true });

      // ДОБАВЛЕНО: Явное сохранение в истории
      if (window.undoManager) {
        setTimeout(() => window.undoManager.save("Сброшен фон"), 100);
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

  function initializeGradientBuilder(editor) {
    console.log("🚀 Инициализация конструктора фона...");
    const gradientBuilder = new HTMLGradientBuilder(editor);

    window.loadAnimatedPresets = () => gradientBuilder.loadAnimatedPresets();
    window.setupEventListeners = () => gradientBuilder.setupEventListeners();
    setTimeout(() => gradientBuilder.init(), 500);
    window.gradientBuilder = gradientBuilder;
    document.addEventListener("DOMContentLoaded", function () {
      setTimeout(() => {
        const controlsWidget = document.getElementById("background-controls");
        if (
          controlsWidget &&
          !document.getElementById("gradient-builder-btn")
        ) {
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
          button.addEventListener("click", () => {
            if (gradientBuilder?.initialized) gradientBuilder.openModal();
            else {
              gradientBuilder.init();
              setTimeout(() => gradientBuilder.openModal(), 100);
            }
          });
          controlsWidget.appendChild(button);
        }
      }, 1000);
    });
    return gradientBuilder;
  }

  const gradientBuilder = initializeGradientBuilder(editor);
  editor.gradientBuilder = gradientBuilder;

  function setupCustomBackgroundUpload() {
    const selectButton = document.getElementById("custom-bg-select");
    const fileInput = document.getElementById("custom-bg-file");
    const applyButton = document.getElementById("custom-bg-apply");
    const preview = document.getElementById("custom-bg-preview");
    let preparedImage = null;

    if (!selectButton || !fileInput || !applyButton || !preview) return;

    selectButton.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith("image/")) {
        alert("Пожалуйста, выберите файл изображения");
        return;
      }

      try {
        preparedImage = await gradientBuilder.prepareBackgroundImage(file);
        preview.innerHTML = `
          <img src="${preparedImage.imageUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover;">
        `;
      } catch (error) {
        preparedImage = null;
        console.error("❌ Ошибка подготовки изображения:", error);
        alert("Ошибка при загрузке изображения");
      }
    });

    applyButton.addEventListener("click", () => {
      if (!preparedImage) {
        alert("Сначала выберите изображение");
        return;
      }

      gradientBuilder.uploadedImage = preparedImage.imageUrl;
      gradientBuilder.uploadedImageMeta = preparedImage;
      gradientBuilder.applyImageBackground();
    });
  }

  setupCustomBackgroundUpload();

  const colorInput = document.getElementById("bg-color");
  const exportButton = document.getElementById("export");
  const exportButton2 = document.getElementById("export2");
  const panelUpdateIdCache = new Map();

  async function resolvePanelUpdateId(panelIdentifier) {
    const normalizedIdentifier = String(panelIdentifier || "").trim();
    if (!normalizedIdentifier) {
      throw new Error("panel_id не найден в URL");
    }
    if (panelUpdateIdCache.has(normalizedIdentifier)) {
      return panelUpdateIdCache.get(normalizedIdentifier);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get("token");
    if (token) {
      const response = await fetch(
        "https://admin.i-panel.pro:8787/api/panels/get_all_panels",
        {
          method: "GET",
          headers: {
            accept: "application/json",
            Authorization: "Bearer " + token,
          },
        },
      );
      if (response.ok) {
        const panels = await response.json();
        const panel = Array.isArray(panels)
          ? panels.find(
              (item) =>
                String(item.fabric_number) === normalizedIdentifier ||
                String(item.panel_id) === normalizedIdentifier,
            )
          : null;
        if (panel?.panel_id) {
          const resolvedId = String(panel.panel_id);
          panelUpdateIdCache.set(normalizedIdentifier, resolvedId);
          return resolvedId;
        }
      }
    }

    panelUpdateIdCache.set(normalizedIdentifier, normalizedIdentifier);
    return normalizedIdentifier;
  }

  async function saveSceneToPanel(panelIdentifier, sceneData) {
    const updatePanelId = await resolvePanelUpdateId(panelIdentifier);
    const response = await fetch(
      `https://admin.i-panel.pro:8787/api/panels/update_panel_theme/${updatePanelId}`,
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: JSON.stringify(sceneData),
          theme_schedule: sceneData.themeSchedule || sceneData.theme_schedule || [],
          themeSchedule: sceneData.themeSchedule || sceneData.theme_schedule || [],
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Ошибка сохранения темы: ${response.status}`);
    }

    return response;
  }

  // colorInput.addEventListener("input", (e) => {
  //   editor.changeBackground({ color: e.target.value });
  // });

  // В обработчике exportButton добавьте:
  exportButton.addEventListener("click", async (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const panelIdUrl = urlParams.get("panel_id");

    // Получаем данные сцены
    const sceneData = editor.exportScene();

    console.log("📤 Экспорт данных сцены:");
    console.log("  - Тип фона:", sceneData.background.type);
    console.log("  - Есть градиент:", sceneData.background.hasGradient);
    console.log("  - Есть текстура:", sceneData.background.hasTexture);

    if (sceneData.background.hasGradient && sceneData.background.gradient) {
      console.log(
        "  - Градиент сохранен:",
        sceneData.background.gradient.name || "Кастомный",
      );
    }

    try {
      await saveSceneToPanel(panelIdUrl, sceneData);
      console.log("✅ Сцена успешно экспортирована и сохранена");
      alert("Сцена успешно сохранена!");
    } catch (error) {
      console.error("❌ Ошибка при сохранении сцены", error);
      alert("Ошибка при сохранении сцены");
    }
  });

  exportButton2.addEventListener("click", async (e) => {
    const urlParams = new URLSearchParams(window.location.search);
    const panelIdUrl = urlParams.get("panel_id");

    try {
      const scene = editor.exportScene();
      await saveSceneToPanel(panelIdUrl, scene);
      console.log(scene);
    } catch (error) {
      console.error("❌ Ошибка при сохранении сцены", error);
      alert("Ошибка при сохранении сцены");
    }
  });

	  const getThemeById = async () => {
	    const urlParams = new URLSearchParams(window.location.search);
	    const panelIdUrl =
	      urlParams.get("panel_id") || urlParams.get("fabric_number");
	    const token = urlParams.get("token");
	    let result = null;

	    if (token) {
	      const resolvedPanelId = await resolvePanelUpdateId(panelIdUrl);
	      const response = await fetch(
	        `https://admin.i-panel.pro:8787/api/panels/get_panel_by_id/${resolvedPanelId}`,
	        {
	          method: "GET",
	          headers: {
	            accept: "application/json",
	            Authorization: "Bearer " + token,
	          },
	        },
	      );
	      if (response.ok) {
	        result = await response.json();
	      }
	    }

	    if (!result?.theme && panelIdUrl) {
	      const response = await fetch(
	        `https://admin.i-panel.pro:8787/api/panels/theme_id/${panelIdUrl}`,
	        {
	          method: "GET",
	          headers: {
	            accept: "application/json",
	          },
	        },
	      );
	      if (response.ok) {
	        result = await response.json();
	      }
	    }

    const resolvedFabric =
      result?.fabric_number ||
      result?.fabricNumber ||
      result?.panel?.fabric_number ||
      result?.data?.fabric_number ||
      result?.data?.fabricNumber ||
      "";
    if (resolvedFabric) {
      window.__ipanelFabricNumber = String(resolvedFabric);
      window.__ipanelPanelFabricNumber = String(resolvedFabric);
    }

	    if (!result?.theme || result.theme === "undefined") {
	      console.warn("Панель не вернула тему для загрузки");
      return;
    }

	    let theme;
	    try {
	      theme = JSON.parse(result.theme);
	      if (typeof theme === "string") {
	        theme = JSON.parse(theme);
	      }
	    } catch (error) {
	      console.warn("Некорректная тема панели:", error);
	      return;
    }
    if (theme && typeof theme === "object") {
      const schedule =
        result.theme_schedule ||
        result.themeSchedule ||
        result.data?.theme_schedule ||
        result.data?.themeSchedule;
      if (schedule && !theme.themeSchedule && !theme.theme_schedule) {
        try {
          theme.themeSchedule =
            typeof schedule === "string" ? JSON.parse(schedule) : schedule;
          theme.theme_schedule = theme.themeSchedule;
        } catch {
          theme.themeSchedule = [];
          theme.theme_schedule = [];
        }
      }
    }
    if (typeof theme == "object") {
      editor.importScene(theme);
    }
  };
  getThemeById();

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

          editor.changeBackground({
            texture: texture,
            texturePath: background.url,
          });

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

  const bgTextures = {};
  const static_1080_1920 = "/assets/bg_static_1080_1920/";
  const static_1920_1080 = "/assets/bg_static_1920_1080/";
  const static_1920_540 = "/assets/bg_static_1920_540/";

  let isBackgroundsReady = false;
  let backgroundsLoadPromise = null;

  async function loadBackgroundTextures() {
    // Если уже загружается, возвращаем существующий промис
    if (backgroundsLoadPromise) {
      return backgroundsLoadPromise;
    }

    // Показываем индикатор загрузки
    showLoaderInCarousel();

    backgroundsLoadPromise = (async () => {
      try {
        isBackgroundsReady = true;
        initBgCarousel();
        selectBack();
        return true;

        // 1080 x 1920
        bgTextures.bg1 = await PIXI.Assets.load(
          static_1080_1920 + "abstract-bird-3840x2160-24453.png",
        );
        bgTextures.bg2 = await PIXI.Assets.load(
          static_1080_1920 + "blue-abstract-3840x2160-24798.png",
        );
        bgTextures.bg3 = await PIXI.Assets.load(
          static_1080_1920 + "blue-abstract-3840x2160-25023.png",
        );
        bgTextures.bg4 = await PIXI.Assets.load(
          static_1080_1920 +
            "blue-abstract-blue-background-gradient-abstract-3840x2160-8985.png",
        );
        bgTextures.bg5 = await PIXI.Assets.load(
          static_1080_1920 + "flutie8211-gradient-8174930.png",
        );
        bgTextures.bg6 = await PIXI.Assets.load(
          static_1080_1920 + "glowing-light-in-colors-8k-pb.png",
        );
        bgTextures.bg7 = await PIXI.Assets.load(
          static_1080_1920 + "golden-dark-3840x2160-25333.png",
        );
        bgTextures.bg8 = await PIXI.Assets.load(
          static_1080_1920 + "huawei-mate-80-3840x2160-24785.png",
        );
        bgTextures.bg9 = await PIXI.Assets.load(
          static_1080_1920 + "infinity-purple-5120x2880-25344.png",
        );
        bgTextures.bg10 = await PIXI.Assets.load(
          static_1080_1920 + "macos-tahoe-26-5120x2880-22675.png",
        );
        bgTextures.bg11 = await PIXI.Assets.load(
          static_1080_1920 + "mesmerizing-purple-gradient-waves-9o.png",
        );
        bgTextures.bg12 = await PIXI.Assets.load(
          static_1080_1920 +
            "samsung-galaxy-s21-stock-amoled-particles-blue-black-3200x3200-3972.png",
        );
        bgTextures.bg13 = await PIXI.Assets.load(
          static_1080_1920 + "spectrum_swirl-wallpaper-2560x2048.png",
        );
        bgTextures.bg14 = await PIXI.Assets.load(
          static_1080_1920 + "ultrawide-blue-3840x2160-19825.png",
        );
        bgTextures.bg15 = await PIXI.Assets.load(
          static_1080_1920 + "wallhaven-pk1ykp.png",
        );
        bgTextures.bg16 = await PIXI.Assets.load(
          static_1080_1920 + "xiaomi-pad-stock-3840x2160-11667.png",
        );

        // 1920 X 1080
        bgTextures.bg17 = await PIXI.Assets.load(
          static_1920_1080 + "abstract-bird-3840x2160-24453.png",
        );
        bgTextures.bg18 = await PIXI.Assets.load(
          static_1920_1080 + "blue-abstract-3840x2160-24798.png",
        );
        bgTextures.bg19 = await PIXI.Assets.load(
          static_1920_1080 + "blue-abstract-3840x2160-25023.png",
        );
        bgTextures.bg20 = await PIXI.Assets.load(
          static_1920_1080 +
            "blue-abstract-blue-background-gradient-abstract-3840x2160-8985.png",
        );
        bgTextures.bg21 = await PIXI.Assets.load(
          static_1920_1080 + "glowing-light-in-colors-8k-pb.png",
        );
        bgTextures.bg22 = await PIXI.Assets.load(
          static_1920_1080 + "golden-dark-3840x2160-25333.png",
        );
        bgTextures.bg23 = await PIXI.Assets.load(
          static_1920_1080 + "huawei-mate-80-3840x2160-24785.png",
        );
        bgTextures.bg24 = await PIXI.Assets.load(
          static_1920_1080 + "infinity-purple-5120x2880-25344.png",
        );
        bgTextures.bg25 = await PIXI.Assets.load(
          static_1920_1080 + "macos-tahoe-26-5120x2880-22675.png",
        );
        bgTextures.bg26 = await PIXI.Assets.load(
          static_1920_1080 + "mesmerizing-purple-gradient-waves-9o.png",
        );
        bgTextures.bg27 = await PIXI.Assets.load(
          static_1920_1080 +
            "samsung-galaxy-s21-stock-amoled-particles-blue-black-3200x3200-3972.png",
        );
        bgTextures.bg28 = await PIXI.Assets.load(
          static_1920_1080 + "spectrum_swirl-wallpaper-2560x2048.png",
        );
        bgTextures.bg29 = await PIXI.Assets.load(
          static_1920_1080 + "ultrawide-blue-3840x2160-19825.png",
        );
        bgTextures.bg30 = await PIXI.Assets.load(
          static_1920_1080 + "wallhaven-pk1ykp.png",
        );
        bgTextures.bg31 = await PIXI.Assets.load(
          static_1920_1080 + "xiaomi-pad-stock-3840x2160-11667.png",
        );

        // 1920 X 540
        bgTextures.bg32 = await PIXI.Assets.load(
          static_1920_540 + "glowing-light-in-colors-8k-pb.png",
        );
        bgTextures.bg33 = await PIXI.Assets.load(
          static_1920_540 + "spectrum_swirl-wallpaper-2560x2048.png",
        );

        console.log(
          "✅ Фоновые текстуры загружены. Всего:",
          Object.keys(bgTextures).length,
        );

        isBackgroundsReady = true;

        // После загрузки всех текстур - инициализируем карусель
        initBgCarousel();
        selectBack();

        return true;
      } catch (error) {
        console.error("❌ Ошибка загрузки фоновых текстур:", error);
        showError("❌ Ошибка загрузки фоновых изображений");
        return false;
      } finally {
        backgroundsLoadPromise = null;
      }
    })();

    return backgroundsLoadPromise;
  }

  function showLoaderInCarousel() {
    const carouselSize = getBackgroundCarouselSize();
    const track = document.getElementById("bg-carousel-track");
    if (!track) return;

    // Очищаем трек
    track.innerHTML = "";

    // Показываем индикатор загрузки
    const loaderContainer = document.createElement("div");
    loaderContainer.style.cssText = `
    flex: 0 0 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    gap: 16px;
  `;

    loaderContainer.innerHTML = `
    <div class="carousel-loader" style="
      width: 48px;
      height: 48px;
      border: 3px solid rgba(255, 255, 255, 0.2);
      border-top-color: var(--accent-primary);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    "></div>
    <div style="
      color: var(--text-secondary);
      font-size: 14px;
      text-align: center;
    ">Загрузка фоновых изображений...</div>
    <div style="
      color: var(--text-tertiary);
      font-size: 11px;
      text-align: center;
    ">Размер холста: ${carouselSize.width}×${carouselSize.height}</div>
  `;

    track.appendChild(loaderContainer);

    // Добавляем анимацию, если её ещё нет
    if (!document.querySelector("#carousel-loader-styles")) {
      const style = document.createElement("style");
      style.id = "carousel-loader-styles";
      style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
      document.head.appendChild(style);
    }
  }

  // Функция-обертка для установки фона с проверкой
  function resolveTexturePath(texture, texturePath) {
    if (
      typeof texturePath === "string" &&
      (/^(\/|https?:|data:|blob:)/.test(texturePath) ||
        texturePath.includes("/"))
    ) {
      return texturePath;
    }

    const cacheId = texture?.textureCacheIds?.find((id) =>
      texturePath ? id.includes(texturePath) : true,
    );
    const resourceSrc = texture?.source?.resource?.src;
    return cacheId || resourceSrc || texturePath;
  }

  function getStaticFolderForBgItem(item) {
    if (!item?.id) return static_1920_1080;
    const numericId = Number(String(item.id).replace("bg-", ""));
    if (numericId >= 201) return static_1920_540;
    if (numericId >= 101) return static_1920_1080;
    return static_1080_1920;
  }

  async function setBackground(texture, texturePath) {
    let resolvedTexturePath = resolveTexturePath(texture, texturePath);
    console.log("TEXTURE, PATH", texture, resolvedTexturePath);

    if (!texture && resolvedTexturePath) {
      try {
        texture = await PIXI.Assets.load(resolvedTexturePath);
      } catch (error) {
        console.error("❌ Ошибка загрузки фона:", error);
      }
    }

    if (!texture) {
      console.error("❌ Текстура не загружена", resolvedTexturePath);
      if (typeof showError === "function") {
        showError("Фон не загружен. Попробуйте позже.");
      }
      return false;
    }

    resolvedTexturePath = resolveTexturePath(texture, resolvedTexturePath);

    // Если проверка пройдена, устанавливаем фон
    editor.changeBackground({
      texture: texture,
      texturePath: resolvedTexturePath,
    });

    return true;
  }

  const bgButtonsData = [
    // 1080 X 1920
    {
      id: "bg-1",
      textureKey: "bg1",
      path: "abstract-bird-3840x2160-24453.png",
    },
    {
      id: "bg-2",
      textureKey: "bg2",
      path: "blue-abstract-3840x2160-24798.png",
    },
    {
      id: "bg-3",
      textureKey: "bg3",
      path: "blue-abstract-3840x2160-25023.png",
    },
    {
      id: "bg-4",
      textureKey: "bg4",
      path: "blue-abstract-blue-background-gradient-abstract-3840x2160-8985.png",
    },
    {
      id: "bg-5",
      textureKey: "bg5",
      path: "flutie8211-gradient-8174930.png",
    },
    {
      id: "bg-6",
      textureKey: "bg6",
      path: "glowing-light-in-colors-8k-pb.png",
    },
    {
      id: "bg-7",
      textureKey: "bg7",
      path: "golden-dark-3840x2160-25333.png",
    },
    {
      id: "bg-8",
      textureKey: "bg8",
      path: "huawei-mate-80-3840x2160-24785.png",
    },
    {
      id: "bg-9",
      textureKey: "bg9",
      path: "infinity-purple-5120x2880-25344.png",
    },
    {
      id: "bg-10",
      textureKey: "bg10",
      path: "macos-tahoe-26-5120x2880-22675.png",
    },
    {
      id: "bg-11",
      textureKey: "bg11",
      path: "mesmerizing-purple-gradient-waves-9o.png",
    },
    {
      id: "bg-12",
      textureKey: "bg12",
      path: "samsung-galaxy-s21-stock-amoled-particles-blue-black-3200x3200-3972.png",
    },
    {
      id: "bg-13",
      textureKey: "bg13",
      path: "spectrum_swirl-wallpaper-2560x2048.png",
    },
    {
      id: "bg-14",
      textureKey: "bg14",
      path: "ultrawide-blue-3840x2160-19825.png",
    },
    {
      id: "bg-15",
      textureKey: "bg15",
      path: "wallhaven-pk1ykp.png",
    },
    {
      id: "bg-16",
      textureKey: "bg16",
      path: "xiaomi-pad-stock-3840x2160-11667.png",
    },

    // 1920 X 1080
    {
      id: "bg-101",
      textureKey: "bg17",
      path: "abstract-bird-3840x2160-24453.png",
    },
    {
      id: "bg-102",
      textureKey: "bg18",
      path: "blue-abstract-3840x2160-24798.png",
    },
    {
      id: "bg-103",
      textureKey: "bg19",
      path: "blue-abstract-3840x2160-25023.png",
    },
    {
      id: "bg-104",
      textureKey: "bg20",
      path: "blue-abstract-blue-background-gradient-abstract-3840x2160-8985.png",
    },
    {
      id: "bg-105",
      textureKey: "bg21",
      path: "glowing-light-in-colors-8k-pb.png",
    },
    {
      id: "bg-106",
      textureKey: "bg22",
      path: "golden-dark-3840x2160-25333.png",
    },
    {
      id: "bg-107",
      textureKey: "bg23",
      path: "huawei-mate-80-3840x2160-24785.png",
    },
    {
      id: "bg-108",
      textureKey: "bg24",
      path: "infinity-purple-5120x2880-25344.png",
    },
    {
      id: "bg-109",
      textureKey: "bg25",
      path: "macos-tahoe-26-5120x2880-22675.png",
    },
    {
      id: "bg-110",
      textureKey: "bg26",
      path: "mesmerizing-purple-gradient-waves-9o.png",
    },
    {
      id: "bg-111",
      textureKey: "bg27",
      path: "samsung-galaxy-s21-stock-amoled-particles-blue-black-3200x3200-3972.png",
    },
    {
      id: "bg-112",
      textureKey: "bg28",
      path: "spectrum_swirl-wallpaper-2560x2048.png",
    },
    {
      id: "bg-113",
      textureKey: "bg29",
      path: "ultrawide-blue-3840x2160-19825.png",
    },
    {
      id: "bg-114",
      textureKey: "bg30",
      path: "wallhaven-pk1ykp.png",
    },
    {
      id: "bg-115",
      textureKey: "bg31",
      path: "xiaomi-pad-stock-3840x2160-11667.png",
    },

    // 1920 x 540
    {
      id: "bg-201",
      textureKey: "bg32",
      path: "glowing-light-in-colors-8k-pb.png",
    },
    {
      id: "bg-202",
      textureKey: "bg33",
      path: "spectrum_swirl-wallpaper-2560x2048.png",
    },
  ];

  function selectBack() {
    bgButtonsData.forEach((item) => {
      const button = document.getElementById(item.id);
      if (!button) {
        return;
      }

      if (button.dataset.backgroundBound) return;

      button.dataset.backgroundBound = "true";
      button.addEventListener("click", async () => {
        const fullPath = getStaticFolderForBgItem(item) + item.path;
        if (!bgTextures[item.textureKey]) {
          try {
            bgTextures[item.textureKey] = await PIXI.Assets.load(fullPath);
          } catch (error) {
            console.error("❌ Ошибка загрузки фона:", error);
            return;
          }
        }
        await setBackground(bgTextures[item.textureKey], fullPath);
      });
    });
  }
  window.refreshBackgroundButtons = selectBack;

  loadBackgroundTextures();

  // Кнопки для добавления виджетов
  const analogCLockButton1 = document.getElementById("analog-clock-1");
  const analogCLockButton2 = document.getElementById("analog-clock-2");
  const analogCLockButton3 = document.getElementById("analog-clock-3");
  const analogCLockButton4 = document.getElementById("analog-clock-4");
  const analogCLockButton5 = document.getElementById("analog-clock-5");
  const analogCLockButton6 = document.getElementById("analog-clock-6");
  const analogCLockButton7 = document.getElementById("analog-clock-7");
  const analogCLockButtonCustom = document.getElementById("analog-clock-custom");

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
  const trafficButton4 = document.getElementById("traffic-4");

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
  const companyButton4 = document.getElementById("company-4");
  const shapeRectangleButton = document.getElementById("shape-rectangle");
  const shapeEllipseButton = document.getElementById("shape-ellipse");
  const shapeTriangleButton = document.getElementById("shape-triangle");
  const shapeLineButton = document.getElementById("shape-line");
  const drawingButton = document.getElementById("drawing-widget");
  const audioPlayerButton = document.getElementById("audio-player-widget");
  const floorWidgetButton = document.getElementById("floor-widget");

  /**
   * Универсальная функция для показа подсказок/уведомлений
   * @param {string} text - Текст подсказки
   * @param {Object} options - Настройки (опционально)
   */
  function showHint(text, options = {}) {
    // Настройки по умолчанию
    const config = {
      type: options.type || "info", // 'info', 'success', 'warning', 'error'
      duration: options.duration || 3000, // 0 = не закрывать автоматически
      position: options.position || "top-right", // 'top-right', 'top-left', 'bottom-right', 'bottom-left'
      icon: options.icon || null, // Своя иконка, если null - будет автоматическая
      onClose: options.onClose || null, // Функция при закрытии
      ...options,
    };

    // Иконки по типам
    const icons = {
      info: "ℹ️",
      success: "✅",
      warning: "⚠️",
      error: "❌",
    };

    // Стили по типам
    const styles = {
      info: {
        background: "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)",
        border: "1px solid rgba(59, 130, 246, 0.3)",
      },
      success: {
        background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
        border: "1px solid rgba(16, 185, 129, 0.3)",
      },
      warning: {
        background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
        border: "1px solid rgba(245, 158, 11, 0.3)",
      },
      error: {
        background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
        border: "1px solid rgba(239, 68, 68, 0.3)",
      },
    };

    // Создаем ID для подсказки
    const hintId =
      "hint-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9);

    // Создаем элемент
    const hint = document.createElement("div");
    hint.id = hintId;
    hint.className = "hint-notification";
    hint.style.cssText = `
    position: fixed;
    z-index: 10001;
    ${getPositionStyles(config.position)};
    animation: hintSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
  `;

    // Внутренний контент
    hint.innerHTML = `
    <div class="hint-content" style="
      ${styles[config.type].background};
      ${styles[config.type].border};
      backdrop-filter: blur(20px) saturate(180%);
      border-radius: var(--border-radius);
      padding: 16px 20px;
      color: white;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: var(--shadow-lg);
      position: relative;
      overflow: hidden;
      max-width: 400px;
      min-width: 300px;
    ">
      <div class="hint-icon" style="
        font-size: 24px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        backdrop-filter: blur(10px);
      ">
        ${config.icon || icons[config.type]}
      </div>
      <div class="hint-text" style="
        flex: 1;
        font-size: 14px;
        font-weight: 500;
        line-height: 1.5;
      ">
        ${text}
      </div>
      <button class="hint-close" style="
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.8);
        cursor: pointer;
        padding: 8px;
        margin: -8px -8px -8px 0;
        border-radius: 6px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        font-size: 20px;
        backdrop-filter: blur(10px);
      ">
        &times;
      </button>
      ${
        config.duration > 0
          ? `
        <div class="hint-progress" style="
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: rgba(255, 255, 255, 0.3);
          overflow: hidden;
          border-radius: 0 0 var(--border-radius) var(--border-radius);
        ">
          <div class="hint-progress-bar" style="
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            background: white;
            width: 100%;
            animation: hintProgressShrink ${config.duration}ms linear forwards;
          "></div>
        </div>
      `
          : ""
      }
    </div>
  `;

    // Добавляем на страницу
    document.body.appendChild(hint);

    // Анимации
    const styleSheet = document.createElement("style");
    styleSheet.textContent = `
    @keyframes hintSlideIn {
      from { opacity: 0; transform: translateY(-20px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes hintSlideOut {
      from { opacity: 1; transform: translateY(0) scale(1); }
      to { opacity: 0; transform: translateY(-20px) scale(0.95); }
    }
    @keyframes hintProgressShrink {
      from { width: 100%; }
      to { width: 0%; }
    }
  `;
    document.head.appendChild(styleSheet);

    // Функция закрытия
    const closeHint = () => {
      hint.style.animation =
        "hintSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards";

      setTimeout(() => {
        if (hint.parentNode) {
          hint.parentNode.removeChild(hint);
        }
        if (config.onClose && typeof config.onClose === "function") {
          config.onClose();
        }
      }, 300);
    };

    // Обработчик кнопки закрытия
    const closeBtn = hint.querySelector(".hint-close");
    closeBtn.addEventListener("click", closeHint);

    // Автоматическое закрытие
    if (config.duration > 0) {
      setTimeout(closeHint, config.duration);
    }

    // Возвращаем объект с методами управления
    return {
      close: closeHint,
      element: hint,
    };
  }

  // Вспомогательная функция для позиционирования
  function getPositionStyles(position) {
    switch (position) {
      case "top-left":
        return "top: 20px; left: 20px;";
      case "top-right":
        return "top: 20px; right: 20px;";
      case "bottom-left":
        return "bottom: 20px; left: 20px;";
      case "bottom-right":
        return "bottom: 20px; right: 20px;";
      default:
        return "top: 20px; right: 20px;";
    }
  }

  // ==============================
  // ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ:
  // ==============================

  // 1. Простое уведомление
  // showHint('Файл успешно сохранен!');

  // 2. С разными типами
  // showHint('Ошибка загрузки', { type: 'error', duration: 5000 });
  // showHint('Успешно!', { type: 'success' });
  // showHint('Внимание!', { type: 'warning' });

  // 3. С разной позицией
  // showHint('Сообщение сверху слева', { position: 'top-left' });
  // showHint('Сообщение снизу справа', { position: 'bottom-right' });

  // 4. С иконкой
  // showHint('Кастомная иконка', { icon: '🚀' });

  // 5. Без автозакрытия
  // showHint('Нажмите ✕ чтобы закрыть', { duration: 0 });

  // 6. С callback при закрытии
  // showHint('Проверка завершена', {
  //   onClose: () => console.log('Подсказка закрыта')
  // });
  // Обработчики для добавления виджетов
  // Короткие функции для быстрого использования
  function showSuccess(text, duration = 3000) {
    return showHint(text, { type: "success", duration });
  }

  function showError(text, duration = 5000) {
    return showHint(text, { type: "error", duration });
  }

  function showWarning(text, duration = 4000) {
    return showHint(text, { type: "warning", duration });
  }

  function showInfo(text, duration = 3000) {
    return showHint(text, { type: "info", duration });
  }

  // Пример использования оберток:
  document.getElementById("resize").addEventListener("click", function () {
    showSuccess("Размер холста изменен!");
  });

  const widgetsTab = document
    .querySelector('[data-tab="widgets"]')
    .addEventListener("click", (event) => {
      showInfo(
        "В данной вкладке вы можете выбрать виджеты для своей панели и разместить их, для того чтобы поставить виджет выберите его и кликнете по нему один раз, виджет появится на рабочем поле редактора",
      );
      window.modalConstructor.style.display = "none";
    });
  const backTab = document
    .querySelector('[data-tab="background"]')
    .addEventListener("click", (event) => {
      showInfo(
        "В данной вкладке вы можете настроить задний фон панели, это может быть сплошной цвет, градиент, картинка или видео. Удачи!",
      );
      window.openModalConstructor();
    });
  const toolsTab = document
    .querySelector('[data-tab="tools"]')
    .addEventListener("click", (event) => {
      showInfo(
        "В данной вкладке вам доступно управление сеткой рабочей области и рекламными данными, учтите, что сетка видна только в редакторе вне зависимости от ее настроек!",
      );
      window.modalConstructor.style.display = "none";
    });
  const mediaTab = document
    .querySelector('[data-tab="media"]')
    .addEventListener("click", (event) => {
      showInfo(
        "В данной вкладке вы можете управлять медиа на панели, поставить музыку или загрузить видео и картинки для показа в виджете видео. Не забудьте настроить номер проигрывателя в виджете видео, картинки и видео будут показываться только на том виджете на котором установлен корректный номер проигрывателя!",
      );
      window.modalConstructor.style.display = "none";
    });
  document
    .querySelector('[data-tab="settings"]')
    ?.addEventListener("click", () => {
      showInfo(
        "Здесь настраиваются ночной режим, смена тем по времени и дополнительные параметры панели.",
      );
      window.modalConstructor.style.display = "none";
    });

  const themes = document
    .querySelector('[data-tab="themes"]')
    .addEventListener("click", (event) => {
      showInfo(
        "Здесь вы можете выбрать готовые темы от команды IPANEL для вашей панели, желаем удачи!",
      );
      window.modalConstructor.style.display = "none";
    });
  const layout = document
    .querySelector('[data-tab="layout"]')
    .addEventListener("click", (event) => {
      showInfo(
        "здесь вы можете настроить рабочее поле редактора, учтите, что размер поля должен соответствовать размеру панели!",
      );
      window.modalConstructor.style.display = "none";
    });

  const settingsTabContent = document.getElementById("settings-tab-content");
  const moveSectionToSettings = (sectionId) => {
    const section = document.getElementById(sectionId);
    const title = document.querySelector(`[data-target="${sectionId}"]`);
    if (settingsTabContent && title && section) {
      settingsTabContent.appendChild(title);
      settingsTabContent.appendChild(section);
      section.classList.remove("collapsed");
      const toggle = title.querySelector(".section-toggle");
      if (toggle) toggle.textContent = "−";
    }
  };
  moveSectionToSettings("night-mode-section");
  moveSectionToSettings("theme-schedule-section");

  const gridSettingsButton = document.getElementById("grid-settings-btn");
  const gridSettingsModal = document.getElementById("grid-settings-modal");
  const gridSettingsBody = document.getElementById("grid-settings-body");
  const gridSettingsClose = document.getElementById("grid-settings-close");
  const renderGridSettings = () => {
    if (!gridSettingsBody) return;
    const currentColor = editor.gridColor?.startsWith?.("#")
      ? editor.gridColor
      : "#535353";
    gridSettingsBody.innerHTML = `
      <div style="display:grid;gap:14px;">
        <label class="form-label" style="display:flex;align-items:center;gap:10px;">
          <input type="checkbox" id="grid-modal-enabled" ${editor.gridVisible ? "checked" : ""} />
          <span>Показывать сетку</span>
        </label>
        <div class="form-group">
          <label class="form-label">Размер сетки</label>
          <input id="grid-modal-size" class="form-input" type="number" min="1" max="400" step="1" value="${editor.gridSize || 10}" />
        </div>
        <div class="form-group">
          <label class="form-label">Цвет сетки</label>
          <input id="grid-modal-color" class="form-input" type="color" value="${currentColor}" style="height:42px;padding:3px;" />
        </div>
        <div class="form-group">
          <label class="form-label" style="display:flex;justify-content:space-between;">
            <span>Прозрачность сетки</span>
            <span id="grid-modal-alpha-value">${Number(editor.gridAlpha ?? 1).toFixed(2)}</span>
          </label>
          <input id="grid-modal-alpha" type="range" min="0" max="1" step="0.01" value="${editor.gridAlpha ?? 1}" style="width:100%;" />
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <button type="button" class="btn-modern" id="grid-modal-half">0.5x</button>
          <button type="button" class="btn-modern" id="grid-modal-double">2x</button>
        </div>
      </div>
    `;

    const enabled = gridSettingsBody.querySelector("#grid-modal-enabled");
    const size = gridSettingsBody.querySelector("#grid-modal-size");
    const color = gridSettingsBody.querySelector("#grid-modal-color");
    const alpha = gridSettingsBody.querySelector("#grid-modal-alpha");
    const alphaValue = gridSettingsBody.querySelector("#grid-modal-alpha-value");
    const applyGrid = () => {
      const nextSize = Math.max(1, Number(size.value) || 10);
      editor.gridSize = nextSize;
      editor.gridColor = color.value;
      editor.gridAlpha = Math.max(0, Math.min(1, Number(alpha.value)));
      editor.toggleGrid(enabled.checked);
      editor.createGrid({
        size: nextSize,
        color: color.value,
        alpha: editor.gridAlpha,
      });
      if (editor.grid) editor.grid.visible = enabled.checked;
      const legacySize = document.getElementById("gridsize");
      const legacyEnabled = document.getElementById("grid-enabled");
      const legacyColor = document.getElementById("grid-color");
      if (legacySize) legacySize.value = nextSize;
      if (legacyEnabled) legacyEnabled.checked = enabled.checked;
      if (legacyColor) legacyColor.value = color.value;
    };

    enabled.addEventListener("change", applyGrid);
    size.addEventListener("input", applyGrid);
    color.addEventListener("input", applyGrid);
    alpha.addEventListener("input", () => {
      alphaValue.textContent = Number(alpha.value).toFixed(2);
      applyGrid();
    });
    gridSettingsBody.querySelector("#grid-modal-half").addEventListener("click", () => {
      size.value = Math.max(1, Math.floor((Number(size.value) || 10) * 0.5));
      applyGrid();
    });
    gridSettingsBody.querySelector("#grid-modal-double").addEventListener("click", () => {
      size.value = Math.max(1, Math.round((Number(size.value) || 10) * 2));
      applyGrid();
    });
  };
  const closeGridSettings = () => {
    if (gridSettingsModal) gridSettingsModal.style.display = "none";
  };
  gridSettingsButton?.addEventListener("click", () => {
    renderGridSettings();
    if (gridSettingsModal) gridSettingsModal.style.display = "flex";
  });
  gridSettingsClose?.addEventListener("click", closeGridSettings);
  gridSettingsModal?.addEventListener("click", (event) => {
    if (event.target === gridSettingsModal) closeGridSettings();
  });

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
  analogCLockButtonCustom?.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new AnalogClockWidget(bounds, 246, 246, {
        clockType: 9,
        backgroundAlpha: 0,
        customFaceId: "face_2",
        customHourHandId: "gold_wide_hour",
        customMinuteHandId: "gold_wide_minute",
        customSecondHandId: "blue_second",
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
  trafficButton4.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(new TrafficWidget(bounds, 246, 246));
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
  companyButton4?.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    editor.addWidget(
      new CompanyWidget(bounds, 180, 180, {
        type: "qr-only",
        panelFabricNumber:
          window.__ipanelFabricNumber ||
          new URLSearchParams(window.location.search).get("fabric_number") ||
          new URLSearchParams(window.location.search).get("panel_id") ||
          "",
        backgroundColor: 0x1e1e1e,
        backgroundAlpha: 1,
        cornerRadius: 32,
      }),
    );
  });
  // Найдите этот код в вашем файле:
  // В обработчике video1.addEventListener("click", ...)
  const video1 = document.getElementById("video-1");
  video1.addEventListener("click", () => {
    console.log("🖱️ Клик по кнопке видео-1");

    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );

    const panelId = getPanelIdFromUrl();

    if (!panelId) {
      console.warn("⚠️ panel_id не найден в URL");
      if (typeof showWarning === "function") {
        showWarning("panel_id не найден в URL");
      }
    }

    // Сохраняем состояние ДО добавления
    const beforeState = undoManager.getCurrentState();

    // Создаем VideoWidget
    const videoWidget = new VideoWidget(bounds, {
      panelId: panelId,
      playerNumber: 1,
      imageDisplayTime: 10,
    });

    // Добавляем виджет
    editor.addWidget(videoWidget);

    // Сохраняем в историю ПОСЛЕ добавления
    setTimeout(() => {
      undoManager.save("Добавлен видео-виджет");
    }, 100);

    if (typeof showSuccess === "function") {
      showSuccess("Видео-виджет добавлен");
    }
  });

  audioPlayerButton?.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    const widget = new AudioPlayerWidget(bounds, {
      panelId: getPanelIdFromUrl(),
    });
    editor.addWidget(widget);
    widget.select();
    if (typeof showSuccess === "function") {
      showSuccess("Аудиоплеер добавлен");
    }
  });

  floorWidgetButton?.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    const widget = new DirectionFloorWidget(bounds, {
      width: 260,
      height: 260,
      floor: 1,
      direction: "up",
      backgroundColor: 0x1e1e1e,
      backgroundAlpha: 1,
      cornerRadius: 32,
    });
    editor.addWidget(widget);
    widget.select();
    if (typeof showSuccess === "function") {
      showSuccess("Виджет этажа добавлен");
    }
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

  [
    [shapeRectangleButton, "rectangle"],
    [shapeEllipseButton, "ellipse"],
    [shapeTriangleButton, "triangle"],
    [shapeLineButton, "line"],
  ].forEach(([button, shapeType]) => {
    button?.addEventListener("click", () => {
      const bounds = new PIXI.Rectangle(
        0,
        0,
        editor.getWidth(),
        editor.getHeight(),
      );
      editor.addWidget(new ShapeWidget(bounds, shapeType));
    });
  });

  drawingButton?.addEventListener("click", () => {
    const bounds = new PIXI.Rectangle(
      0,
      0,
      editor.getWidth(),
      editor.getHeight(),
    );
    const widget = new DrawingWidget(bounds);
    editor.addWidget(widget);
    widget.select();
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
  // В основном файле, в обработчике resizeButton
  resizeButton.addEventListener("click", () => {
    const width = document.getElementById("width");
    const height = document.getElementById("height");
    if (width.value && height.value) {
      editor.resize(Number(width.value), Number(height.value));

      // Обновляем границы всех виджетов
      const bounds = new PIXI.Rectangle(
        0,
        0,
        editor.getWidth(),
        editor.getHeight(),
      );
      editor?.children?.forEach((child) => {
        if (child.updateBounds) {
          child.updateBounds(bounds);
        }
      });

      refreshBackgroundControls();
      window.loadAnimatedPresets();
      window.setupEventListeners();
    }
  });
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");

  // Функция для изменения размера
  function applyResize() {
    if (widthInput.value && heightInput.value) {
      editor.resize(Number(widthInput.value), Number(heightInput.value));
      refreshBackgroundControls();
    }
  }

  // Обработка Enter в поле ширины
  widthInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      applyResize();
    }
  });

  // Обработка Enter в поле высоты
  heightInput.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      applyResize();
    }
  });

  // Функции для работы с черновиками
  function updateDraftList() {
    const draftListContainer = document.getElementById("draft-list");

    // Очищаем контейнер
    draftListContainer.innerHTML = "";

    // Получаем все черновики из localStorage
    const drafts = [];

    // Собираем все ключи с их данными
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("draft_")) {
        // Извлекаем имя и дату из ключа
        const keyParts = key.replace("draft_", "").split("%%");
        const name = keyParts[0];
        const createdAt = keyParts[1] ? parseInt(keyParts[1]) : 0;

        drafts.push({
          key: key,
          name: name,
          createdAt: createdAt,
        });
      }
    }

    // Сортируем по дате создания (от новых к старым)
    drafts.sort((a, b) => b.createdAt - a.createdAt);

    // Если черновиков нет, показываем сообщение
    if (drafts.length === 0) {
      const emptyMessage = document.createElement("div");
      emptyMessage.className = "draft-empty-message";
      emptyMessage.textContent = "Проекты не найдены";
      draftListContainer.appendChild(emptyMessage);
      return;
    }

    // Создаем блоки для каждого черновика
    drafts.forEach((draft) => {
      const draftBlock = document.createElement("div");
      draftBlock.className = "draft-item";
      draftBlock.style.overflow = "visible";
      draftBlock.dataset.key = draft.key;

      // Название черновика
      const draftName = document.createElement("span");
      draftName.className = "draft-name";
      draftName.textContent = draft.name;

      // Контейнер для меню с троеточием
      const menuContainer = document.createElement("div");
      menuContainer.className = "draft-menu-container";

      // Кнопка с троеточием
      const menuButton = document.createElement("button");
      menuButton.className = "draft-menu-button";
      menuButton.innerHTML = "⋮"; // Символ троеточия
      menuButton.setAttribute("aria-label", "Меню действий");

      // Выпадающее меню
      const dropdownMenu = document.createElement("div");
      dropdownMenu.className = "draft-dropdown-menu";
      dropdownMenu.innerHTML = `
            <div class="draft-menu-item" data-action="open">Выбрать</div>
            <div class="draft-menu-item" data-action="rename">Переименовать</div>
            <div class="draft-menu-item" data-action="duplicate">Дублировать</div>
            <div class="draft-menu-item" data-action="delete">Удалить</div>
        `;

      // Собираем структуру
      menuContainer.appendChild(menuButton);
      menuContainer.appendChild(dropdownMenu);
      draftBlock.appendChild(draftName);
      draftBlock.appendChild(menuContainer);
      draftListContainer.appendChild(draftBlock);

      // Добавляем обработчик клика на весь блок черновика
      draftBlock.addEventListener("click", (e) => {
        // Проверяем, что клик был не по меню и не по кнопке меню
        if (
          !e.target.closest(".draft-menu-container") &&
          !e.target.closest(".draft-menu-button")
        ) {
          console.log("Выбран черновик:", draft.name);
          document.getElementById("draft-name").value = draft.name;
        }
      });

      draftBlock.addEventListener("click", (e) => {
        e.stopPropagation();
        loadDraft(draft.key);
      });

      // Обработчики событий для меню
      menuButton.addEventListener("click", (e) => {
        e.stopPropagation();
        e.preventDefault(); // Добавляем для надежности

        // Закрываем другие открытые меню
        document
          .querySelectorAll(".draft-dropdown-menu.show")
          .forEach((menu) => {
            if (menu !== dropdownMenu) {
              menu.classList.remove("show");
            }
          });

        dropdownMenu.classList.toggle("show");
      });

      // Обработчики для пунктов меню
      dropdownMenu.querySelectorAll(".draft-menu-item").forEach((item) => {
        item.addEventListener("click", (e) => {
          e.stopPropagation();
          e.preventDefault();

          const action = item.dataset.action;
          const draftKey = draftBlock.dataset.key;

          switch (action) {
            case "open":
              console.log("Открыть черновик:", draftKey);
              loadDraft(draft.key);
              break;
            case "rename":
              console.log("Переименовать черновик:", draftKey);
              renameDraft(draft.key);
              break;
            case "duplicate":
              console.log("Дублировать черновик:", draftKey);
              duplicateDraft(draft.key);
              break;
            case "delete":
              console.log("Удалить черновик:", draftKey);
              deleteDraft(draft.key);
              break;
          }

          dropdownMenu.classList.remove("show");
        });
      });
    });

    // Добавляем глобальный обработчик для закрытия меню
    document.addEventListener("click", function closeMenus(e) {
      if (!e.target.closest(".draft-menu-container")) {
        document
          .querySelectorAll(".draft-dropdown-menu.show")
          .forEach((menu) => {
            menu.classList.remove("show");
          });
      }
    });
  }

  document.getElementById("save-draft").addEventListener("click", function () {
    const name = document.getElementById("draft-name").value;
    if (!name.trim()) {
      showError("Введите название проекта");
      return;
    }
    saveDraft();
    showSuccess(`Проект "${name}" сохранен`);
  });

  const buttonExport = document.getElementById("get-screenshot");

  // Создаем меню выбора формата
  function createFormatMenu() {
    const menu = document.createElement("div");
    menu.id = "export-format-menu";
    menu.style.cssText = `
    position: absolute;
    background: #2d2d3a;
    border: 1px solid #3d3d4d;
    border-radius: 8px;
    padding: 8px 0;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 1000;
    display: none;
  `;

    menu.innerHTML = `
    <div class="format-option" data-format="png" style="padding: 8px 24px; cursor: pointer; transition: background 0.2s;">
      PNG
    </div>
    <div class="format-option" data-format="pdf" style="padding: 8px 24px; cursor: pointer; transition: background 0.2s;">
      PDF
    </div>
  `;

    // Стили при наведении
    const style = document.createElement("style");
    style.textContent = `
    .format-option:hover {
      background: #3d3d4d;
    }
  `;
    document.head.appendChild(style);

    document.body.appendChild(menu);
    return menu;
  }

  const formatMenu = createFormatMenu();

  // Показываем меню при клике на кнопку
  buttonExport.addEventListener("click", (event) => {
    const rect = buttonExport.getBoundingClientRect();
    formatMenu.style.display = "block";
    formatMenu.style.top = rect.bottom + window.scrollY + 5 + "px";
    formatMenu.style.left = rect.left + window.scrollX + "px";

    // Предотвращаем всплытие, чтобы меню сразу не закрылось
    event.stopPropagation();
  });

  // Обработчики выбора формата
  formatMenu.querySelectorAll(".format-option").forEach((option) => {
    option.addEventListener("click", (event) => {
      const format = event.target.dataset.format;

      if (format === "png") {
        downloadHighQualityScreenshot();
      } else if (format === "pdf") {
        downloadPDF();
      }

      // Скрываем меню после выбора
      formatMenu.style.display = "none";
    });
  });

  // Закрываем меню при клике вне его
  document.addEventListener("click", (event) => {
    if (!formatMenu.contains(event.target) && event.target !== buttonExport) {
      formatMenu.style.display = "none";
    }
  });

  function downloadHighQualityScreenshot() {
    // Отключаем сетку (предполагается, что сетка имеет определенный класс или ID)
    editor.toggleGrid(false);
    editor.deselectAllWidgets();

    // Используем setTimeout, чтобы дать время на отключение сетки перед рендером
    setTimeout(() => {
      const image = app.renderer.extract.canvas(app.stage);
      const link = document.createElement("a");
      link.download = "project.png";
      link.href = image.toDataURL("image/png");
      link.click();

      // Включаем сетку обратно
      editor.toggleGrid(true);
    }, 50);
  }

  function downloadPDF() {
    // Отключаем сетку
    editor.toggleGrid(false);
    editor.deselectAllWidgets();

    setTimeout(() => {
      const canvas = app.renderer.extract.canvas(app.stage);

      // Создаем PDF
      const { jsPDF } = window.jspdf;

      // Определяем ориентацию на основе соотношения сторон
      const isLandscape = canvas.width > canvas.height;
      const pdf = new jsPDF({
        orientation: isLandscape ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });

      // Добавляем изображение в PDF
      pdf.addImage(
        canvas.toDataURL("image/png"),
        "PNG",
        0,
        0,
        canvas.width,
        canvas.height,
      );

      // Сохраняем PDF
      pdf.save("project.pdf");

      // Включаем сетку обратно
      editor.toggleGrid(true);
    }, 50);
  }

  function saveDraft() {
    const draftNameInput = document.getElementById("draft-name");
    const draftName = draftNameInput.value.trim();

    if (!draftName) {
      alert("Введите название черновика");
      return;
    }

    // Проверяем, существует ли уже черновик с таким именем
    let existingDraftKey = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("draft_")) {
        // Извлекаем имя из ключа (формат: draft_{name}%%{timestamp})
        const savedName = key.split("%%")[0].replace("draft_", "");
        if (savedName === draftName) {
          existingDraftKey = key;
          break;
        }
      }
    }

    // Если найден существующий черновик с таким же именем, удаляем его
    if (existingDraftKey) {
      localStorage.removeItem(existingDraftKey);
      console.log(`Удален старый черновик с именем "${draftName}"`);
    }

    const draftDate = Date.now();
    const exportData = editor.exportScene();

    localStorage.setItem(
      `draft_${draftName}%%${draftDate}`,
      JSON.stringify(exportData),
    );

    updateDraftList();
    alert(
      `Черновик "${draftName}" ${existingDraftKey ? "перезаписан" : "сохранен"}!`,
    );
  }

  function loadDraft(selectedDraft) {
    if (!selectedDraft) {
      alert("Выберите черновик для загрузки");
      return;
    }

    if (window.gradientBuilder?.cleanupAllBackgroundResources) {
      window.gradientBuilder.cleanupAllBackgroundResources();
    }

    const draftData = localStorage.getItem(selectedDraft);

    console.log("draft load", draftData);
    if (draftData) {
      try {
        editor.importScene(JSON.parse(draftData));
        alert("Черновик загружен!");
      } catch (e) {
        alert("Ошибка при загрузке черновика: " + e.message);
      }
    }
  }

  function generateSVGFromStage() {
    // Здесь нужно реализовать логику конвертации вашего Pixi stage в SVG
    // Это пример базовой структуры - вам нужно адаптировать под ваши данные

    const width = app.renderer.width;
    const height = app.renderer.height;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;

    // Добавляем фон
    svg += `<rect width="100%" height="100%" fill="white"/>`;

    // Рекурсивно обходим все дочерние элементы stage
    function processChildren(children) {
      children.forEach((child) => {
        if (child.visible === false) return;

        if (child.geometry) {
          // Если это графический примитив
          // Здесь нужно конвертировать Pixi графику в SVG
          // Это сложная задача - потребуется анализ каждого типа объектов
          // Для примера добавим прямоугольник:
          if (child.isSprite) {
            // Конвертация спрайтов
          } else if (child.isGraphics) {
            // Конвертация графики
          }
        }
      });
    }

    processChildren(app.stage.children);

    svg += "</svg>";

    // Пока возвращаем простой SVG с фоном
    // Вам нужно реализовать полную конвертацию в зависимости от ваших объектов
    return svg;
  }

  function renameDraft(oldKey) {
    // Получаем текущее имя черновика и дату из ключа
    const oldKeyParts = oldKey.replace("draft_", "").split("%%");
    const oldName = oldKeyParts[0];
    const oldDate = oldKeyParts[1] || Date.now();

    // Создаем модальное окно для ввода нового имени
    const modal = document.createElement("div");
    modal.className = "draft-rename-modal";
    modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  `;

    // Содержимое модального окна
    modal.innerHTML = `
    <div class="draft-rename-content" style="
      background: white;
      padding: 20px;
      border-radius: 8px;
      min-width: 300px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    ">
      <h3 style="margin-top: 0; margin-bottom: 15px;">Переименовать черновик</h3>
      <input type="text" id="new-draft-name" value="${oldName}" style="
        width: 100%;
        padding: 8px;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 4px;
        box-sizing: border-box;
      ">
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="cancel-rename" style="
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        ">Отмена</button>
        <button id="confirm-rename" style="
          padding: 8px 16px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        ">Переименовать</button>
      </div>
    </div>
  `;

    document.body.appendChild(modal);

    // Получаем элементы
    const newNameInput = document.getElementById("new-draft-name");
    const cancelBtn = document.getElementById("cancel-rename");
    const confirmBtn = document.getElementById("confirm-rename");

    // Фокус на поле ввода
    newNameInput.focus();
    newNameInput.select();

    // Обработчик отмены
    cancelBtn.addEventListener("click", () => {
      document.body.removeChild(modal);
    });

    // Обработчик подтверждения
    confirmBtn.addEventListener("click", () => {
      const newName = newNameInput.value.trim();

      if (!newName) {
        alert("Введите название черновика");
        return;
      }

      if (newName === oldName) {
        // Имя не изменилось - просто закрываем окно
        document.body.removeChild(modal);
        return;
      }

      const newKey = `draft_${newName}%%${oldDate}`; // Сохраняем старую дату

      // Проверяем, существует ли уже черновик с таким именем
      if (localStorage.getItem(newKey)) {
        alert("Черновик с таким именем уже существует");
        return;
      }

      // Получаем данные старого черновика
      const draftData = localStorage.getItem(oldKey);

      if (draftData) {
        // Сохраняем под новым именем
        localStorage.setItem(newKey, draftData);
        // Удаляем старый
        localStorage.removeItem(oldKey);
        // Обновляем список
        updateDraftList();
      }

      document.body.removeChild(modal);
    });

    // Закрытие по Escape
    document.addEventListener("keydown", function closeOnEscape(e) {
      if (e.key === "Escape") {
        document.body.removeChild(modal);
        document.removeEventListener("keydown", closeOnEscape);
      }
    });

    // Закрытие при клике вне модального окна
    modal.addEventListener("click", (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  function duplicateDraft(draftKey) {
    // Получаем данные исходного черновика
    const originalData = localStorage.getItem(draftKey);

    if (!originalData) {
      console.error("Черновик не найден:", draftKey);
      return;
    }

    // Извлекаем оригинальное имя из ключа
    const originalKeyParts = draftKey.replace("draft_", "").split("%%");
    const originalName = originalKeyParts[0];

    // Генерируем новое имя с префиксом "Копия" и рандомным числом
    const randomNum = Math.floor(Math.random() * 9000 + 1000); // число от 1000 до 9999
    const newName = `${originalName} (копия ${randomNum})`;
    const newDate = Date.now(); // Текущая дата для копии

    // Создаем новый ключ для черновика
    const newKey = `draft_${newName}%%${newDate}`;

    // Проверяем, не существует ли уже черновик с таким именем
    if (localStorage.getItem(newKey)) {
      // Если существует, генерируем другое число
      return duplicateDraft(draftKey); // Рекурсивно пробуем снова
    }

    // Сохраняем копию
    localStorage.setItem(newKey, originalData);

    // Обновляем список черновиков в интерфейсе
    updateDraftList();

    // Показываем уведомление
    alert(`Черновик дублирован как "${newName}"`);

    console.log("Черновик дублирован:", {
      original: originalName,
      copy: newName,
      key: newKey,
    });
  }

  function deleteDraft(selectedDraft) {
    if (!selectedDraft) {
      alert("Выберите черновик для удаления");
      return;
    }

    localStorage.removeItem(selectedDraft);
    updateDraftList();
    alert("Черновик удален!");
  }

  // Назначаем обработчики для кнопок черновиков
  document.getElementById("delete-all").addEventListener("click", () => {
    editor.deleteAll();
  });
  document.getElementById("delete-selected").addEventListener("click", () => {
    editor.deleteSelected();
  });
  // Вешаем обработчик только на контейнер редактора
  document.addEventListener("keydown", (event) => {
    if (event.key === "Delete") {
      event.preventDefault();
      editor.deleteSelected();
    }
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
    const gridSizeInput = document.getElementById("gridsize");
    const currentSize = Number(gridSizeInput.value);
    const newSize = Math.max(1, Math.floor(currentSize * 0.5));

    gridSizeInput.value = newSize;
    editor.setGridSize(newSize);
  });

  document.getElementById("scale2x").addEventListener("click", () => {
    const gridSizeInput = document.getElementById("gridsize");
    const currentSize = Number(gridSizeInput.value);
    const newSize = currentSize * 2;

    gridSizeInput.value = newSize;
    editor.setGridSize(newSize);
  });

  document.getElementById("resize-grid-apply").addEventListener("click", () => {
    const gridSizeInput = document.getElementById("gridsize");
    const currentSize = Number(gridSizeInput.value);
    gridSizeInput.value = currentSize;
    editor.setGridSize(currentSize);
  });

  document.getElementById("centerv").addEventListener("click", () => {
    editor.getSelected().map((elem) => elem.centerVertical());
  });
  document.getElementById("centerx").addEventListener("click", () => {
    editor.getSelected().map((elem) => elem.centerHorizontal());
  });
  document.getElementById("theme1").addEventListener("dblclick", () => {
    editor.importScene({
      background: {
        color: 1973790,
        alpha: 1,
        hasTexture: false,
        hasGradient: false,
        gradient: null,
      },
      grid: { size: 20, visible: true },
      display: { width: 1920, height: 540 },
      widgets: [
        {
          type: "XLseconds",
          widgetClass: "Container",
          x: 20,
          y: 20,
          size: { width: 500, height: 240 },
          texture: null,
          w: "DigitalClockWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "S",
          widgetClass: "Container",
          x: 540,
          y: 20,
          size: { width: 260, height: 120 },
          texture: null,
          w: "WeatherWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "logos",
          widgetClass: "Container",
          x: 20,
          y: 420,
          size: { width: 497.066650390625, height: 112.5249306986651 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "TRAFFICS",
          widgetClass: "Container",
          x: 820,
          y: 20,
          size: { width: 120, height: 120 },
          texture: null,
          w: "TrafficWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "XS",
          widgetClass: "Container",
          x: 20,
          y: 280,
          size: { width: 240.39999389648438, height: 112.38211096786871 },
          texture: null,
          w: "CalendarWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "USDEURM",
          widgetClass: "Container",
          x: 280,
          y: 280,
          size: { width: 232.933349609375, height: 108.89160652470783 },
          texture: null,
          w: "RatesWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          widgetClass: "Container",
          x: 540,
          y: 160,
          size: { width: 400.53338623046875, height: 372.933349609375 },
          texture: null,
          w: "NewsWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "SimpleRect",
          widgetClass: "Container",
          x: 960,
          y: 20,
          size: { width: 930.800048828125, height: 510.5830561011461 },
          texture: null,
          w: "SimpleRectWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
      ],
    });
  });

  document.getElementById("theme1").addEventListener("click", () => {
    editor.importScene({
      background: {
        color: 1973790,
        alpha: 1,
        hasTexture: false,
        hasGradient: false,
        gradient: null,
      },
      grid: { size: 20, visible: true },
      display: { width: 1920, height: 540 },
      widgets: [
        {
          type: "XLseconds",
          widgetClass: "Container",
          x: 20,
          y: 20,
          size: { width: 500, height: 240 },
          texture: null,
          w: "DigitalClockWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "S",
          widgetClass: "Container",
          x: 540,
          y: 20,
          size: { width: 260, height: 120 },
          texture: null,
          w: "WeatherWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "logos",
          widgetClass: "Container",
          x: 20,
          y: 420,
          size: { width: 497.066650390625, height: 112.5249306986651 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "TRAFFICS",
          widgetClass: "Container",
          x: 820,
          y: 20,
          size: { width: 120, height: 120 },
          texture: null,
          w: "TrafficWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "XS",
          widgetClass: "Container",
          x: 20,
          y: 280,
          size: { width: 240.39999389648438, height: 112.38211096786871 },
          texture: null,
          w: "CalendarWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "USDEURM",
          widgetClass: "Container",
          x: 280,
          y: 280,
          size: { width: 232.933349609375, height: 108.89160652470783 },
          texture: null,
          w: "RatesWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          widgetClass: "Container",
          x: 540,
          y: 160,
          size: { width: 400.53338623046875, height: 372.933349609375 },
          texture: null,
          w: "NewsWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
        {
          type: "SimpleRect",
          widgetClass: "Container",
          x: 960,
          y: 20,
          size: { width: 930.800048828125, height: 510.5830561011461 },
          texture: null,
          w: "SimpleRectWidget",
          bgColor: 1973790,
          bgAlpha: 1,
          cornerRadius: 32,
        },
      ],
    });
  });
  document.getElementById("theme2").addEventListener("dblclick", () => {
    editor.importScene({
      background: {
        color: 16777215,
        alpha: 1,
        hasTexture: true,
        texturePath: "2in",
        hasGradient: false,
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

  document.getElementById("theme2").addEventListener("click", () => {
    editor.importScene({
      background: {
        color: 16777215,
        alpha: 1,
        hasTexture: true,
        texturePath: "2in",
        hasGradient: false,
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
  document.getElementById("theme3").addEventListener("dblclick", () => {
    editor.importScene({
      background: {
        color: 16777215,
        alpha: 1,
        type: "texture",
        hasTexture: true,
        hasGradient: false,
        texturePath: "2in",
        hasAnimation: false,
        animation: null,
      },
      grid: { size: 10, visible: true },
      display: { width: 1080, height: 1920 },
      widgets: [
        {
          type: "XLseconds",
          widgetClass: "Container",
          x: 16,
          y: 16,
          size: { width: 696, height: 337 },
          texture: null,
          w: "DigitalClockWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "M",
          widgetClass: "Container",
          x: 727,
          y: 16,
          size: { width: 337, height: 337 },
          texture: null,
          w: "WeatherWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "M",
          widgetClass: "Container",
          x: 16,
          y: 368,
          size: { width: 699, height: 158 },
          texture: null,
          w: "CalendarWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "TRAFFICM",
          widgetClass: "Container",
          x: 727,
          y: 368,
          size: { width: 337, height: 158 },
          texture: null,
          w: "TrafficWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "USDM",
          widgetClass: "Container",
          x: 16,
          y: 541,
          size: { width: 338, height: 158 },
          texture: null,
          w: "RatesWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "EURM",
          widgetClass: "Container",
          x: 14.08105627882395,
          y: 715,
          size: { width: 338, height: 158 },
          texture: null,
          w: "RatesWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "info",
          widgetClass: "Container",
          x: 416,
          y: 1491,
          size: { width: 648, height: 217 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "logos",
          widgetClass: "Container",
          x: 416,
          y: 1723,
          size: { width: 648, height: 181 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          widgetClass: "Container",
          x: 369,
          y: 541,
          size: { width: 695, height: 332 },
          texture: null,
          w: "NewsWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "VideoWidget",
          widgetClass: "Container",
          x: 16,
          y: 888,
          size: { width: 1048, height: 588 },
          texture: null,
          w: "VideoWidget",
          bgColor: 0,
          bgAlpha: 0.4,
          cornerRadius: 16,
        },
        {
          type: "metal-L",
          widgetClass: "Container",
          x: 16.000000000000114,
          y: 1491,
          size: { width: 385, height: 415 },
          texture: null,
          w: "MetalsWidget",
          bgColor: 0,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
      ],
    });
  });

  document.getElementById("theme3").addEventListener("click", () => {
    editor.importScene({
      background: {
        color: 16777215,
        alpha: 1,
        type: "texture",
        hasTexture: true,
        hasGradient: false,
        texturePath: "2in",
        hasAnimation: false,
        animation: null,
      },
      grid: { size: 10, visible: true },
      display: { width: 1080, height: 1920 },
      widgets: [
        {
          type: "XLseconds",
          widgetClass: "Container",
          x: 16,
          y: 16,
          size: { width: 696, height: 337 },
          texture: null,
          w: "DigitalClockWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "M",
          widgetClass: "Container",
          x: 727,
          y: 16,
          size: { width: 337, height: 337 },
          texture: null,
          w: "WeatherWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "M",
          widgetClass: "Container",
          x: 16,
          y: 368,
          size: { width: 699, height: 158 },
          texture: null,
          w: "CalendarWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "TRAFFICM",
          widgetClass: "Container",
          x: 727,
          y: 368,
          size: { width: 337, height: 158 },
          texture: null,
          w: "TrafficWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "USDM",
          widgetClass: "Container",
          x: 16,
          y: 541,
          size: { width: 338, height: 158 },
          texture: null,
          w: "RatesWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "EURM",
          widgetClass: "Container",
          x: 14.08105627882395,
          y: 715,
          size: { width: 338, height: 158 },
          texture: null,
          w: "RatesWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "info",
          widgetClass: "Container",
          x: 416,
          y: 1491,
          size: { width: 648, height: 217 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "logos",
          widgetClass: "Container",
          x: 416,
          y: 1723,
          size: { width: 648, height: 181 },
          texture: null,
          w: "CompanyWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          widgetClass: "Container",
          x: 369,
          y: 541,
          size: { width: 695, height: 332 },
          texture: null,
          w: "NewsWidget",
          bgColor: 1973790,
          bgAlpha: 0.4,
          cornerRadius: 32,
        },
        {
          type: "VideoWidget",
          widgetClass: "Container",
          x: 16,
          y: 888,
          size: { width: 1048, height: 588 },
          texture: null,
          w: "VideoWidget",
          bgColor: 0,
          bgAlpha: 0.4,
          cornerRadius: 16,
        },
        {
          type: "metal-L",
          widgetClass: "Container",
          x: 16.000000000000114,
          y: 1491,
          size: { width: 385, height: 415 },
          texture: null,
          w: "MetalsWidget",
          bgColor: 0,
          bgAlpha: 0.4,
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
    .getElementById("grid-enabled")
    .addEventListener("change", function (e) {
      const gridEnabled = e.target.checked;

      // Применяем к выбранным виджетам
      editor.toggleGrid(gridEnabled);
    });

  document.getElementById("gridsize").addEventListener("change", function (e) {
    const count = e.target.value;

    // Применяем к выбранным виджетам
    editor.setGridSize(Number(count));
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
  // Обработчики смены ориентации с подтверждением
  document
    .getElementById("landscape-btn")
    .addEventListener("click", function (e) {
      const theme = editor.exportScene();
      console.log(theme);

      // Проверяем, есть ли виджеты
      const hasWidgets = theme.widgets && theme.widgets.length > 0;

      if (hasWidgets) {
        // Показываем предупреждение
        const userConfirmed = confirm(
          "Внимание! При смене ориентации все виджеты будут удалены.\n\n" +
            "Вы уверены, что хотите продолжить?\n\n" +
            "Текущие виджеты: " +
            theme.widgets.length,
        );

        if (!userConfirmed) {
          console.log("Смена ориентации отменена пользователем");
          return; // Отменяем смену ориентации
        }
      }

      // Если нет виджетов или пользователь подтвердил
      console.log("Переключение в альбомную ориентацию: 1920x540");
      editor.resize(1920, 540);
      document.getElementById("width").value = 1920;
      document.getElementById("height").value = 540;

      // Очищаем виджеты (создаем пустую сцену)
      setTimeout(() => {
        const emptyTheme = {
          ...theme,
          widgets: [],
          display: {
            ...theme.display,
            width: 1920,
            height: 540,
          },
        };
        editor.importScene(emptyTheme);
        console.log("Все виджеты удалены, ориентация изменена");
      }, 50);
    });
  // Более надежный вариант с classList для landscape-btn
  // Обработчик для landscape-btn
  document
    .getElementById("landscape-btn")
    .addEventListener("click", function () {
      const landscapeBtn = this;
      const portraitBtn = document.getElementById("portrait-btn");

      if (landscapeBtn.classList.contains("btn-primary")) {
        // Если уже активна, деактивируем обе
        landscapeBtn.classList.remove("btn-primary");
        portraitBtn.classList.remove("btn-primary");
        console.log("Ориентация сброшена");
      } else {
        // Активируем landscape, деактивируем portrait
        landscapeBtn.classList.add("btn-primary");
        portraitBtn.classList.remove("btn-primary");
        console.log("Установлена горизонтальная ориентация");
      }
    });

  // Обработчик для portrait-btn
  document
    .getElementById("portrait-btn")
    .addEventListener("click", function () {
      const portraitBtn = this;
      const landscapeBtn = document.getElementById("landscape-btn");

      if (portraitBtn.classList.contains("btn-primary")) {
        // Если уже активна, деактивируем обе
        portraitBtn.classList.remove("btn-primary");
        landscapeBtn.classList.remove("btn-primary");
        console.log("Ориентация сброшена");
      } else {
        // Активируем portrait, деактивируем landscape
        portraitBtn.classList.add("btn-primary");
        landscapeBtn.classList.remove("btn-primary");
        console.log("Установлена вертикальная ориентация");
      }
    });
  document
    .getElementById("portrait-btn")
    .addEventListener("click", function (e) {
      const theme = editor.exportScene();
      console.log(theme);

      // Проверяем, есть ли виджеты
      const hasWidgets = theme.widgets && theme.widgets.length > 0;

      if (hasWidgets) {
        // Показываем предупреждение
        const userConfirmed = confirm(
          "Внимание! При смене ориентации все виджеты будут удалены.\n\n" +
            "Вы уверены, что хотите продолжить?\n\n" +
            "Текущие виджеты: " +
            theme.widgets.length,
        );

        if (!userConfirmed) {
          console.log("Смена ориентации отменена пользователем");
          return; // Отменяем смену ориентации
        }
      }

      // Если нет виджетов или пользователь подтвердил
      console.log("Переключение в портретную ориентацию: 540x1920");
      editor.resize(540, 1920);
      document.getElementById("width").value = 540;
      document.getElementById("height").value = 1920;

      // Очищаем виджеты (создаем пустую сцену)
      setTimeout(() => {
        const emptyTheme = {
          ...theme,
          widgets: [],
          display: {
            ...theme.display,
            width: 540,
            height: 1920,
          },
        };
        editor.importScene(emptyTheme);
        console.log("Все виджеты удалены, ориентация изменена");
      }, 50);
    });

  // Опционально: добавляем визуальные улучшения для кнопок
  document.addEventListener("DOMContentLoaded", function () {
    const style = document.createElement("style");
    style.textContent = `
    #landscape-btn, #portrait-btn {
      position: relative;
      transition: all 0.2s ease;
    }
    
    #landscape-btn:hover::after, 
    #portrait-btn:hover::after {
      content: "⚠️ Виджеты будут удалены";
      position: absolute;
      top: -40px;
      left: 50%;
      transform: translateX(-50%);
      background: #ffcc00;
      color: #000;
      padding: 5px 10px;
      border-radius: 5px;
      font-size: 12px;
      white-space: nowrap;
      z-index: 1000;
      border: 1px solid #ff9900;
    }
    
    #landscape-btn:hover, #portrait-btn:hover {
      background-color: #fff3cd;
      border-color: #ffcc00;
    }
  `;
    document.head.appendChild(style);

    console.log("Система смены ориентации с подтверждением загружена");
  });
  // Простой инспектор виджетов для всех выбранных виджетов
  // RealTime Inspector - Полностью независимый инспектор виджетов
  // RealTimeInspector.js
  class RealTimeInspector {
    constructor(editor, app) {
      this.editor = editor;
      this.app = app;
      this.selectedWidgets = [];
      this.isInitialized = false;
      this.updateInterval = null;
      this.lastSelectionHash = "";
      this.isInspectorVisible = true;
      this.currentColorCallback = null;
      this.selectedColor = "#000000";
      this.currentColorWidget = null; // Добавляем ссылку на текущий виджет для цвета

      this.config = {
        updateFrequency: 100,
        maxWidgetsDisplay: 10,
        enableAutoRefresh: true,
        enableRealTimeUpdates: true,
      };

      this.setupEditorConnection();
      this.init();
    }

    // В методе showVideoStatistics добавить вызов методов виджета
    showVideoStatistics(widget) {
      // Проверяем доступность методов getStatistics и getPlaylistInfo
      if (!widget.getStatistics || !widget.getPlaylistInfo) {
        // Если методы не доступны напрямую, пытаемся получить их из свойств виджета
        if (widget.widget && widget.widget.getStatistics) {
          // Возможно, виджет обернут в контейнер
          const actualWidget = widget.widget;
          this._showStatisticsModal(actualWidget);
        } else if (widget.content && widget.content.getStatistics) {
          // Проверяем content контейнер
          const actualWidget = widget.content;
          this._showStatisticsModal(actualWidget);
        } else {
          console.warn("❌ Виджет не поддерживает получение статистики");
          alert("❌ Данный виджет не поддерживает получение статистики");
        }
        return;
      }

      this._showStatisticsModal(widget);
    }

    // Создаем отдельный метод для отображения модального окна
    async _showStatisticsModal(widget) {
      try {
        const stats = widget.getStatistics();
        const playlistInfo = widget.getPlaylistInfo();

        console.log("stats", playlistInfo);

        // Проверяем на наличие информации о соотношении сторон
        const aspectRatioInfo = widget.getAspectRatioInfo
          ? widget.getAspectRatioInfo()
          : {
              hasAspectRatio: false,
              message: "Информация о соотношении сторон недоступна",
            };

        // Создаем модальное окно
        const statsModal = document.createElement("div");
        statsModal.className = "custom-modal";
        statsModal.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 10000;
            `;

        const statsContent = document.createElement("div");
        statsContent.style.cssText = `
                background: var(--bg-primary);
                border-radius: var(--border-radius-lg);
                padding: 24px;
                width: 1000px;
                max-width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                border: 1px solid var(--border-secondary);
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            `;

        // Формируем HTML с учетом всех доступных данных
        let playlistHTML = "";
        if (
          playlistInfo.multiplexedPlaylist &&
          playlistInfo.multiplexedPlaylist.length > 0
        ) {
          playlistHTML = playlistInfo.multiplexedPlaylist
            .map(
              (item, index) => `
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                padding: 8px 12px;
                                background: ${index === playlistInfo.currentIndex ? "var(--accent-primary)" : "var(--bg-primary)"};
                                border-radius: 6px;
                                border-left: 4px solid ${item.type === "video" ? "#4CAF50" : "#2196F3"};
                                margin-bottom: 4px;
                            ">
                                <div style="font-size: 12px; color: ${index === playlistInfo.currentIndex ? "white" : "var(--text-secondary)"};">${index + 1}.</div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-size: 12px; color: ${index === playlistInfo.currentIndex ? "white" : "var(--text-primary)"}; font-weight: ${index === playlistInfo.currentIndex ? "600" : "400"}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${item.cleanPath || item.originalPath || "Неизвестный файл"}
                                    </div>
                                    <div style="font-size: 10px; color: ${index === playlistInfo.currentIndex ? "rgba(255,255,255,0.8)" : "var(--text-secondary)"}; display: flex; gap: 12px; flex-wrap: wrap;">
                                        <span>${item.type === "video" ? "🎥 Видео" : "🖼️ Изображение"}</span>
                                        ${item.repeatIndex ? `<span>Повтор: ${item.repeatIndex}/${item.totalRepeats}</span>` : ""}
                                        ${item.displayTime ? `<span>${item.displayTime}с</span>` : ""}
                                        ${item.playerNumber ? `<span>Плеер ${item.playerNumber}</span>` : ""}
                                        ${item.isParametrized ? `<span style="color: #FF9800;">Параметризован</span>` : ""}
                                        ${item.multiplexer && item.multiplexer > 1 ? `<span style="color: #9C27B0;">×${item.multiplexer}</span>` : ""}
                                    </div>
                                </div>
                                ${index === playlistInfo.currentIndex ? '<div style="font-size: 10px; background: rgba(255,255,255,0.2); padding: 2px 6px; border-radius: 4px; color: white;">▶️</div>' : ""}
                            </div>
                        `,
            )
            .join("");
        } else if (playlistInfo.playlist && playlistInfo.playlist.length > 0) {
          playlistHTML = playlistInfo.playlist
            .map(
              (item, index) => `
                            <div style="
                                display: flex;
                                align-items: center;
                                gap: 8px;
                                padding: 8px 12px;
                                background: ${index === playlistInfo.currentIndex ? "var(--accent-primary)" : "var(--bg-primary)"};
                                border-radius: 6px;
                                border-left: 4px solid ${item.type === "video" ? "#4CAF50" : "#2196F3"};
                                margin-bottom: 4px;
                            ">
                                <div style="font-size: 12px; color: var(--text-secondary);">${index + 1}.</div>
                                <div style="flex: 1; min-width: 0;">
                                    <div style="font-size: 12px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                                        ${item.cleanPath || item.originalPath || "Неизвестный файл"}
                                    </div>
                                    <div style="font-size: 10px; color: var(--text-secondary); display: flex; gap: 12px;">
                                        <span>${item.type === "video" ? "🎥 Видео" : "🖼️ Изображение"}</span>
                                    </div>
                                </div>
                            </div>
                        `,
            )
            .join("");
        } else {
          playlistHTML =
            '<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Плейлист пуст</div>';
        }

        // HTML для информации о соотношении сторон
        let aspectRatioHTML = "";
        if (aspectRatioInfo.hasAspectRatio) {
          const deviationPercent = aspectRatioInfo.deviation * 100;
          aspectRatioHTML = `
                    <div style="background: ${aspectRatioInfo.isStandard ? "var(--bg-tertiary)" : "#fff3cd"}; padding: 16px; border-radius: 8px; margin-bottom: 16px; border-left: 4px solid ${aspectRatioInfo.isStandard ? "#4CAF50" : "#ff9800"};">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Соотношение сторон</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Текущее:</span>
                                <span style="color: ${aspectRatioInfo.isStandard ? "#4CAF50" : "#ff9800"}; font-weight: 600;">${aspectRatioInfo.aspectRatio.toFixed(3)}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Ближайший стандарт:</span>
                                <span style="color: var(--text-primary); font-weight: 600;">${aspectRatioInfo.closestStandard} (${aspectRatioInfo.standardRatio.toFixed(3)})</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Отклонение:</span>
                                <span style="color: ${deviationPercent > 15 ? "#f44336" : "#ff9800"}; font-weight: 600;">${deviationPercent.toFixed(1)}%</span>
                            </div>
                            ${
                              !aspectRatioInfo.isStandard
                                ? `
                                    <div style="background: #ffebee; padding: 8px; border-radius: 4px; margin-top: 8px; border: 1px solid #ffcdd2;">
                                        <div style="font-size: 11px; color: #d32f2f; font-weight: 500;">⚠️ ${aspectRatioInfo.warning}</div>
                                    </div>
                                `
                                : `
                                    <div style="background: #e8f5e9; padding: 8px; border-radius: 4px; margin-top: 8px; border: 1px solid #c8e6c9;">
                                        <div style="font-size: 11px; color: #388e3c; font-weight: 500;">✓ ${aspectRatioInfo.warning}</div>
                                    </div>
                                `
                            }
                        </div>
                    </div>
                `;
        }

        const countTotalTimePlayer = (files, type) => {
          let totalSeconds = 0;
          let videoSeconds = 0;
          let imageSeconds = 0;
          if (type == "table") {
            const time = files?.multiplexer * files?.time_view;
            return time;
          } else {
            for (let i = 0; i < files?.length; i++) {
              if (files[i]?.type == "video") {
                totalSeconds += files[i]?.time_view * files[i]?.multiplexer;
                videoSeconds += files[i]?.time_view * files[i]?.multiplexer;

                console.log(
                  videoSeconds,
                  files[i]?.time_view,
                  files[i]?.multiplexer,
                );
              } else {
                totalSeconds += files[i]?.multiplexer * files[i]?.time_view;
              }
            }
            return {
              totalSeconds: totalSeconds,
              videoSeconds: videoSeconds,
              imageSeconds: imageSeconds,
            };
          }
        };
        let timers = countTotalTimePlayer(
          playlistInfo?.playlist?.filter(
            (item) => item?.player_number == stats.playerNumber,
          ),
          "total",
        );

        const totalTime = timers.totalSeconds;
        const videoTime = timers.videoSeconds;
        const imageTime = timers.imageSeconds;

        console.log("totalTime", totalTime);

        const percent = (videoTime / totalTime) * 100;
        const resolveMediaResolution = (item) =>
          new Promise((resolve) => {
            if (item?.resolution) return resolve(item.resolution);
            if (item?.width && item?.height) return resolve(`${item.width}×${item.height}`);
            if (item?.type !== "video" || !item?.url) return resolve("—");
            const video = document.createElement("video");
            const cleanup = () => {
              video.removeAttribute("src");
              video.load();
            };
            const timeout = setTimeout(() => {
              cleanup();
              resolve("—");
            }, 2500);
            video.preload = "metadata";
            video.muted = true;
            video.crossOrigin = "anonymous";
            video.addEventListener(
              "loadedmetadata",
              () => {
                clearTimeout(timeout);
                const result =
                  video.videoWidth && video.videoHeight
                    ? `${video.videoWidth}×${video.videoHeight}`
                    : "—";
                cleanup();
                resolve(result);
              },
              { once: true },
            );
            video.addEventListener(
              "error",
              () => {
                clearTimeout(timeout);
                cleanup();
                resolve("—");
              },
              { once: true },
            );
            video.src = widget._getReadyMediaUrl
              ? widget._getReadyMediaUrl(item.url)
              : item.url;
          });

        statsContent.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                    <h3 style="margin: 0; color: var(--accent-primary); font-size: 16px;">📊 Статистика плейлиста</h3>
                    <button id="close-stats-modal" style="
                        background: none;
                        border: none;
                        font-size: 24px;
                        cursor: pointer;
                        color: var(--text-secondary);
                        line-height: 1;
                    ">&times;</button>
                </div>
                
                <p style="margin: 0; color: white; font-size: 14px; font-weight: 500;">ОБЩАЯ СВОДКА</p>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 24px; margin-top:10px">

                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Цикл</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: center;">
                                <span style="color: var(--accent-primary); font-weight: 600; font-size: 18px;">${timers ? parseInt(totalTime) + " сек" : "Считаем..."} </span>
                            </div>
                        </div>
                  </div>

                   <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Материалов</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: center;">
                                <span style="color: var(--accent-primary); font-weight: 600; font-size: 18px;">${playlistInfo?.playlist?.filter((item) => item?.player_number == stats.playerNumber)?.length || 0}</span>
                            </div>
                        </div>
                  </div>

                  <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Баланс</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: center;">
                              <div style="display:flex; flex-direction:column">
                                <span style="color: var(--accent-primary); font-weight: 400; font-size: 16px;">Видео ${Number(percent).toFixed(0) || 0}%</span>
                                <span style="color: var(--accent-primary); font-weight: 400; font-size: 16px;">Изобр. ${Number(100 - percent).toFixed(0) || 0}%</span>
                              </div>
                                
                            </div>
                        </div>
                  </div>



                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; display: none;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Общая информация</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Проигрыватель:</span>
                                <span style="color: var(--accent-primary); font-weight: 600;">${stats.playerNumber || playlistInfo.playerNumber || "Не задан"}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Всего файлов:</span>
                                <span style="color: var(--text-primary); font-weight: 600;">${stats.totalFiles || 0}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Видео:</span>
                                <span style="color: #4CAF50; font-weight: 600;">${stats.totalVideos || 0}</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Изображения:</span>
                                <span style="color: #2196F3; font-weight: 600;">${stats.totalImages || 0}</span>
                            </div>
                            ${
                              stats.parametrizedFiles !== undefined
                                ? `
                                    <div style="display: none; justify-content: space-between;">
                                        <span style="color: var(--text-primary); font-size: 12px;">Параметризованных:</span>
                                        <span style="color: #FF9800; font-weight: 600;">${stats.parametrizedFiles}</span>
                                    </div>
                                `
                                : ""
                            }
                            ${
                              stats.filesForCurrentPlayer !== undefined
                                ? `
                                    <div style="display: none; justify-content: space-between;">
                                        <span style="color: var(--text-primary); font-size: 12px;">Для этого плеера:</span>
                                        <span style="color: #9C27B0; font-weight: 600;">${stats.filesForCurrentPlayer}</span>
                                    </div>
                                `
                                : ""
                            }
                            ${
                              stats.multiplexedItems !== undefined
                                ? `
                                    <div style="display: none; justify-content: space-between;">
                                        <span style="color: var(--text-primary); font-size: 12px;">Мультиплексировано:</span>
                                        <span style="color: #673AB7; font-weight: 600;">${stats.multiplexedItems}</span>
                                    </div>
                                `
                                : ""
                            }
                        </div>
                    </div>
                    
                    <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; display: none;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Текущее состояние</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Статус:</span>
                                <span style="color: ${playlistInfo.isPlaying ? "#4CAF50" : "#FF9800"}; font-weight: 600;">
                                    ${playlistInfo.isPlaying ? "▶️ Воспроизводится" : "⏸️ На паузе"}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Текущий элемент:</span>
                                <span style="color: var(--accent-primary); font-weight: 600;">${(playlistInfo.currentIndex || 0) + 1}/${playlistInfo.totalMedia || 0}</span>
                            </div>
                            ${
                              playlistInfo.currentRepeat
                                ? `
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: var(--text-primary); font-size: 12px;">Повтор файла:</span>
                                        <span style="color: var(--text-primary); font-weight: 600;">${playlistInfo.currentRepeat}/${playlistInfo.totalRepeats}</span>
                                    </div>
                                `
                                : ""
                            }
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Тип:</span>
                                <span style="color: ${playlistInfo.currentType === "video" ? "#4CAF50" : "#2196F3"}; font-weight: 600;">
                                    ${playlistInfo.currentType === "video" ? "🎥 Видео" : "🖼️ Изображение"}
                                </span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: var(--text-primary); font-size: 12px;">Ошибки:</span>
                                <span style="color: ${playlistInfo.hasError ? "#F44336" : "#4CAF50"}; font-weight: 600;">
                                    ${playlistInfo.hasError ? "❌ Есть" : "✅ Нет"}
                                </span>
                            </div>
                            ${
                              playlistInfo.panelId
                                ? `
                                    <div style="display: none; justify-content: space-between;">
                                        <span style="color: var(--text-primary); font-size: 12px;">ID панели:</span>
                                        <span style="color: var(--text-primary); font-weight: 600;">${playlistInfo.panelId}</span>
                                    </div>
                                `
                                : ""
                            }
                        </div>
                    </div>
              </div>
              
              <p style="margin: 0; color: white; font-size: 14px; font-weight: 500;">УПРАВЛЕНИЕ ВРЕМЕНЕМ ПОКАЗА</p>
                <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px; margin-bottom: 24px; margin-top: 10px">
                  <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; box-shadow: 0 4px 8px rgba(0,0,0,0.05); border-radius: 12px">
                    <thead style="color: white;">
                      <tr>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Файл</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Тип</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Разрешение</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Длит., сек</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Повт.</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px; width: max-content">В цикле, сек</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">%</th>
                      </tr>
                    </thead>
                    <tbody>
                    ${
                      playlistInfo?.playlist?.length > 0
                        ? (
                            await Promise.all(
                              playlistInfo.playlist
                                ?.filter(
                                  (item) =>
                                    stats.playerNumber == item?.player_number,
                                )
                                .map(async (item) => {
                                  const progressRed = Math.floor(
                                    Math.random() * 256,
                                  );
                                  const progressBlue = Math.floor(
                                    Math.random() * 256,
                                  );
                                  const progressColor = `rgba(${progressRed}, 220, ${progressBlue}, 1)`;
                                  const resolution = await resolveMediaResolution(item);
                                  return `
            <tr>
              <th title="${item?.url?.split("/")?.at(-1)}" scope="row" style="padding: 12px 16px; text-align: left; font-weight: 600; color: white; max-width: 150px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${item?.url?.split("/")?.at(-1)}</th>
              <td style="padding: 12px 16px; color: white;">${item?.type == "video" ? "Видео" : "Изображение"}</td>
              <td style="padding: 12px 16px; color: white;">${resolution}</td>
              <td style="padding: 12px 16px; color: white;">${item?.time_view}</td>
              <td style="padding: 12px 16px; color: white;">${item?.multiplexer}</td>
              <td style="padding: 12px 16px; color: white; ">${item?.time_view * item?.multiplexer}</td>
              <td style="padding: 12px 16px; color: white; text-align: right;">
                <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 20px; border-radius: 6px; background: rgba(0, 0, 0, 0.2); position: relative; overflow: hidden;">
                  <div style="height: 100%; width: ${Number(((item?.time_view * item?.multiplexer) / totalTime) * 100).toFixed(0)}%; background: ${progressColor}; border-radius: 4px; transition: width 0.3s ease; position: absolute; z-index: 1"></div>
                  <p style="color: white; position: absolute; z-index: 2; right: 10px; margin: 0; white-space: nowrap;">${Number(((item?.time_view * item?.multiplexer) / totalTime) * 100).toFixed(0)}%</p>
                </div>
              </td>
            </tr>
          `;
                                }),
                            )
                          ).join("")
                        : ""
                    }
                    </tbody>
                  </table>
                </div>

                <p style="margin: 0; color: white; font-size: 14px; font-weight: 500;">ПОСЛЕДОВАТЕЛЬНОСТЬ ПОКАЗА</p>
                

                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 24px; margin-top: 10px">
                    ${
                      playlistInfo?.multiplexedPlaylist?.length > 0
                        ? playlistInfo?.multiplexedPlaylist
                            ?.map(
                              (
                                item,
                                index,
                                array,
                              ) => `<div style="display: flex; gap: 10px; align-items: center;">
                      <div style="display: flex; gap: 5px; width: 100px; height: 30px; background: var(--bg-tertiary); border-radius: 5px; justify-content: flex-start; padding: 10px; align-items: center;">
                        <p title="${item?.url?.split("/")?.at(-1)}" style="color: white; white-space: nowrap; overflow: hidden; word-break: break-word; text-overflow: ellipsis;">${item?.url?.split("/")?.at(-1)}</p>
                    </div>
                    ${index != array?.length - 1 ? `<p style="color: white; font-size: 16px;">-></p>` : ""}
                      
                      </div>`,
                            )
                            .join("")
                        : ""
                    }
                </div>
                
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="refresh-stats" class="btn-modern" style="padding: 8px 16px; display: none">🔄 Обновить</button>
                    ${widget.hideAspectRatioWarning ? '<button id="hide-aspect-warning" class="btn-modern" style="padding: 8px 16px; display: none;">⚠️ Скрыть предупреждение</button>' : ""}
                    <button id="close-stats-btn" class="btn-modern btn-primary" style="padding: 8px 16px;">Закрыть</button>
                </div>
            `;

        statsModal.appendChild(statsContent);
        document.body.appendChild(statsModal);

        // Закрытие модального окна
        const closeModal = () => {
          statsModal.remove();
        };

        statsModal
          .querySelector("#close-stats-modal")
          ?.addEventListener("click", closeModal);
        statsModal
          .querySelector("#close-stats-btn")
          ?.addEventListener("click", closeModal);
        statsModal.addEventListener("click", (e) => {
          if (e.target === statsModal) {
            closeModal();
          }
        });

        // Обновление статистики
        statsModal
          .querySelector("#refresh-stats")
          ?.addEventListener("click", () => {
            closeModal();
            setTimeout(() => this.showVideoStatistics(widget), 100);
          });

        // Кнопка скрытия предупреждения о соотношении сторон
        const hideAspectWarningBtn = statsModal.querySelector(
          "#hide-aspect-warning",
        );
        if (hideAspectWarningBtn && widget.hideAspectRatioWarning) {
          hideAspectWarningBtn.addEventListener("click", () => {
            widget.hideAspectRatioWarning();
            closeModal();
          });
        }

        // Закрытие по Escape
        document.addEventListener("keydown", function closeOnEscape(e) {
          if (e.key === "Escape") {
            closeModal();
            document.removeEventListener("keydown", closeOnEscape);
          }
        });
      } catch (error) {
        console.error("Ошибка при получении статистики:", error);
        alert(`Ошибка при получении статистики: ${error.message}`);
      }
    }

    async setupEditorConnection() {
      await loadBackgroundTextures();
      // Сохраняем оригинальные методы редактора
      this.originalSelectWidget = this.editor.selectWidget?.bind(this.editor);
      this.originalDeselectAll = this.editor.deselectAll?.bind(this.editor);
      this.originalAddToSelection = this.editor.addToSelection?.bind(
        this.editor,
      );
      this.originalSelectMultiple = this.editor.selectMultiple?.bind(
        this.editor,
      );

      // Перехватываем методы редактора для синхронизации с инспектором
      if (this.originalSelectWidget) {
        this.editor.selectWidget = (widget) => {
          const result = this.originalSelectWidget(widget);
          this.onSelectionChanged([widget]);
          return result;
        };
      }

      if (this.originalDeselectAll) {
        this.editor.deselectAll = () => {
          const result = this.originalDeselectAll();
          this.onSelectionChanged([]);
          return result;
        };
      }

      if (this.originalAddToSelection) {
        this.editor.addToSelection = (widget) => {
          const result = this.originalAddToSelection(widget);
          this.updateSelectedWidgets();
          return result;
        };
      }

      if (this.originalSelectMultiple) {
        this.editor.selectMultiple = (widgets) => {
          const result = this.originalSelectMultiple(widgets);
          this.onSelectionChanged(widgets);
          return result;
        };
      }

      console.log("🔗 Инспектор подключен к редактору");
    }

    init() {
      console.log("🛠️ Инициализация RealTime Inspector...");

      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () =>
          this.setupInspector(),
        );
      } else {
        this.setupInspector();
      }
    }

    setupInspector() {
      this.createInspectorUI();
      this.setupEventListeners();
      this.startAutoUpdate();
      this.isInitialized = true;

      console.log("✅ RealTime Inspector готов к работе");
    }

    createInspectorUI() {
      const inspectorPanel = document.getElementById("inspector-panel");
      if (!inspectorPanel) {
        console.error("❌ Не найден inspector-panel");
        return;
      }

      const panelContent = inspectorPanel.querySelector(".panel-content");
      if (!panelContent) {
        console.error("❌ Не найден panel-content");
        return;
      }

      this.originalContent = panelContent.innerHTML;

      const dynamicContainer = document.createElement("div");
      dynamicContainer.id = "inspector-dynamic-content";
      dynamicContainer.style.cssText = `
            height: 100%;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        `;

      panelContent.innerHTML = "";
      panelContent.appendChild(dynamicContainer);

      this.createControlPanel(dynamicContainer);
      this.createMainContent(dynamicContainer);
      this.createColorPickerModal();

      this.updateInspectorUI();
    }

    createColorPickerModal() {
      if (document.getElementById("inspector-color-picker-modal")) {
        return;
      }

      const modal = document.createElement("div");
      modal.id = "inspector-color-picker-modal";
      modal.className = "custom-modal";
      modal.style.display = "none";

      modal.innerHTML = `
            <div class="custom-modal-content" style="width: 320px">
                <div class="custom-modal-header">
                    <h5>Выбор цвета</h5>
                    <button type="button" class="custom-modal-close">&times;</button>
                </div>
                <div class="custom-modal-body">
                    <div class="form-group">
                        <label class="form-label">Палитра цветов</label>
                        <div id="inspector-color-palette" style="
                            display: grid;
                            grid-template-columns: repeat(8, 1fr);
                            gap: 6px;
                            margin-bottom: 16px;
                        "></div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Пользовательский цвет</label>
                        <div style="display: flex; gap: 8px">
                            <input
                                type="text"
                                id="inspector-custom-color-input"
                                placeholder="#000000"
                                class="form-input"
                                style="flex: 1"
                            />
                            <button id="inspector-apply-custom-color" class="btn-modern">
                                Применить
                            </button>
                        </div>
                    </div>

                    <div class="form-group">
                        <label class="form-label">Предпросмотр</label>
                        <div
                            id="inspector-color-preview"
                            style="
                                width: 100%;
                                height: 60px;
                                border-radius: var(--border-radius-sm);
                                border: 1px solid var(--border-secondary);
                                background-color: #000000;
                            "
                        ></div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px">
                        <button id="inspector-confirm-color" class="btn-modern btn-primary">
                            Сохранить
                        </button>
                        <button id="inspector-cancel-color" class="btn-modern">Отмена</button>
                    </div>
                </div>
            </div>
        `;

      document.body.appendChild(modal);
      this.setupColorPickerModal();
    }

    setupColorPickerModal() {
      const modal = document.getElementById("inspector-color-picker-modal");
      const closeBtn = modal.querySelector(".custom-modal-close");
      const cancelBtn = document.getElementById("inspector-cancel-color");
      const confirmBtn = document.getElementById("inspector-confirm-color");
      const customColorBtn = document.getElementById(
        "inspector-apply-custom-color",
      );
      const customColorInput = document.getElementById(
        "inspector-custom-color-input",
      );
      const colorPreview = document.getElementById("inspector-color-preview");

      const colorPalette = [
        "#000000",
        "#333333",
        "#666666",
        "#999999",
        "#cccccc",
        "#ffffff",
        "#ff0000",
        "#ff6600",
        "#ffcc00",
        "#ffff00",
        "#ccff00",
        "#00ff00",
        "#00ffcc",
        "#00ffff",
        "#0066ff",
        "#0000ff",
        "#6600ff",
        "#cc00ff",
        "#ff00cc",
        "#ff0066",
        "#ff3333",
        "#ff9933",
        "#ffff33",
        "#99ff33",
        "#33ff33",
        "#33ffcc",
        "#33ffff",
        "#3399ff",
        "#3333ff",
        "#9933ff",
        "#ff33ff",
        "#ff3399",
        "#1e1e1e",
        "#2d2d2d",
        "#3d3d3d",
        "#4d4d4d",
      ];

      const paletteContainer = document.getElementById(
        "inspector-color-palette",
      );
      paletteContainer.innerHTML = "";

      colorPalette.forEach((color) => {
        const swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.backgroundColor = color;
        swatch.setAttribute("data-color", color);
        swatch.addEventListener("click", () => {
          this.selectColorInPicker(color);
        });
        paletteContainer.appendChild(swatch);
      });

      const closeModal = () => {
        modal.style.display = "none";
        this.currentColorCallback = null;
        this.currentColorWidget = null;
      };

      closeBtn.addEventListener("click", closeModal);
      cancelBtn.addEventListener("click", closeModal);

      customColorBtn.addEventListener("click", () => {
        const color = customColorInput.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          this.selectColorInPicker(color);
        } else {
          alert("Пожалуйста, введите корректный HEX-цвет (например, #ff0000)");
        }
      });

      // ИСПРАВЛЕНО: теперь кнопка называется "Сохранить" и сразу применяет цвет к виджету
      confirmBtn.addEventListener("click", () => {
        if (this.currentColorCallback && this.selectedColor) {
          // Вызываем колбэк с выбранным цветом
          this.currentColorCallback(this.selectedColor);

          // Принудительно обновляем UI инспектора
          setTimeout(() => {
            this.forceRefresh();
          }, 50);
        }
        closeModal();
      });

      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          closeModal();
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.style.display === "block") {
          closeModal();
        }
      });
    }

    // Новый метод для прямого применения цвета к виджету
    applyBorderSetting(widget, property, value) {
      const targets = [widget, widget?.originalWidget].filter(Boolean);
      targets.forEach((target) => {
        if (property === "color") {
          if (target.setBorderColor) target.setBorderColor(value);
          target._borderColor = value;
          if (target.options) target.options.borderColor = value;
        } else if (property === "width") {
          const width = Math.max(0, Math.min(48, Number(value) || 0));
          if (target.setBorderWidth) target.setBorderWidth(width);
          target._borderWidth = width;
          if (target.options) target.options.borderWidth = width;
        } else if (property === "alpha") {
          const alpha = Math.max(0, Math.min(1, Number(value)));
          if (target.setBorderAlpha) target.setBorderAlpha(alpha);
          target._borderAlpha = Number.isFinite(alpha) ? alpha : 0;
          if (target.options) target.options.borderAlpha = Number.isFinite(alpha) ? alpha : 0;
        }
        target._redrawBackground?.();
        target.redraw?.();
        target.updateSelection?.();
      });
    }

    applyColorToWidget(widget, colorHex) {
      if (!widget) return;

      try {
        const color = this.hexToRgb(colorHex);
        if (color === null) return;

        const actualWidget = widget.originalWidget || widget;

        if (actualWidget.setBackgroundColor) {
          actualWidget.setBackgroundColor(color);
        } else if (actualWidget.setColor) {
          actualWidget.setColor(color);
        } else if (actualWidget.backgroundColor !== undefined) {
          actualWidget.backgroundColor = color;
        } else if (actualWidget.options?.backgroundColor !== undefined) {
          actualWidget.options.backgroundColor = color;
        } else if (actualWidget._backgroundColor !== undefined) {
          actualWidget._backgroundColor = color;
        }

        if (actualWidget.updateSelection) {
          actualWidget.updateSelection();
        }
      } catch (error) {
        console.warn("Ошибка применения цвета к виджету:", error);
      }
    }

    selectColorInPicker(color) {
      this.selectedColor = color;
      const colorPreview = document.getElementById("inspector-color-preview");
      const customColorInput = document.getElementById(
        "inspector-custom-color-input",
      );

      if (colorPreview) {
        colorPreview.style.backgroundColor = color;
      }
      if (customColorInput) {
        customColorInput.value = color;
      }

      document
        .querySelectorAll("#inspector-color-palette .color-swatch")
        .forEach((swatch) => {
          swatch.classList.remove("active");
          if (swatch.getAttribute("data-color") === color) {
            swatch.classList.add("active");
          }
        });
    }

    // ИСПРАВЛЕНО: теперь сохраняем ссылку на виджет при открытии палитры
    openColorPicker(currentColor, onChange, widget = null) {
      this.currentColorCallback = onChange;
      this.currentColorWidget =
        widget ||
        (this.selectedWidgets.length === 1 ? this.selectedWidgets[0] : null);
      this.selectedColor = this.rgbToHex(currentColor);

      const modal = document.getElementById("inspector-color-picker-modal");
      const colorPreview = document.getElementById("inspector-color-preview");
      const customColorInput = document.getElementById(
        "inspector-custom-color-input",
      );

      if (colorPreview) {
        colorPreview.style.backgroundColor = this.selectedColor;
      }
      if (customColorInput) {
        customColorInput.value = this.selectedColor;
      }

      document
        .querySelectorAll("#inspector-color-palette .color-swatch")
        .forEach((swatch) => {
          swatch.classList.remove("active");
          if (swatch.getAttribute("data-color") === this.selectedColor) {
            swatch.classList.add("active");
          }
        });

      if (modal) {
        modal.style.display = "block";
      }
    }

    createControlPanel(container) {
      const controlPanel = document.createElement("div");
      controlPanel.style.cssText = `
            padding: 12px 16px;
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;
        `;

      controlPanel.innerHTML = `
            <div style="display: flex; align-items: center; gap: 8px;">
                <div style="font-weight: 600; color: var(--accent-primary); font-size: 14px;">
                    <span id="selection-count">Не выбрано</span>
                </div>
                <div id="selection-info" style="font-size: 11px; color: var(--text-secondary); display: none;">
                    • <span id="selected-type">Тип</span>
                </div>
            </div>
            <div style="display: flex; gap: 6px;">
                <button id="inspector-refresh" class="btn-modern" style="padding: 4px 8px; font-size: 12px;" title="Обновить">
                    🔄
                </button>
                <button id="inspector-auto-refresh" class="btn-modern active" style="padding: 4px 8px; font-size: 12px;" title="Автообновление">
                    ⚡
                </button>
                <button id="inspector-clear" class="btn-modern" style="padding: 4px 8px; font-size: 12px;" title="Очистить выделение">
                    ✕
                </button>
            </div>
        `;

      container.appendChild(controlPanel);
    }

    createMainContent(container) {
      const mainContent = document.createElement("div");
      mainContent.id = "inspector-main-content";
      mainContent.style.cssText = `
            flex: 1;
            padding: 0;
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        `;

      this.noSelectionContent = this.createNoSelectionContent();
      mainContent.appendChild(this.noSelectionContent);

      this.selectionContent = document.createElement("div");
      this.selectionContent.id = "inspector-selection-content";
      this.selectionContent.style.display = "none";
      mainContent.appendChild(this.selectionContent);

      container.appendChild(mainContent);
    }

    createNoSelectionContent() {
      const container = document.createElement("div");
      container.id = "inspector-no-selection";
      container.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: var(--text-secondary);
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
        `;

      container.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">🎯</div>
            <h3 style="margin: 0 0 8px 0; color: var(--text-primary); font-weight: 500;">Не выбрано виджетов</h3>
            <p style="margin: 0; font-size: 13px; line-height: 1.4; color: var(--text-secondary); max-width: 250px;">
                Выберите виджеты на холсте для просмотра и редактирования их свойств
            </p>
            <div style="margin-top: 24px; display: flex; flex-direction: column; gap: 8px; width: 200px;">
                <button id="select-all-widgets" class="btn-modern" style="width: 100%; display: none;">
                    Выбрать все
                </button>
                <button id="deselect-all" class="btn-modern" style="width: 100%; background: var(--bg-tertiary); display: none;">
                    Снять выделение
                </button>
            </div>
            <div style="margin-top: 20px; padding: 12px; background: var(--bg-tertiary); border-radius: 8px; font-size: 12px; max-width: 250px;">
                <div style="color: var(--accent-primary); font-weight: 500; margin-bottom: 4px;">💡 Подсказка</div>
                <div style="color: var(--text-secondary);">Это окно инспектора свойств, вы сможете с ним взаимодействовать, когда разместите хотя бы один виджет на холсте</div>
            </div>
        `;

      return container;
    }

    setupEventListeners() {
      // Кнопки управления инспектором
      document
        .getElementById("inspector-refresh")
        ?.addEventListener("click", () => {
          this.forceRefresh();
        });

      document
        .getElementById("inspector-auto-refresh")
        ?.addEventListener("click", (e) => {
          this.toggleAutoRefresh(e.target);
        });

      document
        .getElementById("inspector-clear")
        ?.addEventListener("click", () => {
          this.deselectAll();
        });

      document
        .getElementById("select-all-widgets")
        ?.addEventListener("click", () => {
          this.selectAllWidgets();
        });

      document.getElementById("deselect-all")?.addEventListener("click", () => {
        this.deselectAll();
      });

      this.setupGlobalListeners();
      console.log("📡 Слушатели событий инициализированы");
    }

    setupGlobalListeners() {
      document.addEventListener("click", (e) => {
        if (this.isCanvasEvent(e)) {
          setTimeout(() => this.detectSelectionChange(), 50);
        }
      });

      document.addEventListener("keydown", (e) => {
        if (e.key === "Delete" || e.key === "Escape" || e.key === "Backspace") {
          setTimeout(() => this.detectSelectionChange(), 50);
        }
      });

      window.addEventListener("resize", () => {
        this.detectSelectionChange();
      });

      const observer = new MutationObserver(() => {
        this.detectSelectionChange();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
      });
    }

    isCanvasEvent(e) {
      const canvas = document.getElementById("pixi-container");
      return canvas && (canvas.contains(e.target) || e.target === canvas);
    }

    startAutoUpdate() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
      }

      if (this.config.enableAutoRefresh) {
        this.updateInterval = setInterval(() => {
          this.detectSelectionChange();
        }, this.config.updateFrequency);
      }
    }

    stopAutoUpdate() {
      if (this.updateInterval) {
        clearInterval(this.updateInterval);
        this.updateInterval = null;
      }
    }

    toggleAutoRefresh(button) {
      this.config.enableAutoRefresh = !this.config.enableAutoRefresh;

      if (this.config.enableAutoRefresh) {
        button.classList.add("active");
        button.title = "Автообновление включено";
        this.startAutoUpdate();
      } else {
        button.classList.remove("active");
        button.title = "Автообновление выключено";
        this.stopAutoUpdate();
      }
    }

    detectSelectionChange() {
      if (!this.isInitialized || !this.isInspectorVisible) return;

      const currentSelection = this.getCurrentSelection();
      const currentHash = this.getSelectionHash(currentSelection);

      if (currentHash !== this.lastSelectionHash) {
        this.lastSelectionHash = currentHash;
        this.selectedWidgets = currentSelection;
        this.updateInspectorUI();
      }
    }

    getCurrentSelection() {
      let selection = [];

      // Пытаемся получить выделение через метод редактора
      if (this.editor && typeof this.editor.getSelected === "function") {
        try {
          const editorSelection = this.editor.getSelected();
          if (Array.isArray(editorSelection)) {
            selection = editorSelection.filter(
              (widget) => widget != null && typeof widget === "object",
            );
          }
        } catch (e) {
          console.warn(
            "Не удалось получить выбор через editor.getSelected():",
            e,
          );
        }
      }

      // Если метод редактора не вернул ничего, ищем виджеты с isSelected
      if (selection.length === 0 && this.editor && this.editor.children) {
        try {
          selection = Array.from(this.editor.children).filter(
            (child) => child && child.isSelected === true,
          );
        } catch (e) {
          console.warn("Не удалось найти виджеты с isSelected:", e);
        }
      }

      // Глубокая проверка для VideoWidget
      selection = selection.map((widget) => {
        // Рекурсивно ищем VideoWidget в виджете
        const findVideoWidget = (obj) => {
          if (!obj || typeof obj !== "object") return null;

          // Если это VideoWidget
          if (obj.constructor && obj.constructor.name === "VideoWidget") {
            return obj;
          }

          // Проверяем свойства объекта
          for (const key in obj) {
            if (key === "widget" || key === "content" || key === "children") {
              const result = findVideoWidget(obj[key]);
              if (result) return result;
            }
          }

          return null;
        };

        const videoWidget = findVideoWidget(widget);
        if (videoWidget) {
          // Сохраняем ссылку на родительский виджет
          videoWidget.parentWidget = widget;
          return videoWidget;
        }

        return widget;
      });

      // Ограничиваем количество отображаемых виджетов
      if (selection.length > this.config.maxWidgetsDisplay) {
        selection = selection.slice(0, this.config.maxWidgetsDisplay);
      }

      return selection;
    }

    getSelectionHash(selection) {
      if (!selection || selection.length === 0) return "empty";

      return selection
        .map((widget) => {
          const type = widget.constructor?.name || "Unknown";
          const position = `${Math.round(widget.x || 0)}_${Math.round(widget.y || 0)}`;
          const size = `${Math.round(this.getWidgetWidth(widget))}_${Math.round(this.getWidgetHeight(widget))}`;
          return `${type}_${position}_${size}`;
        })
        .join("|");
    }

    // Добавьте этот метод в класс RealTimeInspector (например, после getSelectionHash)
    debugVideoWidget(widget) {
      console.log("=== ДЕБАГ VideoWidget ===");
      console.log("Тип виджета:", widget.constructor.name);
      console.log("Имеет getStatistics?:", typeof widget.getStatistics);
      console.log("Имеет getPlaylistInfo?:", typeof widget.getPlaylistInfo);

      // Проверяем свойства
      console.log("Свойства виджета:");
      const properties = [
        "_playerNumber",
        "_panelId",
        "_playlist",
        "isPlaying",
        "_hasError",
      ];
      properties.forEach((prop) => {
        console.log(
          `  ${prop}:`,
          widget[prop] !== undefined ? widget[prop] : "не определено",
        );
      });

      // Пробуем вызвать методы
      if (widget.getStatistics) {
        try {
          const stats = widget.getStatistics();
          console.log("getStatistics() результат:", stats);
        } catch (e) {
          console.error("Ошибка getStatistics:", e);
        }
      }

      if (widget.getPlaylistInfo) {
        try {
          const playlist = widget.getPlaylistInfo();
          console.log("getPlaylistInfo() результат:", playlist);
        } catch (e) {
          console.error("Ошибка getPlaylistInfo:", e);
        }
      }

      // Проверяем вложенность виджета
      console.log("widget.widget?", widget.widget);
      console.log("widget.content?", widget.content);
      console.log("widget.children?", widget.children);
    }

    updateInspectorUI() {
      const selectionCount = document.getElementById("selection-count");
      const selectionInfo = document.getElementById("selection-info");
      const selectedType = document.getElementById("selected-type");
      const noSelectionContent = document.getElementById(
        "inspector-no-selection",
      );
      const selectionContent = document.getElementById(
        "inspector-selection-content",
      );

      if (!selectionCount || !noSelectionContent || !selectionContent) return;

      if (this.selectedWidgets.length === 0) {
        selectionCount.textContent = "Не выбрано";
        selectionInfo.style.display = "none";
        noSelectionContent.style.display = "flex";
        selectionContent.style.display = "none";

        // Показываем кнопки управления виджетами если они есть
        const selectAllBtn = document.getElementById("select-all-widgets");
        const deselectAllBtn = document.getElementById("deselect-all");
        if (
          this.editor &&
          this.editor.children &&
          this.editor.children.length > 0
        ) {
          if (selectAllBtn) selectAllBtn.style.display = "block";
          if (deselectAllBtn) deselectAllBtn.style.display = "block";
        } else {
          if (selectAllBtn) selectAllBtn.style.display = "none";
          if (deselectAllBtn) deselectAllBtn.style.display = "none";
        }
      } else {
        selectionCount.textContent = `Выбрано: ${this.selectedWidgets.length}`;

        if (this.selectedWidgets.length === 1) {
          const widget = this.selectedWidgets[0];
          selectedType.textContent = this.getWidgetTypeName(widget);
          selectionInfo.style.display = "inline";
        } else {
          selectionInfo.style.display = "none";
        }

        noSelectionContent.style.display = "none";
        selectionContent.style.display = "block";
        this.renderSelectionContent();
      }
    }

    renderSelectionContent() {
      const selectionContent = document.getElementById(
        "inspector-selection-content",
      );
      if (!selectionContent) return;

      selectionContent.innerHTML = "";

      if (this.selectedWidgets.length === 1) {
        this.renderSingleWidget(selectionContent, this.selectedWidgets[0]);
      } else {
        this.renderMultipleWidgets(selectionContent, this.selectedWidgets);
      }
    }

    // В классе RealTimeInspector, найдите метод renderSingleWidget и измените его

    renderSingleWidget(container, widget) {
      // Проверяем, есть ли уже созданный контент для этого виджета
      let widgetInfo = container.querySelector(
        `[data-widget-id="${widget.id || widget._id}"]`,
      );

      if (widgetInfo) {
        // Обновляем только данные, не пересоздавая всю структуру
        this.updateWidgetContent(widgetInfo, widget);
      } else {
        // Создаем новую структуру
        widgetInfo = document.createElement("div");
        widgetInfo.style.cssText = `padding: 16px;`;
        widgetInfo.setAttribute(
          "data-widget-id",
          widget.id || widget._id || Date.now(),
        );

        this.buildWidgetContent(widgetInfo, widget);
        container.appendChild(widgetInfo);
      }
    }

    buildWidgetContent(widgetInfo, widget) {
      // Заголовок с информацией о виджете
      const header = document.createElement("div");
      header.style.cssText = `
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--border-secondary);
  `;

      const typeIcon = document.createElement("div");
      typeIcon.style.cssText = `
    width: 32px;
    height: 32px;
    background: var(--accent-gradient);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
  `;
      typeIcon.textContent = "📦";

      const typeInfo = document.createElement("div");
      typeInfo.innerHTML = `
    <div style="font-weight: 600; color: var(--text-primary);">${this.getWidgetTypeName(widget)}</div>
    <div style="font-size: 11px; color: var(--text-secondary);">${widget.constructor.name}</div>
  `;

      header.appendChild(typeIcon);
      header.appendChild(typeInfo);
      widgetInfo.appendChild(header);

      // Основные свойства
      const propertiesSection = this.createPropertiesSection(widget);
      widgetInfo.appendChild(propertiesSection);

      // Специальные секции для конкретных типов виджетов
      if (widget.constructor.name === "TextWidget") {
        const textSection = this.createTextWidgetSection(widget);
        widgetInfo.appendChild(textSection);
      } else if (widget.constructor.name === "VideoWidget") {
        const videoSection = this.createVideoWidgetSection(widget);
        widgetInfo.appendChild(videoSection);
        // Сохраняем ссылку на секцию для обновления
        widgetInfo.videoSection = videoSection;
      } else if (
        widget.constructor.name === "AudioPlayerWidget" ||
        widget.type === "AudioPlayerWidget"
      ) {
        widgetInfo.appendChild(this.createAudioPlayerSection(widget));
      } else if (
        widget.constructor.name === "AnalogClockWidget" ||
        widget.type === "analog-custom"
      ) {
        widgetInfo.appendChild(this.createAnalogClockSection(widget));
      } else if (widget.constructor.name === "CompanyWidget") {
        widgetInfo.appendChild(this.createCompanySection(widget));
      }

      if (
        widget.constructor.name !== "ShapeWidget" &&
        widget.constructor.name !== "DrawingWidget" &&
        widget.constructor.name !== "TextWidget"
      ) {
        widgetInfo.appendChild(this.createUniversalFontSection(widget));
      }

      if (
        widget.constructor.name !== "TextWidget" &&
        typeof widget.setTextColor === "function"
      ) {
        widgetInfo.appendChild(this.createUniversalTextColorSection(widget));
      }

      if (widget.constructor.name === "DrawingWidget") {
        widgetInfo.appendChild(this.createDrawingSection(widget));
      }

      const transformSection = this.createTransformSection(widget);
      widgetInfo.appendChild(transformSection);

      const stylesSection = this.createStylesSection(widget);
      widgetInfo.appendChild(stylesSection);

      widgetInfo.appendChild(this.createEffectsSection(widget));

      if (widget instanceof DraggableWidget || widget.getZIndex) {
        const zIndexSection = this.createZIndexSection(widget);
        widgetInfo.appendChild(zIndexSection);
      }
    }

    updateWidgetContent(widgetInfo, widget) {
      // Обновляем позицию и размер в свойствах
      const posXInput = widgetInfo.querySelector('[id*="prop-pos-x"]');
      const posYInput = widgetInfo.querySelector('[id*="prop-pos-y"]');
      const widthInput = widgetInfo.querySelector('[id*="prop-width"]');
      const heightInput = widgetInfo.querySelector('[id*="prop-height"]');

      if (posXInput) posXInput.value = Math.round(widget.x || 0);
      if (posYInput) posYInput.value = Math.round(widget.y || 0);
      if (widthInput)
        widthInput.value = Math.round(this.getWidgetWidth(widget));
      if (heightInput)
        heightInput.value = Math.round(this.getWidgetHeight(widget));

      // Не трогаем кнопки соотношений - они остаются как есть
    }

    createUniversalFontSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom: 20px;";
      const currentFont = widget.getFontFamily?.() || "Rubik";
      const fonts = [
        "Rubik",
        "Inter",
        "Arial",
        "Verdana",
        "Georgia",
        "Times New Roman",
        "Courier New",
        "Tahoma",
        "Montserrat",
        "Roboto",
      ];
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Шрифт виджета</div>
        <select class="form-input" style="width:100%;padding:8px;background:var(--bg-primary);color:var(--text-primary);border:1px solid var(--border-secondary);border-radius:6px;">
          ${fonts.map((font) => `<option value="${font}" ${font === currentFont ? "selected" : ""}>${font}</option>`).join("")}
        </select>
      `;
      section.querySelector("select").addEventListener("change", (event) => {
        widget.setFontFamily?.(event.target.value);
        window.undoManager?.save("Изменен шрифт виджета");
      });
      return section;
    }

    createUniversalTextColorSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom: 20px;";
      const currentColor = this.rgbToHex(
        widget.getTextColor?.() ?? widget._textColor ?? widget.textColor ?? 0xffffff,
      );
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Цвет текста</div>
        <input class="form-input" type="color" value="${currentColor}" style="width:100%;height:36px;padding:2px;background:var(--bg-primary);border:1px solid var(--border-secondary);border-radius:6px;">
      `;
      section.querySelector("input").addEventListener("input", (event) => {
        const color = parseInt(event.target.value.slice(1), 16);
        widget.setTextColor?.(color);
      });
      section.querySelector("input").addEventListener("change", () => {
        window.undoManager?.save("Изменен цвет текста виджета");
      });
      return section;
    }

    createCompanySection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom: 20px;";
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Компания</div>
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Название компании</label>
        <input class="form-input company-name" type="text" value="${(widget.getCompanyName?.() || "").replace(/"/g, "&quot;")}" style="width:100%;margin-bottom:10px;">
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Телефон поддержки</label>
        <input class="form-input company-phone" type="text" value="${(widget.getPhoneNumber?.() || "").replace(/"/g, "&quot;")}" style="width:100%;">
      `;
      section.querySelector(".company-name").addEventListener("input", (event) => {
        widget.setCompanyName?.(event.target.value);
      });
      section.querySelector(".company-phone").addEventListener("input", (event) => {
        widget.setPhoneNumber?.(event.target.value);
      });
      section.querySelectorAll("input").forEach((input) => {
        input.addEventListener("change", () =>
          window.undoManager?.save("Изменен виджет компании"),
        );
      });
      return section;
    }

    createDrawingSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom: 20px;";
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Рисование</div>
        <div style="display:flex;gap:8px;margin-bottom:10px;">
          <button class="btn-modern drawing-toggle" style="flex:1;">Рисовать</button>
          <button class="btn-modern drawing-clear" style="flex:1;">Очистить</button>
        </div>
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Цвет кисти</label>
        <input class="drawing-color" type="color" value="#${widget.brushColor.toString(16).padStart(6, "0")}" style="width:100%;height:32px;margin-bottom:10px;">
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Толщина кисти</label>
        <input class="drawing-size" type="range" min="1" max="40" value="${widget.brushSize}" style="width:100%;">
      `;
      const toggle = section.querySelector(".drawing-toggle");
      const syncDrawingButton = () => {
        toggle.textContent = widget.drawingEnabled
          ? "Завершить рисование (Esc)"
          : "Рисовать";
        toggle.style.background = widget.drawingEnabled
          ? "var(--accent-primary)"
          : "";
      };
      syncDrawingButton();
      widget.on?.("drawing-mode-change", syncDrawingButton);
      toggle.addEventListener("click", () => {
        widget.setDrawingEnabled(!widget.drawingEnabled);
        syncDrawingButton();
      });
      section.querySelector(".drawing-clear").addEventListener("click", () => {
        widget.clearDrawing();
        syncDrawingButton();
        window.undoManager?.save("Очищен рисунок");
      });
      section
        .querySelector(".drawing-color")
        .addEventListener("input", (event) => {
          widget.setBrushColor(parseInt(event.target.value.slice(1), 16));
        });
      section
        .querySelector(".drawing-size")
        .addEventListener("input", (event) => {
          widget.setBrushSize(event.target.value);
        });
      return section;
    }

    createAudioPlayerSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom: 20px;";
      const isAudioWidget =
        widget?.constructor?.name === "AudioPlayerWidget" ||
        widget?.type === "AudioPlayerWidget" ||
        widget?.widgetType === "AudioPlayerWidget";
      const actualWidget = isAudioWidget
        ? widget
        : widget.originalWidget || widget.widget || widget.content || widget;
      const mixerColor = this.rgbToHex(
        actualWidget.getMixerColor?.() ??
          actualWidget._mixerColor ??
          actualWidget.audioData?.mixerColor ??
          0x20a7d0,
      );
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Аудиоплеер</div>
        <div style="display:grid;gap:10px;">
          <div style="padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(32,167,208,.18),rgba(123,97,255,.16));border:1px solid rgba(32,167,208,.35);">
            <label style="display:block;color:var(--text-primary);font-size:11px;margin-bottom:6px;font-weight:700;text-transform:uppercase;">Номер проигрывателя</label>
            <input class="form-input audio-player-number" type="number" min="1" max="99" value="${actualWidget.getPlayerNumber?.() || actualWidget._playerNumber || 1}" style="width:100%;">
          </div>
          <div style="padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(123,97,255,.18),rgba(32,167,208,.12));border:1px solid rgba(123,97,255,.35);">
            <label style="display:block;color:var(--text-primary);font-size:11px;margin-bottom:6px;font-weight:700;text-transform:uppercase;">Пресет плейлиста</label>
            <select class="form-input audio-preset" style="width:100%;">
              ${AUDIO_PLAYLIST_PRESETS.map(
                (preset) =>
                  `<option value="${preset.id}" ${preset.id === (actualWidget.getPresetId?.() || actualWidget._presetId || "") ? "selected" : ""}>${preset.name}</option>`,
              ).join("")}
            </select>
          </div>
          <div style="padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(32,167,208,.12));border:1px solid rgba(16,185,129,.32);">
            <label style="display:block;color:var(--text-primary);font-size:11px;margin-bottom:6px;font-weight:700;text-transform:uppercase;">Громкость</label>
            <input class="audio-volume" type="range" min="0" max="100" value="${Math.round((actualWidget.volume ?? 0.82) * 100)}" style="width:100%;">
          </div>
          <div style="padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(6,182,212,.16),rgba(14,165,233,.10));border:1px solid rgba(6,182,212,.34);">
            <label style="display:block;color:var(--text-primary);font-size:11px;margin-bottom:6px;font-weight:700;text-transform:uppercase;">Цвет микшера</label>
            <input class="form-input audio-mixer-color" type="color" value="${mixerColor}" style="width:100%;height:38px;padding:2px;">
          </div>
        </div>
      `;
      section
        .querySelector(".audio-player-number")
        .addEventListener("change", (event) => {
          if (actualWidget.setPlayerNumber) {
            actualWidget.setPlayerNumber(event.target.value);
          } else {
            actualWidget._playerNumber = Number(event.target.value) || 1;
          }
          window.undoManager?.save("Изменен номер аудиоплеера");
        });
      section.querySelector(".audio-preset").addEventListener("change", (event) => {
        if (actualWidget.setPresetId) {
          actualWidget.setPresetId(event.target.value);
        } else {
          actualWidget._presetId = event.target.value || "";
          actualWidget.reload?.();
        }
        window.undoManager?.save("Изменен пресет аудиоплеера");
      });
      section
        .querySelector(".audio-volume")
        .addEventListener("input", (event) => {
          actualWidget.volume = Number(event.target.value) / 100;
          if (actualWidget.audioElement) actualWidget.audioElement.volume = actualWidget.volume;
        });
      section.querySelector(".audio-volume").addEventListener("change", () => {
        window.undoManager?.save("Изменена громкость аудиоплеера");
      });
      section.querySelector(".audio-mixer-color").addEventListener("input", (event) => {
        const color = parseInt(event.target.value.slice(1), 16);
        if (actualWidget.setMixerColor) {
          actualWidget.setMixerColor(color);
        } else {
          actualWidget._mixerColor = color;
          actualWidget.redraw?.();
          actualWidget.drawBars?.();
        }
      });
      section.querySelector(".audio-mixer-color").addEventListener("change", () => {
        window.undoManager?.save("Изменен цвет микшера аудиоплеера");
      });
      return section;
    }

    createAnalogClockSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom:20px;";
      const selectStyle = "width:100%;padding:10px 12px;background:rgba(15,23,42,.72);border:1px solid rgba(6,182,212,.32);border-radius:8px;color:white;";
      const row = (label, cls, value, items) => `
        <div style="padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(6,182,212,.14),rgba(123,97,255,.12));border:1px solid rgba(6,182,212,.28);">
          <label style="display:block;color:var(--text-primary);font-size:11px;margin-bottom:7px;font-weight:700;text-transform:uppercase;">${label}</label>
          <select class="${cls}" style="${selectStyle}">
            ${items.map((item) => `<option value="${item.id}" ${item.id === value ? "selected" : ""}>${item.label}</option>`).join("")}
          </select>
        </div>
      `;
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Кастомные аналоговые часы</div>
        <div style="display:grid;gap:10px;">
          ${row("Фон циферблата", "clock-face-select", widget.customFaceId || "face_1", ANALOG_CLOCK_CUSTOM_FACES)}
          ${row("Часовая стрелка", "clock-hour-hand-select", widget.customHourHandId || "gold_wide_hour", ANALOG_CLOCK_CUSTOM_HANDS)}
          ${row("Минутная стрелка", "clock-minute-hand-select", widget.customMinuteHandId || "gold_wide_minute", ANALOG_CLOCK_CUSTOM_HANDS)}
          ${row("Секундная стрелка", "clock-second-hand-select", widget.customSecondHandId || "blue_second", ANALOG_CLOCK_CUSTOM_HANDS)}
          <div style="padding:12px;border-radius:10px;background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12);">
            <label style="display:block;color:var(--text-primary);font-size:11px;margin-bottom:7px;font-weight:700;text-transform:uppercase;">Масштаб стрелок</label>
            <input class="clock-hands-scale" type="range" min="40" max="180" value="${Math.round((widget.customHandsScale || 1) * 100)}" style="width:100%;">
          </div>
          <label style="display:flex;align-items:center;gap:8px;color:var(--text-primary);font-size:12px;">
            <input class="clock-second-visible" type="checkbox" ${widget.customSecondHandVisible !== false ? "checked" : ""}>
            Показывать секундную стрелку
          </label>
        </div>
      `;
      section.querySelector(".clock-face-select").addEventListener("change", (event) => {
        this.applyToWidgets([widget], "analog-clock-face", event.target.value);
        window.undoManager?.save("Изменен фон аналоговых часов");
      });
      section.querySelector(".clock-hour-hand-select").addEventListener("change", (event) => {
        this.applyToWidgets([widget], "analog-clock-hour-hand", event.target.value);
        window.undoManager?.save("Изменена часовая стрелка");
      });
      section.querySelector(".clock-minute-hand-select").addEventListener("change", (event) => {
        this.applyToWidgets([widget], "analog-clock-minute-hand", event.target.value);
        window.undoManager?.save("Изменена минутная стрелка");
      });
      section.querySelector(".clock-second-hand-select").addEventListener("change", (event) => {
        this.applyToWidgets([widget], "analog-clock-second-hand", event.target.value);
        window.undoManager?.save("Изменена секундная стрелка");
      });
      section.querySelector(".clock-hands-scale").addEventListener("input", (event) => {
        this.applyToWidgets([widget], "analog-clock-hands-scale", Number(event.target.value) / 100);
      });
      section.querySelector(".clock-second-visible").addEventListener("change", (event) => {
        this.applyToWidgets([widget], "analog-clock-second-visible", event.target.checked);
      });
      return section;
    }

    createEffectsSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom:20px;";
      const current = widget.getEffectPreset?.() || widget._effectPreset || "none";
      const presets = [
        {
          value: "none",
          label: "Без",
          background: "linear-gradient(135deg,rgba(15,23,42,.18),rgba(15,23,42,.08))",
          border: "rgba(255,255,255,.1)",
          shadow: "none",
          color: "#cbd5e1",
        },
        {
          value: "minimal",
          label: "Minimal",
          background: "linear-gradient(135deg,rgba(15,23,42,.78),rgba(30,41,59,.56))",
          border: "rgba(255,255,255,.18)",
          shadow: "0 10px 24px rgba(0,0,0,.22)",
          color: "#ffffff",
        },
        {
          value: "glass",
          label: "Glass",
          background: "linear-gradient(135deg,rgba(255,255,255,.34),rgba(34,211,238,.14))",
          border: "rgba(103,232,249,.82)",
          shadow: "0 0 0 1px rgba(103,232,249,.28),0 14px 32px rgba(34,211,238,.22)",
          color: "#ffffff",
        },
        {
          value: "premium",
          label: "Premium",
          background: "linear-gradient(135deg,rgba(79,70,229,.44),rgba(34,211,238,.16))",
          border: "rgba(123,97,255,.86)",
          shadow: "0 0 0 1px rgba(123,97,255,.32),0 16px 34px rgba(123,97,255,.28)",
          color: "#ffffff",
        },
        {
          value: "dark",
          label: "Dark",
          background: "linear-gradient(135deg,#050816,#111827)",
          border: "rgba(148,163,184,.34)",
          shadow: "0 16px 34px rgba(0,0,0,.38)",
          color: "#ffffff",
        },
        {
          value: "light",
          label: "Light",
          background: "linear-gradient(135deg,#ffffff,#e2e8f0)",
          border: "rgba(255,255,255,.95)",
          shadow: "0 14px 30px rgba(148,163,184,.24)",
          color: "#111827",
        },
      ];
      section.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div style="font-size:12px;font-weight:700;color:var(--accent-primary);text-transform:uppercase;">Готовые стили</div>
          <div style="color:#fbbf24;font-size:14px;">★</div>
        </div>
        <div class="widget-effect-presets" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;">
          ${presets
            .map(
              (preset) => `
                <button type="button" class="btn-modern widget-effect-preset" data-preset="${preset.value}" style="min-height:92px;padding:10px;display:flex;flex-direction:column;align-items:stretch;justify-content:space-between;background:rgba(15,23,42,.42);border-color:${preset.value === current ? "var(--accent-primary)" : "rgba(255,255,255,.1)"};box-shadow:${preset.value === current ? "0 0 0 1px rgba(0,212,255,.42),0 10px 24px rgba(0,212,255,.2)" : "none"};">
                  <span style="height:56px;border-radius:10px;padding:10px;display:flex;flex-direction:column;justify-content:space-between;background:${preset.background};border:1px solid ${preset.border};box-shadow:${preset.shadow};position:relative;overflow:hidden;">
                    <span style="position:absolute;left:0;right:0;top:0;height:45%;background:linear-gradient(180deg,rgba(255,255,255,.2),rgba(255,255,255,0));pointer-events:none;"></span>
                    <span style="font-size:18px;line-height:1;color:${preset.color};position:relative;z-index:1;">23:46</span>
                    <span style="width:42%;height:3px;border-radius:999px;background:${preset.value === "light" ? "rgba(17,24,39,.2)" : "rgba(255,255,255,.22)"};position:relative;z-index:1;"></span>
                  </span>
                  <span style="font-size:10px;color:${preset.value === "light" ? "#cbd5e1" : "var(--text-secondary)"};text-align:center;margin-top:6px;">${preset.label}</span>
                </button>
              `,
            )
            .join("")}
        </div>
      `;
      section.querySelectorAll(".widget-effect-preset").forEach((button) => {
        button.addEventListener("click", () => {
          widget.setEffectPreset?.(button.dataset.preset);
          window.undoManager?.save("Изменен эффект виджета");
          this.renderSelectionContent();
        });
      });
      return section;
    }

    createFloorWidgetSection(widget) {
      const section = document.createElement("div");
      section.style.cssText = "margin-bottom:20px;";
      section.innerHTML = `
        <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;">Этаж</div>
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Ссылка на источник этажа</label>
        <input class="form-input floor-source-url" type="url" value="${(widget.getSourceUrl?.() || "").replace(/"/g, "&quot;")}" placeholder="https://..." style="width:100%;margin-bottom:10px;">
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Этаж вручную</label>
        <input class="form-input floor-current" type="number" value="${widget.getCurrentFloor?.() ?? widget._floor ?? 1}" style="width:100%;margin-bottom:10px;">
        <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Направление</label>
        <select class="form-input floor-direction" style="width:100%;margin-bottom:10px;">
          <option value="up" ${(widget.getCurrentDirection?.() || widget._direction) === "up" ? "selected" : ""}>Вверх</option>
          <option value="down" ${(widget.getCurrentDirection?.() || widget._direction) === "down" ? "selected" : ""}>Вниз</option>
          <option value="none" ${(widget.getCurrentDirection?.() || widget._direction) === "none" ? "selected" : ""}>Нет движения</option>
        </select>
      `;
      section.querySelector(".floor-source-url").addEventListener("change", (event) => {
        widget.setSourceUrl?.(event.target.value);
        window.undoManager?.save("Изменен источник этажа");
      });
      section.querySelector(".floor-current").addEventListener("change", (event) => {
        widget.setFloor?.(Number(event.target.value), false);
        window.undoManager?.save("Изменен этаж");
      });
      section.querySelector(".floor-direction").addEventListener("change", (event) => {
        widget.setDirection?.(event.target.value);
        window.undoManager?.save("Изменено направление этажа");
      });
      return section;
    }

    // Убедитесь, что этот метод есть в вашем классе
    applyTextColor(widget, hexColor) {
      if (!widget) return;

      try {
        const actualWidget = widget.originalWidget || widget;
        const colorNum = this.hexToRgb(hexColor);

        if (colorNum === null) return;

        // Пытаемся установить ТОЛЬКО цвет текста
        if (actualWidget.setTextColor) {
          actualWidget.setTextColor(colorNum);
        } else if (actualWidget._textColor !== undefined) {
          actualWidget._textColor = colorNum;
        } else if (actualWidget.text && actualWidget.text.style) {
          actualWidget.text.style.fill = colorNum;
        } else if (actualWidget.textColor !== undefined) {
          actualWidget.textColor = colorNum;
        }

        // Обновляем виджет
        if (actualWidget.update) actualWidget.update();
        if (actualWidget.updateSelection) actualWidget.updateSelection();

        console.log("✅ Цвет текста применен:", hexColor);
      } catch (error) {
        console.warn("Ошибка применения цвета текста:", error);
      }
    }

    // ПОЛНОСТЬЮ ПЕРЕРАБОТАННАЯ СЕКЦИЯ ДЛЯ TEXTWIDGET
    createTextWidgetSection(widget) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("div");
      title.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-primary);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
      title.textContent = "Текст";
      section.appendChild(title);

      // Получаем текущие значения из виджета
      let currentText = "";
      let currentFontFamily = "Arial";
      let currentFontSize = 24;
      let currentColor = "#ffffff";
      let currentAlign = "left";
      let currentIsBold = false;
      let currentIsItalic = false;

      // Пытаемся получить значения из разных возможных мест хранения
      if (widget.getText) {
        currentText = widget.getText();
      } else if (widget._text !== undefined) {
        currentText = widget._text;
      } else if (widget.text && widget.text.text !== undefined) {
        currentText = widget.text.text;
      }

      // Получаем стили текста
      if (widget.getFontFamily) {
        currentFontFamily = widget.getFontFamily();
      } else if (widget._fontFamily) {
        currentFontFamily = widget._fontFamily;
      } else if (widget.text && widget.text.style) {
        currentFontFamily = widget.text.style.fontFamily || "Arial";
        currentFontSize = parseInt(widget.text.style.fontSize) || 24;
        currentIsBold = widget.text.style.fontWeight === "bold";
        currentIsItalic = widget.text.style.fontStyle === "italic";
      }

      if (widget.getFontSize) {
        currentFontSize = widget.getFontSize();
      } else if (widget._fontSize) {
        currentFontSize = widget._fontSize;
      }

      if (widget.getTextColor) {
        currentColor = this.rgbToHex(widget.getTextColor());
      } else if (widget._textColor) {
        currentColor = this.rgbToHex(widget._textColor);
      } else if (widget.text && widget.text.style && widget.text.style.fill) {
        currentColor = this.rgbToHex(widget.text.style.fill);
      }

      if (widget.getTextAlign) {
        currentAlign = widget.getTextAlign();
      } else if (widget._textAlign) {
        currentAlign = widget._textAlign;
      } else if (widget.text && widget.text.style && widget.text.style.align) {
        currentAlign = widget.text.style.align;
      }

      // 1. Текстовое поле для редактирования содержимого
      const textContentGroup = this.createTextAreaInput(
        "Содержимое",
        `text-content-${widget.id || Date.now()}`,
        currentText,
        (value) => {
          if (widget.setText) {
            widget.setText(value);
          } else if (widget._text !== undefined) {
            widget._text = value;
            if (widget.text) widget.text.text = value;
          } else if (widget.text) {
            widget.text.text = value;
          }

          // Принудительно обновляем виджет
          if (widget.update) widget.update();
          setTimeout(() => this.forceRefresh(), 50);
        },
      );
      textContentGroup.style.minHeight = 250 + "px";
      section.appendChild(textContentGroup);

      // 2. Тип шрифта (Font Family)
      const fontFamilyGroup = document.createElement("div");
      fontFamilyGroup.style.marginBottom = "16px";

      const fontFamilyLabel = document.createElement("div");
      fontFamilyLabel.style.cssText = `
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
      fontFamilyLabel.textContent = "Тип шрифта";
      fontFamilyGroup.appendChild(fontFamilyLabel);

      const fontFamilySelect = document.createElement("select");
      fontFamilySelect.id = `font-family-${widget.id || Date.now()}`;
      fontFamilySelect.style.cssText = `
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-primary);
    border: 1px solid var(--border-secondary);
    border-radius: 6px;
    color: var(--text-primary);
    font-size: 13px;
    cursor: pointer;
    transition: var(--transition);
  `;

      // Список популярных шрифтов
      const fonts = [
        { value: "Arial", label: "Arial" },
        { value: "Verdana", label: "Verdana" },
        { value: "Helvetica", label: "Helvetica" },
        { value: "Tahoma", label: "Tahoma" },
        { value: "Times New Roman", label: "Times New Roman" },
        { value: "Georgia", label: "Georgia" },
        { value: "Garamond", label: "Garamond" },
        { value: "Courier New", label: "Courier New" },
        { value: "Brush Script MT", label: "Brush Script MT" },
        { value: "Trebuchet MS", label: "Trebuchet MS" },
        { value: "Comic Sans MS", label: "Comic Sans MS" },
        { value: "Impact", label: "Impact" },
        { value: "Roboto", label: "Roboto" },
        { value: "Open Sans", label: "Open Sans" },
        { value: "Lato", label: "Lato" },
        { value: "Montserrat", label: "Montserrat" },
        { value: "Poppins", label: "Poppins" },
        { value: "Raleway", label: "Raleway" },
        { value: "Ubuntu", label: "Ubuntu" },
      ];

      fonts.forEach((font) => {
        const option = document.createElement("option");
        option.value = font.value;
        option.textContent = font.label;
        option.style.fontFamily = font.value;
        if (font.value === currentFontFamily) {
          option.selected = true;
        }
        fontFamilySelect.appendChild(option);
      });

      fontFamilySelect.addEventListener("change", (e) => {
        const newFont = e.target.value;
        this.applyTextStyle(widget, "fontFamily", newFont);
      });

      fontFamilyGroup.appendChild(fontFamilySelect);
      section.appendChild(fontFamilyGroup);

      // 3. Размер шрифта
      const fontSizeGroup = document.createElement("div");
      fontSizeGroup.style.marginBottom = "16px";

      const fontSizeLabel = document.createElement("div");
      fontSizeLabel.style.cssText = `
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
      fontSizeLabel.innerHTML = `<span>Размер шрифта</span>`;
      fontSizeGroup.appendChild(fontSizeLabel);

      const fontSizeSlider = document.createElement("input");
      fontSizeSlider.type = "range";
      fontSizeSlider.id = `font-size-slider-${widget.id || Date.now()}`;
      fontSizeSlider.min = 8;
      fontSizeSlider.max = 200;
      fontSizeSlider.step = 1;
      fontSizeSlider.value = currentFontSize;
      fontSizeSlider.style.cssText = `
    width: 100%;
    height: 4px;
    background: var(--border-secondary);
    border-radius: 2px;
    outline: none;
    -webkit-appearance: none;
    cursor: pointer;
    margin-bottom: 8px;
  `;

      const fontSizeValue = document.getElementById(
        `font-size-value-${widget.id || Date.now()}`,
      );

      fontSizeSlider.addEventListener("input", (e) => {
        const size = e.target.value;
        if (fontSizeValue) fontSizeValue.textContent = `${size}px`;
      });

      fontSizeSlider.addEventListener("change", (e) => {
        const newSize = parseInt(e.target.value);
        this.applyTextStyle(widget, "fontSize", newSize);
      });

      fontSizeGroup.appendChild(fontSizeSlider);

      // Пресеты размера шрифта
      const sizePresets = document.createElement("div");
      sizePresets.style.cssText = `
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    margin-top: 8px;
  `;

      [12, 14, 16, 18, 24, 32, 48, 64, 72, 96, 120].forEach((size) => {
        const presetBtn = document.createElement("button");
        presetBtn.className = "btn-modern";
        presetBtn.style.cssText = `
      padding: 4px 8px;
      font-size: 11px;
      background: ${size === currentFontSize ? "var(--accent-primary)" : "var(--bg-tertiary)"};
      min-width: 40px;
    `;
        presetBtn.textContent = size;
        presetBtn.addEventListener("click", () => {
          fontSizeSlider.value = size;
          if (fontSizeValue) fontSizeValue.textContent = `${size}px`;
          this.applyTextStyle(widget, "fontSize", size);

          // Обновляем внешний вид кнопок
          sizePresets.querySelectorAll("button").forEach((btn) => {
            btn.style.background = "var(--bg-tertiary)";
          });
          presetBtn.style.background = "var(--accent-primary)";
        });
        sizePresets.appendChild(presetBtn);
      });

      fontSizeGroup.appendChild(sizePresets);
      section.appendChild(fontSizeGroup);
      // В методе createTextWidgetSection, замените секцию с цветом текста (пункт 4) на это:

      // 4. Цвет ТЕКСТА (полностью изолирован от фона)
      const textColorGroup = document.createElement("div");
      textColorGroup.style.marginBottom = "16px";

      const textColorLabel = document.createElement("div");
      textColorLabel.style.cssText = `
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;
      textColorLabel.textContent = "Цвет текста";
      textColorGroup.appendChild(textColorLabel);

      const textColorContainer = document.createElement("div");
      textColorContainer.style.cssText = `
  display: flex;
  align-items: center;
  gap: 8px;
`;

      const textColorPreview = document.createElement("div");
      textColorPreview.style.cssText = `
  width: 40px;
  height: 40px;
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  cursor: pointer;
  background-color: ${currentColor};
  transition: var(--transition);
  flex-shrink: 0;
`;

      const textColorHex = document.createElement("input");
      textColorHex.type = "text";
      textColorHex.value = currentColor;
      textColorHex.style.cssText = `
  flex: 1;
  padding: 8px 12px;
  background: var(--bg-primary);
  border: 1px solid var(--border-secondary);
  border-radius: 6px;
  color: var(--text-primary);
  font-size: 12px;
  font-family: monospace;
`;

      // СОЗДАЕМ ОТДЕЛЬНОЕ МОДАЛЬНОЕ ОКНО ТОЛЬКО ДЛЯ ЦВЕТА ТЕКСТА
      const openTextColorPicker = () => {
        // Создаем модальное окно для цвета текста
        const modal = document.createElement("div");
        modal.className = "custom-modal";
        modal.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    z-index: 10001;
  `;

        const modalContent = document.createElement("div");
        modalContent.style.cssText = `
    background: var(--bg-primary);
    border-radius: var(--border-radius-lg);
    padding: 24px;
    width: 320px;
    border: 1px solid var(--border-secondary);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  `;

        modalContent.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h3 style="margin: 0; color: var(--accent-primary); font-size: 16px;">🎨 Цвет текста</h3>
      <button id="close-text-color-modal" style="
        background: none;
        border: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-secondary);
        line-height: 1;
      ">&times;</button>
    </div>
    
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Палитра</div>
      <div id="text-color-palette" style="
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 6px;
        margin-bottom: 16px;
      "></div>
    </div>
    
    <div style="margin-bottom: 16px;">
      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Пользовательский</div>
      <div style="display: flex; gap: 8px;">
        <input type="text" id="text-custom-color" class="form-input" value="${currentColor}" style="flex: 1; padding: 8px; background: var(--bg-primary); border: 1px solid var(--border-secondary); border-radius: 4px; color: var(--text-primary); font-family: monospace;">
        <button id="text-apply-custom" class="btn-modern" style="padding: 8px 12px;">Применить</button>
      </div>
    </div>
    
    <div style="margin-bottom: 20px;">
      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px;">Предпросмотр</div>
      <div id="text-color-preview" style="
        width: 100%;
        height: 60px;
        border-radius: var(--border-radius-sm);
        border: 1px solid var(--border-secondary);
        background-color: ${currentColor};
      "></div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
      <button id="text-color-save" class="btn-modern btn-primary" style="padding: 10px;">Сохранить</button>
      <button id="text-color-cancel" class="btn-modern" style="padding: 10px;">Отмена</button>
    </div>
  `;

        modal.appendChild(modalContent);
        document.body.appendChild(modal);

        // Палитра цветов
        const colorPalette = [
          "#000000",
          "#333333",
          "#666666",
          "#999999",
          "#cccccc",
          "#ffffff",
          "#ff0000",
          "#ff6600",
          "#ffcc00",
          "#ffff00",
          "#00ff00",
          "#00ffff",
          "#0066ff",
          "#0000ff",
          "#6600ff",
          "#cc00ff",
          "#ff00cc",
          "#ff0066",
          "#ff3333",
          "#ff9933",
          "#ffff33",
          "#99ff33",
          "#33ff33",
          "#33ffcc",
          "#33ffff",
          "#3399ff",
          "#3333ff",
          "#9933ff",
          "#ff33ff",
          "#ff3399",
        ];

        const paletteContainer = modalContent.querySelector(
          "#text-color-palette",
        );

        colorPalette.forEach((color) => {
          const swatch = document.createElement("div");
          swatch.style.cssText = `
      width: 100%;
      aspect-ratio: 1;
      background-color: ${color};
      border-radius: 4px;
      cursor: pointer;
      border: 2px solid ${color === currentColor ? "var(--accent-primary)" : "transparent"};
      transition: var(--transition);
    `;
          swatch.addEventListener("click", () => {
            // Обновляем предпросмотр
            preview.style.backgroundColor = color;
            customInput.value = color;

            // Обновляем рамки
            paletteContainer.querySelectorAll("div").forEach((s) => {
              s.style.borderColor = "transparent";
            });
            swatch.style.borderColor = "var(--accent-primary)";
          });
          paletteContainer.appendChild(swatch);
        });

        const preview = modalContent.querySelector("#text-color-preview");
        const customInput = modalContent.querySelector("#text-custom-color");
        const applyCustomBtn = modalContent.querySelector("#text-apply-custom");
        const saveBtn = modalContent.querySelector("#text-color-save");
        const cancelBtn = modalContent.querySelector("#text-color-cancel");
        const closeBtn = modalContent.querySelector("#close-text-color-modal");

        // Применить пользовательский цвет
        applyCustomBtn.addEventListener("click", () => {
          const color = customInput.value;
          if (/^#[0-9A-F]{6}$/i.test(color)) {
            preview.style.backgroundColor = color;

            // Обновляем рамки в палитре
            paletteContainer.querySelectorAll("div").forEach((s) => {
              s.style.borderColor = "transparent";
              if (s.style.backgroundColor === color) {
                s.style.borderColor = "var(--accent-primary)";
              }
            });
          } else {
            alert("Введите корректный HEX-цвет (например, #ff0000)");
          }
        });

        // Сохранить цвет
        saveBtn.addEventListener("click", () => {
          const newColor = preview.style.backgroundColor;

          // Конвертируем rgb в hex если нужно
          let hexColor = newColor;
          if (newColor.startsWith("rgb")) {
            const rgb = newColor.match(/\d+/g);
            if (rgb && rgb.length >= 3) {
              hexColor =
                "#" +
                (
                  (1 << 24) +
                  (parseInt(rgb[0]) << 16) +
                  (parseInt(rgb[1]) << 8) +
                  parseInt(rgb[2])
                )
                  .toString(16)
                  .slice(1);
            }
          }

          // Применяем цвет ТОЛЬКО к тексту
          this.applyTextColor(widget, hexColor);

          // Обновляем preview в инспекторе
          textColorPreview.style.backgroundColor = hexColor;
          textColorHex.value = hexColor;

          // Закрываем модальное окно
          document.body.removeChild(modal);
        });

        // Закрыть без сохранения
        const closeModal = () => {
          if (modal.parentNode) {
            document.body.removeChild(modal);
          }
        };

        cancelBtn.addEventListener("click", closeModal);
        closeBtn.addEventListener("click", closeModal);

        modal.addEventListener("click", (e) => {
          if (e.target === modal) {
            closeModal();
          }
        });

        // Закрыть по Escape
        const escapeHandler = (e) => {
          if (e.key === "Escape") {
            closeModal();
            document.removeEventListener("keydown", escapeHandler);
          }
        };
        document.addEventListener("keydown", escapeHandler);
      };

      // Используем новую функцию для открытия палитры
      textColorPreview.addEventListener("click", openTextColorPicker);

      textColorHex.addEventListener("input", (e) => {
        const color = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          textColorPreview.style.backgroundColor = color;
        }
      });

      textColorHex.addEventListener("change", (e) => {
        const color = e.target.value;
        if (/^#[0-9A-F]{6}$/i.test(color)) {
          this.applyTextColor(widget, color);
        }
      });

      textColorContainer.appendChild(textColorPreview);
      textColorContainer.appendChild(textColorHex);
      textColorGroup.appendChild(textColorContainer);
      section.appendChild(textColorGroup);

      // 5. Выравнивание текста
      const alignGroup = document.createElement("div");
      alignGroup.style.marginBottom = "16px";

      const alignLabel = document.createElement("div");
      alignLabel.style.cssText = `
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
      alignLabel.textContent = "Выравнивание";
      alignGroup.appendChild(alignLabel);

      const alignButtons = document.createElement("div");
      alignButtons.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 4px;
  `;

      const alignments = [
        { value: "left", icon: "⬅️", label: "По левому краю" },
        { value: "center", icon: "⬆️", label: "По центру" },
        { value: "right", icon: "➡️", label: "По правому краю" },
      ];

      alignments.forEach((align) => {
        const btn = document.createElement("button");
        btn.className = "btn-modern";
        btn.style.cssText = `
      padding: 8px 4px;
      font-size: 14px;
      background: ${align.value === currentAlign ? "var(--accent-primary)" : "var(--bg-tertiary)"};
    `;
        btn.innerHTML = align.label;
        btn.title = align.label;

        btn.addEventListener("click", () => {
          alignButtons.querySelectorAll("button").forEach((b) => {
            b.style.background = "var(--bg-tertiary)";
          });
          btn.style.background = "var(--accent-primary)";
          this.applyTextStyle(widget, "align", align.value);
        });

        alignButtons.appendChild(btn);
      });

      alignGroup.appendChild(alignButtons);
      section.appendChild(alignGroup);

      // 6. Стили текста (жирный/курсив)
      const styleGroup = document.createElement("div");
      styleGroup.style.marginBottom = "16px";

      const styleLabel = document.createElement("div");
      styleLabel.style.cssText = `
    font-size: 11px;
    color: var(--text-secondary);
    margin-bottom: 8px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
      styleLabel.textContent = "Стиль";
      styleGroup.appendChild(styleLabel);

      const styleButtons = document.createElement("div");
      styleButtons.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
  `;

      // Кнопка жирного текста
      const boldBtn = document.createElement("button");
      boldBtn.className = "btn-modern";
      boldBtn.style.cssText = `
    padding: 8px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: ${currentIsBold ? "var(--accent-primary)" : "var(--bg-tertiary)"};
  `;
      boldBtn.innerHTML = '🔷 <span style="font-weight: bold;">Жирный</span>';

      boldBtn.addEventListener("click", () => {
        const newValue = !currentIsBold;
        currentIsBold = newValue;
        boldBtn.style.background = newValue
          ? "var(--accent-primary)"
          : "var(--bg-tertiary)";
        this.applyTextStyle(widget, "bold", newValue);
      });

      // Кнопка курсива
      const italicBtn = document.createElement("button");
      italicBtn.className = "btn-modern";
      italicBtn.style.cssText = `
    padding: 8px;
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    background: ${currentIsItalic ? "var(--accent-primary)" : "var(--bg-tertiary)"};
  `;
      italicBtn.innerHTML =
        '💧 <span style="font-style: italic;">Курсив</span>';

      italicBtn.addEventListener("click", () => {
        const newValue = !currentIsItalic;
        currentIsItalic = newValue;
        italicBtn.style.background = newValue
          ? "var(--accent-primary)"
          : "var(--bg-tertiary)";
        this.applyTextStyle(widget, "italic", newValue);
      });

      styleButtons.appendChild(boldBtn);
      styleButtons.appendChild(italicBtn);
      styleGroup.appendChild(styleButtons);
      section.appendChild(styleGroup);

      // 7. Кнопка применения всех настроек
      const applyButton = document.createElement("button");
      applyButton.className = "btn-modern";
      applyButton.style.cssText = `
    width: 100%;
    padding: 10px;
    margin-top: 8px;
    background: var(--accent-primary);
    font-size: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    display: none;
  `;
      applyButton.innerHTML = "✅ Применить все настройки";

      applyButton.addEventListener("click", () => {
        // Принудительно обновляем виджет
        if (widget.update) widget.update();
        if (widget.updateSelection) widget.updateSelection();
        setTimeout(() => this.forceRefresh(), 50);
      });

      section.appendChild(applyButton);

      return section;
    }

    // Вспомогательный метод для применения стилей текста
    applyTextStyle(widget, property, value) {
      if (!widget) return;

      try {
        const actualWidget = widget.originalWidget || widget;

        switch (property) {
          case "fontFamily":
            if (actualWidget.setFontFamily) {
              actualWidget.setFontFamily(value);
            } else if (actualWidget._fontFamily !== undefined) {
              actualWidget._fontFamily = value;
            } else if (actualWidget.text && actualWidget.text.style) {
              actualWidget.text.style.fontFamily = value;
            }
            break;

          case "fontSize":
            if (actualWidget.setFontSize) {
              actualWidget.setFontSize(value);
            } else if (actualWidget._fontSize !== undefined) {
              actualWidget._fontSize = value;
            } else if (actualWidget.text && actualWidget.text.style) {
              actualWidget.text.style.fontSize = value + "px";
            }
            break;

          case "color":
            const colorNum = this.hexToRgb(value);
            if (colorNum !== null) {
              if (actualWidget.setTextColor) {
                actualWidget.setTextColor(colorNum);
              } else if (actualWidget._textColor !== undefined) {
                actualWidget._textColor = colorNum;
              } else if (actualWidget.text && actualWidget.text.style) {
                actualWidget.text.style.fill = colorNum;
              }
            }
            break;

          case "align":
            if (actualWidget.setTextAlign) {
              actualWidget.setTextAlign(value);
            } else if (actualWidget._textAlign !== undefined) {
              actualWidget._textAlign = value;
            } else if (actualWidget.text && actualWidget.text.style) {
              actualWidget.text.style.align = value;
            }
            break;

          case "bold":
            if (actualWidget.setFontWeight) {
              actualWidget.setFontWeight(value ? "bold" : "normal");
            } else if (actualWidget.text && actualWidget.text.style) {
              actualWidget.text.style.fontWeight = value ? "bold" : "normal";
            }
            break;

          case "italic":
            if (actualWidget.setFontStyle) {
              actualWidget.setFontStyle(value ? "italic" : "normal");
            } else if (actualWidget.text && actualWidget.text.style) {
              actualWidget.text.style.fontStyle = value ? "italic" : "normal";
            }
            break;
        }

        // Обновляем виджет
        if (actualWidget.update) actualWidget.update();
        if (actualWidget.updateSelection) actualWidget.updateSelection();
      } catch (error) {
        console.warn("Ошибка применения стиля текста:", error);
      }
    }

    // В классе RealTimeInspector

    // В классе RealTimeInspector

    applyAspectRatioDirect(widget, targetWidth, targetHeight, onComplete) {
      if (!widget) return;

      console.log(`📏 Применяю соотношение ${targetWidth}:${targetHeight}`);

      const currentSize = widget.getSize();
      const currentArea = currentSize.width * currentSize.height;
      const targetArea = targetWidth * targetHeight;

      const scale = Math.sqrt(currentArea / targetArea);

      let newWidth = Math.round(targetWidth * scale);
      let newHeight = Math.round(targetHeight * scale);

      newWidth = Math.max(newWidth, 100);
      newHeight = Math.max(newHeight, 100);

      console.log(`  Новый размер: ${newWidth}×${newHeight}`);

      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      // Обновляем активную кнопку
      if (onComplete) {
        setTimeout(onComplete, 50);
      }

      if (typeof showSuccess === "function") {
        showSuccess(
          `Соотношение сторон изменено на ${targetWidth}:${targetHeight}`,
        );
      }
    }

    stretchToWidthDirect(widget, onComplete) {
      if (!widget) return;

      console.log("📏 Растягиваю на всю ширину редактора");

      const editorWidth = this.editor._width;
      const currentSize = widget.getSize();
      const aspectRatio = currentSize.width / currentSize.height;
      const newWidth = editorWidth;
      const newHeight = Math.round(editorWidth / aspectRatio);

      console.log(`  Новый размер: ${newWidth}×${newHeight}`);

      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      widget.x = 0;

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      if (onComplete) {
        setTimeout(onComplete, 50);
      }

      if (typeof showSuccess === "function") {
        showSuccess(`Виджет растянут на всю ширину: ${newWidth}×${newHeight}`);
      }
    }

    stretchToHeightDirect(widget, onComplete) {
      if (!widget) return;

      console.log("📐 Растягиваю на всю высоту редактора");

      const editorHeight = this.editor._height;
      const currentSize = widget.getSize();
      const aspectRatio = currentSize.width / currentSize.height;
      const newHeight = editorHeight;
      const newWidth = Math.round(editorHeight * aspectRatio);

      console.log(`  Новый размер: ${newWidth}×${newHeight}`);

      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      widget.y = 0;

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      if (onComplete) {
        setTimeout(onComplete, 50);
      }

      if (typeof showSuccess === "function") {
        showSuccess(`Виджет растянут на всю высоту: ${newWidth}×${newHeight}`);
      }
    }

    // В классе RealTimeInspector, метод createVideoWidgetSection

    createVideoWidgetSection(widget) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const widgetId = widget.id || widget._id || Date.now();
      section.setAttribute("data-widget-id", widgetId);

      const title = document.createElement("div");
      title.style.cssText = `
    font-size: 12px;
    font-weight: 600;
    color: var(--accent-primary);
    margin-bottom: 12px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
      title.textContent = "Настройки видео";
      section.appendChild(title);

      // Кнопки управления соотношением сторон
      const aspectButtons = document.createElement("div");
      aspectButtons.className = "aspect-ratio-buttons";
      aspectButtons.style.cssText = `
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-top: 16px;
    margin-bottom: 16px;
  `;

      const presets = [
        { label: "16:9", width: 16, height: 9 },
        { label: "21:9", width: 21, height: 9 },
        { label: "32:9", width: 32, height: 9 },
        { label: "9:16", width: 9, height: 16 },
        { label: "9:21", width: 9, height: 21 },
      ];

      // Функция для определения текущего соотношения сторон виджета
      const getCurrentAspectRatio = () => {
        const size = widget.getSize();
        return size.width / size.height;
      };

      // Функция для проверки, соответствует ли пресет текущему соотношению
      const isPresetActive = (preset) => {
        const currentRatio = getCurrentAspectRatio();
        const targetRatio = preset.width / preset.height;
        const tolerance = 0.05; // 5% допуска
        return Math.abs(currentRatio - targetRatio) < tolerance;
      };

      // Функция обновления активного состояния кнопок
      // В методе createVideoWidgetSection, в блоке с кнопками соотношений, обновите функцию updateActiveButtons:

      const updateActiveButtons = () => {
        const allBtns = aspectButtons.querySelectorAll("button");
        const currentRatio = widget.getSize().width / widget.getSize().height;

        allBtns.forEach((btn) => {
          const btnPreset = presets.find((p) => p.label === btn.textContent);
          if (btnPreset) {
            const targetRatio = btnPreset.width / btnPreset.height;
            const isActive = Math.abs(currentRatio - targetRatio) < 0.05;

            if (isActive) {
              btn.style.background = "var(--accent-primary)";
              btn.style.boxShadow =
                "0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0, 212, 255, 0.3)";
              btn.style.transform = "scale(1.02)";
            } else {
              btn.style.background = "var(--bg-tertiary)";
              btn.style.boxShadow = "none";
              btn.style.transform = "scale(1)";
            }
          }
        });

        // Обновляем состояние кнопок масштабирования
        if (typeof updateScaleButtonsState === "function") {
          updateScaleButtonsState();
        }
      };

      // Сохраняем функцию для внешнего вызова
      aspectButtons.updateAspectButtons = updateActiveButtons;

      // Создаем кнопки
      presets.forEach((preset) => {
        const btn = document.createElement("button");
        btn.className = "btn-modern";
        btn.textContent = preset.label;
        btn.setAttribute("data-preset", preset.label);
        btn.style.cssText = `
      padding: 8px 4px;
      font-size: 11px;
      background: ${isPresetActive(preset) ? "var(--accent-primary)" : "var(--bg-tertiary)"};
      transition: all 0.2s ease;
      cursor: pointer;
      border: none;
    `;

        if (isPresetActive(preset)) {
          btn.style.boxShadow =
            "0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0, 212, 255, 0.3)";
          btn.style.transform = "scale(1.02)";
        }

        btn.addEventListener("mouseenter", () => {
          if (btn.style.background !== "var(--accent-primary)") {
            btn.style.background = "rgba(0, 212, 255, 0.2)";
          }
        });

        btn.addEventListener("mouseleave", () => {
          if (btn.style.background !== "var(--accent-primary)") {
            btn.style.background = "var(--bg-tertiary)";
          }
        });

        btn.addEventListener("click", (e) => {
          e.stopPropagation();
          console.log(`📏 Применяю соотношение ${preset.label}`);

          // Применяем соотношение
          this.applyAspectRatio(widget, preset.width, preset.height);

          // Обновляем активные кнопки
          updateActiveButtons();

          if (typeof showSuccess === "function") {
            showSuccess(`Соотношение сторон изменено на ${preset.label}`);
          }

          // Обновляем инспектор
          setTimeout(() => this.forceRefresh(), 100);
        });

        aspectButtons.appendChild(btn);
      });

      section.appendChild(aspectButtons);

      // Кнопки масштабирования
      // В классе RealTimeInspector, метод createVideoWidgetSection - замените весь блок с кнопками масштабирования:

      // Кнопки масштабирования
      const scaleButtons = document.createElement("div");
      scaleButtons.style.cssText = `
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 8px;
`;

      const stretchWidthBtn = document.createElement("button");
      stretchWidthBtn.className = "btn-modern";
      stretchWidthBtn.innerHTML = "📏 Растянуть по ширине";
      stretchWidthBtn.style.cssText = `
  padding: 8px;
  font-size: 11px;
  background: var(--bg-tertiary);
  grid-column: span 1;
  cursor: pointer;
  transition: all 0.2s ease;
`;

      const stretchHeightBtn = document.createElement("button");
      stretchHeightBtn.className = "btn-modern";
      stretchHeightBtn.innerHTML = "📐 Растянуть по высоте";
      stretchHeightBtn.style.cssText = `
  padding: 8px;
  font-size: 11px;
  background: var(--bg-tertiary);
  grid-column: span 1;
  cursor: pointer;
  transition: all 0.2s ease;
`;

      // Функция для обновления активного состояния кнопок масштабирования
      const updateScaleButtonsState = () => {
        const currentSize = widget.getSize();
        const editorWidth = this.editor._width;
        const editorHeight = this.editor._height;

        // Проверяем, растянут ли виджет по ширине (ширина равна ширине редактора)
        const isStretchedToWidth =
          Math.abs(currentSize.width - editorWidth) < 2;
        // Проверяем, растянут ли виджет по высоте (высота равна высоте редактора)
        const isStretchedToHeight =
          Math.abs(currentSize.height - editorHeight) < 2;

        // Обновляем стили кнопок
        if (isStretchedToWidth) {
          stretchWidthBtn.style.background = "var(--accent-primary)";
          stretchWidthBtn.style.boxShadow =
            "0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0, 212, 255, 0.3)";
          stretchWidthBtn.style.transform = "scale(1.02)";
        } else {
          stretchWidthBtn.style.background = "var(--bg-tertiary)";
          stretchWidthBtn.style.boxShadow = "none";
          stretchWidthBtn.style.transform = "scale(1)";
        }

        if (isStretchedToHeight) {
          stretchHeightBtn.style.background = "var(--accent-primary)";
          stretchHeightBtn.style.boxShadow =
            "0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0, 212, 255, 0.3)";
          stretchHeightBtn.style.transform = "scale(1.02)";
        } else {
          stretchHeightBtn.style.background = "var(--bg-tertiary)";
          stretchHeightBtn.style.boxShadow = "none";
          stretchHeightBtn.style.transform = "scale(1)";
        }
      };

      // Обработчик для кнопки растянуть по ширине
      stretchWidthBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("📏 Растягиваю на всю ширину редактора");

        // Получаем ширину редактора
        const editorWidth = this.editor._width;

        // Получаем текущие размеры виджета
        const currentSize = widget.getSize();
        const aspectRatio = currentSize.width / currentSize.height;
        const newWidth = editorWidth;
        const newHeight = Math.round(editorWidth / aspectRatio);

        // Применяем новый размер
        if (widget.resize) {
          widget.resize(newWidth, newHeight);
        }

        widget.x = 0;

        if (widget.updateSelection) {
          widget.updateSelection();
        }

        // Обновляем активное состояние кнопок
        updateScaleButtonsState();

        // Обновляем кнопки соотношений
        if (aspectButtons && aspectButtons.updateAspectButtons) {
          setTimeout(() => aspectButtons.updateAspectButtons(), 50);
        }

        if (typeof showSuccess === "function") {
          showSuccess(
            `Виджет растянут на всю ширину: ${newWidth}×${newHeight}`,
          );
        }

        // Обновляем инспектор
        setTimeout(() => this.forceRefresh(), 100);
      });

      // Обработчик для кнопки растянуть по высоте
      stretchHeightBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("📐 Растягиваю на всю высоту редактора");

        // Получаем высоту редактора
        const editorHeight = this.editor._height;

        // Получаем текущие размеры виджета
        const currentSize = widget.getSize();
        const aspectRatio = currentSize.width / currentSize.height;
        const newHeight = editorHeight;
        const newWidth = Math.round(editorHeight * aspectRatio);

        // Применяем новый размер
        if (widget.resize) {
          widget.resize(newWidth, newHeight);
        }

        widget.y = 0;

        if (widget.updateSelection) {
          widget.updateSelection();
        }

        // Обновляем активное состояние кнопок
        updateScaleButtonsState();

        // Обновляем кнопки соотношений
        if (aspectButtons && aspectButtons.updateAspectButtons) {
          setTimeout(() => aspectButtons.updateAspectButtons(), 50);
        }

        if (typeof showSuccess === "function") {
          showSuccess(
            `Виджет растянут на всю высоту: ${newWidth}×${newHeight}`,
          );
        }

        // Обновляем инспектор
        setTimeout(() => this.forceRefresh(), 100);
      });

      // Добавляем кнопки в контейнер
      scaleButtons.appendChild(stretchWidthBtn);
      scaleButtons.appendChild(stretchHeightBtn);
      section.appendChild(scaleButtons);

      // Добавляем эффекты при наведении
      const addHoverEffect = (btn) => {
        btn.addEventListener("mouseenter", () => {
          if (btn.style.background !== "var(--accent-primary)") {
            btn.style.background = "rgba(0, 212, 255, 0.2)";
          }
        });

        btn.addEventListener("mouseleave", () => {
          if (btn.style.background !== "var(--accent-primary)") {
            btn.style.background = "var(--bg-tertiary)";
          }
        });
      };

      addHoverEffect(stretchWidthBtn);
      addHoverEffect(stretchHeightBtn);

      // Вызываем начальное обновление состояния кнопок
      setTimeout(updateScaleButtonsState, 50);

      // Сохраняем функцию обновления для использования позже
      aspectButtons.updateScaleButtons = updateScaleButtonsState;

      scaleButtons.appendChild(stretchWidthBtn);
      scaleButtons.appendChild(stretchHeightBtn);
      section.appendChild(scaleButtons);

      // Кнопки управления видео
      const videoButtons = document.createElement("div");
      videoButtons.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-top: 16px;
  `;

      const createVideoButton = (text, action, isPrimary = false) => {
        const button = document.createElement("button");
        button.className = "btn-modern";
        if (isPrimary) {
          button.style.background = "var(--accent-primary)";
        }
        button.style.cssText = `
      padding: 6px 12px;
      font-size: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
      cursor: pointer;
    `;
        button.textContent = text;
        button.addEventListener("click", (e) => {
          e.stopPropagation();
          action();
        });
        return button;
      };

      const hasPlayMethod =
        widget.play || (widget.widget && widget.widget.play);
      const hasPauseMethod =
        widget.pause || (widget.widget && widget.widget.pause);
      const hasReloadMethod =
        widget.reload || (widget.widget && widget.widget.reload);
      const hasStatistics =
        widget.getStatistics ||
        (widget.widget && widget.widget.getStatistics) ||
        (widget.content && widget.content.getStatistics);

      // Инициализируем глобальный объект ВСЕГДА, независимо от наличия методов
      window.videoControls = window.videoControls || {};

      if (hasPlayMethod) {
        const playHandler = () => {
          const targetWidget = widget.play
            ? widget
            : widget.widget
              ? widget.widget
              : widget;
          if (targetWidget.play) targetWidget.play();
        };

        window.videoControls.play = playHandler;

        videoButtons.appendChild(
          createVideoButton("▶️ Воспроизвести", playHandler, true),
        );
      }

      if (hasPauseMethod) {
        const pauseHandler = () => {
          const targetWidget = widget.pause
            ? widget
            : widget.widget
              ? widget.widget
              : widget;
          if (targetWidget.pause) targetWidget.pause();
        };

        window.videoControls.pause = pauseHandler;

        videoButtons.appendChild(createVideoButton("⏸️ Пауза", pauseHandler));
      }

      if (hasReloadMethod) {
        const reloadHandler = () => {
          const targetWidget = widget.reload
            ? widget
            : widget.widget
              ? widget.widget
              : widget;
          if (targetWidget.reload) targetWidget.reload();
        };

        window.videoControls.reload = reloadHandler;

        videoButtons.appendChild(
          createVideoButton("🔄 Перезагрузить", reloadHandler),
        );
      }

      if (hasStatistics) {
        videoButtons.appendChild(
          createVideoButton("📊 Статистика", () => {
            this.showVideoStatistics(widget);
          }),
        );
      }

      section.appendChild(videoButtons);

      // Сохраняем функцию обновления для использования позже
      section.updateAspectButtons = updateActiveButtons;

      return section;
    }

    applyAspectRatio(widget, targetWidth, targetHeight) {
      if (!widget) return;

      const currentSize = widget.getSize();
      const currentArea = currentSize.width * currentSize.height;
      const targetArea = targetWidth * targetHeight;

      const scale = Math.sqrt(currentArea / targetArea);

      let newWidth = Math.round(targetWidth * scale);
      let newHeight = Math.round(targetHeight * scale);

      newWidth = Math.max(newWidth, 100);
      newHeight = Math.max(newHeight, 100);

      // Сохраняем старую позицию
      const oldX = widget.x;
      const oldY = widget.y;

      // Изменяем размер
      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      // Принудительно корректируем позицию
      if (widget._clampToBounds) {
        widget._clampToBounds();
      }

      // Если позиция изменилась, обновляем
      if (widget.updateSelection) {
        widget.updateSelection();
      }

      // Обновляем кнопки соотношений
      this.updateAspectButtonsForWidget(widget);

      console.log(
        `📏 Размер изменен: ${newWidth}×${newHeight}, позиция: ${widget.x}, ${widget.y}`,
      );
    }

    applyAspectRatioWithUpdate(widget, targetWidth, targetHeight) {
      if (!widget) return;

      console.log(`📏 Применяю соотношение ${targetWidth}:${targetHeight}`);

      const currentSize = widget.getSize();
      const currentArea = currentSize.width * currentSize.height;
      const targetArea = targetWidth * targetHeight;

      // Масштабируем, сохраняя примерно ту же площадь
      const scale = Math.sqrt(currentArea / targetArea);

      let newWidth = Math.round(targetWidth * scale);
      let newHeight = Math.round(targetHeight * scale);

      // Минимальные размеры
      newWidth = Math.max(newWidth, 100);
      newHeight = Math.max(newHeight, 100);

      console.log(`  Новый размер: ${newWidth}×${newHeight}`);

      // Применяем новый размер
      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      // Обновляем выделение
      if (widget.updateSelection) {
        widget.updateSelection();
      }

      // Обновляем активную кнопку
      if (widget._updateAspectButtons) {
        setTimeout(() => widget._updateAspectButtons(), 50);
      } else {
        // Ищем секцию и обновляем кнопки
        this.updateAspectButtonsForWidget(widget);
      }

      // Обновляем инспектор
      setTimeout(() => {
        this.forceRefresh();
      }, 100);
    }

    stretchToWidthWithUpdate(widget) {
      if (!widget) return;

      console.log("📏 Растягиваю на всю ширину редактора");

      const editorWidth = this.editor._width;
      const currentSize = widget.getSize();
      const aspectRatio = currentSize.width / currentSize.height;
      const newWidth = editorWidth;
      const newHeight = Math.round(editorWidth / aspectRatio);

      console.log(`  Новый размер: ${newWidth}×${newHeight}`);

      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      widget.x = 0;

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      // Обновляем активную кнопку
      if (widget._updateAspectButtons) {
        setTimeout(() => widget._updateAspectButtons(), 50);
      }

      if (typeof showSuccess === "function") {
        showSuccess(`Виджет растянут на всю ширину: ${newWidth}×${newHeight}`);
      }
    }

    stretchToHeightWithUpdate(widget) {
      if (!widget) return;

      console.log("📐 Растягиваю на всю высоту редактора");

      const editorHeight = this.editor._height;
      const currentSize = widget.getSize();
      const aspectRatio = currentSize.width / currentSize.height;
      const newHeight = editorHeight;
      const newWidth = Math.round(editorHeight * aspectRatio);

      console.log(`  Новый размер: ${newWidth}×${newHeight}`);

      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      widget.y = 0;

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      // Обновляем активную кнопку
      if (widget._updateAspectButtons) {
        setTimeout(() => widget._updateAspectButtons(), 50);
      }

      if (typeof showSuccess === "function") {
        showSuccess(`Виджет растянут на всю высоту: ${newWidth}×${newHeight}`);
      }
    }

    updateAspectButtonsForWidget(widget) {
      // Ищем секцию настроек видео в инспекторе
      const selectionContent = document.getElementById(
        "inspector-selection-content",
      );
      if (!selectionContent) return;

      // Ищем секцию виджета по ID
      const widgetId = widget.id || widget._id;
      const videoSection = selectionContent.querySelector(
        `[data-widget-id="${widgetId}"]`,
      );

      if (videoSection && videoSection.updateAspectButtons) {
        videoSection.updateAspectButtons();
      } else {
        // Если не нашли по ID, ищем аспект-кнопки в секции
        const aspectButtons = selectionContent.querySelector(
          ".aspect-ratio-buttons",
        );
        if (aspectButtons) {
          // Обновляем все кнопки
          const currentRatio = widget.getSize().width / widget.getSize().height;
          const presets = [
            { ratio: 16 / 9, label: "16:9" },
            { ratio: 21 / 9, label: "21:9" },
            { ratio: 32 / 9, label: "32:9" },
            { ratio: 9 / 16, label: "9:16" },
            { ratio: 9 / 21, label: "9:21" },
          ];

          const buttons = aspectButtons.querySelectorAll("button");
          buttons.forEach((btn, index) => {
            const preset = presets[index];
            if (preset) {
              const isActive = Math.abs(preset.ratio - currentRatio) < 0.05;
              if (isActive) {
                btn.style.background = "var(--accent-primary)";
                btn.style.boxShadow =
                  "0 0 0 2px var(--accent-primary), 0 4px 12px rgba(0, 212, 255, 0.3)";
                btn.style.transform = "scale(1.02)";
              } else {
                btn.style.background = "var(--bg-tertiary)";
                btn.style.boxShadow = "none";
                btn.style.transform = "scale(1)";
              }
            }
          });
        }
      }
    }

    // Более надежная версия с использованием getSize()
    stretchToWidth(widget) {
      if (!widget) return;

      console.log("📏 Растягиваю на всю ширину редактора");

      const editorWidth = this.editor._width;
      const currentSize = widget.getSize();
      const aspectRatio = currentSize.width / currentSize.height;
      const newWidth = editorWidth;
      const newHeight = Math.round(editorWidth / aspectRatio);

      // Вызываем resize, который содержит _clampToBounds
      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      widget.x = 0;

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      if (typeof showSuccess === "function") {
        showSuccess(`Виджет растянут на всю ширину: ${newWidth}×${newHeight}`);
      }
    }

    stretchToHeight(widget) {
      if (!widget) return;

      console.log("📐 Растягиваю на всю высоту редактора");

      const editorHeight = this.editor._height;
      const currentSize = widget.getSize();
      const aspectRatio = currentSize.width / currentSize.height;
      const newHeight = editorHeight;
      const newWidth = Math.round(editorHeight * aspectRatio);

      // Вызываем resize, который содержит _clampToBounds
      if (widget.resize) {
        widget.resize(newWidth, newHeight);
      }

      widget.y = 0;

      if (widget.updateSelection) {
        widget.updateSelection();
      }

      if (typeof showSuccess === "function") {
        showSuccess(`Виджет растянут на всю высоту: ${newWidth}×${newHeight}`);
      }
    }

    renderMultipleWidgets(container, widgets) {
      const widgetsList = document.createElement("div");
      widgetsList.style.cssText = `
            padding: 16px;
        `;

      // Заголовок группы
      const header = document.createElement("div");
      header.style.cssText = `
            font-weight: 600;
            color: var(--accent-primary);
            margin-bottom: 16px;
            font-size: 14px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
      header.innerHTML = `<span>Групповое редактирование (${widgets.length} виджетов)</span>`;
      widgetsList.appendChild(header);

      // Групповые настройки
      const groupStylesSection = this.createGroupStylesSection(widgets);
      widgetsList.appendChild(groupStylesSection);

      // Разделитель
      const divider = document.createElement("div");
      divider.style.cssText = `
            height: 1px;
            background: var(--border-secondary);
            margin: 20px 0;
        `;
      widgetsList.appendChild(divider);

      // Список виджетов
      const listHeader = document.createElement("div");
      listHeader.style.cssText = `
            font-size: 12px;
            color: var(--text-secondary);
            margin-bottom: 12px;
            font-weight: 500;
        `;
      listHeader.textContent = "Выбранные виджеты:";
      widgetsList.appendChild(listHeader);

      const widgetsContainer = document.createElement("div");
      widgetsContainer.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
        `;

      widgets.forEach((widget, index) => {
        const widgetItem = this.createExpandableWidgetItem(widget, index);
        widgetsContainer.appendChild(widgetItem);
      });

      widgetsList.appendChild(widgetsContainer);
      container.appendChild(widgetsList);
    }

    createGroupStylesSection(widgets) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("div");
      title.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-primary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      title.textContent = "Групповые стили";
      section.appendChild(title);

      // Цвет фона для всех виджетов
      const bgColorGroup = this.createColorInput(
        "Цвет фона (всем)",
        "group-bg-color",
        0x000000,
        (value) => {
          this.applyToWidgets(widgets, "bg-color", value);
        },
      );
      section.appendChild(bgColorGroup);

      // Прозрачность для всех виджетов
      const alphaGroup = this.createSliderInput(
        "Прозрачность (всем)",
        "group-alpha",
        1,
        0,
        1,
        0.01,
        (value) => {
          this.applyToWidgets(widgets, "alpha", value);
        },
      );
      section.appendChild(alphaGroup);

      // Радиус углов для всех виджетов
      const radiusGroup = this.createSliderInput(
        "Радиус углов (всем)",
        "group-radius",
        0,
        0,
        100,
        1,
        (value) => {
          this.applyToWidgets(widgets, "radius", value);
        },
      );
      section.appendChild(radiusGroup);

      const borderColorGroup = this.createColorInput(
        "Цвет рамки (всем)",
        "group-border-color",
        0xffffff,
        (value) => {
          this.applyToWidgets(widgets, "border-color", value);
        },
      );
      section.appendChild(borderColorGroup);

      const borderWidthGroup = this.createSliderInput(
        "Толщина рамки (всем)",
        "group-border-width",
        0,
        0,
        24,
        1,
        (value) => {
          this.applyToWidgets(widgets, "border-width", value);
        },
      );
      section.appendChild(borderWidthGroup);

      const borderAlphaGroup = this.createSliderInput(
        "Прозрачность рамки (всем)",
        "group-border-alpha",
        1,
        0,
        1,
        0.01,
        (value) => {
          this.applyToWidgets(widgets, "border-alpha", value);
        },
      );
      section.appendChild(borderAlphaGroup);

      return section;
    }

    createExpandableWidgetItem(widget, index) {
      const item = document.createElement("div");
      item.style.cssText = `
            border: 1px solid var(--border-secondary);
            border-radius: 8px;
            background: var(--bg-tertiary);
            transition: var(--transition);
            overflow: hidden;
        `;

      const header = document.createElement("div");
      header.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 12px;
            cursor: pointer;
            background: var(--bg-tertiary);
            transition: var(--transition);
            border-radius: 8px 8px 0 0;
        `;

      header.addEventListener("mouseenter", () => {
        header.style.background = "var(--bg-secondary)";
      });

      header.addEventListener("mouseleave", () => {
        header.style.background = "var(--bg-tertiary)";
      });

      const icon = document.createElement("div");
      icon.style.cssText = `
            width: 24px;
            height: 24px;
            background: var(--accent-gradient);
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            flex-shrink: 0;
        `;
      icon.textContent = "📦";

      const info = document.createElement("div");
      info.style.cssText = `flex: 1; min-width: 0;`;

      const name = document.createElement("div");
      name.style.cssText = `
            font-size: 13px;
            font-weight: 500;
            color: var(--text-primary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 2px;
        `;
      name.textContent = `${index + 1}. ${this.getWidgetTypeName(widget)}`;

      const details = document.createElement("div");
      details.style.cssText = `
            font-size: 11px;
            color: var(--text-secondary);
            display: flex;
            gap: 12px;
        `;
      details.innerHTML = `
            <span>${Math.round(widget.x || 0)}×${Math.round(widget.y || 0)}</span>
            <span>${Math.round(this.getWidgetWidth(widget))}×${Math.round(this.getWidgetHeight(widget))}</span>
        `;

      info.appendChild(name);
      info.appendChild(details);

      header.appendChild(icon);
      header.appendChild(info);

      const content = document.createElement("div");
      content.style.cssText = `
            padding: 0;
            background: var(--bg-primary);
            border-top: 1px solid var(--border-secondary);
            max-height: 0;
            transition: all 0.3s ease;
            overflow: hidden;
        `;

      const actions = document.createElement("div");
      actions.style.cssText = `
            padding: 12px;
            display: flex;
            gap: 8px;
            border-bottom: 1px solid var(--border-secondary);
        `;

      const selectBtn = document.createElement("button");
      selectBtn.className = "btn-modern";
      selectBtn.style.cssText = `flex: 1; padding: 6px 12px; font-size: 11px; display: none`;
      selectBtn.textContent = "Выбрать один";

      const editBtn = document.createElement("button");
      editBtn.className = "btn-modern";
      editBtn.style.cssText = `
            flex: 1;
            padding: 6px 12px;
            font-size: 11px;
            background: var(--accent-primary);
            display: none;
        `;
      editBtn.textContent = "Настроить";
      editBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.expandWidgetContent(content, widget, header);
      });

      actions.appendChild(selectBtn);
      actions.appendChild(editBtn);
      content.appendChild(actions);

      item.appendChild(header);
      item.appendChild(content);

      header.addEventListener("click", (e) => {
        if (e.target !== header && !header.contains(e.target)) {
          this.selectSingleWidget(widget);
        }
      });

      header.addEventListener("click", (e) => {
        e.stopPropagation();
        this.expandWidgetContent(content, widget, header);
      });

      return item;
    }

    expandWidgetContent(content, widget, header) {
      const isExpanded = content.style.maxHeight !== "0px";

      if (isExpanded) {
        content.style.maxHeight = "0";
        content.style.padding = "0";
      } else {
        this.renderWidgetContent(content, widget);
        content.style.maxHeight = "800px";
        content.style.padding = "16px";
      }
    }

    renderWidgetContent(container, widget) {
      const actions = container.querySelector("div:first-child");
      container.innerHTML = "";
      if (actions) container.appendChild(actions);

      const propertiesSection = this.createPropertiesSection(widget);
      container.appendChild(propertiesSection);

      if (widget.constructor.name === "TextWidget") {
        const textSection = this.createTextWidgetSection(widget);
        container.appendChild(textSection);
      } else if (widget.constructor.name === "VideoWidget") {
        const videoSection = this.createVideoWidgetSection(widget);
        container.appendChild(videoSection);
      } else if (
        widget.constructor.name === "AudioPlayerWidget" ||
        widget.type === "AudioPlayerWidget"
      ) {
        container.appendChild(this.createAudioPlayerSection(widget));
      } else if (
        widget.constructor.name === "DirectionFloorWidget" ||
        widget.type === "DirectionFloorDisplay"
      ) {
        container.appendChild(this.createFloorWidgetSection(widget));
      }
      const transformSection = this.createTransformSection(widget);
      container.appendChild(transformSection);
      const stylesSection = this.createStylesSection(widget);
      container.appendChild(stylesSection);
      container.appendChild(this.createEffectsSection(widget));

      if (widget instanceof DraggableWidget || widget.getZIndex) {
        const zIndexSection = this.createZIndexSection(widget);
        container.appendChild(zIndexSection);
      }
    }

    createPropertiesSection(widget) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("div");
      title.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-primary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      title.textContent = "Свойства";
      section.appendChild(title);

      // Позиция с использованием setPosition если доступен
      const positionGroup = this.createInputGroup(
        "Позиция",
        [
          {
            id: `prop-pos-x-${widget.id || Date.now()}`,
            label: "X",
            value: Math.round(widget.x || 0),
            type: "number",
            min: -10000,
            max: 10000,
            step: 1,
          },
          {
            id: `prop-pos-y-${widget.id || Date.now()}`,
            label: "Y",
            value: Math.round(widget.y || 0),
            type: "number",
            min: -10000,
            max: 10000,
            step: 1,
          },
        ],
        (fieldId, value) => {
          this.applyToWidgets([widget], fieldId, value);
        },
      );
      section.appendChild(positionGroup);

      // Размер с использованием getSize и resize если доступны
      const currentWidth = this.getWidgetWidth(widget);
      const currentHeight = this.getWidgetHeight(widget);

      const sizeGroup = this.createInputGroup(
        "Размер",
        [
          {
            id: `prop-width-${widget.id || Date.now()}`,
            label: "Ширина",
            value: Math.round(currentWidth),
            type: "number",
            min: 1,
            max: 10000,
            step: 1,
          },
          {
            id: `prop-height-${widget.id || Date.now()}`,
            label: "Высота",
            value: Math.round(currentHeight),
            type: "number",
            min: 1,
            max: 10000,
            step: 1,
          },
        ],
        (fieldId, value) => {
          this.applyToWidgets([widget], fieldId, value);
        },
      );
      section.appendChild(sizeGroup);

      return section;
    }

    createStylesSection(widget) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("div");
      title.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-primary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      title.textContent = "Внешний вид";
      section.appendChild(title);

      // Получаем цвет фона
      let bgColor = 0x000000;
      if (widget.getBackgroundColor) {
        bgColor = widget.getBackgroundColor();
      } else if (widget._backgroundColor !== undefined) {
        bgColor = widget._backgroundColor;
      } else if (widget.options?.backgroundColor !== undefined) {
        bgColor = widget.options.backgroundColor;
      } else if (widget.backgroundColor !== undefined) {
        bgColor = widget.backgroundColor;
      } else if (widget.color !== undefined) {
        bgColor = widget.color;
      }

      const colorGroup = this.createColorInput(
        "Цвет фона",
        `style-bg-color-${widget.id || Date.now()}`,
        bgColor,
        (value) => {
          this.applyToWidgets([widget], "bg-color", value);
        },
        widget, // Передаем виджет для прямого применения цвета
      );
      section.appendChild(colorGroup);

      const styleActualWidget =
        widget?.constructor?.name === "AudioPlayerWidget" ||
        widget?.type === "AudioPlayerWidget" ||
        widget?.widgetType === "AudioPlayerWidget"
          ? widget
          : widget.originalWidget || widget.widget || widget.content || widget;
      if (
        styleActualWidget.constructor.name === "AudioPlayerWidget" ||
        styleActualWidget.type === "AudioPlayerWidget" ||
        styleActualWidget.widgetType === "AudioPlayerWidget"
      ) {
        const mixerColor =
          styleActualWidget.getMixerColor?.() ??
          styleActualWidget._mixerColor ??
          styleActualWidget.audioData?.mixerColor ??
          0x20a7d0;
        const mixerColorGroup = this.createColorInput(
          "Цвет микшера",
          `style-audio-mixer-color-${styleActualWidget.id || widget.id || Date.now()}`,
          mixerColor,
          (value) => {
            this.applyToWidgets([styleActualWidget], "audio-mixer-color", value);
          },
          null,
        );
        mixerColorGroup.style.cssText =
          "padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(6,182,212,.16),rgba(14,165,233,.10));border:1px solid rgba(6,182,212,.34);margin-bottom:16px;";
        section.appendChild(mixerColorGroup);
      }

      // Получаем радиус углов
      let radius = 0;
      if (widget.getCornerRadius) {
        radius = widget.getCornerRadius();
      } else if (widget._cornerRadius !== undefined) {
        radius = widget._cornerRadius;
      } else if (widget.options?.cornerRadius !== undefined) {
        radius = widget.options.cornerRadius;
      } else if (widget.cornerRadius !== undefined) {
        radius = widget.cornerRadius;
      }

      const radiusGroup = this.createSliderInput(
        "Радиус углов",
        `style-radius-${widget.id || Date.now()}`,
        radius,
        0,
        100,
        1,
        (value) => {
          this.applyToWidgets([widget], "radius", value);
        },
      );
      section.appendChild(radiusGroup);

      let alpha = 1;
      if (widget.getBackgroundAlpha) {
        alpha = widget.getBackgroundAlpha();
      } else if (widget._backgroundAlpha !== undefined) {
        alpha = widget._backgroundAlpha;
      } else if (widget.options?.backgroundAlpha !== undefined) {
        alpha = widget.options.backgroundAlpha;
      } else if (widget.backgroundAlpha !== undefined) {
        alpha = widget.backgroundAlpha;
      } else if (widget.alpha !== undefined) {
        alpha = widget.alpha;
      }

      const alphaGroup = this.createSliderInput(
        "Прозрачность",
        `style-alpha-${widget.id || Date.now()}`,
        alpha,
        0,
        1,
        0.01,
        (value) => {
          this.applyToWidgets([widget], "alpha", value);
        },
      );
      section.appendChild(alphaGroup);

      const borderColor = widget.getBorderColor?.() ?? widget.options?.borderColor ?? 0xffffff;
      const borderColorGroup = this.createColorInput(
        "Цвет рамки",
        `style-border-color-${widget.id || Date.now()}`,
        borderColor,
        (value) => {
          this.applyToWidgets([widget], "border-color", value);
        },
        widget,
      );
      section.appendChild(borderColorGroup);

      const borderWidth = widget.getBorderWidth?.() ?? widget.options?.borderWidth ?? 0;
      const borderWidthGroup = this.createSliderInput(
        "Толщина рамки",
        `style-border-width-${widget.id || Date.now()}`,
        borderWidth,
        0,
        24,
        1,
        (value) => {
          this.applyToWidgets([widget], "border-width", value);
        },
      );
      section.appendChild(borderWidthGroup);

      const borderAlpha = widget.getBorderAlpha?.() ?? widget.options?.borderAlpha ?? 0;
      const borderAlphaGroup = this.createSliderInput(
        "Прозрачность рамки",
        `style-border-alpha-${widget.id || Date.now()}`,
        borderAlpha,
        0,
        1,
        0.01,
        (value) => {
          this.applyToWidgets([widget], "border-alpha", value);
        },
      );
      section.appendChild(borderAlphaGroup);

      return section;
    }

    createZIndexSection(widget) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("div");
      title.style.cssText = `
        font-size: 12px;
        font-weight: 600;
        color: var(--accent-primary);
        margin-bottom: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    `;
      title.textContent = "Слой (Z-Index)";
      section.appendChild(title);

      // Получаем текущий Z-Index
      let currentZIndex = 0;
      if (widget.getZIndex) {
        currentZIndex = widget.getZIndex();
      } else if (widget._zIndex !== undefined) {
        currentZIndex = widget._zIndex;
      } else if (widget.zIndex !== undefined) {
        currentZIndex = widget.zIndex;
      } else if (widget.parent && widget.parent.children) {
        // Если нет прямого zIndex, вычисляем позицию в родителе
        const children = Array.from(widget.parent.children);
        currentZIndex = children.indexOf(widget);
      }

      // Функция для обновления z-index в DOM
      const updateZIndexInDOM = (newZIndex) => {
        const display = document.getElementById(
          `z-index-value-${widget.id || Date.now()}`,
        );
        if (display) display.value = newZIndex;
      };

      // Функция для пересортировки детей в родителе
      const reorderChildren = (targetWidget, newIndex) => {
        if (!targetWidget.parent || !targetWidget.parent.children) return;

        const parent = targetWidget.parent;
        const children = Array.from(parent.children);
        const currentIndex = children.indexOf(targetWidget);

        if (currentIndex === -1) return;

        // Удаляем виджет из текущей позиции
        children.splice(currentIndex, 1);
        // Вставляем на новую позицию
        children.splice(newIndex, 0, targetWidget);

        // Обновляем порядок в parent
        parent.children = children;

        // Перерисовываем (если есть такой метод)
        if (parent.sortChildren) {
          parent.sortChildren();
        }

        // Обновляем display
        updateZIndexInDOM(newIndex);
      };

      // Ввод Z-Index
      // const zIndexGroup = this.createInputGroup(
      //   "Уровень слоя",
      //   [
      //     {
      //       id: `z-index-value-${widget.id || Date.now()}`,
      //       label: "Z-Index",
      //       value: currentZIndex,
      //       type: "number",
      //       min: -100,
      //       max: 1000,
      //       step: 1,
      //     },
      //   ],
      //   (fieldId, value) => {
      //     const zIndex = parseInt(value);
      //     if (!isNaN(zIndex)) {
      //       // Пытаемся установить через setZIndex
      //       if (widget.setZIndex) {
      //         widget.setZIndex(zIndex);
      //       }
      //       // Или через прямое свойство
      //       else if (widget._zIndex !== undefined) {
      //         widget._zIndex = zIndex;
      //       }
      //       else if (widget.zIndex !== undefined) {
      //         widget.zIndex = zIndex;
      //       }
      //       // Если есть родитель, пробуем пересортировать
      //       else if (widget.parent && widget.parent.children) {
      //         const children = Array.from(widget.parent.children);
      //         if (zIndex >= 0 && zIndex < children.length) {
      //           reorderChildren(widget, zIndex);
      //         }
      //       }

      //       // Обновляем отображение
      //       if (widget.parent && widget.parent.sortChildren) {
      //         widget.parent.sortChildren();
      //       }
      //     }
      //   },
      // );
      // section.appendChild(zIndexGroup);

      // Кнопки быстрого управления Z-Index
      const zIndexButtons = document.createElement("div");
      zIndexButtons.style.cssText = `
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 12px;
    `;

      const createZIndexButton = (text, action, isPrimary = false) => {
        const button = document.createElement("button");
        button.className = "btn-modern";
        if (isPrimary) {
          button.style.background = "var(--accent-primary)";
        }
        button.style.cssText = `
            padding: 6px 12px;
            font-size: 11px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 4px;
        `;
        button.textContent = text;
        button.addEventListener("click", action);
        return button;
      };

      // Кнопки управления Z-Index с безопасной реализацией
      // zIndexButtons.appendChild(
      //   createZIndexButton("Шаг наверх", () => {
      //     if (widget.parent && widget.parent.children) {
      //       const children = Array.from(widget.parent.children);
      //       const currentIdx = children.indexOf(widget);
      //       if (currentIdx < children.length - 1) {
      //         reorderChildren(widget, currentIdx + 1);
      //       }
      //     } else if (widget.setZIndex) {
      //       widget.setZIndex(currentZIndex + 1);
      //     } else if (widget._zIndex !== undefined) {
      //       widget._zIndex = currentZIndex + 1;
      //       if (widget.parent && widget.parent.sortChildren) {
      //         widget.parent.sortChildren();
      //       }
      //     }
      //   }),
      // );

      // zIndexButtons.appendChild(
      //   createZIndexButton("На самый низ", () => {
      //     if (widget.parent && widget.parent.children) {
      //       const children = Array.from(widget.parent.children);
      //       const currentIdx = children.indexOf(widget);
      //       if (currentIdx > 0) {
      //         reorderChildren(widget, currentIdx - 1);
      //       }
      //     } else if (widget.setZIndex) {
      //       widget.setZIndex(Math.max(0, currentZIndex - 1));
      //     } else if (widget._zIndex !== undefined) {
      //       widget._zIndex = Math.max(0, currentZIndex - 1);
      //       if (widget.parent && widget.parent.sortChildren) {
      //         widget.parent.sortChildren();
      //       }
      //     }
      //   }),
      // );

      zIndexButtons.appendChild(
        createZIndexButton(
          "На самый верх",
          () => {
            if (widget.parent && widget.parent.children) {
              const children = Array.from(widget.parent.children);
              reorderChildren(widget, children.length - 1);
            } else if (widget.setZIndex) {
              widget.setZIndex(999);
            } else if (widget._zIndex !== undefined) {
              widget._zIndex = 999;
              if (widget.parent && widget.parent.sortChildren) {
                widget.parent.sortChildren();
              }
            }
          },
          true,
        ),
      );

      zIndexButtons.appendChild(
        createZIndexButton("На самый низ", () => {
          if (widget.parent && widget.parent.children) {
            reorderChildren(widget, 1);
          } else if (widget.setZIndex) {
            widget.setZIndex(1);
          } else if (widget._zIndex !== undefined) {
            widget._zIndex = 1;
            if (widget.parent && widget.parent.sortChildren) {
              widget.parent.sortChildren();
            }
          }
        }),
      );

      section.appendChild(zIndexButtons);

      // Добавляем пояснение
      const hint = document.createElement("div");
      hint.style.cssText = `
        font-size: 10px;
        color: var(--text-tertiary);
        margin-top: 8px;
        padding: 4px;
        text-align: center;
    `;
      hint.textContent = "Чем выше число, тем виджет ближе к наблюдателю";
      section.appendChild(hint);

      return section;
    }

    createTransformSection(widget) {
      const section = document.createElement("div");
      section.style.marginBottom = "20px";

      const title = document.createElement("div");
      title.style.cssText = `
            font-size: 12px;
            font-weight: 600;
            color: var(--accent-primary);
            margin-bottom: 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      title.textContent = "Трансформация";
      section.appendChild(title);

      // Проверяем доступность метода scale
      const hasScaleMethod = typeof widget.scale === "function";
      const currentScale = hasScaleMethod ? widget.getCurrentScale?.() || 1 : 1;

      // Кнопки быстрого масштабирования
      if (hasScaleMethod) {
        const scaleButtons = document.createElement("div");
        scaleButtons.style.cssText = `
                display: flex;
                gap: 8px;
                margin-top: 12px;
            `;

        const createScaleButton = (text, action) => {
          const button = document.createElement("button");
          button.className = "btn-modern";
          button.style.cssText = `
                    flex: 1;
                    padding: 6px 12px;
                    font-size: 11px;
                `;
          button.textContent = text;
          button.addEventListener("click", action);
          return button;
        };

        scaleButtons.appendChild(
          createScaleButton("-10%", () => {
            if (widget.scaleBy) {
              widget.scaleBy(0.9);
            } else if (widget.scale) {
              widget.scale(currentScale * 0.9);
            }
          }),
        );

        scaleButtons.appendChild(
          createScaleButton("+10%", () => {
            if (widget.scaleBy) {
              widget.scaleBy(1.1);
            } else if (widget.scale) {
              widget.scale(currentScale * 1.1);
            }
          }),
        );

        section.appendChild(scaleButtons);
      }

      return section;
    }

    createInputGroup(title, fields, onChange) {
      const group = document.createElement("div");
      group.style.marginBottom = "16px";

      const label = document.createElement("div");
      label.style.cssText = `
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      label.textContent = title;
      group.appendChild(label);

      const inputsContainer = document.createElement("div");
      inputsContainer.style.cssText = `
            display: grid;
            grid-template-columns: ${fields.length === 1 ? "1fr" : "1fr 1fr"};
            gap: 8px;
        `;

      fields.forEach((field) => {
        const inputContainer = document.createElement("div");

        const fieldLabel = document.createElement("div");
        fieldLabel.style.cssText = `
                font-size: 10px;
                color: var(--text-secondary);
                margin-bottom: 4px;
                font-weight: 500;
            `;
        fieldLabel.textContent = field.label;
        inputContainer.appendChild(fieldLabel);

        const input = document.createElement("input");
        input.type = field.type;
        input.id = field.id;
        input.value = field.value;
        input.min = field.min;
        input.max = field.max;
        input.step = field.step || 1;
        input.style.cssText = `
                width: 100%;
                padding: 6px 8px;
                background: var(--bg-primary);
                border: 1px solid var(--border-secondary);
                border-radius: 4px;
                color: var(--text-primary);
                font-size: 12px;
                transition: var(--transition);
                box-sizing: border-box;
            `;

        input.addEventListener("focus", () => {
          input.style.borderColor = "var(--accent-primary)";
          input.style.boxShadow = "0 0 0 2px rgba(0, 212, 255, 0.1)";
        });

        input.addEventListener("blur", () => {
          input.style.borderColor = "var(--border-secondary)";
          input.style.boxShadow = "none";
        });

        input.addEventListener("input", (e) => {
          onChange(field.id, e.target.value);
        });

        inputContainer.appendChild(input);
        inputsContainer.appendChild(inputContainer);
      });

      group.appendChild(inputsContainer);
      return group;
    }

    createTextAreaInput(title, id, defaultValue, onChange) {
      const group = document.createElement("div");
      group.style.marginBottom = "16px";

      const label = document.createElement("div");
      label.style.cssText = `
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      label.textContent = title;
      group.appendChild(label);

      const textarea = document.createElement("textarea");
      textarea.id = id;
      textarea.value = defaultValue;
      textarea.style.cssText = `
            width: 100%;
            min-height: 200px;
            padding: 12px;
            background: var(--bg-primary);
            border: 1px solid var(--accent-secondary);
            border-radius: 6px;
            color: var(--text-primary);
            font-size: 14px;
            resize: vertical;
            transition: var(--transition);
            font-family: inherit;
            line-height: 1.4;
            box-sizing: border-box;
        `;

      textarea.addEventListener("focus", () => {
        textarea.style.borderColor = "var(--accent-primary)";
        textarea.style.boxShadow = "0 0 0 2px rgba(0, 212, 255, 0.1)";
      });

      textarea.addEventListener("blur", () => {
        textarea.style.borderColor = "var(--border-secondary)";
        textarea.style.boxShadow = "none";
      });

      textarea.addEventListener("input", (e) => {
        onChange(e.target.value);
      });

      group.appendChild(textarea);
      return group;
    }

    // ИСПРАВЛЕНО: добавлен параметр widget для прямой передачи в openColorPicker
    createColorInput(title, id, defaultValue, onChange, widget = null) {
      const group = document.createElement("div");
      group.style.marginBottom = "16px";

      const label = document.createElement("div");
      label.style.cssText = `
            font-size: 11px;
            color: var(--text-secondary);
            margin-bottom: 8px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      label.textContent = title;
      group.appendChild(label);

      const colorContainer = document.createElement("div");
      colorContainer.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
        `;

      const colorPreview = document.createElement("div");
      colorPreview.style.cssText = `
            width: 40px;
            height: 40px;
            border: 1px solid var(--border-secondary);
            border-radius: 6px;
            cursor: pointer;
            background-color: ${this.rgbToHex(defaultValue)};
            transition: var(--transition);
            flex-shrink: 0;
        `;

      colorPreview.addEventListener("click", () => {
        this.openColorPicker(
          defaultValue,
          (newColor) => {
            // Обновляем превью
            colorPreview.style.backgroundColor = newColor;
            // Применяем цвет к виджету
            onChange(newColor);
            // Принудительно обновляем UI
            setTimeout(() => this.forceRefresh(), 50);
          },
          widget, // Передаем виджет для прямого применения цвета
        );
      });

      colorPreview.addEventListener("mouseenter", () => {
        colorPreview.style.transform = "scale(1.05)";
        colorPreview.style.borderColor = "var(--accent-primary)";
      });

      colorPreview.addEventListener("mouseleave", () => {
        colorPreview.style.transform = "scale(1)";
        colorPreview.style.borderColor = "var(--border-secondary)";
      });

      const colorInfo = document.createElement("div");
      colorInfo.style.cssText = `flex: 1;`;

      const colorValue = document.createElement("div");
      colorValue.style.cssText = `
            font-size: 12px;
            color: var(--text-primary);
            font-weight: 500;
            margin-bottom: 2px;
        `;
      colorValue.textContent = this.rgbToHex(defaultValue);

      const colorHint = document.createElement("div");
      colorHint.style.cssText = `
            font-size: 10px;
            color: var(--text-secondary);
        `;
      colorHint.textContent = "Нажмите для выбора цвета";

      colorInfo.appendChild(colorValue);
      colorInfo.appendChild(colorHint);
      colorContainer.appendChild(colorPreview);
      colorContainer.appendChild(colorInfo);

      group.appendChild(colorContainer);
      return group;
    }

    createSliderInput(title, id, defaultValue, min, max, step, onChange) {
      const group = document.createElement("div");
      group.style.marginBottom = "16px";

      const labelRow = document.createElement("div");
      labelRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        `;

      const label = document.createElement("div");
      label.style.cssText = `
            font-size: 11px;
            color: var(--text-secondary);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
      label.textContent = title;

      const valueDisplay = document.createElement("div");
      valueDisplay.style.cssText = `
            font-size: 11px;
            color: var(--text-secondary);
            background: var(--bg-primary);
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
            min-width: 40px;
            text-align: center;
        `;
      valueDisplay.textContent = defaultValue.toFixed(step < 1 ? 2 : 0);

      labelRow.appendChild(label);
      labelRow.appendChild(valueDisplay);
      group.appendChild(labelRow);

      const slider = document.createElement("input");
      slider.type = "range";
      slider.id = id;
      slider.min = min;
      slider.max = max;
      slider.step = step;
      slider.value = defaultValue;
      slider.style.cssText = `
            width: 100%;
            height: 4px;
            background: var(--border-secondary);
            border-radius: 2px;
            outline: none;
            -webkit-appearance: none;
            cursor: pointer;
        `;

      // Стили для ползунка
      const style = document.createElement("style");
      style.textContent = `
            input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 16px;
                height: 16px;
                background: var(--accent-primary);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 212, 255, 0.4);
                transition: var(--transition);
                border: 2px solid white;
            }
            
            input[type="range"]::-webkit-slider-thumb:hover {
                transform: scale(1.2);
                box-shadow: 0 4px 12px rgba(0, 212, 255, 0.6);
            }
            
            input[type="range"]::-moz-range-thumb {
                width: 16px;
                height: 16px;
                background: var(--accent-primary);
                border-radius: 50%;
                cursor: pointer;
                box-shadow: 0 2px 6px rgba(0, 212, 255, 0.4);
                transition: var(--transition);
                border: 2px solid white;
            }
        `;
      if (!document.getElementById("inspector-slider-styles")) {
        style.id = "inspector-slider-styles";
        document.head.appendChild(style);
      }

      slider.addEventListener("input", (e) => {
        const value = e.target.value;
        valueDisplay.textContent = parseFloat(value).toFixed(step < 1 ? 2 : 0);
        onChange(value);
      });

      group.appendChild(slider);
      return group;
    }

    applyToWidgets(widgets, fieldId, value) {
      if (!widgets || !widgets.length) return;

      widgets.forEach((widget) => {
        try {
          // Проверяем, не является ли виджет обернутым в контейнер
          const actualWidget = widget.originalWidget || widget;

          switch (true) {
            case fieldId.includes("prop-pos-x"):
              const x = parseInt(value) || 0;
              if (actualWidget.setPosition) {
                actualWidget.setPosition(x, actualWidget.y);
              } else {
                actualWidget.x = x;
              }
              break;

            case fieldId.includes("prop-pos-y"):
              const y = parseInt(value) || 0;
              if (actualWidget.setPosition) {
                actualWidget.setPosition(actualWidget.x, y);
              } else {
                actualWidget.y = y;
              }
              break;

            case fieldId.includes("prop-width"):
              const width = parseInt(value) || 100;
              if (actualWidget.resize) {
                const currentSize = this.getWidgetSize(actualWidget);
                actualWidget.resize(width, currentSize.height);
              } else if (actualWidget._width !== undefined) {
                actualWidget._width = width;
              } else if (actualWidget.width !== undefined) {
                actualWidget.width = width;
              }
              if (actualWidget.updateSelection) {
                actualWidget.updateSelection();
              }
              break;

            case fieldId.includes("prop-height"):
              const height = parseInt(value) || 100;
              if (actualWidget.resize) {
                const currentSize = this.getWidgetSize(actualWidget);
                actualWidget.resize(currentSize.width, height);
              } else if (actualWidget._height !== undefined) {
                actualWidget._height = height;
              } else if (actualWidget.height !== undefined) {
                actualWidget.height = height;
              }
              if (actualWidget.updateSelection) {
                actualWidget.updateSelection();
              }
              break;

            case fieldId.includes("bg-color"):
              const color = this.hexToRgb(value);
              if (color !== null) {
                if (actualWidget.setBackgroundColor) {
                  actualWidget.setBackgroundColor(color);
                } else if (actualWidget.setColor) {
                  actualWidget.setColor(color);
                } else if (actualWidget.backgroundColor !== undefined) {
                  actualWidget.backgroundColor = color;
                } else if (
                  actualWidget.options?.backgroundColor !== undefined
                ) {
                  actualWidget.options.backgroundColor = color;
                }
                if (actualWidget.updateSelection) {
                  actualWidget.updateSelection();
                }
              }
              break;

            case fieldId.includes("border-color"):
              const borderColor = this.hexToRgb(value);
              if (borderColor !== null) {
                this.applyBorderSetting(widget, "color", borderColor);
              }
              break;

            case fieldId.includes("border-width"):
              const borderWidth = parseInt(value);
              if (!isNaN(borderWidth)) {
                this.applyBorderSetting(widget, "width", borderWidth);
              }
              break;

            case fieldId.includes("border-alpha"):
              const borderAlpha = parseFloat(value);
              if (!isNaN(borderAlpha)) {
                this.applyBorderSetting(widget, "alpha", borderAlpha);
              }
              break;

            case fieldId.includes("bg-gradient"):
              if (actualWidget.setBackgroundGradient) {
                actualWidget.setBackgroundGradient(value);
              } else {
                const firstColor = value?.colorStops?.[0]?.color || "#000000";
                const fallbackColor = this.hexToRgb(firstColor);
                if (fallbackColor !== null) {
                  if (actualWidget.setBackgroundColor) {
                    actualWidget.setBackgroundColor(fallbackColor);
                  } else if (actualWidget.setColor) {
                    actualWidget.setColor(fallbackColor);
                  }
                }
              }
              if (actualWidget.updateSelection) {
                actualWidget.updateSelection();
              }
              break;

            case fieldId.includes("alpha"):
              const alpha = parseFloat(value);
              if (!isNaN(alpha)) {
                if (actualWidget.setBackgroundAlpha) {
                  actualWidget.setBackgroundAlpha(alpha);
                } else if (actualWidget.setAlpha) {
                  actualWidget.setAlpha(alpha);
                } else if (actualWidget.backgroundAlpha !== undefined) {
                  actualWidget.backgroundAlpha = alpha;
                } else if (
                  actualWidget.options?.backgroundAlpha !== undefined
                ) {
                  actualWidget.options.backgroundAlpha = alpha;
                } else if (actualWidget.alpha !== undefined) {
                  actualWidget.alpha = alpha;
                }
                if (actualWidget.updateSelection) {
                  actualWidget.updateSelection();
                }
              }
              break;

            case fieldId.includes("radius"):
              const radius = parseInt(value);
              if (!isNaN(radius)) {
                if (actualWidget.setCornerRadius) {
                  actualWidget.setCornerRadius(radius);
                } else if (actualWidget.cornerRadius !== undefined) {
                  actualWidget.cornerRadius = radius;
                } else if (actualWidget.options?.cornerRadius !== undefined) {
                  actualWidget.options.cornerRadius = radius;
                }
                if (actualWidget.updateSelection) {
                  actualWidget.updateSelection();
                }
              }
              break;

            case fieldId.includes("video-player-number"):
            case fieldId.includes("audio-player-number"):
              const playerNumber = parseInt(value);
              if (!isNaN(playerNumber)) {
                if (actualWidget.setPlayerNumber) {
                  actualWidget.setPlayerNumber(playerNumber);
                } else if (actualWidget._playerNumber !== undefined) {
                  actualWidget._playerNumber = playerNumber;
                }
              }
              break;

            case fieldId.includes("audio-preset"):
              if (actualWidget.setPresetId) {
                actualWidget.setPresetId(value);
              } else {
                actualWidget._presetId = value || "";
              }
              break;

            case fieldId.includes("audio-volume"):
              const volume = Math.max(0, Math.min(1, parseFloat(value) / 100));
              if (!isNaN(volume)) {
                actualWidget.volume = volume;
                if (actualWidget.audioElement) actualWidget.audioElement.volume = volume;
              }
              break;

            case fieldId.includes("audio-mixer-color"):
              const mixerColor = this.hexToRgb(value);
              if (mixerColor !== null) {
                if (actualWidget.setMixerColor) {
                  actualWidget.setMixerColor(mixerColor);
                } else {
                  actualWidget._mixerColor = mixerColor;
                  actualWidget.redraw?.();
                  actualWidget.drawBars?.();
                }
                actualWidget.updateSelection?.();
              }
              break;

            case fieldId.includes("analog-clock-face"):
              actualWidget.setCustomFace?.(value);
              actualWidget.updateSelection?.();
              break;

            case fieldId.includes("analog-clock-hour-hand"):
              actualWidget.setCustomHourHand?.(value);
              actualWidget.updateSelection?.();
              break;

            case fieldId.includes("analog-clock-minute-hand"):
              actualWidget.setCustomMinuteHand?.(value);
              actualWidget.updateSelection?.();
              break;

            case fieldId.includes("analog-clock-second-hand"):
              actualWidget.setCustomSecondHand?.(value);
              actualWidget.updateSelection?.();
              break;

            case fieldId.includes("analog-clock-hands-scale"):
              actualWidget.setCustomHandsScale?.(value);
              actualWidget.updateSelection?.();
              break;

            case fieldId.includes("analog-clock-second-visible"):
              actualWidget.setCustomSecondHandVisible?.(value);
              actualWidget.updateSelection?.();
              break;

            case fieldId.includes("widget-effect"):
              actualWidget.setEffectPreset?.(value);
              break;

            case fieldId.includes("floor-source"):
              actualWidget.setSourceUrl?.(value);
              break;

            case fieldId.includes("floor-current"):
              actualWidget.setFloor?.(Number(value), false);
              break;

            case fieldId.includes("floor-direction"):
              actualWidget.setDirection?.(value);
              break;

            case fieldId.includes("video-panel-id"):
              if (actualWidget.setPanelId) {
                actualWidget.setPanelId(value);
              } else if (actualWidget._panelId !== undefined) {
                actualWidget._panelId = value;
              }
              break;

            case fieldId.includes("video-display-time"):
              const seconds = parseInt(value);
              if (!isNaN(seconds)) {
                if (actualWidget.setImageDisplayTime) {
                  actualWidget.setImageDisplayTime(seconds);
                } else if (actualWidget._imageDisplayTime !== undefined) {
                  actualWidget._imageDisplayTime = seconds;
                }
              }
              break;
          }
        } catch (error) {
          console.warn("Ошибка применения свойства к виджету:", error);
        }
      });

      // Немедленное обновление UI
      setTimeout(() => this.detectSelectionChange(), 50);
    }

    getWidgetWidth(widget) {
      if (widget.getSize) {
        return widget.getSize().width;
      } else if (widget._width !== undefined) {
        return widget._width;
      } else if (widget.width !== undefined) {
        return widget.width;
      }
      return 100;
    }

    getWidgetHeight(widget) {
      if (widget.getSize) {
        return widget.getSize().height;
      } else if (widget._height !== undefined) {
        return widget._height;
      } else if (widget.height !== undefined) {
        return widget.height;
      }
      return 100;
    }

    getWidgetSize(widget) {
      return {
        width: this.getWidgetWidth(widget),
        height: this.getWidgetHeight(widget),
      };
    }

    // В классе RealTimeInspector

    selectSingleWidget(widget) {
      if (this.originalSelectWidget) {
        this.originalSelectWidget(widget);
      } else if (this.editor.selectWidget) {
        this.editor.selectWidget(widget);
      }

      // Уведомляем о выборе видеовиджета
      if (
        widget &&
        widget.constructor &&
        widget.constructor.name === "VideoWidget"
      ) {
        if (window.onVideoWidgetSelected) {
          window.onVideoWidgetSelected(widget);
        }
      } else if (
        widget?.constructor?.name === "AudioPlayerWidget" ||
        widget?.type === "AudioPlayerWidget"
      ) {
        window.onAudioWidgetSelected?.(widget);
      } else if (window.onVideoWidgetDeselected) {
        // Если выбран не видеовиджет, сбрасываем фильтр
        window.onVideoWidgetDeselected();
      }
    }

    selectAllWidgets() {
      if (this.editor && this.editor.children) {
        const allWidgets = Array.from(this.editor.children).filter(
          (child) => child && typeof child === "object",
        );

        if (allWidgets.length > 0) {
          if (this.originalSelectMultiple) {
            this.originalSelectMultiple(allWidgets);
          } else if (this.editor.selectMultiple) {
            this.editor.selectMultiple(allWidgets);
          }
          this.onSelectionChanged(allWidgets);
          console.log(`✅ Выбрано всех виджетов: ${allWidgets.length}`);
        }
      }
    }

    // В RealTimeInspector, обновите метод deselectAll
    deselectAll() {
      if (this.originalDeselectAll) {
        this.originalDeselectAll();
      } else if (this.editor.deselectAll) {
        this.editor.deselectAll();
      }
      this.onSelectionChanged([]);

      // Сбрасываем фильтр при снятии выделения
      if (window.onVideoWidgetDeselected) {
        window.onVideoWidgetDeselected();
      }
      window.onAudioWidgetSelectionChanged?.();
    }

    forceRefresh() {
      console.log("🔄 Принудительное обновление инспектора");
      this.detectSelectionChange();

      const refreshBtn = document.getElementById("inspector-refresh");
      if (refreshBtn) {
        refreshBtn.style.transform = "rotate(360deg)";
        setTimeout(() => {
          refreshBtn.style.transform = "rotate(0deg)";
        }, 300);
      }
    }

    getWidgetTypeName(widget) {
      const names = {
        DraggableWidget: "Перетаскиваемый виджет",
        AnalogClockWidget: "Аналоговые часы",
        DigitalClockWidget: "Цифровые часы",
        CalendarWidget: "Календарь",
        WeatherWidget: "Погода",
        TrafficWidget: "Трафик",
        RatesWidget: "Курсы валют",
        MetalsWidget: "Металлы",
        NewsWidget: "Новости",
        CompanyWidget: "Компания",
        SimpleRectWidget: "Видео",
        VideoWidget: "Видео",
        TextWidget: "Текст",
        ImageWidget: "Изображение",
        DirectionFloorWidget: "Этаж",
        ShapeWidget: "Геометрическая форма",
        DrawingWidget: "Рисовалка",
        AudioPlayerWidget: "Аудиоплеер",
      };

      return (
        names[widget.type] ||
        names[widget.constructor.name] ||
        widget.constructor.name ||
        "Виджет"
      );
    }

    rgbToHex(rgb) {
      if (typeof rgb === "string") {
        if (rgb.startsWith("#")) {
          return rgb;
        }
        // Если это строка с числом (например, "255" или "0xff0000")
        rgb = parseInt(rgb);
      }

      if (typeof rgb === "number") {
        // Преобразуем число в HEX
        let hex = rgb.toString(16);
        while (hex.length < 6) {
          hex = "0" + hex;
        }
        return "#" + hex;
      }

      return "#000000";
    }

    hexToRgb(hex) {
      if (typeof hex !== "string") return null;

      hex = hex.replace(/^#/, "");

      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }

      const num = parseInt(hex, 16);
      return isNaN(num) ? null : num;
    }

    onSelectionChanged(widgets) {
      this.selectedWidgets = Array.isArray(widgets) ? widgets : [];
      this.updateInspectorUI();
    }

    updateSelectedWidgets() {
      this.selectedWidgets = this.getCurrentSelection();
      this.updateInspectorUI();
    }

    show() {
      this.isInspectorVisible = true;
      const inspectorPanel = document.getElementById("inspector-panel");
      if (inspectorPanel) {
        inspectorPanel.style.display = "flex";
      }
      this.detectSelectionChange();
    }

    hide() {
      this.isInspectorVisible = false;
      const inspectorPanel = document.getElementById("inspector-panel");
      if (inspectorPanel) {
        inspectorPanel.style.display = "none";
      }
    }

    toggle() {
      if (this.isInspectorVisible) {
        this.hide();
      } else {
        this.show();
      }
    }

    destroy() {
      this.stopAutoUpdate();

      // Восстанавливаем оригинальные методы редактора
      if (this.originalSelectWidget) {
        this.editor.selectWidget = this.originalSelectWidget;
      }
      if (this.originalDeselectAll) {
        this.editor.deselectAll = this.originalDeselectAll;
      }
      if (this.originalAddToSelection) {
        this.editor.addToSelection = this.originalAddToSelection;
      }
      if (this.originalSelectMultiple) {
        this.editor.selectMultiple = this.originalSelectMultiple;
      }

      // Удаляем модальное окно выбора цвета
      const colorModal = document.getElementById(
        "inspector-color-picker-modal",
      );
      if (colorModal) {
        colorModal.remove();
      }

      // Удаляем стили слайдера
      const sliderStyles = document.getElementById("inspector-slider-styles");
      if (sliderStyles) {
        sliderStyles.remove();
      }

      console.log("🗑️ Инспектор уничтожен");
    }
  }

  // Автоматическая инициализация инспектора
  function initializeInspector(editor, app) {
    if (!editor || !app) {
      console.warn(
        "⚠️ Editor или App не доступны для инициализации инспектора",
      );
      return null;
    }

    console.log("🚀 Инициализация RealTime Inspector...");

    const inspector = new RealTimeInspector(editor, app);

    // Сохраняем инспектор в глобальной области видимости для отладки
    window.inspector = inspector;

    console.log("✅ RealTime Inspector создан и запущен");
    return inspector;
  }

  // Экспортируем функцию инициализации
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { RealTimeInspector, initializeInspector };
  } else if (typeof window !== "undefined") {
    window.RealTimeInspector = RealTimeInspector;
    window.initializeInspector = initializeInspector;
  }
  initializeInspector(editor, app);
  // Логика для кнопки предпросмотра
  document.getElementById("preview").addEventListener("click", function () {
    togglePreviewMode();
  });

  let isPreviewMode = false;
  let originalGridState = false;

  function togglePreviewMode() {
    isPreviewMode = !isPreviewMode;

    if (isPreviewMode) {
      // Вход в режим предпросмотра
      enterPreviewMode();
    } else {
      // Выход из режима предпросмотра
      exitPreviewMode();
    }
  }

  document
    .getElementById("deselect-all-widets")
    .addEventListener("click", () => {
      if (editor && editor.deselectAllWidgets) {
        editor.deselectAllWidgets();
      }
    });

  function enterPreviewMode() {
    console.log("🔄 Вход в режим предпросмотра");

    // Сохраняем состояние вида ДО превью
    if (editor && editor.saveViewState) {
      editor.saveViewState();
    }
    const modal = window.modalConstructor;
    modal.style.display = "none";
    editor.setPreview(true);

    // Сохраняем состояние сетки ДО входа в превью
    const gridEnabledCheckbox = document.getElementById("grid-enabled");
    if (gridEnabledCheckbox) {
      originalGridState = gridEnabledCheckbox;
    }

    // Скрываем левую и правую панели
    const leftSidebar = document.getElementById("left-sidebar");
    const widgetsPanel = document.getElementById("widgets-panel");
    const inspectorPanel = document.getElementById("inspector-panel");

    if (leftSidebar) leftSidebar.style.display = "none";
    if (widgetsPanel) widgetsPanel.style.display = "none";
    if (inspectorPanel) inspectorPanel.style.display = "none";

    // Выключаем сетку через редактор
    if (editor && editor.toggleGrid) {
      console.log("Выключаем сетку в редакторе");
      editor.toggleGrid(false);
    }

    // Обновляем чекбокс если он есть
    if (gridEnabledCheckbox) {
      gridEnabledCheckbox.checked = false;
    }

    // Снимаем выделение со всех виджетов
    if (editor && editor.deselectAllWidgets) {
      editor.deselectAllWidgets();
    }

    // Обновляем текст кнопки
    const previewButton = document.getElementById("preview");
    if (previewButton) {
      previewButton.innerHTML = "👁️‍🗨️";
      previewButton.title = "Выйти из предпросмотра";
    }

    // Увеличиваем область canvas
    const canvasArea = document.getElementById("canvas-area");
    if (canvasArea) {
      canvasArea.style.flex = "1";
    }

    editor.resetView();
  }

  function exitPreviewMode() {
    console.log("🔄 Выход из режима предпросмотра");

    editor.setPreview(false);

    // Показываем левую и правую панели
    const leftSidebar = document.getElementById("left-sidebar");
    const widgetsPanel = document.getElementById("widgets-panel");
    const inspectorPanel = document.getElementById("inspector-panel");

    if (leftSidebar) leftSidebar.style.display = "flex";
    if (widgetsPanel) widgetsPanel.style.display = "flex";
    if (inspectorPanel) inspectorPanel.style.display = "flex";

    // Восстанавливаем состояние сетки КАК БЫЛО ДО ПРЕВЬЮ
    console.log("Восстанавливаем состояние сетки:", originalGridState);
    if (editor && editor.toggleGrid) {
      editor.toggleGrid(originalGridState);
    }

    // Обновляем чекбокс если он есть
    const gridEnabledCheckbox = document.getElementById("grid-enabled");
    if (gridEnabledCheckbox) {
      gridEnabledCheckbox.checked = originalGridState;
    }

    // Обновляем текст кнопки
    const previewButton = document.getElementById("preview");
    if (previewButton) {
      previewButton.innerHTML = "👁️";
      previewButton.title = "Предпросмотр";
    }

    // Восстанавливаем нормальный размер canvas area
    const canvasArea = document.getElementById("canvas-area");
    if (canvasArea) {
      // Размер восстановится автоматически благодаря flexbox
    }

    // ===== ВОССТАНАВЛИВАЕМ СОСТОЯНИЕ ВИДА =====
    setTimeout(() => {
      if (editor && editor.restoreViewState) {
        console.log("🔄 Восстанавливаем состояние вида");
        editor.restoreViewState();
      }
    }, 100);
  }

  // Также добавим обработчик для выхода по ESC
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && isPreviewMode) {
      exitPreviewMode();
      isPreviewMode = false;
    }
  });
  // Логика для кнопки масштаба
  document.getElementById("massa").addEventListener("click", function (event) {
    toggleZoom(event);
  });

  let currentZoom = 1;
  const zoomLevels = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];
  let currentZoomIndex = 3;

  function toggleZoom(event) {
    currentZoomIndex = (currentZoomIndex + 1) % zoomLevels.length;
    currentZoom = zoomLevels[currentZoomIndex];

    // Получаем центр экрана для масштабирования
    const centerPoint = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    applyZoom(currentZoom, centerPoint);
  }

  function applyZoom(zoomLevel, centerPoint = null) {
    const zoomButton = document.getElementById("massa");
    if (zoomButton) {
      const percentage = Math.round(zoomLevel * 100);
      zoomButton.innerHTML = `🔍 ${percentage}%`;
      zoomButton.title = `Масштаб: ${percentage}%`;
    }

    if (editor && editor.setZoom) {
      editor.setZoom(zoomLevel, centerPoint);
    }
  }

  // Горячие клавиши с масштабированием относительно центра мыши
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && !event.shiftKey) {
      if (event.key === "=" || event.key === "+") {
        event.preventDefault();
        zoomIn();
      } else if (event.key === "-") {
        event.preventDefault();
        zoomOut();
      } else if (event.key === "0") {
        event.preventDefault();
        resetZoom();
      }
    }
  });

  // Масштабирование колесом мыши (относительно позиции мыши)
  document.addEventListener(
    "wheel",
    function (event) {
      if (event.ctrlKey) {
        event.preventDefault();

        const mousePoint = {
          x: event.clientX,
          y: event.clientY,
        };

        if (event.deltaY < 0) {
          // Прокрутка вверх - увеличить относительно мыши
          if (currentZoomIndex < zoomLevels.length - 1) {
            currentZoomIndex++;
            currentZoom = zoomLevels[currentZoomIndex];
            applyZoom(currentZoom, mousePoint);
          }
        } else {
          // Прокрутка вниз - уменьшить относительно мыши
          if (currentZoomIndex > 0) {
            currentZoomIndex--;
            currentZoom = zoomLevels[currentZoomIndex];
            applyZoom(currentZoom, mousePoint);
          }
        }
      }
    },
    { passive: false },
  );

  function zoomIn() {
    if (currentZoomIndex < zoomLevels.length - 1) {
      currentZoomIndex++;
      currentZoom = zoomLevels[currentZoomIndex];

      // Увеличить относительно центра экрана
      const centerPoint = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };

      applyZoom(currentZoom, centerPoint);
    }
  }

  function zoomOut() {
    if (currentZoomIndex > 0) {
      currentZoomIndex--;
      currentZoom = zoomLevels[currentZoomIndex];

      // Уменьшить относительно центра экрана
      const centerPoint = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      };

      applyZoom(currentZoom, centerPoint);
    }
  }

  function resetZoom() {
    currentZoomIndex = 3;
    currentZoom = 1;

    // Сбросить к центру экрана
    const centerPoint = {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
    };

    applyZoom(currentZoom, centerPoint);
  }

  // Инициализируем список черновиков при загрузке
  updateDraftList();
})();
