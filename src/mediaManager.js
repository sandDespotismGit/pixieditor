export default class MediaManager {
        constructor() {
          this.panelId = getPanelId();
          this.apiBaseUrl = getApiBaseUrl();
          this.selectedFiles = new Set();
          this.data = [];
          this.currentMedia = null;
          this.fileToUpload = null;
          this.filesToUpload = [];
          this.currentPlayerNumber = null;
          this.currentShowTime = 10;
          this.currentMultiplexor = 1;
          this.editingFile = null;
          this.selected_media_file = "";
          this.currentPlayerFilter = null;

          if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", () => this.init());
          } else {
            this.init();
          }
        }

        init() {
          this.bindEvents();
          this.loadMediaFiles();
        }

        bindEvents() {
          // Загрузка файлов
          const fileInput = document.getElementById("media-file");
          const fileDropArea = document.getElementById("file-drop-area");
          const uploadBtn = document.getElementById("upload-media");
          // Устанавливаем начальное состояние для времени показа
          const mediaTypeSelect = document.getElementById("media-type");

          const audioPlayer = document.getElementById("audio-player");
          const playBtn = document.getElementById("play-media");
          const pauseBtn = document.getElementById("pause-media");
          const stopBtn = document.getElementById("stop-media");
          const volumeControl = document.getElementById("volume-control");
          const loopCheckbox = document.getElementById("loop-media");
          const muteCheckbox = document.getElementById("mute-media");

          if (audioPlayer) {
            audioPlayer.addEventListener("ended", () => {
              // Если не зациклено, останавливаем
              if (!loopCheckbox || !loopCheckbox.checked) {
                this.stopMediaInPanel();
              }
            });
          }

          if (playBtn) {
            playBtn.addEventListener("click", () => {
              if (this.currentAudio && audioPlayer) {
                audioPlayer.play().catch((e) => console.error("Ошибка:", e));
              } else if (audioPlayer && audioPlayer.src) {
                audioPlayer.play().catch((e) => console.error("Ошибка:", e));
              }
            });
          }

          if (pauseBtn) {
            pauseBtn.addEventListener("click", () => {
              if (audioPlayer) audioPlayer.pause();
            });
          }

          if (stopBtn) {
            stopBtn.addEventListener("click", () => {
              if (audioPlayer) {
                audioPlayer.pause();
                audioPlayer.currentTime = 0;
              }
            });
          }

          if (volumeControl) {
            volumeControl.addEventListener("input", (e) => {
              const volume = e.target.value / 100;
              if (audioPlayer) audioPlayer.volume = volume;
              document.getElementById("volume-value").textContent =
                `${e.target.value}%`;
            });
          }

          if (loopCheckbox) {
            loopCheckbox.addEventListener("change", (e) => {
              if (audioPlayer) audioPlayer.loop = e.target.checked;
            });
          }

          if (muteCheckbox) {
            muteCheckbox.addEventListener("change", (e) => {
              if (audioPlayer) audioPlayer.muted = e.target.checked;
            });
          }

          if (mediaTypeSelect) {
            const showTimeGroup = document.getElementById("show-time-group");
            const playerNumberGroup = document.getElementById(
              "player-number-group",
            );

            // При загрузке страницы показываем только нужные поля
          }

          fileDropArea.addEventListener("click", () => {
            console.log("curr", this.currentPlayerNumber);
            if (this.currentPlayerFilter == null) {
              showNotification(
                "warning",
                "Для загрузки необходимо выбрать проигрыватель",
              );
              return;
            } else fileInput.click();
          });
          fileInput.addEventListener("change", (e) => this.handleFileSelect(e));

          // Drag and drop для загрузки (оставляем только для загрузки файлов)
          fileDropArea.addEventListener("dragover", (e) => {
            e.preventDefault();
            fileDropArea.classList.add("drag-over");
          });

          fileDropArea.addEventListener("dragleave", () => {
            fileDropArea.classList.remove("drag-over");
          });

          fileDropArea.addEventListener("drop", (e) => {
            e.preventDefault();
            fileDropArea.classList.remove("drag-over");
          });

          // Показ/скрытие поля времени показа в зависимости от типа медиа
          mediaTypeSelect.addEventListener("change", (e) => {
            const playerNumberGroup = document.getElementById(
              "player-number-group",
            );
            const showTimeGroup = document.getElementById("show-time-group");

            // Скрываем оба поля по умолчанию
            playerNumberGroup.style.display = "none";
            showTimeGroup.style.display = "none";

            // Показываем нужные поля в зависимости от типа
            if (e.target.value === "video") {
              playerNumberGroup.style.display = "block"; // Только номер проигрывателя для видео
              // showTimeGroup остается скрытым
            } else if (e.target.value === "image") {
              showTimeGroup.style.display = "block"; // Только время показа для изображений
              // playerNumberGroup остается скрытым
            }
            // Для audio оба поля остаются скрытыми
          });

          // Управление временем показа
          document
            .getElementById("decrease-show-time")
            .addEventListener("click", () => {
              this.adjustShowTime(-1);
            });

          document
            .getElementById("increase-show-time")
            .addEventListener("click", () => {
              this.adjustShowTime(1);
            });

          // document
          //   .getElementById("show-time-input")
          //   .addEventListener("input", (e) => {
          //     const value = parseInt(e.target.value);
          //     console.log("value", value);
          //     if (value >= 1 && value <= 999) {
          //       this.currentShowTime = value;
          //       this.updateShowTimeDisplay();
          //     }
          //   });

          // Управление мультиплексором
          document
            .getElementById("decrease-multiplexor")
            .addEventListener("click", () => {
              this.adjustMultiplexor(-1);
            });

          document
            .getElementById("increase-multiplexor")
            .addEventListener("click", () => {
              this.adjustMultiplexor(1);
            });

          document
            .getElementById("multiplexor-input")
            .addEventListener("input", (e) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= 99) {
                this.currentMultiplexor = value;
                this.updateMultiplexorDisplay();
              }
            });

          // Управление номером проигрывателя при загрузке
          document
            .getElementById("decrease-player-number")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              this.adjustPlayerNumber(-1);
            });

          document
            .getElementById("increase-player-number")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              this.adjustPlayerNumber(1);
            });

          document
            .getElementById("player-number-input")
            .addEventListener("input", (e) => {
              const value = parseInt(e.target.value);
              if (value >= 1 && value <= 99) {
                this.currentPlayerNumber = value;
                this.updatePlayerNumberDisplay();
              }
            });

          // Кнопка загрузки
          uploadBtn.addEventListener("click", () => this.uploadFile());

          // Обновление списка файлов
          document
            .getElementById("refresh-media")
            .addEventListener("click", () => {
              this.loadMediaFiles();
              showNotification("success", "Список файлов обновлен");
            });

          // Фильтрация файлов
          document
            .getElementById("media-filter")
            .addEventListener("change", () => this.renderMediaList());

          // Удаление файлов
          document
            .getElementById("delete-selected-files")
            .addEventListener("click", () => this.deleteSelectedFiles());

          // Медиаплеер
          document
            .getElementById("play-media")
            .addEventListener("click", () => this.playSelectedMediaInPanel());
          document
            .getElementById("pause-media")
            .addEventListener("click", () => this.pauseMediaInPanel());
          document
            .getElementById("stop-media")
            .addEventListener("click", () => this.stopMediaInPanel());
          document
            .getElementById("volume-control")
            .addEventListener("input", (e) =>
              this.setVolumeInPanel(e.target.value),
            );
          document
            .getElementById("mute-media")
            .addEventListener("change", (e) =>
              this.toggleMuteInPanel(e.target.checked),
            );

          // Открытие медиатеки
          document
            .getElementById("open-media-library")
            .addEventListener("click", async () => {
              await this.loadMediaFiles();
              const section = document.getElementById("media-library-section");
              if (section.classList.contains("collapsed")) {
                section.classList.remove("collapsed");
                document.querySelector(
                  '[data-target="media-library-section"] .section-toggle',
                ).textContent = "−";
              }
            });

          // Закрытие всех меню при клике вне их
          document.addEventListener("click", (e) => {
            if (
              !e.target.closest(".media-actions") &&
              !e.target.closest(".file-menu-dropdown")
            ) {
              this.closeAllMenus();
            }
          });
        }

        filterByPlayerNumber(playerNumber) {
          this.currentPlayerFilter = playerNumber;

          console.log(
            `🔍 Фильтр по номеру проигрывателя: ${playerNumber || "все файлы"}`,
          );

          // Перерисовываем список
          this.renderMediaList();

          // Обновляем статистику
          this.updateStats();

          // Показываем уведомление о примененном фильтре
          if (playerNumber) {
            window.goToMediaHandler();
            document.getElementById("player-number-display").textContent =
              playerNumber;
          }
        }

        adjustShowTime(delta) {
          let newValue = this.currentShowTime + delta;
          if (newValue < 1) newValue = 1;
          if (newValue > 999) newValue = 999;

          this.currentShowTime = newValue;
          this.updateShowTimeDisplay();
        }

        updateShowTimeDisplay() {
          document.getElementById("show-time-display").textContent =
            this.currentShowTime;
          document.getElementById("show-time-input").value =
            this.currentShowTime;
        }

        adjustMultiplexor(delta) {
          let newValue = this.currentMultiplexor + delta;
          if (newValue < 1) newValue = 1;
          if (newValue > 99) newValue = 99;

          this.currentMultiplexor = newValue;
          this.updateMultiplexorDisplay();
        }

        updateMultiplexorDisplay() {
          document.getElementById("multiplexor-display").textContent =
            this.currentMultiplexor;
          document.getElementById("multiplexor-input").value =
            this.currentMultiplexor;
        }

        // В начале adjustPlayerNumber:
        adjustPlayerNumber(delta) {
          console.log(
            "adjustPlayerNumber CALLED, delta:",
            delta,
            "call stack:",
          );
          console.trace(); // Покажет, откуда пришел вызов

          let newValue = this.currentPlayerNumber + delta;
          if (newValue < 1) newValue = 1;
          if (newValue > 99) newValue = 99;

          this.currentPlayerNumber = newValue;
          this.updatePlayerNumberDisplay();
        }

        updatePlayerNumberDisplay() {
          console.log("Updating display with value:", this.currentPlayerNumber);
          document.getElementById("player-number-display").textContent =
            this.currentPlayerNumber;
          document.getElementById("player-number-input").value =
            this.currentPlayerNumber;
        }

        async loadMediaFiles() {
          try {
            const mediaList = document.getElementById("media-list-container");
            if (mediaList) {
              mediaList.innerHTML =
                '<div class="media-list-loading">Загрузка файлов...</div>';
            }

            if (!this.panelId) {
              throw new Error("panel_id не найден в URL");
            }

            const response = await fetch(
              `${this.apiBaseUrl}/api/new_file/${this.panelId}`,
              {
                headers: {
                  Accept: "application/json",
                },
              },
            );

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.data = await response.json();

            console.log("📁 Загружены файлы", this.data);

            // Рендерим библиотеку (только изображения и видео)
            this.renderMediaList();

            // Рендерим аудиоплеер (только аудио)
            this.renderAudioPlayer();

            this.updateStats();
          } catch (error) {
            console.error("Ошибка загрузки файлов:", error);
            const mediaList = document.getElementById("media-list-container");
            if (mediaList) {
              mediaList.innerHTML = `
                          <div class="media-list-empty">
                            <div class="empty-icon">⚠️</div>
                            <div>Ошибка загрузки файлов</div>
                            <div style="font-size: var(--font-size-sm); margin-top: 8px;">${error.message}</div>
                          </div>
                          `;
            }
            if (typeof showNotification === "function") {
              showNotification("error", "Ошибка загрузки файлов");
            }
          }
        }

        escapeFileUrl(url) {
          console.log("url", url);
          if (!url) return "";

          try {
            // Если URL уже абсолютный (начинается с http:// или https://)
            if (url.startsWith("http://") || url.startsWith("https://")) {
              return url; // возвращаем как есть, без дополнительного кодирования
            }

            // Формируем полный URL
            const baseUrl = this.apiBaseUrl.replace(/\/$/, "");
            const cleanUrl = url.replace(/^\//, "");
            const fullUrl = baseUrl + "/" + cleanUrl;

            // ВОЗВРАЩАЕМ КАК ЕСТЬ, НЕ КОДИРУЕМ
            // Браузер сам правильно обработает уже закодированный URL
            return fullUrl;
          } catch (e) {
            console.error("Error in URL:", e);
            return url;
          }
        }

        getFileType(extension) {
          const videoExt = ["mp4", "avi", "mov", "wmv", "flv", "mkv"];
          const audioExt = ["mp3", "wav", "ogg", "m4a", "flac", "aac", "webm"];
          const imageExt = ["jpg", "jpeg", "png", "gif", "bmp", "webp"];

          if (videoExt.includes(extension)) return "video";
          if (audioExt.includes(extension)) return "audio";
          if (imageExt.includes(extension)) return "image";
          return "other";
        }

        closeAllMenus() {
          document.querySelectorAll(".file-menu-dropdown").forEach((menu) => {
            menu.remove();
          });
        }

        showPlayMenu(file, buttonElement) {
          this.closeAllMenus();

          const playMenu = document.createElement("div");
          playMenu.className = "file-menu-dropdown edit-menu";
          playMenu.style.position = "fixed";

          const buttonRect = buttonElement.getBoundingClientRect();

          playMenu.innerHTML = `

                <div class="edit-menu-content">
                  ${
                    file?.type == "image"
                      ? `<image src="${this.escapeFileUrl(file?.url)}" alt="изображение" style="width: 270px; height: 270px"/> `
                      : `<video  style="width: 270px; height: 270px" autoplay controls muted>
                          <source src="${this.escapeFileUrl(file?.url)}" alt="видео" />
                        </video>`
                  }
                  </div>`;

          // Позиционирование меню
          playMenu.style.left = buttonRect.left + "px";
          playMenu.style.top = buttonRect.top + 5 + "px";

          // Проверка, не выходит ли меню за пределы экрана
          setTimeout(() => {
            const menuRect = playMenu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
              playMenu.style.left =
                window.innerWidth - menuRect.width - 10 + "px";
            }
            if (menuRect.bottom > window.innerHeight) {
              playMenu.style.top = buttonRect.top - menuRect.height - 5 + "px";
            }
          }, 0);

          document.body.appendChild(playMenu);

          // Обработчики для сохранения и отмены
          setTimeout(() => {
            const closeEditMenu = (e) => {
              if (
                !playMenu.contains(e.target) &&
                !buttonElement.contains(e.target)
              ) {
                playMenu.remove();
                document.removeEventListener("click", closeEditMenu);
              }
            };
            document.addEventListener("click", closeEditMenu);
          }, 0);
        }

        createMediaModal(file, blobUrl) {
          const modal = document.createElement("div");
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

          const content = document.createElement("div");
          content.style.cssText = `
            background: rgba(21, 27, 41, 0.95);
            border-radius: 16px;
            padding: 20px;
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow: auto;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        `;

          const header = document.createElement("div");
          header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

          const title = document.createElement("h3");
          title.textContent = file.displayName;
          title.style.cssText = `
            color: var(--accent-primary);
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        `;

          const closeBtn = document.createElement("button");
          closeBtn.textContent = "✕";
          closeBtn.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
          closeBtn.onmouseover = () => {
            closeBtn.style.background = "rgba(255,255,255,0.2)";
            closeBtn.style.transform = "scale(1.05)";
          };
          closeBtn.onmouseout = () => {
            closeBtn.style.background = "rgba(255,255,255,0.1)";
            closeBtn.style.transform = "scale(1)";
          };

          header.appendChild(title);
          header.appendChild(closeBtn);

          // Создаем медиа-элемент
          const mediaElement =
            file.type === "video"
              ? document.createElement("video")
              : document.createElement("audio");

          mediaElement.controls = true;
          mediaElement.src = blobUrl;
          mediaElement.style.width = "100%";
          mediaElement.style.borderRadius = "12px";
          mediaElement.style.backgroundColor = "#000";

          if (file.type === "video") {
            mediaElement.style.maxHeight = "50vh";
          } else {
            mediaElement.style.marginTop = "20px";
          }

          // Добавляем информацию о файле
          const info = document.createElement("div");
          info.style.cssText = `
            margin-top: 16px;
            padding: 12px;
            background: rgba(33, 41, 60, 0.6);
            border-radius: 8px;
            font-size: 12px;
            color: var(--text-secondary);
        `;
          info.innerHTML = `
            <div>📁 ${file.filename}</div>
            ${file.multiplexor > 1 ? `<div>🔄 Мультиплексор: ${file.multiplexor}</div>` : ""}
            ${file.playerNumber ? `<div>🎮 Проигрыватель: ${file.playerNumber}</div>` : ""}
        `;

          content.appendChild(header);
          content.appendChild(mediaElement);
          content.appendChild(info);
          modal.appendChild(content);

          // Обработчик закрытия
          const closeModal = () => {
            mediaElement.pause();
            URL.revokeObjectURL(blobUrl);
            modal.remove();
          };

          closeBtn.onclick = closeModal;
          modal.onclick = (e) => {
            if (e.target === modal) closeModal();
          };

          return modal;
        }

        async editFileRequest(data) {
          const response = await fetch(
            `${this.apiBaseUrl}/api/new_file/${data?.id}`,
            {
              method: "PUT",
              headers: {
                accept: "application/json",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(data),
            },
          );

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        showEditMenu(file, buttonElement) {
          this.closeAllMenus();

          const editMenu = document.createElement("div");
          editMenu.className = "file-menu-dropdown edit-menu";
          editMenu.style.position = "fixed";

          const buttonRect = buttonElement.getBoundingClientRect();
          editMenu.innerHTML = `

                <div class="edit-menu-content">
                   ${
                     file?.type == "image"
                       ? `<div class="edit-param-group">
                        <label class="edit-param-label">Время показа (сек)</label>
                        <div class="edit-param-control">
                            <button class="edit-param-btn edit-decrease-show-time">−</button>
                            <input type="number" class="edit-param-input edit-show-time-input" value="${file.time_view}" min="1" max="999">
                            <button class="edit-param-btn edit-increase-show-time">+</button>
                        </div>
                    </div>`
                       : ""
                   }
                    <div class="edit-param-group">
                        <label class="edit-param-label">Количество повторений за цикл</label>
                        <div class="edit-param-control">
                            <button class="edit-param-btn edit-decrease-multiplexor">−</button>
                            <input type="number" class="edit-param-input edit-multiplexor-input" value="${file.count_play}" min="1" max="99">
                            <button class="edit-param-btn edit-increase-multiplexor">+</button>
                        </div>
                    </div>

                    ${
                      file.type === "video"
                        ? `
                        <div class="edit-param-group" style="display:none;">
                            <label class="edit-param-label">Номер проигрывателя</label>
                            <div class="edit-param-control">
                                <button class="edit-param-btn edit-decrease-player-number">−</button>
                                <input type="number" class="edit-param-input edit-player-number-input" value="${file.playerNumber || 1}" min="1" max="99">
                                <button class="edit-param-btn edit-increase-player-number">+</button>
                            </div>
                        </div>
                    `
                        : ""
                    }

                    <div class="edit-menu-actions">
                        <button class="edit-menu-btn cancel-btn">Отмена</button>
                        <button class="edit-menu-btn save-btn">Сохранить</button>
                    </div>
                </div>
            `;

          // Позиционирование меню
          editMenu.style.left = buttonRect.left + "px";
          editMenu.style.top = buttonRect.bottom + 5 + "px";

          // Проверка, не выходит ли меню за пределы экрана
          setTimeout(() => {
            const menuRect = editMenu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
              editMenu.style.left =
                window.innerWidth - menuRect.width - 10 + "px";
            }
            if (menuRect.bottom > window.innerHeight) {
              editMenu.style.top = buttonRect.top - menuRect.height - 5 + "px";
            }
          }, 0);

          document.body.appendChild(editMenu);

          // Настройка обработчиков для кнопок изменения значений
          const showTimeInput = editMenu.querySelector(".edit-show-time-input");
          const multiplexorInput = editMenu.querySelector(
            ".edit-multiplexor-input",
          );
          const playerNumberInput = editMenu.querySelector(
            ".edit-player-number-input",
          );

          editMenu
            .querySelector(".edit-decrease-show-time")
            ?.addEventListener("click", (e) => {
              e.stopPropagation();
              let value = parseInt(showTimeInput.value) - 1;
              if (value < 1) value = 1;
              showTimeInput.value = value;
            });

          editMenu
            .querySelector(".edit-increase-show-time")
            ?.addEventListener("click", (e) => {
              e.stopPropagation();
              let value = parseInt(showTimeInput.value) + 1;
              if (value > 999) value = 999;
              showTimeInput.value = value;
            });

          editMenu
            .querySelector(".edit-decrease-multiplexor")
            ?.addEventListener("click", (e) => {
              e.stopPropagation();
              let value = parseInt(multiplexorInput.value) - 1;
              if (value < 1) value = 1;
              multiplexorInput.value = value;
            });

          editMenu
            .querySelector(".edit-increase-multiplexor")
            ?.addEventListener("click", (e) => {
              e.stopPropagation();
              let value = parseInt(multiplexorInput.value) + 1;
              if (value > 99) value = 99;
              multiplexorInput.value = value;
            });

          if (playerNumberInput) {
            editMenu
              .querySelector(".edit-decrease-player-number")
              ?.addEventListener("click", (e) => {
                e.stopPropagation();
                let value = parseInt(playerNumberInput.value) - 1;
                if (value < 1) value = 1;
                playerNumberInput.value = value;
              });
          }

          // Обработчики для сохранения и отмены
          editMenu
            .querySelector(".cancel-btn")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              editMenu.remove();
            });

          editMenu
            .querySelector(".save-btn")
            .addEventListener("click", async (e) => {
              e.stopPropagation();
              let newShowTime;
              if (file?.type == "image") {
                newShowTime = parseInt(showTimeInput.value);
              }
              const newMultiplexor = parseInt(multiplexorInput.value);
              if (newShowTime < 1 || newShowTime > 999) {
                showNotification(
                  "error",
                  "Время показа должно быть от 1 до 999 секунд",
                );
                return;
              }

              if (newMultiplexor < 1 || newMultiplexor > 99) {
                showNotification(
                  "error",
                  "Мультиплексор должен быть от 1 до 99",
                );
                return;
              }

              const requestData = {
                id: file?.id,
                url: file?.url,
                type: file?.type,
                player_number: file?.player_number,
                count_play: newMultiplexor,
                time_view:
                  file?.type == "image" ? newShowTime : file?.time_view,
                position: file?.position,
                panel_id: file?.panel_id,
              };

              try {
                await this.editFileRequest(requestData);
                editMenu.remove();
                await this.loadMediaFiles();
                showNotification("success", "Параметры файла обновлены");
              } catch (error) {
                console.error("Ошибка обновления параметров файла:", error);
                showNotification(
                  "error",
                  `Ошибка обновления: ${error.message}`,
                );
              }
            });

          setTimeout(() => {
            const closeEditMenu = (e) => {
              if (
                !editMenu.contains(e.target) &&
                !buttonElement.contains(e.target)
              ) {
                editMenu.remove();
                document.removeEventListener("click", closeEditMenu);
              }
            };
            document.addEventListener("click", closeEditMenu);
          }, 0);
        }

        copyFileName(file) {
          navigator.clipboard
            .writeText(file.filename)
            .then(() => {
              showNotification("success", "Имя файла скопировано");
            })
            .catch(() => {
              showNotification("error", "Ошибка при копировании");
            });
        }

        downloadFile(file) {
          const link = document.createElement("a");
          link.href = file.url;
          link.download = file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }

        showDeleteMenu(file, buttonElement) {
          this.closeAllMenus();

          const deleteMenu = document.createElement("div");
          deleteMenu.className = "file-menu-dropdown delete-submenu";
          deleteMenu.style.position = "fixed";

          const buttonRect = buttonElement.getBoundingClientRect();

          deleteMenu.innerHTML = `
                <div class="delete-confirm-header">
                    <span>Удалить файл?</span>
                </div>
                <div class="delete-confirm-text">
                    "${file.url?.split("/")?.[2]}"
                </div>
                <div class="delete-confirm-actions">
                    <button class="menu-item-btn cancel-btn">Отмена</button>
                    <button class="menu-item-btn delete-btn">Удалить</button>
                </div>
            `;

          // Позиционирование меню
          deleteMenu.style.left = buttonRect.left + "px";
          deleteMenu.style.top = buttonRect.bottom + 5 + "px";

          // Проверка, не выходит ли меню за пределы экрана
          setTimeout(() => {
            const menuRect = deleteMenu.getBoundingClientRect();
            if (menuRect.right > window.innerWidth) {
              deleteMenu.style.left =
                window.innerWidth - menuRect.width - 10 + "px";
            }
            if (menuRect.bottom > window.innerHeight) {
              deleteMenu.style.top =
                buttonRect.top - menuRect.height - 5 + "px";
            }
          }, 0);

          document.body.appendChild(deleteMenu);

          deleteMenu
            .querySelector(".cancel-btn")
            .addEventListener("click", (e) => {
              e.stopPropagation();
              deleteMenu.remove();
            });

          deleteMenu
            .querySelector(".delete-btn")
            .addEventListener("click", async (e) => {
              e.stopPropagation();
              const deleteBtn = e.target;
              deleteBtn.disabled = true;
              deleteBtn.textContent = "Удаление...";

              try {
                await this.deleteFile(file.id);
                showNotification("success", "Файл удален");
                this.loadMediaFiles();
              } catch (error) {
                showNotification("error", "Ошибка при удалении");
              } finally {
                deleteMenu.remove();
              }
            });

          setTimeout(() => {
            document.addEventListener("click", function closeDeleteMenu(e) {
              if (
                !deleteMenu.contains(e.target) &&
                !buttonElement.contains(e.target)
              ) {
                deleteMenu.remove();
                document.removeEventListener("click", closeDeleteMenu);
              }
            });
          }, 0);
        }

        async renderMediaList() {
          const filter = document.getElementById("media-filter").value;
          const mediaList = document.getElementById("media-list-container");

          // Фильтруем: для библиотеки файлов показываем только изображения и видео
          let filteredFiles = this.data.filter(
            (file) => file.type === "image" || file.type === "video",
          );

          // Применяем фильтр по номеру проигрывателя (если активен)
          if (this.currentPlayerFilter !== null) {
            filteredFiles = filteredFiles.filter((file) => {
              if (file.type === "video") {
                return file.player_number === this.currentPlayerFilter;
              }
              if (file.type === "image") {
                return (
                  file.player_number === undefined ||
                  file.player_number === null ||
                  file.player_number === this.currentPlayerFilter
                );
              }
              return true;
            });

            console.log(
              `📁 Отфильтровано файлов: ${filteredFiles.length} из ${this.data.filter((f) => f.type === "image" || f.type === "video").length}`,
            );
          }

          // Дополнительная фильтрация по типу (если выбрано)
          if (filter !== "all") {
            filteredFiles = filteredFiles.filter(
              (file) => file.type === filter,
            );
          }

          // СОРТИРОВКА: сначала по номеру проигрывателя, потом по позиции
          filteredFiles.sort((a, b) => {
            // Сначала сортируем по номеру проигрывателя
            const playerNumberA = a.player_number || 0;
            const playerNumberB = b.player_number || 0;

            if (playerNumberA !== playerNumberB) {
              return playerNumberA - playerNumberB;
            }

            // Если номера проигрывателей одинаковые, сортируем по позиции
            const positionA = a.position || 0;
            const positionB = b.position || 0;

            return positionA - positionB;
          });

          // Если нет файлов, показываем пустое состояние
          if (filteredFiles.length === 0) {
            const filterMessage = this.currentPlayerFilter
              ? ` для проигрывателя №${this.currentPlayerFilter}`
              : "";

            mediaList.innerHTML = `
        <div class="media-list-empty">
          <div class="empty-icon">📁</div>
          <div>Изображения и видео не найдены${filterMessage}</div>
          <div style="font-size: var(--font-size-sm); margin-top: 8px;">
            ${this.currentPlayerFilter ? `Загрузите файлы для проигрывателя №${this.currentPlayerFilter} или выберите другой виджет` : "Загрузите изображения (JPG, PNG) или видео (MP4) для отображения в виджете"}
          </div>
        </div>
      `;
            return;
          }

          // Рендерим отсортированный список
          mediaList.innerHTML = "";

          filteredFiles.forEach((file, index) => {
            const item = this.createMediaItem(file, index);
            mediaList.appendChild(item);
          });

          const total = await this.countTotalTimePlayer(filteredFiles);
          console.log("total", total);
          this.renderTimePlayer(total);
          this.updateDeleteButton();
        }

        renderTimePlayer(time) {
          // Форматируем время в читаемый формат (секунды -> часы:минуты:секунды)
          const formatTime = (totalSeconds) => {
            if (!totalSeconds || totalSeconds === 0) return "0 сек";

            const hours = Math.floor(totalSeconds / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            const parts = [];
            if (hours > 0) parts.push(`${hours} ч`);
            if (minutes > 0) parts.push(`${minutes} мин`);
            if (seconds > 0 || parts.length === 0)
              parts.push(`${parseInt(seconds)} сек`);

            return parts.join(" ");
          };

          // Ищем или создаем контейнер для отображения времени
          let timeContainer = document.querySelector(
            ".total-play-time-container",
          );

          if (!timeContainer) {
            // Если контейнера нет, создаем его в нужном месте
            // Например, добавим после блока статистики
            const statsContainer = document.querySelector(".media-stats");
            if (statsContainer && statsContainer.parentNode) {
              timeContainer = document.createElement("div");
              timeContainer.className = "total-play-time-container";
              timeContainer.style.cssText = `
        margin-top: 12px;
        padding: 12px;
        background: rgba(33, 41, 60, 0.6);
        backdrop-filter: blur(10px);
        border-radius: var(--border-radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.05);
        text-align: center;
      `;
              statsContainer.parentNode.insertBefore(
                timeContainer,
                statsContainer.nextSibling,
              );
            } else {
              // Если статистики нет, ищем другой подходящий контейнер
              const mediaLibrary = document.getElementById(
                "media-library-section",
              );
              if (mediaLibrary) {
                timeContainer = document.createElement("div");
                timeContainer.className = "total-play-time-container";
                timeContainer.style.cssText = `
          margin-top: 12px;
          padding: 12px;
          background: rgba(33, 41, 60, 0.6);
          backdrop-filter: blur(10px);
          border-radius: var(--border-radius-sm);
          border: 1px solid rgba(255, 255, 255, 0.05);
          text-align: center;
        `;
                mediaLibrary.appendChild(timeContainer);
              } else {
                console.warn(
                  "Не найден контейнер для отображения времени воспроизведения",
                );
                return;
              }
            }
          }

          // Обновляем содержимое
          timeContainer.innerHTML = `
    <div style="font-size: var(--font-size-xs); color: var(--text-secondary); margin-bottom: 4px;">
      ⏱️ Общее время воспроизведения плейлиста
    </div>
    <div style="font-size: var(--font-size-lg); font-weight: 600; color: var(--accent-primary);">
      ${time ? formatTime(time) : "Считаем..."}
    </div>
  `;
        }

        async countTotalTimePlayer(files) {
          if (this.currentPlayerFilter == null) return 0;

          let totalSeconds = 0;

          for (let i = 0; i < files?.length; i++) {
            if (files[i]?.type == "video") {
              const duration = await this.getVideoDuration(
                this.escapeFileUrl(files[i].url),
              );
              totalSeconds += duration * files[i]?.count_play;
            } else {
              totalSeconds += files[i]?.count_play + files[i]?.time_view;
            }
          }

          return totalSeconds;
        }

        getVideoDuration(url) {
          return new Promise((resolve) => {
            const video = document.createElement("video");

            video.addEventListener("loadedmetadata", () => {
              resolve(video.duration);
            });

            video.addEventListener("error", () => {
              console.error("Ошибка загрузки видео:", url);
              resolve(0); // В случае ошибки возвращаем 0
            });

            video.src = url;
          });
        }

        renderAudioPlayer() {
          const audioPlaylistContainer = document.getElementById(
            "audio-playlist-container",
          );

          if (!audioPlaylistContainer) {
            console.error("❌ audio-playlist-container не найден!");
            return;
          }

          // Получаем все аудио файлы
          const audioFiles = this.data.filter((file) => file.type === "audio");

          console.log(
            "🎵 Аудиофайлы для отображения:",
            audioFiles.length,
            audioFiles,
          );

          // Очищаем контейнер
          audioPlaylistContainer.innerHTML = "";

          if (audioFiles.length === 0) {
            // Показываем сообщение об отсутствии аудио
            const audioMessage = document.createElement("div");
            audioMessage.className = "audio-empty-message";
            audioMessage.style.cssText = `
                margin-top: 12px;
                padding: 20px;
                text-align: center;
                border-radius: var(--border-radius-sm);
                background: rgba(33, 41, 60, 0.6);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.05);
            `;
            audioMessage.innerHTML = `
                <div class="empty-icon" style="font-size: 32px; margin-bottom: 10px;">🎵</div>
                <div>Аудиофайлы не найдены</div>
                <div style="font-size: var(--font-size-sm); margin-top: 8px; color: var(--text-tertiary);">
                    Загрузите аудиофайлы (MP3) для воспроизведения
                </div>
            `;
            audioPlaylistContainer.appendChild(audioMessage);
            return;
          }

          // Создаем список аудиофайлов
          const audioListContainer = document.createElement("div");
          audioListContainer.className = "audio-list-container";
          audioListContainer.style.cssText = `
                margin-top: 12px;
                max-height: 300px;
                overflow-y: auto;
                border-radius: var(--border-radius-sm);
                background: rgba(33, 41, 60, 0.6);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.05);
        `;

          audioFiles.forEach((file, index) => {
            const audioItem = document.createElement("div");
            audioItem.className = "audio-item";
            audioItem.style.cssText = `
                padding: 12px;
                border-bottom: ${index < audioFiles.length - 1 ? "1px solid rgba(255, 255, 255, 0.05)" : "none"};
                display: flex;
                align-items: center;
                gap: 12px;
                cursor: pointer;
                transition: var(--transition);
                background: rgba(255, 255, 255, 0.03);
            `;

            audioItem.innerHTML = `
                <div class="audio-icon" style="
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 8px;
                    background: rgba(16, 185, 129, 0.2);
                    color: #34d399;
                    font-size: 18px;
                ">🎵</div>
                <div class="audio-info" style="flex: 1; min-width: 0;">
                    <div class="audio-name" style="
                        font-size: var(--font-size-md);
                        font-weight: 500;
                        color: var(--text-primary);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">${file.url?.split("/")?.[2]}</div>
                    <div class="audio-details" style="
                        display: flex;
                        gap: 8px;
                        font-size: var(--font-size-xs);
                        color: var(--text-tertiary);
                    ">
                        <span>🎵 Аудио</span>
                        ${file.count_play > 1 ? `<span>×${file.count_play}</span>` : ""}
                    </div>
                </div>
                <button class="play-audio-btn" style="
                    background: rgba(255, 255, 255, 0.1);
                    backdrop-filter: blur(10px);
                    border: none;
                    border-radius: 6px;
                    padding: 8px 12px;
                    cursor: pointer;
                    color: white;
                    transition: var(--transition);
                    font-size: 12px;
                    font-weight: 500;
                ">▶️ Воспроизвести</button>
            `;

            const playBtn = audioItem.querySelector(".play-audio-btn");
            playBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              this.playAudioFile(file.url, file.displayName);
            });

            audioItem.addEventListener("click", () => {
              this.playAudioFile(file.url, file.displayName);
            });

            audioListContainer.appendChild(audioItem);
          });

          audioPlaylistContainer.appendChild(audioListContainer);
        }

        // Добавьте метод pauseAudio
        pauseAudio() {
          const audioPlayer = document.getElementById("audio-player");
          if (audioPlayer) {
            audioPlayer.pause();
            this.isPlaying = false;

            // Перерисовываем список для обновления кнопки
            this.renderAudioPlayer();
          }
        }

        // Обновите метод playAudioFile
        playAudioFile(url, name) {
          // Создаем модальное окно для аудио (аналогично видео)
          const modal = document.createElement("div");
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            backdrop-filter: blur(10px);
        `;

          const content = document.createElement("div");
          content.style.cssText = `
            background: rgba(21, 27, 41, 0.95);
            border-radius: 16px;
            padding: 20px;
            width: 90%;
            max-width: 500px;
            border: 1px solid rgba(255,255,255,0.1);
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
        `;

          const header = document.createElement("div");
          header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 16px;
            padding-bottom: 12px;
            border-bottom: 1px solid rgba(255,255,255,0.1);
        `;

          const title = document.createElement("h3");
          title.textContent = name;
          title.style.cssText = `
            color: var(--accent-primary);
            margin: 0;
            font-size: 18px;
            font-weight: 600;
        `;

          const closeBtn = document.createElement("button");
          closeBtn.textContent = "✕";
          closeBtn.style.cssText = `
            background: rgba(255,255,255,0.1);
            border: none;
            color: white;
            font-size: 24px;
            cursor: pointer;
            width: 32px;
            height: 32px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        `;
          closeBtn.onmouseover = () => {
            closeBtn.style.background = "rgba(255,255,255,0.2)";
            closeBtn.style.transform = "scale(1.05)";
          };
          closeBtn.onmouseout = () => {
            closeBtn.style.background = "rgba(255,255,255,0.1)";
            closeBtn.style.transform = "scale(1)";
          };

          header.appendChild(title);
          header.appendChild(closeBtn);

          // Создаем аудио элемент
          const audioElement = document.createElement("audio");
          audioElement.controls = true;
          audioElement.style.width = "100%";
          audioElement.style.marginTop = "20px";
          audioElement.style.borderRadius = "8px";

          // Используем оригинальный URL без кодирования
          audioElement.src = this.escapeFileUrl(url);

          // Добавляем информацию о файле
          const info = document.createElement("div");
          info.style.cssText = `
            margin-top: 16px;
            padding: 12px;
            background: rgba(33, 41, 60, 0.6);
            border-radius: 8px;
            font-size: 12px;
            color: var(--text-secondary);
        `;

          // Находим файл в mediaFiles
          const fileInfo = this.data.find(
            (f) => f.url === url || f.rawUrl === url,
          );
          if (fileInfo) {
            info.innerHTML = `
                <div>📁 ${fileInfo.filename}</div>
                ${fileInfo.multiplexor > 1 ? `<div>🔄 Мультиплексор: ${fileInfo.multiplexor}</div>` : ""}
            `;
          } else {
            info.innerHTML = `<div>📁 ${name}</div>`;
          }

          content.appendChild(header);
          content.appendChild(audioElement);
          content.appendChild(info);
          modal.appendChild(content);
          document.body.appendChild(modal);

          // Закрытие
          const closeModal = () => {
            audioElement.pause();
            audioElement.src = "";
            modal.remove();
          };

          closeBtn.onclick = closeModal;
          modal.onclick = (e) => {
            if (e.target === modal) closeModal();
          };

          // Автоматическое воспроизведение
          audioElement.play().catch((e) => {
            console.warn("⚠️ Автовоспроизведение заблокировано:", e);
            // Показываем подсказку
            const playHint = document.createElement("div");
            playHint.style.cssText = `
                text-align: center;
                margin-top: 12px;
                padding: 8px;
                background: rgba(0,212,255,0.2);
                border-radius: 8px;
                color: var(--accent-primary);
                font-size: 12px;
            `;
            playHint.textContent =
              "▶️ Нажмите кнопку воспроизведения для старта";
            content.appendChild(playHint);
          });
        }

        createMediaItem(file, index) {
          const iconMap = {
            video: "🎬",
            audio: "🎵",
            image: "🖼️",
            other: "📄",
          };

          // Создаем элементы для отображения параметров
          const paramsDisplay = [];

          if (file.type != "audio" && file.player_number !== null) {
            paramsDisplay.push(
              `<div class="media-player-number">Проигрыватель: ${file.player_number}</div>`,
            );
          }

          if (file.type != "audio") {
            paramsDisplay.push(
              `<div class="media-multiplexor">Количество повторений за цикл: ${file?.count_play}</div>`,
            );
          }
          if (file.type == "image") {
            paramsDisplay.push(
              `<div class="media-show-time">Время показа: ${file.time_view} сек</div>`,
            );
          }

          const item = document.createElement("div");

          item.setAttribute("data-filename", file?.url?.split("/")?.[2]);
          item.setAttribute("data-index", index);

          const isSelected =
            this.selected_media_file == file?.id ? "selected" : "";
          item.className = `media-item ${isSelected}`;

          item.innerHTML = `
                <div class="media-order-controls">
                    <button class="order-btn order-up media-action-btn"  ${index === 0 ? "disabled" : ""}>↑</button>
                    <button class="order-btn order-down media-action-btn" ${index === this.data.length - 1 ? "disabled" : ""}>↓</button>
                </div>
                <div class="media-icon ${file.type}">
                    ${iconMap[file.type] || iconMap.other}
                </div>
                <div class="media-info">
                    <div class="media-name" title="${file?.url?.split("/")?.[2]}">${file?.url?.split("/")?.[2]}</div>
                    <div class="media-details">
                        <span class="media-type">${file.type.toUpperCase()}</span>
                        ${paramsDisplay.join("")}
                    </div>
                </div>
                <div class="media-actions">
                    <button class="media-action-btn play-action" title="Воспроизвести">▶️</button>
                    ${
                      file.type === "video" ||
                      file.type === "image" ||
                      file.type === "audio"
                        ? `<button class="media-action-btn edit-action" title="Изменить параметры">✏️</button>`
                        : ""
                    }
                    <button class="media-action-btn delete-action" title="Удалить">🗑️</button>
                </div>
            `;

          // Добавляем обработчики для кнопок порядка
          const upBtn = item.querySelector(".order-up");
          const downBtn = item.querySelector(".order-down");

          upBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            this.toggleFileSelection(file?.id, "move");
            this.moveFile(index, "up");
          });

          downBtn?.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();

            this.moveFile(index, "down");
            this.toggleFileSelection(file?.id, "move");
          });

          // Добавляем обработчики для остальных кнопок
          this.attachButtonHandlers(item, file);

          // Выбор файла
          item.addEventListener("click", (e) => {
            if (
              !e.target.closest(".media-action-btn") &&
              !e.target.closest(".order-btn")
            ) {
              this.toggleFileSelection(file?.id);
            }
          });

          return item;
        }

        async moveFile(index, direction) {
          const editPosition = async (file, position) => {
            const response = await fetch(
              this.apiBaseUrl + "/api/new_file/" + file?.id,
              {
                method: "PUT",
                headers: {
                  accept: "application/json",
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  id: file?.id,
                  url: file?.url,
                  type: file?.type,
                  player_number: file?.player_number,
                  count_play: file?.count_play,
                  time_view: file?.time_view,
                  position: position,
                  panel_id: file?.panel_id,
                }),
              },
            );
          };

          if (direction == "up") {
            let currentFile = this.data?.find(
              (item) => item?.position == index + 1,
            );
            let upFile = this.data?.find((item) => item?.position == index);
            console.log("curr", currentFile);
            console.log("up", upFile);
            await editPosition(currentFile, upFile?.position);
            await editPosition(upFile, currentFile?.position);
          } else {
            let currentFile = this.data?.find(
              (item) => item?.position == index + 1,
            );
            let downFile = this.data?.find(
              (item) => item?.position == index + 2,
            );
            await editPosition(currentFile, downFile?.position);
            await editPosition(downFile, currentFile?.position);
          }
          this.loadMediaFiles();
        }

        attachButtonHandlers(item, file) {
          const playBtn = item.querySelector(".play-action");
          const editBtn = item.querySelector(".edit-action");
          const deleteBtn = item.querySelector(".delete-action");

          // Предотвращаем всплытие
          const preventPropagation = (e) => {
            e.stopPropagation();
          };

          playBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showPlayMenu(file, playBtn);
          });

          if (editBtn) {
            editBtn.addEventListener("click", (e) => {
              e.stopPropagation();
              this.showEditMenu(file, editBtn);
            });
          }

          deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            this.showDeleteMenu(file, deleteBtn);
          });
        }

        toggleFileSelection(filename, type = "select") {
          if (this.selected_media_file == filename) {
            if (type != "move") {
              this.selected_media_file = "";
            }
          } else this.selected_media_file = filename;

          this.renderMediaList();
        }

        updateDeleteButton() {
          const deleteBtn = document.getElementById("delete-selected-files");
          deleteBtn.disabled = this.selectedFiles.size === 0;
        }
        updateStats() {
          let totalFiles = this.data?.filter(
            (item) => item?.type != "audio",
          )?.length;
          let videoFiles = this.data.filter((f) => f.type === "video").length;
          let imageFiles = this.data.filter((f) => f.type === "image").length;

          // Если применен фильтр, показываем статистику с учетом фильтра
          if (this.currentPlayerFilter !== null) {
            const filteredTotal = this.data.filter(
              (f) =>
                (f.type === "video" &&
                  f.player_number === this.currentPlayerFilter) ||
                (f.type === "image" &&
                  (f.player_number === undefined ||
                    f.player_number === null ||
                    f.player_number === this.currentPlayerFilter)),
            ).length;

            const filteredVideo = this.data.filter(
              (f) =>
                f.type === "video" &&
                f.player_number === this.currentPlayerFilter,
            ).length;

            const filteredImage = this.data.filter(
              (f) =>
                f.type === "image" &&
                (f.player_number === undefined ||
                  f.player_number === null ||
                  f.player_number === this.currentPlayerFilter),
            ).length;

            document.getElementById("total-files").textContent =
              `${filteredTotal}`;
            document.getElementById("video-files").textContent =
              `${filteredVideo}`;
            document.getElementById("image-files").textContent =
              `${filteredImage}`;

            // Добавляем индикатор фильтра
            const filterIndicator = document.getElementById("filter-indicator");
            if (filterIndicator) {
              filterIndicator.textContent = `🔍 Фильтр: проигрыватель №${this.currentPlayerFilter}`;
              filterIndicator.style.display = "block";
            }
          } else {
            document.getElementById("total-files").textContent = totalFiles;
            document.getElementById("video-files").textContent = videoFiles;
            document.getElementById("image-files").textContent = imageFiles;

            const filterIndicator = document.getElementById("filter-indicator");
            if (filterIndicator) {
              filterIndicator.style.display = "none";
            }
          }
        }

        // Добавьте метод для сброса фильтра
        resetFilter() {
          this.filterByPlayerNumber(null);
        }

        handleFileSelect(event) {
          const files = Array.from(event.target.files);
          if (files.length === 0) return;

          this.prepareFilesForUpload(files);
          this.uploadFile();
        }

        prepareFilesForUpload(files) {
          const fileInfo = document.getElementById("selected-file-info");
          const fileName = document.querySelector(".selected-file-name");
          const fileSize = document.querySelector(".selected-file-size");
          const uploadBtn = document.getElementById("upload-media");

          // Удаляем старый список файлов, если есть
          const oldFileList = fileInfo.querySelector(".file-list-preview");
          if (oldFileList) oldFileList.remove();

          if (files.length === 1) {
            // Если один файл - показываем его информацию
            fileName.textContent = files[0].name;
            fileSize.textContent = this.formatFileSize(files[0].size);
            fileInfo.classList.remove("multiple-files");
          } else {
            // Если несколько файлов - показываем количество и список
            fileName.textContent = `${files.length} файлов выбрано`;
            const totalSize = files.reduce((sum, file) => sum + file.size, 0);
            fileSize.textContent = this.formatFileSize(totalSize);
            fileInfo.classList.add("multiple-files");

            // Создаем список файлов
            const fileList = document.createElement("div");
            fileList.className = "file-list-preview";
            fileList.innerHTML = files
              .map((f) => `<div class="file-item">📄 ${f.name}</div>`)
              .join("");
            fileInfo.appendChild(fileList);
          }

          fileInfo.style.display = "block";
          uploadBtn.disabled = false;

          // Сохраняем файлы для загрузки
          this.filesToUpload = files;
        }

        formatFileSize(bytes) {
          if (bytes === 0) return "0 Bytes";
          const k = 1024;
          const sizes = ["Bytes", "KB", "MB", "GB"];
          const i = Math.floor(Math.log(bytes) / Math.log(k));
          return (
            parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
          );
        }

        async uploadFile() {
          if (!this.filesToUpload || this.filesToUpload.length === 0) return;
          if (!this.panelId) {
            showNotification(
              "error",
              "Нельзя загрузить медиа: panel_id не найден в URL",
            );
            return;
          }
          const uploadBtn = document.getElementById("upload-media");
          const progress = document.getElementById("upload-progress");
          const progressFill = progress.querySelector(".progress-fill");
          const progressText = progress.querySelector(".progress-text");
          const mediaType = document.getElementById("media-type").value;

          const player_number =
            this.currentPlayerFilter ??
            Number(
              document.getElementById("player-number-display")?.innerText,
            );
          if (mediaType !== "audio" && !Number.isFinite(player_number)) {
            showNotification(
              "warning",
              "Выберите видеопроигрыватель перед загрузкой файла",
            );
            return;
          }

          // Показываем прогресс
          uploadBtn.disabled = true;
          progress.style.display = "block";
          progressFill.style.width = "0%";
          progressText.textContent = "0%";

          let uploadedCount = 0;
          const results = [];

          console.log("tottal_files", this.filesToUpload);

          try {
            const formData = new FormData();
            Array.from(this.filesToUpload).forEach((file) => {
              formData.append("files", file);
            });

            const params = new URLSearchParams();
            params.append("type", mediaType);
            if (mediaType !== "audio") {
              params.append("player_number", String(player_number));
            }
            params.append("count_play", 1);
            params.append("image_time_view", 10);

            progressFill.style.width = "35%";
            progressText.textContent = "Загрузка файлов...";

            const bulkResponse = await fetch(
              `${this.apiBaseUrl}/api/new_file/${this.panelId}/upload-files-bulk?${params}`,
              {
                method: "POST",
                headers: {
                  accept: "application/json",
                },
                body: formData,
              },
            );

            if (!bulkResponse.ok) {
              throw new Error(`HTTP error! status: ${bulkResponse.status}`);
            }

            const bulkResult = await bulkResponse.json();
            uploadedCount = bulkResult.uploaded || this.filesToUpload.length;
            results.push(...(bulkResult.files || []));
            progressFill.style.width = "100%";
            progressText.textContent = `Загружено: ${uploadedCount}`;
          } catch (error) {
            console.error("Ошибка загрузки файлов:", error);
            progressFill.style.width = "100%";
            progressText.textContent = "Ошибка загрузки";
            if (typeof showNotification === "function") {
              showNotification("error", "Ошибка загрузки файлов");
            }
            uploadBtn.disabled = false;
            return;
          }

          // Завершаем загрузку
          setTimeout(async () => {
            progress.style.display = "none";
            uploadBtn.disabled = false;

            // Очищаем форму
            document.getElementById("media-file").value = "";
            document.getElementById("selected-file-info").style.display =
              "none";
            this.filesToUpload = null;

            // Сбрасываем параметры к значениям по умолчанию
            this.currentShowTime = 10;
            this.currentMultiplexor = 1;
            this.currentPlayerNumber = null;
            this.updateShowTimeDisplay();
            this.updateMultiplexorDisplay();
            this.updatePlayerNumberDisplay();
          }, 500);

          await this.loadMediaFiles();
        }

        selectAndPlayMediaInPanel() {
          if (!this.currentMedia) return;

          const audioPlayer = document.getElementById("audio-player");
          const videoPlayer = document.getElementById("video-player");

          // Скрываем всех
          audioPlayer.style.display = "none";
          videoPlayer.style.display = "none";

          // Настраиваем соответствующий плеер
          if (this.currentMedia.type === "audio") {
            audioPlayer.src = this.currentMedia.url;
            audioPlayer.style.display = "block";
            audioPlayer
              .play()
              .catch((e) => console.error("Ошибка воспроизведения:", e));
          } else if (this.currentMedia.type === "video") {
            videoPlayer.src = this.currentMedia.url;
            videoPlayer.style.display = "block";
            videoPlayer
              .play()
              .catch((e) => console.error("Ошибка воспроизведения:", e));
          } else {
            showNotification("info", "Данный тип файла нельзя воспроизвести");
          }

          // Настраиваем параметры
          this.setVolumeInPanel(
            document.getElementById("volume-control").value,
          );
          audioPlayer.loop = videoPlayer.loop =
            document.getElementById("loop-media").checked;
        }

        playSelectedMediaInPanel() {
          if (!this.currentMedia) return;

          const audioPlayer = document.getElementById("audio-player");
          const videoPlayer = document.getElementById("video-player");

          // Скрываем всех
          audioPlayer.style.display = "none";
          videoPlayer.style.display = "none";

          // Настраиваем соответствующий плеер
          if (this.currentMedia.type === "audio") {
            audioPlayer.src = this.currentMedia.url;
            audioPlayer.style.display = "block";
            audioPlayer
              .play()
              .catch((e) => console.error("Ошибка воспроизведения:", e));
          } else if (this.currentMedia.type === "video") {
            videoPlayer.src = this.currentMedia.url;
            videoPlayer.style.display = "block";
            videoPlayer
              .play()
              .catch((e) => console.error("Ошибка воспроизведения:", e));
          } else {
            showNotification("info", "Данный тип файла нельзя воспроизвести");
          }

          // Настраиваем параметры
          this.setVolumeInPanel(
            document.getElementById("volume-control").value,
          );
          audioPlayer.loop = videoPlayer.loop =
            document.getElementById("loop-media").checked;
        }

        pauseMediaInPanel() {
          const audioPlayer = document.getElementById("audio-player");
          const videoPlayer = document.getElementById("video-player");

          audioPlayer.pause();
          videoPlayer.pause();
        }

        stopMediaInPanel() {
          const audioPlayer = document.getElementById("audio-player");
          const videoPlayer = document.getElementById("video-player");

          audioPlayer.pause();
          audioPlayer.currentTime = 0;
          videoPlayer.pause();
          videoPlayer.currentTime = 0;
        }

        setVolumeInPanel(value) {
          const volume = value / 100;
          document.getElementById("audio-player").volume = volume;
          document.getElementById("video-player").volume = volume;
          document.getElementById("volume-value").textContent = `${value}%`;
        }

        toggleMuteInPanel(muted) {
          document.getElementById("audio-player").muted = muted;
          document.getElementById("video-player").muted = muted;
        }

        async deleteSelectedFiles() {
          const filesToDelete = Array.from(this.selectedFiles);
          if (filesToDelete.length === 0) return;

          // Показываем подтверждение для нескольких файлов
          if (filesToDelete.length > 1) {
            if (!confirm(`Удалить ${filesToDelete.length} выбранных файлов?`)) {
              return;
            }
          }

          try {
            const results = await Promise.allSettled(
              filesToDelete.map((filename) => this.deleteFile(filename)),
            );

            const successful = results.filter(
              (r) => r.status === "fulfilled",
            ).length;
            const failed = results.filter(
              (r) => r.status === "rejected",
            ).length;

            if (failed > 0) {
              showNotification(
                "warning",
                `Удалено ${successful} файлов, ошибок: ${failed}`,
              );
            } else {
              showNotification(
                "success",
                `Успешно удалено ${successful} файлов`,
              );
            }

            // Обновляем список
            this.loadMediaFiles();
            this.selectedFiles.clear();
          } catch (error) {
            console.error("Ошибка удаления:", error);
            showNotification("error", "Ошибка при удалении файлов");
          }
        }

        async deleteFile(id) {
          console.log("id", id);
          // 1. находим удаляемый файл
          const filteredFile = this.data?.find((item) => item?.id == id);
          console.log("filtered file", filteredFile);

          // 2. находим файлы, которые стояли по позиции после удаляемого файла
          const filteredFilesToUpload = this.data?.filter(
            (item) =>
              item?.position > filteredFile?.position && item?.type != "audio",
          );
          console.log("filteredFilesToUpload", filteredFilesToUpload);
          // 3. удаляем файл
          const response = await fetch(
            this.apiBaseUrl + "/api/new_file/" + id,
            {
              method: "DELETE",
              headers: {
                accept: "application/json",
              },
            },
          );

          // 4. меняем позиции файлов, которые стояли после удалямого файла (позицию меняем на -1)
          for (let i = 0; i < filteredFilesToUpload?.length; i++) {
            const requestData = {
              id: filteredFilesToUpload[i]?.id,
              url: filteredFilesToUpload[i]?.url,
              type: filteredFilesToUpload[i]?.type,
              player_number: filteredFilesToUpload[i]?.player_number,
              count_play: filteredFilesToUpload[i]?.count_play,
              time_view: filteredFilesToUpload[i]?.time_view,
              position: filteredFilesToUpload[i]?.position - 1,
              panel_id: filteredFilesToUpload[i]?.panel_id,
            };

            await this.editFileRequest(requestData);
          }
        }
      }
