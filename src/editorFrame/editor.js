import { Application, Container } from "pixi.js";
import * as PIXI from 'pixi.js'; // Для модульной системы

export default class EditorFrame {
    constructor(app) {
        this.app = app;
        this.container = new Container()
        this.app.stage.addChild(this.container);
        this.createBackground();
    }
    createBackground() {
        const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
        bg.width = this.app.screen.width;
        bg.height = this.app.screen.height;
        bg.tint = 0x333333;
        this.container.addChild(bg);
    }
}