import requests

MOSCOW_LAT = 55.7558
MOSCOW_LON = 37.6173

WEATHER_CODES = {
    0: "Ясно",
    1: "Переменная облачность",
    2: "Переменная облачность",
    3: "Облачно",
    45: "Облачно",
    48: "Облачно",
    51: "Моросящий дождь",
    53: "Моросящий дождь",
    55: "Моросящий дождь",
    61: "Небольшой дождь",
    63: "Местами дождь",
    65: "Местами дождь",
    80: "Местами дождь",
    81: "Местами дождь",
    82: "Местами дождь",
    95: "Местами грозы",
    96: "Местами грозы",
    99: "Местами грозы",
}

FALLBACK_WEATHER = [
    ["--°", "Нет данных"],
    [["--°", "Ясно"], ["--°", "Ясно"], ["--°", "Ясно"], ["--°", "Ясно"]],
]


def _status(code):
    return WEATHER_CODES.get(int(code or 0), "Ясно")


def _temp(value):
    return f"{round(float(value))}°"


def get_weather():
    try:
        response = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": MOSCOW_LAT,
                "longitude": MOSCOW_LON,
                "current": "temperature_2m,weather_code",
                "hourly": "temperature_2m,weather_code",
                "forecast_days": 1,
                "timezone": "Europe/Moscow",
            },
            timeout=8,
        )
        response.raise_for_status()
        data = response.json()

        current = data.get("current") or {}
        hourly = data.get("hourly") or {}
        temps = hourly.get("temperature_2m") or []
        codes = hourly.get("weather_code") or []
        hours = [8, 14, 20, 23]

        day_parts = []
        for hour in hours:
            if len(temps) > hour and len(codes) > hour:
                day_parts.append([_temp(temps[hour]), _status(codes[hour])])

        while len(day_parts) < 4:
            day_parts.append(
                [
                    _temp(current.get("temperature_2m", 0)),
                    _status(current.get("weather_code", 0)),
                ]
            )

        return [
            [
                _temp(current.get("temperature_2m", 0)),
                _status(current.get("weather_code", 0)),
            ],
            day_parts[:4],
        ]
    except Exception as ex:
        print(f"Weather parse error: {ex}")
        return FALLBACK_WEATHER
