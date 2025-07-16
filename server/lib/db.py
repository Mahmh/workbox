from supabase import AsyncClient, acreate_client
from lib.constants import (
    SUPABASE_PROJECT_URL,
    SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY,
)

_supabase: AsyncClient
_supabase_admin: AsyncClient


async def get_supabase() -> AsyncClient:
    global _supabase
    if "_supabase" not in globals():
        _supabase = await acreate_client(SUPABASE_PROJECT_URL, SUPABASE_PUBLISHABLE_KEY)
    return _supabase


async def get_supabase_admin() -> AsyncClient:
    global _supabase_admin
    if "_supabase_admin" not in globals():
        _supabase_admin = await acreate_client(SUPABASE_PROJECT_URL, SUPABASE_SECRET_KEY)
    return _supabase_admin
