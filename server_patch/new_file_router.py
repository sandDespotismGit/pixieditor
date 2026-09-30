from fastapi import APIRouter, File, HTTPException, UploadFile
from pathlib import Path
import hashlib
import os
import shutil
import subprocess
from datetime import datetime
from typing import List, Optional

import cv2

from src.models.models import FileModel
from src.repository import new_file_repository

router = APIRouter(
    prefix="/api/new_file",
    tags=["New File CRUD"],
)

UPLOAD_DIR = Path("static")
UPLOAD_DIR.mkdir(exist_ok=True)
CHUNK_SIZE = 1024 * 1024


def is_video_file(filename: str) -> bool:
    video_extensions = {".mp4", ".avi", ".mov", ".mkv", ".webm", ".flv", ".wmv"}
    return Path(filename).suffix.lower() in video_extensions


def is_mp4_file(filename: str) -> bool:
    return Path(filename).suffix.lower() == ".mp4"


def generate_unique_filename(original_filename: str, panel_id: int) -> str:
    name, ext = os.path.splitext(original_filename)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
    unique_id = hashlib.md5(f"{original_filename}{panel_id}{timestamp}".encode()).hexdigest()[:8]
    return f"{name}_{timestamp}_{unique_id}{ext}"


def check_file_exists(panel_dir: Path, filename: str) -> Optional[Path]:
    file_path = panel_dir / filename
    if file_path.exists():
        name, ext = os.path.splitext(filename)
        counter = 1
        while (panel_dir / f"{name}_{counter}{ext}").exists():
            counter += 1
        return panel_dir / f"{name}_{counter}{ext}"
    return file_path


async def save_upload_file(upload_file: UploadFile, destination: Path):
    with open(destination, "wb") as buffer:
        while True:
            chunk = await upload_file.read(CHUNK_SIZE)
            if not chunk:
                break
            buffer.write(chunk)


def optimize_mp4_faststart(input_path: Path, output_path: Path):
    if shutil.which("ffmpeg") is None:
        return input_path

    command = [
        "ffmpeg",
        "-y",
        "-i",
        str(input_path),
        "-map",
        "0",
        "-c",
        "copy",
        "-movflags",
        "+faststart",
        str(output_path),
    ]

    try:
        subprocess.run(command, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180)
        if output_path.exists() and output_path.stat().st_size > 0:
            return output_path
    except Exception as error:
        print(f"Faststart optimization skipped: {error}")

    return input_path


def get_video_duration(path: Path) -> int:
    cap = cv2.VideoCapture(str(path))
    try:
        if cap.isOpened():
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            if fps > 0 and frame_count > 0:
                return int(frame_count / fps)
    finally:
        cap.release()
    return 0


async def save_media_file(
    panel_id: int,
    file: UploadFile,
    type: str,
    player_number: int,
    count_play: int,
    time_view: int,
    position: int,
):
    panel_dir = UPLOAD_DIR / str(panel_id)
    panel_dir.mkdir(parents=True, exist_ok=True)

    unique_filename = generate_unique_filename(file.filename, panel_id)
    file_path = check_file_exists(panel_dir, unique_filename)
    temp_path = panel_dir / f"temp_{file_path.name}"

    await save_upload_file(file, temp_path)

    optimized = False
    if is_video_file(file.filename) and is_mp4_file(file.filename):
        optimized_path = panel_dir / f"fast_{file_path.name}"
        final_source = optimize_mp4_faststart(temp_path, optimized_path)
        if final_source != temp_path:
            final_source.rename(file_path)
            temp_path.unlink(missing_ok=True)
            optimized = True
        else:
            temp_path.rename(file_path)
            optimized_path.unlink(missing_ok=True)
    else:
        temp_path.rename(file_path)

    if is_video_file(file.filename):
        detected_duration = get_video_duration(file_path)
        if detected_duration:
            time_view = detected_duration

    result = new_file_repository.create_file(
        url=str(file_path),
        type=type,
        player_number=player_number,
        count_play=count_play,
        time_view=time_view,
        position=position,
        panel_id=panel_id,
    )

    return {
        "id": result,
        "original_filename": file.filename,
        "saved_filename": file_path.name,
        "path": str(file_path),
        "url": str(file_path),
        "optimized": optimized,
        "compressed": optimized,
        "duration": time_view if is_video_file(file.filename) else None,
    }


@router.post("/{panel_id}/upload-files")
async def upload_file(
    panel_id: int,
    type: str,
    player_number: int,
    count_play: int,
    time_view: int,
    position: int,
    file: UploadFile = File(...),
):
    return await save_media_file(
        panel_id=panel_id,
        file=file,
        type=type,
        player_number=player_number,
        count_play=count_play,
        time_view=time_view,
        position=position,
    )


@router.post("/{panel_id}/upload-files-bulk")
async def upload_files_bulk(
    panel_id: int,
    type: str,
    player_number: int,
    count_play: int,
    image_time_view: int = 10,
    files: List[UploadFile] = File(...),
):
    if not files:
        raise HTTPException(status_code=400, detail="Files are required")

    new_file_repository.shift_media_positions(panel_id, len(files))

    results = []
    for index, file in enumerate(files):
        extension = Path(file.filename).suffix.lower().lstrip(".")
        file_type = type
        if extension in {"mp4", "avi", "mov", "wmv", "flv", "mkv", "webm"}:
            file_type = "video"
        elif extension in {"mp3", "wav", "ogg", "m4a", "flac", "aac"}:
            file_type = "audio"
        elif extension in {"jpg", "jpeg", "png", "gif", "bmp", "webp"}:
            file_type = "image"

        media_player_number = 0 if file_type == "audio" else player_number
        time_view = image_time_view if file_type == "image" else 0

        results.append(
            await save_media_file(
                panel_id=panel_id,
                file=file,
                type=file_type,
                player_number=media_player_number,
                count_play=count_play,
                time_view=time_view,
                position=index + 1,
            )
        )

    return {"uploaded": len(results), "files": results}


@router.get("/{panel_id}")
async def get_panel_files(panel_id: int):
    data = new_file_repository.get_panel_files(panel_id)
    return [
        FileModel(
            id=file["id"],
            url=file["url"],
            type=file["type"],
            count_play=file["count_play"],
            panel_id=file["panel_id"],
            player_number=file["player_number"],
            position=file["position"],
            time_view=file["time_view"],
        )
        for file in data
    ]


@router.put("/{file_id}")
async def update_file(file: FileModel, file_id: int):
    new_file_repository.update_file(
        file_id,
        file.url,
        file.type,
        file.player_number,
        file.count_play,
        file.time_view,
        file.position,
        file.panel_id,
    )

    return True


@router.delete("/{file_id}")
async def delete_file(file_id: int):
    data = new_file_repository.get_panel_files_by_id(file_id)
    if data is None:
        raise HTTPException(status_code=404, detail="File not found")

    if os.path.exists(data["url"]):
        os.remove(data["url"])

    new_file_repository.delete_file(file_id)
    return True
