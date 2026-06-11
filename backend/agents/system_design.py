import json
from openai import OpenAI
from state import ProjectState

client = OpenAI()

SYSTEM_DESIGN_PROMPT = """You are a senior software architect.
Given a project roadmap, create a complete system design.

Return ONLY valid JSON with this exact structure:
{
  "architecture_type": "microservices|monolith|serverless",
  "components": [
    {
      "name": "string",
      "type": "frontend|backend|database|cache|queue",
      "description": "string",
      "technology": "string"
    }
  ],
  "database_schema": [
    {
      "table_name": "string",
      "columns": [
        {"name": "string", "type": "string", "constraints": "string"}
      ]
    }
  ],
  "api_endpoints": [
    {
      "method": "GET|POST|PUT|DELETE",
      "path": "string",
      "description": "string",
      "request_body": "string",
      "response": "string"
    }
  ],
  "security_considerations": ["list of items"],
  "scalability_notes": "string"
}"""

def run_system_design(state: ProjectState) -> ProjectState:
    if state.get("error"):
        return state
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_DESIGN_PROMPT},
                {"role": "user", "content": f"Roadmap: {json.dumps(state['roadmap'])}"}
            ],
            response_format={"type": "json_object"},
            temperature=0.2
        )
        design = json.loads(response.choices[0].message.content)
        return {**state, "system_design": design}
    except Exception as e:
        return {**state, "error": f"System design failed: {str(e)}"}