from fastapi import APIRouter

from metalsApi.metal_api import get_price as get_metals_price
from newsApi.news_parser import get_news
from oilApi.oilParser import get_brent_price
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
}


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
