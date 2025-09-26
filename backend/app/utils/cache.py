"""
缓存工具模块
提供各种缓存功能和工具
"""

from cachetools import cached, TTLCache, LRUCache
import json
from datetime import datetime
from typing import Optional, Dict, Any, List

# 创建缓存实例
# 历史记录缓存：最大1000条记录，每条记录缓存5分钟
history_cache = TTLCache(maxsize=1000, ttl=5)
# 用户会话缓存：最大500条记录，每条记录缓存5分钟
sessions_cache = TTLCache(maxsize=500, ttl=5)

def clear_history_cache(session_id: str, user_id: Optional[str] = None):
    """
    清除历史记录缓存

    Args:
        session_id: 会话ID
        user_id: 可选的用户ID，如果提供则只清除该用户的历史记录缓存
    """
    # 遍历缓存并移除相关项
    keys_to_remove = []
    for key in history_cache.keys():
        if key.startswith(f"history:{session_id}"):
            if user_id is None or key.endswith(f":{user_id}"):
                keys_to_remove.append(key)

    for key in keys_to_remove:
        if key in history_cache:
            del history_cache[key]
    print(f"[DEBUG] 已清除历史记录缓存: session_id={session_id}, user_id={user_id}")

def clear_sessions_cache(user_id: str):
    """
    清除用户会话缓存

    Args:
        user_id: 用户ID
    """
    key = f"sessions:{user_id}"
    if key in sessions_cache:
        del sessions_cache[key]
    print(f"[DEBUG] 已清除用户会话缓存: user_id={user_id}")

def clear_all_history_cache():
    """清除所有历史记录缓存"""
    history_cache.clear()
    print("[DEBUG] 已清除所有历史记录缓存")

def clear_all_sessions_cache():
    """清除所有用户会话缓存"""
    sessions_cache.clear()
    print("[DEBUG] 已清除所有用户会话缓存")

def get_cache_stats():
    """
    获取缓存统计信息

    Returns:
        包含缓存统计信息的字典
    """
    return {
        "history_cache": {
            "size": len(history_cache),
            "maxsize": history_cache.maxsize,
            "ttl": history_cache.ttl,
            "currsize": history_cache.currsize
        },
        "sessions_cache": {
            "size": len(sessions_cache),
            "maxsize": sessions_cache.maxsize,
            "ttl": sessions_cache.ttl,
            "currsize": sessions_cache.currsize
        }
    }
