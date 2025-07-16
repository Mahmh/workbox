from fastapi import APIRouter, Depends, status
from gotrue import User
from lib.account import utils
from lib.datamodels import Credentials, LoggedInSession

router = APIRouter(prefix="/account")


@router.post("/login")
async def login(cred: Credentials) -> LoggedInSession:
    return await utils.login(cred)


@router.post("/signup")
async def signup(cred: Credentials) -> LoggedInSession:
    return await utils.signup(cred)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
async def delete_my_account(current_user: User = Depends(utils.get_current_user)):
    return await utils.delete_account(current_user.id)
