import uuid
from sqlalchemy import create_engine, Column, String, Enum, Boolean, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.dialects.postgresql import UUID
import enum
from core.config import settings

engine = create_engine(
    settings.DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class UserRole(str, enum.Enum):
    STUDENT = "STUDENT"
    ADMIN = "ADMIN"

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.STUDENT, nullable=False)

class KnowledgeDoc(Base):
    __tablename__ = "knowledge_docs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = Column(String(255), nullable=False)
    uploaded_at = Column(DateTime, default=lambda: __import__('datetime').datetime.utcnow())
    uploaded_by = Column(String(36), nullable=False) # FK to users
    chunks_count = Column(__import__('sqlalchemy').Integer, default=0)
    faqs_count = Column(__import__('sqlalchemy').Integer, default=0)

class TicketPriority(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class ChatSession(Base):
    __tablename__ = "chat_sessions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    student_id = Column(String(36), nullable=False) # FK to users
    started_at = Column(DateTime, default=lambda: __import__('datetime').datetime.utcnow())
    is_escalated = Column(Boolean, default=False)
    escalation_reason = Column(String, nullable=True)
    ai_summary = Column(String, nullable=True)
    priority = Column(Enum(TicketPriority), nullable=True)
    
    # New V2 fields
    department = Column(String, nullable=True)
    category = Column(String, nullable=True)
    priority_explanation = Column(String, nullable=True)
    title = Column(String, nullable=True)
    status = Column(String, default="OPEN", nullable=False)

class MessageSender(str, enum.Enum):
    STUDENT = "STUDENT"
    AI = "AI"
    ADMIN = "ADMIN"

class ChatMessage(Base):
    __tablename__ = "messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_id = Column(String(36), nullable=False) # FK to chat_sessions
    sender = Column(Enum(MessageSender), nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=lambda: __import__('datetime').datetime.utcnow())
    
    # New V2 fields
    citations_json = Column(String, nullable=True)
    confidence = Column(String, nullable=True)  # Store as String "94%" or REAL
    is_knowledge_gap = Column(Boolean, default=False)

class MessageFeedback(Base):
    __tablename__ = "message_feedback"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    message_id = Column(String(36), nullable=False) # FK to messages
    rating = Column(String(20), nullable=False) # "HELPFUL" or "NOT_HELPFUL"
    created_at = Column(DateTime, default=lambda: __import__('datetime').datetime.utcnow())

class Announcement(Base):
    __tablename__ = "announcements"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: __import__('datetime').datetime.utcnow())

class SavedResponse(Base):
    __tablename__ = "saved_responses"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(String(255), nullable=False)
    content = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: __import__('datetime').datetime.utcnow())

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
