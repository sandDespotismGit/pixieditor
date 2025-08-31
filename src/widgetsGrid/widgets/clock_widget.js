// ClockWidget.js
import { Container, Graphics } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class ClockWidget extends DraggableWidget {
    constructor(bounds, radius = 120, options = {}) {
        const content = new Container();
        const r = radius;

        // Фон виджета — тёмный квадрат с закруглением
        const background = new Graphics();
        background.beginFill(0x1e1e1e)
            .drawRoundedRect(0, 0, r * 2, r * 2, r * 0.27)
            .endFill();
        content.addChild(background);

        // Циферблат — белый круг с тонкой обводкой
        const face = new Graphics();
        face.beginFill(0xffffff)
            .drawCircle(r, r, r - 4)
            .endFill();
        face.lineStyle(2, 0xffffff)
            .drawCircle(r, r, r - 4);
        content.addChild(face);

        // Метки — 12 серых точек (как маленькие прямоугольники)
        const ticks = new Container();
        content.addChild(ticks);
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const len = r * 0.06;
            const w = r * 0.06;
            const tick = new Graphics();
            tick.beginFill(0x737373)
                .drawRect(-w / 2, -len, w, len)
                .endFill();
            tick.position.set(r, r);
            tick.rotation = angle;
            ticks.addChild(tick);
        }

        // Часовая стрелка — прямоугольник
        const hourHand = new Graphics();
        hourHand.beginFill(0x404040)
            .drawRect(-6, -r * 0.35, 12, r * 0.35)
            .endFill();
        hourHand.position.set(r, r);

        // Минутная стрелка — прямоугольник
        const minuteHand = new Graphics();
        minuteHand.beginFill(0x737373)
            .drawRect(-4, -r * 0.65, 8, r * 0.65)
            .endFill();
        minuteHand.position.set(r, r);

        // Секундная стрелка — тонкий прямоугольник + хвостик
        const secondHand = new Graphics();
        secondHand.beginFill(0xcccccc)
            .drawRect(-2, -r * 0.9, 4, r * 0.9) // основная игла
            .endFill();
        secondHand.beginFill(0xcccccc)
            .drawRect(-2, 0, 4, r * 0.2) // хвостик
            .endFill();
        secondHand.position.set(r, r);

        content.addChild(hourHand, minuteHand, secondHand);

        super(bounds, content, options);

        this._width = r * 2;
        this._height = r * 2;

        this.hourHand = hourHand;
        this.minuteHand = minuteHand;
        this.secondHand = secondHand;

        this.updateClock();
        this._timer = setInterval(() => this.updateClock(), 1000);
    }

    updateClock() {
        const now = new Date();
        const s = now.getSeconds();
        const m = now.getMinutes();
        const h = now.getHours() % 12;

        this.secondHand.rotation = (s / 60) * Math.PI * 2;
        this.minuteHand.rotation = ((m + s / 60) / 60) * Math.PI * 2;
        this.hourHand.rotation = ((h + m / 60 + s / 3600) / 12) * Math.PI * 2;
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}
