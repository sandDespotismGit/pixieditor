from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    KeepTogether,
    ListFlowable,
    ListItem,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
)
from reportlab.lib.styles import ParagraphStyle


ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "output" / "pdf"
FONT_PATH = ROOT / "tmp" / "fonts" / "Montserrat-Regular.ttf"


def register_fonts():
    pdfmetrics.registerFont(TTFont("MontserratDoc", str(FONT_PATH)))


def stylesheet():
    return {
        "title": ParagraphStyle(
            "title",
            fontName="MontserratDoc",
            fontSize=11,
            leading=15,
            alignment=TA_CENTER,
            textColor=colors.black,
            spaceAfter=8,
        ),
        "h": ParagraphStyle(
            "h",
            fontName="MontserratDoc",
            fontSize=11,
            leading=15,
            alignment=TA_LEFT,
            textColor=colors.black,
            spaceBefore=8,
            spaceAfter=4,
            keepWithNext=True,
        ),
        "body": ParagraphStyle(
            "body",
            fontName="MontserratDoc",
            fontSize=11,
            leading=15,
            alignment=TA_LEFT,
            textColor=colors.black,
            spaceAfter=4,
        ),
        "bullet": ParagraphStyle(
            "bullet",
            fontName="MontserratDoc",
            fontSize=11,
            leading=15,
            alignment=TA_LEFT,
            textColor=colors.black,
            leftIndent=0,
            spaceAfter=2,
        ),
    }


def p(text, style):
    return Paragraph(text, style)


def bullets(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=0) for item in items],
        bulletType="bullet",
        bulletFontName="MontserratDoc",
        bulletFontSize=11,
        leftIndent=14,
        bulletIndent=4,
        spaceAfter=4,
    )


def numbered(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item, style), leftIndent=0) for item in items],
        bulletType="1",
        bulletFontName="MontserratDoc",
        bulletFontSize=11,
        leftIndent=18,
        bulletIndent=4,
        start="1",
        spaceAfter=4,
    )


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("MontserratDoc", 11)
    canvas.setFillColor(colors.black)
    canvas.drawRightString(195 * mm, 10 * mm, f"{doc.page}")
    canvas.restoreState()


def build_pdf(path, title, subtitle, sections):
    styles = stylesheet()
    doc = BaseDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title=title,
        author="I-PANEL",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    story = [
        p(title.upper(), styles["title"]),
        p(subtitle, styles["title"]),
        Spacer(1, 4 * mm),
    ]

    for index, section in enumerate(sections, start=1):
        story.append(p(f"{index}. {section['title']}", styles["h"]))
        if section.get("text"):
            for paragraph in section["text"]:
                story.append(p(paragraph, styles["body"]))
        if section.get("bullets"):
            story.append(bullets(section["bullets"], styles["bullet"]))
        if section.get("numbered"):
            story.append(numbered(section["numbered"], styles["bullet"]))
        if section.get("break_after"):
            story.append(PageBreak())
        else:
            story.append(Spacer(1, 1.5 * mm))

    doc.build(story)


BOT_SECTIONS = [
    {
        "title": "Назначение",
        "text": [
            "Разработать Telegram-бот мониторинга I-PANEL для приема обращений по конкретным панелям, уведомления администраторов и быстрого просмотра состояния устройств.",
            "MVP не выполняет команды лечения панели. Диагностика и восстановление выполняются через веб-мониторинг, Remote Console, Agent и Watchdog.",
        ],
    },
    {
        "title": "Роли доступа",
        "bullets": [
            "Публичный пользователь: попадает в бот по QR конкретной панели и может создать обращение или лид.",
            "Администратор: получает уведомления, просматривает панели, скриншоты, статусы, историю заявок и меняет статус заявки.",
            "Техподдержка: использует ссылки из бота для перехода в карточку панели в мониторинге или Remote Console.",
        ],
    },
    {
        "title": "Данные панели",
        "text": [
            "Бот работает с существующей моделью панели: factory/fabric number, Panel ID, название объекта, адрес, last seen, online/offline, текущая тема, версия Player, последняя ошибка, последний скриншот и базовая телеметрия.",
            "Источник данных - Monitoring Backend и данные Remote Console Agent. Для текущего Player используется получение темы по factory number и отправка скриншотов/телеметрии в мониторинг.",
        ],
    },
    {
        "title": "Публичный QR-сценарий",
        "numbered": [
            "Пользователь сканирует QR-код, размещенный на экране или рядом с панелью.",
            "QR открывает Telegram-бота с параметром конкретной панели. Параметр должен быть подписанным токеном, а не открытым редактируемым ID.",
            "Бот определяет панель, показывает только клиентское меню: Сообщить о проблеме, Хочу такую панель, Оставить контакт.",
            "При проблеме бот запрашивает тип проблемы, комментарий, фото или видео по желанию, имя и контакт по желанию.",
            "После отправки бот создает заявку, присваивает номер, фиксирует время и отправляет уведомление администраторам.",
        ],
    },
    {
        "title": "Админское меню",
        "bullets": [
            "Список панелей с фильтрами: все, онлайн, офлайн, с ошибками, без свежего скриншота.",
            "Поиск панели по factory number, Panel ID, названию объекта или адресу.",
            "Карточка панели: статус, last seen, текущая тема, CPU, диск, температура, последняя ошибка, последний скриншот.",
            "История скриншотов за выбранный период с пагинацией и ссылкой на веб-мониторинг.",
            "Список заявок: новые, в работе, выезд, закрытые.",
            "Действия по заявке: принять в работу, назначить выезд, закрыть, добавить комментарий.",
        ],
    },
    {
        "title": "Уведомления администраторам",
        "text": [
            "Уведомления отправляются в два канала: Telegram-диалог/служебный чат и email. При добавлении администратора обязательно указываются Telegram ID, имя, email и признак активности.",
        ],
        "bullets": [
            "Новая заявка по QR.",
            "Панель offline дольше заданного порога.",
            "Нет свежего скриншота дольше заданного порога.",
            "На скриншоте обнаружен рабочий стол, черный экран или нештатный экран вместо темы.",
            "После публикации темы панель не обновилась в течение контрольного интервала.",
            "Высокие CPU, температура, заполнение диска или ошибка Player/Agent.",
        ],
    },
    {
        "title": "Правила антиспама",
        "bullets": [
            "Одинаковые технические события по одной панели объединяются в одно активное предупреждение.",
            "Повторное уведомление по той же причине отправляется не чаще заданного интервала.",
            "Публичные обращения ограничиваются по частоте для одного Telegram-пользователя и одной панели.",
            "Закрытие технического предупреждения фиксируется отдельным событием после восстановления нормы.",
        ],
    },
    {
        "title": "Заявки и статусы",
        "bullets": [
            "Статусы заявки: новая, в работе, выезд, закрыта.",
            "Заявка хранит Panel ID, factory number, объект, тип обращения, текст, вложения, автора, контакт, статус, историю изменений.",
            "Каждое изменение статуса логируется: кто изменил, когда изменил, старое и новое значение.",
            "Открытые заявки должны напоминаться администраторам по расписанию до закрытия.",
        ],
    },
    {
        "title": "Интеграции и API",
        "bullets": [
            "Monitoring API: получение списка устройств, карточки устройства, последнего скриншота, истории скриншотов, метрик и логов.",
            "Remote Console API: получение технической телеметрии и ссылок на диагностику без выполнения произвольных команд из бота.",
            "Email: SMTP или внешний почтовый провайдер для дублирования критичных уведомлений.",
            "Telegram Bot API: inline-меню, callback-действия, загрузка вложений, служебные уведомления.",
        ],
    },
    {
        "title": "Безопасность",
        "bullets": [
            "Публичный QR не дает доступа к техническим данным панели.",
            "Админские функции доступны только Telegram ID из белого списка.",
            "QR-токен одноразовый или ограниченный по сроку, подписан сервером и содержит идентификатор панели.",
            "Бот не принимает и не выполняет произвольные команды ОС.",
            "Все действия администратора и системные уведомления сохраняются в журнале.",
        ],
    },
    {
        "title": "Критерии приемки",
        "bullets": [
            "QR конкретной панели открывает бот и создает обращение с корректной привязкой к панели.",
            "Администратор получает обращение в Telegram и на email.",
            "Администратор видит карточку панели, последний скриншот и краткую телеметрию.",
            "Статусы заявок изменяются из меню бота и сохраняются в системе.",
            "Технические предупреждения создаются автоматически по заданным условиям и не дублируются без интервала.",
            "Публичный пользователь не видит список панелей, технические статусы и админское меню.",
        ],
    },
]


PAIRING_SECTIONS = [
    {
        "title": "Назначение",
        "text": [
            "Реализовать подключение физического экрана I-PANEL к опубликованной теме через QR-код или короткий код подключения, а также тест корректности показа после привязки.",
            "Целевой результат: пользователь публикует тему в редакторе, подключает экран, экран получает тему, показывает ее в полноэкранном Player и отображается в мониторинге.",
        ],
    },
    {
        "title": "Термины",
        "bullets": [
            "Тема: опубликованный набор виджетов, медиа, фона, расписаний и настроек показа.",
            "Player: приложение на mini-PC/панели, которое показывает опубликованную тему.",
            "Panel ID: внутренняя панель в админке, связанная с объектом, адресом и местом установки.",
            "Factory number: производственный номер панели, используемый Player для получения темы и мониторинга.",
            "Pairing: связь device -> account -> Panel ID -> theme.",
            "Pairing code: временный код подключения, отображаемый Player.",
        ],
    },
    {
        "title": "Состояния Player",
        "bullets": [
            "Unpaired: устройство не привязано и показывает экран подключения с QR-кодом и коротким кодом.",
            "Paired: устройство привязано к Panel ID и получает назначенную опубликованную тему.",
            "Offline cache: при потере сети устройство продолжает показывать последний успешно загруженный пакет темы.",
            "Error: устройство не смогло получить или применить тему и отправляет ошибку в мониторинг.",
        ],
    },
    {
        "title": "Сценарий подключения по QR",
        "numbered": [
            "Player запускается на экране в полноэкранном режиме.",
            "Если устройство не привязано, Player запрашивает у backend временную pairing-сессию.",
            "Backend возвращает QR-ссылку и короткий код. Срок действия кода - 10 минут.",
            "Пользователь в редакторе открывает действие Подключить экран, выбирает Panel ID и сканирует QR или вводит код.",
            "Backend проверяет код, права пользователя и связывает устройство с аккаунтом, Panel ID и опубликованной темой.",
            "Player получает назначение, скачивает пакет темы, сохраняет его локально и сразу запускает показ.",
            "После запуска Player отправляет статус и скриншот в мониторинг.",
        ],
    },
    {
        "title": "Логика в редакторе",
        "bullets": [
            "После публикации темы доступны действия: Подключить экран, Тест экрана, Отвязать экран, Открыть мониторинг.",
            "Окно подключения показывает список доступных Panel ID, статус привязки и поле ввода pairing code.",
            "При успешной привязке редактор показывает factory number, Panel ID, название объекта, текущую тему и last seen.",
            "Если экран уже привязан, повторная привязка требует подтверждения пользователя.",
            "Отвязка экрана должна сбрасывать связь device -> Panel ID -> theme и переводить Player в unpaired при следующем запросе.",
        ],
    },
    {
        "title": "Минимальный backend API",
        "bullets": [
            "POST /api/pairing/start - создать временный код и QR для устройства.",
            "POST /api/pairing/confirm - подтвердить код и связать устройство с Panel ID и темой.",
            "GET /api/pairing/status - проверить состояние pairing-сессии со стороны Player.",
            "POST /api/pairing/unlink - отвязать устройство от панели.",
            "GET /api/player/config - получить назначение темы, версию пакета и настройки Player.",
            "GET /api/player/package - скачать опубликованный пакет темы.",
            "POST /api/player/status - отправить online/error/current theme/last seen.",
            "POST /api/player/test-result - отправить результат теста экрана и скриншот.",
        ],
    },
    {
        "title": "Хранимые данные",
        "bullets": [
            "device_id, device_fingerprint, device_token, player_version.",
            "pairing_code, pairing_token, expires_at, used_at, status.",
            "account_id, object_id, address, location, panel_id, factory_number.",
            "theme_id, package_version, assigned_at, assigned_by.",
            "last_seen, online, last_error, last_screenshot_id, last_test_status.",
            "Журнал действий: создание кода, подтверждение, отвязка, тест, ошибки применения темы.",
        ],
    },
    {
        "title": "Тест экрана",
        "numbered": [
            "Пользователь нажимает Тест экрана в редакторе для выбранной панели.",
            "Backend создает тестовую команду и передает ее Player при ближайшем запросе конфигурации.",
            "Player показывает тестовый экран или тестовый пакет не менее 10 секунд.",
            "Player делает скриншот, отправляет telemetry/test-result и возвращается к основной теме.",
            "Редактор показывает результат: успешно, нет связи, скриншот не получен, размеры не совпали, тема не применилась.",
        ],
    },
    {
        "title": "Проверки теста",
        "bullets": [
            "Player online и обновил last seen после команды.",
            "Скриншот получен не позднее контрольного интервала.",
            "Разрешение и ориентация скриншота соответствуют настройкам панели.",
            "На экране нет рабочего стола, системных окон, черного экрана и окна подключения.",
            "Текущий theme_id/package_version соответствует опубликованной теме.",
            "При наличии видео/аудио в теме Player не показывает экран загрузки между медиа.",
        ],
    },
    {
        "title": "Мониторинг после привязки",
        "bullets": [
            "Панель появляется в мониторинге как paired и online после первого успешного статуса.",
            "После публикации новой темы Player должен получить обновление, отрисовать тему и отправить свежий скриншот.",
            "В карточке панели отображаются factory number, название объекта, last seen, CPU, диск, температура, ошибка и последний скриншот.",
            "История скриншотов и метрик используется для проверки, что тема обновилась и экран не завис.",
        ],
    },
    {
        "title": "Безопасность",
        "bullets": [
            "Pairing code одноразовый и действует не более 10 минут.",
            "Подключить экран может только авторизованный пользователь с правом на выбранный Panel ID.",
            "QR содержит подписанный токен pairing-сессии и не содержит пароль пользователя.",
            "После успешной привязки Player получает device_token; логин пользователя на устройстве не хранится.",
            "Все операции привязки, отвязки и теста логируются.",
        ],
    },
    {
        "title": "Критерии приемки",
        "bullets": [
            "Непривязанный Player показывает QR и короткий код подключения.",
            "Редактор привязывает экран к выбранному Panel ID и опубликованной теме.",
            "После привязки Player без ручного ввода открывает тему на весь экран.",
            "После перезагрузки устройства Player автоматически запускается и показывает последнюю назначенную тему.",
            "При потере сети Player продолжает показывать кэшированную тему.",
            "Тест экрана запускается из редактора, возвращает результат и свежий скриншот в мониторинг.",
            "Экран можно отвязать и повторно привязать к другой панели или теме.",
        ],
    },
]


def main():
    if not FONT_PATH.exists():
        raise SystemExit(f"Font not found: {FONT_PATH}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    register_fonts()
    build_pdf(
        OUT_DIR / "TZ_bot_monitoringa_I-PANEL.pdf",
        "Техническое задание",
        "Telegram-бот мониторинга I-PANEL",
        BOT_SECTIONS,
    )
    build_pdf(
        OUT_DIR / "TZ_QR_podklyuchenie_ekranov_I-PANEL.pdf",
        "Техническое задание",
        "Подключение экранов по QR и тест I-PANEL",
        PAIRING_SECTIONS,
    )


if __name__ == "__main__":
    main()
