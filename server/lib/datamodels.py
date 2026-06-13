from typing import Optional, Literal
from gotrue import User, Session
from pydantic import BaseModel


class Credentials(BaseModel):
    email: str
    password: str


class LoggedInSession(BaseModel):
    user: dict
    session: Optional[dict] = None
    message: Optional[str] = None


class ProfileUpdate(BaseModel):
    email: str


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class AccountUpdateResult(BaseModel):
    message: str
    user: Optional[dict] = None


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
