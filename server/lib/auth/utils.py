from typing import Optional
from fastapi import Header, HTTPException, status
from gotrue import User
from lib.db import get_supabase, get_supabase_admin
from lib.errors import SignupError, LoginError
from lib.datamodels import (
    AccountUpdateResult,
    Credentials,
    LoggedInSession,
    PasswordChange,
    ProfileUpdate,
)
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


async def update_profile(user_id: str, profile: ProfileUpdate) -> AccountUpdateResult:
    """Update the authenticated user's profile fields."""
    email = profile.email.strip()
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required",
        )

    if "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is invalid",
        )

    client = await get_supabase_admin()
    res = await client.auth.admin.update_user_by_id(user_id, {"email": email})

    if res.user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update did not return a user object",
        )

    return AccountUpdateResult(
        message="Profile updated successfully",
        user=res.user.model_dump(),
    )


async def change_password(
    user_id: str, password_change: PasswordChange
) -> AccountUpdateResult:
    """Verify the current password and update the authenticated user's password."""
    if len(password_change.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long",
        )

    admin_client = await get_supabase_admin()
    user_res = await admin_client.auth.admin.get_user_by_id(user_id)
    user_email = user_res.user.email if user_res.user else None

    if not user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not find an email address for this account",
        )

    client = await get_supabase()
    try:
        await client.auth.sign_in_with_password(
            {"email": user_email, "password": password_change.current_password}
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Current password is incorrect",
        )

    res = await admin_client.auth.admin.update_user_by_id(
        user_id, {"password": password_change.new_password}
    )

    if res.user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password update did not return a user object",
        )

    return AccountUpdateResult(message="Password changed successfully")


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
