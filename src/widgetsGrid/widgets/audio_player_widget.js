import { Container, Graphics, Rectangle, Text } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import { requestWidgetData } from "../../batchWidgetData";

export const AUDIO_PLAYLIST_PRESETS = [
  { id: "", name: "Загруженные файлы", folder: "" },
  { id: "energy", name: "ENERGY", folder: "/ENERGY" },
  { id: "light-music", name: "LIGHT MUSIC", folder: "/LIGHT MUSIC" },
  { id: "light-songs", name: "LIGHT SONGS", folder: "/LIGHT SONGS" },
  { id: "relax", name: "RELAX", folder: "/RELAX" },
];

const AUDIO_PRESET_PUBLIC_KEY = "https://disk.yandex.ru/d/tn7y_5A_bNWEHQ";

export default class AudioPlayerWidget extends DraggableWidget {
  constructor(bounds, options = {}) {
    const content = new Container();
    const background = new Graphics();
    const accent = new Graphics();
    const bars = new Graphics();
    const title = new Text("", {
      fontFamily: "Rubik",
      fontSize: 12,
      fontWeight: "600",
      fill: 0x7dd3fc,
    });
    const track = new Text("Аудиоплеер", {
      fontFamily: "Rubik",
      fontSize: 18,
      fontWeight: "500",
      fill: 0xffffff,
    });
    const status = new Text("", {
      fontFamily: "Rubik",
      fontSize: 11,
      fontWeight: "500",
      fill: 0x94a3b8,
    });
    const playControl = new Container();
    const playControlBg = new Graphics();
    const playControlIcon = new Text("▶", {
      fontFamily: "Arial",
      fontSize: 18,
      fontWeight: "700",
      fill: 0xffffff,
    });
    playControl.addChild(playControlBg, playControlIcon);

    const nextControl = new Container();
    const nextControlBg = new Graphics();
    const nextControlIcon = new Text("›", {
      fontFamily: "Arial",
      fontSize: 24,
      fontWeight: "700",
      fill: 0xffffff,
    });
    nextControl.addChild(nextControlBg, nextControlIcon);

    content.addChild(
      background,
      accent,
      bars,
      title,
      track,
      status,
      playControl,
      nextControl,
    );
    super(bounds, content, options);

    this.background = background;
    this.accent = accent;
    this.bars = bars;
    this.titleText = title;
    this.trackText = track;
    this.statusText = status;
    this.playControl = playControl;
    this.playControlBg = playControlBg;
    this.playControlIcon = playControlIcon;
    this.nextControl = nextControl;
    this.nextControlBg = nextControlBg;
    this.nextControlIcon = nextControlIcon;
    this.type = "AudioPlayerWidget";
    this.widgetType = "AudioPlayerWidget";
    this._width = options.width ?? 460;
    this._height = options.height ?? 148;
    this._backgroundColor = options.backgroundColor ?? 0x101827;
    this._backgroundAlpha = options.backgroundAlpha ?? 0.96;
    this._cornerRadius = options.cornerRadius ?? 16;
    this._borderColor = options.borderColor ?? 0xffffff;
    this._borderAlpha = options.borderAlpha ?? 0;
    this._borderWidth = options.borderWidth ?? 0;
    this._mixerColor =
      options.mixerColor ?? options.audioData?.mixerColor ?? 0x20a7d0;
    this._playerNumber = options.playerNumber ?? 1;
    this._panelId = options.panelId ?? null;
    this._baseUrl = options.baseUrl || "https://admin.i-panel.pro:8787";
    this._presetId = options.presetId ?? "";
    this.volume = options.volume ?? 0.82;
    this.playlist = [];
    this.currentIndex = 0;
    this.audioElement = null;
    this.isPlaying = false;
    this.animationTimer = null;
    this.animationTime = 0;
    this.loadTimer = null;
    this.resumeHandler = null;

    this.setupPreviewControls();

    this.redraw();
    this.startAnimation();
    if (this._panelId) this.reload();
    this.updateSelection();
  }

  redraw() {
    const radius = Math.min(this._cornerRadius, this._height / 2);
    this.background
      .clear()
      .roundRect(0, 0, this._width, this._height, radius)
      .fill({ color: this._backgroundColor, alpha: this._backgroundAlpha });
    if (this._borderWidth > 0 && this._borderAlpha > 0) {
      const inset = this._borderWidth / 2;
      this.background
        .roundRect(
          inset,
          inset,
          Math.max(0, this._width - this._borderWidth),
          Math.max(0, this._height - this._borderWidth),
          Math.max(0, radius - inset),
        )
        .stroke({
          color: this._borderColor,
          alpha: this._borderAlpha,
          width: this._borderWidth,
        });
    }
    this.accent
      .clear()
      .roundRect(18, 20, 4, this._height - 40, 2)
      .fill({ color: this._mixerColor, alpha: 1 });
    const pad = Math.max(12, Math.min(this._width, this._height) * 0.1);
    const mixerWidth = Math.max(58, Math.min(124, this._width * 0.28));
    const controlsSize = Math.max(28, Math.min(42, this._height * 0.3));
    const controlsGap = Math.max(6, controlsSize * 0.18);
    const controlsX = Math.max(30, pad + 12);
    const leftX = this.isSelected
      ? controlsX + controlsSize + controlsGap + 10
      : pad + 20;
    const textWidth = Math.max(48, this._width - leftX - mixerWidth - pad);
    const titleSize = Math.max(8, Math.min(13, this._height * 0.09));
    const trackSize = Math.max(
      11,
      Math.min(28, this._height * 0.18, this._width * 0.055),
    );
    const statusSize = Math.max(8, Math.min(12, this._height * 0.08));
    const titleY = Math.max(10, pad * 0.75);
    const trackY = Math.max(titleY + titleSize + 8, this._height * 0.36);
    const statusY = Math.min(
      this._height - pad - statusSize,
      trackY + trackSize + 12,
    );

    this.titleText.style.fontSize = titleSize;
    this.trackText.style.fontSize = trackSize;
    this.trackText.style.wordWrap = true;
    this.trackText.style.wordWrapWidth = textWidth;
    this.trackText.style.breakWords = true;
    this.statusText.style.fontSize = statusSize;
    this.statusText.style.wordWrap = true;
    this.statusText.style.wordWrapWidth = textWidth;

    this.titleText.position.set(leftX, titleY);
    this.trackText.position.set(leftX, trackY);
    this.statusText.position.set(leftX, statusY);
    this.playControl.visible = this.isSelected;
    this.nextControl.visible = this.isSelected;
    this.layoutPreviewControls(
      controlsX,
      this._height / 2,
      controlsSize,
      controlsGap,
    );
    this.drawBars();
  }

  setupPreviewControls() {
    const stopEvent = (event) => event.stopPropagation?.();
    [this.playControl, this.nextControl].forEach((control) => {
      control.eventMode = "static";
      control.cursor = "pointer";
      control.on("pointerdown", stopEvent);
      control.on("pointerup", stopEvent);
    });
    this.playControl.on("pointertap", (event) => {
      stopEvent(event);
      this.togglePlayback();
    });
    this.nextControl.on("pointertap", (event) => {
      stopEvent(event);
      this.nextTrack();
    });
    this.updatePreviewControls();
  }

  layoutPreviewControls(x, centerY, size, gap) {
    const drawButton = (control, background, icon, y) => {
      background
        .clear()
        .circle(size / 2, size / 2, size / 2)
        .fill({ color: 0xffffff, alpha: 0.14 })
        .stroke({ color: this._mixerColor, alpha: 0.78, width: 1 });
      icon.style.fontSize =
        control === this.nextControl ? size * 0.72 : size * 0.48;
      icon.anchor.set(0.5);
      icon.position.set(size / 2, size / 2 - 1);
      control.position.set(x, y);
      control.hitArea = new Rectangle(0, 0, size, size);
    };

    const totalHeight = size * 2 + gap;
    const startY = centerY - totalHeight / 2;
    drawButton(
      this.playControl,
      this.playControlBg,
      this.playControlIcon,
      startY,
    );
    drawButton(
      this.nextControl,
      this.nextControlBg,
      this.nextControlIcon,
      startY + size + gap,
    );
  }

  updatePreviewControls() {
    if (this.playControlIcon) {
      this.playControlIcon.text = this.isPlaying ? "Ⅱ" : "▶";
    }
    if (this.nextControl) {
      this.nextControl.alpha = this.playlist.length > 1 ? 1 : 0.42;
    }
  }

  formatTime(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const rest = Math.floor(seconds % 60);
    return `${minutes}:${String(rest).padStart(2, "0")}`;
  }

  updatePlaybackStatus() {
    if (!this.audioElement) return;
    const current = this.formatTime(this.audioElement.currentTime);
    const duration = this.formatTime(this.audioElement.duration);
    this.statusText.text = `${current} / ${duration}${this.isPlaying ? "" : " · пауза"}`;
  }

  drawBars() {
    const mixerWidth = Math.max(58, Math.min(124, this._width * 0.28));
    const barCount = 9;
    const barGap = Math.max(5, mixerWidth / 13);
    const barWidth = Math.max(3, Math.min(8, barGap * 0.58));
    const baseline = this._height * 0.72;
    const startX = Math.max(this._width - mixerWidth - 10, this._width * 0.62);
    const maxBarHeight = Math.max(12, this._height * 0.42);
    const active = this.isPlaying;
    this.bars.clear();
    for (let i = 0; i < barCount; i += 1) {
      const wave = Math.sin(this.animationTime * 0.12 + i * 0.74);
      const height = active
        ? Math.max(8, maxBarHeight * (0.26 + ((wave + 1) / 2) * 0.74))
        : Math.max(7, maxBarHeight * (0.18 + (i % 3) * 0.08));
      this.bars
        .roundRect(
          startX + i * barGap,
          baseline - height,
          barWidth,
          height,
          barWidth / 2,
        )
        .fill({ color: this._mixerColor, alpha: active ? 1 : 0.62 });
    }
  }

  startAnimation() {
    if (this.animationTimer) return;
    this.animationTimer = window.setInterval(() => {
      this.animationTime += 1;
      this.drawBars();
    }, 110);
  }

  onResize() {
    this.redraw();
  }

  setBackgroundColor(color) {
    this._backgroundColor = color;
    this.redraw();
    return this;
  }

  setBackgroundAlpha(alpha) {
    this._backgroundAlpha = alpha;
    this.redraw();
    return this;
  }

  setCornerRadius(radius) {
    this._cornerRadius = radius;
    this.redraw();
    return this;
  }

  getBackgroundColor() {
    return this._backgroundColor;
  }

  getBackgroundAlpha() {
    return this._backgroundAlpha;
  }

  getCornerRadius() {
    return this._cornerRadius;
  }

  setBorderColor(color) {
    this._borderColor = color;
    this.redraw();
    return this;
  }

  setBorderAlpha(alpha) {
    this._borderAlpha = Number(alpha);
    this.redraw();
    return this;
  }

  setBorderWidth(width) {
    this._borderWidth = Math.max(0, Number(width) || 0);
    this.redraw();
    return this;
  }

  getBorderColor() {
    return this._borderColor;
  }

  getBorderAlpha() {
    return this._borderAlpha;
  }

  getBorderWidth() {
    return this._borderWidth;
  }

  setMixerColor(color) {
    this._mixerColor = color;
    this.redraw();
    return this;
  }

  getMixerColor() {
    return this._mixerColor;
  }

  getPlayerNumber() {
    return this._playerNumber;
  }

  setPlayerNumber(number) {
    this._playerNumber = Number(number) || 1;
    this.reload();
    this.notifySelectionChanged();
  }

  getPresetId() {
    return this._presetId || "";
  }

  setPresetId(presetId) {
    this._presetId = presetId || "";
    this.reload();
    this.notifySelectionChanged();
  }

  setPanelId(panelId) {
    this._panelId = panelId;
    this.reload();
  }

  notifySelectionChanged() {
    window.onAudioWidgetSelectionChanged?.();
  }

  select() {
    super.select();
    this.redraw();
    this.notifySelectionChanged();
    return this;
  }

  deselect() {
    super.deselect();
    this.redraw();
    this.notifySelectionChanged();
    return this;
  }

  async reload() {
    clearTimeout(this.loadTimer);
    try {
      if (this._presetId) {
        const files = await this.loadPresetFiles(this._presetId);
        this.setMediaFiles(files, { ignorePlayerNumber: true });
        return;
      }
      if (!this._panelId) return;
      const data = await requestWidgetData("media", {
        baseUrl: this._baseUrl,
        panelId: this._panelId,
      });
      this.setMediaFiles(Array.isArray(data) ? data : data.files || []);
    } catch (error) {
      this.trackText.text = "Аудио недоступно";
      this.statusText.text = `PLAYER ${this._playerNumber} / RETRY`;
      this.loadTimer = setTimeout(() => this.reload(), 5000);
    }
  }

  async loadPresetFiles(presetId) {
    const preset = AUDIO_PLAYLIST_PRESETS.find((item) => item.id === presetId);
    if (!preset?.folder) return [];
    const params = new URLSearchParams({
      public_key: AUDIO_PRESET_PUBLIC_KEY,
      path: preset.folder,
      limit: "100",
    });
    const response = await fetch(
      `https://cloud-api.yandex.net/v1/disk/public/resources?${params.toString()}`,
    );
    if (!response.ok) throw new Error(`Preset ${preset.name} unavailable`);
    const data = await response.json();
    const items = data?._embedded?.items || [];
    return items
      .filter((item) => item.type === "file" && item.file)
      .map((item, index) => ({
        type: "audio",
        url: item.file,
        name: item.name,
        position: index,
      }));
  }

  setMediaFiles(files = [], options = {}) {
    this.playlist = files
      .filter((file) => {
        const path = String(file?.url || file?.name || "")
          .split(/[?#]/)[0]
          .toLowerCase();
        const isAudio =
          file?.type === "audio" ||
          [".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"].some((extension) =>
            path.endsWith(extension),
          );
        if (!isAudio || !file?.url) return false;
        if (options.ignorePlayerNumber) return true;
        const playerNumber = Number(file.player_number);
        return (
          playerNumber === Number(this._playerNumber) ||
          (!playerNumber && Number(this._playerNumber) === 1)
        );
      })
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    if (
      !this.playlist.length &&
      !this._presetId &&
      !options.ignorePlayerNumber
    ) {
      const fallbackPreset = AUDIO_PLAYLIST_PRESETS.find((item) => item.id)?.id;
      if (fallbackPreset) {
        this._presetId = fallbackPreset;
        this.loadPresetFiles(fallbackPreset)
          .then((presetFiles) =>
            this.setMediaFiles(presetFiles, { ignorePlayerNumber: true }),
          )
          .catch(() => {
            this.stopAudio();
            this.trackText.text = "Аудиоплеер";
            this.statusText.text = "";
          });
        this.notifySelectionChanged();
        return;
      }
    }
    if (!this.playlist.length) {
      this.stopAudio();
      this.trackText.text = "Аудиоплеер";
      this.statusText.text = "Нет прикрепленных аудиофайлов";
      return;
    }
    this.currentIndex = 0;
    this.playCurrent();
  }

  mediaUrl(path) {
    if (/^https?:\/\//i.test(path)) return path;
    return `${this._baseUrl.replace(/\/$/, "")}/${String(path).replace(/^\//, "")}`;
  }

  playCurrent() {
    this.stopAudio();
    const file = this.playlist[this.currentIndex];
    if (!file) return;
    const name =
      String(file.name || file.url || "")
        .split("/")
        .pop() || "Аудио";
    this.trackText.text = decodeURIComponent(name).slice(0, 31);
    this.statusText.text = "";
    this.audioElement = document.createElement("audio");
    this.audioElement.src = this.mediaUrl(file.url);
    this.audioElement.preload = "auto";
    this.audioElement.autoplay = true;
    this.audioElement.volume = this.volume;
    this.audioElement.loop = this.playlist.length === 1;
    this.audioElement.addEventListener("playing", () => {
      this.isPlaying = true;
      this.updatePreviewControls();
      this.updatePlaybackStatus();
      if (this.resumeHandler) {
        document.removeEventListener("pointerdown", this.resumeHandler);
        this.resumeHandler = null;
      }
    });
    this.audioElement.addEventListener("error", () => {
      this.statusText.text = "Не удалось открыть аудиофайл";
      this.isPlaying = false;
      this.updatePreviewControls();
    });
    this.audioElement.addEventListener("timeupdate", () => {
      this.updatePlaybackStatus();
    });
    this.audioElement.addEventListener("pause", () => {
      this.isPlaying = false;
      this.updatePreviewControls();
      this.updatePlaybackStatus();
    });
    this.audioElement.addEventListener("ended", () => {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
      this.playCurrent();
    });
    this.audioElement.play().catch(() => {
      this.statusText.text = "Нажмите ▶ для предпрослушивания";
      this.updatePreviewControls();
      if (!this.resumeHandler) {
        this.resumeHandler = () => {
          this.audioElement?.play().catch(() => {});
        };
        document.addEventListener("pointerdown", this.resumeHandler);
      }
    });
  }

  stopAudio() {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.src = "";
      this.audioElement = null;
    }
    this.isPlaying = false;
    this.updatePreviewControls();
  }

  play() {
    if (!this.audioElement) {
      if (this.playlist.length) this.playCurrent();
      return;
    }
    this.audioElement.play().catch(() => {
      this.statusText.text = "Браузер заблокировал воспроизведение";
    });
  }

  pause() {
    this.audioElement?.pause();
  }

  togglePlayback() {
    if (this.isPlaying && this.audioElement && !this.audioElement.paused) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextTrack() {
    if (this.playlist.length < 2) return;
    this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    this.playCurrent();
  }

  pauseForNightMode() {
    if (this.audioElement) this.audioElement.pause();
    this.isPlaying = false;
    clearInterval(this.animationTimer);
    this.animationTimer = null;
    this.drawBars();
  }

  resumeAfterNightMode() {
    this.startAnimation();
    if (this.audioElement) {
      this.audioElement.play().catch(() => {});
    } else if (this.playlist.length) {
      this.playCurrent();
    } else {
      this.reload();
    }
  }

  getSceneData() {
    return {
      ...super.getSceneData(),
      audioData: {
        playerNumber: this._playerNumber,
        volume: this.volume,
        presetId: this._presetId,
        mixerColor: this._mixerColor,
      },
      borderColor: this._borderColor,
      borderAlpha: this._borderAlpha,
      borderWidth: this._borderWidth,
    };
  }

  destroy(options) {
    clearTimeout(this.loadTimer);
    clearInterval(this.animationTimer);
    if (this.resumeHandler) {
      document.removeEventListener("pointerdown", this.resumeHandler);
    }
    this.stopAudio();
    super.destroy(options);
  }
}
