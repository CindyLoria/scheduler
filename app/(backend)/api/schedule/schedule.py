from fastapi import APIRouter, HTTPException
from app.backend.genetic.scheduler import genetic_schedule  # Import fungsi genetic_schedule dari scheduler.py

router = APIRouter()

@router.post("/generate")
async def generate_schedule(data: dict):
    """
    Endpoint untuk menghasilkan jadwal menggunakan algoritma genetika.
    Data input harus mengandung scheduleDays, scheduleSessions, rooms, dan classLecturers.
    """
    try:
        # Panggil fungsi genetic_schedule dengan data yang dikirimkan dari frontend
        result = genetic_schedule(data)
        return {"status": "success", "data": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Terjadi kesalahan: {str(e)}")
