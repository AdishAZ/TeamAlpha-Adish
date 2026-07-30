from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from models.database import get_db, SavedResponse, User, UserRole
from api.auth import get_current_user

router = APIRouter()

class SavedResponseCreate(BaseModel):
    title: str
    content: str

class SavedResponseModel(BaseModel):
    id: str
    title: str
    content: str
    created_at: str

    class Config:
        from_attributes = True

@router.get("/saved-responses", response_model=List[SavedResponseModel])
def get_saved_responses(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can access saved responses")
    
    responses = db.query(SavedResponse).all()
    result = []
    for r in responses:
        result.append(SavedResponseModel(
            id=r.id,
            title=r.title,
            content=r.content,
            created_at=r.created_at.isoformat()
        ))
    return result

@router.post("/saved-responses", response_model=SavedResponseModel)
def create_saved_response(payload: SavedResponseCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create saved responses")
    
    new_response = SavedResponse(
        title=payload.title,
        content=payload.content
    )
    db.add(new_response)
    db.commit()
    db.refresh(new_response)
    
    return SavedResponseModel(
        id=new_response.id,
        title=new_response.title,
        content=new_response.content,
        created_at=new_response.created_at.isoformat()
    )
