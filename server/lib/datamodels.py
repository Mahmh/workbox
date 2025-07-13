from typing import TypeAlias
from pydantic import BaseModel

class UserInput(BaseModel):
    grade: int
    curriculum: str
    topics: list[str]

class File(BaseModel):
    filename: str
    link: str

Folders: TypeAlias = dict[str, list[File]]