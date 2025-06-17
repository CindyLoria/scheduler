from fastapi import APIRouter, HTTPException, Request
from genetic_scheduler import generate_schedule

router = APIRouter()

@router.post("/generate-schedule")
async def get_schedule(request: Request):
    try:
        data = await request.json()
        result = generate_schedule(data)
        return {"schedule": result["schedule"], "fitness": result["fitness"]}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))