import datetime as dt
from pydantic import BaseModel, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str

    class Config:
        from_attributes = True


class DocumentOut(BaseModel):
    id: int
    filename: str
    file_type: str
    num_chunks: int
    status: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


class ConversationOut(BaseModel):
    id: int
    title: str
    created_at: dt.datetime

    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    id: int
    role: str
    content: str
    citations: str | None = None
    created_at: dt.datetime

    class Config:
        from_attributes = True


class ChatRequest(BaseModel):
    conversation_id: int | None = None
    message: str
    top_k: int = 5
