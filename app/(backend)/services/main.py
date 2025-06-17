from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.schedule import router

app = FastAPI()

# Konfigurasi CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Sesuaikan dengan domain frontend Anda
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Tambahkan router
app.include_router(router, prefix="/api")