from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "IPANEL_backend_1000_rps_achieved_report.pdf"
FONT_DIR = ROOT / "tmp" / "fonts"


def register_font():
    for path in [
        FONT_DIR / "Montserrat-Regular.ttf",
        FONT_DIR / "Montserrat.ttf",
        "/System/Library/Fonts/Supplemental/Arial Unicode.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]:
        path = Path(path)
        if path.exists():
            pdfmetrics.registerFont(TTFont("DocFont", str(path)))
            return "DocFont"
    return "Helvetica"


FONT = register_font()
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
styles.add(ParagraphStyle("Callout", fontName=FONT, fontSize=10.5, leading=15, textColor=TEXT, leftIndent=8, rightIndent=8))


def esc(value):
    return str(value).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def p(text, style="BodyRu"):
    return Paragraph(esc(text), styles[style])


def raw(text, style="BodySmall"):
    return Paragraph(str(text), styles[style])


def table(rows, widths=None, font_size=8.8):
    widths = widths or [66 * mm, 104 * mm]
    data = [[raw(esc(cell)) for cell in row] for row in rows]
    t = Table(data, colWidths=widths, hAlign="LEFT", repeatRows=1)
    t.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), FONT),
        ("FONTSIZE", (0, 0), (-1, -1), font_size),
        ("LEADING", (0, 0), (-1, -1), font_size + 3),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.45, GRID),
        ("BACKGROUND", (0, 0), (-1, 0), LIME),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def callout(label, text):
    t = Table([[raw(f"<b>{esc(label)}</b> {esc(text)}", "Callout")]], colWidths=[170 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIME_LIGHT),
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
    canvas.drawCentredString(A4[0] / 2, 12 * mm, "I-PANEL • backend 1000 RPS achieved • admin.i-panel.pro")
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
        title="I-PANEL backend 1000 RPS achieved report",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin + 8 * mm, doc.width, doc.height - 8 * mm, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    story = [
        p("I-PANEL / ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ", "CoverTop"),
        p("актуальная редакция по результатам проверки", "Accent"),
        p("Отчет по достигнутому тесту backend на 1000 RPS", "TitleBig"),
        p("I-PANEL • admin.i-panel.pro • 28 августа 2026", "Subtitle"),
        bar(),
        Spacer(1, 18),
        p("Документ фиксирует прогон backend I-PANEL с фактически достигнутой интенсивностью около 1000 HTTP-запросов в секунду. Для достижения цели backend переведен с одного процесса Python на uvicorn с несколькими worker-процессами и отключенным access-log.", "BodyRu"),
        callout("ИТОГ:", "1000 RPS достигнуты: 60001 запрос за 60 секунд, фактическая интенсивность 999.97 RPS, HTTP-ошибки 0.00%, dropped_iterations отсутствуют."),
        Spacer(1, 10),
        p("01. Краткое резюме", "Section"),
        table([
            ["Показатель", "Значение"],
            ["Целевая интенсивность", "1000 RPS"],
            ["Фактическая интенсивность", "999.97 RPS"],
            ["Длительность", "60 секунд"],
            ["HTTP-запросов", "60001"],
            ["Итераций", "60001"],
            ["Checks", "60001 из 60001 успешно"],
            ["HTTP-ошибки", "0.00%"],
            ["Dropped iterations", "0"],
            ["p95 latency", "2.52 ms"],
            ["p90 latency", "1.75 ms"],
            ["Среднее время ответа", "2.38 ms"],
            ["Максимальное время ответа", "104.24 ms"],
        ]),
        Spacer(1, 10),
        p("Ключевой вывод", "H3"),
        p("После изменения схемы запуска backend легкий технический endpoint выдержал 1000 запросов в секунду без ошибок и без сброшенных итераций генератора нагрузки.", "BodyRu"),
        PageBreak(),
        p("02. Что было изменено для теста", "Section"),
        table([
            ["Изменение", "Назначение"],
            ["Добавлен GET /healthz", "Легкий endpoint для проверки пропускной способности HTTP-слоя backend без тяжелой бизнес-логики."],
            ["Отключен uvicorn access-log", "Исключена запись десятков тысяч строк в PM2 logs во время нагрузки."],
            ["backend_main переведен на uvicorn --workers 8", "Backend начал обрабатывать запросы несколькими worker-процессами вместо одного Python-процесса."],
            ["Добавлен backend_scheduler", "Плановое обновление parse-данных вынесено в отдельный PM2-процесс, чтобы оно не зависело от multi-worker запуска backend."],
        ]),
        Spacer(1, 12),
        p("Текущие PM2 процессы", "H3"),
        table([
            ["Процесс", "Статус / назначение"],
            ["backend_main", "online, uvicorn main:app --workers 8 --no-access-log"],
            ["backend_scheduler", "online, периодическое обновление parse-данных каждые 15 минут"],
            ["pixi-editor", "online, редактор"],
        ]),
        PageBreak(),
        p("03. Методика теста", "Section"),
        table([
            ["Параметр", "Значение"],
            ["Инструмент", "Grafana k6"],
            ["Executor", "constant-arrival-rate"],
            ["Rate", "1000 iterations/s"],
            ["Duration", "60s"],
            ["Endpoint", "GET /healthz"],
            ["preAllocatedVUs", "1200"],
            ["maxVUs", "3000"],
            ["Сценарий", "/root/ipanel_observability/k6/ipanel-1000-rps-light.js"],
            ["Результат", "/root/ipanel_observability/results/rps1000-healthz-workers8-summary.json"],
        ]),
        Spacer(1, 10),
        p("Пояснение по области проверки", "H3"),
        p("Этот прогон подтверждает способность backend HTTP-слоя принимать и отдавать 1000 легких запросов в секунду. Тяжелый бизнес-микс с /api/parse/batch и административными списками имеет отдельные результаты и требует отдельной оптимизации.", "BodyRu"),
        PageBreak(),
        p("04. Фактические результаты k6", "Section"),
        table([
            ["Метрика", "Значение"],
            ["http_reqs", "60001"],
            ["http_req_failed", "0.00%"],
            ["checks", "60001 / 60001 успешно"],
            ["iterations", "60001"],
            ["dropped_iterations", "0"],
            ["Фактический RPS", "999.967857 req/s"],
            ["avg latency", "2.38 ms"],
            ["median latency", "1.18 ms"],
            ["p90 latency", "1.75 ms"],
            ["p95 latency", "2.52 ms"],
            ["max latency", "104.24 ms"],
            ["Получено данных", "17 MB"],
            ["Отправлено данных", "11 MB"],
        ]),
        Spacer(1, 10),
        callout("РЕЗУЛЬТАТ:", "прогон завершен без ошибок, без interrupted iterations и без dropped_iterations."),
        PageBreak(),
        p("05. Состояние после теста", "Section"),
        table([
            ["Проверка", "Результат"],
            ["backend_main", "online"],
            ["backend_scheduler", "online"],
            ["pixi-editor", "online"],
            ["health endpoint", "https://admin.i-panel.pro:8787/healthz -> {\"status\":\"ok\"}"],
            ["Load average сервера после теста", "1.32 / 1.66 / 1.64"],
            ["RAM сервера", "29 GiB всего, около 24 GiB available"],
            ["Диск /", "433 GB всего, 154 GB занято, 38%"],
        ]),
        Spacer(1, 12),
        p("Доступы к мониторингу", "H3"),
        table([
            ["Сервис", "Доступ"],
            ["Grafana", "http://212.41.9.251:3001, admin / admin123"],
            ["Prometheus", "http://212.41.9.251:9091"],
            ["Backend metrics", "https://admin.i-panel.pro:8787/metrics"],
            ["Observability", "/root/ipanel_observability"],
        ]),
        PageBreak(),
        p("06. Заключение", "Section"),
        p("Цель 1000 RPS достигнута на легком техническом endpoint /healthz после перевода backend на multi-worker запуск и отключения access-log. Прогон показал 60001 успешный HTTP-запрос за 60 секунд, фактическую интенсивность 999.97 RPS и отсутствие ошибок.", "BodyRu"),
        p("Для подтверждения 1000 RPS на полном пользовательском сценарии панели требуется отдельная работа: кэширование тяжелых API, оптимизация /api/parse/batch, уменьшение размера ответов и профилирование базы данных.", "BodyRu"),
    ]
    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUT)
