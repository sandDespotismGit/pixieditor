import { Container, Graphics, Text, TextStyle, Sprite } from "pixi.js";
import DraggableWidget from "../draggable_widget";
import * as PIXI from 'pixi.js';

export default class NewsWidget extends DraggableWidget {

    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        super(bounds, content, options);
        this._width = width;
        this._height = height;
        this.bg = bg;

        // URL API для новостей
        this.newsApiUrl = "https://admin.i-panel.pro:8088/rbc_news";

        // Переменные для хранения данных
        this.news = [];
        this.currentIndex = 0;
        this.textColor = options.textColor ?? 0xFFFFFF;

        // Создаем элементы интерфейса
        this.createUI();

        // Загружаем новости с задержкой как в оригинале
        setTimeout(() => {
            this.loadNews();
            this._updateTimer = setInterval(() => this.loadNews(), options.updateInterval ?? 300000);
            this._changeTimer = setInterval(() => this.changeNews(), options.changeInterval ?? 30000);
        }, 5000);
    }

    createUI() {
        // Контейнер для всего контента новостей
        this.newsContainer = new Container();
        this.newsContainer.position.set(32, 32);
        this.content.addChild(this.newsContainer);

        // Заголовок 1
        this.titleText = new Text('------', new TextStyle({
            fontFamily: 'Rubik',
            fontSize: 20,
            fontWeight: '400',
            fill: this.textColor,
            align: 'left',
            wordWrap: true,
            wordWrapWidth: this._width - 96
        }));
        this.titleText.position.set(16, 0);
        this.newsContainer.addChild(this.titleText);

        // Контейнер для изображения с position: relative
        this.imageContainer = new Container();
        this.imageContainer.position.set(0, 100);
        this.newsContainer.addChild(this.imageContainer);

        // Маска для закругления изображения
        this.imageMask = new Graphics();
        this.imageMask.beginFill(0xFFFFFF)

            .drawRoundedRect(0, 0, this.width, 250, 0)
            .endFill();
        this.imageContainer.addChild(this.imageMask);

        // Основное изображение
        this.mainImage = Sprite.from(PIXI.Texture.EMPTY);
        this.mainImage.width = this.width - 96;
        this.mainImage.height = 250;
        this.mainImage.mask = this.imageMask;
        this.imageContainer.addChild(this.mainImage);

        // Контейнер для QR-кода с position: absolute
        this.qrContainer = new Container();
        this.qrContainer.position.set(this.width - 120 - 98, 133); // right: 16px, bottom: 16px
        this.imageContainer.addChild(this.qrContainer);

        // QR код
        this.qrImage = Sprite.from(PIXI.Texture.EMPTY);
        this.qrImage.width = 90;
        this.qrImage.height = 90;
        this.qrImage.position.set(15, 15); // Отступы от фона
        this.qrContainer.addChild(this.qrImage);

        // Категория
        this.categoryText = new Text('------', new TextStyle({
            fontFamily: 'Rubik',
            fontSize: 18,
            fontWeight: '300',
            fill: this.textColor,
            align: 'left',
            wordWrap: true,
            wordWrapWidth: this._width - 96,

        }));
        this.categoryText.position.set(16, 370);
        this.newsContainer.addChild(this.categoryText);
    }

    changeNews() {
        if (this.news.length === 0) return;

        if (this.currentIndex < this.news.length - 1) {
            this.currentIndex += 1;
        } else {
            this.currentIndex = 0;
        }

        const newsItem = this.news[this.currentIndex];
        console.log('Current news item:', newsItem); // Для отладки

        // Обновляем текст
        this.titleText.text = newsItem.title || '------';
        this.categoryText.text = newsItem.category;

        // Обновляем изображения
        const mainImageUrl = this.isValidImageUrl(newsItem.image)
            ? newsItem.image
            : 'https://s1.1zoom.me/b5050/336/371426-svetik_3840x2400.jpg';

        this.loadImage(this.mainImage, mainImageUrl);

        // Загружаем QR код если он есть
        if (newsItem.qr_code) {
            console.log('QR code data available:', newsItem.qr_code.substring(0, 50) + '...'); // Для отладки
            this.loadQRCode(this.qrImage, newsItem.qr_code);
        } else {
            console.log('No QR code data');
            this.qrImage.texture = PIXI.Texture.EMPTY;
        }
    }

    isValidImageUrl(url) {
        return url && (url.includes('jpeg') || url.includes('png') || url.includes('jpg') || url.includes('http'));
    }

    async loadImage(sprite, url) {
        try {
            const texture = await PIXI.Assets.load(url);
            sprite.texture = texture;
            // Сохраняем пропорции изображения
            const scale = Math.min(400 / texture.width, 250 / texture.height);
            sprite.width = texture.width * scale;
            sprite.height = texture.height * scale;
            sprite.position.set(
                (400 - sprite.width) / 2,
                (250 - sprite.height) / 2
            );
        } catch (error) {
            console.error('Error loading image:', error);
            sprite.texture = PIXI.Texture.EMPTY;
        }
    }

    async loadQRCode(sprite, qrBase64) {
        try {
            // Проверяем, что данные не пустые
            if (!qrBase64 || qrBase64.trim() === '') {
                throw new Error('Empty QR code data');
            }

            // Очищаем base64 от возможных префиксов
            let cleanBase64 = qrBase64;
            if (qrBase64.includes('base64,')) {
                cleanBase64 = qrBase64.split('base64,')[1];
            }

            // Удаляем возможные пробелы и переносы
            cleanBase64 = cleanBase64.trim().replace(/\s/g, '');

            // Проверяем, что это валидный base64
            if (!this.isValidBase64(cleanBase64)) {
                throw new Error('Invalid base64 data');
            }

            // Создаем текстуру из base64
            const base64String = `data:image/png;base64,${cleanBase64}`;
            console.log('Loading QR from:', base64String.substring(0, 100) + '...');

            const texture = await PIXI.Texture.fromURL(base64String);
            sprite.texture = texture;
            sprite.visible = true;
            console.log('QR code loaded successfully');

        } catch (error) {
            console.error('Error loading QR code:', error);
            sprite.texture = PIXI.Texture.EMPTY;
            sprite.visible = false;

            // Пробуем альтернативный метод загрузки
            this.tryAlternativeQRLoad(sprite, qrBase64);
        }
    }

    async tryAlternativeQRLoad(sprite, qrBase64) {
        try {
            // Альтернативный метод: создаем изображение через DOM
            const img = new Image();
            img.onload = () => {
                const texture = PIXI.Texture.from(img);
                sprite.texture = texture;
                sprite.visible = true;
                console.log('QR code loaded via alternative method');
            };
            img.onerror = () => {
                console.error('Alternative QR load failed');
                sprite.texture = PIXI.Texture.EMPTY;
                sprite.visible = false;
            };
            img.src = `data:image/png;base64,${qrBase64}`;
        } catch (error) {
            console.error('Alternative QR load also failed:', error);
        }
    }

    isValidBase64(str) {
        try {
            // Простая проверка base64
            return /^[A-Za-z0-9+/]*={0,2}$/.test(str) && str.length % 4 === 0;
        } catch (e) {
            return false;
        }
    }

    loadNews = async () => {
        try {
            const response = await fetch(this.newsApiUrl, {
                method: "GET",
                headers: {
                    accept: "application/json"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            this.news = result;
            console.log("News loaded:", this.news);

            // Если новости загружены, показываем первую
            if (this.news.length > 0) {
                this.changeNews();
            }
        }
        catch (error) {
            console.error("Error loading news:", error);
            this.showErrorState();
        }
    }

    showErrorState() {
        this.titleText.text = "Ошибка загрузки новостей";
        this.categoryText.text = "Ошибка";
    }

    destroy(options) {
        if (this._updateTimer) {
            clearInterval(this._updateTimer);
            this._updateTimer = null;
        }

        if (this._changeTimer) {
            clearInterval(this._changeTimer);
            this._changeTimer = null;
        }

        super.destroy(options);
    }
}