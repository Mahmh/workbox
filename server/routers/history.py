from fastapi import APIRouter, Depends, Body, status
from gotrue import User
from lib.logger import endpoint
from lib.types import HistoryRecordDict
from lib.history import utils
from lib.account.utils import get_current_user

router = APIRouter(prefix="/history")


@router.get("")
@endpoint
async def get_saved_records(
    current_user: User = Depends(get_current_user),
) -> list[HistoryRecordDict]:
    return await utils.get_saved_records(current_user.id)


@router.post("")
@endpoint
async def save_record(
    record: HistoryRecordDict = Body(...),
    current_user: User = Depends(get_current_user),
) -> HistoryRecordDict:
    record["user_id"] = current_user.id
    return await utils.save_record(record)


@router.put("")
@endpoint
async def rename_saved_record(
    history_id: str = Body(..., embed=True),
    new_name: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
) -> HistoryRecordDict:
    return await utils.rename_saved_record(history_id, current_user.id, new_name)


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
@endpoint
async def delete_saved_record(
    history_id: str, current_user: User = Depends(get_current_user)
):
    await utils.delete_saved_record(history_id, current_user.id)
