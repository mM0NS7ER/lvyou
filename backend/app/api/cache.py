
"""
缓存API模块
提供缓存相关的API接口
"""

from fastapi import APIRouter
from app.utils.cache import get_cache_stats

router = APIRouter()

@router.get("/cache/stats")
def get_cache_statistics():
    """
    获取缓存统计信息

    Returns:
        缓存统计信息
    """
    return get_cache_stats()
