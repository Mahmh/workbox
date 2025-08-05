from fastapi import APIRouter, Depends, Body, status, HTTPException
from gotrue import User
from lib.logger import endpoint, errlog, log
from lib.types import HistoryRecordDict
from lib.history import utils
from lib.auth.utils import get_current_user
import json, traceback

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
    try:
        log(f"Received record type: {type(record)}", "history", "DEBUG")
        log(f"Received record: {record}", "history", "DEBUG")

        # Ensure user_id is set
        if isinstance(record, dict):
            record["user_id"] = current_user.id
        else:
            # If it's a Pydantic model, create a dict copy
            record_dict = (
                record.model_dump() if hasattr(record, "model_dump") else dict(record)
            )
            record_dict["user_id"] = current_user.id
            record = record_dict

        log(
            f"Record after user_id assignment: {json.dumps(record, indent=2, default=str)}",
            "history",
            "DEBUG",
        )

        result = await utils.save_record(record)
        return result

    except Exception as e:
        errlog("save_record", e, "history")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Failed to save record: {str(e)}")


@router.put("")
@endpoint
async def rename_saved_record(
    history_id: str = Body(..., embed=True),
    new_name: str = Body(..., embed=True),
    current_user: User = Depends(get_current_user),
) -> HistoryRecordDict:
    try:
        return await utils.rename_saved_record(history_id, current_user.id, new_name)
    except Exception as e:
        errlog("rename_saved_record", e, "history")
        raise HTTPException(
            status_code=500, detail=f"Failed to rename record: {str(e)}"
        )


@router.delete("", status_code=status.HTTP_204_NO_CONTENT)
@endpoint
async def delete_saved_record(
    history_id: str, current_user: User = Depends(get_current_user)
):
    try:
        await utils.delete_saved_record(history_id, current_user.id)
    except Exception as e:
        errlog("delete_saved_record", e, "history")
        raise HTTPException(
            status_code=500, detail=f"Failed to delete record: {str(e)}"
        )
