// ImageWidget.js
import { Container, Graphics, Sprite } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import * as PIXI from "pixi.js";

export default class ImageWidget extends DraggableWidget {
    constructor(bounds, options = {}) {
        const width = options.width ?? 400;
        const height = options.height ?? 300;

        const content = new Container();

        // Прямоугольник фона
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);
        super(bounds, content, options);

        // Сохраняем исходные размеры для масштабирования
        this.originalWidth = width;
        this.originalHeight = height;
        this.contentContainer = new Container();
        content.addChild(this.contentContainer);
        this._width = width;
        this._height = height;

        // Сохраняем стили для API
        this.bg = bg;
        this._backgroundColor = options.backgroundColor ?? 0x1e1e1e;
        this._backgroundAlpha = options.backgroundAlpha ?? 1;
        this._cornerRadius = options.cornerRadius ?? 32;

        this._borderColor = options.borderColor ?? 0xffffff;
        this._borderAlpha = options.borderAlpha ?? 1;
        this._borderWidth = options.borderWidth ?? 0;

        this.type = "ImageWidget";

        // Создаем элементы интерфейса
        this.createUI();

        // Если передан URL изображения, загружаем его
        if (options.imageUrl) {
            this.setImage(options.imageUrl);
        }

        // Рисуем начальный фон
        this._redrawBackground();
    }

    createUI() {
        // Контейнер для изображения
        this.imageContainer = new Container();
        this.imageContainer.position.set(20, 20);
        this.contentContainer.addChild(this.imageContainer);

        // Маска для закругления изображения
        this.imageMask = new Graphics();
        this.imageMask
            .beginFill(0xffffff)
            .drawRoundedRect(0, 0, this._width - 40, this._height - 40, this._cornerRadius - 8)
            .endFill();
        this.imageContainer.addChild(this.imageMask);

        // Основное изображение
        this.mainImage = Sprite.from(PIXI.Texture.EMPTY);
        this.mainImage.width = this._width - 40;
        this.mainImage.height = this._height - 40;
        this.mainImage.mask = this.imageMask;
        this.imageContainer.addChild(this.mainImage);

        // Текст-заглушка когда изображение не загружено
        this.placeholderText = new PIXI.Text("Изображение не загружено", {
            fontFamily: "Arial",
            fontSize: 16,
            fill: 0x888888,
            align: "center"
        });
        this.placeholderText.anchor.set(0.5);
        this.placeholderText.position.set((this._width - 40) / 2, (this._height - 40) / 2);
        this.imageContainer.addChild(this.placeholderText);
    }

    // Переопределяем метод ресайза
    onResize(width, height) {
        // Обновляем внутренние размеры
        this._width = width;
        this._height = height;

        // Обновляем размеры маски и контейнера
        this.imageMask.clear();
        this.imageMask
            .beginFill(0xffffff)
            .drawRoundedRect(0, 0, width - 40, height - 40, this._cornerRadius - 8)
            .endFill();

        // Обновляем максимальные размеры изображения
        this.mainImage.width = width - 40;
        this.mainImage.height = height - 40;

        // Перерисовываем фон с новыми размерами
        this._redrawBackground();

        // Центрируем placeholder текст
        this.placeholderText.position.set((width - 40) / 2, (height - 40) / 2);

        // Пересчитываем размеры изображения если оно загружено
        if (this.mainImage.texture !== PIXI.Texture.EMPTY) {
            this._fitImageToContainer();
        }
    }

    // === API для управления стилем ===
    _redrawBackground() {
        this.bg.clear();

        // Фон
        this.bg.beginFill(this._backgroundColor, this._backgroundAlpha)
            .drawRoundedRect(0, 0, this._width, this._height, this._cornerRadius)
            .endFill();

        // Рамка
        if (this._borderWidth > 0 && this._borderAlpha > 0) {
            const inset = this._borderWidth / 2;
            this.bg
                .roundRect(
                    inset,
                    inset,
                    Math.max(0, this._width - this._borderWidth),
                    Math.max(0, this._height - this._borderWidth),
                    Math.max(0, this._cornerRadius - inset),
                )
                .stroke({
                    width: this._borderWidth,
                    color: this._borderColor,
                    alpha: this._borderAlpha,
                });
        }
    }

    // Подгонка изображения под контейнер с сохранением пропорций
    _fitImageToContainer() {
        if (!this.mainImage.texture || this.mainImage.texture === PIXI.Texture.EMPTY) return;

        const containerWidth = this._width - 40;
        const containerHeight = this._height - 40;
        const imageWidth = this.mainImage.texture.width;
        const imageHeight = this.mainImage.texture.height;

        // Рассчитываем масштаб для сохранения пропорций
        const scale = Math.min(
            containerWidth / imageWidth,
            containerHeight / imageHeight
        );

        // Устанавливаем новые размеры
        this.mainImage.width = imageWidth * scale;
        this.mainImage.height = imageHeight * scale;

        // Центрируем изображение
        this.mainImage.position.set(
            (containerWidth - this.mainImage.width) / 2,
            (containerHeight - this.mainImage.height) / 2
        );
    }

    // Основной метод для установки изображения по URL
    setImage(url) {
        if (!url || typeof url !== 'string') {
            console.error('Invalid image URL:', url);
            return this;
        }

        this.placeholderText.visible = false;

        // Используем PIXI.Assets для загрузки изображения
        PIXI.Assets.load(url)
            .then((texture) => {
                this.mainImage.texture = texture;
                this._fitImageToContainer();
                this.placeholderText.visible = false;
            })
            .catch((error) => {
                console.error('Error loading image:', error);
                this.mainImage.texture = PIXI.Texture.EMPTY;
                this.placeholderText.visible = true;
                this.placeholderText.text = 'Ошибка загрузки';
            });

        return this;
    }

    // Альтернативный метод с тем же названием для совместимости
    setImageUrl(url) {
        return this.setImage(url);
    }

    // Очистка изображения
    clearImage() {
        this.mainImage.texture = PIXI.Texture.EMPTY;
        this.placeholderText.visible = true;
        this.placeholderText.text = 'Изображение не загружено';
        return this;
    }

    // Установка режима отображения изображения
    setImageDisplayMode(mode) {
        if (!this.mainImage.texture || this.mainImage.texture === PIXI.Texture.EMPTY) return this;

        const containerWidth = this._width - 40;
        const containerHeight = this._height - 40;
        const imageWidth = this.mainImage.texture.width;
        const imageHeight = this.mainImage.texture.height;

        switch (mode) {
            case 'fill': // Заполнить весь контейнер (без сохранения пропорций)
                this.mainImage.width = containerWidth;
                this.mainImage.height = containerHeight;
                this.mainImage.position.set(0, 0);
                break;

            case 'fit': // Вписать с сохранением пропорций (по умолчанию)
                this._fitImageToContainer();
                break;

            case 'stretch': // Растянуть (то же что и fill)
                this.mainImage.width = containerWidth;
                this.mainImage.height = containerHeight;
                this.mainImage.position.set(0, 0);
                break;

            case 'cover': // Заполнить с обрезкой
                const scaleX = containerWidth / imageWidth;
                const scaleY = containerHeight / imageHeight;
                const scale = Math.max(scaleX, scaleY);
                this.mainImage.width = imageWidth * scale;
                this.mainImage.height = imageHeight * scale;
                this.mainImage.position.set(
                    (containerWidth - this.mainImage.width) / 2,
                    (containerHeight - this.mainImage.height) / 2
                );
                break;

            case 'center': // По центру без масштабирования
                this.mainImage.width = imageWidth;
                this.mainImage.height = imageHeight;
                this.mainImage.position.set(
                    (containerWidth - imageWidth) / 2,
                    (containerHeight - imageHeight) / 2
                );
                break;

            default:
                this._fitImageToContainer();
        }

        return this;
    }

    // Методы для управления фоном
    setColor(color) {
        this._backgroundColor = color;
        this._redrawBackground();
        return this;
    }

    setAlpha(alpha) {
        this._backgroundAlpha = alpha;
        this._redrawBackground();
        return this;
    }

    setCornerRadius(radius) {
        this._cornerRadius = radius;

        // Обновляем маску изображения
        this.imageMask.clear();
        this.imageMask
            .beginFill(0xffffff)
            .drawRoundedRect(0, 0, this._width - 40, this._height - 40, radius - 8)
            .endFill();

        this._redrawBackground();
        return this;
    }

    setBackgroundColor(color) {
        this.setColor(color);
        return this;
    }

    setBackgroundAlpha(alpha) {
        this.setAlpha(alpha);
        return this;
    }

    // Методы для рамки
    setBorder(color, width = 1, alpha = 1) {
        this._borderColor = color;
        this._borderWidth = width;
        this._borderAlpha = alpha;
        this._redrawBackground();
        return this;
    }

    removeBorder() {
        this._borderWidth = 0;
        this._redrawBackground();
        return this;
    }

    // Геттеры для получения свойств
    getImageUrl() {
        // Возвращаем URL если он где-то сохранен, или null
        return this._currentImageUrl || null;
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

    // Получение информации о загруженном изображении
    getImageInfo() {
        if (!this.mainImage.texture || this.mainImage.texture === PIXI.Texture.EMPTY) {
            return null;
        }

        return {
            width: this.mainImage.texture.width,
            height: this.mainImage.texture.height,
            displayedWidth: this.mainImage.width,
            displayedHeight: this.mainImage.height,
            position: {
                x: this.mainImage.position.x,
                y: this.mainImage.position.y
            }
        };
    }

    // Экспорт состояния
    exportState() {
        return {
            ...super.exportState(),
            type: this.type,
            imageUrl: this._currentImageUrl,
            styles: {
                backgroundColor: this._backgroundColor,
                backgroundAlpha: this._backgroundAlpha,
                cornerRadius: this._cornerRadius,
                borderColor: this._borderColor,
                borderAlpha: this._borderAlpha,
                borderWidth: this._borderWidth
            }
        };
    }

    // Импорт состояния
    importState(state) {
        super.importState(state);

        if (state.imageUrl) {
            this.setImage(state.imageUrl);
        }

        if (state.styles) {
            const styles = state.styles;
            this._backgroundColor = styles.backgroundColor ?? this._backgroundColor;
            this._backgroundAlpha = styles.backgroundAlpha ?? this._backgroundAlpha;
            this._cornerRadius = styles.cornerRadius ?? this._cornerRadius;
            this._borderColor = styles.borderColor ?? this._borderColor;
            this._borderAlpha = styles.borderAlpha ?? this._borderAlpha;
            this._borderWidth = styles.borderWidth ?? this._borderWidth;

            // Обновляем маску с новым радиусом
            this.imageMask.clear();
            this.imageMask
                .beginFill(0xffffff)
                .drawRoundedRect(0, 0, this._width - 40, this._height - 40, this._cornerRadius - 8)
                .endFill();

            this._redrawBackground();
        }

        return this;
    }

    destroy(options) {
        // Очищаем текстуру если она есть
        if (this.mainImage.texture && this.mainImage.texture !== PIXI.Texture.EMPTY) {
            this.mainImage.texture.destroy(true);
        }

        this.mainImage.destroy();
        this.imageMask.destroy();
        this.placeholderText.destroy();
        this.bg.destroy();
        super.destroy(options);
    }
}