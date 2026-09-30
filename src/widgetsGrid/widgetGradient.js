import { FillGradient } from "pixi.js";

export function normalizeWidgetGradient(gradient) {
  if (!gradient || !Array.isArray(gradient.colorStops) || gradient.colorStops.length < 2) {
    return null;
  }

  return {
    type: ["linear", "radial"].includes(gradient.type) ? gradient.type : "linear",
    angle: Number(gradient.angle ?? 135),
    colorStops: gradient.colorStops.map((stop, index) => ({
      offset: Number.isFinite(Number(stop.offset))
        ? Math.max(0, Math.min(1, Number(stop.offset)))
        : index / Math.max(1, gradient.colorStops.length - 1),
      color: typeof stop.color === "number"
        ? stop.color
        : Number.parseInt(String(stop.color || "#000000").replace("#", ""), 16),
    })),
  };
}

export function createWidgetFillGradient(gradient, width, height) {
  const config = normalizeWidgetGradient(gradient);
  if (!config) return null;

  if (config.type === "radial") {
    return new FillGradient({
      type: "radial",
      center: { x: width / 2, y: height / 2 },
      innerRadius: 0,
      outerCenter: { x: width / 2, y: height / 2 },
      outerRadius: Math.max(width, height) / 2,
      colorStops: config.colorStops,
    });
  }

  const angle = (config.angle * Math.PI) / 180;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  return new FillGradient({
    start: { x: width * (0.5 - x / 2), y: height * (0.5 - y / 2) },
    end: { x: width * (0.5 + x / 2), y: height * (0.5 + y / 2) },
    colorStops: config.colorStops,
  });
}
