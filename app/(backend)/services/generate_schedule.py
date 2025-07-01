# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from app.api.model.model import genetic_schedule  # Import fungsi genetic_schedule dari model.py

# app = FastAPI()

# class ScheduleData(BaseModel):
#     scheduleDays: list
#     scheduleSessions: list
#     rooms: list
#     classLecturers: list

# @app.post("/generate_schedule/")
# async def create_schedule(data: ScheduleData):
#     try:
#         # Mengonversi data input menjadi dictionary
#         schedule_data = data.dict()
        
#         # Menjalankan algoritma genetika untuk menghasilkan jadwal
#         schedule = genetic_schedule(schedule_data)
#         return {"schedule": schedule}
#     except Exception as e:
#         raise HTTPException(status_code=500, detail="Error generating schedule: " + str(e))

# from fastapi import APIRouter, HTTPException, Request
# from typing import Dict
# from .genetic_scheduler import generate_schedule
# import time

# router = APIRouter()

# @router.post("/generate-schedule")
# async def get_schedule(request: Request):
#     start_time = time.time()
#     try:
#         data = await request.json()
#         print("Received data:", data)  # Debug log
        
#         result = generate_schedule(data)
#         end_time = time.time()  # Catat waktu selesai
#         execution_time = end_time - start_time  # Hitung durasi

#         return {"schedule": result["schedule"], "fitness": result["fitness"], "execution_time": execution_time}
#     except Exception as e:
#         print("Error:", str(e))  # Debug log
#         raise HTTPException(status_code=400, detail=str(e))

# @router.post("/generate-schedule")
# async def generate_schedule_route(request: Request):
#     try:
#         data = await request.json()
#         result = generate_schedule(data)
#         return {
#             "status": "success",
#             "data": {
#                 "schedule": result["schedule"],
#                 "fitness": result["fitness"]
#             }
#         }
#     except HTTPException as he:
#         raise he
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))
    
# from fastapi import APIRouter, HTTPException, Request
# from typing import Dict
# from .genetic_scheduler import generate_schedule

# router = APIRouter()

# @router.post("/generate-schedule")
# async def get_schedule(request: Request):
#     try:
#         data = await request.json()
#         print("Received data:", data)  # Debug log

#         result = generate_schedule(data)
#         return {"schedule": result["schedule"], "fitness": result["fitness"]}
#     except Exception as e:
#         print("Error:", str(e))  # Debug log
#         raise HTTPException(status_code=400, detail=str(e))

from fastapi import APIRouter, HTTPException, Request
from typing import Dict
from .genetic_scheduler import generate_schedule

router = APIRouter()

@router.post("/generate-schedule")
async def get_schedule(request: Request):
    try:
        data = await request.json()
        print("Received data:", data)  # Debug log

        result = generate_schedule(data)
        return {"schedule": result["schedule"], "fitness": result["fitness"]}
    except Exception as e:
        print("Error:", str(e))  # Debug log
        raise HTTPException(status_code=400, detail=str(e))
