from typing import Optional
from fastapi import Header, HTTPException, status
from gotrue import User
from lib.db import get_supabase, get_supabase_admin
from lib.errors import SignupError, LoginError
from lib.datamodels import Credentials, LoggedInSession
from lib.constants import WEB_SERVER_URL


async def signup(cred: Credentials) -> LoggedInSession:
    """
    Create a new user account.
    Returns a dict with 'user' and 'session'.
    """
    client = await get_supabase_admin()

    all_users = await client.auth.admin.list_users(page=1, per_page=1000)
    if any(u.email == cred.email for u in all_users):
        raise SignupError("The email you gave was already registered")

    res = await client.auth.sign_up(
        {
            "email": cred.email,
            "password": cred.password,
            "options": {"email_redirect_to": WEB_SERVER_URL},
        }
    )

    user = res.user
    session = res.session

    if user is None:
        raise SignupError("signup() did not return a user object")

    if session is None:
        return LoggedInSession(
            user=user.model_dump(),
            session=None,
            message="Please check your inbox and confirm your email to complete signup",
        )

    return LoggedInSession(user=user.model_dump(), session=session.model_dump())


async def login(cred: Credentials) -> LoggedInSession:
    """
    Sign in an existing user.
    Returns a dict with 'user' and 'session'.
    """
    client = await get_supabase()
    res = await client.auth.sign_in_with_password(
        {"email": cred.email, "password": cred.password}
    )
    user = res.user
    session = res.session

    if user is None:
        raise LoginError("login() did not return a user object")

    if session is None:
        raise LoginError("login() did not return a session object")

    return LoggedInSession(user=user.model_dump(), session=session.model_dump())


async def delete_account(user_id: str, *, soft: bool = False) -> None:
    """
    Permanently (or softly) delete a user by their `auth.users.id`.
    Requires your Service-Role key in `SUPABASE_SERVICE_ROLE_KEY`.
    """
    client = await get_supabase_admin()
    await client.auth.admin.delete_user(user_id, should_soft_delete=soft)


async def get_current_user(authorization: Optional[str] = Header(None)) -> User:
    """
    FastAPI dependency that extracts and validates a Bearer token from the Authorization header
    and returns the corresponding `User`. Raises 401 if missing, malformed, or invalid/expired.
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Authorization header",
        )

    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid auth scheme",
        )

    res_user = await _get_account(jwt=token)
    if res_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    return res_user


async def _get_account(jwt: Optional[str] = None) -> User:
    """
    Fetches & returns the current user.
    If `jwt` is provided, uses that token; otherwise pulls from local session.
    """
    client = await get_supabase()
    res = await client.auth.get_user(jwt) if jwt else await client.auth.get_user()
    return res.user
