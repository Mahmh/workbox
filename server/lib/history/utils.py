from lib.types import HistoryRecordDict
from lib.db import get_supabase


async def get_saved_records(user_id: str) -> list[HistoryRecordDict]:
    """Retrieve all history records for a given user, ordered by creation time desc."""
    client = await get_supabase()
    res = await (
        client.table("history")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


async def save_record(record: HistoryRecordDict) -> HistoryRecordDict:
    """Insert a new history record and return the created row."""
    client = await get_supabase()

    HistoryRecordDict.validate_input(record)
    record["input"] = record["input"].model_dump()

    res = await client.table("history").insert(record).execute()
    return res.data


async def rename_saved_record(
    history_id: str, user_id: str, new_name: str
) -> HistoryRecordDict:
    """Rename the 'name' field of a specific history record and return the updated row."""
    client = await get_supabase()
    res = await (
        client.table("history")
        .update({"name": new_name})
        .eq("id", history_id)
        .eq("user_id", user_id)
        .execute()
    )
    return res.data


async def delete_saved_record(history_id: str, user_id: str) -> None:
    """Delete a specific history record for a user."""
    client = await get_supabase()
    res = await (
        client.table("history")
        .delete()
        .eq("id", history_id)
        .eq("user_id", user_id)
        .execute()
    )
    if not res.data:
        raise ValueError(f"History record {history_id} not found for user {user_id}")
