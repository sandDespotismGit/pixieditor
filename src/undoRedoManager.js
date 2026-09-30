export default class UndoRedoManager {
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

      const currentAction = this.actions[this.currentPos];
      if (
        currentAction &&
        JSON.stringify(currentAction.data) === JSON.stringify(currentState)
      ) {
        console.log("⏭️ Состояние не изменилось, пропускаем");
        return;
      }

      if (this.currentPos < this.actions.length - 1) {
        this.actions = this.actions.slice(0, this.currentPos + 1);
      }

      this.actions.push({
        data: JSON.parse(JSON.stringify(currentState)),
        desc: description,
        time: Date.now(),
      });

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
        console.log("✅ Состояние восстановлено без видео-фона");
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
      setTimeout(() => (this.undoBtn.style.transform = "rotate(180deg)"), 100);
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

      console.log(`↪️ Повтор к [${this.currentPos + 1}]: ${state.desc}`);

      this.saveToStorage();
      this.updateButtons();
      this.show();

      this.redoBtn.style.transform = "rotate(180deg) scale(0.9)";
      setTimeout(() => (this.redoBtn.style.transform = "rotate(180deg)"), 100);
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
        this.currentPos = data.currentPos !== undefined ? data.currentPos : -1;
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
