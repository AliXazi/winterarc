import os
from fastapi import APIRouter, Request, Depends
from fastapi.responses import RedirectResponse, HTMLResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config

from app.database import get_session
from app.models import User

router = APIRouter(prefix="/auth", tags=["auth"])

# OAuth setup — requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET env vars
# For local dev, create credentials at https://console.cloud.google.com/apis/credentials
# and set env or create .env file. If not set, /auth/google will show setup instructions.

config = Config('.env')
oauth = OAuth(config)
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'},
)

@router.get("/google")
async def google_login(request: Request):
    client_id = os.getenv("GOOGLE_CLIENT_ID") or config.get("GOOGLE_CLIENT_ID", default=None)
    if not client_id:
        # No credentials — return helpful HTML instead of crashing
        return HTMLResponse("""
        <html style="font-family:system-ui;padding:40px;max-width:640px;margin:auto">
        <h2>Google OAuth not configured</h2>
        <p>To enable cloud save, create a Google OAuth 2.0 Client ID at <a href="https://console.cloud.google.com/apis/credentials" target="_blank">console.cloud.google.com</a></p>
        <ol>
          <li>Create project → Credentials → Create OAuth client → Web application</li>
          <li>Add authorized redirect URI: <code>http://127.0.0.1:8000/auth/google/callback</code></li>
          <li>Set env vars: <code>GOOGLE_CLIENT_ID</code> and <code>GOOGLE_CLIENT_SECRET</code></li>
          <li>Or create <code>.env</code> in project root with:<br><code>GOOGLE_CLIENT_ID=xxx<br>GOOGLE_CLIENT_SECRET=yyy</code></li>
        </ol>
        <p>For testing without Google, use <a href="/auth/dev-login">Dev Login (no Google)</a> — still cloud-synced per email.</p>
        <p><a href="/arc">← Back to Winter Arc</a></p>
        </html>
        """, status_code=400)
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, str(redirect_uri))

@router.get("/google/callback", name="google_callback")
async def google_callback(request: Request, session: AsyncSession = Depends(get_session)):
    try:
        token = await oauth.google.authorize_access_token(request)
        userinfo = token.get('userinfo') or await oauth.google.parse_id_token(request, token)
    except Exception as e:
        return HTMLResponse(f"<h3>OAuth failed</h3><pre>{e}</pre><p><a href='/arc'>Back</a></p>", status_code=400)
    email = userinfo.get('email')
    name = userinfo.get('name')
    picture = userinfo.get('picture')
    sub = userinfo.get('sub')
    if not email:
        return HTMLResponse("No email from Google", status_code=400)
    # upsert user
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=email, name=name, picture=picture, google_sub=sub)
        session.add(user)
        await session.commit()
        await session.refresh(user)
    else:
        # update profile
        user.name = name or user.name
        user.picture = picture or user.picture
        user.google_sub = sub or user.google_sub
        await session.commit()
    request.session["user_id"] = user.id
    request.session["user_email"] = user.email
    return RedirectResponse(url="/arc", status_code=303)

@router.get("/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url="/arc", status_code=303)

@router.get("/dev-login")
async def dev_login(request: Request, session: AsyncSession = Depends(get_session)):
    """Dev login without Google — for testing cloud save when GOOGLE_CLIENT_ID not set.
       Usage: /auth/dev-login?email=test@example.com
       If no email param, shows form.
    """
    email = request.query_params.get("email")
    if not email:
        return HTMLResponse("""
        <html style="font-family:system-ui;padding:40px;max-width:520px;margin:auto">
        <h2>Dev Login (no Google required)</h2>
        <p>Enter any email to simulate Google login — progress will be saved to cloud per email, not on device.</p>
        <form method="get" action="/auth/dev-login">
          <input name="email" type="email" required placeholder="you@example.com" style="width:100%;padding:10px;border:1px solid #ccc;border-radius:8px"/>
          <button type="submit" style="margin-top:12px;width:100%;padding:10px;background:#111;color:white;border-radius:8px">Continue</button>
        </form>
        <p style="margin-top:16px"><a href="/arc">← Back</a></p>
        </html>
        """)
    email = email.strip().lower()
    result = await session.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()
    if not user:
        user = User(email=email, name=email.split("@")[0])
        session.add(user)
        await session.commit()
        await session.refresh(user)
    request.session["user_id"] = user.id
    request.session["user_email"] = user.email
    return RedirectResponse(url="/arc", status_code=303)

@router.get("/me")
async def me(request: Request, session: AsyncSession = Depends(get_session)):
    uid = request.session.get("user_id")
    if not uid:
        return {"authenticated": False}
    from sqlalchemy import select as _select
    result = await session.execute(_select(User).where(User.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        return {"authenticated": False}
    return {"authenticated": True, "email": user.email, "name": user.name, "picture": user.picture}
