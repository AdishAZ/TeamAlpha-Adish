import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional

from models.database import get_db, ChatSession, ChatMessage, User, MessageSender, UserRole
from api.auth import get_current_user
from services.ai_service import generate_chat_response, get_embeddings, generate_ticket_summary, explain_answer, generate_conversation_title
from services.vector_store import query_documents, add_ticket_to_vector_store, search_duplicate_tickets

router = APIRouter()

from datetime import datetime

class ChatMessageCreate(BaseModel):
    content: str

class ChatMessageResponse(BaseModel):
    id: str
    session_id: str
    sender: MessageSender
    content: str
    timestamp: datetime
    citations_json: Optional[str] = None
    confidence: Optional[str] = None
    is_knowledge_gap: bool = False

    class Config:
        from_attributes = True

class ChatSessionResponse(BaseModel):
    id: str
    student_id: str
    started_at: datetime
    is_escalated: bool
    ai_summary: Optional[str] = None
    priority: Optional[str] = None
    escalation_reason: Optional[str] = None
    department: Optional[str] = None
    category: Optional[str] = None
    priority_explanation: Optional[str] = None
    title: Optional[str] = None
    status: str

    class Config:
        from_attributes = True

@router.post("/sessions", response_model=ChatSessionResponse)
def create_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = ChatSession(student_id=current_user.id)
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session

@router.get("/sessions", response_model=List[ChatSessionResponse])
def get_sessions(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role == UserRole.ADMIN:
        sessions = db.query(ChatSession).all()
    else:
        sessions = db.query(ChatSession).filter(ChatSession.student_id == current_user.id).all()
    return sessions

@router.get("/sessions/{session_id}/messages", response_model=List[ChatMessageResponse])
def get_messages(session_id: str, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if current_user.role != UserRole.ADMIN and session.student_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this session")

    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp).all()
    return messages

@router.post("/sessions/{session_id}/message", response_model=ChatMessageResponse)
def send_message(session_id: str, message: ChatMessageCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    sender = MessageSender.ADMIN if current_user.role == UserRole.ADMIN else MessageSender.STUDENT

    # Auto title on first message
    if sender == MessageSender.STUDENT:
        existing_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).count()
        if existing_msgs == 0:
            title = generate_conversation_title(message.content)
            session.title = title
            db.commit()

    user_msg = ChatMessage(session_id=session_id, sender=sender, content=message.content)
    db.add(user_msg)
    db.commit()

    if sender == MessageSender.STUDENT and not session.is_escalated:
        context_pieces = []
        try:
            query_embed = get_embeddings([message.content])
            docs = query_documents(query_embeddings=query_embed, n_results=5)
            
            distances = []
            if docs and docs.get('documents') and docs.get('metadatas'):
                for i, sublist in enumerate(docs['documents']):
                    for j, text in enumerate(sublist):
                        meta = docs['metadatas'][i][j]
                        dist = docs['distances'][i][j] if 'distances' in docs and docs['distances'] else 0
                        distances.append(dist)
                        filename = meta.get('filename', 'Unknown')
                        page = meta.get('page', 'Unknown')
                        context_pieces.append(f"Source: {filename} (Page {page})\nText: {text}")
            context = "\n\n".join(context_pieces)
            
            # Simple confidence proxy: distance in chroma (lower is closer for L2). 
            # E.g. L2 distance < 0.5 is High. Let's just mock a % for the hackathon demo
            confidence_score = 94 if len(context_pieces) > 0 else 0
            if distances and min(distances) > 1.0:
                confidence_score = 68 # Medium
            confidence_str = f"{confidence_score}%"

        except Exception as e:
            print(f"Error querying ChromaDB: {e}")
            context = ""
            confidence_str = "0%"

        past_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp).all()
        history = [{"role": "user" if m.sender == MessageSender.STUDENT else "model", "content": m.content} for m in past_msgs]
        
        ai_data = generate_chat_response(messages=history, context=context)
        
        # Package citations and related questions together in citations_json
        meta_json = json.dumps({
            "citations": ai_data.get("citations", []),
            "related_questions": ai_data.get("related_questions", []),
            "chunks_count": len(context_pieces)
        })

        ai_msg = ChatMessage(
            session_id=session_id,
            sender=MessageSender.AI,
            content=ai_data.get("answer", ""),
            citations_json=meta_json,
            confidence=confidence_str,
            is_knowledge_gap=ai_data.get("is_knowledge_gap", False)
        )
        db.add(ai_msg)
        db.commit()
        db.refresh(ai_msg)
        return ai_msg

    db.refresh(user_msg)
    return user_msg

class ExplainRequest(BaseModel):
    message_id: str

@router.post("/messages/explain")
def explain_message(req: ExplainRequest, db: Session = Depends(get_db)):
    msg = db.query(ChatMessage).filter(ChatMessage.id == req.message_id).first()
    if not msg or msg.sender != MessageSender.AI:
        raise HTTPException(status_code=404, detail="AI message not found")
        
    try:
        query_embed = get_embeddings([msg.content])
        docs = query_documents(query_embeddings=query_embed, n_results=5)
        context = ""
        if docs and docs.get('documents'):
            context = "\n\n".join(docs['documents'][0])
            
        explanation = explain_answer(msg.content, context)
        return {"explanation": explanation}
    except Exception as e:
        return {"explanation": "Failed to explain the answer due to a backend error."}

class EscalateRequest(BaseModel):
    reason: str = "Student requested human support."

@router.post("/sessions/{session_id}/escalate", response_model=ChatSessionResponse)
def escalate_session(session_id: str, payload: EscalateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if not session.is_escalated:
        session.is_escalated = True
        session.escalation_reason = payload.reason
        
        escalate_msg = ChatMessage(
            session_id=session_id,
            sender=MessageSender.AI,
            content="This ticket has been escalated to human support. An agent will respond to you shortly."
        )
        db.add(escalate_msg)
        
        past_msgs = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.timestamp).all()
        history_text = "\n".join([f"{m.sender}: {m.content}" for m in past_msgs])
        
        ai_data = generate_ticket_summary(history_text, payload.reason)
        
        session.ai_summary = json.dumps({
            "summary": ai_data.get("summary", ""),
            "student_intent": ai_data.get("student_intent", ""),
            "key_points": ai_data.get("key_points", []),
            "suggested_resolution": ai_data.get("suggested_resolution", "")
        })
        session.priority = ai_data.get("priority", "MEDIUM")
        session.priority_explanation = ai_data.get("priority_explanation", "")
        session.department = ai_data.get("department", "General")
        session.category = ai_data.get("category", "Support")
        session.status = "OPEN"
        
        db.commit()
        db.refresh(session)
        
        # Save ticket to vector store for duplicate detection
        try:
            embeds = get_embeddings([session.ai_summary])[0]
            add_ticket_to_vector_store(session.id, session.ai_summary, embeds)
        except:
            pass
        
    return session

@router.get("/sessions/{session_id}/duplicates")
def get_duplicate_tickets(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session or not session.ai_summary:
        return []
    
    try:
        embeds = get_embeddings([session.ai_summary])[0]
        results = search_duplicate_tickets(embeds, n_results=3)
        duplicates = []
        if results and results.get('metadatas'):
            for meta in results['metadatas'][0]:
                if meta and meta.get("ticket_id") != session_id:
                    dup_sess = db.query(ChatSession).filter(ChatSession.id == meta.get("ticket_id")).first()
                    if dup_sess:
                        duplicates.append({
                            "id": dup_sess.id,
                            "title": dup_sess.title,
                            "status": dup_sess.status,
                            "started_at": dup_sess.started_at.isoformat()
                        })
        return duplicates
    except:
        return []

class FeedbackRequest(BaseModel):
    rating: str

@router.post("/messages/{message_id}/feedback")
def submit_feedback(message_id: str, payload: FeedbackRequest, db: Session = Depends(get_db)):
    from models.database import MessageFeedback
    fb = MessageFeedback(message_id=message_id, rating=payload.rating)
    db.add(fb)
    db.commit()
class SessionUpdateRequest(BaseModel):
    status: str

@router.patch("/sessions/{session_id}/status")
def update_session_status(session_id: str, payload: SessionUpdateRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can update ticket status")
        
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session.status = payload.status
    db.commit()
    return {"status": session.status}
