// CalendarWidget.js
import { Container, Graphics, Text, TextStyle } from "pixi.js";
import DraggableWidget from "../draggable_widget";

export default class CalendarWidget extends DraggableWidget {

    constructor(bounds, width, height, options = {}) {
        const content = new Container();

        // Фон виджета
        const bg = new Graphics();
        bg.beginFill(options.backgroundColor ?? 0x1e1e1e, options.backgroundAlpha ?? 1)
            .drawRoundedRect(0, 0, width, height, options.cornerRadius ?? 32)
            .endFill();
        content.addChild(bg);

        // Определяем тип виджета по размерам
        const isCalendarXL = width === 508 && height === 377;
        const isDateL = width === 508 && height === 246;
        const isDateM = width === 508 && height === 115;
        const isDateM2 = width === 377 && height === 246;
        const isDateS = width === 246 && height === 246;
        const isDateXS = width === 246 && height === 115;

        super(bounds, content, options);

        // Создаем соответствующий тип виджета
        if (isCalendarXL) {
            createCalendarContent(content, width, height);
            this.type = "XL"
        } else if (isDateL) {
            createDateWithPreviousNextContent(content, width, height, false);
            this.type = "L"
        } else if (isDateM) {
            createSimpleDateContent(content, width, height);
            this.type = "M"
        } else if (isDateM2) {
            createDateWithPreviousNextContent(content, width, height, true);
            this.type = "M2"
        } else if (isDateS) {
            createBigDateContent(content, width, height);
            this.type = "S"
        } else if (isDateXS) {
            if (options.dayOnly) {
                createDayOnlyContent(content, width, height);
                this.type = "XS_day"
            } else if (options.dateOnly) {
                createDateOnlyContent(content, width, height);
                this.type = "XS_date"
            } else {
                createDateWithDayContent(content, width, height);
                this.type = "XS"
            }
        }

        this._width = width;
        this._height = height;
        this.bg = bg;

        this.updateDate();
        this._timer = setInterval(() => this.updateDate(), options.updateInterval ?? 1000);
    }

    updateDate() {
        const now = new Date();

        if (this.content.monthHeader) {
            this.updateCalendar(now);
        } else if (this.content.dateElements) {
            this.updateDateWithPreviousNext(now);
        } else if (this.content.dateElement) {
            this.updateSimpleDate(now);
        } else if (this.content.bigDateElements) {
            this.updateBigDate(now);
        } else if (this.content.dateWithDayElements) {
            this.updateDateWithDay(now);
        } else if (this.content.dayElement) {
            this.updateDayOnly(now);
        }
    }

    updateCalendar(date) {
        const monthsFull = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
            "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"];

        this.content.monthHeader.text = monthsFull[date.getMonth()];

        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const daysInMonth = lastDay.getDate();
        const firstDayOfWeek = firstDay.getDay() === 0 ? 7 : firstDay.getDay();

        // Скрываем все ячейки и фоны
        this.content.calendarCells.forEach(cell => {
            cell.visible = false;
            cell.style = this.content.calendarStyles.styleDays;
        });

        this.content.calendarBackgrounds.forEach(bg => {
            bg.visible = false; // ← Скрываем все фоны
        });

        // Заполняем календарь с правильным смещением
        let day = 1;
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 7; col++) {
                const cellIndex = row * 7 + col;
                if (cellIndex >= firstDayOfWeek - 1 && day <= daysInMonth) {
                    const cell = this.content.calendarCells[cellIndex];
                    const cellBg = this.content.calendarBackgrounds[cellIndex]; // ← Получаем фон

                    cell.text = day.toString();
                    cell.visible = true;

                    if (day === date.getDate()) {
                        cell.style = this.content.calendarStyles.styleToday;
                        cellBg.visible = true; // ← Показываем фон для текущей даты
                    }
                    day++;
                }
            }
        }
    }

    updateDateWithPreviousNext(date) {
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда",
            "Четверг", "Пятница", "Суббота"];

        for (let i = -2; i <= 2; i++) {
            const targetDate = new Date(date);
            targetDate.setDate(date.getDate() + i);

            const dayText = days[targetDate.getDay()];
            const dateText = targetDate.getDate();
            const monthText = months[targetDate.getMonth()];

            if (this.content.dateElements[i + 2]) {
                this.content.dateElements[i + 2].text = `${dayText}, ${dateText} ${monthText}`;
            }
        }
    }

    updateSimpleDate(date) {
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда",
            "Четверг", "Пятница", "Суббота"];

        const dayText = days[date.getDay()];
        const dateText = date.getDate();
        const monthText = months[date.getMonth()];

        this.content.dateElement.text = `${dayText}, ${dateText} ${monthText}`;
    }

    updateBigDate(date) {
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря"];

        this.content.bigDateElements.day.text = date.getDate().toString();
        this.content.bigDateElements.month.text = months[date.getMonth()];
    }

    updateDateWithDay(date) {
        const months = ["января", "февраля", "марта", "апреля", "мая", "июня",
            "июля", "августа", "сентября", "октября", "ноября", "декабря"];
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда",
            "Четверг", "Пятница", "Суббота"];

        this.content.dateWithDayElements.date.text = `${date.getDate()} ${months[date.getMonth()]}`;
        this.content.dateWithDayElements.day.text = days[date.getDay()];
    }

    updateDayOnly(date) {
        const days = ["Воскресенье", "Понедельник", "Вторник", "Среда",
            "Четверг", "Пятница", "Суббота"];
        this.content.dayElement.text = days[date.getDay()];
    }

    destroy(options) {
        if (this._timer) {
            clearInterval(this._timer);
            this._timer = null;
        }
        super.destroy(options);
    }
}

// Вспомогательные функции для создания контента
function createCalendarContent(content, width, height) {
    const styleHeader = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 500,
        resolution: 2
    });

    const styleWeekdays = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 500,
        resolution: 2
    });

    const styleDays = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleToday = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0x1e1e1e,
        fontWeight: 300,
        resolution: 2
    });

    const monthHeader = new Text("", styleHeader);
    monthHeader.anchor.set(0.5);
    monthHeader.x = width / 2;
    monthHeader.y = 30;
    content.addChild(monthHeader);
    content.monthHeader = monthHeader;

    const daysShort = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];
    const weekdaySpacing = width / 7;

    for (let i = 0; i < 7; i++) {
        const weekday = new Text(daysShort[i], styleWeekdays);
        weekday.anchor.set(0.5);
        weekday.x = weekdaySpacing * (i + 0.5);
        weekday.y = 70;
        content.addChild(weekday);
    }

    content.calendarCells = [];
    content.calendarBackgrounds = [];
    const cellSize = 50;
    const cellSpacing = 20;
    const startX = 50; // Правильное смещение для центрирования
    const startY = 120;

    for (let row = 0; row < 6; row++) {
        for (let col = 0; col < 7; col++) {
            // ДОБАВИТЬ фон для ячейки (для выделения текущей даты)
            const cellBg = new Graphics();
            cellBg.beginFill(0xffffff)
                .drawRoundedRect(-cellSize / 2, -cellSize / 2, cellSize, cellSize, 16)
                .endFill();
            cellBg.visible = false;
            cellBg.x = startX + col * (cellSize + cellSpacing);
            cellBg.y = startY + row * (cellSize + 5);
            content.addChild(cellBg);
            content.calendarBackgrounds.push(cellBg);

            const cell = new Text("", styleDays);
            cell.anchor.set(0.5);
            cell.x = startX + col * (cellSize + cellSpacing);
            cell.y = startY + row * (cellSize + 5);
            cell.visible = false;
            content.addChild(cell);
            content.calendarCells.push(cell);
        }
    }

    content.calendarStyles = { styleDays, styleToday };
}

function createDateWithPreviousNextContent(content, width, height, isCompact) {
    const styleNormal = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0x404040,
        fontWeight: 300,
        resolution: 2
    });

    const styleCurrent = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2,
        align: 'center', // ← ДОБАВИТЬ ЭТУ СТРОКУ
        wordWrap: true,  // ← ДОБАВИТЬ ЭТУ СТРОКУ
        wordWrapWidth: width - 40 // ← УВЕЛИЧИТЬ ОТСТУП
    });

    content.dateElements = [];
    const spacing = height / 5;

    for (let i = 0; i < 5; i++) {
        const style = i === 2 ? styleCurrent : styleNormal;
        const dateText = new Text("", style);
        dateText.anchor.set(0.5);
        dateText.x = width / 2;
        dateText.y = spacing * (i + 0.5);

        content.addChild(dateText);
        content.dateElements.push(dateText);
    }
}

function createSimpleDateContent(content, width, height) {
    const style = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2,
        align: 'center', // ← ДОБАВИТЬ
        wordWrap: true,  // ← ДОБАВИТЬ
        wordWrapWidth: width - 40 // ← УВЕЛИЧИТЬ ОТСТУП
    });

    const dateText = new Text("", style);
    dateText.anchor.set(0.5);
    dateText.x = width / 2;
    dateText.y = height / 2;

    content.addChild(dateText);
    content.dateElement = dateText;
}

function createBigDateContent(content, width, height) {
    const styleDay = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 140,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const styleMonth = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: 400,
        resolution: 2,
        align: 'center', // ← ДОБАВИТЬ
        wordWrap: true,  // ← ДОБАВИТЬ
        wordWrapWidth: width - 20 // ← УВЕЛИЧИТЬ ОТСТУП
    });

    const dayText = new Text("", styleDay);
    dayText.anchor.set(0.5);
    dayText.x = width / 2;
    dayText.y = height / 2 - 20;
    content.addChild(dayText);

    const monthText = new Text("", styleMonth);
    monthText.anchor.set(0.5);
    monthText.x = width / 2;
    monthText.y = height / 2 + 60;

    content.addChild(monthText);

    content.bigDateElements = { day: dayText, month: monthText };
}

function createDateWithDayContent(content, width, height) {
    const styleDate = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0xffffff,
        fontWeight: 500,
        resolution: 2,
        align: 'center', // ← ДОБАВИТЬ
        wordWrap: true,  // ← ДОБАВИТЬ
        wordWrapWidth: width - 20 // ← УВЕЛИЧИТЬ ОТСТУП
    });

    const styleDay = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 22,
        fill: 0x737373,
        fontWeight: 500,
        resolution: 2,
        align: 'center', // ← ДОБАВИТЬ
        wordWrap: true,  // ← ДОБАВИТЬ
        wordWrapWidth: width - 20 // ← УВЕЛИЧИТЬ ОТСТУП
    });

    const dateText = new Text("", styleDate);
    dateText.anchor.set(0.5);
    dateText.x = width / 2;
    dateText.y = height / 2 - 15;

    content.addChild(dateText);

    const dayText = new Text("", styleDay);
    dayText.anchor.set(0.5);
    dayText.x = width / 2;
    dayText.y = height / 2 + 15;

    content.addChild(dayText);

    content.dateWithDayElements = { date: dateText, day: dayText };
}

function createDayOnlyContent(content, width, height) {
    const style = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2,
        align: 'center', // ← ДОБАВИТЬ
        wordWrap: true,  // ← ДОБАВИТЬ
        wordWrapWidth: width - 40 // ← УВЕЛИЧИТЬ ОТСТУП
    });

    const dayText = new Text("", style);
    dayText.anchor.set(0.5);
    dayText.x = width / 2;
    dayText.y = height / 2;

    content.addChild(dayText);
    content.dayElement = dayText;
}

function createDateOnlyContent(content, width, height) {
    const style = new TextStyle({
        fontFamily: "Rubik",
        fontSize: 28,
        fill: 0xffffff,
        fontWeight: 300,
        resolution: 2
    });

    const dateText = new Text("", style);
    dateText.anchor.set(0.5);
    dateText.x = width / 2;
    dateText.y = height / 2;

    content.addChild(dateText);
    content.dateElement = dateText;
}