import { Container, Graphics } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import { createWidgetFillGradient, normalizeWidgetGradient } from "../widgetGradient";

export default class ShapeWidget extends DraggableWidget {
  constructor(bounds, shapeType = "rectangle", options = {}) {
    const content = new Container();
    const graphic = new Graphics();
    content.addChild(graphic);
    super(bounds, content, options);

    this.graphic = graphic;
    this.shapeType = shapeType;
    this.type = shapeType;
    this._width = options.width ?? 220;
    this._height = options.height ?? 140;
    this._backgroundColor = options.backgroundColor ?? 0x00d4ff;
    this._backgroundAlpha = options.backgroundAlpha ?? 1;
    this._cornerRadius = options.cornerRadius ?? 16;
    this._borderColor = options.borderColor ?? 0xffffff;
    this._borderAlpha = options.borderAlpha ?? 0;
    this._borderWidth = options.borderWidth ?? 0;
    this._backgroundGradient = normalizeWidgetGradient(options.backgroundGradient);
    this.redraw();
    this.updateSelection();
  }

  redraw() {
    const g = this.graphic;
    const w = this._width;
    const h = this._height;
    g.clear();
    if (this.shapeType === "ellipse") {
      g.ellipse(w / 2, h / 2, w / 2, h / 2);
    } else if (this.shapeType === "triangle") {
      g.poly([w / 2, 0, w, h, 0, h]);
    } else if (this.shapeType === "line") {
      g.moveTo(0, h / 2).lineTo(w, h / 2);
      g.stroke({
        color: this._backgroundColor,
        alpha: this._backgroundAlpha,
        width: Math.max(2, this._cornerRadius),
      });
      return;
    } else {
      g.roundRect(0, 0, w, h, Math.min(this._cornerRadius, w / 2, h / 2));
    }
    const gradient = createWidgetFillGradient(this._backgroundGradient, w, h);
    if (gradient) {
      g.fill(gradient);
      g.alpha = this._backgroundAlpha;
    } else {
      g.alpha = 1;
      g.fill({ color: this._backgroundColor, alpha: this._backgroundAlpha });
    }
    if (this._borderWidth > 0 && this._borderAlpha > 0) {
      const inset = this._borderWidth / 2;
      const strokeRadius = Math.max(0, this._cornerRadius - inset);
      if (this._shapeType === 'circle') {
        const radius = Math.max(0, Math.min(w, h) / 2 - inset);
        g.circle(w / 2, h / 2, radius);
      } else {
        g.roundRect(
          inset,
          inset,
          Math.max(0, w - this._borderWidth),
          Math.max(0, h - this._borderWidth),
          strokeRadius,
        );
      }
      g.stroke({
        color: this._borderColor,
        alpha: this._borderAlpha,
        width: this._borderWidth,
      });
    }
  }

  onResize() {
    this.redraw();
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
      shapeData: {
        shapeType: this.shapeType,
        borderColor: this._borderColor,
        borderAlpha: this._borderAlpha,
        borderWidth: this._borderWidth,
        backgroundGradient: this._backgroundGradient,
      },
    };
  }
}
