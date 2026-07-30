import chromadb
import uuid
from typing import List, Dict

# Initialize ChromaDB client with local persistence
chroma_client = chromadb.PersistentClient(path="./local_data/chroma")
collection = chroma_client.get_or_create_collection(name="knowledge_base")
tickets_collection = chroma_client.get_or_create_collection(name="tickets")

def add_documents(texts: List[str], metadatas: List[Dict], embeddings: List[List[float]] = None):
    ids = [str(uuid.uuid4()) for _ in texts]
    if embeddings:
        collection.add(embeddings=embeddings, documents=texts, metadatas=metadatas, ids=ids)
    else:
        collection.add(documents=texts, metadatas=metadatas, ids=ids)
    return ids

def query_documents(query_texts: List[str] = None, n_results: int = 5, query_embeddings: List[List[float]] = None):
    if query_embeddings:
        results = collection.query(query_embeddings=query_embeddings, n_results=n_results)
    else:
        results = collection.query(query_texts=query_texts, n_results=n_results)
    return results

def add_ticket_to_vector_store(ticket_id: str, summary: str, embeddings: List[float]):
    tickets_collection.add(
        embeddings=[embeddings],
        documents=[summary],
        metadatas=[{"ticket_id": ticket_id}],
        ids=[ticket_id]
    )

def search_duplicate_tickets(query_embedding: List[float], n_results: int = 3):
    if tickets_collection.count() == 0:
        return {"documents": [[]], "metadatas": [[]]}
    
    results = tickets_collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )
    return results
