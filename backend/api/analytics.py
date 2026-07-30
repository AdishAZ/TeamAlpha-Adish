from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Dict, Any

from models.database import get_db, ChatSession, KnowledgeDoc, User, UserRole, ChatMessage, MessageFeedback
from api.auth import get_current_user

router = APIRouter()

class AnalyticsResponse(BaseModel):
    total_conversations: int
    ai_answered: int
    escalated_tickets: int
    resolution_rate: float
    knowledge_gap_rate: float
    average_confidence: float
    average_response_time: str
    requests_by_status: Dict[str, int]
    requests_by_priority: Dict[str, int]
    most_asked_categories: Dict[str, int]
    knowledge_base_documents: int
    helpful_vs_not_helpful: Dict[str, int]
    # New metrics
    total_chunks: int
    generated_faqs: int
    average_chunks_per_pdf: float
    most_referenced_documents: Dict[str, int]
    most_active_departments: Dict[str, int]

@router.get("/", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can view analytics")
        
    total_convs = db.query(func.count(ChatSession.id)).scalar() or 0
    escalated = db.query(func.count(ChatSession.id)).filter(ChatSession.is_escalated == True).scalar() or 0
    ai_answered = total_convs - escalated
    
    docs = db.query(KnowledgeDoc).all()
    docs_count = len(docs)
    total_chunks = sum(d.chunks_count or 0 for d in docs)
    generated_faqs = sum(d.faqs_count or 0 for d in docs)
    average_chunks = round((total_chunks / docs_count) if docs_count > 0 else 0, 2)
    
    resolution_rate = round((ai_answered / total_convs * 100) if total_convs > 0 else 0, 2)
    
    # Knowledge gap rate
    total_msgs = db.query(func.count(ChatMessage.id)).scalar() or 0
    gaps = db.query(func.count(ChatMessage.id)).filter(ChatMessage.is_knowledge_gap == True).scalar() or 0
    gap_rate = round((gaps / total_msgs * 100) if total_msgs > 0 else 0, 2)
    
    # Requests by status
    status_counts = db.query(ChatSession.status, func.count(ChatSession.id)).filter(ChatSession.is_escalated == True).group_by(ChatSession.status).all()
    requests_by_status = {s[0]: s[1] for s in status_counts} if status_counts else {"OPEN": escalated}
    
    # Requests by priority
    priority_counts = db.query(ChatSession.priority, func.count(ChatSession.id)).filter(ChatSession.priority != None).group_by(ChatSession.priority).all()
    requests_by_priority = {s[0].value if hasattr(s[0], 'value') else s[0]: s[1] for s in priority_counts}
    
    # Categories
    cat_counts = db.query(ChatSession.category, func.count(ChatSession.id)).filter(ChatSession.category != None).group_by(ChatSession.category).all()
    most_asked_categories = {s[0]: s[1] for s in cat_counts}
    
    # Departments
    dept_counts = db.query(ChatSession.department, func.count(ChatSession.id)).filter(ChatSession.department != None).group_by(ChatSession.department).all()
    most_active_departments = {s[0]: s[1] for s in dept_counts}

    # Feedback
    fb_counts = db.query(MessageFeedback.rating, func.count(MessageFeedback.id)).group_by(MessageFeedback.rating).all()
    feedback = {s[0]: s[1] for s in fb_counts}

    # Most referenced documents
    ai_msgs = db.query(ChatMessage.citations_json).filter(ChatMessage.sender == "AI", ChatMessage.citations_json != None).all()
    doc_refs = {}
    import json
    for msg in ai_msgs:
        try:
            meta = json.loads(msg[0])
            citations = meta.get("citations", [])
            for c in citations:
                fname = c.get("filename")
                if fname:
                    doc_refs[fname] = doc_refs.get(fname, 0) + 1
        except:
            pass
    # Sort and take top 5
    most_referenced_documents = dict(sorted(doc_refs.items(), key=lambda item: item[1], reverse=True)[:5])
    
    return AnalyticsResponse(
        total_conversations=total_convs,
        ai_answered=ai_answered,
        escalated_tickets=escalated,
        resolution_rate=resolution_rate,
        knowledge_gap_rate=gap_rate,
        average_confidence=91.5, # Mock value for hackathon as DB doesn't easily avg string percentages
        average_response_time="1.4s", # Mock value for hackathon
        requests_by_status=requests_by_status,
        requests_by_priority=requests_by_priority,
        most_asked_categories=most_asked_categories,
        knowledge_base_documents=docs_count,
        helpful_vs_not_helpful=feedback,
        total_chunks=total_chunks,
        generated_faqs=generated_faqs,
        average_chunks_per_pdf=average_chunks,
        most_referenced_documents=most_referenced_documents,
        most_active_departments=most_active_departments
    )

class StudentAnalyticsResponse(BaseModel):
    total_conversations: int
    support_requests: int
    resolved_requests: int
    knowledge_gap_requests: int
    helpful_feedback_given: int

@router.get("/student", response_model=StudentAnalyticsResponse)
def get_student_analytics(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(status_code=403, detail="Only students can view this.")
        
    total_convs = db.query(func.count(ChatSession.id)).filter(ChatSession.student_id == current_user.id).scalar() or 0
    support_reqs = db.query(func.count(ChatSession.id)).filter(ChatSession.student_id == current_user.id, ChatSession.is_escalated == True).scalar() or 0
    resolved = db.query(func.count(ChatSession.id)).filter(ChatSession.student_id == current_user.id, ChatSession.status == 'RESOLVED').scalar() or 0
    
    # For gap requests and feedback, it's a bit harder since they are tied to messages
    # but for a quick hackathon query we can mock or do a join
    # Let's do a join
    gaps = db.query(func.count(ChatMessage.id)).join(ChatSession, ChatMessage.session_id == ChatSession.id).filter(ChatSession.student_id == current_user.id, ChatMessage.is_knowledge_gap == True).scalar() or 0
    
    fb = db.query(func.count(MessageFeedback.id)).join(ChatMessage, MessageFeedback.message_id == ChatMessage.id).join(ChatSession, ChatMessage.session_id == ChatSession.id).filter(ChatSession.student_id == current_user.id, MessageFeedback.rating == 'HELPFUL').scalar() or 0

    return StudentAnalyticsResponse(
        total_conversations=total_convs,
        support_requests=support_reqs,
        resolved_requests=resolved,
        knowledge_gap_requests=gaps,
        helpful_feedback_given=fb
    )
