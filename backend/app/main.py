import os
import json
import shutil
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import init_db, get_db, User, Document, Conversation, Message
from app.auth import hash_password, verify_password, create_access_token, get_current_user
from app.schemas import (
    UserCreate, UserLogin, Token, UserOut, DocumentOut,
    ConversationOut, MessageOut, ChatRequest,
)
from app.rag_engine import process_document, retrieve, generate_answer, delete_document_from_index

STORAGE_DIR = os.getenv("STORAGE_DIR", "./storage")
os.makedirs(STORAGE_DIR, exist_ok=True)

app = FastAPI(title="Neuralix RAG", description="AI Document Q&A Platform by Neuralix Labs")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten this to your frontend domain in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


# ---------- Auth ----------

@app.post("/auth/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=payload.email, hashed_password=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@app.post("/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.id)})
    return Token(access_token=token)


@app.get("/auth/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


# ---------- Documents ----------

ALLOWED_EXTENSIONS = {"pdf": "pdf", "docx": "docx", "txt": "txt"}


@app.post("/documents/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, and TXT files are supported")

    user_upload_dir = os.path.join(STORAGE_DIR, f"user_{current_user.id}", "uploads")
    os.makedirs(user_upload_dir, exist_ok=True)
    file_path = os.path.join(user_upload_dir, file.filename)

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = Document(
        owner_id=current_user.id,
        filename=file.filename,
        file_type=ALLOWED_EXTENSIONS[ext],
        status="processing",
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    try:
        num_chunks = process_document(current_user.id, doc.id, file_path, doc.file_type, doc.filename)
        doc.num_chunks = num_chunks
        doc.status = "ready"
    except Exception as e:
        doc.status = "failed"
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process document: {e}")

    db.commit()
    db.refresh(doc)
    return doc


@app.get("/documents", response_model=list[DocumentOut])
def list_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Document).filter(Document.owner_id == current_user.id).order_by(Document.created_at.desc()).all()


@app.delete("/documents/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_document(document_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    doc = db.query(Document).filter(Document.id == document_id, Document.owner_id == current_user.id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    delete_document_from_index(current_user.id, document_id)
    db.delete(doc)
    db.commit()
    return None


# ---------- Conversations ----------

@app.get("/conversations", response_model=list[ConversationOut])
def list_conversations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return (
        db.query(Conversation)
        .filter(Conversation.owner_id == current_user.id)
        .order_by(Conversation.created_at.desc())
        .all()
    )


@app.get("/conversations/{conversation_id}/messages", response_model=list[MessageOut])
def get_messages(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.query(Conversation).filter(
        Conversation.id == conversation_id, Conversation.owner_id == current_user.id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return convo.messages


@app.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_conversation(conversation_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    convo = db.query(Conversation).filter(
        Conversation.id == conversation_id, Conversation.owner_id == current_user.id
    ).first()
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    db.delete(convo)
    db.commit()
    return None


# ---------- Chat / RAG ----------

@app.post("/chat")
def chat(payload: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if payload.conversation_id:
        convo = db.query(Conversation).filter(
            Conversation.id == payload.conversation_id, Conversation.owner_id == current_user.id
        ).first()
        if not convo:
            raise HTTPException(status_code=404, detail="Conversation not found")
    else:
        title = payload.message[:50] + ("..." if len(payload.message) > 50 else "")
        convo = Conversation(owner_id=current_user.id, title=title)
        db.add(convo)
        db.commit()
        db.refresh(convo)

    history = [{"role": m.role, "content": m.content} for m in convo.messages]

    user_msg = Message(conversation_id=convo.id, role="user", content=payload.message)
    db.add(user_msg)
    db.commit()

    context_chunks = retrieve(current_user.id, payload.message, top_k=payload.top_k)
    result = generate_answer(payload.message, context_chunks, history)

    assistant_msg = Message(
        conversation_id=convo.id,
        role="assistant",
        content=result["answer"],
        citations=json.dumps(result["citations"]),
    )
    db.add(assistant_msg)
    db.commit()
    db.refresh(assistant_msg)

    return {
        "conversation_id": convo.id,
        "answer": result["answer"],
        "citations": result["citations"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "Neuralix RAG"}
