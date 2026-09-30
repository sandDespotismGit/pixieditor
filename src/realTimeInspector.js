import DraggableWidget from "./widgetsGrid/draggable_widget";
import { AUDIO_PLAYLIST_PRESETS } from "./widgetsGrid/widgets/audio_player_widget";

export default class RealTimeInspector {
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
      console.log("playlist", playlistInfo);

      const countTotalTimePlayer = async (files, type) => {
        let totalSeconds = 0;
        let videoSeconds = 0;
        let imageSeconds = 0;
        if (type == "table") {
          const time = await getVideoDuration(files);
          console.log("time", time);
          return time;
        } else {
          for (let i = 0; i < files?.length; i++) {
            if (files[i]?.type == "video") {
              const duration = await getVideoDuration(files[i]?.url);
              totalSeconds += duration * files[i]?.multiplexer;
              videoSeconds += duration * files[i]?.multiplexer;
            } else {
              totalSeconds += files[i]?.multiplexer * files[i]?.time_view;
              imageSeconds += files[i]?.multiplexer * files[i]?.time_view;
            }
            console.log(totalSeconds);
          }
          return {
            totalSeconds: totalSeconds,
            videoSeconds: videoSeconds,
            imageSeconds: imageSeconds,
          };
        }
      };

      const getVideoDuration = (url) => {
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
      };

      let timers = await countTotalTimePlayer(playlistInfo?.playlist, "total");

      const totalTime = timers.totalSeconds;
      const videoTime = timers.videoSeconds;
      const imageTime = timers.imageSeconds;

      console.log("totalTime", totalTime);

      const percent = (videoTime / totalTime) * 100;

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
                                <span style="color: var(--accent-primary); font-weight: 600; font-size: 18px;">${timers ? parseInt(totalTime) + "сек" : "Считаем..."} </span>
                            </div>
                        </div>
                  </div>

                   <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Материалов</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: center;">
                                <span style="color: var(--accent-primary); font-weight: 600; font-size: 18px;">${stats.totalFiles || 0}</span>
                            </div>
                        </div>
                  </div>

                  <div style="background: var(--bg-tertiary); padding: 16px; border-radius: 8px;">
                        <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; text-transform: uppercase;">Баланс</div>
                        <div style="display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: center;">
                              <div style="display:flex; flex-direction:column">
                                <span style="color: var(--accent-primary); font-weight: 400; font-size: 16px;">Видео ${Number(percent).toFixed(0)}%</span>
                                <span style="color: var(--accent-primary); font-weight: 400; font-size: 16px;">Изобр. ${Number(100 - percent).toFixed(0)}%</span>
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
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Длит., сек</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Повт.</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px; width: max-content">В цикле, сек</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">%</th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;"></th>
                        <th scope="col" style="padding: 14px 16px; text-align: left; font-weight: 600; font-size: 0.95rem; letter-spacing: 0.3px;">Вес</th>
                      </tr>
                    </thead>
                    <tbody>
                    ${
                      playlistInfo?.playlist?.length > 0
                        ? (
                            await Promise.all(
                              playlistInfo.playlist.map(async (item, index) => {
                                const time = await countTotalTimePlayer(
                                  item?.url,
                                  "table",
                                );
                                return `
            <tr>
              <th title="${item?.url?.split("/")?.at(-1)}" scope="row" style="padding: 12px 16px; text-align: left; font-weight: 600; color: white; max-width: 150px; text-overflow: ellipsis; white-space: nowrap; overflow: hidden;">${item?.url?.split("/")?.at(-1)}</th>
              <td style="padding: 12px 16px; color: white;">${item?.type == "video" ? "Видео" : "Изображение"}</td>
              <td style="padding: 12px 16px; color: white;">${item?.type == "video" ? Number(time).toFixed(0) : item?.time_view}</td>
              <td style="padding: 12px 16px; color: white;">${item?.multiplexer}</td>
              <td style="padding: 12px 16px; color: white; ">${item?.type == "video" ? Number(time * item?.multiplexer).toFixed(0) : item?.time_view * item?.multiplexer}</td>
              <td colspan='3' style="padding: 12px 16px; color: white; text-align: right;">
                <div style="width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 20px; border-radius: 6px; background: rgba(0, 0, 0, 0.2); position: relative; overflow: hidden;">
                  <div style="height: 100%; width: ${item?.type == "video" ? Number(((time * item?.multiplexer) / totalTime) * 100).toFixed(0) : Number(((item?.time_view * item?.multiplexer) / totalTime) * 100).toFixed(0)}%; background: rgba(${Math.floor(Math.random() * 256)}, 220, ${Math.floor(Math.random() * 256)}, 1); border-radius: 4px; transition: width 0.3s ease; position: absolute; z-index: 1"></div>
                  <p style="color: white; position: absolute; z-index: 2; right: 10px; margin: 0; white-space: nowrap;">${item?.type == "video" ? Number(((time * item?.multiplexer) / totalTime) * 100).toFixed(0) : Number(((item?.time_view * item?.multiplexer) / totalTime) * 100).toFixed(0)}%</p>
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
                
                <div style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button id="refresh-stats" class="btn-modern" style="padding: 8px 16px;">🔄 Обновить</button>
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

  setupEditorConnection() {
    // Сохраняем оригинальные методы редактора
    this.originalSelectWidget = this.editor.selectWidget?.bind(this.editor);
    this.originalDeselectAll = this.editor.deselectAll?.bind(this.editor);
    this.originalAddToSelection = this.editor.addToSelection?.bind(this.editor);
    this.originalSelectMultiple = this.editor.selectMultiple?.bind(this.editor);

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

    const paletteContainer = document.getElementById("inspector-color-palette");
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
    } else if (widget.constructor.name === "AudioPlayerWidget") {
      widgetInfo.appendChild(this.createAudioWidgetSection(widget));
    } else if (
      widget.constructor.name === "DirectionFloorWidget" ||
      widget.type === "DirectionFloorDisplay"
    ) {
      widgetInfo.appendChild(this.createFloorWidgetSection(widget));
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

  createAudioWidgetSection(widget) {
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
    title.textContent = "Аудиоплеер";
    section.appendChild(title);

    const highlightWrap = document.createElement("div");
    highlightWrap.style.cssText = "display:grid;gap:10px;";
    section.appendChild(highlightWrap);

    const playerGroup = this.createInputGroup(
      "Источник",
      [
        {
          id: `audio-player-number-${widget.id || Date.now()}`,
          label: "Номер",
          value: widget.getPlayerNumber ? widget.getPlayerNumber() : widget._playerNumber || 1,
          type: "number",
          min: 1,
          max: 99,
          step: 1,
        },
      ],
      (fieldId, value) => {
        this.applyToWidgets([widget], fieldId, value);
      },
    );
    playerGroup.style.cssText = "padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(32,167,208,.18),rgba(123,97,255,.16));border:1px solid rgba(32,167,208,.35);";
    highlightWrap.appendChild(playerGroup);

    const presetGroup = document.createElement("div");
    presetGroup.style.cssText = "margin-bottom:16px;padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(123,97,255,.18),rgba(32,167,208,.12));border:1px solid rgba(123,97,255,.35);";
    presetGroup.innerHTML = `
      <div style="font-size: 11px; color: var(--text-secondary); margin-bottom: 8px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">Пресет плейлиста</div>
    `;
    const presetSelect = document.createElement("select");
    presetSelect.id = `audio-preset-${widget.id || Date.now()}`;
    presetSelect.style.cssText = `
      width: 100%;
      padding: 8px 10px;
      background: var(--bg-primary);
      border: 1px solid var(--border-secondary);
      border-radius: 6px;
      color: var(--text-primary);
      font-size: 12px;
      box-sizing: border-box;
    `;
    const currentPreset = widget.getPresetId ? widget.getPresetId() : widget._presetId || "";
    AUDIO_PLAYLIST_PRESETS.forEach((preset) => {
      const option = document.createElement("option");
      option.value = preset.id;
      option.textContent = preset.name;
      option.selected = preset.id === currentPreset;
      presetSelect.appendChild(option);
    });
    presetSelect.addEventListener("change", (event) => {
      this.applyToWidgets([widget], "audio-preset", event.target.value);
    });
    presetGroup.appendChild(presetSelect);
    highlightWrap.appendChild(presetGroup);

    const volumeGroup = this.createSliderInput(
      "Громкость",
      `audio-volume-${widget.id || Date.now()}`,
      Math.round((widget.volume ?? 0.82) * 100),
      0,
      100,
      1,
      (value) => {
        this.applyToWidgets([widget], "audio-volume", value);
      },
    );
    volumeGroup.style.cssText = "padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(32,167,208,.12));border:1px solid rgba(16,185,129,.32);";
    highlightWrap.appendChild(volumeGroup);

    const mixerColor = widget.getMixerColor?.() ?? widget._mixerColor ?? widget.audioData?.mixerColor ?? 0x20a7d0;
    const mixerColorGroup = this.createColorInput(
      "Цвет микшера",
      `audio-mixer-color-${widget.id || Date.now()}`,
      mixerColor,
      (value) => {
        this.applyToWidgets([widget], "audio-mixer-color", value);
      },
      null,
    );
    mixerColorGroup.style.cssText = "padding:12px;border-radius:10px;background:linear-gradient(135deg,rgba(6,182,212,.16),rgba(14,165,233,.10));border:1px solid rgba(6,182,212,.34);";
    highlightWrap.appendChild(mixerColorGroup);

    return section;
  }

  createEffectsSection(widget) {
    const section = document.createElement("div");
    section.style.marginBottom = "20px";
    const title = document.createElement("div");
    title.style.cssText = "font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;";
    title.textContent = "Эффекты";
    section.appendChild(title);
    const select = document.createElement("select");
    select.className = "form-input";
    select.style.cssText = "width:100%;padding:8px 10px;background:var(--bg-primary);border:1px solid var(--border-secondary);border-radius:6px;color:var(--text-primary);";
    const current = widget.getEffectPreset?.() || widget._effectPreset || "minimal";
    [["minimal", "Minimal"], ["glass", "Glass"], ["premium", "Premium"], ["dark", "Dark"], ["light", "Light"]].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = value === current;
      select.appendChild(option);
    });
    select.addEventListener("change", (event) => {
      widget.setEffectPreset?.(event.target.value);
      window.undoManager?.save("Изменен эффект виджета");
    });
    section.appendChild(select);
    return section;
  }

  createFloorWidgetSection(widget) {
    const section = document.createElement("div");
    section.style.marginBottom = "20px";
    section.innerHTML = `
      <div style="font-size:12px;font-weight:600;color:var(--accent-primary);margin-bottom:12px;text-transform:uppercase;letter-spacing:.5px;">Этаж</div>
      <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Ссылка на источник этажа</label>
      <input class="form-input floor-source-url" type="url" value="${(widget.getSourceUrl?.() || "").replace(/"/g, "&quot;")}" placeholder="https://..." style="width:100%;margin-bottom:10px;">
      <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Этаж вручную</label>
      <input class="form-input floor-current" type="number" value="${widget.getCurrentFloor?.() ?? widget._floor ?? 1}" style="width:100%;margin-bottom:10px;">
      <label style="display:block;color:var(--text-secondary);font-size:11px;margin-bottom:6px;">Направление</label>
      <select class="form-input floor-direction" style="width:100%;">
        <option value="up" ${(widget.getCurrentDirection?.() || widget._direction) === "up" ? "selected" : ""}>Вверх</option>
        <option value="down" ${(widget.getCurrentDirection?.() || widget._direction) === "down" ? "selected" : ""}>Вниз</option>
        <option value="none" ${(widget.getCurrentDirection?.() || widget._direction) === "none" ? "selected" : ""}>Нет движения</option>
      </select>
    `;
    section.querySelector(".floor-source-url").addEventListener("change", (event) => widget.setSourceUrl?.(event.target.value));
    section.querySelector(".floor-current").addEventListener("change", (event) => widget.setFloor?.(Number(event.target.value), false));
    section.querySelector(".floor-direction").addEventListener("change", (event) => widget.setDirection?.(event.target.value));
    return section;
  }

  updateWidgetContent(widgetInfo, widget) {
    // Обновляем позицию и размер в свойствах
    const posXInput = widgetInfo.querySelector('[id*="prop-pos-x"]');
    const posYInput = widgetInfo.querySelector('[id*="prop-pos-y"]');
    const widthInput = widgetInfo.querySelector('[id*="prop-width"]');
    const heightInput = widgetInfo.querySelector('[id*="prop-height"]');

    if (posXInput) posXInput.value = Math.round(widget.x || 0);
    if (posYInput) posYInput.value = Math.round(widget.y || 0);
    if (widthInput) widthInput.value = Math.round(this.getWidgetWidth(widget));
    if (heightInput)
      heightInput.value = Math.round(this.getWidgetHeight(widget));

    // Не трогаем кнопки соотношений - они остаются как есть
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
    italicBtn.innerHTML = '💧 <span style="font-style: italic;">Курсив</span>';

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
          if (actualWidget.text && actualWidget.text.style) {
            actualWidget.text.style.fontWeight = value ? "bold" : "normal";
          }
          break;

        case "italic":
          if (actualWidget.text && actualWidget.text.style) {
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
      const isStretchedToWidth = Math.abs(currentSize.width - editorWidth) < 2;
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
        showSuccess(`Виджет растянут на всю ширину: ${newWidth}×${newHeight}`);
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
        showSuccess(`Виджет растянут на всю высоту: ${newWidth}×${newHeight}`);
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

    const hasPlayMethod = widget.play || (widget.widget && widget.widget.play);
    const hasPauseMethod =
      widget.pause || (widget.widget && widget.widget.pause);
    const hasReloadMethod =
      widget.reload || (widget.widget && widget.widget.reload);
    const hasStatistics =
      widget.getStatistics ||
      (widget.widget && widget.widget.getStatistics) ||
      (widget.content && widget.content.getStatistics);

    if (hasPlayMethod) {
      videoButtons.appendChild(
        createVideoButton(
          "▶️ Воспроизвести",
          () => {
            const targetWidget = widget.play
              ? widget
              : widget.widget
                ? widget.widget
                : widget;
            if (targetWidget.play) targetWidget.play();
          },
          true,
        ),
      );
    }

    if (hasPauseMethod) {
      videoButtons.appendChild(
        createVideoButton("⏸️ Пауза", () => {
          const targetWidget = widget.pause
            ? widget
            : widget.widget
              ? widget.widget
              : widget;
          if (targetWidget.pause) targetWidget.pause();
        }),
      );
    }

    if (hasReloadMethod) {
      videoButtons.appendChild(
        createVideoButton("🔄 Перезагрузить", () => {
          const targetWidget = widget.reload
            ? widget
            : widget.widget
              ? widget.widget
              : widget;
          if (targetWidget.reload) targetWidget.reload();
        }),
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

    if (widget.resize) {
      widget.resize(newWidth, newHeight);
    }

    if (widget.updateSelection) {
      widget.updateSelection();
    }

    // Обновляем кнопки соотношений
    this.updateAspectButtonsForWidget(widget);
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

    // Получаем ширину редактора
    const editorWidth = this.editor._width;

    // Получаем текущие размеры виджета через getSize()
    const currentSize = widget.getSize();
    const currentWidth = currentSize.width;
    const currentHeight = currentSize.height;

    // Вычисляем новую высоту с сохранением пропорций
    const aspectRatio = currentWidth / currentHeight;
    const newWidth = editorWidth;
    const newHeight = Math.round(editorWidth / aspectRatio);

    console.log(`  Текущее соотношение: ${aspectRatio.toFixed(3)}`);
    console.log(`  Новый размер: ${newWidth}×${newHeight}`);

    // Применяем новый размер
    if (widget.resize) {
      widget.resize(newWidth, newHeight);
    }

    // Центрируем по горизонтали
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

    // Получаем высоту редактора
    const editorHeight = this.editor._height;

    // Получаем текущие размеры виджета через getSize()
    const currentSize = widget.getSize();
    const currentWidth = currentSize.width;
    const currentHeight = currentSize.height;

    // Вычисляем новую ширину с сохранением пропорций
    const aspectRatio = currentWidth / currentHeight;
    const newHeight = editorHeight;
    const newWidth = Math.round(editorHeight * aspectRatio);

    console.log(`  Текущее соотношение: ${aspectRatio.toFixed(3)}`);
    console.log(`  Новый размер: ${newWidth}×${newHeight}`);

    // Применяем новый размер
    if (widget.resize) {
      widget.resize(newWidth, newHeight);
    }

    // Центрируем по вертикали
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
    selectBtn.style.cssText = `flex: 1; padding: 6px 12px; font-size: 11px;`;
    selectBtn.textContent = "Выбрать один";

    const editBtn = document.createElement("button");
    editBtn.className = "btn-modern";
    editBtn.style.cssText = `
            flex: 1;
            padding: 6px 12px;
            font-size: 11px;
            background: var(--accent-primary);
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
    }
    const transformSection = this.createTransformSection(widget);
    container.appendChild(transformSection);
    const stylesSection = this.createStylesSection(widget);
    container.appendChild(stylesSection);

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

    if (
      widget.constructor.name === "AudioPlayerWidget" ||
      widget.type === "AudioPlayerWidget"
    ) {
      const mixerColor =
        widget.getMixerColor?.() ??
        widget._mixerColor ??
        widget.audioData?.mixerColor ??
        0x20a7d0;
      const mixerColorGroup = this.createColorInput(
        "Цвет микшера",
        `style-audio-mixer-color-${widget.id || Date.now()}`,
        mixerColor,
        (value) => {
          this.applyToWidgets([widget], "audio-mixer-color", value);
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
          reorderChildren(widget, 0);
        } else if (widget.setZIndex) {
          widget.setZIndex(0);
        } else if (widget._zIndex !== undefined) {
          widget._zIndex = 0;
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
              } else if (actualWidget.options?.backgroundColor !== undefined) {
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

          case fieldId.includes("alpha"):
            const alpha = parseFloat(value);
            if (!isNaN(alpha)) {
              if (actualWidget.setBackgroundAlpha) {
                actualWidget.setBackgroundAlpha(alpha);
              } else if (actualWidget.setAlpha) {
                actualWidget.setAlpha(alpha);
              } else if (actualWidget.backgroundAlpha !== undefined) {
                actualWidget.backgroundAlpha = alpha;
              } else if (actualWidget.options?.backgroundAlpha !== undefined) {
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
              if (actualWidget.audioElement) {
                actualWidget.audioElement.volume = volume;
              }
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
    };

    return (
      names[widget.constructor.name] || widget.constructor.name || "Виджет"
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
    const colorModal = document.getElementById("inspector-color-picker-modal");
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
