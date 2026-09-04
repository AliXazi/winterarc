from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_session
from app.models import User, WinterArcState

router = APIRouter(prefix="/admin", tags=["admin"])

ADMIN_EMAIL = "mohammedxazi@gmail.com"

def require_admin(request: Request):
    email = (request.session.get("user_email") or "").lower().strip()
    if email != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=403, detail=f"Admin only. Sign in with {ADMIN_EMAIL} at /auth/google")

@router.get("", response_class=HTMLResponse)
async def admin_home(request: Request, session: AsyncSession = Depends(get_session)):
    try:
        require_admin(request)
    except HTTPException as e:
        return HTMLResponse(f"""
        <html style="font-family:system-ui;padding:40px;max-width:640px;margin:auto;background:#000;color:#fff">
        <h2 style="color:#fff">Admin — Access Denied</h2>
        <p>Sign in with <b>{ADMIN_EMAIL}</b> to view stats.</p>
        <p>Current session: <code>{request.session.get('user_email') or 'not signed in'}</code></p>
        <p><a href="/auth/google" style="color:#fff;border:1px solid #fff;padding:8px 14px;text-decoration:none">Sign in with Google</a> <a href="/" style="color:#999;margin-left:12px">← Back</a></p>
        <p style="color:#666;font-size:12px;margin-top:24px">webmayhemx@gmail.com is the public contact (FAQ/Privacy). Admin is {ADMIN_EMAIL} only.</p>
        </html>
        """, status_code=403)
    # fetch counts
    total_users = (await session.execute(select(func.count()).select_from(User))).scalar() or 0
    google_users = (await session.execute(select(func.count()).select_from(User).where(User.google_sub.is_not(None)))).scalar() or 0
    total_states = (await session.execute(select(func.count()).select_from(WinterArcState))).scalar() or 0
    recent = (await session.execute(select(User.email, User.name, User.created_at, User.google_sub).order_by(User.created_at.desc()).limit(50))).all()
    rows = "".join(f"<tr><td style='padding:6px 8px;border:1px solid #262626'>{e}</td><td style='padding:6px 8px;border:1px solid #262626'>{n or ''}</td><td style='padding:6px 8px;border:1px solid #262626;font-size:11px'>{str(c)[:19]}</td><td style='padding:6px 8px;border:1px solid #262626;font-size:10px'>{ 'Google' if s else 'Dev' }</td></tr>" for e,n,c,s in recent)
    return HTMLResponse(f"""
    <html style="font-family:JetBrains Mono,monospace;padding:20px;max-width:960px;margin:auto;background:#000;color:#fff">
    <head><title>Admin — Winter Arc</title></head>
    <body>
    <p><a href="/" style="color:#999;text-decoration:none">← Back to Protocol</a> <span style="color:#666">|</span> <a href="/admin/stats" style="color:#fff">JSON</a></p>
    <h1 style="font-family:Saira Condensed,sans-serif;letter-spacing:3px">ADMIN — WINTER ARC</h1>
    <p style="color:#999;font-size:11px;letter-spacing:2px;text-transform:uppercase">Signed in as {ADMIN_EMAIL} • {total_users} users total</p>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:16px 0">
      <div style="border:1px solid #262626;padding:16px;text-align:center"><div style="font-size:28px">{total_users}</div><div style="color:#999;font-size:10px;letter-spacing:1px">TOTAL GOOGLE LOGINS</div></div>
      <div style="border:1px solid #262626;padding:16px;text-align:center"><div style="font-size:28px">{google_users}</div><div style="color:#999;font-size:10px;letter-spacing:1px">GOOGLE VERIFIED</div></div>
      <div style="border:1px solid #262626;padding:16px;text-align:center"><div style="font-size:28px">{total_states}</div><div style="color:#999;font-size:10px;letter-spacing:1px">INITIALIZED ARCS</div></div>
    </div>
    <h3 style="font-family:Saira Condensed,sans-serif;letter-spacing:1px;margin-top:24px">Recent users (latest 50)</h3>
    <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
      <tr style="background:#141414;color:#999"><th style="padding:6px 8px;border:1px solid #262626;text-align:left">EMAIL</th><th style="padding:6px 8px;border:1px solid #262626">NAME</th><th style="padding:6px 8px;border:1px solid #262626">CREATED</th><th style="padding:6px 8px;border:1px solid #262626">TYPE</th></tr>
      {rows or '<tr><td colspan=4 style="padding:12px;color:#666;text-align:center">No users yet</td></tr>'}
    </table>
    <p style="color:#666;font-size:11px;margin-top:16px">Public contact remains webmayhemx@gmail.com (FAQ/Privacy). This admin page is {ADMIN_EMAIL} only.</p>
    <p><a href="/auth/logout" style="color:#999;font-size:11px">Log out</a></p>
    </body></html>
    """)

@router.get("/stats")
async def admin_stats(request: Request, session: AsyncSession = Depends(get_session)):
    require_admin(request)
    total_users = (await session.execute(select(func.count()).select_from(User))).scalar() or 0
    google_users = (await session.execute(select(func.count()).select_from(User).where(User.google_sub.is_not(None)))).scalar() or 0
    total_states = (await session.execute(select(func.count()).select_from(WinterArcState))).scalar() or 0
    recent = (await session.execute(select(User.email, User.name, User.created_at).order_by(User.created_at.desc()).limit(20))).all()
    return JSONResponse({
        "total_users": total_users,
        "google_users": google_users,
        "initialized_arcs": total_states,
        "admin": ADMIN_EMAIL,
        "recent": [{"email": e, "name": n, "created_at": str(c)} for e,n,c in recent]
    })
