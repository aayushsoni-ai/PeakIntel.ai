"""
Redis tools for LangChain agents — shared memory read/write.
"""

import json
import logging
from typing import Any

from langchain.tools import tool
from shared_memory import write_findings, read_findings, read_all_findings, publish_event

logger = logging.getLogger("pinnacle.tools.redis")


@tool
def store_agent_findings(key: str, data_json: str) -> str:
    """Store agent findings in Redis shared memory.
    key: Redis key (e.g., 'margin:alphatech_saas')
    data_json: JSON string of findings to store"""
    try:
        data = json.loads(data_json)
        write_findings(key, data)
        return json.dumps({"success": True, "key": key})
    except Exception as e:
        return json.dumps({"error": str(e)})


@tool
def read_agent_findings(key: str) -> str:
    """Read agent findings from Redis shared memory.
    key: exact Redis key (e.g., 'margin:alphatech_saas')"""
    result = read_findings(key)
    if result:
        return json.dumps(result, default=str)
    return json.dumps({"error": f"No data found for key: {key}"})


@tool
def read_all_agent_findings(pattern: str) -> str:
    """Read all agent findings matching a Redis key pattern.
    pattern: key pattern with wildcard (e.g., 'margin:*', 'trends:*')"""
    results = read_all_findings(pattern)
    return json.dumps(results, default=str)


@tool
def publish_agent_event(channel: str, message_json: str) -> str:
    """Publish an event to Redis pub/sub for real-time updates.
    channel: e.g., 'agent:progress', 'insights:new'
    message_json: JSON string of event data"""
    try:
        data = json.loads(message_json)
        publish_event(channel, data)
        return json.dumps({"success": True})
    except Exception as e:
        return json.dumps({"error": str(e)})
