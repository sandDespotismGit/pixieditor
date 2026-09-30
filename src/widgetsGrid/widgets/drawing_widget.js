import { Container, Graphics } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import { createWidgetFillGradient, normalizeWidgetGradient } from "../widgetGradient";

export default class DrawingWidget extends DraggableWidget {
  constructor(bounds, options = {}) {
    const content = new Container();
    const background = new Graphics();
    const drawing = new Graphics();
    content.addChild(background, drawing);
    super(bounds, content, options);

    this.background = background;
    this.drawing = drawing;
    this.type = "DrawingWidget";
    this._width = options.width ?? 420;
    this._height = options.height ?? 260;
    this._backgroundColor = options.backgroundColor ?? 0xffffff;
    this._backgroundAlpha = options.backgroundAlpha ?? 1;
    this._cornerRadius = options.cornerRadius ?? 12;
    this._backgroundGradient = normalizeWidgetGradient(options.backgroundGradient);
    this.brushColor = options.brushColor ?? 0x111827;
    this.brushSize = options.brushSize ?? 5;
    this.strokes = Array.isArray(options.strokes) ? options.strokes : [];
    this.drawingEnabled = false;
    this.activeStroke = null;
    this._drawingEscHandler = (event) => {
      if (event.key === "Escape" && this.drawingEnabled) {
        this.setDrawingEnabled(false);
        this.emit("drawing-mode-change", this);
      }
    };
    this.redraw();
    this.updateSelection();
  }

  redraw() {
    this.background
      .clear()
      .roundRect(
        0,
        0,
        this._width,
        this._height,
        Math.min(this._cornerRadius, this._width / 2, this._height / 2),
      )
    const gradient = createWidgetFillGradient(
      this._backgroundGradient,
      this._width,
      this._height,
    );
    if (gradient) {
      this.background.fill(gradient);
      this.background.alpha = this._backgroundAlpha;
    } else {
      this.background.alpha = 1;
      this.background.fill({
        color: this._backgroundColor,
        alpha: this._backgroundAlpha,
      });
    }
    this.drawing.clear();
    this.strokes.forEach((stroke) => this.drawStroke(stroke));
  }

  drawStroke(stroke) {
    if (!stroke.points?.length) return;
    this.drawing.moveTo(stroke.points[0].x, stroke.points[0].y);
    stroke.points
      .slice(1)
      .forEach((point) => this.drawing.lineTo(point.x, point.y));
    this.drawing.stroke({
      color: stroke.color,
      width: stroke.size,
      cap: "round",
      join: "round",
    });
  }

  localPoint(event) {
    const point = event.data.getLocalPosition(this);
    return {
      x: Math.max(0, Math.min(this._width, point.x)),
      y: Math.max(0, Math.min(this._height, point.y)),
    };
  }

  onDragStart(event) {
    if (!this.drawingEnabled || event.target.isResizeHandle) {
      super.onDragStart(event);
      return;
    }
    event.stopPropagation?.();
    this.activeStroke = {
      color: this.brushColor,
      size: this.brushSize,
      points: [this.localPoint(event)],
    };
    this.strokes.push(this.activeStroke);
  }

  onDragMove(event) {
    if (!this.drawingEnabled || !this.activeStroke) {
      super.onDragMove(event);
      return;
    }
    event.stopPropagation?.();
    this.activeStroke.points.push(this.localPoint(event));
    this.redraw();
  }

  onDragEnd() {
    if (!this.drawingEnabled) {
      super.onDragEnd();
      return;
    }
    if (this.activeStroke) {
      this.emit("drawing-change", this);
    }
    this.activeStroke = null;
  }

  deselect() {
    this.setDrawingEnabled(false);
    return super.deselect();
  }

  onResize() {
    this.redraw();
  }

  setDrawingEnabled(enabled) {
    this.drawingEnabled = Boolean(enabled);
    this.cursor = this.drawingEnabled ? "crosshair" : "pointer";
    if (this.drawingEnabled) {
      document.addEventListener("keydown", this._drawingEscHandler);
    } else {
      document.removeEventListener("keydown", this._drawingEscHandler);
      this.activeStroke = null;
    }
    this.emit("drawing-mode-change", this);
    return this;
  }

  setBrushColor(color) {
    this.brushColor = color;
    return this;
  }

  setBrushSize(size) {
    this.brushSize = Math.max(1, Number(size) || 1);
    return this;
  }

  clearDrawing() {
    this.setDrawingEnabled(false);
    this.strokes = [];
    this.redraw();
    return this;
  }

  setBackgroundColor(color) {
    this._backgroundColor = color;
    this._backgroundGradient = null;
    this.redraw();
    return this;
  }

  setBackgroundGradient(gradient) {
    this._backgroundGradient = normalizeWidgetGradient(gradient);
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

  getSceneData() {
    return {
      drawingData: {
        brushColor: this.brushColor,
        brushSize: this.brushSize,
        strokes: this.strokes,
        backgroundGradient: this._backgroundGradient,
      },
    };
  }

  destroy(options) {
    document.removeEventListener("keydown", this._drawingEscHandler);
    super.destroy(options);
  }
}
