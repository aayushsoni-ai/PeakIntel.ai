import yaml
import os
import logging
from typing import Dict, Any, List, TypedDict, Callable, Awaitable
from langgraph.graph import StateGraph, START, END

logger = logging.getLogger("pinnacle.paperclipai")

class PipelineState(TypedDict):
    """The State Dictionary for the LangGraph Pipeline"""
    companies: List[str]
    current_phase: str
    results: Dict[str, Any]

class PaperclipAI:
    """Wrapper that reads a config and uses LangGraph to orchestrate agents."""
    
    def __init__(self, config_path: str):
        self.config_path = config_path
        self.config = self._load_config()
        self.graph = None
        self._node_functions: Dict[str, Callable[[PipelineState], Awaitable[PipelineState]]] = {}

    def _load_config(self) -> Dict[str, Any]:
        with open(self.config_path, "r") as f:
            return yaml.safe_load(f)

    def register_node(self, node_name: str, func: Callable[[PipelineState], Awaitable[PipelineState]]):
        """Register a Python async function to act as a LangGraph node corresponding to a phase"""
        self._node_functions[node_name] = func

    def compile(self) -> Any:
        """Dynamically build the LangGraph StateGraph based on the registered nodes and config."""
        logger.info("Initializing PaperclipAI Orchestration with LangGraph...")
        
        # Build the graph
        builder = StateGraph(PipelineState)
        
        phases = self.config.get("pipeline", {}).get("phases", [])
        if not phases:
            raise ValueError("No phases defined in config.yaml")

        # Define nodes
        for phase in phases:
            phase_name = phase["name"]
            if phase_name not in self._node_functions:
                logger.warning(f"No registered node for phase {phase_name}")
                continue
            builder.add_node(phase_name, self._node_functions[phase_name])

        # Define edges sequentially
        builder.add_edge(START, phases[0]["name"])
        for i in range(len(phases) - 1):
            builder.add_edge(phases[i]["name"], phases[i+1]["name"])
        builder.add_edge(phases[-1]["name"], END)

        self.graph = builder.compile()
        logger.info("LangGraph pipeline successfully compiled via PaperclipAI")
        return self.graph

    async def invoke(self, initial_state: PipelineState) -> PipelineState:
        """Invoke the configured LangGraph."""
        if not self.graph:
            self.compile()
        return await self.graph.ainvoke(initial_state)

