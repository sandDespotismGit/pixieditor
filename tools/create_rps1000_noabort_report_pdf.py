from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import BaseDocTemplate, Frame, PageTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf" / "IPANEL_backend_1000_rps_no_latency_abort_report.pdf"
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
WARN = colors.HexColor("#fff1cc")
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


def callout(label, text, bg=LIME_LIGHT):
    t = Table([[raw(f"<b>{esc(label)}</b> {esc(text)}", "Callout")]], colWidths=[170 * mm], hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg),
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
    canvas.drawCentredString(A4[0] / 2, 12 * mm, "I-PANEL • backend 1000 RPS no latency abort • admin.i-panel.pro")
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
        title="I-PANEL backend 1000 RPS no latency abort report",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin + 8 * mm, doc.width, doc.height - 8 * mm, id="normal")
    doc.addPageTemplates([PageTemplate(id="main", frames=[frame], onPage=footer)])

    story = [
        p("I-PANEL / ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ", "CoverTop"),
        p("актуальная редакция по результатам проверки", "Accent"),
        p("Отчет по тесту backend на 1000 RPS без остановки по latency", "TitleBig"),
        p("I-PANEL • admin.i-panel.pro • 28 августа 2026", "Subtitle"),
        bar(),
        Spacer(1, 18),
        p("Документ фиксирует предельный прогон backend I-PANEL с целевой интенсивностью 1000 HTTP-запросов в секунду. В этом варианте задержка ответов не использовалась как причина досрочной остановки; контролировались ошибки, фактическая пропускная способность и состояние сервера после нагрузки.", "BodyRu"),
        callout("ИТОГ:", "backend не упал и не отдавал HTTP-ошибки, но фактически обработал около 176.8 RPS. Из 60000 плановых итераций выполнено 13168, еще 46832 k6 сбросил из-за невозможности поддержать целевые 1000 RPS.", WARN),
        Spacer(1, 10),
        p("01. Краткое резюме", "Section"),
        table([
            ["Показатель", "Значение"],
            ["Целевая интенсивность", "1000 RPS"],
            ["Плановая длительность", "60 секунд"],
            ["Фактическое время с догоном очереди", "около 74.5 секунд"],
            ["Фактически достигнутая средняя интенсивность", "176.8 RPS"],
            ["HTTP-запросов выполнено", "13169"],
            ["Итераций выполнено", "13168"],
            ["Сброшенные итерации", "46832"],
            ["HTTP-ошибки", "0.00%"],
            ["Checks", "13170 из 13170 успешно"],
            ["Максимум активных VU", "5000"],
            ["Статус теста по ошибкам", "пройден"],
        ]),
        Spacer(1, 10),
        p("Ключевой вывод", "H3"),
        p("По критерию отсутствия HTTP-ошибок backend выдержал прогон: все полученные ответы были успешными. По критерию достижения целевых 1000 RPS - не выдержал: k6 уперся в 5000 VU, накопил очередь и начал сбрасывать итерации.", "BodyRu"),
        PageBreak(),
        p("02. Методика теста", "Section"),
        table([
            ["Параметр", "Значение"],
            ["Инструмент", "Grafana k6"],
            ["Executor", "constant-arrival-rate"],
            ["Rate", "1000 iterations/s"],
            ["Duration", "60s"],
            ["preAllocatedVUs", "1000"],
            ["maxVUs", "5000"],
            ["Latency abort", "отключен"],
            ["Порог ошибок", "http_req_failed rate < 20%"],
            ["Сценарий", "/root/ipanel_observability/k6/ipanel-1000-rps-noabort.js"],
            ["Результат", "/root/ipanel_observability/results/rps1000-noabort-summary.json"],
        ]),
        Spacer(1, 12),
        p("Набор запросов", "H3"),
        table([
            ["Endpoint", "Доля / назначение"],
            ["GET /api/panels/theme_id/{fabric}", "получение темы панели"],
            ["POST /api/parse/batch", "пакет данных виджетов"],
            ["GET /api/parse/rates", "курсы валют"],
            ["GET /api/parse/traffic", "пробки"],
            ["GET /api/panels/get_all_panels", "список панелей"],
        ], widths=[72 * mm, 98 * mm]),
        PageBreak(),
        p("03. Фактические результаты", "Section"),
        table([
            ["Метрика", "Значение"],
            ["http_reqs", "13169"],
            ["http_req_failed", "0.00%"],
            ["ipanel_1000rps_noabort_failures", "0.00%"],
            ["checks", "13170 / 13170 успешно"],
            ["iterations", "13168"],
            ["dropped_iterations", "46832"],
            ["Фактический RPS", "176.8 req/s"],
            ["avg latency", "23.26 s"],
            ["median latency", "19.86 s"],
            ["p90 latency", "37.07 s"],
            ["p95 latency", "38.07 s"],
            ["max latency", "38.89 s"],
            ["Получено данных", "186 MB"],
            ["Отправлено данных", "30 MB"],
        ]),
        Spacer(1, 10),
        callout("ПОЯСНЕНИЕ:", "задержки в этом прогоне намеренно не останавливали тест. Поэтому главный итог здесь - не latency, а отсутствие HTTP-ошибок при фактическом throughput около 176.8 RPS.", WARN),
        PageBreak(),
        p("04. Состояние после теста", "Section"),
        table([
            ["Проверка", "Результат"],
            ["pm2 backend_main", "online"],
            ["Память backend_main по pm2", "746.3 MB"],
            ["pixi-editor", "online"],
            ["Docker observability", "Prometheus, Grafana, blackbox, node-exporter, cAdvisor работают"],
            ["Load average сервера после теста", "1.72 / 1.50 / 1.35"],
            ["RAM сервера", "29 GiB всего, около 24 GiB available"],
            ["Диск /", "433 GB всего, 154 GB занято, 38%"],
        ]),
        Spacer(1, 12),
        p("Доступы", "H3"),
        table([
            ["Сервис", "Доступ"],
            ["Grafana", "http://212.41.9.251:3001, admin / admin123"],
            ["Prometheus", "http://212.41.9.251:9091"],
            ["Backend metrics", "https://admin.i-panel.pro:8787/metrics"],
            ["Observability", "/root/ipanel_observability"],
        ]),
        PageBreak(),
        p("05. Заключение", "Section"),
        p("Backend под нагрузкой не завершился аварийно, не потерял доступность и не начал отдавать HTTP-ошибки. После теста процессы backend_main, pixi-editor и контейнеры мониторинга остались online.", "BodyRu"),
        p("Целевые 1000 RPS в полном объеме не достигнуты: k6 смог провести через систему около 176.8 RPS, остальные плановые итерации были сброшены. Для подтвержденных 1000 RPS потребуется оптимизация тяжелых endpoint, кэширование пакетных данных, профилирование базы и масштабирование backend.", "BodyRu"),
        callout("РЕЗУЛЬТАТ:", "как аварийный стресс-тест без учета задержек прогон пройден без HTTP-ошибок; как тест фактической емкости на 1000 RPS - текущая емкость ниже цели.", WARN),
    ]
    doc.build(story)


if __name__ == "__main__":
    build()
    print(OUT)
