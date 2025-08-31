import { Container, Sprite, Texture, TilingSprite, Graphics } from "pixi.js";
import * as PIXI from 'pixi.js';

import DraggableWidget from "../widgetsGrid/draggable_widget";

export default class EditorFrame {

    constructor(app) {
        this.app = app;
        this.container = new Container();
        this.app.stage.addChild(this.container);
        this._width = this.app.screen.width;
        this._height = this.app.screen.height;

        // Параметры сетки
        this.grid = null;
        this.gridVisible = true;
        this.gridSize = 20;
        this.gridColor = "rgb(83, 83, 83)";
        this.gridAlpha = 1;

        // Масштабирование
        this.scale = 1;
        this.minScale = 0.1;
        this.maxScale = 5;

        // Перетаскивание
        this.dragEnabled = true;
        this.selected_widget = null

        this.setupKeyboardControls();
        this.setupZoom();
        this.setupDrag();

        this.createBackground();
        this.createGrid();
    }

    // ==== СЕРИАЛИЗАЦИЯ/ИМПОРТ/ЭКСПОРТ ====

    exportScene() {
        const widgets = this.container.children
            .filter(c => c instanceof DraggableWidget)
            .map(w => ({
                x: w.x,
                y: w.y,
                size: w.getSize(),
                color: w.color,
                texture: w.content.texture?.textureCacheIds?.[0] || null
            }));

        return {
            background: {
                color: this.background.tint,
                alpha: this.background.alpha
            },
            grid: {
                size: this.gridSize,
                visible: this.gridVisible
            },
            widgets
        };
    }

    importScene(data) {
        if (!data) return;

        // фон
        if (data.background) {
            this.changeBackground(data.background);
        }

        // сетка
        if (data.grid) {
            this.gridSize = data.grid.size;
            this.toggleGrid(data.grid.visible);
        }

        // удалить старые виджеты
        this.container.children
            .filter(c => c instanceof DraggableWidget)
            .forEach(c => this.container.removeChild(c));

        // создать новые
        if (data.widgets) {
            data.widgets.forEach(w => {
                let graphics = new PIXI.Graphics()
                    .beginFill(PIXI.utils.string2hex(w.color || "#ff0000"))
                    .drawRect(0, 0, w.size.width, w.size.height)
                    .endFill();

                const widget = this.addWidget(graphics, w.x, w.y);
                widget.color = w.color;
            });
        }
    }

    exportToHTML() {
        const data = this.exportScene();
        let html = `<div style="position:relative; width:${this._width}px; height:${this._height}px; background:#${data.background.color.toString(16)}; opacity:${data.background.alpha};">`;

        data.widgets.forEach(w => {
            html += `<div style="
                position:absolute;
                left:${w.x}px;
                top:${w.y}px;
                width:${w.size.width}px;
                height:${w.size.height}px;
                background:${w.color};
            "></div>`;
        });

        html += `</div>`;
        return html;
    }

    // ==== ОСНОВНОЙ ФУНКЦИОНАЛ ====

    setupKeyboardControls() {
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === 'h') {
                this.toggleDrag();
            }

            if (e.key === '+' || e.key === '=') {
                e.preventDefault();
                this.handleZoom({ deltaY: -100, global: this.getCenterPosition() });
            } else if (e.key === '-' || e.key === '_') {
                e.preventDefault();
                this.handleZoom({ deltaY: 100, global: this.getCenterPosition() });
            }
        });
    }

    getCenterPosition() {
        return {
            x: this.app.screen.width / 2,
            y: this.app.screen.height / 2
        };
    }

    toggleDrag() {
        this.dragEnabled = !this.dragEnabled;

        if (this.dragEnabled) {
            this.container.interactive = true;
            this.container.cursor = 'grab';
        } else {
            this.container.interactive = false;
            this.container.cursor = 'default';
            if (this.dragData) this.onDragEnd();
        }
    }

    setupZoom() {
        this.container.interactive = true;
        this.container.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);
        this.container.on('wheel', (event) => {
            event.preventDefault();
            this.handleZoom(event);
        });
    }

    handleZoom(event) {
        const delta = event.deltaY > 0 ? 0.9 : 1.1;

        const mousePos = {
            x: event.global.x - this.container.x,
            y: event.global.y - this.container.y
        };

        const oldScale = this.scale;
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * delta));
        this.container.scale.set(this.scale);

        const newMousePos = {
            x: mousePos.x * this.scale / oldScale,
            y: mousePos.y * this.scale / oldScale
        };

        this.container.x += mousePos.x - newMousePos.x;
        this.container.y += mousePos.y - newMousePos.y;

        this.updateGridAfterZoom();
    }

    updateGridAfterZoom() {
        if (this.grid) {
            this.createGrid({
                size: this.gridSize,
                thickness: 1 / this.scale
            });
        }
    }

    setupDrag() {
        this.container.interactive = true;
        this.container.hitArea = new PIXI.Rectangle(0, 0, this._width, this._height);

        this.container
            .on('pointerdown', this.onDragStart.bind(this))
            .on('pointerup', this.onDragEnd.bind(this))
            .on('pointerupoutside', this.onDragEnd.bind(this))
            .on('pointermove', this.onDragMove.bind(this));
    }

    onDragStart(event) {
        if (!this.dragEnabled) return;
        this.dragData = event.data;
        this.dragStart = {
            x: this.container.x,
            y: this.container.y,
            pointer: this.dragData.getLocalPosition(this.container.parent)
        };
        this.container.cursor = 'grabbing';
    }

    onDragMove(event) {
        if (!this.dragEnabled || !this.dragData) return;
        const newPosition = this.dragData.getLocalPosition(this.container.parent);
        const dx = newPosition.x - this.dragStart.pointer.x;
        const dy = newPosition.y - this.dragStart.pointer.y;
        this.container.x = this.dragStart.x + dx;
        this.container.y = this.dragStart.y + dy;
    }

    onDragEnd() {
        this.dragData = null;
        this.dragStart = null;
        this.container.cursor = 'grab';
    }

    createGrid(options) {
        if (options) {
            if (options.size !== undefined) this.gridSize = options.size;
            if (options.color !== undefined) this.gridColor = options.color;
            if (options.alpha !== undefined) this.gridAlpha = options.alpha;
        }

        if (this.grid) {
            this.container.removeChild(this.grid);
            this.grid.destroy({ children: true });
        }

        this.grid = new Graphics();
        this.grid.fill("rgb(83, 83, 83)", this.gridAlpha);
        const lineThickness = 0.5;

        for (let x = 0; x <= this._width; x += this.gridSize) {
            this.grid.rect(x - lineThickness / 2, 0, lineThickness, this._height);
        }
        for (let y = 0; y <= this._height; y += this.gridSize) {
            this.grid.rect(0, y - lineThickness / 2, this._width, lineThickness);
        }
        this.grid.endFill();

        if (!this.gridContainer) {
            this.gridContainer = new Container();
            this.container.addChild(this.gridContainer);
        }

        this.gridContainer.removeChildren();
        this.gridContainer.addChild(this.grid);
        this.grid.visible = this.gridVisible;
    }

    addWidget(widgetContent, x, y) {
        const bounds = new PIXI.Rectangle(0, 0, this._width, this._height);

        if (widgetContent instanceof DraggableWidget) {
            widgetContent.position.set(x, y);
            this.container.addChild(widgetContent);
            widgetContent.on("pointerdown", (e) => {
                e.stopPropagation(); // чтобы не срабатывал drag editor'а
                console.log(widgetContent)
            });
            return widgetContent;
        }

        const widget = new DraggableWidget(bounds, widgetContent);
        widget.position.set(x, y);
        this.container.addChild(widget);
        widget.on("pointerdown", (e) => {
            e.stopPropagation(); // чтобы не срабатывал drag editor'а
            console.log(widget)
        });

        return widget;
    }

    toggleGrid(visible) {
        this.gridVisible = visible !== undefined ? visible : !this.gridVisible;
        if (this.grid) {
            this.grid.visible = this.gridVisible;
        } else if (this.gridVisible) {
            this.createGrid();
        }
    }

    resize(width, height) {
        this._width = width;
        this._height = height;

        if (this.background) {
            this.background.width = width;
            this.background.height = height;
            if (this.background instanceof TilingSprite) {
                this.background.width = width;
                this.background.height = height;
            }
        }

        if (this.grid) {
            this.createGrid();
        }
    }

    snapToGrid(value) {
        return Math.round(value / this.gridSize) * this.gridSize;
    }

    createBackground() {
        const bg = new Sprite(Texture.WHITE);
        this.background = bg;
        this.resize(this.app.screen.width, this.app.screen.height);
        bg.tint = 'rgb(30, 30, 30)';
        this.container.addChild(bg);
    }

    getWidth() {
        return this._width;
    }

    getHeight() {
        return this._height;
    }

    getSize() {
        return { width: this._width, height: this._height };
    }

    changeBackground(options = {}) {
        if (!this.background) {
            this.createBackground();
        }

        if (options.color !== undefined) {
            this.background.tint = options.color;
        }

        if (options.texture) {
            PIXI.Assets.load(options.texture).then(texture => {
                this.background.texture = texture;
                if (options.tiling) {
                    const oldBg = this.background;
                    this.background = new TilingSprite(texture, this._width, this._height);
                    this.background.tint = oldBg.tint;
                    this.background.alpha = oldBg.alpha;
                    this.container.removeChild(oldBg);
                    this.container.addChildAt(this.background, 0);
                }
            });
        }

        if (options.alpha !== undefined) {
            this.background.alpha = options.alpha;
        }
    }
}
