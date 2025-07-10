from typing import List
from pydantic import BaseModel

class UserInput(BaseModel):
    grade: int
    curriculum: str
    topics: List[str]

class File(BaseModel):
    filename: str
    link: str