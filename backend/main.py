from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import auth, knowledge, chat, analytics
from models.database import Base, engine
import os
import traceback
from fastapi.responses import PlainTextResponse

# Create local_data directory if it doesn't exist
os.makedirs("local_data", exist_ok=True)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CampusPilot API")

@app.middleware("http")
async def catch_exceptions_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception:
        err = traceback.format_exc()
        print("EXCEPTION CAUGHT:", err)
        return PlainTextResponse(err, status_code=500)

# Allowed frontend origins
origins = [
    "http://localhost:3000",
    "http://192.168.56.1:3000",
    "https://team-alpha-adish.vercel.app",
]

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(knowledge.router, prefix="/api/v1/knowledge", tags=["knowledge"])
app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])

from api import announcements, admin

app.include_router(announcements.router, prefix="/api/v1/announcements", tags=["announcements"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["admin"])

@app.get("/")
def read_root():
    return {"message": "Welcome to CampusPilot API"}
