from typing import Optional, Literal
from gotrue import User, Session
from pydantic import BaseModel


class Credentials(BaseModel):
    email: str
    password: str


class LoggedInSession(BaseModel):
    user: User
    session: Optional[Session] = None
    message: Optional[str] = None


class StructuredForm(BaseModel):
    curriculum: str
    grade: int
    subject: str
    topics: list[str]


class CustomFileTypes(BaseModel):
    webpages: bool = False
    documents: bool = False
    images: bool = False
    videos: bool = False


class File(BaseModel):
    filename: str
    link: str
    type: Literal["webpage", "document", "image", "video"]
