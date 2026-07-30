from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
import uuid

from models.database import get_db, KnowledgeDoc, User, UserRole
from api.auth import get_current_user
from services.ai_service import get_embeddings
from services.vector_store import add_documents
from pypdf import PdfReader

router = APIRouter()

class KnowledgeDocResponse(BaseModel):
    id: str
    filename: str
    uploaded_at: str
    uploaded_by: str
    chunks_count: int = 0
    faqs_count: int = 0

    class Config:
        from_attributes = True

from services.ai_service import get_embeddings, generate_faqs

def chunk_text_with_metadata(text: str, page_num: int, chunk_size: int = 1000, overlap: int = 100) -> List[dict]:
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append({"text": text[start:end], "page": page_num})
        start += chunk_size - overlap
    return chunks

@router.post("/upload", response_model=KnowledgeDocResponse)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can upload knowledge documents")
        
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")

    # Read PDF content
    try:
        pdf_reader = PdfReader(file.file)
        full_text = ""
        chunk_dicts = []
        for i, page in enumerate(pdf_reader.pages):
            page_text = page.extract_text()
            if page_text:
                full_text += page_text + "\n"
                chunk_dicts.extend(chunk_text_with_metadata(page_text, i + 1))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read PDF: {str(e)}")

    if not full_text.strip():
        raise HTTPException(status_code=400, detail="PDF is empty or unreadable")

    # Generate FAQs from the text
    faqs = []
    try:
        faqs = generate_faqs(full_text)
        for faq in faqs:
            chunk_dicts.append({"text": faq, "page": "FAQ"})
    except Exception as e:
        print("Failed to generate FAQs:", e)

    # Create Database Record
    doc = KnowledgeDoc(
        filename=file.filename,
        uploaded_by=current_user.id,
        chunks_count=len(chunk_dicts),
        faqs_count=len(faqs)
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    
    # Prepare texts and metadatas
    texts = [c["text"] for c in chunk_dicts]
    metadatas = [{"doc_id": doc.id, "filename": doc.filename, "page": str(c["page"])} for c in chunk_dicts]
    
    # Generate Embeddings
    try:
        embeddings = get_embeddings(texts)
        # Store in ChromaDB
        add_documents(texts=texts, metadatas=metadatas, embeddings=embeddings)
    except Exception as e:
        # Rollback DB if vector store fails
        db.delete(doc)
        db.commit()
        raise HTTPException(status_code=500, detail=f"Failed to process vectors: {str(e)}")

    # Format response date
    response = KnowledgeDocResponse(
        id=doc.id,
        filename=doc.filename,
        uploaded_at=doc.uploaded_at.isoformat(),
        uploaded_by=doc.uploaded_by,
        chunks_count=doc.chunks_count or 0,
        faqs_count=doc.faqs_count or 0
    )
    return response

@router.get("/", response_model=List[KnowledgeDocResponse])
def get_documents(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    docs = db.query(KnowledgeDoc).all()
    result = []
    for doc in docs:
        result.append(KnowledgeDocResponse(
            id=doc.id,
            filename=doc.filename,
            uploaded_at=doc.uploaded_at.isoformat(),
            uploaded_by=doc.uploaded_by,
            chunks_count=doc.chunks_count or 0,
            faqs_count=doc.faqs_count or 0
        ))
    return result
