import json
import os
from openai import OpenAI
from state import ProjectState

TASK_GEN_PROMPT = """You are a technical project manager creating GitHub issues.
Given a project roadmap and system design, create development tasks.

Return ONLY valid JSON with this exact structure:
{
  "tasks": [
    {
      "title": "string (concise GitHub issue title)",
      "body": "string (detailed description with acceptance criteria)",
      "labels": ["list like: backend, frontend, database, auth"],
      "sprint": "Sprint 1|Sprint 2|Sprint 3",
      "priority": "high|medium|low",
      "estimated_hours": number,
      "milestone": "string (milestone name from roadmap)"
    }
  ]
}

Generate 15-25 tasks covering all milestones."""

def run_task_gen(state: ProjectState) -> ProjectState:
    if state.get("error"):
        return state
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": TASK_GEN_PROMPT},
                {
                    "role": "user",
                    "content": f"Roadmap: {json.dumps(state['roadmap'])}\n\nSystem Design: {json.dumps(state['system_design'])}"
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        result = json.loads(response.choices[0].message.content)
        return {**state, "tasks": result["tasks"]}
    except Exception as e:
        return {**state, "error": f"Task gen failed: {str(e)}"}