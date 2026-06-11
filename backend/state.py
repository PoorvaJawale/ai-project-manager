from typing import TypedDict, Optional

class ProjectState(TypedDict):
    session_id: str
    user_id: str
    requirement: str
    roadmap: Optional[dict]
    system_design: Optional[dict]
    tasks: Optional[list]
    github_repo: Optional[str]
    error: Optional[str]