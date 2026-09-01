import json
from fastapi import APIRouter, Request, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_session
from app.models import User, WinterArcState

router = APIRouter(prefix="/api", tags=["api"])

DEFAULT_DATA = [
  {"id":"h1","cat":"Health Infrastructure","color":"#00D4FF","tasks":[
    {"id":"t1","title":"Hydration","desc":"Drink 3–4 liters of water.", "stat":"hydration"},
    {"id":"t2","title":"Nutrition","desc":"Hit 2500-calorie and strict protein targets.", "stat":"nutrition"},
    {"id":"t3","title":"Training","desc":"Complete heavy lifting session (track progressive overload).", "stat":"training"},
    {"id":"t4","title":"Recovery","desc":"Sleep 7–8 hours.", "stat":"recovery"},
  ]},
  {"id":"h2","cat":"Skill Development","color":"#A855F7","tasks":[
    {"id":"t5","title":"Deep Work","desc":"45 minutes of focused skill acquisition — Coding / Editing / Design.", "stat":"deepWork"},
    {"id":"t6","title":"Discipline","desc":"Leisure / Entertainment strictly capped at 1–2 hours.", "stat":"discipline"},
  ]},
  {"id":"h3","cat":"Academic Prep","color":"#22C55E","tasks":[
    {"id":"t7","title":"Core Reading","desc":"Read 10–15 pages of primary texts.", "stat":"reading"},
    {"id":"t8","title":"Active Recall","desc":"20–30 minutes of spaced repetition / flashcards.", "stat":"activeRecall"},
  ]},
]

DEFAULT_STATS = {"hydration":5,"nutrition":5,"training":5,"recovery":5,"deepWork":5,"discipline":5,"reading":5,"activeRecall":5}
STAT_KEYS = ["hydration","nutrition","training","recovery","deepWork","discipline","reading","activeRecall"]
STAT_LABELS = ["Hydration","Nutrition","Training","Recovery","Deep Work","Discipline","Reading","Active Recall"]
DEFAULT_ARC_DAYS = 90

def get_user_id(request: Request) -> int | None:
    return request.session.get("user_id")

@router.get("/winterarc")
async def get_winterarc(request: Request, session: AsyncSession = Depends(get_session)):
    uid = get_user_id(request)
    if not uid:
        return JSONResponse({"authenticated": False, "data": DEFAULT_DATA, "checks": {}, "stats": None, "streak": 0, "last_100_date": None, "arc_start_date": None, "arc_days": DEFAULT_ARC_DAYS}, status_code=401)
    result = await session.execute(select(WinterArcState).where(WinterArcState.user_id == uid))
    state = result.scalar_one_or_none()
    if not state:
        state = WinterArcState(user_id=uid, data_json=json.dumps(DEFAULT_DATA), checks_json=json.dumps({}), stats_json=json.dumps({}), streak=0, last_100_date=None, arc_start_date=None, arc_days=DEFAULT_ARC_DAYS)
        session.add(state)
        await session.commit()
        await session.refresh(state)
    try:
        data = json.loads(state.data_json) if state.data_json else DEFAULT_DATA
        checks = json.loads(state.checks_json) if state.checks_json else {}
        stats = json.loads(state.stats_json) if state.stats_json and state.stats_json != "{}" else None
        # ensure all keys present if stats exists
        if stats:
            for k in STAT_KEYS:
                if k not in stats: stats[k] = 5
    except:
        data = DEFAULT_DATA
        checks = {}
        stats = None
    # arc_start_date: prefer column, fallback to stats._arc_start for legacy
    arc_start = getattr(state, 'arc_start_date', None)
    if not arc_start and stats and isinstance(stats, dict) and stats.get('_arc_start'):
        arc_start = stats.get('_arc_start')
    # arc_days: column or stats._arc_days or default 90
    arc_days = getattr(state, 'arc_days', None)
    if (not arc_days or arc_days == 0) and stats and isinstance(stats, dict) and stats.get('_arc_days'):
        try: arc_days = int(stats.get('_arc_days'))
        except: arc_days = DEFAULT_ARC_DAYS
    if not arc_days or arc_days == 0:
        arc_days = DEFAULT_ARC_DAYS
    return {"authenticated": True, "data": data, "checks": checks, "stats": stats, "streak": state.streak or 0, "last_100_date": state.last_100_date, "arc_start_date": arc_start, "arc_days": arc_days}

@router.put("/winterarc")
async def put_winterarc(request: Request, payload: dict, session: AsyncSession = Depends(get_session)):
    uid = get_user_id(request)
    if not uid:
        return JSONResponse({"error":"Not authenticated","authenticated":False}, status_code=401)
    data = payload.get("data")
    checks = payload.get("checks")
    stats = payload.get("stats")
    streak = payload.get("streak")
    last_100_date = payload.get("last_100_date")
    arc_start_date = payload.get("arc_start_date")
    arc_days = payload.get("arc_days")
    # fallback: stats._arc_start / _arc_days legacy
    if arc_start_date is None and isinstance(stats, dict) and stats.get('_arc_start'):
        arc_start_date = stats.get('_arc_start')
    if arc_days is None and isinstance(stats, dict) and stats.get('_arc_days'):
        try: arc_days = int(stats.get('_arc_days'))
        except: pass
    if data is None or checks is None:
        return JSONResponse({"error":"Missing data/checks"}, status_code=400)
    try:
        data_json = json.dumps(data)
        checks_json = json.dumps(checks)
        stats_json = json.dumps(stats) if stats is not None else None
    except Exception as e:
        return JSONResponse({"error":f"Invalid JSON: {e}"}, status_code=400)
    result = await session.execute(select(WinterArcState).where(WinterArcState.user_id == uid))
    state = result.scalar_one_or_none()
    # normalize arc_days to int 7-365 or default 90
    if arc_days is not None:
        try:
            arc_days = int(arc_days)
            if arc_days < 7: arc_days = 7
            if arc_days > 365: arc_days = 365
        except:
            arc_days = None
    if not state:
        state = WinterArcState(user_id=uid, data_json=data_json, checks_json=checks_json, stats_json=stats_json or json.dumps({}), streak=streak or 0, last_100_date=last_100_date, arc_start_date=arc_start_date, arc_days=arc_days or DEFAULT_ARC_DAYS)
        session.add(state)
    else:
        state.data_json = data_json
        state.checks_json = checks_json
        if stats_json is not None:
            state.stats_json = stats_json
        if streak is not None:
            try: state.streak = int(streak)
            except: pass
        if last_100_date is not None:
            state.last_100_date = last_100_date
        # allow explicit null to clear?
        if last_100_date is None and payload.get("last_100_date") is None and "last_100_date" in payload:
            state.last_100_date = None
        if arc_start_date is not None:
            state.arc_start_date = arc_start_date
        if arc_start_date is None and "arc_start_date" in payload and payload.get("arc_start_date") is None:
            state.arc_start_date = None
        if arc_days is not None:
            state.arc_days = arc_days
    await session.commit()
    return {"ok": True}

@router.get("/me")
async def api_me(request: Request, session: AsyncSession = Depends(get_session)):
    uid = get_user_id(request)
    if not uid:
        return {"authenticated": False}
    result = await session.execute(select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        return {"authenticated": False}
    return {"authenticated": True, "email": user.email, "name": user.name, "picture": user.picture}
