from fastapi import FastAPI, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, StreamingResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
import cv2
import asyncio
import uvicorn
import threading
import time
from datetime import datetime, timedelta
import os
from typing import Dict, List, Optional
import json
import base64
import numpy as np
from pathlib import Path
import shutil
import logging

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MacBook Camera Surveillance System")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Создаем директории для хранения данных
os.makedirs("static", exist_ok=True)
os.makedirs("recordings", exist_ok=True)
os.makedirs("templates", exist_ok=True)

# Монтируем статические файлы
app.mount("/static", StaticFiles(directory="static"), name="static")

# Шаблоны
templates = Jinja2Templates(directory="templates")

# Глобальные переменные состояния
class SystemState:
    def __init__(self):
        self.camera_active = False
        self.camera_thread = None
        self.current_frame = None
        self.clients: List[WebSocket] = []
        self.motion_detection = False
        self.recording = False
        self.video_writer = None
        self.system_logs = []
        self.motion_logs = []
        self.storage_logs = []
        self.record_logs = []
        
        # Настройки системы
        self.video_quality = "medium"  # low, medium, high, ultra
        self.retention_days = 2  # Срок хранения в днях
        self.current_recording_file = None
        self.last_motion_time = None
        
        # Настройки качества видео
        self.quality_settings = {
            "low": {"width": 640, "height": 480, "fps": 15, "bitrate": "1 Мбит/с"},
            "medium": {"width": 1280, "height": 720, "fps": 20, "bitrate": "2.5 Мбит/с"},
            "high": {"width": 1920, "height": 1080, "fps": 25, "bitrate": "5 Мбит/с"},
            "ultra": {"width": 2560, "height": 1440, "fps": 30, "bitrate": "8 Мбит/с"}
        }

state = SystemState()

class CameraManager:
    def __init__(self):
        self.cap = None
        self.frame = None
        self.running = False
        self.previous_frame = None
        self.motion_counter = 0
        
    def start_camera(self):
        """Запуск камеры в отдельном потоке"""
        try:
            self.cap = cv2.VideoCapture(0)  # 0 - встроенная камера MacBook
            
            if not self.cap.isOpened():
                logger.error("Не удалось открыть камеру")
                state.add_system_log("Ошибка: не удалось открыть камеру")
                return
                
            self.running = True
            logger.info("Камера активирована")
            state.add_system_log("Камера активирована")
            
            # Получаем текущие настройки качества
            quality = state.quality_settings[state.video_quality]
            
            # Настройки камеры
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, quality["width"])
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, quality["height"])
            self.cap.set(cv2.CAP_PROP_FPS, quality["fps"])
            
            # Инициализация VideoWriter если запись активна
            if state.recording:
                self.start_recording()
            
            while self.running:
                ret, frame = self.cap.read()
                if ret:
                    # Обработка кадра
                    processed_frame = self.process_frame(frame)
                    state.current_frame = processed_frame
                    self.frame = processed_frame
                    
                    # Отправка всем подключенным клиентам
                    asyncio.run(self.broadcast_frame(processed_frame))
                    
                    # Запись видео если включена
                    if state.recording and state.video_writer is not None:
                        state.video_writer.write(processed_frame)
                        
                time.sleep(1.0 / quality["fps"])
                
            self.cleanup()
            
        except Exception as e:
            logger.error(f"Ошибка в потоке камеры: {e}")
            state.add_system_log(f"Ошибка в потоке камеры: {str(e)}")
            self.cleanup()
    
    def process_frame(self, frame):
        """Обработка кадра: добавление информации, детекция движения и т.д."""
        # Конвертация цвета
        frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        
        # Получаем настройки качества для определения размера
        quality = state.quality_settings[state.video_quality]
        
        # Изменение размера если нужно
        if frame.shape[1] != quality["width"] or frame.shape[0] != quality["height"]:
            frame = cv2.resize(frame, (quality["width"], quality["height"]))
        
        # Добавление информации на кадр
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, timestamp, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
        
        # Добавление информации о качестве
        quality_text = f"Quality: {state.video_quality.upper()}"
        cv2.putText(frame, quality_text, (10, 60), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
        
        # Детекция движения
        if state.motion_detection:
            motion_detected, motion_area = self.detect_motion(frame)
            if motion_detected:
                cv2.putText(frame, "MOTION DETECTED!", (10, 90), 
                           cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                state.last_motion_time = datetime.now()
                
                # Логирование движения
                state.add_motion_log(motion_area)
        
        # Индикатор записи
        if state.recording:
            cv2.putText(frame, "REC", (frame.shape[1] - 80, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            cv2.circle(frame, (frame.shape[1] - 40, 25), 8, (0, 0, 255), -1)
        
        return frame
    
    def detect_motion(self, frame):
        """Детекция движения с использованием background subtraction"""
        gray = cv2.cvtColor(frame, cv2.COLOR_RGB2GRAY)
        gray = cv2.GaussianBlur(gray, (21, 21), 0)
        
        if self.previous_frame is None:
            self.previous_frame = gray
            return False, 0
        
        # Вычисляем разницу между кадрами
        frame_delta = cv2.absdiff(self.previous_frame, gray)
        thresh = cv2.threshold(frame_delta, 25, 255, cv2.THRESH_BINARY)[1]
        thresh = cv2.dilate(thresh, None, iterations=2)
        
        # Находим контуры
        contours, _ = cv2.findContours(thresh.copy(), cv2.RETR_EXTERNAL, 
                                      cv2.CHAIN_APPROX_SIMPLE)
        
        motion_detected = False
        total_area = 0
        
        for contour in contours:
            area = cv2.contourArea(contour)
            if area > 500:  # Порог площади для детекции
                motion_detected = True
                total_area += area
                x, y, w, h = cv2.boundingRect(contour)
                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)
        
        self.previous_frame = gray
        return motion_detected, total_area
    
    def start_recording(self):
        """Начало записи видео"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            quality = state.quality_settings[state.video_quality]
            filename = f"recordings/recording_{timestamp}_{state.video_quality}.avi"
            state.current_recording_file = filename
            
            # Инициализация VideoWriter
            fourcc = cv2.VideoWriter_fourcc(*'XVID')
            state.video_writer = cv2.VideoWriter(
                filename, 
                fourcc, 
                quality["fps"], 
                (quality["width"], quality["height"])
            )
            
            if state.video_writer.isOpened():
                state.add_system_log(f"Запись начата: {filename}")
                state.add_record_log(f"Начата запись в файл: {filename}")
            else:
                logger.error("Не удалось открыть VideoWriter")
                state.video_writer = None
                
        except Exception as e:
            logger.error(f"Ошибка при начале записи: {e}")
            state.video_writer = None
    
    async def broadcast_frame(self, frame):
        """Отправка кадра всем подключенным клиентам"""
        # Конвертация кадра в base64 для веб-страницы
        frame_bgr = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
        _, buffer = cv2.imencode('.jpg', frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
        frame_base64 = base64.b64encode(buffer).decode('utf-8')
        
        # Отправка всем подключенным клиентам
        for client in state.clients:
            try:
                await client.send_json({
                    "type": "frame",
                    "data": frame_base64,
                    "timestamp": datetime.now().isoformat()
                })
            except:
                continue
    
    def cleanup(self):
        """Очистка ресурсов камеры"""
        if self.cap is not None:
            self.cap.release()
            self.cap = None
        
        if state.video_writer is not None:
            state.video_writer.release()
            state.video_writer = None
        
        self.running = False
        logger.info("Камера остановлена")

# Создаем экземпляр менеджера камеры
camera_manager = CameraManager()

# Добавляем методы логирования в SystemState
def add_system_log(self, message: str):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "source": "SYSTEM",
        "message": message
    }
    self.system_logs.append(log_entry)
    # Ограничиваем размер логов
    if len(self.system_logs) > 1000:
        self.system_logs = self.system_logs[-1000:]

def add_motion_log(self, area: float):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "source": "MOTION",
        "message": f"Обнаружено движение (площадь: {area:.0f}px²)",
        "area": area
    }
    self.motion_logs.append(log_entry)
    self.motion_counter += 1

def add_storage_log(self, message: str):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "source": "STORAGE",
        "message": message
    }
    self.storage_logs.append(log_entry)

def add_record_log(self, message: str):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "source": "RECORD",
        "message": message
    }
    self.record_logs.append(log_entry)

# Привязываем методы к классу
SystemState.add_system_log = add_system_log
SystemState.add_motion_log = add_motion_log
SystemState.add_storage_log = add_storage_log
SystemState.add_record_log = add_record_log

# API Endpoints
@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    """Главная страница с видео потоком"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Live Video Stream</title>
        <style>
            body { margin: 0; padding: 20px; background: #111; text-align: center; }
            h1 { color: white; }
            img { max-width: 100%; border: 2px solid #333; border-radius: 10px; }
        </style>
    </head>
    <body>
        <h1>Live Camera Feed</h1>
        <img src="/video_feed">
        <p style="color: white;">Go to <a href="/admin" style="color: #4CAF50;">admin panel</a> for controls</p>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.get("/admin", response_class=HTMLResponse)
async def admin_panel(request: Request):
    """Административная панель"""
    # Читаем HTML файл из templates или используем встроенный
    try:
        return templates.TemplateResponse("admin.html", {"request": request})
    except:
        # Если файла нет, возвращаем встроенный HTML
        with open("templates/admin.html", "w") as f:
            # Здесь должна быть HTML структура из предыдущего ответа
            f.write("<!-- Admin template will be created by frontend -->")
        return HTMLResponse(content="<h1>Admin Panel</h1><p>Template not found</p>")

@app.get("/api/status")
async def get_status():
    """Получение статуса системы"""
    # Расчет использования диска
    storage_used_gb = 0
    files_count = 0
    
    recordings_path = Path("recordings")
    if recordings_path.exists():
        for file in recordings_path.glob("*.avi"):
            storage_used_gb += file.stat().st_size / (1024**3)  # Конвертация в ГБ
            files_count += 1
    
    return {
        "camera_active": state.camera_active,
        "clients_connected": len(state.clients),
        "motion_detection": state.motion_detection,
        "recording": state.recording,
        "video_quality": state.video_quality,
        "retention_days": state.retention_days,
        "motion_events": len(state.motion_logs),
        "storage_used_gb": round(storage_used_gb, 2),
        "storage_total_gb": 100,  # Предполагаемый размер диска
        "files_count": files_count,
        "last_motion_time": state.last_motion_time.isoformat() if state.last_motion_time else None,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/api/camera/start")
async def start_camera():
    """Запуск камеры"""
    if not state.camera_active:
        state.camera_active = True
        state.camera_thread = threading.Thread(target=camera_manager.start_camera, daemon=True)
        state.camera_thread.start()
        state.add_system_log("Камера запущена")
        return {"status": "success", "message": "Camera started"}
    return {"status": "error", "message": "Camera already running"}

@app.post("/api/camera/stop")
async def stop_camera():
    """Остановка камеры"""
    state.camera_active = False
    camera_manager.running = False
    
    # Ожидаем остановки потока
    if state.camera_thread and state.camera_thread.is_alive():
        state.camera_thread.join(timeout=2.0)
    
    state.add_system_log("Камера остановлена")
    return {"status": "success", "message": "Camera stopped"}

@app.post("/api/motion-detection/toggle")
async def toggle_motion_detection():
    """Переключение детекции движения"""
    state.motion_detection = not state.motion_detection
    status = "включена" if state.motion_detection else "выключена"
    state.add_system_log(f"Детекция движения {status}")
    return {"status": "success", "motion_detection": state.motion_detection}

@app.post("/api/recording/start")
async def start_recording():
    """Начало записи видео"""
    if not state.recording:
        state.recording = True
        
        # Если камера активна, запускаем запись в менеджере камеры
        if state.camera_active and camera_manager.running:
            camera_manager.start_recording()
        else:
            # Если камера не активна, создаем пустой VideoWriter
            state.add_system_log("Запись не может быть начата: камера не активна")
            state.recording = False
            return {"status": "error", "message": "Camera not active"}
        
        return {"status": "success", "message": "Recording started"}
    return {"status": "error", "message": "Already recording"}

@app.post("/api/recording/stop")
async def stop_recording():
    """Остановка записи видео"""
    state.recording = False
    if state.video_writer is not None:
        state.video_writer.release()
        state.video_writer = None
        state.add_system_log("Запись остановлена")
        state.add_record_log(f"Запись остановлена: {state.current_recording_file}")
        state.current_recording_file = None
    return {"status": "success", "message": "Recording stopped"}

@app.post("/api/settings/quality")
async def update_video_quality(request: Request):
    """Обновление качества видео"""
    try:
        data = await request.json()
        quality = data.get("quality", "medium")
        
        if quality not in state.quality_settings:
            return {"status": "error", "message": "Invalid quality setting"}
        
        state.video_quality = quality
        quality_info = state.quality_settings[quality]
        
        # Если камера активна, нужно перезапустить с новыми настройками
        if state.camera_active:
            state.add_system_log(f"Качество видео изменено на {quality} ({quality_info['width']}x{quality_info['height']})")
        
        return {"status": "success", "message": f"Quality set to {quality}"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/settings/retention")
async def update_retention_policy(request: Request):
    """Обновление политики хранения записей"""
    try:
        data = await request.json()
        retention_days = data.get("retention_days", 2)
        
        # Проверка значения
        if retention_days == "forever":
            state.retention_days = retention_days
        else:
            try:
                retention_days = int(retention_days)
                if retention_days < 0:
                    return {"status": "error", "message": "Retention days must be positive"}
                state.retention_days = retention_days
            except ValueError:
                return {"status": "error", "message": "Invalid retention value"}
        
        state.add_system_log(f"Политика хранения обновлена: {retention_days}")
        return {"status": "success", "message": "Retention policy updated"}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/api/storage/cleanup")
async def cleanup_storage():
    """Очистка старых записей"""
    try:
        if state.retention_days == "forever":
            return {"status": "error", "message": "Retention policy is set to 'forever'"}
        
        cutoff_date = datetime.now() - timedelta(days=state.retention_days)
        deleted_files = 0
        freed_space_bytes = 0
        
        recordings_path = Path("recordings")
        if recordings_path.exists():
            for file in recordings_path.glob("*.avi"):
                # Получаем дату создания файла из имени
                try:
                    # Имя файла: recording_YYYYMMDD_HHMMSS_quality.avi
                    filename_parts = file.stem.split("_")
                    if len(filename_parts) >= 3:
                        date_str = filename_parts[1]
                        time_str = filename_parts[2]
                        file_date = datetime.strptime(f"{date_str}_{time_str}", "%Y%m%d_%H%M%S")
                        
                        if file_date < cutoff_date:
                            file_size = file.stat().st_size
                            file.unlink()
                            deleted_files += 1
                            freed_space_bytes += file_size
                            state.add_storage_log(f"Удален старый файл: {file.name}")
                except:
                    continue
        
        freed_space_gb = freed_space_bytes / (1024**3)
        state.add_system_log(f"Очистка завершена. Удалено: {deleted_files} файлов")
        
        return {
            "status": "success",
            "deleted_files": deleted_files,
            "freed_space_gb": round(freed_space_gb, 2),
            "message": f"Deleted {deleted_files} files, freed {round(freed_space_gb, 2)} GB"
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.get("/api/logs/all")
async def get_all_logs():
    """Получение всех логов системы"""
    all_logs = []
    
    # Добавляем системные логи
    for log in state.system_logs[-100:]:  # Последние 100 записей
        all_logs.append(log)
    
    # Добавляем логи движения
    for log in state.motion_logs[-50:]:
        all_logs.append(log)
    
    # Добавляем логи записи
    for log in state.record_logs[-50:]:
        all_logs.append(log)
    
    # Добавляем логи хранилища
    for log in state.storage_logs[-50:]:
        all_logs.append(log)
    
    # Сортируем по времени
    all_logs.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return {"logs": all_logs[:200]}  # Возвращаем последние 200 записей

@app.get("/api/logs/motion")
async def get_motion_logs():
    """Получение логов движения"""
    return {"logs": state.motion_logs[-100:]}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket для обмена данными в реальном времени"""
    await websocket.accept()
    state.clients.append(websocket)
    
    try:
        # Отправляем начальный статус
        status = await get_status()
        await websocket.send_json({
            "type": "status",
            "data": status
        })
        
        # Ожидание сообщений от клиента
        while True:
            data = await websocket.receive_text()
            # Можно добавить обработку команд от клиента
            try:
                command = json.loads(data)
                if command.get("type") == "ping":
                    await websocket.send_json({"type": "pong", "timestamp": datetime.now().isoformat()})
            except:
                pass
                
    except WebSocketDisconnect:
        state.clients.remove(websocket)
        logger.info(f"WebSocket disconnected. Active clients: {len(state.clients)}")

@app.get("/video_feed")
async def video_feed():
    """Потоковое видео в формате MJPEG"""
    async def generate_frames():
        while True:
            if state.current_frame is not None:
                # Конвертация кадра в JPEG
                frame_bgr = cv2.cvtColor(state.current_frame, cv2.COLOR_RGB2BGR)
                _, buffer = cv2.imencode('.jpg', frame_bgr, [cv2.IMWRITE_JPEG_QUALITY, 85])
                frame_bytes = buffer.tobytes()
                
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')
            await asyncio.sleep(0.033)  # ~30 FPS
    
    return StreamingResponse(
        generate_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/storage/usage")
async def get_storage_usage():
    """Получение информации об использовании хранилища"""
    recordings_path = Path("recordings")
    files_info = []
    total_size = 0
    
    if recordings_path.exists():
        for file in recordings_path.glob("*.avi"):
            file_stat = file.stat()
            file_info = {
                "name": file.name,
                "size_gb": round(file_stat.st_size / (1024**3), 3),
                "created": datetime.fromtimestamp(file_stat.st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(file_stat.st_mtime).isoformat()
            }
            files_info.append(file_info)
            total_size += file_stat.st_size
    
    total_size_gb = round(total_size / (1024**3), 2)
    
    return {
        "total_files": len(files_info),
        "total_size_gb": total_size_gb,
        "files": files_info[-20:],  # Последние 20 файлов
        "retention_policy": state.retention_days
    }

@app.delete("/api/storage/file/{filename}")
async def delete_file(filename: str):
    """Удаление конкретного файла записи"""
    try:
        # Безопасность: проверяем что файл находится в recordings директории
        file_path = Path("recordings") / filename
        
        if not file_path.exists():
            return {"status": "error", "message": "File not found"}
        
        # Проверяем что это .avi файл
        if file_path.suffix != ".avi":
            return {"status": "error", "message": "Invalid file type"}
        
        file_size = file_path.stat().st_size
        file_path.unlink()
        
        freed_space_gb = round(file_size / (1024**3), 2)
        state.add_storage_log(f"Файл удален вручную: {filename}")
        
        return {
            "status": "success",
            "message": f"File {filename} deleted",
            "freed_space_gb": freed_space_gb
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Создаем HTML файл для админ панели при запуске
def create_admin_html():
    """Создание HTML файла админ панели"""
    admin_html = """
    <!DOCTYPE html>
    <html lang="ru">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Панель управления видеонаблюдением</title>
        <style>
            /* ... (вставьте полный CSS стиль из предыдущего ответа) ... */
        </style>
    </head>
    <body>
        <div class="container">
            <!-- ... (вставьте полную HTML структуру из предыдущего ответа) ... -->
        </div>
        <script>
            // ... (вставьте полный JavaScript код из предыдущего ответа) ... 
        </script>
    </body>
    </html>
    """
    
    # Сохраняем файл
    templates_dir = Path("templates")
    templates_dir.mkdir(exist_ok=True)
    
    with open(templates_dir / "admin.html", "w", encoding="utf-8") as f:
        f.write(admin_html)
    
    logger.info("Admin HTML template created")

if __name__ == "__main__":
    # Создаем HTML шаблон при запуске
    
    
    # Создаем запись о запуске системы
    state.add_system_log("Система видеонаблюдения запущена")
    
    print("\n" + "="*60)
    print("MacBook Camera Surveillance System")
    print("="*60)
    print("Административная панель: http://localhost:8000/admin")
    print("Прямая трансляция:       http://localhost:8000/")
    print("API документация:        http://localhost:8000/docs")
    print("="*60 + "\n")
    
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")