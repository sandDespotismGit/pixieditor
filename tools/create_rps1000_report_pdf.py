from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "IPANEL_backend_1000_rps_report.pdf"
FONT_DIR = ROOT / "tmp" / "fonts"


def register_font():
    candidates = [
        FONT_DIR / "Montserrat-Regular.ttf",
        FONT_DIR / "Montserrat.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for path in candidates:
        p = Path(path)
        if p.exists():
            pdfmetrics.registerFont(TTFont("DocFont", str(p)))
            return "DocFont"
    return "Helvetica"


FONT = register_font()
LIME = colors.HexColor("#99ff00")
LIME_LIGHT = colors.HexColor("#e8ffb8")
TEXT = colors.HexColor("#1f1f1f")
MUTED = colors.HexColor("#5a5a5a")
GRID = colors.HexColor("#111111")
WARN = colors.HexColor("#fff1cc")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle("CoverTop", fontName=FONT, fontSize=13, leading=17, textColor=TEXT, spaceAfter=24))
styles.add(ParagraphStyle("Accent", fontName=FONT, fontSize=20, leading=26, textColor=LIME, spaceAfter=20))
styles.add(ParagraphStyle("TitleBig", fontName=FONT, fontSize=31, leading=38, textColor=TEXT, spaceAfter=18))
styles.add(ParagraphStyle("Subtitle", fontName=FONT, fontSize=13, leading=18, textColor=MUTED, spaceAfter=18))
styles.add(ParagraphStyle("BodyRu", fontName=FONT, fontSize=10.8, leading=16, textColor=TEXT, spaceAfter=7))
styles.add(ParagraphStyle("BodySmall", fontName=FONT, fontSize=9.2, leading=13, textColor=TEXT, spaceAfter=5))
styles.add(ParagraphStyle("Section", fontName=FONT, fontSize=21, leading=28, textColor=TEXT, spaceBefore=15, spaceAfter=12))
styles.add(ParagraphStyle("H3", fontName=FONT, fontSize=13, leading=17, textColor=TEXT, spaceBefore=8, spaceAfter=6))
styles.add(ParagraphStyle("Callout", fontName=FONT, fontSize=10.5, leading=15, textColor=TEXT, leftIndent=8, rightIndent=8))


def clean(text):
    return str(text).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def p(text, style="BodyRu"):
    return Paragraph(clean(text), styles[style])


def raw(text, style="BodySmall"):
    return Paragraph(str(text), styles[style])


def table(rows, widths=None, font_size=8.8, header=True):
    if widths is None:
        widths = [66 * mm, 104 * mm]
    data = [[raw(clean(cell)) for cell in row] for row in rows]
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
        style += [("BACKGROUND", (0, 0), (-1, 0), LIME)]
    t.setStyle(TableStyle(style))
    return t


def callout(label, text, color=LIME_LIGHT):
    t = Table([[raw(f"<b>{clean(label)}</b> {clean(text)}", "Callout")]], colWidths=[170 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), color),
        ("LINEBEFORE", (0, 0), (0, -1), 3, LIME),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def bar():
    t = Table([["", ""]], colWidths=[95 * mm, 75 * mm], rowHeights=[10 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), LIME),
        ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#e8e8e8")),
    ]))
    return t


def footer(canvas, _doc):
    canvas.saveState()
    canvas.setFont(FONT, 8)
    canvas.setFillColor(MUTED)
    canvas.drawCentredString(A4[0] / 2, 12 * mm, "I-PANEL • backend 1000 RPS load test • admin.i-panel.pro")
    canvas.drawRightString(A4[0] - 18 * mm, 12 * mm, str(canvas.getPageNumber()))
    canvas.restoreState()


def build():
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=18 * mm,
        bottomMargin=18 * mm,
        title="I-PANEL backend 1000 RPS report",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin + 8 * mm, doc.width, doc.height - 8 * mm, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    story = [
        p("I-PANEL / ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ", "CoverTop"),
        p("актуальная редакция по результатам проверки", "Accent"),
        p("Отчет по нагрузочному тесту backend на 1000 RPS", "TitleBig"),
        p("I-PANEL • admin.i-panel.pro • 28 августа 2026", "Subtitle"),
        bar(),
        Spacer(1, 18),
        p("Документ фиксирует отдельный предельный нагрузочный прогон backend I-PANEL с целевой интенсивностью 1000 HTTP-запросов в секунду. Проверка выполнялась k6 по продуктивному API с автоматической остановкой при превышении порога задержек.", "BodyRu"),
        callout("ИТОГ:", "целевые 1000 RPS backend не выдержал по задержкам. Тест был автоматически остановлен на 22-й секунде: ошибок HTTP 0.00%, но p95 latency вырос до 11.37 s.", WARN),
        Spacer(1, 10),
        p("01. Краткое резюме", "Section"),
        table([
            ["Показатель", "Значение"],
            ["Целевая интенсивность", "1000 RPS"],
            ["Фактически достигнутая средняя интенсивность", "147.05 RPS"],
            ["Длительность до автоостановки", "около 22 секунд"],
            ["Причина остановки", "превышен порог p95 latency < 3000 ms"],
            ["HTTP-запросов выполнено", "3234"],
            ["Успешные проверки", "3235 из 3235"],
            ["Ошибки HTTP", "0.00%"],
            ["Сброшенные итерации k6", "17213"],
            ["Максимум активных VU", "1500"],
        ]),
        Spacer(1, 10),
        p("Ключевой вывод", "H3"),
        p("Backend не падал и не начал массово отдавать ошибки, но очередь запросов быстро накопилась. Это означает, что текущая конфигурация не рассчитана на 1000 RPS: ограничение проявилось не в корректности ответов, а в пропускной способности и времени ответа.", "BodyRu"),
        PageBreak(),
        p("02. Методика теста", "Section"),
        p("Сценарий k6", "H3"),
        table([
            ["Параметр", "Значение"],
            ["Инструмент", "Grafana k6"],
            ["Executor", "constant-arrival-rate"],
            ["Rate", "1000 iterations/s"],
            ["Плановая длительность", "60 секунд"],
            ["preAllocatedVUs", "400"],
            ["maxVUs", "1500"],
            ["Автостоп по ошибкам", "http_req_failed rate < 5%"],
            ["Автостоп по задержкам", "http_req_duration p95 < 3000 ms"],
            ["Файл сценария", "/root/ipanel_observability/k6/ipanel-1000-rps.js"],
            ["Файл результата", "/root/ipanel_observability/results/rps1000-summary.json"],
        ]),
        Spacer(1, 10),
        p("Проверяемые запросы", "H3"),
        table([
            ["Endpoint", "Назначение"],
            ["GET /api/panels/theme_id/{fabric}", "Получение темы панелью по фабричному номеру."],
            ["POST /api/parse/batch", "Пакетная выдача данных виджетов."],
            ["GET /api/parse/rates", "Курсы валют."],
            ["GET /api/parse/traffic", "Пробки."],
            ["GET /api/panels/get_all_panels", "Список панелей для админки."],
        ], widths=[72 * mm, 98 * mm]),
        PageBreak(),
        p("03. Фактические результаты", "Section"),
        table([
            ["Метрика", "Значение"],
            ["http_reqs", "3234"],
            ["http_req_failed", "0.00%"],
            ["checks", "3235 / 3235 успешно"],
            ["iterations", "3233"],
            ["dropped_iterations", "17213"],
            ["RPS фактический", "147.05 req/s"],
            ["avg latency", "6.75 s"],
            ["median latency", "5.91 s"],
            ["p90 latency", "11.22 s"],
            ["p95 latency", "11.37 s"],
            ["max latency", "11.48 s"],
            ["avg iteration duration", "7.37 s"],
            ["Получено данных", "46 MB"],
            ["Отправлено данных", "10 MB"],
        ]),
        Spacer(1, 10),
        callout("ИНТЕРПРЕТАЦИЯ:", "нулевой процент HTTP-ошибок не означает, что нагрузка выдержана. Для пользовательского сценария критична задержка: при p95 11.37 s интерфейсы и панели будут ощущаться как зависшие.", WARN),
        PageBreak(),
        p("04. Состояние после теста", "Section"),
        table([
            ["Проверка", "Результат"],
            ["pm2 backend_main", "online"],
            ["Память backend_main по pm2", "321.2 MB"],
            ["pixi-editor", "online"],
            ["Docker observability", "Prometheus, Grafana, blackbox, node-exporter, cAdvisor работают"],
            ["Load average сервера после теста", "1.36 / 1.49 / 1.31"],
            ["RAM сервера", "29 GiB всего, 24 GiB available"],
            ["Диск /", "433 GB всего, 154 GB занято, 38%"],
        ]),
        Spacer(1, 12),
        p("Где смотреть мониторинг", "H3"),
        table([
            ["Сервис", "Доступ"],
            ["Grafana", "http://212.41.9.251:3001, логин admin, пароль admin123"],
            ["Prometheus", "http://212.41.9.251:9091"],
            ["Backend metrics", "https://admin.i-panel.pro:8787/metrics"],
            ["Observability directory", "/root/ipanel_observability"],
        ]),
        PageBreak(),
        p("05. Заключение", "Section"),
        p("Текущий backend стабильно выдерживает сценарии smoke, baseline и симуляцию 200 панелей с реальным 30-секундным циклом опроса. Однако экстремальная цель 1000 RPS не достигнута: k6 смог выполнить примерно 147 RPS, после чего проверка была остановлена по задержкам.", "BodyRu"),
        p("Для выхода к 1000 RPS требуется отдельная оптимизация: кэширование тяжелых endpoint, разгрузка /api/parse/batch, ограничение тяжелых запросов к внешним источникам, профилирование базы данных и, вероятно, масштабирование backend по нескольким worker/process/instance.", "BodyRu"),
        callout("РЕШЕНИЕ:", "использовать 1000 RPS как целевой stress-профиль после оптимизации, а не как подтвержденную текущую емкость системы.", WARN),
    ]
    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUT)
