# CampusPilot 🚀

CampusPilot is a brand-new, completely original, AI-powered university helpdesk and student support platform. Designed to provide instant, context-aware answers to student queries, and seamlessly escalate complex issues to human administrative staff. 

Built from scratch during a 24-hour hackathon, this MVP demonstrates a fully functioning RAG (Retrieval-Augmented Generation) pipeline integrated with a modern chat interface and ticket management system.

## 🌟 Key Features

* **AI Chat Assistant**: Instant answers to student questions powered by Google Gemini.
* **Knowledge Ingestion**: Admins can seamlessly upload University Handbooks and PDFs. The system automatically chunks, embeds, and stores them in a local vector database for intelligent retrieval.
* **Escalation Workflow**: When AI isn't enough, students can click a button to seamlessly escalate their chat to human support.
* **Admin Dashboard**: A centralized board where university staff can view escalated tickets and reply directly to students.
* **Student Portal**: A dedicated view for students to check the status of their active and past support tickets.

## 🛠️ Technology Stack

* **Frontend**: Next.js (App Router), React, Tailwind CSS, TypeScript
* **Backend**: FastAPI, Python 3.11+
* **Database (Relational)**: SQLite (via SQLAlchemy) for Users, Sessions, and Messages
* **Database (Vector)**: ChromaDB (Local persistent storage) for Knowledge Document embeddings
* **AI Engine**: Google Gemini API (`google.generativeai`)
* **PDF Processing**: `pypdf` for text extraction

## 🚀 Getting Started

Follow these instructions to run CampusPilot locally on your machine.

### Prerequisites
* Node.js (v18+)
* Python (v3.9+)
* A Google Gemini API Key

### 1. Backend Setup

Open a terminal and navigate to the `backend` directory:

```bash
cd backend
```

Create a virtual environment and install the dependencies:

```bash
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

**Set your Environment Variables:**

Create a `.env` file in the `backend` directory (or export them to your shell):
```env
GEMINI_API_KEY=your_gemini_api_key_here
SECRET_KEY=your_super_secret_jwt_key
```

Run the backend server:

```bash
python -m uvicorn main:app --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend
```

Install the Node dependencies:

```bash
npm install
```

Start the Next.js development server:

```bash
npm run dev
```
The frontend will be available at `http://localhost:3000`.

## 🧪 How to Test the MVP

1. **Register Users**: Go to `http://localhost:3000/login` (click "Register" if needed). Create one account with the `ADMIN` role, and another account with the `STUDENT` role.
2. **Train the AI**: Log in as the Admin and navigate to the Knowledge Base page. Upload a dummy PDF containing university rules or info.
3. **Chat**: Log out, then log back in as the Student. Navigate to the Chat interface and ask a question related to the PDF you uploaded.
4. **Escalate**: Click the "Not helpful? Talk to a human" button below the chat.
5. **Resolve**: Log back in as the Admin, go to the Admin Dashboard, and reply to the escalated ticket!

---

*Built with ❤️ for the Hackathon!*
