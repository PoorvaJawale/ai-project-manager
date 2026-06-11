import json
import os
from openai import OpenAI
from state import ProjectState

PLANNER_PROMPT = """You are a senior technical project planner.
Given a business requirement, create a structured project roadmap.

Return ONLY valid JSON with this exact structure:
{
  "project_name": "string",
  "tech_stack": {
    "frontend": ["list of technologies"],
    "backend": ["list of technologies"],
    "database": ["list of technologies"],
    "infrastructure": ["list of technologies"]
  },
  "milestones": [
    {
      "name": "string",
      "duration_days": number,
      "deliverables": ["list of deliverables"]
    }
  ],
  "timeline_weeks": number,
  "team_size": number,
  "risk_factors": ["list of risks"]
}"""

def run_planner(state: ProjectState) -> ProjectState:
    try:
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": PLANNER_PROMPT},
                {"role": "user", "content": f"Requirement: {state['requirement']}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        roadmap = json.loads(response.choices[0].message.content)
        return {**state, "roadmap": roadmap}
    except Exception as e:
        return {**state, "error": f"Planner failed: {str(e)}"}