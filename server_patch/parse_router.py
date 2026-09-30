from typing import Any, Dict, List, Optional

import requests
from fastapi import APIRouter
from pydantic import BaseModel

from metalsApi.metal_api import get_price as get_metals_price
from newsApi.news_parser import get_news
from oilApi.oilParser import get_brent_price
from src.repository import new_file_repository
from weather_api.weatherApi import get_weather

router = APIRouter(
    prefix="/api/parse",
    tags=["Parse CRUD"],
)

PARSE_DATA_STORAGE = {
    "price": {},
    "news": [],
    "weather": {},
    "metals": {},
    "traffic": {"balls": 5},
    "rates": {},
}


class BatchParseRequest(BaseModel):
    widgets: List[str] = []
    include_media: bool = False
    panel_ids: List[int] = []


def get_rates():
    try:
        response = requests.get("https://www.cbr-xml-daily.ru/daily_json.js", timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as ex:
        print(f"Parse rates error: {ex}")
        return PARSE_DATA_STORAGE.get("rates") or {}


def get_panel_files_payload(panel_id: int):
    files = new_file_repository.get_panel_files(panel_id) or []
    return [
        {
            "id": file["id"],
            "url": file["url"],
            "type": file["type"],
            "count_play": file["count_play"],
            "panel_id": file["panel_id"],
            "player_number": file["player_number"],
            "position": file["position"],
            "time_view": file["time_view"],
        }
        for file in files
    ]


async def update_parse_data_by_sheduler():
    global PARSE_DATA_STORAGE

    try:
        PARSE_DATA_STORAGE["price"] = get_brent_price()
    except Exception as ex:
        print(f"Parse brent error: {ex}")

    try:
        PARSE_DATA_STORAGE["news"] = get_news()
    except Exception as ex:
        print(f"Parse news error: {ex}")

    try:
        PARSE_DATA_STORAGE["weather"] = get_weather()
    except Exception as ex:
        print(f"Parse weather error: {ex}")

    try:
        PARSE_DATA_STORAGE["metals"] = get_metals_price()
    except Exception as ex:
        print(f"Parse metals error: {ex}")

    try:
        PARSE_DATA_STORAGE["rates"] = get_rates()
    except Exception as ex:
        print(f"Parse rates error: {ex}")

    return True


@router.get("/get_brent")
async def get_brent_api():
    return PARSE_DATA_STORAGE["price"]


@router.get("/news")
async def get_news_api():
    return PARSE_DATA_STORAGE["news"]


@router.get("/get_weather")
async def get_temp_api():
    return PARSE_DATA_STORAGE["weather"]


@router.get("/metals")
async def get_metals_api():
    return PARSE_DATA_STORAGE["metals"]


@router.get("/traffic")
async def get_traffic_api():
    return PARSE_DATA_STORAGE["traffic"]


@router.get("/rates")
async def get_rates_api():
    if not PARSE_DATA_STORAGE["rates"]:
        PARSE_DATA_STORAGE["rates"] = get_rates()
    return PARSE_DATA_STORAGE["rates"]


@router.post("/batch")
async def get_batch_api(request: BatchParseRequest):
    requested_widgets = {str(widget).strip().lower() for widget in request.widgets}
    payload: Dict[str, Any] = {}

    if "news" in requested_widgets:
        payload["news"] = PARSE_DATA_STORAGE["news"]

    if "weather" in requested_widgets:
        payload["weather"] = PARSE_DATA_STORAGE["weather"]

    if "metals" in requested_widgets:
        payload["metals"] = PARSE_DATA_STORAGE["metals"]

    if "traffic" in requested_widgets:
        payload["traffic"] = PARSE_DATA_STORAGE["traffic"]

    if "rates" in requested_widgets:
        if not PARSE_DATA_STORAGE["rates"]:
            PARSE_DATA_STORAGE["rates"] = get_rates()
        payload["rates"] = PARSE_DATA_STORAGE["rates"]

    if request.include_media:
        media_by_panel_id = {}
        for panel_id in request.panel_ids:
            media_by_panel_id[str(panel_id)] = get_panel_files_payload(panel_id)
        payload["media_by_panel_id"] = media_by_panel_id
        if len(request.panel_ids) == 1:
            payload["media"] = media_by_panel_id.get(str(request.panel_ids[0]), [])

    return payload


@router.get("/refresh/get_brent")
async def refresh_brent_api():
    price = get_brent_price()
    if price:
        PARSE_DATA_STORAGE["price"] = price
        return price
    return False


@router.get("/refresh/news")
async def refresh_news_api():
    news = get_news()
    if news:
        PARSE_DATA_STORAGE["news"] = news
        return news
    return False


@router.get("/refresh/get_weather")
async def refresh_temp_api():
    weather = get_weather()
    if weather:
        PARSE_DATA_STORAGE["weather"] = weather
        return weather
    return False


@router.get("/refresh/metals")
async def refresh_metals_api():
    metals = get_metals_price()
    if metals:
        PARSE_DATA_STORAGE["metals"] = metals
        return metals
    return False


@router.get("/refresh/traffic")
async def refresh_traffic_api():
    PARSE_DATA_STORAGE["traffic"] = {"balls": 5}
    return PARSE_DATA_STORAGE["traffic"]


@router.get("/refresh/rates")
async def refresh_rates_api():
    rates = get_rates()
    if rates:
        PARSE_DATA_STORAGE["rates"] = rates
        return rates
    return False
