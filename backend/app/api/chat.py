


from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Optional
import json
import time
from app.services.chat_service import ChatService
from app.models.chat import ChatRequest, ChatResponse, HealthResponse
from fastapi.responses import StreamingResponse

router = APIRouter()
chat_service = ChatService()

@router.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    处理用户聊天请求（非流式版本）

    Args:
        request: 包含用户消息、会话ID和用户ID的请求

    Returns:
        包含AI回复、会话ID和消息ID的响应
    """
    print(f"[DEBUG] 收到非流式聊天请求，用户ID: {request.user_id}, 会话ID: {request.session_id}")

    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    start_time = time.time()
    result = await chat_service.process_message(request)
    elapsed_time = time.time() - start_time

    print(f"[DEBUG] 非流式聊天请求处理完成，耗时: {elapsed_time:.2f}秒")
    return result

@router.post("/api/chat/stream")
async def chat_stream(request: ChatRequest):
    """
    处理用户聊天请求并返回流式响应

    Args:
        request: 包含用户消息、会话ID和用户ID的请求

    Returns:
        StreamingResponse: 流式响应
    """
    print(f"[DEBUG] 收到流式聊天请求，用户ID: {request.user_id}, 会话ID: {request.session_id}")
    print(f"[DEBUG] 消息内容: {request.message[:100]}...")

    if not request.message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def event_generator():
        try:
            print("[DEBUG] 开始生成流式响应...")
            start_time = time.time()

            # 调用chat_service处理消息并获取流式响应
            chunk_count = 0
            async for chunk in chat_service.process_message_stream(request):
                chunk_count += 1
                print(f"[DEBUG] 发送第 {chunk_count} 个数据块: {chunk['content'][:20]}...")
                # 将每个数据块包装为SSE格式
                yield f"data: {json.dumps({'content': chunk['content'], 'type': 'content'})}\n\n"

            elapsed_time = time.time() - start_time
            print(f"[DEBUG] 流式响应发送完成，共 {chunk_count} 个数据块，耗时: {elapsed_time:.2f}秒")

            # 发送结束信号
            print("[DEBUG] 发送结束信号")
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            print(f"[ERROR] 流式响应生成出错: {str(e)}")
            print(f"[ERROR] 错误类型: {type(e).__name__}")
            import traceback
            print(f"[ERROR] 错误堆栈: {traceback.format_exc()}")
            # 发送错误信号
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )

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
