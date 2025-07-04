from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.generate_schedule import router as generate_router

app = FastAPI()

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello from FastAPI running on Railway!"}
