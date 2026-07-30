from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from models.database import get_db, Announcement, User, UserRole
from api.auth import get_current_user

router = APIRouter()

class AnnouncementCreate(BaseModel):
    title: str
    category: str
    content: str

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    category: str
    content: str
    created_at: str

    class Config:
        from_attributes = True

@router.post("/", response_model=AnnouncementResponse)
def create_announcement(payload: AnnouncementCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create announcements")
        
    announcement = Announcement(
        title=payload.title,
        category=payload.category,
        content=payload.content
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return AnnouncementResponse(
        id=announcement.id,
        title=announcement.title,
        category=announcement.category,
        content=announcement.content,
        created_at=announcement.created_at.isoformat()
    )

@router.get("/", response_model=List[AnnouncementResponse])
def get_announcements(db: Session = Depends(get_db)):
    announcements = db.query(Announcement).order_by(Announcement.created_at.desc()).all()
    return [AnnouncementResponse(
        id=a.id, title=a.title, category=a.category, content=a.content, created_at=a.created_at.isoformat()
    ) for a in announcements]
