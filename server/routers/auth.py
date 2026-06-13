from fastapi import APIRouter, Depends, status
from gotrue import User
from lib.logger import endpoint
from lib.types import APIError
from lib.auth import utils
from lib.datamodels import (
    AccountUpdateResult,
    Credentials,
    LoggedInSession,
    PasswordChange,
    ProfileUpdate,
)

router = APIRouter(prefix="/auth")


@router.post("/login")
@endpoint
async def login(cred: Credentials) -> LoggedInSession | APIError:
    return await utils.login(cred)


@router.post("/signup")
@endpoint
async def signup(cred: Credentials) -> LoggedInSession | APIError:
    return await utils.signup(cred)


@router.put("/profile")
@endpoint
async def update_profile(
    profile: ProfileUpdate, current_user: User = Depends(utils.get_current_user)
) -> AccountUpdateResult | APIError:
    return await utils.update_profile(current_user.id, profile)


@router.put("/password")
@endpoint
async def change_password(
    password_change: PasswordChange, current_user: User = Depends(utils.get_current_user)
) -> AccountUpdateResult | APIError:
    return await utils.change_password(current_user.id, password_change)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
@endpoint
async def delete_my_account(current_user: User = Depends(utils.get_current_user)):
    return await utils.delete_account(current_user.id)
