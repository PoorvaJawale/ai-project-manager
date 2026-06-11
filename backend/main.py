import os
import uuid
import json
import psycopg2
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import PyPDF2
import docx
import io
import requests
import time

from graph import pipeline
from state import ProjectState

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    return psycopg2.connect(os.getenv("DATABASE_URL"))

class GenerateRequest(BaseModel):
    requirement: str
    user_id: str
    github_repo: str = ""

class FileProcessRequest(BaseModel):
    session_id: str
    user_id: str

@app.post("/generate")
async def generate_project(req: GenerateRequest):
    session_id = str(uuid.uuid4())
    
    # Save initial record
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO projects (session_id, user_id, requirement, github_repo, status) VALUES (%s, %s, %s, %s, %s)",
        (session_id, req.user_id, req.requirement, req.github_repo, "processing")
    )
    conn.commit()
    
    # Run the LangGraph pipeline
    initial_state = ProjectState(
        session_id=session_id,
        user_id=req.user_id,
        requirement=req.requirement,
        roadmap=None,
        system_design=None,
        tasks=None,
        github_repo=req.github_repo,
        error=None
    )
    
    result = pipeline.invoke(initial_state)
    
    if result.get("error"):
        cur.execute(
            "UPDATE projects SET status=%s WHERE session_id=%s",
            ("failed", session_id)
        )
        conn.commit()
        cur.close()
        conn.close()
        raise HTTPException(status_code=500, detail=result["error"])
    
    # Save results
    cur.execute(
        """UPDATE projects 
           SET roadmap=%s, system_design=%s, tasks=%s, status=%s, updated_at=NOW()
           WHERE session_id=%s""",
        (
            json.dumps(result["roadmap"]),
            json.dumps(result["system_design"]),
            json.dumps(result["tasks"]),
            "completed",
            session_id
        )
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "success": True,
        "session_id": session_id,
        "roadmap": result["roadmap"],
        "system_design": result["system_design"],
        "tasks": result["tasks"]
    }

@app.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = "",
    session_id: str = ""
):
    content = await file.read()
    extracted_text = ""
    
    if file.filename.endswith(".pdf"):
        reader = PyPDF2.PdfReader(io.BytesIO(content))
        for page in reader.pages:
            extracted_text += page.extract_text()
    elif file.filename.endswith(".docx"):
        doc = docx.Document(io.BytesIO(content))
        for para in doc.paragraphs:
            extracted_text += para.text + "\n"
    elif file.filename.endswith(".txt"):
        extracted_text = content.decode("utf-8")
    else:
        raise HTTPException(status_code=400, detail="Only PDF, DOCX, TXT supported")
    
    if not session_id:
        session_id = str(uuid.uuid4())
    
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO uploaded_files (session_id, user_id, filename, extracted_text) VALUES (%s, %s, %s, %s)",
        (session_id, user_id, file.filename, extracted_text)
    )
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        "session_id": session_id,
        "extracted_text": extracted_text[:500] + "...",
        "full_text": extracted_text
    }

@app.post("/create-github-issues")
async def create_github_issues(data: dict):
    tasks = data["tasks"]
    repo = data["github_repo"]  # format: "username/repo-name"
    token = os.getenv("GITHUB_TOKEN")
    session_id = data["session_id"]
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    created_issues = []
    
    for task in tasks:
        try:
            response = requests.post(
                f"https://api.github.com/repos/{repo}/issues",
                headers=headers,
                json={
                    "title": task["title"],
                    "body": task["body"],
                    "labels": task.get("labels", [])
                }
            )
            
            if response.status_code == 201:
                issue_data = response.json()
                created_issues.append({
                    "number": issue_data["number"],
                    "url": issue_data["html_url"],
                    "title": task["title"]
                })
                
                # Log to DB
                conn = get_db()
                cur = conn.cursor()
                cur.execute(
                    "INSERT INTO github_issues (session_id, issue_number, issue_url, task_title) VALUES (%s, %s, %s, %s)",
                    (session_id, issue_data["number"], issue_data["html_url"], task["title"])
                )
                conn.commit()
                cur.close()
                conn.close()
                
                time.sleep(0.5)  # Rate limit protection
        except Exception as e:
            # Log error but continue with other issues
            conn = get_db()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO error_logs (workflow_name, error_message, session_id) VALUES (%s, %s, %s)",
                ("github_issue_creation", str(e), session_id)
            )
            conn.commit()
            cur.close()
            conn.close()
    
    return {"created": len(created_issues), "issues": created_issues}

@app.get("/projects/{user_id}")
async def get_user_projects(user_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """SELECT session_id, requirement, status, roadmap, created_at 
           FROM projects WHERE user_id=%s 
           ORDER BY created_at DESC LIMIT 10""",
        (user_id,)
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    projects = []
    for row in rows:
        projects.append({
            "session_id": row[0],
            "requirement": row[1],
            "status": row[2],
            "roadmap": row[3],
            "created_at": str(row[4])
        })
    
    return {"projects": projects}

@app.get("/project/{session_id}")
async def get_project(session_id: str):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "SELECT * FROM projects WHERE session_id=%s",
        (session_id,)
    )
    row = cur.fetchone()
    cur.close()
    conn.close()
    
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return {
        "session_id": row[2],
        "user_id": row[3],
        "requirement": row[4],
        "roadmap": row[5],
        "system_design": row[6],
        "tasks": row[7],
        "status": row[9],
        "created_at": str(row[10])
    }

@app.post("/log-error")
async def log_error(data: dict):
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO error_logs (workflow_name, error_message, session_id) VALUES (%s, %s, %s)",
        (
            data.get("workflow_name", "unknown"),
            data.get("error_message", "unknown"),
            data.get("session_id", "unknown")
        )
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"success": True}

@app.get("/health")
async def health():
    return {"status": "ok"}