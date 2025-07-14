from typing import TypeAlias
from pydantic import BaseModel

class StructuredForm(BaseModel):
    curriculum: str
    grade: int
    subject: str
    topics: list[str]

class File(BaseModel):
    filename: str
    link: str

Folders: TypeAlias = dict[str, list[File]]