import os
import json
import google.generativeai as genai
from typing import List, Dict, Any

# Setup Gemini API key
api_key = os.getenv("GEMINI_API_KEY", "LOCAL_API_KEY")
genai.configure(api_key=api_key)

import time

def get_embeddings(texts: List[str]) -> List[List[float]]:
    if api_key == "DUMMY_KEY_FOR_LOCAL_TESTING":
        return [[0.1] * 768 for _ in texts]
    
    all_embeddings = []
    # Batch texts into chunks of 50 to avoid 429 Too Many Requests
    batch_size = 50
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i+batch_size]
        try:
            result = genai.embed_content(
                model="models/gemini-embedding-2",
                content=batch,
                task_type="retrieval_document"
            )
            
            # The API returns either a list of embeddings or a dict depending on the exact SDK version/input structure
            batch_emb = result['embedding'] if isinstance(result, dict) else [r['embedding'] for r in result] if isinstance(result, list) and isinstance(result[0], dict) else result['embedding']
            
            # If batch_emb is a single list and batch size > 1, wrap it (SDK quirks)
            if len(batch) > 1 and len(batch_emb) > 0 and not isinstance(batch_emb[0], list):
                # But embed_content should return a list of lists when given a list of strings
                pass 
                
            all_embeddings.extend(batch_emb if isinstance(batch_emb[0], list) else [batch_emb])
            
        except Exception as e:
            if "429" in str(e):
                print(f"Rate limit hit at batch {i}. Sleeping for 45 seconds...")
                time.sleep(45)
                # Retry once
                result = genai.embed_content(
                    model="models/gemini-embedding-2",
                    content=batch,
                    task_type="retrieval_document"
                )
                batch_emb = result['embedding']
                all_embeddings.extend(batch_emb if isinstance(batch_emb[0], list) else [batch_emb])
            else:
                raise e
                
        # Sleep slightly between batches to pace the API
        if i + batch_size < len(texts):
            time.sleep(2)
            
    return all_embeddings

def generate_chat_response(messages: list, context: str) -> dict:
    if api_key == "DUMMY_KEY_FOR_LOCAL_TESTING":
        return {
            "answer": "This is a dummy response. Please provide a valid GEMINI_API_KEY.",
            "citations": [],
            "related_questions": [],
            "is_knowledge_gap": False
        }
        
    model = genai.GenerativeModel('gemini-3.5-flash-lite')
    
    system_prompt = f"""You are CampusPilot, an intelligent university helpdesk AI. You MUST answer the user's questions based ONLY on the following retrieved context documents. 

Context Documents:
{context}

CRITICAL RULES:
1. If the answer is NOT explicitly found in the context documents, DO NOT hallucinate. You MUST set "is_knowledge_gap" to true and return an empty answer.
2. You must output raw JSON only. Do not wrap in markdown code blocks.
3. Extract exactly 3 follow-up questions related to the topic.
4. Extract all citations used in the answer.

JSON Output Schema:
{{
  "answer": "The answer formatted in markdown.",
  "citations": [
    {{"filename": "string", "page": "string", "snippet": "exact string from context used"}}
  ],
  "related_questions": ["question 1", "question 2", "question 3"],
  "is_knowledge_gap": boolean
}}
"""
    
    gemini_messages = [{"role": "user", "parts": [system_prompt]}]
    for msg in messages:
        role = "user" if msg["role"] == "user" else "model"
        gemini_messages.append({"role": role, "parts": [msg["content"]]})
        
    try:
        response = model.generate_content(
            gemini_messages,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text.strip())
    except Exception as e:
        print("Chat generation error:", e)
        return {
            "answer": f"Error: {str(e)}",
            "citations": [],
            "related_questions": [],
            "is_knowledge_gap": False
        }

def explain_answer(answer: str, context: str) -> str:
    if api_key == "DUMMY_KEY_FOR_LOCAL_TESTING":
        return "Dummy explanation of the answer."
        
    model = genai.GenerativeModel('gemini-3.5-flash-lite')
    prompt = f"""Explain how you generated the following answer based ONLY on the context provided.
Break down your explanation into:
1. Documents Used
2. Reasoning
3. Supporting Evidence
4. Limitations (if any)

Answer:
{answer}

Context:
{context}

Return the explanation in clean Markdown format."""
    
    response = model.generate_content(prompt)
    return response.text

def generate_faqs(text: str) -> List[str]:
    if api_key == "DUMMY_KEY_FOR_LOCAL_TESTING":
        return ["Dummy Question: Dummy Answer?"]
        
    model = genai.GenerativeModel('gemini-3.5-flash-lite')
    prompt = f"Read the following document text and generate 5 to 10 Frequently Asked Questions (FAQs) and their answers based ONLY on the text. Format each as 'Q: [Question] A: [Answer]'.\n\nText:\n{text[:10000]}"
    
    response = model.generate_content(prompt)
    lines = response.text.split('\n')
    faqs = [line.strip() for line in lines if line.strip().startswith('Q:')]
    if not faqs:
        return [response.text.strip()]
    return faqs

def generate_ticket_summary(history: str, reason: str) -> dict:
    if api_key == "DUMMY_KEY_FOR_LOCAL_TESTING":
        return {
            "summary": "Dummy summary", 
            "student_intent": "Mock intent",
            "key_points": ["Mock point"],
            "priority": "MEDIUM", 
            "priority_explanation": "Mock priority",
            "department": "Admissions",
            "department_confidence": "90%",
            "suggested_resolution": "Mock resolution",
            "category": "Admissions"
        }
        
    model = genai.GenerativeModel('gemini-3.5-flash-lite')
    prompt = f"""You are analyzing an escalated support ticket for a university helpdesk. 
Chat History:
{history}

Escalation Reason provided by student: {reason}

Return a raw JSON object (NO MARKDOWN TICKS) with the following keys:
1. "summary": A short string summarizing the issue.
2. "student_intent": What the student is trying to achieve.
3. "key_points": A list of strings containing key conversation points.
4. "priority": One of "LOW", "MEDIUM", "HIGH", "CRITICAL".
5. "priority_explanation": A 1-sentence justification for the priority.
6. "department": Predict the best department (Admissions, Hostel, Finance, Scholarship, Placement, Library, IT Support, Examinations, General).
7. "department_confidence": Confidence percentage (e.g. "95%").
8. "suggested_resolution": What the human agent should do.
9. "category": A 1-3 word classification topic (e.g. "Hostel Fee Refund").
"""
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        if text.startswith("```json"):
            text = text[7:-3]
        elif text.startswith("```"):
            text = text[3:-3]
        return json.loads(text.strip())
    except Exception as e:
        print("Failed to generate ticket summary:", e)
        return {
            "summary": "Failed to generate AI summary.", 
            "student_intent": "",
            "key_points": [],
            "priority": "MEDIUM", 
            "priority_explanation": "Error",
            "department": "General",
            "department_confidence": "0%",
            "suggested_resolution": "Please investigate manually.",
            "category": "General"
        }

def generate_conversation_title(first_message: str) -> str:
    if api_key == "DUMMY_KEY_FOR_LOCAL_TESTING":
        return "Conversation"
        
    model = genai.GenerativeModel('gemini-3.5-flash-lite')
    prompt = f"Generate a short, 3-4 word title summarizing this student's query:\n\n{first_message}\n\nReturn ONLY the title string."
    try:
        response = model.generate_content(prompt)
        return response.text.strip().replace('"', '')
    except:
        return "Conversation"
