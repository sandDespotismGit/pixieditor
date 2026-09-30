from pathlib import Path
import mimetypes
from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, Response, StreamingResponse
import schedule
from threading import Thread
from time import sleep

from config import Config

from src.routers.user_router import router as user_router
from src.routers.panel_router import router as panel_router
from src.routers.parse_router import router as parse_router, update_parse_data_by_sheduler
from src.routers.file_router import router as file_router
from src.routers.new_file_router import router as new_file_router

app = FastAPI(
    title="IPanel API v2.0",
    description="Данная API предназначена для работы системы IPanel",
    version="2.1.2",
)

config = Config()
_sheduler = schedule.Scheduler()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def static_cache_headers(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static/"):
        response.headers.setdefault("Cache-Control", "public, max-age=31536000, immutable")
        response.headers.setdefault("Accept-Ranges", "bytes")
    return response


def iter_file_range(path: Path, start: int, end: int, chunk_size: int = 1024 * 1024):
    with open(path, "rb") as file:
        file.seek(start)
        remaining = end - start + 1
        while remaining > 0:
            chunk = file.read(min(chunk_size, remaining))
            if not chunk:
                break
            remaining -= len(chunk)
            yield chunk


@app.api_route("/static/{file_path:path}", methods=["GET", "HEAD"])
async def static_with_range(file_path: str, request: Request):
    static_root = Path("./static").resolve()
    target = (static_root / file_path).resolve()
    if not str(target).startswith(str(static_root)) or not target.is_file():
        raise HTTPException(status_code=404, detail="File not found")

    file_size = target.stat().st_size
    content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
    base_headers = {
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
    }

    range_header = request.headers.get("range")
    if range_header and range_header.startswith("bytes="):
        range_value = range_header.replace("bytes=", "", 1).split(",", 1)[0]
        start_text, _, end_text = range_value.partition("-")
        try:
            if start_text:
                start = int(start_text)
                end = int(end_text) if end_text else file_size - 1
            else:
                suffix_length = int(end_text)
                start = max(file_size - suffix_length, 0)
                end = file_size - 1
        except ValueError:
            start, end = 0, file_size - 1

        start = max(start, 0)
        end = min(end, file_size - 1)
        if start > end:
            return Response(status_code=416, headers={**base_headers, "Content-Range": f"bytes */{file_size}"})

        headers = {
            **base_headers,
            "Content-Range": f"bytes {start}-{end}/{file_size}",
            "Content-Length": str(end - start + 1),
        }
        if request.method == "HEAD":
            return Response(status_code=206, media_type=content_type, headers=headers)
        return StreamingResponse(
            iter_file_range(target, start, end),
            status_code=206,
            media_type=content_type,
            headers=headers,
        )

    headers = {**base_headers, "Content-Length": str(file_size)}
    if request.method == "HEAD":
        return Response(status_code=200, media_type=content_type, headers=headers)
    return StreamingResponse(
        iter_file_range(target, 0, file_size - 1),
        media_type=content_type,
        headers=headers,
    )


app.mount("/static", StaticFiles(directory=Path("./static")), name="static")


@app.get("/")
def redirect_to_swagger():
    return RedirectResponse(url="/docs")


def schedule_checker():
    while True:
        _sheduler.run_pending()
        sleep(1)


def parse_data_update():
    import asyncio

    asyncio.run(update_parse_data_by_sheduler())


app.include_router(user_router)
app.include_router(panel_router)
app.include_router(parse_router)
app.include_router(file_router)
app.include_router(new_file_router)


if __name__ == "__main__":
    import uvicorn

    print("RUN parse data for local storage")
    parse_data_update()
    print("RUN server")

    _sheduler.every(15).minutes.do(parse_data_update)
    Thread(target=schedule_checker).start()

    uvicorn.run(
        "main:app",
        host=config.__getattr__("HOST"),
        port=int(config.__getattr__("SERVER_PORT")),
        ssl_keyfile=config.__getattr__("KEY_SSH"),
        ssl_certfile=config.__getattr__("CERT_SSH"),
    )
