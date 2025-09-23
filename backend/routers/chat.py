
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
from services.chat_service import ChatService
from models.chat import ChatRequest, ChatResponse, HealthResponse

router = APIRouter()
chat_service = ChatService()

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    处理用户聊天请求

    Args:
        request: 包含用户消息、会话ID和用户ID的请求

    Returns:
        包含AI回复、会话ID和消息ID的响应
    """
    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    return await chat_service.process_message(request)

@router.get("/api/chat/history")
def get_chat_history(
    session_id: str, 
    user_id: Optional[str] = None, 
    limit: int = Query(50, ge=1, le=100)
):
    """
    获取指定会话的聊天历史记录

    Args:
        session_id: 会话ID
        user_id: 可选的用户ID
        limit: 返回消息数量限制，默认50，最大100

    Returns:
        聊天历史记录列表
    """
    return {"messages": chat_service.get_chat_history(session_id, user_id, limit)}

@router.get("/api/chat/sessions")
def get_user_sessions_endpoint(
    user_id: str, 
    limit: int = Query(20, ge=1, le=100)
):
    """
    获取用户的所有会话

    Args:
        user_id: 用户ID
        limit: 返回会话数量限制，默认20，最大100

    Returns:
        用户会话列表
    """
    return {"sessions": chat_service.get_user_sessions(user_id, limit)}

@router.delete("/api/chat/history")
def delete_chat_history(session_id: str, user_id: Optional[str] = None):
    """
    删除指定会话的聊天记录

    Args:
        session_id: 会话ID
        user_id: 可选的用户ID

    Returns:
        删除的消息数量
    """
    return {"deleted_count": chat_service.delete_chat_history(session_id, user_id)}

@router.delete("/api/chat/sessions/{session_id}")
def delete_session(session_id: str, user_id: Optional[str] = None):
    """
    删除指定会话及其所有聊天记录

    Args:
        session_id: 会话ID
        user_id: 可选的用户ID

    Returns:
        删除的消息数量
    """
    return {"deleted_count": chat_service.delete_chat_history(session_id, user_id)}
