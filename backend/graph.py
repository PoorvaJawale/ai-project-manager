from langgraph.graph import StateGraph, END
from state import ProjectState
from agents.planner import run_planner
from agents.system_design import run_system_design
from agents.task_gen import run_task_gen

def should_continue(state: ProjectState) -> str:
    if state.get("error"):
        return "end"
    return "continue"

def build_graph():
    graph = StateGraph(ProjectState)
    
    graph.add_node("planner", run_planner)
    graph.add_node("system_design", run_system_design)
    graph.add_node("task_gen", run_task_gen)
    
    graph.set_entry_point("planner")
    
    graph.add_conditional_edges(
        "planner",
        should_continue,
        {"continue": "system_design", "end": END}
    )
    graph.add_conditional_edges(
        "system_design",
        should_continue,
        {"continue": "task_gen", "end": END}
    )
    graph.add_edge("task_gen", END)
    
    return graph.compile()

pipeline = build_graph()