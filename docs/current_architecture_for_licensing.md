# Архитектура I-panel Editor и серверного ПО

Документ описывает фактическую структуру программного комплекса, назначение его модулей, runtime-логику и взаимодействие редактора с серверными компонентами.

## 1. Состав репозитория

| Путь | Назначение |
| --- | --- |
| `src/main.js` | Главная точка входа редактора. Создает PixiJS application, подключает UI, модальные окна, виджеты, инспектор, preview mode, сохранение/загрузку сцены. |
| `src/editorFrame/editor.js` | Ядро холста: рабочее поле, фон, сетка, zoom/pan, выбор виджетов, фоновые режимы, размеры сцены, theme schedule/night mode. |
| `src/widgetsGrid/draggable_widget.js` | Базовый контейнер для виджетов: drag, resize, bounds, z-index, selection, snap-to-grid, рамки и визуальные эффекты. |
| `src/widgetsGrid/widgets/*.js` | Реализации виджетов: текст, изображения, видео, аудио, часы, календарь, погода, пробки, новости, курсы, металлы, форма, рисование, этаж/направление. |
| `src/HTMLGradientBuilder.js` | Конструктор фонов: цвет, градиент, изображение, видеофон, загрузка фона на backend. |
| `src/mediaManager.js` | Вспомогательная логика для медиа и плейлистов. |
| `src/batchWidgetData.js` | Пакетная загрузка данных для виджетов, чтобы не дергать API отдельно на каждый виджет. |
| `src/undoRedoManager.js` | История действий редактора в `localStorage`, undo/redo, восстановление состояния сцены. |
| `src/realTimeInspector.js` | Правая панель инспектора выбранных виджетов, групповое редактирование, свойства, стили, z-index, эффекты. |
| `public/` | Статические ассеты редактора: стили, иконки, фоны, пресеты, изображения виджетов. |
| `server_patch/` | Патчи backend: upload-файлы, range static, parse endpoints, новости, погода, металлы, курсы. |
| `tools/` | Скрипты нагрузочных отчетов и тестов. Не являются runtime-частью редактора. |
| `video/` | Отдельный простой видеосервис/страницы для проверки видеопотока. |

## 2. Frontend: редактор

Редактор - browser application на PixiJS 8. Сборка идет через Webpack, entry point - `src/main.js`, выход - `dist/bundle.js`.

Основной поток запуска:

1. `src/main.js` загружает шрифты и создает `new Application()`.
2. Создается `EditorFrame`, который добавляет на stage основной контейнер, рабочую область, фон, сетку и обработчики zoom/pan.
3. UI из `index.ejs` связывается с функциями добавления виджетов, настройками сцены, preview mode, сохранением и загрузкой.
4. Виджеты создаются как PixiJS containers/sprites/text/graphics и обычно оборачиваются в `DraggableWidget`.
5. Инспектор (`RealTimeInspector`) читает выбранный виджет и применяет изменения сразу в PixiJS-объект.
6. Состояние сцены сериализуется в JSON и передается в основную админку/backend.

Ключевая модель сцены:

- размер холста: `editor._width`, `editor._height`;
- контейнер сцены: `editor.innerContainer`;
- виджеты: дочерние элементы сцены, чаще всего `DraggableWidget`;
- фон: цвет, изображение, видео или gradient config;
- runtime-данные виджетов: настройки внутри экземпляров виджетов плюс внешний parse/media payload.

## 3. Виджеты

Все виджеты должны сохранять совместимость с общими операциями:

- позиция `x/y`;
- размер через `resize`, `setSize`, `_width/_height` или `getSize`;
- слой `zIndex`;
- фон, прозрачность, border, radius;
- эффект через `effectPreset` и методы `applyEffectPreset`/`setEffectPreset`, если виджет поддерживает эффекты;
- сериализация в общий JSON сцены.

Текущий набор виджетов:

| Виджет | Файл | Данные |
| --- | --- | --- |
| Текст | `text_widget.js` | Локальные настройки текста, шрифта, цвета, выравнивания. |
| Изображение | `image_widget.js` | URL/texture изображения, размеры, режим отображения. |
| Видео | `video.js` | URL видео, параметры воспроизведения, fullscreen/cover поведение. |
| Аудио | `audio_player_widget.js` | Плейлист, player number, громкость, цвет микшера. |
| Цифровые часы | `digital_clock.js` | Локальное время/стиль. |
| Аналоговые часы | `analog_clock.js` | Пресеты циферблатов/стрелок из `public/assets/analog_clock*`. |
| Календарь | `calendar.js` | Дата и визуальный пресет. |
| Погода | `weather.js` | `/api/parse/get_weather` или batch payload. |
| Пробки | `traffic.js` | `/api/parse/traffic` или batch payload. |
| Новости | `news.js` | `/api/parse/news`, RSS payload, QR-ссылки. |
| Курсы | `rates.js` | `/api/parse/rates`. |
| Металлы/нефть | `metals.js` | `/api/parse/metals`, fallback значения. |
| Компания | `about_company.js` | Статические пресеты компании. |
| Фигуры | `shape_widget.js` | Rectangle/shape graphics. |
| Рисование | `drawing_widget.js` | Рисовательный canvas/graphics слой. |
| Этаж/направление | `direction.js` | Экранное отображение направления/этажа. Может быть расширено под LiftState. |

## 4. Фон и медиа

`HTMLGradientBuilder` отвечает за фон сцены и поддерживает:

- простой цвет;
- linear/radial/conic gradients;
- image upload;
- video upload;
- восстановление сохраненного background config;
- upload видеофона на backend: `/api/new_file/{panel_id}/upload-background`.

## 5. Backend patch

`server_patch/` содержит изменения для FastAPI backend.

### Static/range

`server_patch/main.py` добавляет:

- `GET/HEAD /static/{file_path}` с `Range` support;
- `Cache-Control: public, max-age=31536000, immutable`;
- защиту от path traversal через `Path.resolve()`;
- streaming больших файлов чанками.

Это нужно для быстрых видео/изображений на панелях и в редакторе.

### New file API

`server_patch/new_file_router.py` и `server_patch/new_file_repository.py`:

- загрузка файлов в `static/{panel_id}/`;
- уникальные имена файлов;
- определение длительности видео;
- `ffmpeg -movflags +faststart` для MP4;
- хранение записей в `files_new`;
- сдвиг позиций медиа при добавлении фоновых/служебных файлов.

### Parse API

`server_patch/parse_router.py`:

- `GET /api/parse/get_brent`;
- `GET /api/parse/news`;
- `GET /api/parse/get_weather`;
- `GET /api/parse/metals`;
- `GET /api/parse/traffic`;
- `GET /api/parse/rates`;
- `POST /api/parse/batch`.

Batch endpoint нужен, чтобы runtime панели мог получить данные для нескольких виджетов одним запросом.

## 6. Развертывание на сервере

Фактический серверный контур сейчас разделен на несколько частей:

| Часть | Назначение |
| --- | --- |
| Editor frontend | PixiJS-редактор, сборка Webpack, обычно отдается как static/dist или через dev server для разработки. |
| Main admin/frontend | Главная админка, мониторинг, таблицы панелей, Telegram/уведомления. Это отдельный frontend, не смешивать с PixiJS editor. |
| Backend API | FastAPI backend с пользователями, панелями, файлами, parse API и static media. |
| Static storage | Каталог `static/` на backend, где лежат загруженные медиа по `panel_id`. |
| External data | RSS/news, Open-Meteo, CBR rates, oil/metals fallback, MQTT/REST лифтовых данных при подключении lift widgets. |

Порядок взаимодействия компонентов:

1. Webpack собирает editor из `src/main.js` в `dist/bundle.js`.
2. Собранный `dist/` отдается через backend static hosting или nginx.
3. Backend обслуживает API и каталог `/static`.
4. Главная админка открывает editor с `panel_id` в query string.
5. Editor сериализует сцену и сохраняет ее через существующие API админки.
6. Панель/runtime получает сохраненную сцену, медиа и batch parse data.

Каталог `server_patch/` не является отдельным backend-приложением. Он содержит готовые изменения, которые используются в соответствующих модулях основного FastAPI backend.
