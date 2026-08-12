"""
Shared memory module — Redis-backed knowledge graph helpers for cross-agent communication.
"""

import json
import logging
from typing import Any, Optional

import redis

from dotenv import load_dotenv
import os

load_dotenv()

logger = logging.getLogger("pinnacle.shared_memory")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


def get_redis_client() -> redis.Redis:
    """Get a Redis client connected to the shared memory store."""
    return redis.from_url(REDIS_URL, decode_responses=True)


def write_findings(key: str, data: dict[str, Any], ttl_seconds: int = 86400) -> None:
    """Write agent findings to Redis with a TTL."""
    client = get_redis_client()
    try:
        client.set(key, json.dumps(data, default=str), ex=ttl_seconds)
        logger.info(f"Wrote findings to Redis key: {key}")
    except Exception as e:
        logger.error(f"Failed to write to Redis key {key}: {e}")
    finally:
        client.close()


def read_findings(key: str) -> Optional[dict[str, Any]]:
    """Read agent findings from Redis."""
    client = get_redis_client()
    try:
        raw = client.get(key)
        if raw:
            return json.loads(raw)
        return None
    except Exception as e:
        logger.error(f"Failed to read Redis key {key}: {e}")
        return None
    finally:
        client.close()


def read_all_findings(pattern: str) -> dict[str, Any]:
    """Read all findings matching a Redis key pattern (e.g., 'margin:*')."""
    client = get_redis_client()
    results: dict[str, Any] = {}
    try:
        for key in client.scan_iter(match=pattern):
            raw = client.get(key)
            if raw:
                results[key] = json.loads(raw)
    except Exception as e:
        logger.error(f"Failed to scan Redis pattern {pattern}: {e}")
    finally:
        client.close()
    return results


def publish_event(channel: str, data: dict[str, Any]) -> None:
    """Publish an event to a Redis pub/sub channel."""
    client = get_redis_client()
    try:
        client.publish(channel, json.dumps(data, default=str))
    except Exception as e:
        logger.error(f"Failed to publish to channel {channel}: {e}")
    finally:
        client.close()
