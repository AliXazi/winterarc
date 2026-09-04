from fastapi import FastAPI
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.gzip import GZipMiddleware
from pathlib import Path
from contextlib import asynccontextmanager
import os

from app.database import init_db

BASE_DIR = Path(__file__).resolve().parent.parent

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(title="WINTERARC — Protocol", lifespan=lifespan)

# perf: gzip html/js
app.add_middleware(GZipMiddleware, minimum_size=500)
# session needed for Google OAuth — secret should be env in prod
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "winterarc-dev-secret-change-in-prod"), max_age=60*60*24*30)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")

# routers
from app.routers import auth as auth_router
from app.routers import api as api_router
app.include_router(auth_router.router)
app.include_router(api_router.router)

@app.get("/", response_class=HTMLResponse)
async def root():
    return FileResponse(str(BASE_DIR / "winter_arc.html"), headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache"})

@app.get("/arc", response_class=HTMLResponse)
async def arc():
    return FileResponse(str(BASE_DIR / "winter_arc.html"), headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache"})

@app.get("/winter-arc", response_class=HTMLResponse)
async def winter_arc():
    return FileResponse(str(BASE_DIR / "winter_arc.html"), headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0", "Pragma": "no-cache"})

@app.get("/terms", response_class=HTMLResponse)
async def terms():
    return FileResponse(str(BASE_DIR / "templates" / "terms.html"), headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

@app.get("/privacy", response_class=HTMLResponse)
async def privacy():
    return FileResponse(str(BASE_DIR / "templates" / "privacy.html"), headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

@app.get("/faq", response_class=HTMLResponse)
async def faq():
    return FileResponse(str(BASE_DIR / "templates" / "faq.html"), headers={"Cache-Control": "no-store, no-cache, must-revalidate, max-age=0"})

@app.get("/sitemap.xml")
async def sitemap():
    return FileResponse(str(BASE_DIR / "sitemap.xml"), media_type="application/xml")

@app.get("/robots.txt")
async def robots():
    return FileResponse(str(BASE_DIR / "robots.txt"), media_type="text/plain")

@app.get("/health")
async def health():
    return {"status": "ok", "app": "WINTERARC", "mode": "winter-arc-cloud"}
