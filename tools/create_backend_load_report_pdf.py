from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "IPANEL_backend_load_monitoring_200_panels_report.pdf"
FONT_DIR = ROOT / "tmp" / "fonts"


def register_fonts():
    candidates = [
        FONT_DIR / "Montserrat-Regular.ttf",
        FONT_DIR / "Montserrat.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    regular = next((Path(p) for p in candidates if Path(p).exists()), None)
    if regular:
        pdfmetrics.registerFont(TTFont("DocFont", str(regular)))
        return "DocFont"
    return "Helvetica"


FONT = register_fonts()
LIME = colors.HexColor("#99ff00")
LIME_LIGHT = colors.HexColor("#e8ffb8")
TEXT = colors.HexColor("#1f1f1f")
MUTED = colors.HexColor("#5a5a5a")
GRID = colors.HexColor("#111111")


styles = getSampleStyleSheet()
styles.add(ParagraphStyle("CoverTop", fontName=FONT, fontSize=13, leading=17, textColor=TEXT, spaceAfter=24))
styles.add(ParagraphStyle("Accent", fontName=FONT, fontSize=20, leading=26, textColor=LIME, spaceAfter=20))
styles.add(ParagraphStyle("TitleBig", fontName=FONT, fontSize=31, leading=38, textColor=TEXT, spaceAfter=18))
styles.add(ParagraphStyle("Subtitle", fontName=FONT, fontSize=13, leading=18, textColor=MUTED, spaceAfter=18))
styles.add(ParagraphStyle("BodyRu", fontName=FONT, fontSize=10.8, leading=16, textColor=TEXT, spaceAfter=7))
styles.add(ParagraphStyle("BodySmall", fontName=FONT, fontSize=9.2, leading=13, textColor=TEXT, spaceAfter=5))
styles.add(ParagraphStyle("Section", fontName=FONT, fontSize=21, leading=28, textColor=TEXT, spaceBefore=15, spaceAfter=12))
styles.add(ParagraphStyle("H3", fontName=FONT, fontSize=13, leading=17, textColor=TEXT, spaceBefore=8, spaceAfter=6))
styles.add(ParagraphStyle("Footer", fontName=FONT, fontSize=8.5, leading=10, textColor=MUTED, alignment=TA_CENTER))
styles.add(ParagraphStyle("CodeRu", fontName=FONT, fontSize=8.5, leading=12, textColor=TEXT, leftIndent=6))
styles.add(ParagraphStyle("Callout", fontName=FONT, fontSize=10.5, leading=15, textColor=TEXT, leftIndent=8, rightIndent=8))


def p(text, style="BodyRu"):
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    return Paragraph(text, styles[style])


def raw_p(text, style="BodyRu"):
    return Paragraph(text, styles[style])


def table(rows, widths=None, header=True, font_size=8.8):
    if widths is None:
        widths = [85 * mm, 85 * mm]
    data = []
    for row in rows:
        data.append([raw_p(str(cell), "BodySmall") for cell in row])
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1 if header else 0)
    style = [
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), font_size + 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]
    if header:
        style += [
            ("BACKGROUND", (0, 0), (-1, 0), LIME),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.black),
        ]
    t.setStyle(TableStyle(style))
    return t


def callout(label, text):
    data = [[raw_p(f"<b>{label}</b> {text}", "Callout")]]
    t = Table(data, colWidths=[170 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIME_LIGHT),
        ("LINEBEFORE", (0, 0), (0, -1), 3, LIME),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(A4[0] / 2, 12 * mm, "I-PANEL • backend monitoring and load testing • admin.i-panel.pro")
    canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, str(canvas.getPageNumber()))
    canvas.restoreState()


def cover_bar():
    return Table([["", ""]], colWidths=[95 * mm, 75 * mm], rowHeights=[10 * mm], hAlign="LEFT",
                 style=TableStyle([("BACKGROUND", (0, 0), (0, 0), LIME), ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#e8e8e8"))]))


def bullets(items):
    out = []
    for item in items:
        out.append(raw_p(f"• {item}", "BodyRu"))
    return out


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="I-PANEL backend load monitoring report",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin + 8 * mm, doc.width, doc.height - 8 * mm, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    story = [
        p("I-PANEL / ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ", "CoverTop"),
        p("актуальная редакция по результатам проверки", "Accent"),
        p("Отчет по нагрузочному тестированию backend и настройке мониторинга", "TitleBig"),
        p("I-PANEL • admin.i-panel.pro • 27 августа 2026", "Subtitle"),
        cover_bar(),
        Spacer(1, 18),
        p("Документ фиксирует выполненную настройку мониторинга backend-сервиса, состав нагрузочных проверок, фактические результаты smoke, baseline и симуляции 200 виртуальных панелей, а также адреса доступа к Grafana, Prometheus и служебным артефактам.", "BodyRu"),
        callout("ИТОГ:", "backend выдержал проверку 200 виртуальных панелей без ошибок: 0.00% failed requests, 1200 циклов опроса, p95 HTTP latency 1.36 s."),
        Spacer(1, 10),
        p("Материалы, учтенные в редакции", "H3"),
        table([
            ["Источник", "Что из него используется"],
            ["Действующий backend на сервере 212.41.9.251", "Фактический стек, запущенный процесс backend_main, маршруты API и состояние сервиса."],
            ["k6 smoke/baseline/200 panels прогоны", "Количество запросов, ошибки, p95, среднее и максимальное время ответа."],
            ["Prometheus/Grafana setup", "Адреса доступа, назначение компонентов, перечень собираемых метрик."],
            ["PM2 и Docker состояние", "Проверка, что backend и observability-контейнеры остались online после тестов."],
        ], widths=[77 * mm, 93 * mm]),
        Spacer(1, 18),
        p("01. Краткое резюме", "Section"),
        p("Зачем проводилась проверка", "H3"),
        *bullets([
            "Оценить базовую устойчивость backend API под потоком типовых запросов редактора, панели и мониторинга.",
            "Добавить постоянный технический мониторинг backend и сервера без изменения бизнес-логики приложения.",
            "Подготовить воспроизводимые сценарии для повторных smoke, baseline и stress проверок.",
        ]),
        p("Фактический результат", "H3"),
        table([
            ["Показатель", "Значение"],
            ["Статус backend после работ", "online, процесс pm2: backend_main"],
            ["Prometheus targets", "UP"],
            ["Smoke", "225 HTTP-запросов, 0.00% ошибок, p95 49.98 ms"],
            ["Baseline", "6341 HTTP-запрос, 0.00% ошибок, p95 78.32 ms, max 136.4 ms"],
            ["200 виртуальных панелей", "2402 HTTP-запроса, 1200 циклов опроса, 0.00% ошибок, p95 HTTP 1.36 s"],
            ["CPU сервера после теста", "около 15%"],
            ["RAM сервера после теста", "около 15.5%"],
        ], widths=[62 * mm, 108 * mm]),
        PageBreak(),
        p("02. Контур мониторинга", "Section"),
        p("Что развернуто", "H3"),
        table([
            ["Компонент", "Назначение"],
            ["FastAPI /metrics", "Экспорт технических метрик backend: количество запросов, статусы, длительность ответов, состояние процесса Python."],
            ["Prometheus", "Сбор и хранение метрик backend, сервера, Docker-контейнеров и HTTP-probe проверок."],
            ["Grafana", "Визуальная панель для просмотра графиков, доступности API, задержек, CPU/RAM/диска и контейнеров."],
            ["node-exporter", "CPU, RAM, диск, файловые системы и другие системные метрики сервера."],
            ["cAdvisor", "Метрики Docker-контейнеров: CPU, память, состояние контейнеров."],
            ["blackbox-exporter", "Периодическая HTTP-проверка ключевых URL backend и API."],
            ["k6", "Автоматизированные нагрузочные сценарии smoke, baseline и stress."],
            ["Postman collection", "Ручная проверка тех же API в понятном интерфейсе Postman."],
        ], widths=[55 * mm, 115 * mm]),
        Spacer(1, 10),
        p("Доступы и расположение", "H3"),
        table([
            ["Сервис", "Данные доступа / путь"],
            ["Grafana", "http://212.41.9.251:3001, логин admin, пароль admin123"],
            ["Prometheus", "http://212.41.9.251:9091"],
            ["Backend metrics", "https://admin.i-panel.pro:8787/metrics"],
            ["Observability directory", "/root/ipanel_observability"],
            ["k6 script", "/root/ipanel_observability/k6/ipanel-backend-load.js"],
            ["Postman collection", "/root/ipanel_observability/postman/ipanel_backend_collection.json"],
            ["Baseline result JSON", "/root/ipanel_observability/results/baseline-summary.json"],
            ["200 panels result JSON", "/root/ipanel_observability/results/panel200-summary.json"],
            ["Server report", "/root/ipanel_observability/REPORT.md"],
        ], widths=[55 * mm, 115 * mm]),
        Spacer(1, 10),
        callout("ВАЖНО:", "Grafana предназначена для визуального контроля, Prometheus - для сбора и хранения метрик. k6 и Postman используются для воспроизводимых проверок API."),
        PageBreak(),
        p("03. Проверенные API", "Section"),
        p("Набор endpoint выбран по реальному пользовательскому сценарию: авторизация, получение темы панелью, пакетная загрузка данных виджетов, данные мониторинга и список панелей.", "BodyRu"),
        table([
            ["Endpoint", "Что проверяет"],
            ["POST /api/users/login", "Авторизация пользователя и выдача access_token."],
            ["GET /api/panels/theme_id/11110007", "Получение актуальной темы панелью по фабричному номеру."],
            ["POST /api/parse/batch", "Пакетная выдача данных для виджетов и медиа по панели."],
            ["GET /api/monitoring/devices", "Получение списка устройств и статусов мониторинга."],
            ["GET /api/panels/get_all_panels", "Получение списка панелей для административного интерфейса."],
        ], widths=[72 * mm, 98 * mm]),
        Spacer(1, 12),
        p("HTTP-probe цели Prometheus", "H3"),
        table([
            ["URL", "Назначение"],
            ["https://admin.i-panel.pro:8787/", "Базовая доступность backend."],
            ["https://admin.i-panel.pro:8787/docs", "Доступность Swagger-документации."],
            ["https://admin.i-panel.pro:8787/api/parse/rates", "Проверка данных курсов."],
            ["https://admin.i-panel.pro:8787/api/parse/traffic", "Проверка данных пробок."],
            ["https://admin.i-panel.pro:8787/api/panels/theme_id/11110007", "Проверка выдачи темы для панели 11110007."],
            ["https://admin.i-panel.pro:8787/api/panels/theme_id/11110011", "Проверка выдачи темы для панели 11110011."],
            ["https://admin.i-panel.pro:8787/api/monitoring/devices", "Проверка API мониторинга."],
        ], widths=[100 * mm, 70 * mm]),
        PageBreak(),
        p("04. Результаты нагрузочного тестирования", "Section"),
        p("Smoke test", "H3"),
        table([
            ["Параметр", "Значение"],
            ["Профиль", "2 virtual users, 30 секунд"],
            ["HTTP-запросов", "225"],
            ["Checks", "226 из 226 успешно"],
            ["Ошибки HTTP", "0.00%"],
            ["Среднее время ответа", "18.55 ms"],
            ["p90 latency", "47.86 ms"],
            ["p95 latency", "49.98 ms"],
            ["Максимальное время ответа", "54.71 ms"],
        ], widths=[66 * mm, 104 * mm]),
        Spacer(1, 12),
        p("Baseline test", "H3"),
        table([
            ["Параметр", "Значение"],
            ["Профиль", "плавный разгон 5 -> 10 virtual users, 5 минут"],
            ["HTTP-запросов", "6341"],
            ["Итераций сценария", "1585"],
            ["Checks", "6342 из 6342 успешно"],
            ["Ошибки HTTP", "0.00%"],
            ["Среднее время ответа", "24.89 ms"],
            ["p90 latency", "61.10 ms"],
            ["p95 latency", "78.32 ms"],
            ["Максимальное время ответа", "136.40 ms"],
            ["Получено данных", "114 MB"],
            ["Отправлено данных", "10 MB"],
        ], widths=[66 * mm, 104 * mm]),
        Spacer(1, 10),
        callout("ВЫВОД:", "на baseline-нагрузке backend отвечает стабильно, пороги k6 пройдены, ошибок API не зафиксировано."),
        PageBreak(),
        p("05. Симуляция 200 панелей", "Section"),
        p("Сценарий проверки", "H3"),
        p("Тест моделирует 200 виртуальных панелей, которые одновременно работают по логике реального плеера: получают тему по фабричному номеру, затем делают единый пакетный запрос данных виджетов. Между циклами выдерживается интервал около 30 секунд.", "BodyRu"),
        table([
            ["Параметр", "Значение"],
            ["Количество виртуальных панелей", "200 VU"],
            ["Длительность активной фазы", "3 минуты"],
            ["Интервал опроса панели", "30 секунд + небольшой разброс"],
            ["Полных циклов панели", "1200"],
            ["HTTP-запросов", "2402"],
            ["Checks", "2403 из 2403 успешно"],
            ["Ошибки HTTP", "0.00%"],
            ["Общая p95 latency HTTP", "1.36 s"],
            ["p95 получения темы", "794 ms"],
            ["p95 пакетных данных виджетов", "1363 ms"],
            ["Среднее время получения темы", "147.12 ms"],
            ["Среднее время пакетных данных", "245.68 ms"],
            ["Максимальное время ответа", "1.435 s"],
            ["Получено данных", "37 MB"],
            ["Отправлено данных", "6.0 MB"],
        ], widths=[66 * mm, 104 * mm]),
        Spacer(1, 10),
        p("Состояние после теста", "H3"),
        table([
            ["Проверка", "Результат"],
            ["pm2 backend_main", "online"],
            ["Prometheus targets", "UP по всем ключевым целям"],
            ["FastAPI metrics availability", "up = 1"],
            ["Максимальная RSS память backend по Prometheus", "около 169 MB"],
            ["Максимальный CPU backend по Prometheus", "около 2.3%"],
            ["Серверный load average после теста", "1.48 / 1.69 / 1.48"],
            ["RAM сервера после теста", "29 GiB всего, около 24 GiB available"],
            ["Диск / после теста", "433 GB всего, 154 GB занято, 38%"],
        ], widths=[66 * mm, 104 * mm]),
        Spacer(1, 10),
        callout("ВЫВОД:", "профиль 200 панелей пройден без ошибок. Самая тяжелая точка - пакетный запрос данных виджетов: p95 1363 ms, поэтому именно его стоит держать под наблюдением и дальше оптимизировать через кэширование."),
        PageBreak(),
        p("06. Эксплуатация Grafana и Prometheus", "Section"),
        p("Как читать Grafana", "H3"),
        *bullets([
            "Панель API доступен показывает состояние ключевых URL: UP означает успешную проверку.",
            "HTTP latency probes показывает задержку внешних проверок URL в секундах.",
            "FastAPI RPS показывает интенсивность запросов по маршрутам, методам и статусам.",
            "FastAPI request duration p95 показывает 95-й перцентиль задержки API: чем ниже, тем лучше.",
            "Server CPU, Server RAM и Root disk показывают загрузку серверной машины.",
            "Docker CPU by container позволяет увидеть контейнеры, которые потребляют ресурсы.",
        ]),
        p("Зачем нужен Prometheus", "H3"),
        p("Prometheus хранит временные ряды метрик и регулярно опрашивает backend, server exporters и HTTP-probes. Он нужен не для ручного просмотра каждый день, а как база метрик для Grafana и технических расследований.", "BodyRu"),
        p("Зачем нужна Grafana", "H3"),
        p("Grafana показывает метрики в удобном виде: графики, статусы, динамику задержек и нагрузки. Это основной интерфейс для быстрого ответа на вопрос: backend работает нормально или есть деградация.", "BodyRu"),
        p("Команды запуска", "H3"),
        table([
            ["Действие", "Команда"],
            ["Запустить мониторинг", "cd /root/ipanel_observability && docker compose up -d"],
            ["Посмотреть контейнеры", "cd /root/ipanel_observability && docker compose ps"],
            ["Остановить мониторинг", "cd /root/ipanel_observability && docker compose down"],
            ["Проверить backend", "pm2 ls && curl -sk https://admin.i-panel.pro:8787/metrics | head"],
        ], widths=[55 * mm, 115 * mm]),
        PageBreak(),
        p("07. Повтор тестов", "Section"),
        p("Команды k6", "H3"),
        table([
            ["Профиль", "Команда"],
            ["Smoke", "cd /root/ipanel_observability && docker run --rm -i --network host -v \"$PWD/k6:/scripts\" -v \"$PWD/results:/results\" grafana/k6 run -e PROFILE=smoke /scripts/ipanel-backend-load.js"],
            ["Baseline", "cd /root/ipanel_observability && docker run --rm -i --network host -v \"$PWD/k6:/scripts\" -v \"$PWD/results:/results\" grafana/k6 run -e PROFILE=baseline --summary-export /results/baseline-summary.json /scripts/ipanel-backend-load.js"],
            ["Stress", "cd /root/ipanel_observability && docker run --rm -i --network host -v \"$PWD/k6:/scripts\" -v \"$PWD/results:/results\" grafana/k6 run -e PROFILE=stress --summary-export /results/stress-summary.json /scripts/ipanel-backend-load.js"],
            ["200 panels", "cd /root/ipanel_observability && docker run --rm -i --network host -v /root/ipanel_observability/k6:/scripts -v /root/ipanel_observability/results:/results grafana/k6 run -e VUS=200 -e DURATION=3m -e POLL_SECONDS=30 --summary-export /results/panel200-summary.json /scripts/ipanel-200-panels.js"],
        ], widths=[35 * mm, 135 * mm], font_size=7.7),
        Spacer(1, 10),
        callout("ОГРАНИЧЕНИЕ:", "stress-профиль подготовлен, но его следует запускать только в согласованное окно, так как это продуктивный backend."),
        p("Рекомендуемый порядок дальнейших проверок", "H3"),
        *bullets([
            "Перед релизом запускать smoke test.",
            "После крупных изменений backend или схемы API запускать baseline test.",
            "Stress/soak тесты выполнять отдельно, с наблюдением Grafana и готовностью остановить прогон.",
            "После каждого теста проверять pm2 status, Prometheus targets и график ошибок HTTP.",
        ]),
        p("08. Итоговое заключение", "Section"),
        p("По результатам первичной настройки и тестирования backend I-PANEL находится в рабочем состоянии. Нагрузочные сценарии smoke, baseline и симуляция 200 виртуальных панелей завершились без ошибок. Система мониторинга развернута отдельно от основного приложения и не заменяет действующий мониторинг панелей, а дополняет его техническими метриками backend, сервера и контейнеров.", "BodyRu"),
        p("Следующий практический шаг - согласовать отдельное окно для stress/soak проверки.", "BodyRu"),
    ]

    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUT)
