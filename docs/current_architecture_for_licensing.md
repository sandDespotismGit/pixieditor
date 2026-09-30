# Текущая архитектура I-panel Editor и серверного ПО

Документ предназначен для разработчика, который будет лицензировать и упаковывать текущее ПО на сервере. Здесь описана фактическая структура редактора, runtime-логика, серверные точки интеграции и места, куда безопасно встраивать проверку лицензии.

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

Для лицензирования важно: загрузку медиа и применение сцен лучше проверять на backend, а frontend считать недоверенным клиентом. Любые ограничения в UI удобны, но не являются защитой.

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

Рекомендуемый production-поток:

1. Собрать editor: `npm run build`.
2. Передать `dist/` в backend/static hosting или nginx.
3. Backend держит API и `/static`.
4. Admin открывает editor с `panel_id` в query string.
5. Editor сохраняет сцену в backend через существующие API админки.
6. Панель/runtime получает сцену, медиа и batch parse data.

## 7. Где встраивать лицензирование

Frontend нельзя считать надежной точкой защиты. Лицензия должна проверяться на backend и в runtime-выдаче данных.

### Минимальный набор сущностей

| Сущность | Что хранить |
| --- | --- |
| `license` | license_id, owner_id, status, issued_at, expires_at, allowed_domains, allowed_panels, allowed_features. |
| `installation` | installation_id, server_fingerprint, domain, created_at, last_seen_at. |
| `panel_limit` | max_panels, max_storage_mb, max_scenes, max_users. |
| `feature_flags` | editor, monitoring, device_player, lift_widgets, telegram_bot, video_upload, mqtt_lift. |
| `license_audit` | событие, время, IP, user_id, panel_id, результат проверки. |

### Точки проверки

| Точка | Что проверять |
| --- | --- |
| Авторизация в главной админке | Активность лицензии, домен, срок действия, статус клиента. |
| Открытие editor | Доступ к редактору и выбранному `panel_id`. |
| Сохранение сцены | Лимиты панелей/сцен, feature flags, срок лицензии. |
| Upload media | Лимит хранилища, разрешение video/image/audio upload. |
| Выдача сцены панели | Лицензия активна, панель входит в лимит, устройство не заблокировано. |
| Parse/batch API | Ограничение по enabled widgets/features. |
| Lift REST/MQTT | Отдельный feature flag `lift_widgets` или `mqtt_lift`. |
| Telegram bot | Feature flag `telegram_bot`, лимиты объектов и уведомлений. |

### Поведение при проблемах лицензии

- В админке показывать понятную причину: истек срок, превышен лимит, feature недоступна.
- Runtime панели не должен резко гаснуть при краткой ошибке проверки. Нужен grace period.
- При истекшей лицензии можно показывать последнюю сцену ограниченное время, но запретить сохранение новых сцен и upload.
- Проверку лицензии кэшировать локально на сервере, чтобы внешний license server не ломал работающие панели при кратком сбое связи.

## 8. Предлагаемая схема license server

Вариант для коммерческой поставки:

1. На клиентском сервере хранится signed license token.
2. Backend при старте проверяет подпись токена локально.
3. Периодически backend отправляет heartbeat на центральный license server.
4. License server возвращает статус и feature flags.
5. При недоступности license server backend использует последний валидный статус в пределах grace period.

Минимальные endpoint'ы:

| Endpoint | Назначение |
| --- | --- |
| `POST /license/activate` | Активация установки по ключу. |
| `POST /license/heartbeat` | Периодическое подтверждение установки. |
| `GET /license/status` | Текущий статус лицензии и feature flags. |
| `POST /license/deactivate` | Отвязка установки. |

## 9. Что нельзя класть в публичный репозиторий

- Пароли SSH, root credentials, private keys.
- Секретные ключи внешних API.
- Реальные customer tokens, JWT refresh tokens, Telegram bot token.
- Production `.env`.
- Бэкапы базы данных.
- Каталог `static/` с клиентскими медиа, если там реальные файлы заказчика.

В репозитории должны быть только исходники, шаблоны конфигов, миграции/схемы без секретов и документация.

## 10. Быстрый старт для кодера

```bash
npm install
npm run build
```

Для разработки:

```bash
npm run dev
```

Редактор ожидает `panel_id` в URL, например:

```text
http://localhost:5143/?panel_id=11110012
```

Если проверяется backend patch, разработчику нужно развернуть основной FastAPI backend проекта и перенести файлы из `server_patch/` в соответствующие модули backend. Этот каталог не является отдельным полноценным backend-приложением, а хранит готовые изменения для серверной части.

## 11. Текущие важные доработки в этой версии

- Добавлены новые виджеты: audio player, drawing, shape.
- Расширены настройки общих эффектов/теней виджетов.
- Добавлены фоновые ассеты под разные ориентации экранов.
- Добавлен HTML-конструктор фонов с image/video upload.
- Добавлен batch-подход к данным виджетов.
- Добавлены undo/redo и real-time inspector.
- Улучшена серверная раздача static files с HTTP Range.
- Добавлена обработка загрузки медиа и faststart optimization для MP4.
- Обновлены parse endpoints: новости, погода, металлы, курсы, batch.

## 12. Рекомендации перед лицензированием

1. Вынести API base URL и режим окружения в явный конфиг.
2. Убрать прямые production URL из frontend-кода или сделать их fallback.
3. Добавить `.env.example` для backend и frontend.
4. Описать формат сохраненной сцены JSON как отдельную схему.
5. Покрыть license checks backend-тестами: active, expired, over limit, grace period, feature disabled.
6. Отдельно проверить, что frontend не содержит секретов перед публикацией.
